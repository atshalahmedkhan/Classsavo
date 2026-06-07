import client from './client';
import type { AuthTokens, RegisterPayload, User } from '../types';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

export const authApi = {
  register: async (payload: RegisterPayload) => {
    const { data } = await client.post<AuthResponse>('/auth/register/', payload);
    return data;
  },

  login: async (username: string, password: string) => {
    const { data } = await client.post<LoginResponse>('/auth/login/', {
      username,
      password,
    });
    return data;
  },

  me: async () => {
    const { data } = await client.get<User>('/auth/me/');
    return data;
  },

  changePassword: async (payload: {
    current_password: string;
    new_password: string;
    confirm_new_password: string;
  }) => {
    const { data } = await client.post<{ detail: string }>('/auth/change-password/', payload);
    return data;
  },
};
