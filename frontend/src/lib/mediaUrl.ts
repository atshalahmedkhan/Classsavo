function getBackendOrigin(): string {
  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (!apiBase || apiBase.startsWith('/')) {
    return '';
  }
  try {
    return new URL(apiBase).origin;
  } catch {
    return '';
  }
}

/** Resolve course/media URLs for dev proxy and production (Render) backends. */
export function normalizeMediaUrl(url: string): string {
  if (!url) return url;

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/media/') || url.startsWith('/api/')) {
    const backendOrigin = getBackendOrigin();
    if (backendOrigin) {
      return `${backendOrigin}${url}`;
    }
    return url;
  }

  return url;
}
