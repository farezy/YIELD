import React, { useState, useMemo } from 'react';
import { ProductionRow } from '../types';
import { AlertTriangle, Percent, Hash } from 'lucide-react';

interface DefectExplorerCardProps {
  rows: ProductionRow[];
  isEmpty: boolean;
  onOpenSopModal?: () => void;
}

export const DefectExplorerCard: React.FC<DefectExplorerCardProps> = ({
  rows,
  isEmpty,
}) => {
  const [selectedLine, setSelectedLine] = useState<'all' | 'Line 1' | 'Line 2' | 'Line 4'>('all');
  const [viewMode, setViewMode] = useState<'percent' | 'bag'>('percent');

  const filteredRows = useMemo(() => {
    if (selectedLine === 'all') return rows;
    return rows.filter((r) => r.Line === selectedLine);
  }, [rows, selectedLine]);

  // Counts per line for badges in filter buttons
  const countsByLine = useMemo(() => {
    const c1 = rows.filter((r) => r.Line === 'Line 1').length;
    const c2 = rows.filter((r) => r.Line === 'Line 2').length;
    const c4 = rows.filter((r) => r.Line === 'Line 4').length;
    return { all: rows.length, L1: c1, L2: c2, L4: c4 };
  }, [rows]);

  if (isEmpty || rows.length === 0) return null;

  // Calculate totals from filteredRows
  const totalBatchSizeTeoritis = filteredRows.reduce(
    (sum, r) => sum + (r.BatchSizeBag || r.StandarTeoritis || 0),
    0
  );

  const totalCritical = filteredRows.reduce((sum, r) => sum + (r.rejectCriticalTotal || 0), 0);
  const totalMinor = filteredRows.reduce((sum, r) => sum + (r.rejectMinorTotal || 0), 0);
  const totalProbe = filteredRows.reduce((sum, r) => sum + (r.probeCount || 0), 0);
  const totalLeakTest = filteredRows.reduce((sum, r) => sum + (r.leakTestCount || 0), 0);
  const totalAfkir = filteredRows.reduce((sum, r) => sum + (r.afkirKemas || 0), 0);

  const totalAllReject = totalCritical + totalMinor + totalProbe + totalLeakTest + totalAfkir;

  const totalPp = filteredRows.reduce((sum, r) => sum + (r.defectPp || 0), 0);
  const totalSe = filteredRows.reduce((sum, r) => sum + (r.defectSe || 0), 0);
  const totalBc = filteredRows.reduce((sum, r) => sum + (r.defectBc || 0), 0);
  const totalPh = filteredRows.reduce((sum, r) => sum + (r.defectPh || 0), 0);
  const totalPw = filteredRows.reduce((sum, r) => sum + (r.defectPw || 0), 0);

  // Minor Defect Totals from Sheet
  const totalPr = filteredRows.reduce((sum, r) => sum + (r.defectPr || 0), 0);
  const totalDe = filteredRows.reduce((sum, r) => sum + (r.defectDe || 0), 0);
  const totalVi = filteredRows.reduce((sum, r) => sum + (r.defectVi || 0), 0);
  const totalSt = filteredRows.reduce((sum, r) => sum + (r.defectSt || 0), 0);
  const totalRp = filteredRows.reduce((sum, r) => sum + (r.defectRp || 0), 0);
  const totalTb = filteredRows.reduce((sum, r) => sum + (r.defectTb || 0), 0);
  const totalKr = filteredRows.reduce((sum, r) => sum + (r.defectKr || 0), 0);
  const totalPb = filteredRows.reduce((sum, r) => sum + (r.defectPb || 0), 0);
  const totalLl = filteredRows.reduce((sum, r) => sum + (r.defectLl || 0), 0);

  const calcPct = (val: number, base: number) => {
    if (!base || base === 0 || val === 0) return '0,00%';
    const pct = (val / base) * 100;
    if (pct > 0 && pct < 0.01) {
      return `${pct.toFixed(3).replace('.', ',')}%`;
    }
    return `${pct.toFixed(2).replace('.', ',')}%`;
  };

  const isPercent = viewMode === 'percent';

  return (
    <div className="bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-800 rounded-xl p-4 sm:p-5 shadow-xs transition-colors space-y-4">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-gray-100 dark:border-neutral-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 dark:text-white">
              Eksplorasi Defect & Rejection Hasil Link Sheet
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              Rekapitulasi dari {filteredRows.length} Batch Produksi Terdaftar{selectedLine !== 'all' ? ` (${selectedLine})` : ''} • Total Rejection: {totalAllReject.toLocaleString('id-ID')} bag • Batch Size Teoritis: {totalBatchSizeTeoritis.toLocaleString('id-ID')} bag
            </p>
          </div>
        </div>

        {/* Filter Per Line & Toggle View Mode */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Filter Per Line */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#222228] rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedLine('all')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedLine === 'all'
                  ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Semua Line ({countsByLine.all})
            </button>
            <button
              type="button"
              onClick={() => setSelectedLine('Line 1')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedLine === 'Line 1'
                  ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Line 1 ({countsByLine.L1})
            </button>
            <button
              type="button"
              onClick={() => setSelectedLine('Line 2')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedLine === 'Line 2'
                  ? 'bg-[#7E22CE] text-white shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Line 2 ({countsByLine.L2})
            </button>
            <button
              type="button"
              onClick={() => setSelectedLine('Line 4')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                selectedLine === 'Line 4'
                  ? 'bg-[#D97706] text-white shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Line 4 ({countsByLine.L4})
            </button>
          </div>

          {/* Toggle View Mode: Persentase (%) vs Jumlah (Bag) */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#222228] rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('percent')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                isPercent
                  ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Persentase (%)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bag')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                !isPercent
                  ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Jumlah (Bag)</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {/* 1. Visual Critical */}
        <div className="bg-[#FFF5F5] dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg p-3 text-center transition-all">
          <span className="text-[11px] font-bold text-red-700 dark:text-red-400 block mb-0.5">
            Total Reject Visual Critical
          </span>
          <b className="text-xl sm:text-2xl font-extrabold text-red-600 dark:text-red-300 font-mono tabular-nums block">
            {isPercent ? calcPct(totalCritical, totalBatchSizeTeoritis) : `${totalCritical} bag`}
          </b>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5 font-mono">
            {isPercent ? `${totalCritical} bag` : calcPct(totalCritical, totalBatchSizeTeoritis)} • Pp, Ph, Pw, Se, Bc
          </span>
        </div>

        {/* 2. Visual Minor */}
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 text-center transition-all">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-0.5">
            Total Reject Visual Minor
          </span>
          <b className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-300 font-mono tabular-nums block">
            {isPercent ? calcPct(totalMinor, totalBatchSizeTeoritis) : `${totalMinor} bag`}
          </b>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5 font-mono">
            {isPercent ? `${totalMinor} bag` : calcPct(totalMinor, totalBatchSizeTeoritis)} • Minor Visual
          </span>
        </div>

        {/* 3. Produk Ditusuk Probe */}
        <div className="bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 rounded-lg p-3 text-center transition-all">
          <span className="text-[11px] font-bold text-purple-700 dark:text-purple-400 block mb-0.5">
            Produk Ditusuk Probe
          </span>
          <b className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-300 font-mono tabular-nums block">
            {isPercent ? calcPct(totalProbe, totalBatchSizeTeoritis) : `${totalProbe} bag`}
          </b>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5 font-mono">
            {isPercent ? `${totalProbe} bag` : calcPct(totalProbe, totalBatchSizeTeoritis)} • Uji Probe
          </span>
        </div>

        {/* 4. Leak Test */}
        <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3 text-center transition-all">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 block mb-0.5">
            Leak Test
          </span>
          <b className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-300 font-mono tabular-nums block">
            {isPercent ? calcPct(totalLeakTest, totalBatchSizeTeoritis) : `${totalLeakTest} bag`}
          </b>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5 font-mono">
            {isPercent ? `${totalLeakTest} bag` : calcPct(totalLeakTest, totalBatchSizeTeoritis)} • Leak Test
          </span>
        </div>

        {/* 5. Afkir Kemas */}
        <div className="bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 rounded-lg p-3 text-center transition-all">
          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-0.5">
            Afkir Kemas
          </span>
          <b className="text-xl sm:text-2xl font-extrabold text-gray-800 dark:text-gray-100 font-mono tabular-nums block">
            {isPercent ? calcPct(totalAfkir, totalBatchSizeTeoritis) : `${totalAfkir} bag`}
          </b>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5 font-mono">
            {isPercent ? `${totalAfkir} bag` : calcPct(totalAfkir, totalBatchSizeTeoritis)} • Afkir Kemas
          </span>
        </div>
      </div>

      {/* Critical Defect Code Breakdown - Matching exact Sheet column names */}
      <div className="bg-gray-50 dark:bg-[#202025] border border-gray-200 dark:border-neutral-800 rounded-lg p-3">
        <div className="flex items-center justify-between flex-wrap gap-1 pb-1.5 mb-2 border-b border-gray-200 dark:border-neutral-700/60">
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
            Rincian Total Reject Critical (Pp, Ph, Pw, Se, Bc):
          </span>
          <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
            Total: {totalCritical.toLocaleString('id-ID')} bag critical • Basis Teoritis: {totalBatchSizeTeoritis.toLocaleString('id-ID')} bag
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
          <div className="bg-white dark:bg-[#1A1A1E] p-2.5 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">Pp (Partikel Plastik)</span>
            <b className="text-base text-red-600 dark:text-red-400 block mt-0.5">
              {isPercent ? calcPct(totalPp, totalBatchSizeTeoritis) : `${totalPp} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalPp} bag` : calcPct(totalPp, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2.5 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">Ph (Partikel Hitam)</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalPh, totalBatchSizeTeoritis) : `${totalPh} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalPh} bag` : calcPct(totalPh, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2.5 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">Pw (Partikel Warna)</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalPw, totalBatchSizeTeoritis) : `${totalPw} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalPw} bag` : calcPct(totalPw, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2.5 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">Se (Sealing Defect)</span>
            <b className="text-base text-red-600 dark:text-red-400 block mt-0.5">
              {isPercent ? calcPct(totalSe, totalBatchSizeTeoritis) : `${totalSe} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalSe} bag` : calcPct(totalSe, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2.5 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">Bc (Bocor)</span>
            <b className="text-base text-red-600 dark:text-red-400 block mt-0.5">
              {isPercent ? calcPct(totalBc, totalBatchSizeTeoritis) : `${totalBc} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalBc} bag` : calcPct(totalBc, totalBatchSizeTeoritis)}
            </span>
          </div>
        </div>
      </div>

      {/* Minor Defect Code Breakdown - Matching exact Sheet column names */}
      <div className="bg-gray-50 dark:bg-[#202025] border border-gray-200 dark:border-neutral-800 rounded-lg p-3">
        <div className="flex items-center justify-between flex-wrap gap-1 pb-1.5 mb-2 border-b border-gray-200 dark:border-neutral-700/60">
          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
            Rincian Total Reject Minor (Pr, De, VI, St, Rp, Tb, Kr, Pb, LL):
          </span>
          <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
            Total: {totalMinor.toLocaleString('id-ID')} bag minor • Basis Teoritis: {totalBatchSizeTeoritis.toLocaleString('id-ID')} bag
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 text-xs font-mono">
          <div className="bg-white dark:bg-[#1A1A1E] p-2 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">Pr</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalPr, totalBatchSizeTeoritis) : `${totalPr} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalPr} bag` : calcPct(totalPr, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">De</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalDe, totalBatchSizeTeoritis) : `${totalDe} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalDe} bag` : calcPct(totalDe, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">VI</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalVi, totalBatchSizeTeoritis) : `${totalVi} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalVi} bag` : calcPct(totalVi, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">St</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalSt, totalBatchSizeTeoritis) : `${totalSt} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalSt} bag` : calcPct(totalSt, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">Rp</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalRp, totalBatchSizeTeoritis) : `${totalRp} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalRp} bag` : calcPct(totalRp, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">Tb</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalTb, totalBatchSizeTeoritis) : `${totalTb} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalTb} bag` : calcPct(totalTb, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">Kr</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalKr, totalBatchSizeTeoritis) : `${totalKr} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalKr} bag` : calcPct(totalKr, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">Pb</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalPb, totalBatchSizeTeoritis) : `${totalPb} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalPb} bag` : calcPct(totalPb, totalBatchSizeTeoritis)}
            </span>
          </div>

          <div className="bg-white dark:bg-[#1A1A1E] p-2 rounded-md border border-gray-200 dark:border-neutral-700 text-center sm:text-left">
            <span className="text-gray-700 dark:text-gray-300 font-bold block text-xs truncate">LL</span>
            <b className="text-base text-amber-600 dark:text-amber-400 block mt-0.5">
              {isPercent ? calcPct(totalLl, totalBatchSizeTeoritis) : `${totalLl} bag`}
            </b>
            <span className="text-[10px] text-gray-400 block">
              {isPercent ? `${totalLl} bag` : calcPct(totalLl, totalBatchSizeTeoritis)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
