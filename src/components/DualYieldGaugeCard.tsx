import React, { useMemo } from 'react';
import { ProductionRow } from '../types';

interface DualYieldGaugeCardProps {
  rows: ProductionRow[];
  isEmpty: boolean;
}

export const DualYieldGaugeCard: React.FC<DualYieldGaugeCardProps> = ({ rows, isEmpty }) => {
  // Semi-circle gauge geometry settings
  const radius = 85;
  const strokeWidth = 22;
  const circumference = Math.PI * radius; // ~267.035

  const stats = useMemo(() => {
    if (isEmpty || rows.length === 0) {
      return {
        avgTeoritis: 0,
        avgOracle: 0,
        l1Teoritis: 0,
        l1Oracle: 0,
        l2Teoritis: 0,
        l2Oracle: 0,
        l4Teoritis: 0,
        l4Oracle: 0,
      };
    }

    const calcAvg = (arr: ProductionRow[], key: 'YieldTeoritis' | 'YieldOracle') => {
      const valid = arr.map((r) => r[key] || 0).filter((v) => v > 0);
      return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
    };

    const l1 = rows.filter((r) => r.Line === 'Line 1');
    const l2 = rows.filter((r) => r.Line === 'Line 2');
    const l4 = rows.filter((r) => r.Line === 'Line 4');

    return {
      avgTeoritis: calcAvg(rows, 'YieldTeoritis'),
      avgOracle: calcAvg(rows, 'YieldOracle'),
      l1Teoritis: calcAvg(l1, 'YieldTeoritis'),
      l1Oracle: calcAvg(l1, 'YieldOracle'),
      l2Teoritis: calcAvg(l2, 'YieldTeoritis'),
      l2Oracle: calcAvg(l2, 'YieldOracle'),
      l4Teoritis: calcAvg(l4, 'YieldTeoritis'),
      l4Oracle: calcAvg(l4, 'YieldOracle'),
    };
  }, [rows, isEmpty]);

  const formatPercent = (val: number) => {
    if (isEmpty || val === 0) return '--%';
    return `${val.toFixed(2).replace('.', ',')}%`;
  };

  const renderGaugeArc = (val: number, strokeColor: string, label: string) => {
    // 0 to 100% scale
    const clamped = Math.max(0, Math.min(100, val));
    const fraction = isEmpty ? 0 : clamped / 100;
    const strokeDashoffset = circumference * (1 - fraction);

    return (
      <svg
        viewBox="0 0 240 140"
        className="w-full h-full overflow-visible"
      >
        {/* Background Arc */}
        <path
          d="M 35 115 A 85 85 0 0 1 205 115"
          fill="none"
          stroke="currentColor"
          className="text-gray-200 dark:text-neutral-800"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Colored Active Arc */}
        {!isEmpty && clamped > 0 && (
          <path
            d="M 35 115 A 85 85 0 0 1 205 115"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        )}

        {/* Center Label Text - Scaled precisely inside SVG so it never touches or overlaps the gauge arc */}
        {label === '% Yield to Standar Teoritis PPI' ? (
          <>
            <text
              x="120"
              y="64"
              textAnchor="middle"
              fill="#6B7280"
              className="dark:fill-neutral-400 select-none font-sans"
              fontSize="8"
              fontWeight="bold"
            >
              % Yield to Standar
            </text>
            <text
              x="120"
              y="75"
              textAnchor="middle"
              fill="#6B7280"
              className="dark:fill-neutral-400 select-none font-sans"
              fontSize="8"
              fontWeight="bold"
            >
              Teoritis PPI
            </text>
          </>
        ) : (
          <text
            x="120"
            y="70"
            textAnchor="middle"
            fill="#6B7280"
            className="dark:fill-neutral-400 select-none font-sans"
            fontSize="8.5"
            fontWeight="bold"
          >
            {label}
          </text>
        )}

        {/* Center Percentage Value inside SVG */}
        <text
          x="120"
          y="104"
          textAnchor="middle"
          fill="#111827"
          className="dark:fill-white select-none font-mono"
          fontSize="24"
          fontWeight="800"
        >
          {formatPercent(val)}
        </text>

        {/* 0% Start Tick Label */}
        <text
          x="35"
          y="134"
          textAnchor="middle"
          fill="#9CA3AF"
          fontSize="11"
          fontWeight="bold"
          fontFamily="'JetBrains Mono', monospace"
        >
          0%
        </text>

        {/* 100% End Tick Label */}
        <text
          x="205"
          y="134"
          textAnchor="middle"
          fill="#9CA3AF"
          fontSize="11"
          fontWeight="bold"
          fontFamily="'JetBrains Mono', monospace"
        >
          100%
        </text>
      </svg>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
      {/* Card 1: Yield to Teoritis PPI */}
      <div className="bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors flex flex-col justify-between">
        {/* Header Title */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h3 className="text-lg sm:text-xl md:text-[22px] font-black text-gray-900 dark:text-white leading-snug">
              Capaian Yield Produksi (Yield to Teoritis PPI)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Komparasi total output terhadap target formulasi teoritis PPI
            </p>
          </div>
        </div>

        {/* Speedometer Gauge Visual */}
        <div className="relative w-full max-w-[270px] h-[150px] mx-auto flex items-end justify-center my-1 select-none">
          {renderGaugeArc(stats.avgTeoritis, '#00E5FF', '% Yield to Standar Teoritis PPI')}
        </div>

        {/* 3 Line Summary Boxes */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
          {/* Line 1 */}
          <div className="bg-white dark:bg-[#202025] border border-gray-200 dark:border-neutral-700/80 border-b-2 border-b-blue-500 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
              % Line 1
            </span>
            <b className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-mono tabular-nums block">
              {formatPercent(stats.l1Teoritis)}
            </b>
          </div>

          {/* Line 2 */}
          <div className="bg-white dark:bg-[#202025] border border-gray-200 dark:border-neutral-700/80 border-b-2 border-b-purple-500 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block mb-0.5">
              % Line 2
            </span>
            <b className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-mono tabular-nums block">
              {formatPercent(stats.l2Teoritis)}
            </b>
          </div>

          {/* Line 4 */}
          <div className="bg-white dark:bg-[#202025] border border-gray-200 dark:border-neutral-700/80 border-b-2 border-b-amber-500 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
              % Line 4
            </span>
            <b className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-mono tabular-nums block">
              {formatPercent(stats.l4Teoritis)}
            </b>
          </div>
        </div>
      </div>

      {/* Card 2: Yield to Standar (Oracle) */}
      <div className="bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors flex flex-col justify-between">
        {/* Header Title */}
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h3 className="text-lg sm:text-xl md:text-[22px] font-black text-gray-900 dark:text-white leading-snug">
              Capaian Yield Produksi (Yield to Standar)
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Komparasi total output terhadap standar yield resmi Oracle
            </p>
          </div>
        </div>

        {/* Speedometer Gauge Visual */}
        <div className="relative w-full max-w-[270px] h-[150px] mx-auto flex items-end justify-center my-1 select-none">
          {renderGaugeArc(stats.avgOracle, '#FF007F', '% Yield to Standar')}
        </div>

        {/* 3 Line Summary Boxes */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800">
          {/* Line 1 */}
          <div className="bg-white dark:bg-[#202025] border border-gray-200 dark:border-neutral-700/80 border-b-2 border-b-blue-500 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
              % Line 1
            </span>
            <b className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-mono tabular-nums block">
              {formatPercent(stats.l1Oracle)}
            </b>
          </div>

          {/* Line 2 */}
          <div className="bg-white dark:bg-[#202025] border border-gray-200 dark:border-neutral-700/80 border-b-2 border-b-purple-500 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 block mb-0.5">
              % Line 2
            </span>
            <b className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-mono tabular-nums block">
              {formatPercent(stats.l2Oracle)}
            </b>
          </div>

          {/* Line 4 */}
          <div className="bg-white dark:bg-[#202025] border border-gray-200 dark:border-neutral-700/80 border-b-2 border-b-amber-500 rounded-lg p-2.5 text-center shadow-2xs">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block mb-0.5">
              % Line 4
            </span>
            <b className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white font-mono tabular-nums block">
              {formatPercent(stats.l4Oracle)}
            </b>
          </div>
        </div>
      </div>
    </div>
  );
};
