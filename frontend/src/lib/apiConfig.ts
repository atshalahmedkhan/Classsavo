/** Backend API base — set in production to your Render URL. */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const DEFAULT_PRODUCTION_ORIGIN = 'https://classsavo.onrender.com';

/** Origin for media/thumbnail URLs (Render), used when paths are relative. */
export function getBackendOrigin(): string {
  const explicit = import.meta.env.VITE_BACKEND_ORIGIN;
  if (explicit) {
    return String(explicit).replace(/\/$/, '');
  }

  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    try {
      return new URL(API_BASE_URL).origin;
    } catch {
      // fall through
    }
  }

  if (import.meta.env.PROD) {
    return DEFAULT_PRODUCTION_ORIGIN;
  }

  return '';
}
