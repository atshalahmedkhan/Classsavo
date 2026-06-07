import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coursesApi } from '@/api/courses';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { getApiErrorMessage } from '@/lib/apiError';
import type { Course } from '@/types';

export function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCourse, setJoinCourse] = useState<Course | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const data = await coursesApi.list();
      setCourses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

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
      await loadCourses();
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

  const availableCourses = courses.filter((course) => !course.is_enrolled);
  const enrolledCourses = courses.filter((course) => course.is_enrolled);

  if (loading) {
    return <p className="text-muted-foreground">Loading courses...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <p className="text-muted-foreground">Browse courses and access your enrolled content.</p>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-semibold">My Enrolled Courses</h2>
        {enrolledCourses.length === 0 ? (
          <Card>
            <CardDescription>You have not enrolled in any courses yet.</CardDescription>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {enrolledCourses.map((course) => (
              <Card key={course.id}>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="mt-2">{course.description}</CardDescription>
                <div className="mt-4 flex items-center justify-between">
                  <Badge>{course.chapter_count} public chapters</Badge>
                  <Link to={`/student/courses/${course.id}`}>
                    <Button size="sm">View chapters</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Available Courses</h2>
        {availableCourses.length === 0 ? (
          <Card>
            <CardDescription>No new courses available to join.</CardDescription>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {availableCourses.map((course) => (
              <Card key={course.id}>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="mt-2">{course.description}</CardDescription>
                <p className="mt-2 text-sm text-muted-foreground">
                  Instructor: {course.instructor.first_name || course.instructor.username}
                </p>
                <div className="mt-4">
                  <Button size="sm" onClick={() => openJoinModal(course)}>
                    Join Course
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Modal open={!!joinCourse} onClose={closeJoinModal} title={`Join ${joinCourse?.title ?? 'course'}`}>
        <p className="mb-4 text-sm text-muted-foreground">
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
          <Button variant="outline" onClick={closeJoinModal}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={joining || !accessCode.trim()}>
            {joining ? 'Joining...' : 'Join'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
