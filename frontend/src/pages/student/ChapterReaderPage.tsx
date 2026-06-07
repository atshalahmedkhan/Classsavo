import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Calendar, CheckCircle2, ClipboardList } from 'lucide-react';
import { chaptersApi } from '@/api/chapters';
import { CourseMaterialPanel } from '@/components/CourseMaterialPanel';
import { StudentHeader } from '@/components/student/StudentHeader';
import { PlateViewer } from '@/components/PlateViewer';
import { Badge } from '@/components/ui/Badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { useChapterReadingTimer } from '@/hooks/useChapterReadingTimer';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { formatDuration } from '@/lib/readingTime';
import type { Chapter } from '@/types';

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function ChapterReaderPage() {
  const { courseId, chapterId } = useParams();
  const contentAreaRef = useRef<HTMLDivElement>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      try {
        const [chapterData, chapterList] = await Promise.all([
          chaptersApi.get(Number(chapterId)),
          chaptersApi.list(Number(courseId)),
        ]);
        setChapter(chapterData);
        setChapters(chapterList);
      } catch {
        setError('Unable to load this chapter. It may be private or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [chapterId, courseId]);

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
  const hasInstructions = Boolean(chapter.assignment_instructions?.trim());
  const hasDueDate = Boolean(chapter.due_date);
  const hasAssignment = hasInstructions || hasDueDate || files.length > 0;
  const isOverdue = hasDueDate && new Date(chapter.due_date!) < new Date();

  return (
    <>
      <StudentHeader title={chapter.title} subtitle="Chapter content and assignments" />
      <main className="flex-1 p-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-64">
            <Card className="border-[#e8ddd0] shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#6b5c52]">
                Chapters
              </p>
              <nav className="space-y-1">
                {chapters.map((ch) => {
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
              <CardTitle className="mb-4 text-base text-[#6b5c52]">Chapter content</CardTitle>
              <div ref={contentAreaRef} tabIndex={0} className="font-serif text-[#2c1810] outline-none">
                <PlateViewer content={chapter.content} editorKey={chapter.id} />
              </div>
            </Card>

            {hasAssignment && (
              <Card className="mt-8 border-l-4 border-l-[#c2622a] border-[#e8ddd0] shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e8ddd0] px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-[#c2622a]" />
                    <CardTitle className="text-lg">Assignment</CardTitle>
                  </div>
                  {hasDueDate && (
                    <Badge
                      className={
                        isOverdue
                          ? 'bg-red-100 text-red-700'
                          : 'bg-[#c2622a]/10 text-[#c2622a]'
                      }
                    >
                      <Calendar className="mr-1 inline h-3.5 w-3.5" />
                      Due {formatDueDate(chapter.due_date!)}
                      {isOverdue ? ' · Overdue' : ''}
                    </Badge>
                  )}
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
          </div>
        </div>
      </main>
    </>
  );
}
