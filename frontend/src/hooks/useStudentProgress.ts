import { useCallback, useEffect, useState } from 'react';
import { progressApi } from '@/api/progress';
import type { ChapterProgress, StudentCourseProgress, StudentProgressSummary } from '@/types';

const EMPTY_SUMMARY: StudentProgressSummary = {
  chapters_read: 0,
  total_chapters: 0,
  total_active_seconds: 0,
};

export function useStudentProgress() {
  const [records, setRecords] = useState<ChapterProgress[]>([]);
  const [summary, setSummary] = useState<StudentProgressSummary>(EMPTY_SUMMARY);
  const [courses, setCourses] = useState<StudentCourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await progressApi.getMine();
      setRecords(data.records);
      setSummary(data.summary);
      setCourses(data.courses ?? []);
    } catch {
      setRecords([]);
      setSummary(EMPTY_SUMMARY);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getChapterProgress = useCallback(
    (chapterId: number) => records.find((r) => r.chapter_id === chapterId),
    [records],
  );

  const getCourseStats = useCallback(
    (courseId: number, totalChapters: number) => {
      const courseRecords = records.filter((r) => r.course_id === courseId);
      const readCount = courseRecords.filter((r) => r.is_read).length;
      return { readCount, totalChapters, courseRecords };
    },
    [records],
  );

  return {
    records,
    summary,
    courses,
    loading,
    refresh,
    getChapterProgress,
    getCourseStats,
    totalRead: summary.chapters_read,
    totalChapters: summary.total_chapters,
    totalActiveSeconds: summary.total_active_seconds,
  };
}
