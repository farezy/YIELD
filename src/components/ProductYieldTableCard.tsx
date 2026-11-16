import React, { useState, useMemo } from 'react';
import { ProductionRow } from '../types';
import { Search, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

interface ProductSummaryItem {
  produk: string;
  sizeMl?: number;
  batchCount: number;
  batchNumbers: string[];
  avgYield: number;
  avgYieldOracle: number;
  avgYieldTeoritis: number;
  avgStandartLoss: number;
  firstRow: ProductionRow;
}

interface ProductYieldTableCardProps {
  lineName: string; // "Line 1" | "Line 2" | "Line 4"
  badgeColorClass: string;
  tableThBgClass: string;
  standarHeaderLabel?: string;
  rows: ProductionRow[];
  isEmpty: boolean;
  onSelectRow?: (row: ProductionRow) => void;
}

export const ProductYieldTableCard: React.FC<ProductYieldTableCardProps> = ({
  lineName,
  badgeColorClass,
  tableThBgClass,
  rows,
  isEmpty,
  onSelectRow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | 'none'>('none');

  // Group rows for this line by Produk
  const productSummaries: ProductSummaryItem[] = useMemo(() => {
    if (isEmpty || rows.length === 0) return [];

    const map = new Map<string, ProductionRow[]>();
    rows.forEach((r) => {
      const key = r.Produk?.trim() || 'Unknown';
      const list = map.get(key) || [];
      list.push(r);
      map.set(key, list);
    });

    const items: ProductSummaryItem[] = [];
    map.forEach((batchList, produk) => {
      const batchCount = batchList.length;
      const batchNumbers = batchList.map((b) => b.BN);
      const sumYield = batchList.reduce((sum, b) => sum + (b.Yield || 0), 0);
      const avgYield = batchCount > 0 ? Number((sumYield / batchCount).toFixed(2)) : 0;

      const sumYieldOracle = batchList.reduce(
        (sum, b) => sum + (b.YieldOracle !== undefined && b.YieldOracle > 0 ? b.YieldOracle : b.Yield || 0),
        0
      );
      const avgYieldOracle = batchCount > 0 ? Number((sumYieldOracle / batchCount).toFixed(2)) : 0;

      const sumYieldTeoritis = batchList.reduce(
        (sum, b) => sum + (b.YieldTeoritis !== undefined && b.YieldTeoritis > 0 ? b.YieldTeoritis : b.Yield || 0),
        0
      );
      const avgYieldTeoritis = batchCount > 0 ? Number((sumYieldTeoritis / batchCount).toFixed(2)) : 0;

      const lossValues = batchList.map((b) => {
        if (b.StandartLoss !== undefined && b.StandartLoss > 0) return b.StandartLoss;
        const stdTheo = b.StandarTeoritis || b.BatchSizeBag || 0;
        const stdOra = b.StandarOracle || 0;
        if (stdTheo > 0 && stdOra > 0) {
          return ((stdTheo - stdOra) / stdTheo) * 100;
        }
        return 0;
      });
      const avgStandartLoss =
        batchCount > 0
          ? Number((lossValues.reduce((sum, v) => sum + v, 0) / batchCount).toFixed(2))
          : 0;

      const sizeMl = batchList.find((b) => b.ProductSizeMl)?.ProductSizeMl;

      items.push({
        produk,
        sizeMl,
        batchCount,
        batchNumbers,
        avgYield,
        avgYieldOracle,
        avgYieldTeoritis,
        avgStandartLoss,
        firstRow: batchList[0],
      });
    });

    return items;
  }, [rows, isEmpty]);

  // Filter & sort
  const processedProducts = useMemo(() => {
    if (productSummaries.length === 0) return [];

    let list = productSummaries.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchName = p.produk.toLowerCase().includes(q);
      const matchBn = p.batchNumbers.some((bn) => bn.toLowerCase().includes(q));
      return matchName || matchBn;
    });

    if (sortDirection === 'asc') {
      list = [...list].sort((a, b) => a.avgYield - b.avgYield);
    } else if (sortDirection === 'desc') {
      list = [...list].sort((a, b) => b.avgYield - a.avgYield);
    }

    return list;
  }, [productSummaries, searchTerm, sortDirection]);

  const toggleSort = () => {
    setSortDirection((prev) => {
      if (prev === 'none') return 'desc';
      if (prev === 'desc') return 'asc';
      return 'none';
    });
  };

  return (
    <div className="bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs transition-colors flex flex-col">
      {/* Top Bar: Badge, Count, Search, Sort */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-neutral-800 flex items-center justify-between gap-2 bg-gray-50/60 dark:bg-[#202025]">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`px-2 py-0.5 rounded-sm text-xs font-extrabold font-mono ${badgeColorClass}`}>
            {lineName}
          </span>
          <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
            {productSummaries.length} produk
          </span>
        </div>

        {!isEmpty && productSummaries.length > 0 && (
          <div className="flex items-center gap-2 flex-1 justify-end max-w-xs">
            <div className="relative w-full max-w-[130px] sm:max-w-[160px]">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari produk..."
                className="w-full pl-7 pr-2 py-1 text-[11px] rounded-md border border-gray-200 dark:border-neutral-700 bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={toggleSort}
              className="text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-0.5 cursor-pointer shrink-0"
              title="Urutkan berdasarkan Yield Produk"
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

      {/* Table Body with: Line, Kode Produk, Yield Standar, Yield Teoritis, and Standart Loss */}
      <div className="overflow-x-auto min-h-[120px] flex-1">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className={tableThBgClass}>
              <th className="py-2.5 px-2.5 font-bold text-white text-center whitespace-nowrap">Line</th>
              <th className="py-2.5 px-2.5 font-bold text-white text-center whitespace-nowrap">Kode Produk</th>
              <th className="py-2.5 px-2.5 font-bold text-white text-center whitespace-nowrap">Yield Standar</th>
              <th className="py-2.5 px-2.5 font-bold text-white text-center whitespace-nowrap">Yield Teoritis</th>
              <th
                className="py-2.5 px-2.5 font-bold text-white text-center whitespace-nowrap bg-slate-800/90 dark:bg-neutral-900 border-l border-white/25"
                title="Acuan Standar Loss (Teoritis vs Oracle), bukan hasil aktual"
              >
                Standart Loss
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-neutral-800 font-mono">
            {isEmpty || processedProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-8 px-4 text-center text-gray-400 dark:text-gray-500 italic text-xs font-sans"
                >
                  {isEmpty
                    ? 'Data demo sudah dihapus - Hubungkan Sheet untuk melihat data asli'
                    : 'Tidak ada produk yang sesuai'}
                </td>
              </tr>
            ) : (
              processedProducts.map((p) => {
                return (
                  <tr
                    key={p.produk}
                    className="hover:bg-gray-50/80 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                    onClick={() => onSelectRow && onSelectRow(p.firstRow)}
                    title={`Klik untuk melihat detail parameter (${p.batchCount} batch)`}
                  >
                    <td className="py-2.5 px-2.5 text-center font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap text-[11px]">
                      {lineName}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium text-[11px]">
                      <span className="font-bold text-gray-900 dark:text-gray-100">{p.produk}</span>
                      {p.sizeMl && (
                        <span className="text-[10px] text-gray-400 block font-normal">
                          {p.sizeMl}mL
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      <span className="font-bold tabular-nums font-mono text-gray-900 dark:text-gray-100 text-xs">
                        {p.avgYieldOracle.toFixed(2).replace('.', ',')}%
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                      <span className="font-bold tabular-nums font-mono text-gray-900 dark:text-gray-100 text-xs">
                        {p.avgYieldTeoritis.toFixed(2).replace('.', ',')}%
                      </span>
                    </td>
                    <td
                      className="py-2.5 px-2.5 text-center whitespace-nowrap bg-slate-200/85 dark:bg-neutral-800/95 border-l border-slate-300/90 dark:border-neutral-700"
                      title="Standart Loss (Acuan standar, bukan hasil aktual)"
                    >
                      <span className="font-extrabold tabular-nums font-mono text-slate-800 dark:text-slate-100 text-xs">
                        {p.avgStandartLoss.toFixed(2).replace('.', ',')}%
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
