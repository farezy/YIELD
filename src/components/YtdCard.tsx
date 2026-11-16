import React from 'react';
import { Calendar } from 'lucide-react';

interface YtdCardProps {
  line1Yield: number; // e.g. 94.13
  line2Yield: number; // e.g. 100.59
  line4Yield: number; // e.g. 100.04
  isEmpty: boolean;
}

export const YtdCard: React.FC<YtdCardProps> = ({
  line1Yield,
  line2Yield,
  line4Yield,
  isEmpty,
}) => {
  // Scale range for bar width: 0 to 105% (or 0 to 110%)
  const maxScale = 105;

  const lines = [
    {
      name: 'Line 1',
      yieldVal: line1Yield,
      color: '#2563EB', // Blue matching Gambar 1
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    },
    {
      name: 'Line 2',
      yieldVal: line2Yield,
      color: '#7C3AED', // Purple matching Gambar 1
      badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    },
    {
      name: 'Line 4',
      yieldVal: line4Yield,
      color: '#D97706', // Amber/Orange matching Gambar 1
      badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between shadow-xs transition-colors space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-gray-800 dark:text-gray-100 font-bold">
          <Calendar className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h3 className="text-lg sm:text-xl md:text-[22px] font-black tracking-tight">YTD 2026</h3>
        </div>
        <span className="text-xs text-gray-400 dark:text-neutral-500 font-mono">
          Per Line (Dari Sheet)
        </span>
      </div>

      {/* 3 Horizontal Line Progress Bars */}
      <div className="flex flex-col justify-center gap-3.5 my-auto">
        {lines.map((item) => {
          const val = isEmpty ? 0 : item.yieldVal;
          const displayVal = isEmpty ? '0,00%' : `${val.toFixed(2).replace('.', ',')}%`;
          const barWidthPercent = isEmpty ? 0 : Math.min(100, Math.max(0, (val / maxScale) * 100));

          return (
            <div key={item.name} className="flex items-center gap-3">
              {/* Line Label Pill */}
              <div className="w-20 sm:w-24 shrink-0 py-2 px-3 rounded-md bg-gray-100 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700/80 text-gray-900 dark:text-white font-bold text-sm text-center select-none shadow-2xs">
                {item.name}
              </div>

              {/* Progress Bar Container */}
              <div className="flex-1 h-9 bg-gray-100 dark:bg-[#222228] rounded-md overflow-hidden relative border border-gray-200/70 dark:border-neutral-700/50 flex items-center">
                {/* 100% Target Reference Marker Line */}
                <div 
                  className="absolute top-0 bottom-0 w-[1.5px] bg-red-400/70 dark:bg-red-500/70 z-10"
                  style={{ left: `${(100 / maxScale) * 100}%` }}
                  title="Target 100%"
                />

                {/* Animated Filled Progress Bar */}
                <div
                  className="h-full rounded-sm transition-all duration-700 ease-out flex items-center justify-end pr-2"
                  style={{
                    width: `${barWidthPercent}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>

              {/* Percentage Value on Right */}
              <div className="w-16 sm:w-20 text-right font-extrabold text-base sm:text-lg text-gray-900 dark:text-white font-mono tabular-nums">
                {displayVal}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footnote scale info */}
      <div className="flex justify-between items-center text-[11px] text-gray-400 dark:text-neutral-500 pt-1 border-t border-gray-100 dark:border-neutral-800/80">
        <span>Skala: 0% — 105%</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E53935] inline-block shrink-0" />
          Garis Merah: Target 100%
        </span>
      </div>
    </div>
  );
};
