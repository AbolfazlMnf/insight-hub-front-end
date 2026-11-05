import { apiClient } from '@/shared/api/client';
import { LoginInput, RegisterInput } from './types';

export interface LoginResponse {
  accessToken: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  role: 'USER' | 'ADMIN';
  createdAt?: string;
  updatedAt?: string;
}

export const authApi = {
  login: async (data: LoginInput): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>('/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterInput): Promise<UserProfile> => {
    const res = await apiClient.post<UserProfile>('/auth/sign-up', data);
    return res.data;
  },

  getUserProfile: async (id: string): Promise<UserProfile> => {
    const res = await apiClient.get<UserProfile>(`/users/${id}`);
    return res.data;
  },
};
