import { useState } from 'react';
import { Camera } from 'lucide-react';
import { normalizeMediaUrl } from '@/lib/mediaUrl';

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
  const src = url ? normalizeMediaUrl(url) : null;

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
      {!loaded && (
        <div
          className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#d4845a]/40 via-[#c2622a]/20 to-[#faf6f1]"
          aria-hidden="true"
        />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
      />
    </div>
  );
}
