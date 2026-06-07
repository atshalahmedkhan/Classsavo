import type { Value } from '@udecode/plate';
import client from './client';
import type { Chapter, ChapterFile } from '../types';

export const chaptersApi = {
  list: async (courseId?: number) => {
    const params = courseId ? { course: courseId } : undefined;
    const { data } = await client.get<Chapter[]>('/chapters/', { params });
    return data;
  },

  get: async (id: number) => {
    const { data } = await client.get<Chapter>(`/chapters/${id}/`);
    return data;
  },

  create: async (payload: {
    title: string;
    content: Value;
    course: number;
    is_public?: boolean;
    order?: number;
  }) => {
    const { data } = await client.post<Chapter>('/chapters/', payload);
    return data;
  },

  update: async (
    id: number,
    payload: Partial<{
      title: string;
      content: Value;
      is_public: boolean;
      order: number;
      assignment_instructions: string;
      due_date: string | null;
    }>,
  ) => {
    const { data } = await client.patch<Chapter>(`/chapters/${id}/`, payload);
    return data;
  },

  delete: async (id: number) => {
    await client.delete(`/chapters/${id}/`);
  },

  toggleVisibility: async (id: number) => {
    const { data } = await client.patch<Chapter>(`/chapters/${id}/toggle-visibility/`);
    return data;
  },

  setVisibility: async (id: number, isPublic: boolean) => {
    const { data } = await client.patch<Chapter>(`/chapters/${id}/`, { is_public: isPublic });
    return data;
  },

  uploadFile: async (chapterId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await client.post<ChapterFile>(`/chapters/${chapterId}/upload/`, formData);
    return data;
  },

  deleteFile: async (fileId: number) => {
    await client.delete(`/chapter-files/${fileId}/`);
  },

  getPreviewPath: (fileId: number) => `/chapter-files/${fileId}/preview/`,

  getPreviewBlob: async (fileId: number) => {
    const { data } = await client.get<Blob>(`/chapter-files/${fileId}/preview/`, {
      responseType: 'blob',
    });
    return data;
  },
};
