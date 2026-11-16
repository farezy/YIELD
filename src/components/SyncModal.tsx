import React from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, ExternalLink, X, Clock, Database, Radio } from 'lucide-react';
import { FetchStatus } from '../types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: FetchStatus;
  statusText: string;
  lastUpdated: string;
  rowCount: number;
  sheetId: string;
  sheetName: string;
  isLoading: boolean;
  onRefreshNow: () => void;
  onOpenLinkModal?: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  status,
  statusText,
  lastUpdated,
  rowCount,
  sheetId,
  sheetName,
  isLoading,
  onRefreshNow,
  onOpenLinkModal,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-neutral-800 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                Tarik Data Google Sheet
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Status sinkronisasi data produksi secara langsung
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

        {/* Sync Info Body */}
        <div className="mt-4 space-y-3 text-xs">
          {/* Status Box */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700/80 flex items-center justify-between">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Status Koneksi:</span>
            {status === 'live' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>LIVE ({rowCount} baris)</span>
              </span>
            )}
            {status === 'loading' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menghubungkan...</span>
              </span>
            )}
            {status === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Terputus</span>
              </span>
            )}
          </div>

          {/* Details */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700/80 space-y-2 font-mono">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500 font-sans">Sheet ID:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200 truncate max-w-[200px]" title={sheetId}>
                {sheetId}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500 font-sans">Tab Aktif:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{sheetName}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-200 dark:border-neutral-700">
              <span className="text-gray-500 font-sans flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Pembaruan:</span>
              </span>
              <span className="text-gray-700 dark:text-gray-300 text-[10px]">
                {lastUpdated.replace('Terakhir update: ', '')}
              </span>
            </div>
          </div>

          {/* Auto Refresh note */}
          <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 animate-pulse" />
            <span>Dashboard memperbarui data otomatis setiap 30 detik secara *background*.</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between gap-2">
          {onOpenLinkModal && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLinkModal();
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ganti Link Sheet</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={onRefreshNow}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#1E3A8A] hover:bg-[#1e40af] text-white shadow-xs disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Tarik Data Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
