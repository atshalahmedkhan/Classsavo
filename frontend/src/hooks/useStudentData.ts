import { useCallback, useEffect, useState } from 'react';
import { coursesApi } from '@/api/courses';
import type { Course } from '@/types';

export function useStudentData() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await coursesApi.list();
      setCourses(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enrolledCourses = courses.filter((c) => c.is_enrolled);
  const availableCourses = courses.filter((c) => !c.is_enrolled);
  const totalChapters = enrolledCourses.reduce((sum, c) => sum + c.chapter_count, 0);

  return {
    courses,
    enrolledCourses,
    availableCourses,
    loading,
    refresh,
    stats: {
      enrolledCount: enrolledCourses.length,
      totalChapters,
      availableCount: availableCourses.length,
    },
  };
}
