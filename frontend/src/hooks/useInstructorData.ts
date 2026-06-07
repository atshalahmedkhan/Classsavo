import { useCallback, useEffect, useState } from 'react';
import { coursesApi, enrollmentsApi } from '@/api/courses';
import type { Course, Enrollment } from '@/types';

export function useInstructorData() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [courseData, enrollmentData] = await Promise.all([
        coursesApi.list(),
        enrollmentsApi.list(),
      ]);
      setCourses(courseData);
      setEnrollments(enrollmentData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalStudents = enrollments.length;
  const totalChapters = courses.reduce((sum, c) => sum + c.chapter_count, 0);
  const avgEnrollment = courses.length
    ? Math.round(totalStudents / courses.length)
    : 0;

  return {
    courses,
    enrollments,
    loading,
    refresh,
    stats: {
      totalStudents,
      totalCourses: courses.length,
      totalChapters,
      avgEnrollment,
    },
  };
}
