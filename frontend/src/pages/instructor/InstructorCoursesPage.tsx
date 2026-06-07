import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Copy, MoreVertical, Plus, Trash2 } from 'lucide-react';
import { coursesApi } from '@/api/courses';
import { InstructorHeader } from '@/components/instructor/InstructorHeader';
import type { InstructorSearchResult } from '@/components/instructor/InstructorHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useInstructorData } from '@/hooks/useInstructorData';
import type { Course } from '@/types';

function filterCourses(courses: Course[], query: string): Course[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return courses;
  return courses.filter(
    (course) =>
      course.title.toLowerCase().includes(normalized) ||
      course.description.toLowerCase().includes(normalized) ||
      (course.access_code?.toLowerCase().includes(normalized) ?? false),
  );
}

export function InstructorCoursesPage() {
  const navigate = useNavigate();
  const { courses, loading, refresh } = useInstructorData();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const filteredCourses = filterCourses(courses, searchQuery);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [openMenuId]);

  const searchResults = useMemo<InstructorSearchResult[]>(() => {
    if (!searchQuery.trim()) return [];
    return filteredCourses.slice(0, 8).map((course) => ({
      id: String(course.id),
      label: course.title,
      subtitle: [
        course.access_code ? `Code: ${course.access_code}` : null,
        `${course.enrollment_count ?? 0} students`,
        `${course.chapter_count} chapters`,
      ]
        .filter(Boolean)
        .join(' · '),
      href: `/instructor/courses/${course.id}`,
    }));
  }, [filteredCourses, searchQuery]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this course and all its chapters?')) return;
    setOpenMenuId(null);
    await coursesApi.delete(id);
    await refresh();
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setOpenMenuId(null);
  };

  return (
    <>
      <InstructorHeader
        title="My Courses"
        breadcrumbs={[{ label: 'Dashboard', to: '/instructor' }, { label: 'My Courses' }]}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchResults={searchResults}
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
        ) : searchQuery.trim() && filteredCourses.length === 0 ? (
          <Card className="border-[#e8ddd0] bg-white py-16 text-center shadow-sm">
            <CardTitle>No courses found matching your search</CardTitle>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden border-[#e8ddd0] p-0 shadow-sm">
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-[#c2622a] to-[#d4845a]">
                    <Camera className="h-6 w-6 text-white/80" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <Badge className="bg-[#c2622a]/10 text-[#c2622a]">Course</Badge>
                    <div
                      className="relative"
                      ref={openMenuId === course.id ? menuRef : undefined}
                    >
                      <button
                        type="button"
                        aria-label="Course options"
                        onClick={() =>
                          setOpenMenuId((prev) => (prev === course.id ? null : course.id))
                        }
                        className="rounded-lg p-1 text-[#6b5c52] hover:bg-[#faf6f1] hover:text-[#2c1810]"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                      {openMenuId === course.id && (
                        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[#e8ddd0] bg-white py-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              navigate(`/instructor/courses/${course.id}`);
                            }}
                            className="flex w-full px-4 py-2 text-left text-sm text-[#2c1810] hover:bg-[#faf6f1]"
                          >
                            Manage course
                          </button>
                          {course.access_code && (
                            <button
                              type="button"
                              onClick={() => handleCopyCode(course.access_code!)}
                              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#2c1810] hover:bg-[#faf6f1]"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy access code
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(course.id)}
                            className="flex w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                          >
                            Delete course
                          </button>
                        </div>
                      )}
                    </div>
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
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
