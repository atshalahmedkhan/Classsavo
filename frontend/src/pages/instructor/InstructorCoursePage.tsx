import { useEffect, useState } from 'react';
import type { DragEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { Copy, Check, Clock, GripVertical, MessageCircle, Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/apiError';
import { formatDuration } from '@/lib/readingTime';
import type { Value } from '@udecode/plate';
import type { Chapter, Course, ChapterFile, CourseProgressReport, User } from '@/types';

const emptyContent: Value = [{ type: 'p', children: [{ text: '' }] }];

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
  });
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

  const resetForm = () => {
    setForm({ title: '', content: emptyContent, order: chapters.length, is_public: false });
    setAssignment({ instructions: '', dueDate: '' });
    setAssignmentError('');
    setAssignmentSuccess('');
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
        });
        await load({ silent: true });
        const updated = await chaptersApi.get(editingChapter.id);
        setEditingChapter(updated);
        setForm({
          title: updated.title,
          content: updated.content,
          order: updated.order,
          is_public: updated.is_public,
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
        });
        await load({ silent: true });
        setEditingChapter(created);
        setForm({
          title: created.title,
          content: created.content,
          order: created.order,
          is_public: created.is_public,
        });
        setAssignment({ instructions: '', dueDate: '' });
        setShowForm(true);
        setFormSuccess('Chapter created. You can now add assignments below.');
      }
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Could not save chapter. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setForm({
      title: chapter.title,
      content: chapter.content,
      order: chapter.order,
      is_public: chapter.is_public,
    });
    setAssignment({
      instructions: chapter.assignment_instructions ?? '',
      dueDate: chapter.due_date ? chapter.due_date.slice(0, 16) : '',
    });
    setAssignmentError('');
    setAssignmentSuccess('');
    setShowForm(true);
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
          <Button
            size="sm"
            className="ghibli-gradient-primary hover:brightness-95"
            onClick={() => {
              setEditingChapter(null);
              setForm({ title: '', content: emptyContent, order: chapters.length, is_public: false });
              setAssignment({ instructions: '', dueDate: '' });
              setAssignmentError('');
              setAssignmentSuccess('');
              setShowForm(true);
              setFormError('');
              setFormSuccess('');
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add New Chapter
          </Button>
        }
      />
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* Course hero */}
          <div className="ghibli-hero-motif overflow-hidden rounded-2xl ghibli-gradient-hero p-6 text-white shadow-lg md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <Badge className="bg-white/20 text-white">CURRENT COURSE</Badge>
                <h1 className="mt-3 font-serif text-2xl font-bold md:text-3xl">{course.title}</h1>
                <p className="mt-2 text-white/85">{course.description}</p>
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

          <div className="flex gap-2 border-b border-[#e8ddd0]">
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

        {showForm && (
          <Card className="mb-6 border-[#e8ddd0] shadow-sm">
            <CardTitle>{editingChapter ? 'Edit Chapter' : 'New Chapter'}</CardTitle>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
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

              <div className="border-t border-[#e8ddd0] pt-6">
                <CardTitle className="text-base">Assignment</CardTitle>
                <CardDescription className="mt-1">
                  Upload reading materials and set instructions for students.
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
                      <label className="mb-1 block text-sm font-medium">Due Date</label>
                      <Input
                        type="datetime-local"
                        value={assignment.dueDate}
                        onChange={(e) => setAssignment({ ...assignment, dueDate: e.target.value })}
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
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    Save the chapter first (click <strong>Create</strong>), then you can add assignments
                    and upload reading materials.
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingChapter ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
              {formError && <p className="text-sm text-destructive">{formError}</p>}
              {formSuccess && <p className="text-sm text-[#5a8a5a]">{formSuccess}</p>}
            </form>
          </Card>
        )}

        <div className="space-y-3">
          {chapters.map((chapter, index) => (
            <Card
              key={chapter.id}
              className={cn(
                'border-[#e8ddd0] shadow-sm transition-all',
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
                    <CardTitle className="text-base">{chapter.title}</CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    Order {chapter.order}
                    {(chapter.files?.length ?? 0) > 0 && ` · ${chapter.files!.length} resources`}
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
                          ? 'bg-[#d4845a]/20 text-[#c2622a] hover:bg-[#d4845a]/30'
                          : 'bg-[#faf6f1] text-[#6b5c52] hover:bg-[#d4845a]/10 hover:text-[#c2622a]'
                      }`}
                    >
                      {chapter.is_public ? 'PUBLIC' : 'DRAFT'}
                    </button>
                  </div>
                <div className="flex items-center gap-2">
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
              <CardDescription>No chapters yet. Click &quot;Add New Chapter&quot; to get started.</CardDescription>
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
    </>
  );
}
