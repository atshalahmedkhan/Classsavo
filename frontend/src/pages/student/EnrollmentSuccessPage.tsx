import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, BookOpen, Calendar, CheckCircle2, Clock } from 'lucide-react';
import { coursesApi } from '@/api/courses';
import { StudentHeader } from '@/components/student/StudentHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardDescription, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useEffect, useState } from 'react';
import type { Course } from '@/types';

export function EnrollmentSuccessPage() {
  const { courseId } = useParams();
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(
    (location.state as { course?: Course } | null)?.course ?? null,
  );

  useEffect(() => {
    if (!course && courseId) {
      coursesApi.get(Number(courseId)).then(setCourse).catch(() => {});
    }
  }, [course, courseId]);

  if (!course) {
    return (
      <>
        <StudentHeader title="Enrollment" />
        <main className="flex-1 p-6"><p className="text-[#6b5c52]">Loading...</p></main>
      </>
    );
  }

  const instructorName =
    course.instructor.first_name || course.instructor.username;

  return (
    <>
      <StudentHeader />
      <main className="flex-1 p-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full ghibli-gradient-primary text-white">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-[#2c1810]">You&apos;re officially enrolled!</h1>
          <p className="mt-2 text-[#6b5c52]">
            Welcome aboard. A confirmation has been saved to your account. You can start learning
            immediately.
          </p>

          <Card className="mt-8 border-[#e8ddd0] text-left shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#c2622a] to-[#d4845a] sm:w-32">
                <Badge className="absolute left-2 top-2 bg-white/20 text-white">ENROLLED</Badge>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase text-[#c2622a]">Course</p>
                <CardTitle className="mt-1">{course.title}</CardTitle>
                <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#6b5c52]">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> Self-paced
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" /> {course.chapter_count} chapters
                  </span>
                  <span className="flex items-center gap-1">
                    Instructor: {instructorName}
                  </span>
                </div>
                <CardDescription className="mt-3 italic">{course.description}</CardDescription>
              </div>
            </div>
          </Card>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Card className="border-[#1a1a2e] bg-[#1a1a2e] text-left text-white">
              <p className="text-xs uppercase text-white/75">Next Milestone</p>
              <CardTitle className="mt-1 text-white">Introduction & Syllabus</CardTitle>
              <p className="mt-2 flex items-center gap-1 text-sm text-white/75">
                <Calendar className="h-4 w-4" /> Available Now
              </p>
            </Card>
            <Card className="border-[#e8ddd0] text-left shadow-sm">
              <CardTitle className="text-base">Your Journey</CardTitle>
              <ul className="mt-3 space-y-2 text-sm text-[#6b5c52]">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full ghibli-gradient-primary" /> Course enrolled
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#e8ddd0]" /> Start first chapter
                </li>
              </ul>
            </Card>
          </div>

          <p className="mt-8 text-[#6b5c52]">Ready to dive in? You can start the first chapter immediately.</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to={`/student/courses/${course.id}`}>
              <Button className="w-full ghibli-gradient-primary hover:brightness-95 sm:w-auto">
                Start Learning Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/student/my-courses">
              <Button variant="outline" className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
