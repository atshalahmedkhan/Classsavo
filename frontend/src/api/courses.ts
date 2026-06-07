import client from './client';
import type { Course, Enrollment, User } from '../types';

export const coursesApi = {
  list: async () => {
    const { data } = await client.get<Course[]>('/courses/');
    return data;
  },

  get: async (id: number) => {
    const { data } = await client.get<Course>(`/courses/${id}/`);
    return data;
  },

  create: async (payload: { title: string; description: string; thumbnail?: File }) => {
    if (payload.thumbnail) {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('thumbnail', payload.thumbnail);
      const { data } = await client.post<Course>('/courses/', formData);
      return data;
    }
    const { data } = await client.post<Course>('/courses/', {
      title: payload.title,
      description: payload.description,
    });
    return data;
  },

  update: async (
    id: number,
    payload: { title?: string; description?: string; thumbnail?: File },
  ) => {
    if (payload.thumbnail) {
      const formData = new FormData();
      if (payload.title) formData.append('title', payload.title);
      if (payload.description) formData.append('description', payload.description);
      formData.append('thumbnail', payload.thumbnail);
      const { data } = await client.patch<Course>(`/courses/${id}/`, formData);
      return data;
    }
    const { data } = await client.patch<Course>(`/courses/${id}/`, payload);
    return data;
  },

  delete: async (id: number) => {
    await client.delete(`/courses/${id}/`);
  },

  enrollments: async (courseId: number) => {
    const { data } = await client.get<Array<{ id: number; student: User; enrolled_at: string }>>(
      `/courses/${courseId}/enrollments/`,
    );
    return data;
  },

  join: async (courseId: number, accessCode: string) => {
    const { data } = await client.post<Enrollment>(`/courses/${courseId}/join/`, {
      access_code: accessCode,
    });
    return data;
  },
};

export const enrollmentsApi = {
  list: async (courseId?: number) => {
    const params = courseId ? { course: courseId } : undefined;
    const { data } = await client.get<Enrollment[]>('/enrollments/', { params });
    return data;
  },

  enroll: async (courseId: number) => {
    const { data } = await client.post<Enrollment>('/enrollments/', { course_id: courseId });
    return data;
  },
};
