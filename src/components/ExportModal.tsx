import React, { useState } from 'react';
import { ProductionRow } from '../types';
import { Download, FileText, CheckCircle2, Copy, X, Layers, Package, Table } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rows: ProductionRow[];
  basisMode: 'oracle' | 'teoritis';
  onSuccessToast?: (msg: string) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  rows,
  basisMode,
  onSuccessToast,
}) => {
  const [exportType, setExportType] = useState<'full' | 'product' | 'line'>('full');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const downloadFile = (content: string, filename: string, mimeType = 'text/csv;charset=utf-8;') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    const timestamp = new Date().toISOString().slice(0, 10);

    if (exportType === 'full') {
      const header = [
        'Line',
        'Kode Produk',
        'BN',
        basisMode === 'teoritis' ? 'Standar Teoritis' : 'Standar Oracle',
        'Jumlah Dikemas',
        'Yield (%)',
        'Bulan',
        'Ukuran (mL)',
        'Reject Critical',
        'Reject Minor',
        'Leak Test',
        'Afkir Kemas',
      ];
      const csvRows = rows.map((r) => [
        r.Line,
        r.Produk,
        r.BN,
        r.Standar,
        r.Jumlah,
        `${r.Yield}%`,
        r.Bulan || '',
        r.ProductSizeMl || '',
        r.rejectCriticalTotal || 0,
        r.rejectMinorTotal || 0,
        r.leakTestCount || 0,
        r.afkirKemas || 0,
      ]);
      const csvContent = [header.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
      downloadFile(csvContent, `FIMA_Yield_Produksi_Lengkap_${timestamp}.csv`);
      onSuccessToast?.('Laporan data produksi lengkap berhasil diunduh!');
    } else if (exportType === 'product') {
      // Group by product
      const productMap = new Map<string, { line: string; count: number; totalStd: number; totalJml: number; sumYield: number }>();
      rows.forEach((r) => {
        const key = r.Produk;
        const current = productMap.get(key) || { line: r.Line, count: 0, totalStd: 0, totalJml: 0, sumYield: 0 };
        current.count += 1;
        current.totalStd += r.Standar || 0;
        current.totalJml += r.Jumlah || 0;
        current.sumYield += r.Yield || 0;
        productMap.set(key, current);
      });

      const header = ['Kode Produk', 'Line', 'Total Batch', 'Total Standar', 'Total Jumlah Dikemas', 'Rata-rata Yield (%)'];
      const csvRows: string[][] = [];
      productMap.forEach((data, prod) => {
        const avgYield = data.count > 0 ? (data.sumYield / data.count).toFixed(2) : '0';
        csvRows.push([prod, data.line, String(data.count), String(data.totalStd), String(data.totalJml), `${avgYield}%`]);
      });
      const csvContent = [header.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
      downloadFile(csvContent, `FIMA_Yield_Per_Produk_${timestamp}.csv`);
      onSuccessToast?.('Laporan yield per produk berhasil diunduh!');
    } else if (exportType === 'line') {
      const lineMap: { [key: string]: { count: number; totalStd: number; totalJml: number; sumYield: number } } = {
        'Line 1': { count: 0, totalStd: 0, totalJml: 0, sumYield: 0 },
        'Line 2': { count: 0, totalStd: 0, totalJml: 0, sumYield: 0 },
        'Line 4': { count: 0, totalStd: 0, totalJml: 0, sumYield: 0 },
      };

      rows.forEach((r) => {
        if (lineMap[r.Line]) {
          lineMap[r.Line].count += 1;
          lineMap[r.Line].totalStd += r.Standar || 0;
          lineMap[r.Line].totalJml += r.Jumlah || 0;
          lineMap[r.Line].sumYield += r.Yield || 0;
        }
      });

      const header = ['Line', 'Jumlah Batch', 'Total Standar', 'Total Output Dikemas', 'Rata-rata Yield (%)'];
      const csvRows = Object.entries(lineMap).map(([line, val]) => {
        const avg = val.count > 0 ? (val.sumYield / val.count).toFixed(2) : '0';
        return [line, String(val.count), String(val.totalStd), String(val.totalJml), `${avg}%`];
      });

      const csvContent = [header.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
      downloadFile(csvContent, `FIMA_Yield_Per_Line_${timestamp}.csv`);
      onSuccessToast?.('Laporan performa yield per line berhasil diunduh!');
    }

    onClose();
  };

  const handleCopySummary = () => {
    let text = `=== LAPORAN YIELD PRODUKSI PT FIMA INTERNASIONAL ===\n`;
    text += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n`;
    text += `Total Data: ${rows.length} batch\n\n`;

    // Group by line
    ['Line 1', 'Line 2', 'Line 4'].forEach((ln) => {
      const lineRows = rows.filter((r) => r.Line === ln);
      if (lineRows.length > 0) {
        const avg = (lineRows.reduce((a, b) => a + b.Yield, 0) / lineRows.length).toFixed(2);
        const totalJml = lineRows.reduce((a, b) => a + b.Jumlah, 0);
        text += `[${ln}] (${lineRows.length} batch) - Rata-rata Yield: ${avg}% | Output: ${totalJml.toLocaleString('id-ID')} bag\n`;
        lineRows.forEach((r) => {
          text += `  • ${r.BN} (${r.Produk}): Standar ${r.Standar.toLocaleString('id-ID')} -> Output ${r.Jumlah.toLocaleString('id-ID')} | Yield: ${r.Yield}%\n`;
        });
        text += '\n';
      }
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSuccessToast?.('Ringkasan data berhasil disalin ke clipboard!');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white w-full max-w-lg rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-neutral-800 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Ekspor Laporan Produksi
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pilih format dan tipe laporan data produksi yield ({rows.length} batch tersedia)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Type Selection */}
        <div className="mt-4 space-y-2.5">
          <label
            onClick={() => setExportType('full')}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              exportType === 'full'
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <input
              type="radio"
              name="export-type"
              checked={exportType === 'full'}
              onChange={() => setExportType('full')}
              className="mt-1 text-emerald-600"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                <Table className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Laporan Detail Produksi Lengkap (CSV)</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Mencakup seluruh baris batch, nomor batch, standar, output, yield, serta rincian reject defect.
              </p>
            </div>
          </label>

          <label
            onClick={() => setExportType('product')}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              exportType === 'product'
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <input
              type="radio"
              name="export-type"
              checked={exportType === 'product'}
              onChange={() => setExportType('product')}
              className="mt-1 text-emerald-600"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Ringkasan Yield Per Produk / SKU (CSV)</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Rata-rata yield per varian produk, total batch, dan akumulasi jumlah dikemas.
              </p>
            </div>
          </label>

          <label
            onClick={() => setExportType('line')}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              exportType === 'line'
                ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                : 'border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <input
              type="radio"
              name="export-type"
              checked={exportType === 'line'}
              onChange={() => setExportType('line')}
              className="mt-1 text-emerald-600"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Ringkasan Performa Yield Per Line (CSV)</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                Statistik perbandingan performa Line 1, Line 2, dan Line 4.
              </p>
            </div>
          </label>
        </div>

        {/* Quick Clipboard Copy Action */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 dark:text-emerald-400">Tersalin ke Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Ringkasan Teks</span>
              </>
            )}
          </button>
          <span className="text-[11px] text-gray-400 font-mono">Format: UTF-8 CSV</span>
        </div>

        {/* Actions Footer */}
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={rows.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh File CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
