import React, { useState, useMemo } from 'react';
import { ProductionRow } from '../types';
import { Search, ArrowUpDown, ChevronDown, ChevronUp, Eye, Layers } from 'lucide-react';

interface ProductionTableCardProps {
  lineName: string; // "Line 1" | "Line 2" | "Line 4"
  badgeColorClass: string;
  tableThBgClass: string;
  standarHeaderLabel?: string;
  lineYield: number;
  rows: ProductionRow[];
  isEmpty: boolean;
  onSelectRow?: (row: ProductionRow) => void;
}

export const ProductionTableCard: React.FC<ProductionTableCardProps> = ({
  lineName,
  badgeColorClass,
  tableThBgClass,
  lineYield,
  rows,
  isEmpty,
  onSelectRow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | 'none'>('none');

  const formatPercent = (val: number) => {
    if (isEmpty || val === 0) return '--%';
    return `${val.toFixed(2).replace('.', ',')}%`;
  };

  // Metrics for this specific line
  const totalDikemas = useMemo(() => {
    if (isEmpty || rows.length === 0) return 0;
    return rows.reduce((sum, r) => sum + r.Jumlah, 0);
  }, [rows, isEmpty]);

  const totalReject = useMemo(() => {
    if (isEmpty || rows.length === 0) return 0;
    return rows.reduce(
      (sum, r) =>
        sum +
        (r.rejectCriticalTotal || 0) +
        (r.rejectMinorTotal || 0) +
        (r.probeCount || 0) +
        (r.leakTestCount || 0) +
        (r.afkirKemas || 0),
      0
    );
  }, [rows, isEmpty]);

  const totalAutoclave = useMemo(() => {
    if (isEmpty || rows.length === 0) return 0;
    return rows.reduce((sum, r) => sum + (r.AutoclaveOutput || 0), 0);
  }, [rows, isEmpty]);

  const totalRejectPercent = useMemo(() => {
    if (isEmpty || totalReject === 0) return 0;
    const base = totalAutoclave > 0 ? totalAutoclave : (totalDikemas + totalReject);
    if (base === 0) return 0;
    return Number(((totalReject / base) * 100).toFixed(2));
  }, [totalReject, totalAutoclave, totalDikemas, isEmpty]);

  const processedRows = useMemo(() => {
    if (isEmpty || rows.length === 0) return [];
    let list = rows.filter((r) => {
      const q = searchTerm.toLowerCase();
      return (
        r.BN.toLowerCase().includes(q) ||
        r.Produk.toLowerCase().includes(q)
      );
    });

    if (sortDirection === 'asc') {
      list = [...list].sort((a, b) => a.Yield - b.Yield);
    } else if (sortDirection === 'desc') {
      list = [...list].sort((a, b) => b.Yield - a.Yield);
    }
    return list;
  }, [rows, isEmpty, searchTerm, sortDirection]);

  const toggleSort = () => {
    setSortDirection((prev) => {
      if (prev === 'none') return 'desc';
      if (prev === 'desc') return 'asc';
      return 'none';
    });
  };

  // Distinctive color themes per line (Line 1 = Blue, Line 2 = Purple, Line 4 = Amber/Orange)
  const lineTheme = useMemo(() => {
    if (lineName === 'Line 1') {
      return {
        cardYieldBg: 'bg-blue-50/80 dark:bg-blue-950/35 border-blue-200 dark:border-blue-800/70',
        cardDikemasBg: 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50',
        cardRejectBg: 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/50',
        labelYield: 'text-blue-700 dark:text-blue-300',
        valYield: 'text-blue-700 dark:text-blue-300',
        labelDikemas: 'text-blue-700/80 dark:text-blue-300/80',
        valDikemas: 'text-blue-950 dark:text-blue-100',
        labelReject: 'text-blue-700/80 dark:text-blue-300/80',
        valReject: 'text-rose-600 dark:text-rose-400',
      };
    }
    if (lineName === 'Line 2') {
      return {
        cardYieldBg: 'bg-purple-50/80 dark:bg-purple-950/35 border-purple-200 dark:border-purple-800/70',
        cardDikemasBg: 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-900/50',
        cardRejectBg: 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-900/50',
        labelYield: 'text-purple-700 dark:text-purple-300',
        valYield: 'text-purple-700 dark:text-purple-300',
        labelDikemas: 'text-purple-700/80 dark:text-purple-300/80',
        valDikemas: 'text-purple-950 dark:text-purple-100',
        labelReject: 'text-purple-700/80 dark:text-purple-300/80',
        valReject: 'text-rose-600 dark:text-rose-400',
      };
    }
    // Line 4 (Amber / Orange)
    return {
      cardYieldBg: 'bg-amber-50/80 dark:bg-amber-950/35 border-amber-200 dark:border-amber-800/70',
      cardDikemasBg: 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50',
      cardRejectBg: 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50',
      labelYield: 'text-amber-800 dark:text-amber-300',
      valYield: 'text-amber-700 dark:text-amber-400',
      labelDikemas: 'text-amber-800/80 dark:text-amber-300/80',
      valDikemas: 'text-amber-950 dark:text-amber-100',
      labelReject: 'text-amber-800/80 dark:text-amber-300/80',
      valReject: 'text-rose-600 dark:text-rose-400',
    };
  }, [lineName]);

  return (
    <div className="flex flex-col gap-2.5">
      {/* Mini 3-box Grid Metrics for this specific Line */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        <div className={`border rounded-lg p-2.5 text-center transition-colors shadow-2xs ${lineTheme.cardYieldBg}`}>
          <span className={`text-[11px] font-bold block mb-0.5 ${lineTheme.labelYield}`}>
            % Yield {lineName}
          </span>
          <b className={`text-base sm:text-lg font-extrabold font-mono tabular-nums block ${lineTheme.valYield}`}>
            {formatPercent(lineYield)}
          </b>
        </div>
        <div className={`border rounded-lg p-2.5 text-center transition-colors shadow-2xs ${lineTheme.cardDikemasBg}`}>
          <span className={`text-[11px] font-semibold block mb-0.5 ${lineTheme.labelDikemas}`}>
            Total Dikemas
          </span>
          <b className={`text-base sm:text-lg font-extrabold font-mono tabular-nums block ${lineTheme.valDikemas}`}>
            {isEmpty ? '--' : `${totalDikemas.toLocaleString('id-ID')}`}
          </b>
        </div>
        <div className={`border rounded-lg p-2.5 text-center transition-colors shadow-2xs ${lineTheme.cardRejectBg}`}>
          <span className={`text-[11px] font-semibold block mb-0.5 ${lineTheme.labelReject}`}>
            Total Reject
          </span>
          <b className={`text-base sm:text-lg font-extrabold font-mono tabular-nums block ${lineTheme.valReject}`}>
            {isEmpty ? '--%' : formatPercent(totalRejectPercent)}
          </b>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono block mt-0.5">
            {isEmpty ? '--' : `${totalReject.toLocaleString('id-ID')} bag`}
          </span>
        </div>
      </div>

      {/* Production Records Table Container */}
      <div className="bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs transition-colors flex-1 flex flex-col">
        {/* Table Title & Search Bar */}
        <div className="px-3 py-2 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-2 bg-gray-50/60 dark:bg-[#202025]">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`px-2 py-0.5 rounded-sm text-xs font-extrabold font-mono ${badgeColorClass}`}>
              {lineName}
            </span>
            <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
              {rows.length} batch
            </span>
          </div>

          {!isEmpty && rows.length > 0 && (
            <div className="flex items-center gap-2 flex-1 justify-end max-w-xs">
              <div className="relative w-full max-w-[150px] sm:max-w-[180px]">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari BN/produk..."
                  className="w-full pl-7 pr-2 py-1 text-[11px] rounded-md border border-gray-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={toggleSort}
                className="text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-0.5 cursor-pointer shrink-0"
                title="Urutkan berdasarkan Yield"
              >
                <span>Sort</span>
                {sortDirection === 'asc' ? (
                  <ChevronUp className="w-3 h-3 text-blue-600" />
                ) : sortDirection === 'desc' ? (
                  <ChevronDown className="w-3 h-3 text-blue-600" />
                ) : (
                  <ArrowUpDown className="w-3 h-3" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto min-h-[160px] flex-1">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className={tableThBgClass}>
                <th className="py-2.5 px-3 font-bold text-white text-center whitespace-nowrap">Line</th>
                <th className="py-2.5 px-3 font-bold text-white text-center whitespace-nowrap">Kode Produk</th>
                <th className="py-2.5 px-3 font-bold text-white text-center whitespace-nowrap">BN</th>
                <th className="py-2.5 px-3 font-bold text-white text-center whitespace-nowrap">Jumlah Dikemas</th>
                <th className="py-2.5 px-3 font-bold text-white text-center whitespace-nowrap">Standart Oracle</th>
                <th className="py-2.5 px-3 font-bold text-white text-center whitespace-nowrap">Yield Oracle Persentase</th>
                <th className="py-2.5 px-3 font-bold text-white text-center whitespace-nowrap">Yield Teoritis Persentase</th>
                <th className="py-2.5 px-2 font-bold text-white text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800 font-mono">
              {isEmpty || processedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-10 px-4 text-center text-gray-400 dark:text-gray-500 italic text-xs font-sans"
                  >
                    {isEmpty
                      ? 'Data demo sudah dihapus - Hubungkan Sheet untuk melihat data asli'
                      : 'Tidak ada baris yang sesuai dengan filter'}
                  </td>
                </tr>
              ) : (
                processedRows.map((r) => {
                  const lineNum = r.Line ? r.Line.replace(/Line\s*/i, '') : '-';
                  const produkDisplay = `${r.Produk}${r.ProductSizeMl ? ` ${r.ProductSizeMl}mL` : ''}`;
                  const jmlDikemas = r.Jumlah ? r.Jumlah.toLocaleString('id-ID') : '0';
                  const stdOracle = (r.StandarOracle || r.Standar || 0).toLocaleString('id-ID');
                  const yieldOracleVal = r.YieldOracle !== undefined && r.YieldOracle > 0 ? r.YieldOracle : r.Yield;
                  const yieldTeoritisVal = r.YieldTeoritis !== undefined && r.YieldTeoritis > 0 ? r.YieldTeoritis : r.Yield;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectRow && onSelectRow(r)}
                      className="hover:bg-gray-50/80 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                    >
                      {/* 1. Line */}
                      <td className="py-2.5 px-3 text-center font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap text-xs">
                        {lineNum}
                      </td>

                      {/* 2. Kode Produk */}
                      <td className="py-2.5 px-3 text-center text-gray-900 dark:text-gray-100 whitespace-nowrap font-medium text-xs">
                        {produkDisplay}
                      </td>

                      {/* 3. BN */}
                      <td className="py-2.5 px-3 text-center text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap text-xs">
                        {r.BN}
                      </td>

                      {/* 4. Jumlah Dikemas */}
                      <td className="py-2.5 px-3 text-center text-gray-800 dark:text-gray-200 tabular-nums whitespace-nowrap text-xs">
                        {jmlDikemas}
                      </td>

                      {/* 5. Standart Oracle */}
                      <td className="py-2.5 px-3 text-center text-gray-800 dark:text-gray-200 tabular-nums whitespace-nowrap text-xs">
                        {stdOracle}
                      </td>

                      {/* 6. Yield Oracle Persentase */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-gray-900 dark:text-gray-100 font-bold text-xs bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 font-mono tabular-nums">
                          {yieldOracleVal.toFixed(1)}%
                        </span>
                      </td>

                      {/* 7. Yield Teoritis Persentase */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-md text-gray-900 dark:text-gray-100 font-bold text-xs bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 font-mono tabular-nums">
                          {yieldTeoritisVal.toFixed(1)}%
                        </span>
                      </td>

                      {/* 8. Aksi */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectRow && onSelectRow(r)}
                          className="p-1 rounded-md text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Lihat Detail Parameter Batch"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
