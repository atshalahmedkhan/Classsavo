import { Download, Filter } from 'lucide-react';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useInstructorData } from '@/hooks/useInstructorData';

export function InstructorStudentsPage() {
  const { enrollments, courses, loading, stats } = useInstructorData();

  return (
    <>
      <InstructorHeader
        title="Students"
        breadcrumbs={[{ label: 'Dashboard', to: '/instructor' }, { label: 'Students' }]}
      />
      <main className="flex-1 p-6">
        {loading ? (
          <p className="text-[#6b5c52]">Loading students...</p>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-[#e8ddd0] shadow-sm">
                <CardDescription>Total Students</CardDescription>
                <CardTitle className="mt-1 text-3xl">{stats.totalStudents}</CardTitle>
                <p className="mt-1 text-xs text-[#5a8a5a]">Enrolled across all courses</p>
              </Card>
              <Card className="border-[#e8ddd0] shadow-sm">
                <CardDescription>Active Courses</CardDescription>
                <CardTitle className="mt-1 text-3xl">{stats.totalCourses}</CardTitle>
              </Card>
              <Card className="border-[#e8ddd0] shadow-sm">
                <CardDescription>Avg. per Course</CardDescription>
                <CardTitle className="mt-1 text-3xl">{stats.avgEnrollment}</CardTitle>
              </Card>
            </div>

            <Card className="border-[#e8ddd0] shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <CardTitle>Enrolled Students</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm"><Filter className="mr-1 h-4 w-4" /> Filter</Button>
                  <Button variant="outline" size="sm"><Download className="mr-1 h-4 w-4" /> Export</Button>
                </div>
              </div>

              {enrollments.length === 0 ? (
                <CardDescription>No students enrolled yet. Share your course access codes with students.</CardDescription>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#e8ddd0] text-xs uppercase text-[#6b5c52]">
                        <th className="pb-3 pr-4">Student</th>
                        <th className="pb-3 pr-4">Course</th>
                        <th className="pb-3 pr-4">Enrolled</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="border-b border-[#e8ddd0] even:bg-[#faf6f1]/50">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c2622a]/15 text-xs font-bold text-[#c2622a]">
                                {enrollment.student.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium">{enrollment.student.username}</p>
                                <p className="text-xs text-[#6b5c52]">{enrollment.student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge className="bg-[#c2622a]/10 text-[#c2622a]">{enrollment.course.title}</Badge>
                          </td>
                          <td className="py-3 pr-4 text-[#6b5c52]">
                            {new Date(enrollment.enrolled_at).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <Badge className="bg-[#5a8a5a]/15 text-[#5a8a5a]">Active</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="mt-4 text-xs text-[#6b5c52]">
                Showing {enrollments.length} of {enrollments.length} students across {courses.length} courses
              </p>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}
