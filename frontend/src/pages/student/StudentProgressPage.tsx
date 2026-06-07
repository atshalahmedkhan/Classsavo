import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { assignmentsApi } from '@/api/assignments';
import { StudentHeader } from '@/components/student/StudentHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useStudentData } from '@/hooks/useStudentData';
import { useStudentProgress } from '@/hooks/useStudentProgress';
import { useMessages } from '@/hooks/useMessages';
import type { StudentAssignment } from '@/types';

function assignmentStatus(item: StudentAssignment): string {
  if (item.is_read) return 'Read';
  if (item.time_spent_seconds > 0) return 'In Progress';
  return 'Not Started';
}

function truncate(text: string, max = 80): string {
  const trimmed = text.trim();
  if (!trimmed) return '—';
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

export function StudentProgressPage() {
  const { enrolledCourses, loading } = useStudentData();
  const {
    totalRead,
    totalChapters,
    totalActiveSeconds,
    courses,
    loading: progressLoading,
  } = useStudentProgress();
  const { conversations, unreadCount } = useMessages();
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setAssignmentsLoading(true);
      try {
        const data = await assignmentsApi.list();
        setAssignments(data);
      } catch {
        setAssignments([]);
      } finally {
        setAssignmentsLoading(false);
      }
    };
    load();
  }, []);

  const progressPct = totalChapters
    ? Math.min(100, Math.round((totalRead / totalChapters) * 100))
    : 0;
  const totalActiveMinutes = Math.round(totalActiveSeconds / 60);

  const handleShareProfile = async () => {
    const text = `Classavo student profile — ${enrolledCourses.length} enrolled course(s), ${totalRead}/${totalChapters} chapters read.`;
    if (navigator.share) {
      await navigator.share({ title: 'My Classavo Profile', text });
      return;
    }
    await navigator.clipboard.writeText(text);
    alert('Profile summary copied to clipboard.');
  };

  const handleExportReport = () => {
    const lines = [
      'Classavo Progress Report',
      `Enrolled courses: ${enrolledCourses.length}`,
      `Chapters read: ${totalRead} / ${totalChapters}`,
      `Overall progress: ${progressPct}%`,
      `Active reading time: ${totalActiveMinutes} minutes`,
      '',
      'Courses:',
      ...courses.map(
        (course) => `- ${course.course_title} (${course.chapters_read}/${course.total_chapters} read)`,
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'classavo-progress-report.txt';
    link.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = loading || progressLoading;

  return (
    <>
      <StudentHeader
        title="Progress & Achievements"
        subtitle="Track your learning journey across all enrolled courses."
        searchPlaceholder="Search progress, certificates..."
        actions={
          <>
            <Button variant="outline" size="sm" type="button" onClick={handleShareProfile}>
              <Share2 className="mr-1 h-4 w-4" /> Share Profile
            </Button>
            <Button size="sm" type="button" className="ghibli-gradient-primary hover:brightness-95" onClick={handleExportReport}>
              <Download className="mr-1 h-4 w-4" /> Export Report
            </Button>
          </>
        }
      />
      <main className="flex-1 p-6">
        {isLoading ? (
          <p className="text-[#6b5c52]">Loading progress...</p>
        ) : (
          <div className="space-y-6">
            <Card className="border-[#e8ddd0] shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <CardTitle>Reading Progress</CardTitle>
                <span className="text-sm font-bold text-[#c2622a]">
                  {totalRead} / {totalChapters} chapters read
                </span>
              </div>
              <div className="h-3 rounded-full bg-[#faf6f1]">
                <div
                  className="h-3 rounded-full ghibli-gradient-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#6b5c52]">{progressPct}% complete across all courses</p>
            </Card>

            <Card className="border-[#e8ddd0] shadow-sm">
              <CardTitle className="mb-4">My Assignments</CardTitle>
              {assignmentsLoading ? (
                <p className="text-sm text-[#6b5c52]">Loading assignments...</p>
              ) : assignments.length === 0 ? (
                <CardDescription>No assignments have been given yet</CardDescription>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e8ddd0] text-xs uppercase text-[#6b5c52]">
                        <th className="pb-3 pr-4 font-semibold">Course</th>
                        <th className="pb-3 pr-4 font-semibold">Chapter</th>
                        <th className="pb-3 pr-4 font-semibold">Instructions</th>
                        <th className="pb-3 pr-4 font-semibold">Due Date</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.map((item) => {
                        const overdue =
                          item.due_date && new Date(item.due_date) < new Date();
                        return (
                          <tr
                            key={item.chapter_id}
                            className={`border-b border-[#faf6f1] even:bg-[#faf6f1]/50 ${overdue ? 'bg-red-50/60' : ''}`}
                          >
                            <td className="py-3 pr-4">{item.course_name}</td>
                            <td className="py-3 pr-4">
                              <Link
                                to={`/student/courses/${item.course_id}/chapters/${item.chapter_id}`}
                                className="font-medium text-[#c2622a] hover:underline"
                              >
                                {item.chapter_title}
                              </Link>
                            </td>
                            <td className="max-w-xs py-3 pr-4 text-[#6b5c52]">
                              {truncate(item.assignment_instructions)}
                            </td>
                            <td className={`py-3 pr-4 ${overdue ? 'font-semibold text-red-700' : ''}`}>
                              {item.due_date
                                ? new Date(item.due_date).toLocaleString(undefined, {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                  })
                                : 'No due date'}
                            </td>
                            <td className="py-3">
                              <Badge
                                className={
                                  item.is_read
                                    ? 'bg-[#5a8a5a]/15 text-[#5a8a5a]'
                                    : item.time_spent_seconds > 0
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-[#faf6f1] text-[#6b5c52]'
                                }
                              >
                                {assignmentStatus(item)}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-[#e8ddd0] shadow-sm lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <CardTitle>Academic Breakdown</CardTitle>
                  <select className="rounded-lg border border-[#e8ddd0] px-3 py-1.5 text-sm">
                    <option>Current Semester</option>
                  </select>
                </div>
                <div className="space-y-5">
                  {[
                    {
                      label: 'Chapters Read',
                      value: progressPct,
                      note: `${totalRead} of ${totalChapters} chapters`,
                    },
                    {
                      label: 'Enrolled Courses',
                      value: Math.min(100, enrolledCourses.length * 25),
                      note: `${enrolledCourses.length} active courses`,
                    },
                    {
                      label: 'Time on Page',
                      value: Math.min(100, totalActiveMinutes),
                      note: `${totalActiveMinutes} minutes of active reading time`,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{item.label}</span>
                        {item.label === 'Time on Page' ? (
                          <span className="font-bold text-[#c2622a]">{totalActiveMinutes} min</span>
                        ) : (
                          <span className="font-bold text-[#c2622a]">{item.value}%</span>
                        )}
                      </div>
                      <div className="h-2 rounded-full bg-[#faf6f1]">
                        <div
                          className="h-2 rounded-full ghibli-gradient-primary"
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[#6b5c52]">{item.note}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#e8ddd0] bg-[#c2622a]/5 p-4">
                  <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-[#c2622a]" />
                  <div>
                    <p className="text-sm font-semibold text-[#2c1810]">Growth Insight</p>
                    <p className="text-sm text-[#6b5c52]">
                      Keep going — {Math.max(0, totalChapters - totalRead)} chapters left to read across your courses.
                    </p>
                    <Link to="/student/my-courses" className="text-sm font-medium text-[#c2622a] hover:underline">
                      View My Courses
                    </Link>
                  </div>
                </div>
              </Card>

              <Card className="border-[#1a1a2e] bg-[#1a1a2e] text-white shadow-sm">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Messages</CardTitle>
                  {unreadCount > 0 && (
                    <Badge className="bg-red-500 text-white">{unreadCount} new</Badge>
                  )}
                </div>
                <div className="mt-4 space-y-3">
                  {conversations.length === 0 ? (
                    <CardDescription className="text-white/75">
                      No messages yet. Message your instructor from a course page.
                    </CardDescription>
                  ) : (
                    conversations.slice(0, 3).map((conv) => (
                      <Link
                        key={conv.user.id}
                        to={`/student/messages?user=${conv.user.id}`}
                        className="flex items-center gap-3 rounded-lg bg-white/10 p-3 hover:bg-white/15"
                      >
                        <MessageCircle className="h-5 w-5 shrink-0 text-white/75" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {conv.user.first_name || conv.user.username}
                          </p>
                          <p className="truncate text-xs text-white/75">{conv.last_message}</p>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="ml-auto rounded-full ghibli-gradient-primary px-2 py-0.5 text-xs font-bold">
                            {conv.unread_count}
                          </span>
                        )}
                      </Link>
                    ))
                  )}
                </div>
                <Link to="/student/messages" className="mt-4 inline-block text-sm text-white/75 hover:underline">
                  View All Messages →
                </Link>
              </Card>
            </div>

            <Card className="border-[#e8ddd0] shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <CardTitle>Curriculum Learning Path</CardTitle>
                  <CardDescription>Your progress across enrolled courses</CardDescription>
                </div>
                {courses[0] && (
                  <Badge className="bg-[#c2622a]/10 text-[#c2622a]">
                    Active: {courses[0].course_title}
                  </Badge>
                )}
              </div>
              {courses.length === 0 ? (
                <CardDescription>
                  No courses yet.{' '}
                  <Link to="/student/discover" className="text-[#c2622a] hover:underline">
                    Discover courses
                  </Link>
                </CardDescription>
              ) : (
                <div className="space-y-4">
                  {courses.map((course) => {
                    const pct = course.total_chapters
                      ? Math.round((course.chapters_read / course.total_chapters) * 100)
                      : 0;
                    return (
                      <div key={course.course_id}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-medium">{course.course_title}</span>
                          <span className="text-[#6b5c52]">
                            {course.chapters_read}/{course.total_chapters} read
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[#faf6f1]">
                          <div className="h-2 rounded-full ghibli-gradient-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
