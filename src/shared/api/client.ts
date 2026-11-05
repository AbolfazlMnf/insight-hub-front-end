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
    const authState = useAuthStore.getState();
    const token = authState.token;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (authState.user?.id && config.headers) {
      config.headers['x-user-id'] = authState.user.id;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear credentials on unauthorized only if not already on auth routes
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
 * Converts backend errors into clear, user-friendly English messages for end users
 * instead of raw technical codes like "Request failed with status code 401" or "Cannot POST".
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { message?: string | string[]; error?: string }
      | string
      | undefined;

    // Handle Network Connection failures
    if (
      error.code === 'ERR_NETWORK' ||
      error.message?.toLowerCase().includes('network error')
    ) {
      return 'Unable to connect to the server. Please check your connection and ensure the backend is running.';
    }

    // Handle raw HTML or 404 Express "Cannot METHOD URL" responses
    if (typeof data === 'string') {
      if (
        data.includes('Cannot POST') ||
        data.includes('Cannot GET') ||
        status === 404
      ) {
        return 'The requested resource or endpoint was not found.';
      }
      if (
        data.trim().length > 0 &&
        data.trim().length < 150 &&
        !data.includes('<!DOCTYPE')
      ) {
        return data;
      }
    }

    // Extract structured JSON error from NestJS pipes or exception filters
    if (data && typeof data === 'object') {
      if (data.message) {
        if (Array.isArray(data.message) && data.message.length > 0) {
          return data.message.join(' | ');
        }
        if (typeof data.message === 'string' && data.message.trim().length > 0) {
          if (data.message.toLowerCase() === 'unauthorized') {
            return 'Invalid credentials or session expired.';
          }
          return data.message;
        }
      }

      if (data.error && typeof data.error === 'string') {
        if (data.error.toLowerCase() === 'unauthorized') {
          return 'Invalid email or password.';
        }
        if (data.error.toLowerCase() === 'forbidden') {
          return 'You do not have permission to perform this action.';
        }
      }
    }

    // Standard HTTP status code fallbacks when no custom message is supplied
    if (status === 401) {
      return 'Invalid email or password.';
    }
    if (status === 403) {
      return 'You do not have access to this workspace or resource.';
    }
    if (status === 404) {
      return 'The requested workspace or document could not be found.';
    }
    if (status === 413) {
      return 'The selected file exceeds the maximum allowed size (20 MB).';
    }
    if (status === 409) {
      return 'The document is currently being processed and cannot be modified.';
    }
    if (status && status >= 500) {
      return 'An internal server error occurred. Please try again shortly.';
    }
  }

  if (error instanceof Error && error.message) {
    if (error.message.includes('Network Error')) {
      return 'Unable to connect to server.';
    }
    return error.message;
  }

  return fallback;
}
