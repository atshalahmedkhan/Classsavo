import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      if (import.meta.env.PROD) {
        return `Cannot reach the server at ${apiBase}. Check that Render is running and CORS allows this site.`;
      }
      return 'Cannot reach the server. Start the backend with: cd backend && .\\venv\\Scripts\\python.exe manage.py runserver';
    }
    const data = error.response.data as Record<string, unknown> | string | undefined;
    if (typeof data === 'string') return data;
    if (data?.detail) return String(data.detail);
    if (data?.non_field_errors) return String((data.non_field_errors as string[])[0]);
    const firstKey = data && typeof data === 'object' ? Object.keys(data)[0] : null;
    if (firstKey && data) {
      const value = data[firstKey];
      if (Array.isArray(value)) return `${firstKey}: ${value[0]}`;
      return `${firstKey}: ${String(value)}`;
    }
  }
  return fallback;
}
