import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Clock, Users } from 'lucide-react';
import { coursesApi } from '@/api/courses';
import { StudentHeader } from '@/components/student/StudentHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/lib/apiError';
import { useStudentData } from '@/hooks/useStudentData';
import { CourseThumbnail } from '@/components/CourseThumbnail';
import type { Course } from '@/types';

function filterCourses(courses: Course[], query: string): Course[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return courses;
  return courses.filter(
    (course) =>
      course.title.toLowerCase().includes(normalized) ||
      course.description.toLowerCase().includes(normalized),
  );
}

export function StudentDiscoverPage() {
  const navigate = useNavigate();
  const { availableCourses, loading } = useStudentData();
  const [searchQuery, setSearchQuery] = useState('');
  const [joinCourse, setJoinCourse] = useState<Course | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const filteredCourses = filterCourses(availableCourses, searchQuery);

  const openJoinModal = (course: Course) => {
    setJoinCourse(course);
    setAccessCode('');
    setJoinError('');
  };

  const closeJoinModal = () => {
    setJoinCourse(null);
    setAccessCode('');
    setJoinError('');
  };

  const handleJoin = async () => {
    if (!joinCourse) return;
    setJoinError('');
    setJoining(true);
    try {
      await coursesApi.join(joinCourse.id, accessCode.trim());
      closeJoinModal();
      navigate(`/student/enrolled/${joinCourse.id}`, { state: { course: joinCourse } });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Invalid access code. Please check with your instructor.');
      setJoinError(
        message.toLowerCase().includes('invalid access code')
          ? 'Invalid access code. Please check with your instructor.'
          : message,
      );
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <StudentHeader
        title="Discover"
        subtitle="Explore courses and enroll with your access code."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="flex-1 p-6">
        {loading ? (
          <p className="text-[#6b5c52]">Loading catalog...</p>
        ) : availableCourses.length === 0 ? (
          <Card className="border-[#e8ddd0] py-16 text-center shadow-sm">
            <CardTitle>You're enrolled in all available courses</CardTitle>
            <CardDescription className="mt-2">Check My Courses to continue learning.</CardDescription>
          </Card>
        ) : searchQuery.trim() && filteredCourses.length === 0 ? (
          <Card className="border-[#e8ddd0] py-16 text-center shadow-sm">
            <CardTitle>No courses found matching your search</CardTitle>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden border-[#e8ddd0] shadow-sm">
                <div className="grid lg:grid-cols-3">
                  <div className="relative min-h-[180px] lg:col-span-1">
                    <CourseThumbnail
                      url={course.thumbnail_url}
                      alt={course.title}
                      className="absolute inset-0 h-full w-full"
                    />
                    <div className="relative flex h-full min-h-[180px] flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-6 text-white">
                      <Badge className="mb-2 w-fit bg-white/20 text-white">COURSE</Badge>
                      <h2 className="text-xl font-bold">{course.title}</h2>
                    </div>
                  </div>
                  <div className="p-6 lg:col-span-2">
                    <p className="text-[#6b5c52]">{course.description}</p>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#6b5c52]">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" /> {course.chapter_count} chapters
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> Self-paced
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />{' '}
                        {course.instructor.first_name || course.instructor.username}
                      </span>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => openJoinModal(course)}
                      >
                        Join Course
                      </Button>
                      <Button variant="outline" onClick={() => navigate(`/student/courses/${course.id}`)}>
                        View Syllabus
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Modal open={!!joinCourse} onClose={closeJoinModal} title={`Join ${joinCourse?.title ?? 'course'}`}>
        <p className="mb-4 text-sm text-[#6b5c52]">
          Enter the access code provided by your instructor.
        </p>
        <Input
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
          placeholder="Access code"
          autoFocus
        />
        {joinError && <p className="mt-2 text-sm text-destructive">{joinError}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={closeJoinModal}>Cancel</Button>
          <Button
            className="ghibli-gradient-primary hover:brightness-95"
            onClick={handleJoin}
            disabled={joining || !accessCode.trim()}
          >
            {joining ? 'Enrolling...' : 'Enroll'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
