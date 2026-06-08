import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  MessageCircle,
  User,
} from 'lucide-react';
import { chaptersApi } from '@/api/chapters';
import { coursesApi } from '@/api/courses';
import { StudentHeader } from '@/components/student/StudentHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/lib/apiError';
import { partitionChapters } from '@/lib/chapterUtils';
import { normalizeMediaUrl } from '@/lib/mediaUrl';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import type { Chapter, ChapterType, Course } from '@/types';

type ChapterFilter = 'all' | ChapterType;

export function StudentCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
  const [chapterFilter, setChapterFilter] = useState<ChapterFilter>('all');
  const { getCourseStats, getChapterProgress } = useStudentProgress();

  useEffect(() => {
    const load = async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const [courseData, chapterData] = await Promise.all([
          coursesApi.get(Number(courseId)),
          chaptersApi.list(Number(courseId)),
        ]);
        setCourse(courseData);
        setChapters(chapterData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId]);

  const handleJoin = async () => {
    if (!course) return;
    setJoinError('');
    setJoining(true);
    try {
      await coursesApi.join(course.id, accessCode.trim());
      setShowJoinModal(false);
      navigate(`/student/enrolled/${course.id}`, { state: { course } });
    } catch (err) {
      setJoinError(
        getApiErrorMessage(err, 'Invalid access code. Please check with your instructor.'),
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <>
        <StudentHeader title="Loading..." />
        <main className="flex-1 p-6"><p className="text-[#6b5c52]">Loading course...</p></main>
      </>
    );
  }

  if (!course) {
    return (
      <>
        <StudentHeader title="Not found" />
        <main className="flex-1 p-6"><p>Course not found.</p></main>
      </>
    );
  }

  const instructorName =
    course.instructor.first_name && course.instructor.last_name
      ? `${course.instructor.first_name} ${course.instructor.last_name}`
      : course.instructor.username;

  const { syllabusChapters, contentChapters } = partitionChapters(chapters);
  const primarySyllabus = syllabusChapters[0] ?? null;
  const { readCount } = getCourseStats(course.id, contentChapters.length);
  const readPct = contentChapters.length
    ? Math.round((readCount / contentChapters.length) * 100)
    : 0;
  const filteredChapters = contentChapters.filter((chapter) => {
    if (chapterFilter === 'all') return true;
    return (chapter.chapter_type ?? 'reading') === chapterFilter;
  });

  const startChapter = primarySyllabus ?? contentChapters[0] ?? null;

  return (
    <>
      <StudentHeader searchPlaceholder="Search courses, mentors..." />
      <main className="flex-1">
        {/* Hero */}
        <div
          className={`ghibli-hero-motif relative overflow-hidden px-6 py-12 text-white ${course.thumbnail_url ? '' : 'ghibli-gradient-hero'}`}
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
          <div className="absolute inset-0 opacity-20">
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
          <div className="relative mx-auto max-w-6xl">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white">COURSE</Badge>
              <Badge className="bg-white/20 text-white">SELF-PACED</Badge>
            </div>
            <h1 className="mt-4 max-w-3xl font-serif text-3xl font-bold md:text-4xl">{course.title}</h1>
            <p className="mt-3 max-w-2xl text-white/85">{course.description}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {course.is_enrolled ? (
                startChapter ? (
                  <Link to={`/student/courses/${course.id}/chapters/${startChapter.id}`}>
                    <Button className="bg-white text-[#c2622a] hover:bg-[#c2622a]/10">
                      {primarySyllabus ? 'Read Syllabus' : 'Start Learning Now'}
                    </Button>
                  </Link>
                ) : (
                  <Link to={`/student/courses/${course.id}`}>
                    <Button className="bg-white text-[#c2622a] hover:bg-[#c2622a]/10">
                      View Course
                    </Button>
                  </Link>
                )
              ) : (
                <Button
                  className="bg-white text-[#c2622a] hover:bg-[#c2622a]/10"
                  onClick={() => setShowJoinModal(true)}
                >
                  Enroll in Course
                </Button>
              )}
              {primarySyllabus && (
                <Link to={`/student/courses/${course.id}/chapters/${primarySyllabus.id}`}>
                  <Button
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10"
                  >
                    View Syllabus
                  </Button>
                </Link>
              )}
              {course.is_enrolled && (
                <Button
                  variant="outline"
                  className="border-white/40 bg-transparent text-white hover:bg-white/10"
                  onClick={() =>
                    navigate(
                      `/student/messages?user=${course.instructor.id}&course=${course.id}`,
                    )
                  }
                >
                  <MessageCircle className="mr-1 h-4 w-4" /> Message Instructor
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-6 p-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card className="border-[#e8ddd0] shadow-sm">
              <CardTitle>Course Overview</CardTitle>
              {course.is_enrolled && contentChapters.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-[#6b5c52]">Course progress</span>
                    <span className="font-bold text-[#c2622a]">
                      {readCount} / {contentChapters.length} chapters read
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#faf6f1]">
                    <div className="h-2 rounded-full ghibli-gradient-primary" style={{ width: `${readPct}%` }} />
                  </div>
                </div>
              )}
              <CardDescription className="mt-3 leading-relaxed">{course.description}</CardDescription>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#e8ddd0] pt-6 sm:grid-cols-4">
                {[
                  { label: 'Chapters', value: `${contentChapters.length}` },
                  { label: 'Format', value: 'Self-paced' },
                  { label: 'Access', value: course.is_enrolled ? 'Enrolled' : 'Open' },
                  { label: 'Students', value: `${course.enrollment_count ?? '—'}` },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xs uppercase text-[#6b5c52]">{stat.label}</p>
                    <p className="mt-1 font-bold text-[#2c1810]">{stat.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            {primarySyllabus && (
              <Card className="border-[#e8ddd0] bg-[#faf6f1] shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <Badge className="bg-amber-100 text-amber-800">Syllabus</Badge>
                    <CardTitle className="mt-2 text-lg">{primarySyllabus.title}</CardTitle>
                    <CardDescription className="mt-1">
                      Review the course syllabus before starting readings and assignments.
                    </CardDescription>
                  </div>
                  {course.is_enrolled ? (
                    <Link to={`/student/courses/${course.id}/chapters/${primarySyllabus.id}`}>
                      <Button className="ghibli-gradient-primary hover:brightness-95">
                        Read Syllabus
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="outline"
                      className="border-[#c2622a]/40 text-[#c2622a]"
                      onClick={() => setShowJoinModal(true)}
                    >
                      Enroll to Read
                    </Button>
                  )}
                </div>
              </Card>
            )}

            <Card className="border-[#e8ddd0] shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <CardTitle>Course Content</CardTitle>
                <span className="text-sm text-[#6b5c52]">
                  {contentChapters.length} {contentChapters.length === 1 ? 'chapter' : 'chapters'}
                </span>
              </div>
              {contentChapters.length === 0 ? (
                <CardDescription>
                  {course.is_enrolled
                    ? 'No readings or assignments published yet.'
                    : 'Enroll to access course content.'}
                </CardDescription>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {([
                      { id: 'all' as const, label: 'All' },
                      { id: 'reading' as const, label: 'Readings' },
                      { id: 'assignment' as const, label: 'Assignments' },
                    ]).map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setChapterFilter(tab.id)}
                        className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                          chapterFilter === tab.id
                            ? 'ghibli-gradient-primary text-white'
                            : 'border border-[#e8ddd0] bg-white text-[#6b5c52] hover:border-[#c2622a]/40'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                  {filteredChapters.length === 0 ? (
                    <CardDescription>No chapters match this filter.</CardDescription>
                  ) : (
                    <div className="space-y-2">
                      {filteredChapters.map((chapter, index) => {
                        const overdue =
                          chapter.chapter_type === 'assignment' &&
                          chapter.due_date &&
                          new Date(chapter.due_date) < new Date();
                        return (
                          <div key={chapter.id} className="rounded-lg border border-[#e8ddd0]">
                            <button
                              type="button"
                              className="flex w-full items-center justify-between p-4 text-left"
                              onClick={() =>
                                setExpandedModule(expandedModule === index ? null : index)
                              }
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#faf6f1] text-sm font-bold text-[#6b5c52]">
                                    {String(index + 1).padStart(2, '0')}
                                  </span>
                                  <span className="font-medium">{chapter.title}</span>
                                  {getChapterProgress(chapter.id)?.is_read && (
                                    <Badge className="bg-[#5a8a5a]/15 text-[#5a8a5a]">Read</Badge>
                                  )}
                                </div>
                                {chapterFilter === 'assignment' && chapter.due_date && (
                                  <p
                                    className={`mt-1 pl-11 text-sm ${
                                      overdue ? 'font-medium text-red-600' : 'text-[#6b5c52]'
                                    }`}
                                  >
                                    Due{' '}
                                    {new Date(chapter.due_date).toLocaleString(undefined, {
                                      dateStyle: 'medium',
                                      timeStyle: 'short',
                                    })}
                                    {overdue ? ' · Overdue' : ''}
                                  </p>
                                )}
                              </div>
                              {expandedModule === index ? (
                                <ChevronUp className="h-4 w-4 shrink-0 text-[#6b5c52]" />
                              ) : (
                                <ChevronDown className="h-4 w-4 shrink-0 text-[#6b5c52]" />
                              )}
                            </button>
                            {expandedModule === index && (
                              <div className="border-t border-[#e8ddd0] px-4 pb-4 pt-2">
                                <Link
                                  to={`/student/courses/${course.id}/chapters/${chapter.id}`}
                                  className="text-sm font-medium text-[#c2622a] hover:underline"
                                >
                                  Read chapter →
                                </Link>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-[#e8ddd0] shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full ghibli-gradient-primary text-lg font-bold text-white">
                  {instructorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <CardTitle className="text-base">{instructorName}</CardTitle>
                  <CardDescription>Instructor</CardDescription>
                </div>
              </div>
              <p className="mt-4 text-sm text-[#6b5c52]">
                Course instructor for {course.title}. Reach out via your institution for support.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-[#6b5c52]">
                <User className="h-4 w-4" />
                {course.instructor.email}
              </div>
            </Card>

            <Card className="border-[#1a1a2e] bg-[#1a1a2e] text-white shadow-sm">
              <p className="text-xs uppercase text-white/75">Course Access</p>
              <p className="mt-2 text-2xl font-bold">{course.is_enrolled ? 'Enrolled' : 'Free to Join'}</p>
              <ul className="mt-4 space-y-2 text-sm text-white/85">
                <li className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> {contentChapters.length} chapters
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Self-paced learning
                </li>
              </ul>
              {!course.is_enrolled && (
                <Button
                  className="mt-4 w-full ghibli-gradient-primary hover:brightness-95"
                  onClick={() => setShowJoinModal(true)}
                >
                  Enroll with Access Code
                </Button>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Modal open={showJoinModal} onClose={() => setShowJoinModal(false)} title={`Enroll in ${course.title}`}>
        <p className="mb-4 text-sm text-[#6b5c52]">Enter the access code from your instructor.</p>
        <Input value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="Access code" />
        {joinError && <p className="mt-2 text-sm text-destructive">{joinError}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowJoinModal(false)}>Cancel</Button>
          <Button className="ghibli-gradient-primary" onClick={handleJoin} disabled={joining || !accessCode.trim()}>
            {joining ? 'Enrolling...' : 'Enroll'}
          </Button>
        </div>
      </Modal>

    </>
  );
}
