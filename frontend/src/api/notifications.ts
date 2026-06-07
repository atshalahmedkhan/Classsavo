import client from './client';
import type { AppNotification } from '../types';

export const notificationsApi = {
  list: async () => {
    const { data } = await client.get<AppNotification[]>('/notifications/');
    return data;
  },

  markRead: async (id: number) => {
    const { data } = await client.patch<AppNotification>(`/notifications/${id}/read/`);
    return data;
  },

  markAllRead: async () => {
    const { data } = await client.patch<{ marked_read: number }>('/notifications/read-all/');
    return data;
  },
};
