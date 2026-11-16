import React, { useState, useMemo } from 'react';
import { parseCSVLine } from '../utils/sheetParser';
import { 
  Table as TableIcon, 
  ExternalLink, 
  Copy, 
  Download, 
  Check, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  FileSpreadsheet,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface RawSheetViewerProps {
  csvText: string;
  sheetId: string;
  sheetName: string;
  lastUpdated?: string;
}

export const RawSheetViewer: React.FC<RawSheetViewerProps> = ({
  csvText,
  sheetId,
  sheetName,
  lastUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [lineFilter, setLineFilter] = useState<'all' | '1' | '2' | '4'>('all');
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Parse CSV into headers and rows
  const { headers, rows } = useMemo(() => {
    if (!csvText || !csvText.trim()) return { headers: [], rows: [] };
    const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    const rawH = parseCSVLine(lines[0]).map((h) => h.replace(/^["']|["']$/g, '').trim());
    
    // Find last non-empty header index
    let lastNonEmpty = rawH.length - 1;
    while (lastNonEmpty >= 0 && !rawH[lastNonEmpty]) {
      lastNonEmpty--;
    }
    const cleanHeaders = rawH.slice(0, lastNonEmpty + 1);

    const parsedRows = lines.slice(1).map((line) => {
      const cols = parseCSVLine(line).map((c) => c.replace(/^["']|["']$/g, '').trim());
      return cols.slice(0, cleanHeaders.length);
    });

    return { headers: cleanHeaders, rows: parsedRows };
  }, [csvText]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      // Line filter (column index 1 is "Line")
      if (lineFilter !== 'all') {
        const lineVal = String(r[1] || '').trim();
        if (lineVal !== lineFilter && !lineVal.includes(lineFilter)) {
          return false;
        }
      }

      // Search term across all cells
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return r.some((cell) => cell.toLowerCase().includes(q));
    });
  }, [rows, lineFilter, searchTerm]);

  // Copy full raw CSV
  const handleCopyCsv = () => {
    navigator.clipboard.writeText(csvText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download raw CSV file
  const handleDownloadCsv = () => {
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FIMA_Raw_Sheet_${sheetName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;

  return (
    <div className="bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-800 rounded-xl shadow-xs transition-colors overflow-hidden">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-50/50 dark:bg-[#202025]/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Data Mentah Google Sheet (Utuh & Terhubung Real-Time)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-mono">
                {rows.length} Baris • {headers.length} Kolom
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono break-all">
              Sumber: <span className="font-semibold">{sheetName}</span> • ID: <span className="underline">{sheetId}</span>
              {lastUpdated && ` • ${lastUpdated}`}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto justify-end">
          <a
            href={sheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#222228] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            title="Buka Spreadsheet di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Buka Sheet Asli</span>
          </a>

          <button
            type="button"
            onClick={handleCopyCsv}
            className="py-1.5 px-3 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#222228] text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Salin Seluruh Data CSV ke Clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin CSV</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Unduh Data Mentah CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#222228] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title={isExpanded ? 'Sembunyikan Tabel' : 'Buka Tabel Lengkap'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-3">
          {/* Controls Bar: Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nilai di seluruh kolom (mis: L047002, VTTSA, 500, dll)..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#222228] text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Line Filter */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#222228] rounded-lg shrink-0">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 px-2">Filter:</span>
              <button
                type="button"
                onClick={() => setLineFilter('all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  lineFilter === 'all'
                    ? 'bg-white dark:bg-neutral-800 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Semua ({rows.length})
              </button>
              <button
                type="button"
                onClick={() => setLineFilter('1')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  lineFilter === '1'
                    ? 'bg-[#C2185B] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Line 1
              </button>
              <button
                type="button"
                onClick={() => setLineFilter('2')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  lineFilter === '2'
                    ? 'bg-[#7E22CE] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Line 2
              </button>
              <button
                type="button"
                onClick={() => setLineFilter('4')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  lineFilter === '4'
                    ? 'bg-[#D97706] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Line 4
              </button>
            </div>
          </div>

          {/* Horizontally and Vertically Scrollable Complete Data Grid */}
          <div className="border border-gray-200 dark:border-neutral-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full border-collapse text-left text-xs font-mono select-text">
                <thead className="sticky top-0 z-20 bg-[#1E3A8A] text-white shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3 font-bold border-r border-blue-800 text-center sticky left-0 z-30 bg-[#1E3A8A] min-w-[50px]">
                      No
                    </th>
                    {headers.map((h, i) => {
                      const isLeftFixed = i < 4; // Bulan, Line, Product Code, BN
                      const isHighlight = 
                        h.includes('Actual Good') || 
                        h.includes('Rendemen') || 
                        h.includes('Reject Visual Critical') ||
                        h === 'Pp' || h === 'Se' || h === 'Bc';

                      return (
                        <th
                          key={`${h}-${i}`}
                          className={`py-2.5 px-3 font-bold whitespace-nowrap border-r border-blue-800 text-center ${
                            isHighlight ? 'bg-[#152e6e] text-amber-200' : ''
                          }`}
                        >
                          {h || `Kolom ${i + 1}`}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={headers.length + 1}
                        className="py-10 text-center text-gray-400 dark:text-gray-500 font-sans italic text-xs"
                      >
                        Tidak ada baris data yang cocok dengan kriteria pencarian
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, rIdx) => {
                      const lineVal = row[1];
                      const isLine1 = lineVal === '1' || lineVal === 'Line 1';
                      const isLine2 = lineVal === '2' || lineVal === 'Line 2';
                      const isLine4 = lineVal === '4' || lineVal === 'Line 4';

                      return (
                        <tr
                          key={rIdx}
                          className="hover:bg-blue-50/50 dark:hover:bg-neutral-800/60 transition-colors"
                        >
                          {/* Row Number */}
                          <td className="py-2 px-3 text-center text-gray-500 dark:text-gray-400 font-bold border-r border-gray-200 dark:border-neutral-800 sticky left-0 bg-white dark:bg-[#1A1A1E] z-10 text-[11px]">
                            {rIdx + 1}
                          </td>

                          {row.map((val, cIdx) => {
                            const headerName = headers[cIdx] || '';
                            const isLineCol = cIdx === 1;
                            const isRendemen = headerName.toLowerCase().includes('rendemen');
                            const isActual = headerName.toLowerCase().includes('actual good');
                            const isCrit = headerName.toLowerCase().includes('reject visual critical');

                            return (
                              <td
                                key={cIdx}
                                className={`py-2 px-3 border-r border-gray-200 dark:border-neutral-800 whitespace-nowrap text-[11px] ${
                                  isLineCol ? 'text-center font-bold' : ''
                                } ${isRendemen ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20 text-center' : ''} ${
                                  isActual ? 'font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20 text-center' : ''
                                } ${isCrit && val && val !== '0' ? 'font-bold text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 text-center' : 'text-center'}`}
                              >
                                {isLineCol ? (
                                  <span
                                    className={`px-2 py-0.5 rounded-sm text-[10px] ${
                                      isLine1
                                        ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300'
                                        : isLine2
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                                    }`}
                                  >
                                    Line {val}
                                  </span>
                                ) : (
                                  val || '-'
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick guide footnote */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-gray-500 dark:text-gray-400 pt-1">
            <span>
              💡 Geser ke kanan untuk melihat rincian lengkap 43 kolom (IPC, Rejects Pp/Se/Bc, Leak Test, Afkir, Rendemen).
            </span>
            <span className="font-mono">
              Menampilkan {filteredRows.length} dari {rows.length} total baris
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
