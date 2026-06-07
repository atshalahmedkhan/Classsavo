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
import { useStudentProgress } from '@/hooks/useStudentProgress';
import type { Chapter, Course } from '@/types';

export function StudentCoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);
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

  const { readCount } = getCourseStats(course.id, chapters.length);
  const readPct = chapters.length ? Math.round((readCount / chapters.length) * 100) : 0;
  const publicChapterCount = chapters.length;

  return (
    <>
      <StudentHeader searchPlaceholder="Search courses, mentors..." />
      <main className="flex-1">
        {/* Hero */}
        <div className="ghibli-hero-motif relative overflow-hidden ghibli-gradient-hero px-6 py-12 text-white">
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
                chapters[0] ? (
                  <Link to={`/student/courses/${course.id}/chapters/${chapters[0].id}`}>
                    <Button className="bg-white text-[#c2622a] hover:bg-[#c2622a]/10">
                      Start Learning Now
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
              <Button
                variant="outline"
                className="border-white/40 bg-transparent text-white hover:bg-white/10"
                onClick={() => setShowSyllabusModal(true)}
              >
                View Syllabus
              </Button>
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
              {course.is_enrolled && chapters.length > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-[#6b5c52]">Reading progress</span>
                    <span className="font-bold text-[#c2622a]">
                      {readCount} / {chapters.length} chapters read
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
                  { label: 'Chapters', value: `${publicChapterCount}` },
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

            <Card className="border-[#e8ddd0] shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <CardTitle>Curriculum Breakdown</CardTitle>
                <span className="text-sm text-[#6b5c52]">
                  {chapters.length} Modules · {chapters.length} Lectures
                </span>
              </div>
              {chapters.length === 0 ? (
                <CardDescription>
                  {course.is_enrolled
                    ? 'No public chapters available yet.'
                    : 'Enroll to access course content.'}
                </CardDescription>
              ) : (
                <div className="space-y-2">
                  {chapters.map((chapter, index) => (
                    <div key={chapter.id} className="rounded-lg border border-[#e8ddd0]">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between p-4 text-left"
                        onClick={() =>
                          setExpandedModule(expandedModule === index ? null : index)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded bg-[#faf6f1] text-sm font-bold text-[#6b5c52]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="font-medium">{chapter.title}</span>
                          {getChapterProgress(chapter.id)?.is_read && (
                            <Badge className="bg-[#5a8a5a]/15 text-[#5a8a5a]">Read</Badge>
                          )}
                        </div>
                        {expandedModule === index ? (
                          <ChevronUp className="h-4 w-4 text-[#6b5c52]" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-[#6b5c52]" />
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
                  ))}
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
                  <BookOpen className="h-4 w-4" /> {publicChapterCount} chapters
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

      <Modal
        open={showSyllabusModal}
        onClose={() => setShowSyllabusModal(false)}
        title={`Syllabus — ${course.title}`}
      >
        {chapters.length === 0 ? (
          <p className="text-sm text-[#6b5c52]">No public chapters available yet.</p>
        ) : (
          <div className="space-y-3">
            {chapters.map((chapter, index) => {
              const overdue =
                chapter.due_date && new Date(chapter.due_date) < new Date();
              return (
                <div
                  key={chapter.id}
                  className={`rounded-lg border p-4 ${
                    overdue ? 'border-red-200 bg-red-50' : 'border-[#e8ddd0]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-[#6b5c52]">
                        Chapter {String(index + 1).padStart(2, '0')}
                      </p>
                      <p className={`font-medium ${overdue ? 'text-red-800' : 'text-[#2c1810]'}`}>
                        {chapter.title}
                      </p>
                    </div>
                    <p className={`shrink-0 text-sm ${overdue ? 'font-semibold text-red-700' : 'text-[#6b5c52]'}`}>
                      {chapter.due_date
                        ? new Date(chapter.due_date).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })
                        : 'No due date'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>
    </>
  );
}
