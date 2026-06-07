import client from './client';
import type { StudentProgressResponse } from '../types';

export const progressApi = {
  getMine: async () => {
    const { data } = await client.get<StudentProgressResponse>('/student/progress/');
    return data;
  },

  updateChapter: async (
    chapterId: number,
    payload: { time_spent_seconds: number; is_read: boolean },
  ) => {
    const { data } = await client.post(`/chapters/${chapterId}/progress/`, payload);
    return data;
  },

  getCourseReport: async (courseId: number) => {
    const { data } = await client.get(`/courses/${courseId}/progress/`);
    return data;
  },
};
