import { useEffect, useRef, useState } from 'react';
import type { DragEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { chaptersApi } from '@/api/chapters';
import { coursesApi } from '@/api/courses';
import { progressApi } from '@/api/progress';
import { ChapterFileUpload } from '@/components/ChapterFileUpload';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { PlateEditor } from '@/components/PlateEditor';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import {
  Copy,
  Check,
  Clock,
  GripVertical,
  MessageCircle,
  Minus,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/apiError';
import { normalizeMediaUrl } from '@/lib/mediaUrl';
import { formatDuration } from '@/lib/readingTime';
import type { Value } from '@udecode/plate';
import type { Chapter, ChapterType, Course, ChapterFile, CourseProgressReport, User } from '@/types';

const emptyContent: Value = [{ type: 'p', children: [{ text: '' }] }];

const SYLLABUS_REQUIRED_MESSAGE =
  'You must publish a syllabus chapter first before adding readings or assignments.';

function getChapterFormTitle(editing: boolean, chapterType: ChapterType) {
  if (chapterType === 'syllabus') {
    return editing ? 'Edit Syllabus' : 'Add New Syllabus';
  }
  if (editing) {
    return chapterType === 'assignment' ? 'Edit Assignments' : 'Edit Reading';
  }
  return chapterType === 'assignment' ? 'Add New Assignments' : 'Add New Reading';
}

function getChapterSubmitLabel(editing: boolean, saving: boolean, chapterType: ChapterType) {
  if (saving) return 'Saving...';
  if (chapterType === 'syllabus') {
    return editing ? 'Update Syllabus' : 'Add New Syllabus';
  }
  if (editing) {
    return chapterType === 'assignment' ? 'Update Assignments' : 'Update Reading';
  }
  return chapterType === 'assignment' ? 'Add New Assignments' : 'Add New Reading';
}

function isSyllabusRequiredError(error: unknown): boolean {
  if (!axios.isAxiosError(error) || error.response?.status !== 400) return false;
  const data = error.response.data as { error?: string } | undefined;
  return Boolean(data?.error?.toLowerCase().includes('syllabus'));
}

export function InstructorCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'curriculum' | 'progress'>('curriculum');
  const [progressReport, setProgressReport] = useState<CourseProgressReport | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [enrollments, setEnrollments] = useState<
    Array<{ id: number; student: User; enrolled_at: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: emptyContent,
    order: 0,
    is_public: false,
    chapter_type: 'syllabus' as ChapterType,
  });
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [assignment, setAssignment] = useState({
    instructions: '',
    dueDate: '',
  });
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState('');
  const [reordering, setReordering] = useState(false);
  const [draggedChapterId, setDraggedChapterId] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [editingCourseDetails, setEditingCourseDetails] = useState(false);
  const [courseDetailsForm, setCourseDetailsForm] = useState({ title: '', description: '' });
  const [courseDetailsSaving, setCourseDetailsSaving] = useState(false);
  const [courseDetailsError, setCourseDetailsError] = useState('');
  const [courseDetailsSuccess, setCourseDetailsSuccess] = useState('');
  const [highlightChapterId, setHighlightChapterId] = useState<number | null>(null);
  const [scrollToMaterials, setScrollToMaterials] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const chapterFormRef = useRef<HTMLFormElement>(null);
  const materialsRef = useRef<HTMLDivElement>(null);

  const load = async (options?: { silent?: boolean }) => {
    if (!courseId) return;
    if (!options?.silent) setLoading(true);
    try {
      const [courseData, chapterData, enrollmentData] = await Promise.all([
        coursesApi.get(Number(courseId)),
        chaptersApi.list(Number(courseId)),
        coursesApi.enrollments(Number(courseId)),
      ]);
      setCourse(courseData);
      setChapters(chapterData);
      setEnrollments(enrollmentData);
    } finally {
      if (!options?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [courseId]);

  useEffect(() => {
    if (activeTab !== 'progress' || !courseId) return;
    setProgressLoading(true);
    progressApi
      .getCourseReport(Number(courseId))
      .then(setProgressReport)
      .catch(() => setProgressReport(null))
      .finally(() => setProgressLoading(false));
  }, [activeTab, courseId]);

  useEffect(() => {
    if (!showForm) return;
    const id = window.requestAnimationFrame(() => {
      if (scrollToMaterials && materialsRef.current) {
        materialsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setScrollToMaterials(false);
      } else {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return () => window.cancelAnimationFrame(id);
  }, [showForm, scrollToMaterials, editingChapter?.id]);

  useEffect(() => {
    if (!highlightChapterId) return;
    const id = window.requestAnimationFrame(() => {
      document
        .getElementById(`chapter-${highlightChapterId}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    const timer = window.setTimeout(() => setHighlightChapterId(null), 4000);
    return () => {
      window.cancelAnimationFrame(id);
      window.clearTimeout(timer);
    };
  }, [highlightChapterId, chapters]);

  const resetForm = () => {
    setForm({
      title: '',
      content: emptyContent,
      order: chapters.length,
      is_public: false,
      chapter_type: course?.has_syllabus ? 'reading' : 'syllabus',
    });
    setAssignment({ instructions: '', dueDate: '' });
    setAssignmentError('');
    setAssignmentSuccess('');
    setFormError('');
    setFormSuccess('');
    setEditingChapter(null);
    setShowForm(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!courseId) return;
    setFormError('');
    setFormSuccess('');
    setSaving(true);
    try {
      if (editingChapter) {
        await chaptersApi.update(editingChapter.id, {
          title: form.title,
          content: form.content,
          order: form.order,
          chapter_type: form.chapter_type,
        });
        await load({ silent: true });
        const updated = await chaptersApi.get(editingChapter.id);
        setEditingChapter(updated);
        setForm({
          title: updated.title,
          content: updated.content,
          order: updated.order,
          is_public: updated.is_public,
          chapter_type: updated.chapter_type ?? 'reading',
        });
        setAssignment({
          instructions: updated.assignment_instructions ?? '',
          dueDate: updated.due_date ? updated.due_date.slice(0, 16) : '',
        });
        setFormSuccess('Chapter updated.');
      } else {
        const created = await chaptersApi.create({
          title: form.title,
          content: form.content,
          course: Number(courseId),
          order: form.order,
          is_public: form.is_public,
          chapter_type: form.chapter_type,
        });
        if (created.chapter_type === 'syllabus' || created.title.toLowerCase().includes('syllabus')) {
          setCourse((prev) => (prev ? { ...prev, has_syllabus: true } : prev));
        }
        setChapters((prev) =>
          [...prev.filter((ch) => ch.id !== created.id), created].sort((a, b) => a.order - b.order),
        );
        setActiveTab('curriculum');
        setHighlightChapterId(null);

        let chapterForEdit = created;
        try {
          await load({ silent: true });
          chapterForEdit = await chaptersApi.get(created.id);
        } catch {
          // Chapter was saved; still open upload UI with create response.
        }

        setEditingChapter(chapterForEdit);
        setForm({
          title: chapterForEdit.title,
          content: chapterForEdit.content,
          order: chapterForEdit.order,
          is_public: chapterForEdit.is_public,
          chapter_type: chapterForEdit.chapter_type ?? 'reading',
        });
        setAssignment({
          instructions: chapterForEdit.assignment_instructions ?? '',
          dueDate: chapterForEdit.due_date ? chapterForEdit.due_date.slice(0, 16) : '',
        });
        setAssignmentError('');
        setAssignmentSuccess('');
        setShowForm(true);
        setFormSuccess(
          chapterForEdit.chapter_type === 'assignment'
            ? 'Chapter created. Upload materials and add assignment details below.'
            : chapterForEdit.chapter_type === 'syllabus'
              ? 'Syllabus created. Upload your syllabus document below.'
              : 'Chapter created. Upload your reading materials below.',
        );
        setScrollToMaterials(true);
      }
    } catch (err) {
      if (!editingChapter && isSyllabusRequiredError(err)) {
        setShowSyllabusModal(true);
        setFormError('');
        return;
      }
      setFormError(getApiErrorMessage(err, 'Could not save chapter. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const openChapterEditor = (
    chapter: Chapter,
    options?: { focusMaterials?: boolean; successMessage?: string },
  ) => {
    setActiveTab('curriculum');
    setHighlightChapterId(null);
    setEditingChapter(chapter);
    setForm({
      title: chapter.title,
      content: chapter.content,
      order: chapter.order,
      is_public: chapter.is_public,
      chapter_type: chapter.chapter_type ?? 'reading',
    });
    setAssignment({
      instructions: chapter.assignment_instructions ?? '',
      dueDate: chapter.due_date ? chapter.due_date.slice(0, 16) : '',
    });
    setAssignmentError('');
    setAssignmentSuccess('');
    setFormError('');
    setFormSuccess(options?.successMessage ?? '');
    setShowForm(true);
    if (options?.focusMaterials) {
      setScrollToMaterials(true);
    }
  };

  const handleEdit = (chapter: Chapter) => {
    openChapterEditor(chapter);
  };

  const handleAddMaterials = (chapter: Chapter) => {
    const chapterType = chapter.chapter_type ?? 'reading';
    openChapterEditor(chapter, {
      focusMaterials: true,
      successMessage:
        chapterType === 'assignment'
          ? 'Upload assignment materials below.'
          : chapterType === 'syllabus'
            ? 'Upload your syllabus document below.'
            : 'Upload your reading materials below.',
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this chapter?')) return;
    await chaptersApi.delete(id);
    await load();
  };

  const applyChapterVisibility = (updated: Chapter) => {
    setChapters((prev) => prev.map((ch) => (ch.id === updated.id ? updated : ch)));
    setEditingChapter((prev) => {
      if (prev?.id === updated.id) {
        setForm((formPrev) => ({ ...formPrev, is_public: updated.is_public }));
        return updated;
      }
      return prev;
    });
  };

  const handleSetVisibility = async (id: number, isPublic: boolean) => {
    const updated = await chaptersApi.setVisibility(id, isPublic);
    applyChapterVisibility(updated);
  };

  const handleToggleVisibility = async (id: number, currentlyPublic: boolean) => {
    await handleSetVisibility(id, !currentlyPublic);
  };

  const handleVisibilityCheckboxChange = async (checked: boolean) => {
    setForm((prev) => ({ ...prev, is_public: checked }));
    if (!editingChapter) return;
    try {
      const updated = await chaptersApi.setVisibility(editingChapter.id, checked);
      applyChapterVisibility(updated);
    } catch (err) {
      setForm((prev) => ({ ...prev, is_public: !checked }));
      setFormError(getApiErrorMessage(err, 'Could not update chapter visibility.'));
    }
  };

  const handleCopyCode = async () => {
    if (!course?.access_code) return;
    await navigator.clipboard.writeText(course.access_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartEditCourseDetails = () => {
    if (!course) return;
    setCourseDetailsForm({ title: course.title, description: course.description });
    setCourseDetailsError('');
    setCourseDetailsSuccess('');
    setEditingCourseDetails(true);
  };

  const handleCancelCourseDetails = () => {
    setEditingCourseDetails(false);
    setCourseDetailsError('');
  };

  const handleSaveCourseDetails = async () => {
    if (!courseId) return;
    const title = courseDetailsForm.title.trim();
    const description = courseDetailsForm.description.trim();
    if (!title) {
      setCourseDetailsError('Course title is required.');
      return;
    }

    setCourseDetailsSaving(true);
    setCourseDetailsError('');
    setCourseDetailsSuccess('');
    try {
      const updated = await coursesApi.update(Number(courseId), { title, description });
      setCourse(updated);
      setEditingCourseDetails(false);
      setCourseDetailsSuccess('Course details updated.');
      window.setTimeout(() => setCourseDetailsSuccess(''), 3000);
    } catch (err) {
      setCourseDetailsError(getApiErrorMessage(err, 'Could not update course details.'));
    } finally {
      setCourseDetailsSaving(false);
    }
  };

  const handleFileUploaded = (file: ChapterFile) => {
    setEditingChapter((prev) =>
      prev ? { ...prev, files: [...(prev.files ?? []), file] } : prev,
    );
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === file.chapter ? { ...ch, files: [...(ch.files ?? []), file] } : ch,
      ),
    );
  };

  const handleFileDeleted = (fileId: number) => {
    setEditingChapter((prev) => {
      if (!prev) return prev;
      const chapterId = prev.id;
      setChapters((chapters) =>
        chapters.map((ch) =>
          ch.id === chapterId
            ? { ...ch, files: (ch.files ?? []).filter((f) => f.id !== fileId) }
            : ch,
        ),
      );
      return { ...prev, files: (prev.files ?? []).filter((f) => f.id !== fileId) };
    });
  };

  const handleSaveAssignment = async () => {
    if (!editingChapter) return;
    setAssignmentSaving(true);
    setAssignmentError('');
    setAssignmentSuccess('');
    try {
      const updated = await chaptersApi.update(editingChapter.id, {
        assignment_instructions: assignment.instructions,
        due_date: assignment.dueDate ? new Date(assignment.dueDate).toISOString() : null,
      });
      setEditingChapter(updated);
      setChapters((prev) => prev.map((ch) => (ch.id === updated.id ? updated : ch)));
      setAssignmentSuccess('Assignment saved.');
    } catch (err) {
      setAssignmentError(getApiErrorMessage(err, 'Could not save assignment.'));
    } finally {
      setAssignmentSaving(false);
    }
  };

  const persistChapterOrder = async (orderedChapters: Chapter[]) => {
    const normalized = orderedChapters.map((chapter, index) => ({ ...chapter, order: index }));
    setChapters(normalized);
    setReordering(true);
    try {
      await Promise.all(
        normalized.map((chapter, index) => chaptersApi.update(chapter.id, { order: index })),
      );
    } catch {
      await load({ silent: true });
    } finally {
      setReordering(false);
    }
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, chapterId: number) => {
    setDraggedChapterId(chapterId);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(chapterId));
  };

  const handleDragEnd = () => {
    setDraggedChapterId(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, index: number) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, dropIndex: number) => {
    event.preventDefault();
    const dragId = draggedChapterId ?? Number(event.dataTransfer.getData('text/plain'));
    const fromIndex = chapters.findIndex((chapter) => chapter.id === dragId);
    if (fromIndex < 0 || fromIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    const reordered = [...chapters];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(dropIndex, 0, moved);
    void persistChapterOrder(reordered);
    handleDragEnd();
  };

  const handleOpenNewChapter = (chapterType: ChapterType = 'reading') => {
    setActiveTab('curriculum');
    setHighlightChapterId(null);
    setEditingChapter(null);
    setForm({
      title: '',
      content: emptyContent,
      order: chapters.length,
      is_public: false,
      chapter_type: chapterType,
    });
    setAssignment({ instructions: '', dueDate: '' });
    setAssignmentError('');
    setAssignmentSuccess('');
    setShowForm(true);
    setFormError('');
    setFormSuccess('');
  };

  if (loading) {
    return (
      <>
        <InstructorHeader title="Loading..." />
        <main className="flex-1 p-6"><p className="text-[#6b5c52]">Loading course...</p></main>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <InstructorHeader title="Not found" />
        <main className="flex-1 p-6"><p>Course not found.</p></main>
      </>
    );
  }

  return (
    <>
      <InstructorHeader
        breadcrumbs={[
          { label: 'Dashboard', to: '/instructor' },
          { label: 'My Courses', to: '/instructor/courses' },
          { label: course.title },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            {!course.has_syllabus ? (
              <Button
                size="sm"
                className="ghibli-gradient-primary hover:brightness-95"
                onClick={() => handleOpenNewChapter('syllabus')}
              >
                <Plus className="mr-1 h-4 w-4" /> Add Syllabus
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="hover:border-[#c2622a]/40"
                  onClick={() => handleOpenNewChapter('reading')}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add New Reading
                </Button>
                <Button
                  size="sm"
                  className="ghibli-gradient-primary hover:brightness-95"
                  onClick={() => handleOpenNewChapter('assignment')}
                >
                  <Plus className="mr-1 h-4 w-4" /> Add New Assignments
                </Button>
              </>
            )}
          </div>
        }
      />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {!course.has_syllabus && (
            <div className="rounded-2xl border border-[#c2622a]/30 bg-[#c2622a]/10 px-5 py-4 text-[#2c1810] shadow-sm">
              <p className="font-semibold">Start by publishing your course syllabus</p>
              <p className="mt-1 text-sm text-[#6b5c52]">
                Add a syllabus chapter before creating readings or assignments for this course.
              </p>
              <Button
                type="button"
                size="sm"
                className="mt-3 ghibli-gradient-primary hover:brightness-95"
                onClick={() => handleOpenNewChapter('syllabus')}
              >
                <Plus className="mr-1 h-4 w-4" /> Add Syllabus
              </Button>
            </div>
          )}

          {/* Course hero */}
          <div
            className={cn(
              'ghibli-hero-motif relative overflow-hidden rounded-2xl p-6 text-white shadow-lg md:p-8',
              !course.thumbnail_url && 'ghibli-gradient-hero',
            )}
            style={
              course.thumbnail_url
                ? {
                    backgroundImage: `url(${normalizeMediaUrl(course.thumbnail_url)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : undefined
            }
          >
            {course.thumbnail_url && <div className="absolute inset-0 bg-[#c2622a]/20" aria-hidden />}
            <div className="relative flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <Badge className="bg-white/20 text-white">CURRENT COURSE</Badge>
                {editingCourseDetails ? (
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/85">Course title</label>
                      <Input
                        value={courseDetailsForm.title}
                        onChange={(e) =>
                          setCourseDetailsForm((prev) => ({ ...prev, title: e.target.value }))
                        }
                        className="border-white/30 bg-white/95 text-[#2c1810]"
                        placeholder="Course title"
                        disabled={courseDetailsSaving}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/85">Description</label>
                      <Textarea
                        value={courseDetailsForm.description}
                        onChange={(e) =>
                          setCourseDetailsForm((prev) => ({ ...prev, description: e.target.value }))
                        }
                        className="min-h-[100px] border-white/30 bg-white/95 text-[#2c1810]"
                        placeholder="Course description"
                        disabled={courseDetailsSaving}
                      />
                    </div>
                    {courseDetailsError && (
                      <p className="text-sm text-red-200">{courseDetailsError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        className="ghibli-gradient-primary hover:brightness-95"
                        onClick={handleSaveCourseDetails}
                        disabled={courseDetailsSaving}
                      >
                        {courseDetailsSaving ? 'Saving...' : 'Save changes'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                        onClick={handleCancelCourseDetails}
                        disabled={courseDetailsSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 flex items-start gap-2">
                      <h1 className="font-serif text-2xl font-bold md:text-3xl">{course.title}</h1>
                      <button
                        type="button"
                        onClick={handleStartEditCourseDetails}
                        className="mt-1 rounded-lg p-1.5 text-white/85 hover:bg-white/15 hover:text-white"
                        aria-label="Edit course title and description"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-white/85">{course.description}</p>
                    {courseDetailsSuccess && (
                      <p className="mt-2 text-sm text-white/90">{courseDetailsSuccess}</p>
                    )}
                  </>
                )}
                {course.access_code && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#c2622a]/40 bg-[#faf6f1]/10 px-4 py-2">
                    <span className="text-xs text-white/85">Access code:</span>
                    <span className="font-mono font-bold tracking-widest text-white">{course.access_code}</span>
                    <button type="button" onClick={handleCopyCode} className="rounded-full ghibli-gradient-primary p-1.5 text-white hover:brightness-95">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
                  <p className="text-2xl font-bold">{enrollments.length}</p>
                  <p className="text-xs text-white/85">Students</p>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
                  <p className="text-2xl font-bold">{chapters.length}</p>
                  <p className="text-xs text-white/85">Chapters</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-b border-[#e8ddd0]">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('curriculum')}
                className={`border-b-2 px-4 py-2 text-sm font-medium ${
                  activeTab === 'curriculum'
                    ? 'border-[#c2622a] text-[#c2622a]'
                    : 'border-transparent text-[#6b5c52] hover:text-[#2c1810]'
                }`}
              >
                Curriculum
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('progress')}
                className={`border-b-2 px-4 py-2 text-sm font-medium ${
                  activeTab === 'progress'
                    ? 'border-[#c2622a] text-[#c2622a]'
                    : 'border-transparent text-[#6b5c52] hover:text-[#2c1810]'
                }`}
              >
                Student Progress
              </button>
            </div>
            <div className="mb-1 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="hover:border-[#c2622a]/40"
                onClick={() => handleOpenNewChapter('reading')}
              >
                <Plus className="mr-1 h-4 w-4" /> Add New Reading
              </Button>
              <Button
                size="sm"
                className="rounded-full ghibli-gradient-primary hover:brightness-95"
                onClick={() => handleOpenNewChapter('assignment')}
              >
                <Plus className="mr-1 h-4 w-4" /> Add New Assignments
              </Button>
            </div>
          </div>

          {showForm && (
            <div ref={formRef} className="scroll-mt-6">
              <Card className="mb-6 border-[#c2622a]/30 shadow-md ring-1 ring-[#c2622a]/10">
                <CardTitle>{getChapterFormTitle(!!editingChapter, form.chapter_type)}</CardTitle>
                <form ref={chapterFormRef} onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, chapter_type: 'syllabus' }))}
                        className={cn(
                          'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
                          form.chapter_type === 'syllabus'
                            ? 'ghibli-gradient-primary text-white shadow-sm'
                            : 'border border-[#e8ddd0] bg-white text-[#6b5c52] hover:border-[#c2622a]/40 hover:text-[#2c1810]',
                        )}
                      >
                        📋 Syllabus
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, chapter_type: 'reading' }))}
                        className={cn(
                          'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
                          form.chapter_type === 'reading'
                            ? 'ghibli-gradient-primary text-white shadow-sm'
                            : 'border border-[#e8ddd0] bg-white text-[#6b5c52] hover:border-[#c2622a]/40 hover:text-[#2c1810]',
                        )}
                      >
                        📖 Reading
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, chapter_type: 'assignment' }))}
                        className={cn(
                          'rounded-full px-5 py-2.5 text-sm font-semibold transition-colors',
                          form.chapter_type === 'assignment'
                            ? 'ghibli-gradient-primary text-white shadow-sm'
                            : 'border border-[#e8ddd0] bg-white text-[#6b5c52] hover:border-[#c2622a]/40 hover:text-[#2c1810]',
                        )}
                      >
                        📝 Assignment
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Title</label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="is_public"
                      type="checkbox"
                      checked={form.is_public}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        if (editingChapter) {
                          void handleVisibilityCheckboxChange(checked);
                        } else {
                          setForm((prev) => ({ ...prev, is_public: checked }));
                        }
                      }}
                    />
                    <label htmlFor="is_public" className="text-sm">
                      Public (visible to enrolled students)
                      {editingChapter && (
                        <span className="ml-1 text-xs text-[#6b5c52]">· saves immediately</span>
                      )}
                    </label>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Content</label>
                    <PlateEditor
                      editorKey={editingChapter?.id ?? 'new'}
                      value={form.content}
                      onChange={(content) => setForm({ ...form, content })}
                    />
                  </div>

                  <div ref={materialsRef} className="border-t border-[#e8ddd0] pt-6 scroll-mt-24">
                    <CardTitle className="text-base">
                      {form.chapter_type === 'assignment'
                        ? 'Assignment & Materials'
                        : form.chapter_type === 'syllabus'
                          ? 'Syllabus Materials'
                          : 'Reading Materials'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {form.chapter_type === 'assignment'
                        ? 'Upload materials, instructions, and a due date for students.'
                        : form.chapter_type === 'syllabus'
                          ? 'Upload your syllabus document or supporting files for students.'
                          : 'Upload reading materials for students.'}
                    </CardDescription>
                    {editingChapter ? (
                      <div className="mt-4 space-y-4">
                        <ChapterFileUpload
                          chapterId={editingChapter.id}
                          files={editingChapter.files ?? []}
                          onFileUploaded={handleFileUploaded}
                          onFileDeleted={handleFileDeleted}
                          label="Upload Reading Materials"
                        />
                        {form.chapter_type === 'assignment' && (
                          <>
                            <div>
                              <label className="mb-1 block text-sm font-medium">Assignment Instructions</label>
                              <Textarea
                                value={assignment.instructions}
                                onChange={(e) => setAssignment({ ...assignment, instructions: e.target.value })}
                                placeholder="e.g. Read pages 1–20 and answer the review questions"
                                className="min-h-24"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#c2622a]">
                                Due Date
                              </label>
                              <input
                                type="datetime-local"
                                value={assignment.dueDate}
                                onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })}
                                className="w-full rounded-xl border border-[#e8ddd0] bg-[#faf6f1] px-4 py-3 text-[#2c1810] outline-none accent-[#c2622a] focus:border-[#c2622a]"
                              />
                            </div>
                            <Button
                              type="button"
                              className="ghibli-gradient-primary hover:brightness-95"
                              disabled={assignmentSaving}
                              onClick={handleSaveAssignment}
                            >
                              {assignmentSaving ? 'Saving...' : 'Save Assignment'}
                            </Button>
                            {assignmentError && <p className="text-sm text-destructive">{assignmentError}</p>}
                            {assignmentSuccess && <p className="text-sm text-[#5a8a5a]">{assignmentSuccess}</p>}
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-dashed border-[#c2622a]/30 bg-[#faf6f1] px-4 py-4 text-sm text-[#6b5c52]">
                        <p>
                          Save this chapter first, then you can upload your PDF or document here.
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          className="mt-3 ghibli-gradient-primary hover:brightness-95"
                          disabled={saving || !form.title.trim()}
                          onClick={() => {
                            chapterFormRef.current?.requestSubmit();
                          }}
                        >
                          <Upload className="mr-1 h-4 w-4" />
                          Save & upload materials
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={saving}>
                      {getChapterSubmitLabel(!!editingChapter, saving, form.chapter_type)}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      {editingChapter ? 'Close' : 'Cancel'}
                    </Button>
                  </div>
                  {formError && <p className="text-sm text-destructive">{formError}</p>}
                  {formSuccess && <p className="text-sm text-[#5a8a5a]">{formSuccess}</p>}
                </form>
              </Card>
            </div>
          )}

          {activeTab === 'progress' && (
            <Card className="border-[#e8ddd0] shadow-sm">
              <CardTitle>Student Progress</CardTitle>
              <CardDescription className="mt-1">
                Reading progress for each enrolled student across public chapters.
              </CardDescription>
              {progressLoading ? (
                <p className="mt-4 text-sm text-[#6b5c52]">Loading progress...</p>
              ) : !progressReport || progressReport.students.length === 0 ? (
                <p className="mt-4 text-sm text-[#6b5c52]">No enrolled students yet.</p>
              ) : progressReport.chapters.length === 0 ? (
                <p className="mt-4 text-sm text-[#6b5c52]">No public chapters to track.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e8ddd0]">
                        <th className="px-3 py-2 font-semibold text-[#2c1810]">Student</th>
                        {progressReport.chapters.map((ch) => (
                          <th key={ch.id} className="px-3 py-2 font-semibold text-[#2c1810]">
                            {ch.title}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {progressReport.students.map((student) => (
                        <tr key={student.id} className="border-b border-[#e8ddd0] even:bg-[#faf6f1]/50">
                          <td className="px-3 py-2 font-medium">{student.username}</td>
                          {progressReport.chapters.map((ch) => {
                            const record = progressReport.progress.find(
                              (p) => p.student_id === student.id && p.chapter_id === ch.id,
                            );
                            let cell = '—';
                            let className = 'text-[#6b5c52]';
                            if (record?.is_read) {
                              cell = '✓';
                              className = 'font-bold text-[#5a8a5a]';
                            } else if (record && record.time_spent_seconds > 0) {
                              cell = formatDuration(record.time_spent_seconds);
                              className = 'font-medium text-[#d4845a]';
                            }
                            return (
                              <td key={ch.id} className={`px-3 py-2 text-center ${className}`}>
                                {cell}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 flex flex-wrap items-center gap-5 rounded-xl border border-[#e8ddd0] bg-[#faf6f1]/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-[#5a8a5a]/15 text-sm font-bold text-[#5a8a5a]">
                          ✓
                        </span>
                        <span className="text-sm text-[#2c1810]">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 items-center gap-1 rounded-md bg-[#d4845a]/15 px-2 text-sm font-medium text-[#c2622a]">
                          <Clock className="h-3.5 w-3.5" aria-hidden />
                          2m 30s
                        </span>
                        <span className="text-sm text-[#2c1810]">In progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md bg-white text-[#6b5c52] ring-1 ring-[#e8ddd0]">
                          <Minus className="h-4 w-4" aria-hidden />
                        </span>
                        <span className="text-sm text-[#2c1810]">Not started</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {activeTab === 'curriculum' && (
          <>
          {/* Curriculum section */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-[#2c1810]">Course Curriculum</h2>
              <p className="text-sm text-[#6b5c52]">
                Manage chapters, content, and file uploads. Drag the grip handle to reorder. Any number of chapters can be public at the same time.
              </p>
            </div>

        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <Card
              key={chapter.id}
              id={`chapter-${chapter.id}`}
              className={cn(
                'border-[#e8ddd0] border-l-4 border-l-[#c2622a] shadow-sm transition-all duration-200 hover:border-[#c2622a]/60 hover:shadow-md',
                highlightChapterId === chapter.id && 'border-[#5a8a5a] ring-2 ring-[#5a8a5a]/35',
                draggedChapterId === chapter.id && 'opacity-50',
                dragOverIndex === index &&
                  draggedChapterId !== chapter.id &&
                  'border-[#c2622a] ring-2 ring-[#c2622a]/25',
              )}
              onDragOver={(event) => handleDragOver(event, index)}
              onDrop={(event) => handleDrop(event, index)}
            >
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  draggable={!reordering}
                  disabled={reordering}
                  onDragStart={(event) => handleDragStart(event, chapter.id)}
                  onDragEnd={handleDragEnd}
                  className="shrink-0 rounded p-1 text-[#6b5c52] hover:bg-[#faf6f1] disabled:cursor-not-allowed disabled:opacity-50 cursor-grab active:cursor-grabbing"
                  aria-label={`Drag to reorder ${chapter.title}`}
                  title="Drag to reorder"
                >
                  <GripVertical className="h-5 w-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-[#faf6f1] text-[#6b5c52]">CH {String(index + 1).padStart(2, '0')}</Badge>
                    <CardTitle className="text-base font-semibold">{chapter.title}</CardTitle>
                    {(chapter.chapter_type ?? 'reading') === 'assignment' ? (
                      <Badge className="bg-[#c2622a]/10 text-[#c2622a]">📝 Assignment</Badge>
                    ) : (chapter.chapter_type ?? 'reading') === 'syllabus' ? (
                      <Badge className="bg-amber-100 text-amber-800">📋 Syllabus</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700">📖 Reading</Badge>
                    )}
                  </div>
                  <CardDescription className="mt-1 text-[#6b5c52]">
                    Chapter {String(index + 1).padStart(2, '0')}
                    {(chapter.files?.length ?? 0) > 0 &&
                      ` · ${chapter.files!.length} resource${chapter.files!.length === 1 ? '' : 's'}`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-[#6b5c52]">Visibility</p>
                    <button
                      type="button"
                      onClick={() => void handleToggleVisibility(chapter.id, chapter.is_public)}
                      title={
                        chapter.is_public
                          ? 'Click to set as draft'
                          : 'Click to publish to students'
                      }
                      className={`mt-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                        chapter.is_public
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-[#e8ddd0] text-[#6b5c52] hover:bg-[#d4845a]/15 hover:text-[#2c1810]'
                      }`}
                    >
                      {chapter.is_public ? 'PUBLIC' : 'DRAFT'}
                    </button>
                  </div>
                <div className="flex items-center gap-2">
                  {(chapter.files?.length ?? 0) === 0 && (
                    <Button
                      size="sm"
                      className="ghibli-gradient-primary hover:brightness-95"
                      onClick={() => handleAddMaterials(chapter)}
                    >
                      <Upload className="mr-1 h-3.5 w-3.5" />
                      Add materials
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleEdit(chapter)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(chapter.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
                </div>
              </div>
            </Card>
          ))}
          {chapters.length === 0 && !showForm && (
            <Card className="border-dashed border-[#e8ddd0] py-12 text-center">
              <CardDescription>
                {course.has_syllabus
                  ? 'No chapters yet. Click "Add New Reading" or "Add New Assignments" to get started.'
                  : 'No chapters yet. Start by adding your course syllabus.'}
              </CardDescription>
            </Card>
          )}
        </div>
          </section>

          {/* Bottom widgets */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-[#e8ddd0] shadow-sm">
              <CardTitle>Course Settings</CardTitle>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-[#e8ddd0] p-3">
                  <div>
                    <p className="font-medium text-sm">Access Code</p>
                    <p className="text-xs text-[#6b5c52]">Share with students to join</p>
                  </div>
                  <span className="font-mono text-sm font-bold">{course.access_code}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-[#e8ddd0] p-3">
                  <div>
                    <p className="font-medium text-sm">Public Chapters</p>
                    <p className="text-xs text-[#6b5c52]">Visible to enrolled students</p>
                  </div>
                  <span className="text-sm font-bold">{chapters.filter((c) => c.is_public).length}</span>
                </div>
              </div>
            </Card>

            <Card className="border-[#e8ddd0] shadow-sm">
              <CardTitle>Enrolled Students ({enrollments.length})</CardTitle>
              {enrollments.length === 0 ? (
                <CardDescription className="mt-2">No students enrolled yet.</CardDescription>
              ) : (
                <div className="mt-4 space-y-2">
                  {enrollments.map((enrollment) => (
                    <div key={enrollment.id} className="flex items-center gap-3 rounded-lg border border-[#e8ddd0] p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c2622a]/15 text-xs font-bold text-[#c2622a]">
                        {enrollment.student.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{enrollment.student.username}</p>
                        <p className="text-xs text-[#6b5c52]">{enrollment.student.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/instructor/messages?user=${enrollment.student.id}`)}
                      >
                        <MessageCircle className="mr-1 h-3.5 w-3.5" /> Message
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          </>
          )}
        </div>
      </main>

      {showSyllabusModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c1810]/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="syllabus-required-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-[#e8ddd0] bg-[#faf6f1] p-6 shadow-xl">
            <h2 id="syllabus-required-title" className="font-serif text-xl font-semibold text-[#2c1810]">
              Syllabus required
            </h2>
            <p className="mt-3 text-sm text-[#6b5c52]">
              Please create and publish your Syllabus first before adding course content.
            </p>
            <p className="mt-2 text-xs text-[#6b5c52]">{SYLLABUS_REQUIRED_MESSAGE}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                type="button"
                className="ghibli-gradient-primary hover:brightness-95"
                onClick={() => {
                  setShowSyllabusModal(false);
                  handleOpenNewChapter('syllabus');
                }}
              >
                Add Syllabus
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowSyllabusModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
