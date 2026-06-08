import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, ClipboardList, Download, FileText, Loader2, Upload } from 'lucide-react';
import client from '@/api/client';
import { chaptersApi } from '@/api/chapters';
import { coursesApi } from '@/api/courses';
import { AIChatPanel } from '@/components/AIChatPanel';
import { CourseMaterialPanel } from '@/components/CourseMaterialPanel';
import { DueDateBadge } from '@/components/DueDateBadge';
import { StartCourseCard } from '@/components/student/StartCourseCard';
import { StudentHeader } from '@/components/student/StudentHeader';
import { PlateViewer } from '@/components/PlateViewer';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { useChapterReadingTimer } from '@/hooks/useChapterReadingTimer';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { getApiErrorMessage } from '@/lib/apiError';
import { isSyllabusChapter, partitionChapters } from '@/lib/chapterUtils';
import { normalizeMediaUrl } from '@/lib/mediaUrl';
import { formatDuration } from '@/lib/readingTime';
import type { Chapter, FirstChapter, User } from '@/types';

interface AssignmentSubmission {
  id: number;
  student: User;
  chapter: number;
  submitted_image_url: string | null;
  annotated_image_url: string | null;
  submitted_at: string;
  instructor_remarks: string;
  score: number | null;
  status: 'submitted' | 'reviewed';
  returned_at: string | null;
}

const SUBMISSION_ACCEPT = '.pdf,.jpg,.jpeg,.png';
const SUBMISSION_ALLOWED = new Set(['.pdf', '.jpg', '.jpeg', '.png']);

function getFileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot >= 0 ? filename.slice(dot).toLowerCase() : '';
}

function formatSubmissionTimestamp(iso: string): string {
  const formatted = new Date(iso).toLocaleString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  return formatted;
}

function isPdfUrl(url: string): boolean {
  const path = url.split('?')[0].toLowerCase();
  return path.endsWith('.pdf');
}

export function ChapterReaderPage() {
  const { courseId, chapterId } = useParams();
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [firstChapter, setFirstChapter] = useState<FirstChapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { getChapterProgress, refresh: refreshProgress } = useStudentProgress();

  const chapterProgress = chapter ? getChapterProgress(chapter.id) : undefined;

  const handleProgressUpdate = useCallback(() => {
    refreshProgress();
  }, [refreshProgress]);

  const { isRead, progressPercent, isPaused, isIdle, activeSeconds, requiredSeconds } =
    useChapterReadingTimer({
      chapterId: Number(chapterId),
      content: chapter?.content ?? [],
      contentAreaRef,
      initialTimeSpent: chapterProgress?.time_spent_seconds ?? 0,
      initialIsRead: chapterProgress?.is_read ?? false,
      enabled: !!chapter,
      onProgressUpdate: handleProgressUpdate,
    });

  useEffect(() => {
    const load = async () => {
      if (!chapterId || !courseId) return;
      setLoading(true);
      setFirstChapter(null);
      try {
        const [chapterData, chapterList] = await Promise.all([
          chaptersApi.get(Number(chapterId)),
          chaptersApi.list(Number(courseId)),
        ]);
        setChapter(chapterData);
        setChapters(chapterList);

        if ((chapterData.chapter_type ?? 'reading') === 'syllabus') {
          try {
            const nextChapter = await coursesApi.getFirstChapter(Number(courseId));
            setFirstChapter(nextChapter);
          } catch {
            setFirstChapter(null);
          }
        }
      } catch {
        setError('Unable to load this chapter. It may be private or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chapterId, courseId]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const loadSubmission = async () => {
      if (!chapterId || !chapter || (chapter.chapter_type ?? 'reading') !== 'assignment') {
        setSubmission(null);
        return;
      }
      setSubmissionLoading(true);
      try {
        const { data } = await client.get<AssignmentSubmission>(
          `/chapters/${chapterId}/my-submission/`,
        );
        setSubmission(data);
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          setSubmission(null);
        }
      } finally {
        setSubmissionLoading(false);
      }
    };
    void loadSubmission();
  }, [chapterId, chapter]);

  const handleFileSelect = (file: File) => {
    const extension = getFileExtension(file.name);
    if (!SUBMISSION_ALLOWED.has(extension)) {
      setSubmissionError('Please upload a PDF or image file (JPG, PNG) only');
      return;
    }
    setSubmissionError('');
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (extension === '.pdf') {
      setPreviewUrl(null);
    } else {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmitAssignment = async () => {
    if (!selectedFile || !chapterId) return;
    setUploading(true);
    setSubmissionError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const { data } = await client.post<AssignmentSubmission>(
        `/chapters/${chapterId}/submit/`,
        formData,
      );
      setSubmission(data);
      setSelectedFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (err) {
      setSubmissionError(getApiErrorMessage(err, 'Could not submit assignment.'));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <>
        <StudentHeader title="Loading..." />
        <main className="flex-1 p-6"><p className="text-[#6b5c52]">Loading chapter...</p></main>
      </>
    );
  }

  if (error || !chapter) {
    return (
      <>
        <StudentHeader title="Chapter" />
        <main className="flex-1 p-6">
          <p className="text-destructive">{error || 'Chapter not found.'}</p>
          <Link to={`/student/courses/${courseId}`} className="text-[#c2622a] hover:underline">
            Back to course
          </Link>
        </main>
      </>
    );
  }

  const files = chapter.files ?? [];
  const { syllabusChapters, contentChapters } = partitionChapters(chapters);
  const isSyllabus = isSyllabusChapter(chapter);
  const isAssignmentChapter = (chapter.chapter_type ?? 'reading') === 'assignment';
  const hasInstructions = Boolean(chapter.assignment_instructions?.trim());
  const hasDueDate = Boolean(chapter.due_date);

  return (
    <>
      <StudentHeader
        title={chapter.title}
        subtitle={isSyllabus ? 'Course syllabus' : 'Chapter content and assignments'}
      />
      <main className="flex-1 p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-64">
            <Card className="border-[#e8ddd0] shadow-sm">
              {syllabusChapters.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b5c52]">
                    Syllabus
                  </p>
                  <nav className="space-y-1">
                    {syllabusChapters.map((ch) => {
                      const active = ch.id === chapter.id;
                      return (
                        <Link
                          key={ch.id}
                          to={`/student/courses/${courseId}/chapters/${ch.id}`}
                          className={`flex items-center justify-between rounded-lg border-l-4 px-3 py-2 text-sm ${
                            active
                              ? 'border-[#c2622a] bg-[#c2622a]/10 font-serif font-medium text-[#c2622a]'
                              : 'border-transparent text-[#6b5c52] hover:bg-[#faf6f1]'
                          }`}
                        >
                          <span className="truncate">{ch.title}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              )}
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6b5c52]">
                Course Content
              </p>
              <nav className="space-y-1">
                {contentChapters.map((ch) => {
                  const progress = getChapterProgress(ch.id);
                  const read = progress?.is_read;
                  const active = ch.id === chapter.id;
                  return (
                    <Link
                      key={ch.id}
                      to={`/student/courses/${courseId}/chapters/${ch.id}`}
                      className={`flex items-center justify-between rounded-lg border-l-4 px-3 py-2 text-sm ${
                        active
                          ? 'border-[#c2622a] bg-[#c2622a]/10 font-serif font-medium text-[#c2622a]'
                          : 'border-transparent text-[#6b5c52] hover:bg-[#faf6f1]'
                      }`}
                    >
                      <span className="truncate">{ch.title}</span>
                      {read && (
                        <span className="ml-2 flex shrink-0 items-center gap-0.5 text-xs font-semibold text-[#5a8a5a]">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Read
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </Card>
          </aside>

          <div className="min-w-0 flex-1">
            <Link
              to={`/student/courses/${courseId}`}
              className="text-sm text-[#c2622a] hover:underline"
            >
              ← Back to course
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {hasDueDate && !isSyllabus && (
                <DueDateBadge dueDate={chapter.due_date!} variant="student" />
              )}
              {isRead ? (
                <Badge className="bg-[#5a8a5a]/15 text-[#5a8a5a]">
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Marked as Read
                </Badge>
              ) : (
                <>
                  <Badge className="bg-amber-50 text-amber-700">
                    Reading: {progressPercent}%{isPaused || isIdle ? ' (paused)' : ''}
                  </Badge>
                  <span className="rounded-full bg-[#faf6f1] px-3 py-1 text-xs text-[#6b5c52]">
                    Active: {formatDuration(activeSeconds)} / {formatDuration(requiredSeconds)} required
                  </span>
                </>
              )}
            </div>

            <Card className="mt-4 border-[#e8ddd0] bg-[#faf6f1] shadow-sm">
              <CardTitle className="mb-4 text-base text-[#6b5c52]">
                {isSyllabus ? 'Syllabus' : 'Chapter content'}
              </CardTitle>
              <div ref={contentAreaRef} tabIndex={0} className="font-serif text-[#2c1810] outline-none">
                <PlateViewer content={chapter.content} editorKey={chapter.id} />
              </div>
            </Card>

            {!isAssignmentChapter && files.length > 0 && (
              <Card className="mt-8 border-[#e8ddd0] shadow-sm">
                <CardTitle className="border-b border-[#e8ddd0] px-6 py-4 text-lg">Reading Materials</CardTitle>
                <div className="space-y-4 p-6">
                  {files.map((file) => (
                    <CourseMaterialPanel key={file.id} file={file} />
                  ))}
                </div>
              </Card>
            )}

            {firstChapter && (
              <StartCourseCard courseId={Number(courseId)} firstChapter={firstChapter} />
            )}

            {isAssignmentChapter && (
              <Card className="mt-8 border-l-4 border-l-[#c2622a] border-[#e8ddd0] shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8ddd0] px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-[#c2622a]" />
                    <CardTitle className="text-lg">Assignment</CardTitle>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {hasInstructions && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#6b5c52]">
                        Instructions
                      </p>
                      <CardDescription className="mt-2 whitespace-pre-wrap text-base text-[#2c1810]">
                        {chapter.assignment_instructions}
                      </CardDescription>
                    </div>
                  )}

                  {files.length > 0 && (
                    <div>
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6b5c52]">
                        Reading Materials
                      </p>
                      <div className="space-y-4">
                        {files.map((file) => (
                          <CourseMaterialPanel key={file.id} file={file} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {isAssignmentChapter && (
              <Card className="mt-8 border border-[#e8ddd0] bg-white shadow-sm">
                <CardTitle className="border-b border-[#e8ddd0] px-6 py-4 text-lg text-[#2c1810]">
                  Submit Your Work
                </CardTitle>
                <div className="space-y-6 p-6">
                  {submissionLoading ? (
                    <p className="text-sm text-[#6b5c52]">Loading submission...</p>
                  ) : !submission ? (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={SUBMISSION_ACCEPT}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                          e.target.value = '';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#e8ddd0] bg-[#faf6f1] px-6 py-10 text-center transition-colors hover:border-[#c2622a]/40"
                      >
                        <Upload className="mb-3 h-8 w-8 text-[#c2622a]" />
                        <p className="font-medium text-[#2c1810]">
                          Upload a photo of your completed work
                        </p>
                        <p className="mt-1 text-sm text-[#6b5c52]">PDF, JPG, or PNG</p>
                        {selectedFile && (
                          <div className="mt-4 w-full max-w-md">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt="Submission preview"
                                className="mx-auto max-h-48 rounded-xl border border-[#e8ddd0] object-contain"
                              />
                            ) : (
                              <div className="flex items-center justify-center gap-2 rounded-xl border border-[#e8ddd0] bg-white px-4 py-3 text-sm text-[#2c1810]">
                                <FileText className="h-5 w-5 text-[#c2622a]" />
                                {selectedFile.name}
                              </div>
                            )}
                          </div>
                        )}
                      </button>
                      {submissionError && (
                        <p className="text-sm text-destructive">{submissionError}</p>
                      )}
                      <Button
                        type="button"
                        className="ghibli-gradient-primary hover:brightness-95"
                        disabled={!selectedFile || uploading}
                        onClick={() => void handleSubmitAssignment()}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          'Submit Assignment'
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl border border-[#e8ddd0] bg-[#faf6f1] p-4">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <Badge
                            className={
                              submission.status === 'reviewed'
                                ? 'bg-[#5a8a5a]/15 text-[#5a8a5a]'
                                : 'bg-[#c2622a]/10 text-[#c2622a]'
                            }
                          >
                            {submission.status === 'reviewed' ? 'Reviewed' : 'Submitted'}
                          </Badge>
                          <p className="text-sm text-[#6b5c52]">
                            Submitted {formatSubmissionTimestamp(submission.submitted_at)}
                          </p>
                        </div>
                        {submission.submitted_image_url && (
                          <div className="space-y-3">
                            {isPdfUrl(submission.submitted_image_url) ? (
                              <iframe
                                title="Submitted assignment"
                                src={normalizeMediaUrl(submission.submitted_image_url)}
                                className="h-96 w-full rounded-xl border border-[#e8ddd0] bg-white"
                              />
                            ) : (
                              <img
                                src={normalizeMediaUrl(submission.submitted_image_url)}
                                alt="Your submission"
                                className="max-h-96 w-full rounded-xl border border-[#e8ddd0] object-contain"
                              />
                            )}
                            <a
                              href={normalizeMediaUrl(submission.submitted_image_url)}
                              download
                              className="inline-flex items-center gap-1 text-sm font-medium text-[#c2622a] hover:underline"
                            >
                              <Download className="h-4 w-4" />
                              Download submission
                            </a>
                          </div>
                        )}
                      </div>

                      {submission.status === 'reviewed' && (
                        <Card className="border-l-4 border-l-[#5a8a5a] border-[#e8ddd0] bg-white shadow-sm">
                          <CardTitle className="text-lg text-[#2c1810]">Instructor Feedback</CardTitle>
                          <div className="mt-4 space-y-4">
                            {submission.annotated_image_url && (
                              <div className="space-y-2">
                                <img
                                  src={normalizeMediaUrl(submission.annotated_image_url)}
                                  alt="Annotated feedback"
                                  className="w-full rounded-xl border border-[#e8ddd0] object-contain"
                                />
                                <a
                                  href={normalizeMediaUrl(submission.annotated_image_url)}
                                  download
                                  className="inline-flex items-center gap-1 text-sm font-medium text-[#c2622a] hover:underline"
                                >
                                  <Download className="h-4 w-4" />
                                  Download annotated version
                                </a>
                              </div>
                            )}
                            {submission.instructor_remarks?.trim() && (
                              <p className="font-serif text-base text-[#2c1810] whitespace-pre-wrap">
                                {submission.instructor_remarks}
                              </p>
                            )}
                            {submission.score !== null && submission.score !== undefined && (
                              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#c2622a]/10 text-lg font-bold text-[#c2622a]">
                                {submission.score}/100
                              </div>
                            )}
                            {submission.returned_at && (
                              <p className="text-sm text-[#6b5c52]">
                                Reviewed {formatSubmissionTimestamp(submission.returned_at)}
                              </p>
                            )}
                          </div>
                        </Card>
                      )}
                    </>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
      {chapter && <AIChatPanel chapterId={chapter.id} />}
    </>
  );
}
