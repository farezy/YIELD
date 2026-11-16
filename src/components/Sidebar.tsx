import React from 'react';
import { FetchStatus } from '../types';
import {
  Moon,
  Sun,
  RefreshCw,
  Link as LinkIcon,
  Trash2,
  RotateCcw,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Calendar,
  BarChart3,
  Factory,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Radio,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean; // Mobile/drawer visibility
  isCollapsed: boolean; // Desktop icon-only rail
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
  status: FetchStatus;
  rowCount: number;
  lastUpdated: string;
  isLoading: boolean;
  demoRemoved: boolean;
  onOpenSyncModal: () => void;
  onOpenLinkModal: () => void;
  onToggleDemo: () => void;
  onOpenExportModal?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onCloseMobile,
  darkMode,
  onToggleTheme,
  status,
  rowCount,
  lastUpdated,
  isLoading,
  demoRemoved,
  onOpenSyncModal,
  onOpenLinkModal,
  onToggleDemo,
  onOpenExportModal,
  onLogout,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Auto-close on mobile
    if (window.innerWidth < 1024) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-white dark:bg-[#1A1A1E] border-r border-gray-200 dark:border-neutral-800 flex flex-col justify-between transition-all duration-300 shadow-xl lg:shadow-none select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-[72px]' : 'w-[280px] lg:w-[270px]'}`}
      >
        {/* Top: Mobile Close (Branding div removed) */}
        <div className="p-3 border-b border-gray-100 dark:border-neutral-800/80 flex items-center justify-end min-h-[48px]">
          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 cursor-pointer ml-auto"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Pill */}
        {!isCollapsed && (
          <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#202025] border-b border-gray-100 dark:border-neutral-800/80 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Status Data:</span>
              {status === 'live' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534] dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE ({rowCount})
                </span>
              )}
              {status === 'loading' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF9C3] text-[#854D0E] dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                  SYNC...
                </span>
              )}
              {status === 'error' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEE2E2] text-[#991B1B] dark:bg-red-950/70 dark:text-red-300 border border-red-300 dark:border-red-800">
                  <AlertCircle className="w-2.5 h-2.5" />
                  OFFLINE
                </span>
              )}
            </div>
            <span className="text-[10px] text-gray-400 dark:text-neutral-500 font-mono block mt-1 truncate" title={lastUpdated}>
              {lastUpdated.replace('Terakhir update: ', '')}
            </span>
          </div>
        )}

        {/* Middle Scrollable Navigation & Action Buttons */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          
          {/* Action Buttons Group (The buttons from the user's screenshot) */}
          <div>
            {!isCollapsed && (
              <span className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-neutral-500 block mb-1.5">
                Aksi & Kontrol Data
              </span>
            )}

            <div className="space-y-1.5">
              {/* 1. Tarik Data */}
              <button
                type="button"
                onClick={() => {
                  onOpenSyncModal();
                  if (window.innerWidth < 1024) onCloseMobile();
                }}
                disabled={isLoading}
                title="Tarik Data (Sinkronisasi Sheet)"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isCollapsed ? 'justify-center' : ''
                } bg-[#1E3A8A] hover:bg-[#1e40af] text-white shadow-xs disabled:opacity-60 active:scale-95`}
              >
                <RefreshCw className={`w-4 h-4 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                {!isCollapsed && <span>Tarik Data</span>}
              </button>

              {/* 2. Masukan Link */}
              <button
                type="button"
                onClick={() => {
                  onOpenLinkModal();
                  if (window.innerWidth < 1024) onCloseMobile();
                }}
                title="Masukan Link (Google Sheet / CSV)"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isCollapsed ? 'justify-center' : ''
                } border border-[#1E3A8A] bg-white dark:bg-[#222228] text-[#1E3A8A] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800 active:scale-95`}
              >
                <LinkIcon className="w-4 h-4 shrink-0 text-[#1E3A8A] dark:text-blue-400" />
                {!isCollapsed && <span>Masukan Link</span>}
              </button>

              {/* 3. Hapus Data Demo / Tampilkan Demo */}
              <button
                type="button"
                onClick={() => {
                  onToggleDemo();
                  if (window.innerWidth < 1024) onCloseMobile();
                }}
                title={demoRemoved ? 'Tampilkan Demo' : 'Hapus Data Demo'}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-white active:scale-95 ${
                  isCollapsed ? 'justify-center' : ''
                } ${
                  demoRemoved
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-[#E53935] hover:bg-red-700'
                }`}
              >
                {demoRemoved ? (
                  <>
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Tampilkan Demo</span>}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span>Hapus Data Demo</span>}
                  </>
                )}
              </button>

              {/* 4. Ekspor */}
              {onOpenExportModal && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenExportModal();
                    if (window.innerWidth < 1024) onCloseMobile();
                  }}
                  title="Ekspor Laporan (CSV / Clipboard)"
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isCollapsed ? 'justify-center' : ''
                  } border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 active:scale-95`}
                >
                  <Download className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {!isCollapsed && <span>Ekspor</span>}
                </button>
              )}
            </div>
          </div>

          {/* Quick Page Jump Navigation */}
          <div className="pt-2 border-t border-gray-100 dark:border-neutral-800/80">
            {!isCollapsed && (
              <span className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-neutral-500 block mb-1.5">
                Navigasi Dashboard
              </span>
            )}

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => scrollToSection('sec-yield-capaian')}
                title="Capaian Yield (Teoritis & Standar)"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <Gauge className="w-4 h-4 shrink-0 text-rose-500" />
                {!isCollapsed && <span>Capaian Yield</span>}
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sec-ytd')}
                title="YTD 2026 (Per Line)"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0 text-amber-500" />
                {!isCollapsed && <span>YTD 2026</span>}
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sec-monthly')}
                title="Performa Yield Bulanan"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0 text-indigo-500" />
                {!isCollapsed && <span>Grafik Bulanan</span>}
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sec-detail-line')}
                title="Detail Produksi Per Line"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <Factory className="w-4 h-4 shrink-0 text-amber-500" />
                {!isCollapsed && <span>Detail Produksi Line</span>}
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sec-yield-product')}
                title="Yield Per Produk (SKU)"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <Package className="w-4 h-4 shrink-0 text-purple-500" />
                {!isCollapsed && <span>Yield Per Produk</span>}
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sec-defects')}
                title="Defect & Rejection Explorer"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                {!isCollapsed && <span>Defect Explorer</span>}
              </button>

              <button
                type="button"
                onClick={() => scrollToSection('sec-spreadsheet')}
                title="Data Sheet Utuh"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
                  isCollapsed ? 'justify-center' : ''
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-500" />
                {!isCollapsed && <span>Data Sheet Utuh</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: Logout, Dark Mode & Desktop Collapse Toggle */}
        <div className="p-3 border-t border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#151518] space-y-2">
          {/* Logout Button */}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Logout dari Dashboard"
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <LogOut className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              {!isCollapsed && <span>Logout</span>}
            </button>
          )}

          {/* Dark Mode Toggle Button */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={darkMode ? 'Ganti ke White Mode' : 'Ganti ke Dark Mode'}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#222228] text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all cursor-pointer ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 shrink-0 text-amber-400" />
                {!isCollapsed && <span>White Mode</span>}
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 shrink-0 text-blue-600" />
                {!isCollapsed && <span>Dark Mode</span>}
              </>
            )}
          </button>

          {/* Desktop Rail Collapse Toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={`hidden lg:flex w-full items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
            title={isCollapsed ? 'Perlebar Sidebar' : 'Kecilkan Sidebar'}
          >
            {!isCollapsed && <span>Lipat Sidebar</span>}
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
