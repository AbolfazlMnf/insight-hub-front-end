import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/modules/auth/store';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear credentials on unauthorized only if not on auth routes
      const isAuthRoute =
        typeof window !== 'undefined' &&
        (window.location.pathname.startsWith('/login') ||
          window.location.pathname.startsWith('/register'));

      if (!isAuthRoute) {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extracts the user-friendly error message returned by NestJS pipes and exception filters.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'An unexpected error occurred'
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[]; error?: string }
      | undefined;

    if (data?.message) {
      if (Array.isArray(data.message)) {
        return data.message.join(' | ');
      }
      return data.message;
    }

    if (data?.error) {
      return data.error;
    }

    if (typeof error.response?.data === 'string' && error.response.data.trim()) {
      return error.response.data;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
