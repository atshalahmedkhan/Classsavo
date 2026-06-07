import { useMemo, useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useInstructorData } from '@/hooks/useInstructorData';
import type { Enrollment } from '@/types';

type CourseFilter = 'all' | number;

function downloadCsv(filename: string, rows: string[][]): void {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildEnrollmentRows(enrollments: Enrollment[]): string[][] {
  return [
    ['Student Username', 'Student Email', 'Course', 'Enrolled Date'],
    ...enrollments.map((enrollment) => [
      enrollment.student.username,
      enrollment.student.email,
      enrollment.course.title,
      new Date(enrollment.enrolled_at).toLocaleDateString(),
    ]),
  ];
}

export function InstructorAnalyticsPage() {
  const { courses, enrollments, loading } = useInstructorData();
  const [showFilters, setShowFilters] = useState(false);
  const [courseFilter, setCourseFilter] = useState<CourseFilter>('all');

  const filteredCourses = useMemo(
    () => (courseFilter === 'all' ? courses : courses.filter((course) => course.id === courseFilter)),
    [courses, courseFilter],
  );

  const filteredEnrollments = useMemo(
    () =>
      courseFilter === 'all'
        ? enrollments
        : enrollments.filter((enrollment) => enrollment.course.id === courseFilter),
    [enrollments, courseFilter],
  );

  const stats = useMemo(() => {
    const totalStudents = filteredEnrollments.length;
    const totalCourses = filteredCourses.length;
    const totalChapters = filteredCourses.reduce((sum, course) => sum + course.chapter_count, 0);
    const avgEnrollment = totalCourses ? Math.round(totalStudents / totalCourses) : 0;
    const completionRate =
      totalCourses > 0 ? Math.min(100, Math.round((totalChapters / (totalCourses * 5)) * 100)) : 0;

    return { totalStudents, totalCourses, totalChapters, avgEnrollment, completionRate };
  }, [filteredCourses, filteredEnrollments]);

  const handleExportCsv = () => {
    if (filteredEnrollments.length === 0) {
      window.alert('No enrollment data to export for the current filter.');
      return;
    }

    const suffix =
      courseFilter === 'all'
        ? 'all-courses'
        : filteredCourses[0]?.title.replace(/[^\w-]+/g, '-').toLowerCase() ?? 'course';
    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`classavo-performance-${suffix}-${date}.csv`, buildEnrollmentRows(filteredEnrollments));
  };

  const clearFilters = () => {
    setCourseFilter('all');
    setShowFilters(false);
  };

  return (
    <>
      <InstructorHeader
        title="Performance Analytics"
        breadcrumbs={[{ label: 'Dashboard', to: '/instructor' }, { label: 'Analytics' }]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              type="button"
              aria-pressed={showFilters}
              onClick={() => setShowFilters((open) => !open)}
            >
              <Filter className="mr-1 h-4 w-4" /> Filter View
            </Button>
            <Button variant="outline" size="sm" type="button" onClick={handleExportCsv} disabled={loading}>
              <Download className="mr-1 h-4 w-4" /> Export CSV
            </Button>
          </>
        }
      />
      <main className="flex-1 p-6">
        <p className="mb-6 text-sm text-[#6b5c52]">
          Real-time engagement and progress metrics across your courses.
        </p>

        {showFilters && (
          <Card className="mb-6 border-[#e8ddd0] shadow-sm">
            <CardTitle className="text-base">Filter analytics</CardTitle>
            <div className="mt-4 flex flex-wrap items-end gap-4">
              <div>
                <label htmlFor="analytics-course-filter" className="mb-1 block text-sm font-medium text-[#2c1810]">
                  Course
                </label>
                <select
                  id="analytics-course-filter"
                  className="flex h-10 min-w-[220px] rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  value={courseFilter === 'all' ? 'all' : String(courseFilter)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setCourseFilter(value === 'all' ? 'all' : Number(value));
                  }}
                >
                  <option value="all">All courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <Button variant="outline" size="sm" type="button" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
            {courseFilter !== 'all' && (
              <p className="mt-3 text-sm text-[#6b5c52]">
                Showing data for{' '}
                <span className="font-medium text-[#2c1810]">
                  {filteredCourses[0]?.title ?? 'selected course'}
                </span>
                .
              </p>
            )}
          </Card>
        )}

        {loading ? (
          <p className="text-[#6b5c52]">Loading analytics...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-[#e8ddd0] shadow-sm">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="mt-1 text-3xl">{stats.totalStudents}</CardTitle>
                <p className="mt-1 text-xs text-[#5a8a5a]">Active across {stats.totalCourses} courses</p>
              </Card>
              <Card className="border-[#e8ddd0] shadow-sm">
                <CardDescription>Content Coverage</CardDescription>
                <CardTitle className="mt-1 text-3xl">{stats.completionRate}%</CardTitle>
                <div className="mt-2 h-2 rounded-full bg-[#faf6f1]">
                  <div
                    className="h-2 rounded-full ghibli-gradient-primary"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </Card>
              <Card className="border-[#e8ddd0] shadow-sm">
                <CardDescription>Total Chapters</CardDescription>
                <CardTitle className="mt-1 text-3xl">{stats.totalChapters}</CardTitle>
                <p className="mt-1 text-xs text-[#6b5c52]">Published curriculum content</p>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-[#e8ddd0] shadow-sm">
                <CardTitle>Course Breakdown</CardTitle>
                <div className="mt-4 space-y-3">
                  {filteredCourses.length === 0 ? (
                    <CardDescription>No courses match the current filter.</CardDescription>
                  ) : (
                    filteredCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between rounded-lg border border-[#e8ddd0] p-3"
                      >
                        <div>
                          <p className="font-medium">{course.title}</p>
                          <p className="text-xs text-[#6b5c52]">{course.chapter_count} chapters</p>
                        </div>
                        <Badge>{course.enrollment_count ?? 0} students</Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="border-[#e8ddd0] shadow-sm">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Enrollments</CardTitle>
                  <Link to="/instructor/students" className="text-sm text-[#c2622a] hover:underline">
                    View all
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {filteredEnrollments.slice(0, 5).map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-3 rounded-lg border border-[#e8ddd0] p-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c2622a]/15 text-xs font-bold text-[#c2622a]">
                        {enrollment.student.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{enrollment.student.username}</p>
                        <p className="text-xs text-[#6b5c52]">{enrollment.course.title}</p>
                      </div>
                    </div>
                  ))}
                  {filteredEnrollments.length === 0 && (
                    <CardDescription>No enrollments match the current filter.</CardDescription>
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
