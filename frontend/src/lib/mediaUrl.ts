/** Use same-origin /media paths so Vercel can proxy instead of hitting Render directly. */
export function normalizeMediaUrl(url: string): string {
  if (url.startsWith('/media/')) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/media/')) {
      return parsed.pathname;
    }
  } catch {
    // Keep relative or malformed URLs as-is.
  }

  return url;
}
