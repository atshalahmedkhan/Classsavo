import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'The server is waking up (Render free tier). Wait 30–60 seconds and try again.';
      }
      if (import.meta.env.PROD) {
        return 'Cannot reach the server. Wait a moment and try again — the backend may be starting up.';
      }
      return 'Cannot reach the server. Start the backend with: cd backend && .\\venv\\Scripts\\python.exe manage.py runserver';
    }
    const data = error.response.data as Record<string, unknown> | string | undefined;
    if (typeof data === 'string') return data;
    if (data?.error) return String(data.error);
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
