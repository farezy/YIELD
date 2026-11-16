import React from 'react';
import { FetchStatus } from '../types';
import { 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  Menu,
  LogOut
} from 'lucide-react';

interface HeaderProps {
  status: FetchStatus;
  statusText: string;
  lastUpdated: string;
  rowCount: number;
  darkMode?: boolean;
  demoRemoved?: boolean;
  isLoading?: boolean;
  onToggleTheme?: () => void;
  onRefresh?: () => void;
  onOpenLinkModal?: () => void;
  onToggleDemo?: () => void;
  onOpenAddBatch?: () => void;
  onExportCsv?: () => void;
  onOpenSyncModal?: () => void;
  onOpenExportModal?: () => void;
  onToggleSidebar?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  lastUpdated,
  rowCount,
  onToggleSidebar,
  onLogout,
}) => {
  return (
    <header className="w-full bg-white dark:bg-[#1A1A1E] border-b border-gray-200 dark:border-neutral-800 transition-colors">
      {/* Top Header Row */}
      <div className="w-full px-4 sm:px-6 md:px-8 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Sidebar Drawer Trigger */}
        <div className="shrink-0 flex items-center gap-3">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all cursor-pointer border border-gray-200 dark:border-neutral-700 shadow-2xs hover:border-blue-400 active:scale-95"
              title="Buka / Tutup Sidebar Navigation"
              aria-label="Toggle Sidebar Menu"
            >
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200" />
            </button>
          )}
        </div>

        {/* Center: Title & Dynamic Live Status */}
        <div className="text-center flex-1 min-w-0">
          <div className="flex items-center justify-center flex-wrap gap-2.5">
            <h1 className="text-xl sm:text-2xl md:text-[25px] font-extrabold tracking-tight text-gray-900 dark:text-white uppercase">
              DASHBOARD YIELD PRODUCTION
            </h1>

            {/* Status Badge */}
            {status === 'live' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#DCFCE7] text-[#166534] dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 animate-fadeIn">
                LIVE
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </span>
            )}
            {status === 'loading' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEF9C3] text-[#854D0E] dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                <RefreshCw className="w-3 h-3 animate-spin" />
                MEMUAT...
              </span>
            )}
            {status === 'error' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FEE2E2] text-[#991B1B] dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-800">
                <AlertCircle className="w-3 h-3" />
                OFFLINE
              </span>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono tracking-tight">
            {lastUpdated || 'Menghubungkan ke Google Sheet...'}
            {rowCount > 0 && ` • ${rowCount} baris`}
          </p>
        </div>

        {/* Right: Quick Menu & Logout Button */}
        <div className="shrink-0 flex items-center gap-2">
          {onLogout && (
            <button
              onClick={onLogout}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Logout dari Dashboard"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>Logout</span>
            </button>
          )}

          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-neutral-700 bg-gray-50 hover:bg-gray-100 dark:bg-[#222228] dark:hover:bg-neutral-800 text-gray-800 dark:text-gray-200 transition-all shadow-2xs active:scale-95 cursor-pointer"
              title="Buka Menu & Navigasi"
            >
              <Menu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden sm:inline">Menu & Aksi</span>
            </button>
          )}
        </div>
      </div>

      {/* Blue Ribbon Bar: "Capaian Yield Produksi - REALTIME" */}
      <div className="bg-[#1E3A8A] text-white py-3 px-4 text-center tracking-wide flex items-center justify-center gap-2.5 shadow-inner">
        <TrendingUp className="w-6 h-6 text-blue-200 shrink-0" />
        <span className="font-black text-lg sm:text-xl md:text-2xl tracking-wide">Capaian Yield Produksi - REALTIME</span>
      </div>
    </header>
  );
};
