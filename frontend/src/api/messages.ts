import client from './client';
import type { Conversation, Message } from '../types';

export const messagesApi = {
  listConversations: async () => {
    const { data } = await client.get<Conversation[]>('/messages/');
    return data;
  },

  getThread: async (userId: number) => {
    const { data } = await client.get<Message[]>(`/messages/${userId}/`);
    return data;
  },

  send: async (userId: number, body: string, courseId?: number) => {
    const { data } = await client.post<Message>(`/messages/${userId}/`, {
      body,
      course_id: courseId ?? null,
    });
    return data;
  },

  markRead: async (userId: number) => {
    const { data } = await client.patch<{ marked_read: number }>(`/messages/${userId}/read/`);
    return data;
  },

  getUnreadCount: async () => {
    const { data } = await client.get<{ unread_count: number }>('/messages/unread-count/');
    return data.unread_count;
  },
};
