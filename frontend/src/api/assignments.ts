import client from './client';
import type { StudentAssignment } from '../types';

export const assignmentsApi = {
  list: async () => {
    const { data } = await client.get<StudentAssignment[]>('/student/assignments/');
    return data;
  },
};
