import React, { useState } from 'react';
import { HeartHandshake } from 'lucide-react';

interface SafeImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const [failed, setFailed] = useState(false);

  if (src && src.startsWith('initials:')) {
    const initials = src.replace('initials:', '').slice(0, 3);
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#FCE7EE] via-[#F7F1FB] to-[#FFEFE5] text-[#6B3349] font-semibold tracking-tight ${className}`}
        aria-label={alt}
      >
        <span className="text-xl font-editorial">{initials}</span>
      </div>
    );
  }

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#FDF2F5] via-[#F6F1FB] to-[#FFF4EC] text-[#7D4A5E] p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <HeartHandshake className="w-7 h-7 text-[#B84A6A]" strokeWidth={1.6} />
        <span className="text-xs font-medium text-[#5E4E5E]">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
