import React from 'react';
import { Gauge } from 'lucide-react';

interface GaugeCardProps {
  value: number; // e.g. 97.22, or 0 if empty
  isEmpty: boolean;
  target?: number;
}

export const GaugeCard: React.FC<GaugeCardProps> = ({ value, isEmpty, target = 100 }) => {
  // Semi-circle gauge geometry
  // Range is 0 to 120%
  const maxScale = 120;
  const clampedVal = Math.max(0, Math.min(maxScale, value));
  
  // Angle from -180 deg to 0 deg
  const percentFraction = isEmpty ? 0 : clampedVal / maxScale;
  
  // SVG arc calculation for semi-circle
  // Radius = 90, Center = (110, 110)
  const radius = 80;
  const strokeWidth = 24;
  const circumference = Math.PI * radius; // half circle length
  const strokeDashoffset = circumference - percentFraction * circumference;

  // Format value for display
  const displayVal = isEmpty ? '--%' : `${value.toFixed(2).replace('.', ',')}%`;

  return (
    <div className="bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-between shadow-xs transition-colors h-[270px]">
      {/* Title */}
      <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100 font-bold text-base sm:text-lg">
        <Gauge className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        <h3>Rata-Rata Yield Produksi</h3>
      </div>

      {/* Speedometer Gauge Visual */}
      <div className="relative w-full max-w-[260px] h-[140px] flex items-end justify-center overflow-hidden">
        <svg
          viewBox="0 0 220 120"
          className="w-full h-full overflow-visible"
        >
          {/* Background Arc */}
          <path
            d="M 25 110 A 85 85 0 0 1 195 110"
            fill="none"
            stroke="currentColor"
            className="text-gray-200 dark:text-neutral-700"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Active Colored Arc */}
          {!isEmpty && clampedVal > 0 && (
            <path
              d="M 25 110 A 85 85 0 0 1 195 110"
              fill="none"
              stroke="#2196F3"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={Math.PI * 85}
              strokeDashoffset={(Math.PI * 85) * (1 - percentFraction)}
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Target 100% tick indicator */}
          {(() => {
            const targetAngle = Math.PI * (1 - target / maxScale);
            const x1 = 110 + 72 * Math.cos(targetAngle);
            const y1 = 110 - 72 * Math.sin(targetAngle);
            const x2 = 110 + 98 * Math.cos(targetAngle);
            const y2 = 110 - 98 * Math.sin(targetAngle);
            return (
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#E53935"
                strokeWidth="2.5"
                strokeDasharray="2 1"
              />
            );
          })()}
        </svg>

        {/* Center Readout Text */}
        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center justify-center text-center">
          <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight font-mono">
            {displayVal}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
            Target: 100%
          </span>
        </div>
      </div>

      {/* Target & Status footnote */}
      <div className="w-full flex justify-between items-center text-[11px] text-gray-400 dark:text-neutral-500 px-2 pt-1 border-t border-gray-100 dark:border-neutral-800/80">
        <span>Min: 0%</span>
        <span>Std CPOB: 98% - 102%</span>
        <span>Max: 120%</span>
      </div>
    </div>
  );
};
