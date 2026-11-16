import React from 'react';

export const FimaLogo: React.FC<{ className?: string }> = ({ className = 'h-14' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* High-fidelity Vector SVG of FIMA INTERNASIONAL - A Kalbe Company */}
      <svg
        viewBox="0 0 240 70"
        className="h-full w-auto max-h-16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="FIMA INTERNASIONAL A Kalbe Company"
      >
        {/* 'fima' wordmark */}
        <g>
          {/* letter 'f' */}
          <path
            d="M20 18 C14 18 10 22 10 28 L10 44 L16 44 L16 32 C16 26 18 24 22 24 L24 24 L24 18 Z"
            fill="#0D2E68"
            className="dark:fill-blue-400"
          />
          <rect x="6" y="27" width="18" height="5.5" rx="1.5" fill="#0D2E68" className="dark:fill-blue-400" />
          
          {/* letter 'i' stem */}
          <rect x="29" y="27" width="6.5" height="17" rx="1.5" fill="#0D2E68" className="dark:fill-blue-400" />
          
          {/* droplet as the dot of 'i' */}
          <path
            d="M32.25 15.5 C32.25 15.5 28 20.5 28 23 C28 25.3 29.9 27.2 32.25 27.2 C34.6 27.2 36.5 25.3 36.5 23 C36.5 20.5 32.25 15.5 32.25 15.5 Z"
            fill="#00B0FF"
          />

          {/* letter 'm' */}
          <path
            d="M40 27 L46 27 L46 30 C47.5 27.8 50.2 26.6 53 26.6 C55.8 26.6 58.2 27.8 59.5 30.2 C61.2 27.8 64 26.6 67 26.6 C71.5 26.6 74 29.5 74 34.5 L74 44 L68 44 L68 35.5 C68 32.5 66.8 31.5 64.5 31.5 C62.2 31.5 60.5 33 60.5 36 L60.5 44 L54.5 44 L54.5 35.5 C54.5 32.5 53.3 31.5 51 31.5 C48.7 31.5 46.5 33 46.5 36.5 L46.5 44 L40 44 Z"
            fill="#0D2E68"
            className="dark:fill-blue-400"
          />

          {/* letter 'a' */}
          <path
            d="M87 26.6 C81.5 26.6 77 30.5 77 36 C77 41.5 81.5 45.2 87 45.2 C89.8 45.2 92.5 43.8 94 41.5 L94 44.5 L99.5 44.5 L99.5 34 C99.5 29 95.5 26.6 87 26.6 Z M87.8 40.2 C84.8 40.2 83 38.5 83 36 C83 33.5 84.8 31.8 87.8 31.8 C90.8 31.8 93.5 33.5 93.5 36 C93.5 38.5 90.8 40.2 87.8 40.2 Z"
            fill="#0D2E68"
            className="dark:fill-blue-400"
          />
        </g>

        {/* 'INTERNASIONAL' in red */}
        <text
          x="7"
          y="54"
          fill="#D32F2F"
          className="dark:fill-red-500"
          fontFamily="Arial, 'Plus Jakarta Sans', sans-serif"
          fontWeight="800"
          fontSize="9.5"
          letterSpacing="1.2"
        >
          INTERNASIONAL
        </text>

        {/* 'A Kalbe Company' */}
        <text
          x="7"
          y="64"
          fill="#64748B"
          className="dark:fill-slate-400"
          fontFamily="Arial, 'Plus Jakarta Sans', sans-serif"
          fontWeight="500"
          fontSize="7.5"
        >
          A Kalbe Company
        </text>
      </svg>
    </div>
  );
};
