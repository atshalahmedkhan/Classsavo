interface CourseThumbnailProps {
  url?: string | null;
  alt?: string;
  className?: string;
}

export function CourseThumbnail({ url, alt = '', className = '' }: CourseThumbnailProps) {
  if (url) {
    return <img src={url} alt={alt} className={`object-cover ${className}`} />;
  }

  return (
    <div
      className={`bg-gradient-to-br from-[#d4845a]/40 via-[#c2622a]/20 to-[#faf6f1] ${className}`}
      aria-hidden="true"
    />
  );
}
