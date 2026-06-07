import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen, TrendingUp, Users } from 'lucide-react';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { useInstructorData } from '@/hooks/useInstructorData';

export function InstructorOverviewPage() {
  const { courses, loading, stats } = useInstructorData();

  return (
    <>
      <InstructorHeader title="Overview" breadcrumbs={[{ label: 'Dashboard' }]} />
      <main className="flex-1 p-6">
        {loading ? (
          <p className="text-[#6b5c52]">Loading dashboard...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-[#e8ddd0] shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <CardDescription>Total Students</CardDescription>
                    <CardTitle className="mt-1 text-3xl">{stats.totalStudents}</CardTitle>
                    <p className="mt-1 text-xs text-[#5a8a5a]">Active across {stats.totalCourses} courses</p>
                  </div>
                  <Users className="h-8 w-8 text-white/75" />
                </div>
              </Card>
              <Card className="border-[#e8ddd0] shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <CardDescription>Total Courses</CardDescription>
                    <CardTitle className="mt-1 text-3xl">{stats.totalCourses}</CardTitle>
                    <p className="mt-1 text-xs text-[#6b5c52]">{stats.totalChapters} chapters published</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-white/75" />
                </div>
              </Card>
              <Card className="border-[#e8ddd0] shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <CardDescription>Avg. Students / Course</CardDescription>
                    <CardTitle className="mt-1 text-3xl">{stats.avgEnrollment}</CardTitle>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#5a8a5a]">
                      <TrendingUp className="h-3 w-3" /> Growing engagement
                    </p>
                  </div>
                  <ArrowUpRight className="h-8 w-8 text-white/75" />
                </div>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="border-[#e8ddd0] shadow-sm lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <CardTitle>Recent Courses</CardTitle>
                  <Link to="/instructor/courses">
                    <Button variant="outline" size="sm">View all</Button>
                  </Link>
                </div>
                {courses.length === 0 ? (
                  <CardDescription>No courses yet. Create your first course to get started.</CardDescription>
                ) : (
                  <div className="space-y-3">
                    {courses.slice(0, 4).map((course) => (
                      <Link
                        key={course.id}
                        to={`/instructor/courses/${course.id}`}
                        className="flex items-center justify-between rounded-lg border border-[#e8ddd0] p-4 transition hover:border-[#d4845a] hover:bg-[#c2622a]/10/30"
                      >
                        <div>
                          <p className="font-semibold text-[#2c1810]">{course.title}</p>
                          <p className="text-sm text-[#6b5c52]">
                            {course.enrollment_count ?? 0} students · {course.chapter_count} chapters
                          </p>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-[#6b5c52]" />
                      </Link>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="border-amber-200 bg-amber-50 shadow-sm">
                <CardTitle className="text-amber-900">Instructor Tip</CardTitle>
                <CardDescription className="mt-2 text-amber-800">
                  A compelling title and clear description increase enrollment. Share your course access
                  code with students so they can join.
                </CardDescription>
                <Link to="/instructor/courses/new" className="mt-4 inline-block text-sm font-semibold text-amber-900 underline">
                  Create a new course
                </Link>
              </Card>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
