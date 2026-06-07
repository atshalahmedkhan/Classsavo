import { Link } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { StudentHeader } from '@/components/student/StudentHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useStudentData } from '@/hooks/useStudentData';
import { CourseThumbnail } from '@/components/CourseThumbnail';

export function StudentMyCoursesPage() {
  const { enrolledCourses, loading } = useStudentData();

  return (
    <>
      <StudentHeader title="My Courses" subtitle="Courses you are currently enrolled in." />
      <main className="flex-1 p-6">
        {loading ? (
          <p className="text-[#6b5c52]">Loading courses...</p>
        ) : enrolledCourses.length === 0 ? (
          <Card className="border-dashed border-[#e8ddd0] py-16 text-center shadow-sm">
            <CardTitle>No enrolled courses yet</CardTitle>
            <CardDescription className="mt-2">
              Browse the catalog and join a course with your access code.
            </CardDescription>
            <Link to="/student/discover" className="mt-4 inline-block">
              <Button className="ghibli-gradient-primary hover:brightness-95">Discover Courses</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {enrolledCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden border-[#e8ddd0] shadow-sm">
                <CourseThumbnail
                  url={course.thumbnail_url}
                  alt={course.title}
                  className="h-32 w-full"
                />
                <div className="p-5">
                  <Badge className="bg-[#5a8a5a]/15 text-[#5a8a5a]">Enrolled</Badge>
                  <CardTitle className="mt-2 line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">{course.description}</CardDescription>
                  <div className="mt-4 flex items-center gap-4 text-xs text-[#6b5c52]">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" /> {course.chapter_count} chapters
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> {course.instructor.first_name || course.instructor.username}
                    </span>
                  </div>
                  <Link to={`/student/courses/${course.id}`} className="mt-4 block">
                    <Button className="w-full ghibli-gradient-primary hover:brightness-95">Continue Learning</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
