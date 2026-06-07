import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import { normalizeMediaUrl } from '@/lib/mediaUrl';
import { wakeBackend } from '@/lib/wakeBackend';

const MAX_RETRIES = 4;
const RETRY_DELAYS_MS = [0, 2000, 5000, 10000];

interface CourseThumbnailProps {
  url?: string | null;
  alt?: string;
  className?: string;
  showCameraFallback?: boolean;
}

export function CourseThumbnail({
  url,
  alt = '',
  className = '',
  showCameraFallback = false,
}: CourseThumbnailProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const src = url ? normalizeMediaUrl(url) : null;

  useEffect(() => {
    if (!src) {
      setReady(false);
      setLoaded(false);
      setFailed(false);
      setAttempt(0);
      return;
    }

    let cancelled = false;
    setLoaded(false);
    setFailed(false);
    setAttempt(0);
    setReady(false);

    wakeBackend().then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [src]);

  const handleError = () => {
    if (attempt >= MAX_RETRIES - 1) {
      setFailed(true);
      return;
    }

    const nextAttempt = attempt + 1;
    const delay = RETRY_DELAYS_MS[nextAttempt] ?? 10000;

    window.setTimeout(() => {
      void wakeBackend({ force: true }).then(() => {
        setLoaded(false);
        setAttempt(nextAttempt);
      });
    }, delay);
  };

  if (!src || failed) {
    if (showCameraFallback) {
      return (
        <div
          className={`flex items-center justify-center bg-gradient-to-br from-[#c2622a] to-[#d4845a] ${className}`}
          aria-hidden="true"
        >
          <Camera className="h-6 w-6 text-white/80" />
        </div>
      );
    }

    return (
      <div
        className={`animate-pulse bg-gradient-to-br from-[#d4845a]/40 via-[#c2622a]/20 to-[#faf6f1] ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {(!loaded || !ready) && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#d4845a]/40 via-[#c2622a]/20 to-[#faf6f1]"
          aria-hidden="true"
        />
      )}
      {ready && (
        <img
          key={attempt}
          src={attempt > 0 ? `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}` : src}
          alt={alt}
          loading="eager"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`h-full w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        />
      )}
    </div>
  );
}
