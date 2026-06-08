/** Use same-origin paths so Vercel can proxy API/media instead of hitting Render directly. */
export function normalizeMediaUrl(url: string): string {
  if (url.startsWith('/media/') || url.startsWith('/api/')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/media/') || parsed.pathname.startsWith('/api/')) {
      return parsed.pathname;
    }
  } catch {
    // Keep relative or malformed URLs as-is.
  }

  return url;
}
