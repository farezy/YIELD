import React, { useState, useMemo } from 'react';
import { BarChart3, Calendar, Filter } from 'lucide-react';
import { MonthlyStats, ProductionRow } from '../types';

interface MonthlyChartCardProps {
  monthly: MonthlyStats;
  rows?: ProductionRow[];
  isEmpty: boolean;
  darkMode: boolean;
  activeBasisLabel?: string;
}

const MONTH_NAMES = [
  { key: 'jan', label: 'Januari', short: 'Jan' },
  { key: 'feb', label: 'Februari', short: 'Feb' },
  { key: 'mar', label: 'Maret', short: 'Mar' },
  { key: 'apr', label: 'April', short: 'Apr' },
  { key: 'may', label: 'Mei', short: 'Mei' },
  { key: 'jun', label: 'Juni', short: 'Jun' },
  { key: 'jul', label: 'Juli', short: 'Jul' },
  { key: 'aug', label: 'Agustus', short: 'Agu' },
  { key: 'sep', label: 'September', short: 'Sep' },
  { key: 'oct', label: 'Oktober', short: 'Okt' },
  { key: 'nov', label: 'November', short: 'Nov' },
  { key: 'dec', label: 'Desember', short: 'Des' },
];

export const MonthlyChartCard: React.FC<MonthlyChartCardProps> = ({
  monthly,
  rows = [],
  isEmpty,
  darkMode,
  activeBasisLabel = 'Oracle',
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('nov');
  const [hoveredData, setHoveredData] = useState<{
    month: string;
    line: string;
    value: number;
    x: number;
    y: number;
  } | null>(null);

  const labels = monthly.labels?.length
    ? monthly.labels
    : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formatPercent = (val: number) => {
    if (val === 0) return '0,00%';
    return `${val.toFixed(2).replace('.', ',')}%`;
  };

  // Compute precise monthly averages from live sheet rows
  const monthlyDataMap = useMemo(() => {
    if (isEmpty || !rows || rows.length === 0) return [];

    return MONTH_NAMES.map((m, idx) => {
      const monthRows = rows.filter((r) => {
        const b = String(r.Bulan || '').toLowerCase().trim();
        return b === m.key || b === m.label.toLowerCase() || b.startsWith(m.key);
      });

      const count = monthRows.length;
      const sum = monthRows.reduce((acc, r) => acc + (r.Yield || 0), 0);
      const avgYield = count > 0 ? Number((sum / count).toFixed(2)) : 0;

      const l1Rows = monthRows.filter((r) => r.Line === 'Line 1');
      const sumL1 = l1Rows.reduce((acc, r) => acc + (r.Yield || 0), 0);
      const avgL1 = l1Rows.length > 0 ? Number((sumL1 / l1Rows.length).toFixed(2)) : 0;

      const l2Rows = monthRows.filter((r) => r.Line === 'Line 2');
      const sumL2 = l2Rows.reduce((acc, r) => acc + (r.Yield || 0), 0);
      const avgL2 = l2Rows.length > 0 ? Number((sumL2 / l2Rows.length).toFixed(2)) : 0;

      const l4Rows = monthRows.filter((r) => r.Line === 'Line 4');
      const sumL4 = l4Rows.reduce((acc, r) => acc + (r.Yield || 0), 0);
      const avgL4 = l4Rows.length > 0 ? Number((sumL4 / l4Rows.length).toFixed(2)) : 0;

      return {
        index: idx,
        key: m.key,
        label: m.label,
        short: m.short,
        count,
        avgYield,
        countL1: l1Rows.length,
        avgL1,
        countL2: l2Rows.length,
        avgL2,
        countL4: l4Rows.length,
        avgL4,
        hasData: count > 0,
      };
    });
  }, [rows, isEmpty]);

  // Overall average across all batches in the link
  const overallStats = useMemo(() => {
    if (isEmpty || rows.length === 0) {
      return { count: 0, avgYield: 0, avgL1: 0, countL1: 0, avgL2: 0, countL2: 0, avgL4: 0, countL4: 0 };
    }
    const totalCount = rows.length;
    const avgYield = Number((rows.reduce((s, r) => s + (r.Yield || 0), 0) / totalCount).toFixed(2));

    const l1 = rows.filter((r) => r.Line === 'Line 1');
    const avgL1 = l1.length > 0 ? Number((l1.reduce((s, r) => s + (r.Yield || 0), 0) / l1.length).toFixed(2)) : 0;

    const l2 = rows.filter((r) => r.Line === 'Line 2');
    const avgL2 = l2.length > 0 ? Number((l2.reduce((s, r) => s + (r.Yield || 0), 0) / l2.length).toFixed(2)) : 0;

    const l4 = rows.filter((r) => r.Line === 'Line 4');
    const avgL4 = l4.length > 0 ? Number((l4.reduce((s, r) => s + (r.Yield || 0), 0) / l4.length).toFixed(2)) : 0;

    return {
      count: totalCount,
      avgYield,
      avgL1,
      countL1: l1.length,
      avgL2,
      countL2: l2.length,
      avgL4,
      countL4: l4.length,
    };
  }, [rows, isEmpty]);

  // Find active stats based on filter
  const activeMonthStats = useMemo(() => {
    if (selectedMonth === 'all') {
      // Find month with data from link (defaulting to latest active month or overall)
      const monthsWithData = monthlyDataMap.filter((m) => m.hasData);
      if (monthsWithData.length === 1) {
        return {
          title: `Rata-Rata Bulan ${monthsWithData[0].label}`,
          subtitle: `${monthsWithData[0].count} batch dari link sheet`,
          avgYield: monthsWithData[0].avgYield,
          avgL1: monthsWithData[0].avgL1,
          countL1: monthsWithData[0].countL1,
          avgL2: monthsWithData[0].avgL2,
          countL2: monthsWithData[0].countL2,
          avgL4: monthsWithData[0].avgL4,
          countL4: monthsWithData[0].countL4,
          count: monthsWithData[0].count,
          hasData: true,
        };
      }
      return {
        title: 'Rata-Rata Seluruh Bulan',
        subtitle: `${overallStats.count} total batch dari link sheet`,
        avgYield: overallStats.avgYield,
        avgL1: overallStats.avgL1,
        countL1: overallStats.countL1,
        avgL2: overallStats.avgL2,
        countL2: overallStats.countL2,
        avgL4: overallStats.avgL4,
        countL4: overallStats.countL4,
        count: overallStats.count,
        hasData: overallStats.count > 0,
      };
    }

    const found = monthlyDataMap.find((m) => m.key === selectedMonth);
    if (!found) {
      return {
        title: 'Rata-Rata Bulanan',
        subtitle: 'Tidak ada data',
        avgYield: 0,
        avgL1: 0,
        countL1: 0,
        avgL2: 0,
        countL2: 0,
        avgL4: 0,
        countL4: 0,
        count: 0,
        hasData: false,
      };
    }

    return {
      title: `Rata-Rata Bulan ${found.label}`,
      subtitle: found.hasData ? `${found.count} batch dari link sheet` : 'Belum ada data pada link',
      avgYield: found.avgYield,
      avgL1: found.avgL1,
      countL1: found.countL1,
      avgL2: found.avgL2,
      countL2: found.countL2,
      avgL4: found.avgL4,
      countL4: found.countL4,
      count: found.count,
      hasData: found.hasData,
    };
  }, [selectedMonth, monthlyDataMap, overallStats]);

  // Check if all series are zero
  const hasData =
    !isEmpty &&
    (monthly.L1.some((v) => v > 0) ||
      monthly.L2.some((v) => v > 0) ||
      monthly.L4.some((v) => v > 0));

  // Chart dimensions & scaling
  const chartHeight = 220;
  const paddingLeft = 48;
  const paddingRight = 24;
  const paddingTop = 24;
  const paddingBottom = 35;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  // Y-axis scale: 0 to 110% (headroom above 100% for over-yielding batches)
  const yMin = 0;
  const yMax = 110;

  const getYCoord = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const ratio = (clamped - yMin) / (yMax - yMin);
    return paddingTop + (1 - ratio) * innerHeight;
  };

  const line1Color = '#2563EB'; // Blue
  const line2Color = '#7C3AED'; // Purple
  const line4Color = '#D97706'; // Amber

  return (
    <div className="bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors space-y-3.5">
      {/* Top Header Row with Title, Month Filter, and Legend */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-2.5 text-gray-900 dark:text-white font-bold">
          <BarChart3 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          <h3 className="text-lg sm:text-xl md:text-[22px] font-black tracking-tight">Performa Yield Bulanan (Jan - Des 2026)</h3>
        </div>

        {/* Filter Bulanan & Legend Controls */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Month Filter Selector */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 text-xs shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-gray-600 dark:text-gray-400">Filter Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white">
                Semua Bulan (Jan - Des)
              </option>
              {MONTH_NAMES.map((m) => {
                const info = monthlyDataMap.find((x) => x.key === m.key);
                return (
                  <option
                    key={m.key}
                    value={m.key}
                    className="bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white"
                  >
                    {m.label} {info && info.hasData ? `(${info.count} batch • ${info.avgYield.toFixed(2).replace('.', ',')}%)` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-bold select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#2563EB]" />
              <span className="text-gray-800 dark:text-gray-200">Line 1</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#7C3AED]" />
              <span className="text-gray-800 dark:text-gray-200">Line 2</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#D97706]" />
              <span className="text-gray-800 dark:text-gray-200">Line 4</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rata-Rata Perbulannya Sesuai Link Sheet */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Box 1: Rata-Rata Bulan Terpilih */}
        <div className="p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-center shadow-2xs transition-all">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block mb-0.5">
            {activeMonthStats.title}
          </span>
          <b className="text-base sm:text-lg font-extrabold font-mono text-blue-700 dark:text-blue-300 tabular-nums block">
            {activeMonthStats.hasData ? formatPercent(activeMonthStats.avgYield) : '--%'}
          </b>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block mt-0.5">
            {activeMonthStats.subtitle}
          </span>
        </div>

        {/* Box 2: Rata-Rata Line 1 */}
        <div className="p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 text-center shadow-2xs transition-all">
          <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 block mb-0.5">
            Rata-Rata Line 1
          </span>
          <b className="text-base sm:text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400 tabular-nums block">
            {activeMonthStats.countL1 > 0 ? formatPercent(activeMonthStats.avgL1) : '--%'}
          </b>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block mt-0.5">
            {activeMonthStats.countL1 > 0 ? `${activeMonthStats.countL1} batch` : '0 batch'}
          </span>
        </div>

        {/* Box 3: Rata-Rata Line 2 */}
        <div className="p-3 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/70 dark:border-purple-900/40 text-center shadow-2xs transition-all">
          <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block mb-0.5">
            Rata-Rata Line 2
          </span>
          <b className="text-base sm:text-lg font-extrabold font-mono text-purple-600 dark:text-purple-400 tabular-nums block">
            {activeMonthStats.countL2 > 0 ? formatPercent(activeMonthStats.avgL2) : '--%'}
          </b>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block mt-0.5">
            {activeMonthStats.countL2 > 0 ? `${activeMonthStats.countL2} batch` : '0 batch'}
          </span>
        </div>

        {/* Box 4: Rata-Rata Line 4 */}
        <div className="p-3 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-center shadow-2xs transition-all">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
            Rata-Rata Line 4
          </span>
          <b className="text-base sm:text-lg font-extrabold font-mono text-amber-600 dark:text-amber-400 tabular-nums block">
            {activeMonthStats.countL4 > 0 ? formatPercent(activeMonthStats.avgL4) : '--%'}
          </b>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block mt-0.5">
            {activeMonthStats.countL4 > 0 ? `${activeMonthStats.countL4} batch` : '0 batch'}
          </span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative w-full h-[250px] select-none pt-2">
        <svg
          viewBox={`0 0 920 ${chartHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Y-axis Ticks and Horizontal Gridlines (Clean evenly-spaced ticks: 100%, 75%, 50%, 25%, 0%) */}
          {[100, 75, 50, 25, 0].map((tick) => {
            const y = getYCoord(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={920 - paddingRight}
                  y2={y}
                  stroke={
                    tick === 100
                      ? darkMode
                        ? '#7f1d1d'
                        : '#fee2e2'
                      : darkMode
                      ? '#2A2A2E'
                      : '#F3F4F6'
                  }
                  strokeWidth={tick === 100 || tick === 0 ? '1.5' : '1'}
                  strokeDasharray={tick === 100 ? '4 3' : 'none'}
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill={darkMode ? '#9CA3AF' : '#6B7280'}
                  fontSize="11"
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="600"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Target 100% Label */}
          <text
            x={920 - paddingRight}
            y={getYCoord(100) - 4}
            textAnchor="end"
            fill="#EF4444"
            fontSize="10"
            fontWeight="bold"
            fontFamily="'JetBrains Mono', monospace"
          >
            TARGET 100%
          </text>

          {/* Grouped Bars per Month */}
          {hasData &&
            labels.map((month, idx) => {
              const availableWidth = 920 - paddingLeft - paddingRight;
              const slotWidth = availableWidth / labels.length;
              const slotX = paddingLeft + idx * slotWidth;

              // 3 bars per month slot
              const barWidth = Math.min(14, slotWidth / 4);
              const barGap = 2;
              const groupWidth = barWidth * 3 + barGap * 2;
              const startX = slotX + (slotWidth - groupWidth) / 2;

              const monthInfo = monthlyDataMap[idx];
              const valL1 = monthInfo && monthInfo.hasData ? monthInfo.avgL1 : (monthly.L1[idx] || 0);
              const valL2 = monthInfo && monthInfo.hasData ? monthInfo.avgL2 : (monthly.L2[idx] || 0);
              const valL4 = monthInfo && monthInfo.hasData ? monthInfo.avgL4 : (monthly.L4[idx] || 0);

              const bars = [
                { line: 'Line 1', val: valL1, color: line1Color },
                { line: 'Line 2', val: valL2, color: line2Color },
                { line: 'Line 4', val: valL4, color: line4Color },
              ];

              const isSelected = selectedMonth !== 'all' && MONTH_NAMES[idx]?.key === selectedMonth;
              const activeVals = bars.filter((b) => b.val > 0);
              const minBarY = activeVals.length > 0 ? Math.min(...activeVals.map((b) => getYCoord(b.val))) : 0;

              return (
                <g key={month}>
                  {/* Subtle Slot Highlight if selected */}
                  {isSelected && (
                    <rect
                      x={slotX + 1}
                      y={paddingTop}
                      width={slotWidth - 2}
                      height={innerHeight}
                      rx="6"
                      fill="#3B82F6"
                      fillOpacity={darkMode ? 0.16 : 0.08}
                      stroke="#3B82F6"
                      strokeWidth="1"
                      strokeDasharray="3 2"
                    />
                  )}

                  {/* Monthly Average Badge above bars */}
                  {monthInfo && monthInfo.hasData && minBarY > 0 && (
                    <g>
                      <rect
                        x={startX + groupWidth / 2 - 26}
                        y={Math.max(4, minBarY - 18)}
                        width="52"
                        height="14"
                        rx="3"
                        fill={darkMode ? '#1E293B' : '#EFF6FF'}
                        stroke={darkMode ? '#3B82F6' : '#93C5FD'}
                        strokeWidth="0.8"
                      />
                      <text
                        x={startX + groupWidth / 2}
                        y={Math.max(4, minBarY - 18) + 10}
                        textAnchor="middle"
                        fill={darkMode ? '#93C5FD' : '#1D4ED8'}
                        fontSize="8.5"
                        fontWeight="800"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {formatPercent(monthInfo.avgYield)}
                      </text>
                    </g>
                  )}

                  {bars.map((b, bIdx) => {
                    const bx = startX + bIdx * (barWidth + barGap);
                    const by = getYCoord(b.val);
                    const bHeight = Math.max(0, getYCoord(0) - by);

                    if (b.val <= 0) return null;

                    return (
                      <rect
                        key={b.line}
                        x={bx}
                        y={by}
                        width={barWidth}
                        height={bHeight}
                        fill={b.color}
                        rx="2"
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                        onMouseEnter={(e) => {
                          const rect = (e.target as SVGElement).getBoundingClientRect();
                          setHoveredData({
                            month,
                            line: b.line,
                            value: b.val,
                            x: rect.left + rect.width / 2,
                            y: rect.top - 8,
                          });
                        }}
                        onMouseLeave={() => setHoveredData(null)}
                      />
                    );
                  })}
                </g>
              );
            })}

          {/* X-axis Month Labels */}
          {labels.map((month, idx) => {
            const availableWidth = 920 - paddingLeft - paddingRight;
            const slotWidth = availableWidth / labels.length;
            const x = paddingLeft + idx * slotWidth + slotWidth / 2;
            const y = chartHeight - 12;

            const isSelected = selectedMonth !== 'all' && MONTH_NAMES[idx]?.key === selectedMonth;
            const isNov = month.toLowerCase() === 'nov';
            const isHighlighted = isSelected || (selectedMonth === 'all' && isNov);

            return (
              <text
                key={month}
                x={x}
                y={y}
                textAnchor="middle"
                fill={isHighlighted ? '#2563EB' : darkMode ? '#D1D5DB' : '#374151'}
                fontSize={isHighlighted ? '13' : '11'}
                fontWeight={isHighlighted ? '800' : '600'}
                fontFamily="system-ui, sans-serif"
                className="cursor-pointer"
                onClick={() => setSelectedMonth(MONTH_NAMES[idx]?.key || 'all')}
              >
                {month}
              </text>
            );
          })}
        </svg>

        {/* Empty State Banner (Matches Screenshot) */}
        {!hasData && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-12 pr-4 pb-6">
            <p className="text-sm sm:text-base italic text-gray-400 dark:text-gray-500 font-medium text-center bg-white/70 dark:bg-[#1A1A1E]/70 px-4 py-2 rounded-lg backdrop-blur-2xs">
              Belum ada data — hubungkan Google Sheet untuk menampilkan grafik bulanan
            </p>
          </div>
        )}

        {/* Floating Tooltip */}
        {hoveredData && (
          <div
            className="fixed z-50 transform -translate-x-1/2 -translate-y-full px-2.5 py-1.5 bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs rounded-md shadow-lg pointer-events-none font-mono"
            style={{ left: hoveredData.x, top: hoveredData.y }}
          >
            <div className="font-bold">{hoveredData.month} • {hoveredData.line}</div>
            <div>Yield: <span className="font-bold text-emerald-400 dark:text-emerald-700">{hoveredData.value.toFixed(2)}%</span></div>
          </div>
        )}
      </div>
    </div>
  );
};
