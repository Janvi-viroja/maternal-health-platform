import React from 'react';
import type { WeekDevelopment } from '../data/pregnancyData';

interface Props {
  motif: WeekDevelopment['motif'];
  sizeLabel: string;
  week: number;
}

export const BabySizeIllustration: React.FC<Props> = ({ motif, sizeLabel, week }) => {
  const renderShape = () => {
    switch (motif) {
      case 'seed':
        return (
          <g>
            <circle cx="80" cy="80" r="34" fill="#FCE7EE" />
            <ellipse cx="80" cy="80" rx="12" ry="16" fill="#B84A6A" />
            <path d="M80 64 C84 56, 92 54, 94 58" stroke="#6E56A3" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
        );
      case 'berry':
        return (
          <g>
            <circle cx="80" cy="80" r="40" fill="#FCE7EE" />
            <circle cx="72" cy="76" r="10" fill="#C95978" />
            <circle cx="88" cy="76" r="10" fill="#B84A6A" />
            <circle cx="80" cy="90" r="11" fill="#A33B5B" />
            <circle cx="80" cy="70" r="9" fill="#D9738F" />
            <path d="M70 57 Q80 63 90 57" stroke="#5F8D6B" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        );
      case 'citrus':
        return (
          <g>
            <circle cx="80" cy="80" r="44" fill="#FFF2E7" />
            <circle cx="80" cy="82" r="27" fill="#F29E6B" />
            <circle cx="80" cy="82" r="21" fill="#FAD4B8" />
            <path d="M80 61 V103 M59 82 H101 M65 67 L95 97 M95 67 L65 97" stroke="#FFF9F4" strokeWidth="2" />
            <path d="M80 55 C85 45, 97 46, 95 54 C90 58, 84 58, 80 55Z" fill="#6D9B78" />
          </g>
        );
      case 'avocado':
        return (
          <g>
            <circle cx="80" cy="80" r="46" fill="#F5F1FB" />
            <path d="M80 42 C96 42, 108 66, 108 86 C108 106, 96 118, 80 118 C64 118, 52 106, 52 86 C52 66, 64 42, 80 42Z" fill="#7EA67B" />
            <path d="M80 48 C93 48, 102 68, 102 86 C102 102, 92 112, 80 112 C68 112, 58 102, 58 86 C58 68, 67 48, 80 48Z" fill="#E6EED4" />
            <circle cx="80" cy="90" r="14" fill="#B57558" />
            <circle cx="76" cy="86" r="4" fill="#D0977D" />
          </g>
        );
      case 'mango':
        return (
          <g>
            <circle cx="80" cy="80" r="48" fill="#FFF3EA" />
            <path d="M82 40 C104 42, 114 68, 104 94 C96 114, 72 120, 58 106 C46 94, 52 62, 68 46 C73 41, 77 40, 82 40Z" fill="#F4A26E" />
            <path d="M80 40 C86 30, 96 32, 98 38" stroke="#6D9B78" strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="73" cy="70" rx="6" ry="12" transform="rotate(-18 73 70)" fill="#F9C5A2" />
          </g>
        );
      case 'squash':
        return (
          <g>
            <circle cx="80" cy="80" r="50" fill="#F5F1FB" />
            <ellipse cx="80" cy="84" rx="28" ry="36" fill="#9E82C8" />
            <ellipse cx="80" cy="84" rx="18" ry="34" fill="#B79EDD" />
            <path d="M80 48 V38 C80 35, 86 35, 87 38" stroke="#5F8D6B" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </g>
        );
      case 'melon':
      default:
        return (
          <g>
            <circle cx="80" cy="80" r="52" fill="#FCE7EE" />
            <circle cx="80" cy="82" r="38" fill="#77A384" />
            <path d="M56 54 Q66 82 56 110 M80 44 V120 M104 54 Q94 82 104 110" stroke="#4D7859" strokeWidth="3" fill="none" />
            <circle cx="80" cy="82" r="28" fill="#E97D96" opacity="0.22" />
          </g>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-[#FFFDFB] border border-[#EDE1E5] p-5">
      <svg
        viewBox="0 0 160 160"
        className="w-36 h-36"
        role="img"
        aria-label={`Week ${week} baby size comparison: ${sizeLabel}`}
      >
        <circle cx="80" cy="80" r="68" fill="none" stroke="#EFE4E8" strokeWidth="1.5" strokeDasharray="4 4" />
        {renderShape()}
      </svg>
      <p className="mt-2 text-xs text-[#6E5C6B] font-medium">Baby’s Size in Week {week}</p>
      <p className="text-lg font-semibold text-[#231B24] font-editorial">{sizeLabel}</p>
    </div>
  );
};
