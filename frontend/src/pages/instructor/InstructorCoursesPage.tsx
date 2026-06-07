import { Link } from 'react-router-dom';
import { MoreVertical, Plus, Trash2 } from 'lucide-react';
import { coursesApi } from '@/api/courses';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useInstructorData } from '@/hooks/useInstructorData';

export function InstructorCoursesPage() {
  const { courses, loading, refresh } = useInstructorData();

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this course and all its chapters?')) return;
    await coursesApi.delete(id);
    await refresh();
  };

  return (
    <>
      <InstructorHeader
        title="My Courses"
        breadcrumbs={[{ label: 'Dashboard', to: '/instructor' }, { label: 'My Courses' }]}
        actions={
          <Link to="/instructor/courses/new">
            <Button className="ghibli-gradient-primary hover:brightness-95">
              <Plus className="mr-1 h-4 w-4" />
              New Course
            </Button>
          </Link>
        }
      />
      <main className="flex-1 p-6">
        {loading ? (
          <p className="text-[#6b5c52]">Loading courses...</p>
        ) : courses.length === 0 ? (
          <Card className="border-dashed border-[#e8ddd0] bg-white py-16 text-center shadow-sm">
            <CardTitle>No courses yet</CardTitle>
            <CardDescription className="mt-2">Create your first course to start building curriculum.</CardDescription>
            <Link to="/instructor/courses/new" className="mt-4 inline-block">
              <Button className="ghibli-gradient-primary hover:brightness-95">Create New Course</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="border-[#e8ddd0] shadow-sm">
                <div className="flex items-start justify-between">
                  <Badge className="bg-[#c2622a]/10 text-[#c2622a]">Course</Badge>
                  <button type="button" className="text-[#6b5c52] hover:text-[#6b5c52]">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
                <CardTitle className="mt-3">{course.title}</CardTitle>
                <CardDescription className="mt-2 line-clamp-2">{course.description}</CardDescription>
                <div className="mt-4 flex items-center gap-4 text-sm text-[#6b5c52]">
                  <span>{course.enrollment_count ?? 0} students</span>
                  <span>{course.chapter_count} chapters</span>
                </div>
                {course.access_code && (
                  <p className="mt-2 font-mono text-xs text-[#6b5c52]">Code: {course.access_code}</p>
                )}
                <div className="mt-4 flex gap-2">
                  <Link to={`/instructor/courses/${course.id}`} className="flex-1">
                    <Button size="sm" className="w-full ghibli-gradient-primary hover:brightness-95">
                      Manage
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(course.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
