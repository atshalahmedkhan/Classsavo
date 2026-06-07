interface MessengerCharacterProps {
  className?: string;
}

export function MessengerCharacter({ className = 'h-32 w-32' }: MessengerCharacterProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Soft glow */}
      <ellipse cx="60" cy="118" rx="28" ry="6" fill="#c2622a" opacity="0.12" />

      {/* Body / coat */}
      <path
        d="M38 78 C38 62 48 52 60 52 C72 52 82 62 82 78 L82 108 C82 114 77 118 60 118 C43 118 38 114 38 108 Z"
        fill="#faf6f1"
        stroke="#e8ddd0"
        strokeWidth="1.5"
      />
      <path
        d="M44 78 L76 78 L74 112 C74 115 68 117 60 117 C52 117 46 115 46 112 Z"
        fill="#d4845a"
        opacity="0.25"
      />

      {/* Head */}
      <circle cx="60" cy="38" r="22" fill="#faf6f1" stroke="#e8ddd0" strokeWidth="1.5" />
      <circle cx="60" cy="40" r="18" fill="#f5e6d3" />

      {/* Hair */}
      <path
        d="M42 34 C42 18 52 10 60 10 C68 10 78 18 78 34 C78 28 72 22 60 22 C48 22 42 28 42 34 Z"
        fill="#2c1810"
        opacity="0.85"
      />

      {/* Eyes */}
      <ellipse cx="52" cy="40" rx="2.5" ry="3" fill="#2c1810" />
      <ellipse cx="68" cy="40" rx="2.5" ry="3" fill="#2c1810" />
      <circle cx="53" cy="39" r="0.8" fill="#faf6f1" />
      <circle cx="69" cy="39" r="0.8" fill="#faf6f1" />

      {/* Smile */}
      <path
        d="M54 48 Q60 52 66 48"
        stroke="#2c1810"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* Cheek blush */}
      <circle cx="46" cy="46" r="3" fill="#d4845a" opacity="0.35" />
      <circle cx="74" cy="46" r="3" fill="#d4845a" opacity="0.35" />

      {/* Letter / message */}
      <rect x="72" y="64" width="28" height="22" rx="3" fill="#ffffff" stroke="#c2622a" strokeWidth="1.5" />
      <path d="M72 67 L86 76 L100 67" stroke="#c2622a" strokeWidth="1.5" fill="none" />
      <line x1="78" y1="78" x2="94" y2="78" stroke="#e8ddd0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="78" y1="82" x2="90" y2="82" stroke="#e8ddd0" strokeWidth="1.5" strokeLinecap="round" />

      {/* Small leaf accent */}
      <path
        d="M28 90 C32 86 36 88 34 94 C32 98 28 96 28 90 Z"
        fill="#c2622a"
        opacity="0.7"
      />
    </svg>
  );
}
