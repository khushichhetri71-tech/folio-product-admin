import axios, { AxiosError } from 'axios';
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number = 0,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
// Both browser and server use this setup. Only the server can read the HTTP-only token.
export function createApi(baseURL: string, getToken?: () => string | undefined) {
  const instance = axios.create({
    baseURL,
    timeout: 20000,
    headers: { 'Content-Type': 'application/json' },
  });
  instance.interceptors.request.use((config) => {
    const token = getToken?.();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string }>) => {
      if (axios.isCancel(error)) return Promise.reject(error);
      const status = error.response?.status || 0;
      const message =
        status === 401
          ? error.config?.url?.includes('auth/login')
            ? error.response?.data?.message || 'Incorrect username or password. Please try again.'
            : 'Your session has expired. Please sign in again.'
          : error.code === 'ECONNABORTED'
            ? 'The request timed out. Please try again.'
            : error.response?.data?.message ||
              (status
                ? 'Something went wrong. Please try again.'
                : 'Unable to connect. Check your connection and try again.');
      // Full navigation clears the protected client tree after a rejected session.
      if (
        typeof window !== 'undefined' &&
        status === 401 &&
        !error.config?.url?.includes('auth/login')
      )
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(
          `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}&expired=1`,
        );
      return Promise.reject(new ApiError(message, status));
    },
  );
  return instance;
}
export const api = createApi('/api');
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';
