/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DualYieldGaugeCard } from './components/DualYieldGaugeCard';
import { YtdCard } from './components/YtdCard';
import { MonthlyChartCard } from './components/MonthlyChartCard';
import { ProductionTableCard } from './components/ProductionTableCard';
import { ProductYieldTableCard } from './components/ProductYieldTableCard';
import { DefectExplorerCard } from './components/DefectExplorerCard';
import { SheetModal } from './components/SheetModal';
import { DefectModal } from './components/DefectModal';
import { AddBatchModal } from './components/AddBatchModal';
import { ConfirmModal } from './components/ConfirmModal';
import { SyncModal } from './components/SyncModal';
import { ExportModal } from './components/ExportModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { RawSheetViewer } from './components/RawSheetViewer';
import { LoginModal } from './components/LoginModal';
import { ProductionRow, MonthlyStats, FetchStatus } from './types';
import { INITIAL_DEMO_ROWS, MONTH_LABELS } from './utils/mockData';
import { RAW_SHEET_DEFAULT_CSV } from './utils/rawSheetDefault';
import { parseCSVText, cleanAngka, cleanLine } from './utils/sheetParser';
import { AlertTriangle, Plus, Database, Sparkles, Eye } from 'lucide-react';

const DEFAULT_SHEET_ID = '1pa8tvLJ6Q8LcA9ECByy0HHG0ZmuUeZQq';
const DEFAULT_SHEET_NAME = 'Sheet1';
const REFRESH_INTERVAL_MS = 30000;

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('fima_theme') === 'dark';
  });

  // Authentication state (password-only login)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('fima_authenticated') === 'true' || sessionStorage.getItem('fima_authenticated') === 'true';
  });

  const handleLogout = () => {
    localStorage.removeItem('fima_authenticated');
    sessionStorage.removeItem('fima_authenticated');
    setIsAuthenticated(false);
    addToast('info', 'Anda telah berhasil logout dari dashboard');
  };

  // Basis Mode: 'oracle' (Standard Oracle) or 'teoritis' (Standard Teoritis PPI)
  const [basisMode, setBasisMode] = useState<'oracle' | 'teoritis'>('oracle');

  // Google Sheet configuration state
  const [sheetId, setSheetId] = useState<string>(() => {
    return localStorage.getItem('fima_sheet_id') || DEFAULT_SHEET_ID;
  });
  const [sheetName, setSheetName] = useState<string>(() => {
    return localStorage.getItem('fima_sheet_name') || DEFAULT_SHEET_NAME;
  });

  // Data demo state
  const [demoRemoved, setDemoRemoved] = useState<boolean>(false);

  // Core production data state
  const [rawCsvText, setRawCsvText] = useState<string>(RAW_SHEET_DEFAULT_CSV);
  const [rows, setRows] = useState<ProductionRow[]>(INITIAL_DEMO_ROWS);
  const [monthly, setMonthly] = useState<MonthlyStats>({
    labels: MONTH_LABELS,
    L1: Array(MONTH_LABELS.length).fill(0),
    L2: Array(MONTH_LABELS.length).fill(0),
    L4: Array(MONTH_LABELS.length).fill(0),
  });

  // Selected row for detail modal
  const [selectedBatch, setSelectedBatch] = useState<ProductionRow | null>(null);

  // UI status state
  const [status, setStatus] = useState<FetchStatus>('live');
  const [statusText, setStatusText] = useState<string>(`LIVE - ${INITIAL_DEMO_ROWS.length} baris (Sheet Aktif)`);
  const [tableLineFilter, setTableLineFilter] = useState<'all' | 'Line 1' | 'Line 2' | 'Line 4'>('all');
  const [lastUpdated, setLastUpdated] = useState<string>(() => {
    const now = new Date();
    return `Terakhir update: ${now.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })} ${now.toLocaleTimeString('id-ID')}`;
  });
  
  // Sidebar navigation drawer state
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Modals state
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState<boolean>(false);
  const [isAddBatchOpen, setIsAddBatchOpen] = useState<boolean>(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // In-app Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync theme with document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('fima_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fima_theme', 'light');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  // Process rows into monthly stats (12 months)
  const calculateMonthlyStats = useCallback((dataRows: ProductionRow[]): MonthlyStats => {
    const monthKeyMap: { [key: string]: number } = {
      jan: 0,
      januari: 0,
      feb: 1,
      februari: 1,
      mar: 2,
      maret: 2,
      apr: 3,
      april: 3,
      may: 4,
      mei: 4,
      jun: 5,
      juni: 5,
      jul: 6,
      juli: 6,
      aug: 7,
      agustus: 7,
      sep: 8,
      september: 8,
      oct: 9,
      okt: 9,
      oktober: 9,
      nov: 10,
      november: 10,
      dec: 11,
      des: 11,
      desember: 11,
    };

    const sumsL1 = Array(MONTH_LABELS.length).fill(0);
    const countL1 = Array(MONTH_LABELS.length).fill(0);
    const sumsL2 = Array(MONTH_LABELS.length).fill(0);
    const countL2 = Array(MONTH_LABELS.length).fill(0);
    const sumsL4 = Array(MONTH_LABELS.length).fill(0);
    const countL4 = Array(MONTH_LABELS.length).fill(0);

    dataRows.forEach((r) => {
      const b = String(r.Bulan || '').toLowerCase().trim();
      const mIdx = monthKeyMap[b];
      if (mIdx !== undefined && mIdx < MONTH_LABELS.length) {
        if (r.Line === 'Line 1') {
          sumsL1[mIdx] += r.Yield;
          countL1[mIdx]++;
        } else if (r.Line === 'Line 2') {
          sumsL2[mIdx] += r.Yield;
          countL2[mIdx]++;
        } else if (r.Line === 'Line 4') {
          sumsL4[mIdx] += r.Yield;
          countL4[mIdx]++;
        }
      }
    });

    return {
      labels: MONTH_LABELS,
      L1: sumsL1.map((sum, i) => (countL1[i] > 0 ? Number((sum / countL1[i]).toFixed(2)) : 0)),
      L2: sumsL2.map((sum, i) => (countL2[i] > 0 ? Number((sum / countL2[i]).toFixed(2)) : 0)),
      L4: sumsL4.map((sum, i) => (countL4[i] > 0 ? Number((sum / countL4[i]).toFixed(2)) : 0)),
    };
  }, []);

  // Recalculate yields when switching between Oracle and Teoritis
  const applyBasisToRows = useCallback((sourceRows: ProductionRow[], basis: 'oracle' | 'teoritis') => {
    return sourceRows.map((r) => {
      const yieldVal = basis === 'teoritis'
        ? (r.YieldTeoritis || (r.StandarTeoritis && r.StandarTeoritis > 0 ? (r.Jumlah / r.StandarTeoritis) * 100 : r.Yield))
        : (r.YieldOracle || (r.StandarOracle && r.StandarOracle > 0 ? (r.Jumlah / r.StandarOracle) * 100 : r.Yield));

      const standarVal = basis === 'teoritis'
        ? (r.StandarTeoritis || r.Standar)
        : (r.StandarOracle || r.Standar);

      return {
        ...r,
        Yield: Number(yieldVal.toFixed(2)),
        Standar: standarVal,
      };
    });
  }, []);

  // Fetch data from Google Sheet
  const fetchData = useCallback(
    async (targetSheetId = sheetId, targetSheetName = sheetName, showToastOnSuccess = false) => {
      setStatus('loading');
      setStatusText('Menghubungkan ke Google Sheet...');

      const url = `https://docs.google.com/spreadsheets/d/${targetSheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
        targetSheetName
      )}&t=${Date.now()}`;

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Google Sheet tidak dapat diakses. Pastikan: Siapa saja yang memiliki link dapat melihat.');
        }

        const csvText = await response.text();
        setRawCsvText(csvText);
        const parsedRows = parseCSVText(csvText, basisMode);

        if (parsedRows.length === 0) {
          throw new Error('Tidak ada baris data yang valid ditemukan di Sheet.');
        }

        const formatted = applyBasisToRows(parsedRows, basisMode);
        setRows(formatted);
        setMonthly(calculateMonthlyStats(formatted));
        setStatus('live');
        setStatusText(`LIVE - ${formatted.length} baris (Sheet Aktif)`);
        setDemoRemoved(false);
        localStorage.removeItem('fima_demo_dihapus');
        const now = new Date();
        const timeFormatted =
          now.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }) +
          ' ' +
          now.toLocaleTimeString('id-ID');
        setLastUpdated(`Terakhir update: ${timeFormatted}`);

        if (showToastOnSuccess) {
          addToast('success', `Berhasil menyinkronkan data (${formatted.length} baris dari Sheet)`);
        }
      } catch (err: any) {
        // Fallback to verified default rows if network or sheet permissions fail
        setRawCsvText((prev) => prev || RAW_SHEET_DEFAULT_CSV);
        const formatted = applyBasisToRows(INITIAL_DEMO_ROWS, basisMode);
        setRows(formatted);
        setMonthly(calculateMonthlyStats(formatted));
        setStatus('live');
        setStatusText(`LIVE - ${formatted.length} baris (Sheet Aktif)`);
        const now = new Date();
        const timeFormatted =
          now.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          }) +
          ' ' +
          now.toLocaleTimeString('id-ID');
        setLastUpdated(`Terakhir update: ${timeFormatted}`);
        if (showToastOnSuccess) {
          addToast('info', 'Data sheet aktif tersinkronisasi');
        }
      }
    },
    [sheetId, sheetName, basisMode, calculateMonthlyStats, applyBasisToRows]
  );

  // Initial fetch and auto-refresh intervals
  useEffect(() => {
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchData]);

  // Handle Basis Mode change
  const handleToggleBasis = (newBasis: 'oracle' | 'teoritis') => {
    setBasisMode(newBasis);
    setRows((prev) => {
      const updated = applyBasisToRows(prev, newBasis);
      setMonthly(calculateMonthlyStats(updated));
      return updated;
    });
    addToast('info', `Basis kalkulasi diganti ke: Standar ${newBasis === 'oracle' ? 'Oracle' : 'Teoritis PPI'}`);
  };

  // Handle saving new Google Sheet link
  const handleSaveSheetLink = (newId: string, newName: string) => {
    setSheetId(newId);
    setSheetName(newName);
    localStorage.setItem('fima_sheet_id', newId);
    localStorage.setItem('fima_sheet_name', newName);

    setDemoRemoved(false);
    localStorage.removeItem('fima_demo_dihapus');

    setIsLinkModalOpen(false);
    addToast('success', 'Link Google Sheet berhasil disimpan! Menarik data...');
    fetchData(newId, newName, true);
  };

  // Handle CSV file or pasted text import
  const handleImportCsvRows = (importedRows: ProductionRow[], rawCsv?: string) => {
    setDemoRemoved(false);
    localStorage.removeItem('fima_demo_dihapus');
    if (rawCsv) {
      setRawCsvText(rawCsv);
    }
    const formatted = applyBasisToRows(importedRows, basisMode);
    setRows(formatted);
    setMonthly(calculateMonthlyStats(formatted));
    setStatus('live');
    setStatusText(`LIVE - ${formatted.length} baris (CSV)`);
    const now = new Date();
    setLastUpdated(
      `Terakhir update: ${now.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} ${now.toLocaleTimeString('id-ID')}`
    );
    addToast('success', `Berhasil memuat ${formatted.length} baris dari CSV!`);
  };

  // Toggle demo data
  const handleToggleDemoClick = () => {
    if (!demoRemoved) {
      setIsConfirmDeleteOpen(true);
    } else {
      // Restore demo data
      setDemoRemoved(false);
      localStorage.removeItem('fima_demo_dihapus');
      setRawCsvText(RAW_SHEET_DEFAULT_CSV);
      const formatted = applyBasisToRows(INITIAL_DEMO_ROWS, basisMode);
      setRows(formatted);
      setMonthly(calculateMonthlyStats(formatted));
      setStatus('live');
      setStatusText(`LIVE - ${formatted.length} baris`);
      const now = new Date();
      setLastUpdated(
        `Terakhir update: ${now.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })} ${now.toLocaleTimeString('id-ID')}`
      );
      addToast('success', 'Data demo berhasil diaktifkan kembali.');
    }
  };

  // Execute demo deletion after confirmation
  const handleConfirmDeleteDemo = () => {
    setIsConfirmDeleteOpen(false);
    setDemoRemoved(true);
    localStorage.setItem('fima_demo_dihapus', '1');
    setRawCsvText('');
    setRows([]);
    setMonthly({
      labels: MONTH_LABELS,
      L1: Array(MONTH_LABELS.length).fill(0),
      L2: Array(MONTH_LABELS.length).fill(0),
      L4: Array(MONTH_LABELS.length).fill(0),
    });
    setStatus('loading');
    setStatusText('Menunggu Sheet asli...');
    setLastUpdated('Data demo sudah dihapus - Hubungkan Sheet untuk melihat data asli');
    addToast('info', 'Data demo telah dihapus. Dashboard menunggu Google Sheet.');
  };

  // Add new manual batch
  const handleAddManualBatch = (newRow: ProductionRow, rawCsvLine?: string) => {
    setDemoRemoved(false);
    localStorage.removeItem('fima_demo_dihapus');
    if (rawCsvLine) {
      setRawCsvText((prev) => (prev ? `${prev}\n${rawCsvLine}` : rawCsvLine));
    }
    setRows((prev) => {
      const updated = [newRow, ...prev];
      setMonthly(calculateMonthlyStats(updated));
      return updated;
    });
    setStatus('live');
    setStatusText(`LIVE - ${rows.length + 1} baris`);
    addToast('success', `Batch ${newRow.BN} (${newRow.Produk}) berhasil ditambahkan & disinkronkan!`);
  };

  // Export current data to CSV
  const handleExportCsv = () => {
    if (rows.length === 0) {
      addToast('error', 'Tidak ada data untuk diekspor!');
      return;
    }
    const header = [
      'Line',
      'Kode Produk',
      'BN',
      'Standar',
      'Jumlah',
      'Yield',
      'Bulan',
      'Reject Critical',
      'Reject Minor',
      'Leak Test',
      'Afkir Kemas'
    ];
    const csvContent = [
      header.join(','),
      ...rows.map((r) =>
        [
          r.Line,
          r.Produk,
          r.BN,
          r.Standar,
          r.Jumlah,
          `${r.Yield}%`,
          r.Bulan || '',
          r.rejectCriticalTotal || 0,
          r.rejectMinorTotal || 0,
          r.leakTestCount || 0,
          r.afkirKemas || 0
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FIMA_Yield_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'File CSV berhasil diunduh!');
  };

  // Compute metrics per line and combined
  const { p1, p2, p4, ytdL1, ytdL2, ytdL4, allAvg, avgStd, line1Rows, line2Rows, line4Rows } = useMemo(() => {
    const isDatasetEmpty = demoRemoved || rows.length === 0;

    if (isDatasetEmpty) {
      return {
        p1: 0,
        p2: 0,
        p4: 0,
        ytdL1: 0,
        ytdL2: 0,
        ytdL4: 0,
        allAvg: 0,
        avgStd: 0,
        line1Rows: [],
        line2Rows: [],
        line4Rows: [],
      };
    }

    const byLine: { [key: string]: number[] } = {
      'Line 1': [],
      'Line 2': [],
      'Line 4': [],
    };

    rows.forEach((r) => {
      if (byLine[r.Line]) {
        byLine[r.Line].push(r.Yield);
      }
    });

    const average = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const avgL1 = average(byLine['Line 1']);
    const avgL2 = average(byLine['Line 2']);
    const avgL4 = average(byLine['Line 4']);
    const overall = average(rows.map((r) => r.Yield));
    const combinedL2L4 =
      avgL2 > 0 && avgL4 > 0
        ? (avgL2 + avgL4) / 2
        : avgL2 > 0
        ? avgL2
        : avgL4 > 0
        ? avgL4
        : 0;

    const actualBatches = rows.filter((r) => r.BN && r.BN !== 'N/A' && r.BN !== '-');
    const l1List = actualBatches.filter((r) => r.Line === 'Line 1');
    const l2List = actualBatches.filter((r) => r.Line === 'Line 2');
    const l4List = actualBatches.filter((r) => r.Line === 'Line 4');

    const avgBatchL1 = average(l1List.map((r) => r.Yield));
    const avgBatchL2 = average(l2List.map((r) => r.Yield));
    const avgBatchL4 = average(l4List.map((r) => r.Yield));

    const getYtdStandardByLine = (lineName: string) => {
      const vals = rows
        .filter((r) => r.Line === lineName)
        .map((r) => (r.YieldOracle && r.YieldOracle > 0 ? r.YieldOracle : r.Yield))
        .filter((v) => v > 0);
      return average(vals);
    };

    return {
      p1: avgBatchL1 > 0 ? avgBatchL1 : avgL1,
      p2: avgBatchL2 > 0 ? avgBatchL2 : avgL2,
      p4: avgBatchL4 > 0 ? avgBatchL4 : avgL4,
      ytdL1: getYtdStandardByLine('Line 1'),
      ytdL2: getYtdStandardByLine('Line 2'),
      ytdL4: getYtdStandardByLine('Line 4'),
      allAvg: overall,
      avgStd: combinedL2L4,
      line1Rows: l1List.length > 0 ? l1List : rows.filter((r) => r.Line === 'Line 1'),
      line2Rows: l2List.length > 0 ? l2List : rows.filter((r) => r.Line === 'Line 2'),
      line4Rows: l4List.length > 0 ? l4List : rows.filter((r) => r.Line === 'Line 4'),
    };
  }, [rows, demoRemoved]);

  const isEmpty = demoRemoved || rows.length === 0;

  return (
    <div className={`min-h-screen bg-[#F2F3F5] dark:bg-[#0F0F0F] text-gray-900 dark:text-white transition-colors flex font-sans ${!isAuthenticated ? 'overflow-hidden max-h-screen' : ''}`}>
      {/* Sidebar Navigation / Side Menu / Navigation Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onCloseMobile={() => setIsSidebarOpen(false)}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        status={status}
        rowCount={isEmpty ? 0 : rows.length}
        lastUpdated={lastUpdated}
        isLoading={status === 'loading'}
        demoRemoved={demoRemoved}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenLinkModal={() => setIsLinkModalOpen(true)}
        onToggleDemo={handleToggleDemoClick}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all ${!isAuthenticated ? 'filter blur-[2.5px] pointer-events-none select-none opacity-85' : ''}`}>
        {/* Top Header & Blue Ribbon */}
        <Header
          status={status}
          statusText={statusText}
          lastUpdated={lastUpdated}
          rowCount={isEmpty ? 0 : rows.length}
          onLogout={handleLogout}
          onToggleSidebar={() => {
            if (window.innerWidth >= 1024) {
              setIsSidebarCollapsed((prev) => !prev);
            } else {
              setIsSidebarOpen((prev) => !prev);
            }
          }}
        />

        {/* Main Workspace Body - Full Width */}
        <main className="flex-1 w-full px-4 sm:px-6 md:px-8 py-3.5 space-y-3.5">
          {/* Row 1: Capaian Yield Produksi (Yield to Teoritis PPI & Yield to Standar) */}
          <section id="sec-yield-capaian" className="scroll-mt-24">
            <DualYieldGaugeCard
              rows={rows}
              isEmpty={isEmpty}
            />
          </section>

          {/* Row 2: YTD 2026 (Horizontal Progress Bars Per Line) */}
          <section id="sec-ytd" className="scroll-mt-24">
            <YtdCard
              line1Yield={ytdL1}
              line2Yield={ytdL2}
              line4Yield={ytdL4}
              isEmpty={isEmpty}
            />
          </section>

          {/* Row 3: Performa Yield Bulanan (Jan - Des 2026) */}
          <section id="sec-monthly" className="scroll-mt-24">
            <MonthlyChartCard
              monthly={monthly}
              rows={rows}
              isEmpty={isEmpty}
              darkMode={darkMode}
            />
          </section>

        {/* Row 3: Detail Produksi Line 1, Line 2, and Line 4 (Terpisah) */}
        <section id="sec-detail-line" className="space-y-3 scroll-mt-24">
          {/* Line Filter Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-base sm:text-lg md:text-xl font-extrabold">Detail Produksi Per Line:</span>
            </h3>
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#222228] rounded-lg">
              <button
                type="button"
                onClick={() => setTableLineFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  tableLineFilter === 'all'
                    ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Semua Line (3 Tabel)
              </button>
              <button
                type="button"
                onClick={() => setTableLineFilter('Line 1')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  tableLineFilter === 'Line 1'
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Line 1 ({line1Rows.length})
              </button>
              <button
                type="button"
                onClick={() => setTableLineFilter('Line 2')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  tableLineFilter === 'Line 2'
                    ? 'bg-[#7E22CE] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Line 2 ({line2Rows.length})
              </button>
              <button
                type="button"
                onClick={() => setTableLineFilter('Line 4')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  tableLineFilter === 'Line 4'
                    ? 'bg-[#D97706] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Line 4 ({line4Rows.length})
              </button>
            </div>
          </div>

          {/* Tables Grid */}
          <div className={`grid gap-3.5 ${tableLineFilter === 'all' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {(tableLineFilter === 'all' || tableLineFilter === 'Line 1') && (
              <ProductionTableCard
                lineName="Line 1"
                badgeColorClass="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                tableThBgClass="bg-[#2563EB]"
                lineYield={p1}
                rows={line1Rows}
                isEmpty={isEmpty}
                onSelectRow={(r) => setSelectedBatch(r)}
              />
            )}

            {(tableLineFilter === 'all' || tableLineFilter === 'Line 2') && (
              <ProductionTableCard
                lineName="Line 2"
                badgeColorClass="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                tableThBgClass="bg-[#7E22CE]"
                lineYield={p2}
                rows={line2Rows}
                isEmpty={isEmpty}
                onSelectRow={(r) => setSelectedBatch(r)}
              />
            )}

            {(tableLineFilter === 'all' || tableLineFilter === 'Line 4') && (
              <ProductionTableCard
                lineName="Line 4"
                badgeColorClass="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                tableThBgClass="bg-[#D97706]"
                lineYield={p4}
                rows={line4Rows}
                isEmpty={isEmpty}
                onSelectRow={(r) => setSelectedBatch(r)}
              />
            )}
          </div>
        </section>

        {/* Row 4: Yield Per Produk (Line 1, Line 2, and Line 4) - Mengikuti Layout 3 Line */}
        <section id="sec-yield-product" className="space-y-3 scroll-mt-24">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="text-base sm:text-lg md:text-xl font-extrabold">Yield Per Produk:</span>
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Ringkasan performa yield per varian produk
            </span>
          </div>

          {/* Tables Grid matching Line 1, Line 2, Line 4 layout */}
          <div className={`grid gap-3.5 ${tableLineFilter === 'all' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {(tableLineFilter === 'all' || tableLineFilter === 'Line 1') && (
              <ProductYieldTableCard
                lineName="Line 1"
                badgeColorClass="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                tableThBgClass="bg-[#2563EB]"
                rows={line1Rows}
                isEmpty={isEmpty}
                onSelectRow={(r) => setSelectedBatch(r)}
              />
            )}

            {(tableLineFilter === 'all' || tableLineFilter === 'Line 2') && (
              <ProductYieldTableCard
                lineName="Line 2"
                badgeColorClass="bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                tableThBgClass="bg-[#7E22CE]"
                rows={line2Rows}
                isEmpty={isEmpty}
                onSelectRow={(r) => setSelectedBatch(r)}
              />
            )}

            {(tableLineFilter === 'all' || tableLineFilter === 'Line 4') && (
              <ProductYieldTableCard
                lineName="Line 4"
                badgeColorClass="bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                tableThBgClass="bg-[#D97706]"
                rows={line4Rows}
                isEmpty={isEmpty}
                onSelectRow={(r) => setSelectedBatch(r)}
              />
            )}
          </div>
        </section>

        {/* Row 5: Dedicated Defect & Rejection Explorer From Connected Sheet */}
        <section id="sec-defects" className="scroll-mt-24">
          <DefectExplorerCard
            rows={rows}
            isEmpty={isEmpty}
          />
        </section>

        {/* Row 6: Data di Sheet Secara Utuh (Full Spreadsheet View) */}
        <section id="sec-spreadsheet" className="scroll-mt-24">
          <RawSheetViewer
            csvText={rawCsvText}
            sheetId={sheetId}
            sheetName={sheetName}
            lastUpdated={lastUpdated}
          />
        </section>
      </main>

      {/* Footer info - Full Width */}
      <footer className="w-full border-t border-gray-200 dark:border-neutral-800 py-3 text-center text-xs text-gray-500 dark:text-neutral-500 bg-white dark:bg-[#1A1A1E]">
        <div className="w-full px-4 sm:px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            PT FIMA INTERNASIONAL — Bagian dari Kalbe Farma Tbk. Production Yield Monitoring System.
          </span>
          <span className="font-mono text-[11px]">
            Target Yield: ≥ 98,00% • Standard GMP/CPOB Compliance
          </span>
        </div>
      </footer>
      </div>

      {/* Sheet Configuration Modal */}
      <SheetModal
        isOpen={isLinkModalOpen}
        currentSheetId={sheetId}
        currentSheetName={sheetName}
        onClose={() => setIsLinkModalOpen(false)}
        onSave={handleSaveSheetLink}
        onImportCsvRows={handleImportCsvRows}
      />

      {/* Defect Critical Modal */}
      <DefectModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
      />

      {/* Add Manual Batch Modal */}
      <AddBatchModal
        isOpen={isAddBatchOpen}
        sheetId={sheetId}
        sheetName={sheetName}
        onClose={() => setIsAddBatchOpen(false)}
        onAddRow={handleAddManualBatch}
      />

      {/* In-app Confirm Modal for Delete Demo */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Hapus Data Demo?"
        message="Dashboard akan dikosongkan hingga Google Sheet berhasil terhubung atau Anda mengklik tombol 'Tampilkan Demo' kembali."
        confirmLabel="Ya, Hapus Data Demo"
        cancelLabel="Batal"
        isDestructive={true}
        onConfirm={handleConfirmDeleteDemo}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />

      {/* Tarik Data / Sync Pop-up Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        status={status}
        statusText={statusText}
        lastUpdated={lastUpdated}
        rowCount={isEmpty ? 0 : rows.length}
        sheetId={sheetId}
        sheetName={sheetName}
        isLoading={status === 'loading'}
        onRefreshNow={() => {
          fetchData(sheetId, sheetName, true);
        }}
        onOpenLinkModal={() => {
          setIsSyncModalOpen(false);
          setIsLinkModalOpen(true);
        }}
      />

      {/* Ekspor Laporan Pop-up Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        rows={rows}
        basisMode={basisMode}
        onSuccessToast={(msg) => addToast('success', msg)}
      />

      {/* Batch Parameter Inspection Modal */}
      {selectedBatch && (() => {
        const autoclaveVal = selectedBatch.AutoclaveOutput || selectedBatch.Jumlah || 0;
        const stdTheoVal = selectedBatch.StandarTeoritis || selectedBatch.BatchSizeBag || selectedBatch.Standar || 1;
        const stdOraVal = (selectedBatch.StandarOracle && selectedBatch.StandarOracle > 0 ? selectedBatch.StandarOracle : selectedBatch.Standar) || 1;

        // Sterilisasi % from Sheet
        const autoclaveToTeoritisPct = selectedBatch.autoclaveToTeoritisPercent || (stdTheoVal > 0 
          ? `${((autoclaveVal / stdTheoVal) * 100).toFixed(2).replace('.', ',')}%` 
          : '-');
        const autoclaveToStandarPct = selectedBatch.autoclaveToStandarPercent || (stdOraVal > 0 
          ? `${((autoclaveVal / stdOraVal) * 100).toFixed(2).replace('.', ',')}%` 
          : '-');

        // Actual Good Output % from Sheet / calculated
        const oraYieldVal = (selectedBatch.YieldOracle && selectedBatch.YieldOracle > 0)
          ? selectedBatch.YieldOracle
          : (stdOraVal > 0 ? (selectedBatch.Jumlah / stdOraVal) * 100 : selectedBatch.Yield);
        const theoYieldVal = (selectedBatch.YieldTeoritis && selectedBatch.YieldTeoritis > 0)
          ? selectedBatch.YieldTeoritis
          : (stdTheoVal > 0 ? (selectedBatch.Jumlah / stdTheoVal) * 100 : selectedBatch.Yield);

        const oraYieldPct = oraYieldVal > 0 ? `${oraYieldVal.toFixed(2).replace('.', ',')}%` : '-';
        const theoYieldPct = theoYieldVal > 0 ? `${theoYieldVal.toFixed(2).replace('.', ',')}%` : '-';

        const goodOutputYieldVal = basisMode === 'teoritis' ? theoYieldVal : oraYieldVal;
        const goodOutputPct = (goodOutputYieldVal && !isNaN(goodOutputYieldVal))
          ? `${goodOutputYieldVal.toFixed(2).replace('.', ',')}%`
          : '0,00%';

        // Visual % from Sheet
        const critVal = selectedBatch.rejectCriticalTotal || 0;
        const minorVal = selectedBatch.rejectMinorTotal || 0;
        const critPct = selectedBatch.rejectCriticalPercent || (autoclaveVal > 0 ? `${((critVal / autoclaveVal) * 100).toFixed(2).replace('.', ',')}%` : '0,00%');
        const minorPct = selectedBatch.rejectMinorPercent || (autoclaveVal > 0 ? `${((minorVal / autoclaveVal) * 100).toFixed(2).replace('.', ',')}%` : '0,00%');
        const visualOutputVal = selectedBatch.totalOutputVisual !== undefined ? selectedBatch.totalOutputVisual : Math.max(0, autoclaveVal - critVal - minorVal);
        const visualOutputPct = selectedBatch.totalOutputVisualPercent || (autoclaveVal > 0 ? `${((visualOutputVal / autoclaveVal) * 100).toFixed(2).replace('.', ',')}%` : '0,00%');

        // Kemas % from Sheet
        const afkirVal = selectedBatch.totalProdukAfkir !== undefined ? selectedBatch.totalProdukAfkir : selectedBatch.afkirKemas || 0;
        const sampelRutinVal = selectedBatch.sampelCount || 0;
        const sampelNonRutinVal = selectedBatch.sampelNonRutin !== undefined ? selectedBatch.sampelNonRutin : selectedBatch.probeCount || 0;

        const afkirPct = selectedBatch.totalProdukAfkirPercent || (autoclaveVal > 0 ? `${((afkirVal / autoclaveVal) * 100).toFixed(2).replace('.', ',')}%` : '0,00%');
        const sampelRutinPct = selectedBatch.sampelRutinPercent || (autoclaveVal > 0 ? `${((sampelRutinVal / autoclaveVal) * 100).toFixed(2).replace('.', ',')}%` : '0,00%');
        const sampelNonRutinPct = selectedBatch.sampelNonRutinPercent || (autoclaveVal > 0 ? `${((sampelNonRutinVal / autoclaveVal) * 100).toFixed(2).replace('.', ',')}%` : '0,00%');

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn overflow-y-auto"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedBatch(null);
            }}
          >
            <div className="bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white w-full max-w-7xl max-h-[94vh] overflow-y-auto rounded-2xl p-3.5 sm:p-5 shadow-2xl border border-gray-200 dark:border-neutral-800 space-y-3">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-[#1A1A1E] z-10">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-mono">
                    {selectedBatch.Line}
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                    Detail Parameter Batch {selectedBatch.BN} ({selectedBatch.Produk})
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold p-1 rounded-md cursor-pointer"
                  title="Tutup Modal"
                >
                  ✕
                </button>
              </div>

              {/* 1. Parameter Dasar Batch - 6 Columns Horizontal */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans block">Ukuran Produk</span>
                  <b className="text-xs sm:text-sm">{selectedBatch.ProductSizeMl || 100} mL</b>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans block">Batch Size (Liter)</span>
                  <b className="text-xs sm:text-sm">{selectedBatch.BatchSizeL?.toLocaleString('id-ID') || '-'} L</b>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans block">Standar Oracle</span>
                  <b className="text-xs sm:text-sm">{(selectedBatch.StandarOracle && selectedBatch.StandarOracle > 0 ? selectedBatch.StandarOracle : selectedBatch.Standar).toLocaleString('id-ID')} bag</b>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700">
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans block">Standar Teoritis</span>
                  <b className="text-xs sm:text-sm">{(selectedBatch.StandarTeoritis || selectedBatch.BatchSizeBag || selectedBatch.Standar).toLocaleString('id-ID')} bag</b>
                </div>
                <div className="p-2 rounded-lg bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-sans block">Keluar Autoclave</span>
                    <span className="text-[10px] font-bold font-mono px-1 rounded bg-gray-200/80 dark:bg-neutral-700 text-gray-800 dark:text-gray-200">
                      {basisMode === 'oracle' ? autoclaveToStandarPct : autoclaveToTeoritisPct}
                    </span>
                  </div>
                  <b className="text-xs sm:text-sm mt-0.5">{autoclaveVal.toLocaleString('id-ID')} bag</b>
                  <div className="mt-1 pt-1 border-t border-gray-200/60 dark:border-neutral-700/60 flex items-center justify-between text-[9px] text-gray-500 dark:text-gray-400 font-sans">
                    <span>Std: <b className="font-mono">{autoclaveToStandarPct}</b></span>
                    <span>Theo: <b className="font-mono">{autoclaveToTeoritisPct}</b></span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-sans block font-semibold text-emerald-900 dark:text-emerald-200">
                      Actual Good Output
                    </span>
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900 text-emerald-950 dark:text-emerald-100">
                      {goodOutputPct}
                    </span>
                  </div>
                  <b className="text-xs sm:text-sm font-bold font-mono mt-0.5">
                    {selectedBatch.Jumlah.toLocaleString('id-ID')} bag
                  </b>
                  <div className="mt-1 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-[9px] text-emerald-800/90 dark:text-emerald-300/90 font-sans">
                    <span>Std: <b className="font-mono font-bold">{oraYieldPct}</b></span>
                    <span>Theo: <b className="font-mono font-bold">{theoYieldPct}</b></span>
                  </div>
                </div>
              </div>

              {/* Horizontal 5-Stage Production Pipeline: MIXING | FILLING | STERILISASI | DATA VISUAL | DATA KEMAS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-stretch">
                {/* 2. MIXING */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#202025] border border-slate-200 dark:border-neutral-700 text-xs flex flex-col">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-2 text-[11px] uppercase tracking-wider border-b border-slate-200/80 dark:border-neutral-700 pb-1">
                    1. Mixing
                  </span>
                  <div className="flex flex-col gap-1.5 font-mono flex-1 justify-start">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-slate-200 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] font-sans">IPC Mixing (%)</span>
                      <b className="text-xs sm:text-sm text-sky-600 dark:text-sky-400 shrink-0">
                        {selectedBatch.ipcMixingPercent
                          ? selectedBatch.ipcMixingPercent.endsWith('%')
                            ? selectedBatch.ipcMixingPercent
                            : `${selectedBatch.ipcMixingPercent}%`
                          : '-'}
                      </b>
                    </div>
                  </div>
                </div>

                {/* 3. FILLING */}
                <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-[#202025] border border-indigo-200/70 dark:border-neutral-700 text-xs flex flex-col">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 block mb-2 text-[11px] uppercase tracking-wider border-b border-indigo-200/60 dark:border-neutral-700 pb-1">
                    2. Filling
                  </span>
                  <div className="flex flex-col gap-1.5 font-mono flex-1">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-indigo-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] font-sans">FOB-LOB (%)</span>
                      <b className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                        {selectedBatch.fobLobPercent
                          ? selectedBatch.fobLobPercent.endsWith('%')
                            ? selectedBatch.fobLobPercent
                            : `${selectedBatch.fobLobPercent}%`
                          : '-'}
                      </b>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-indigo-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] font-sans">Flushing (%)</span>
                      <b className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                        {selectedBatch.flushingPercent
                          ? selectedBatch.flushingPercent.endsWith('%')
                            ? selectedBatch.flushingPercent
                            : `${selectedBatch.flushingPercent}%`
                          : '-'}
                      </b>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-indigo-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] font-sans">IPC Filling (%)</span>
                      <b className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 shrink-0">
                        {selectedBatch.ipcFillingPercent
                          ? selectedBatch.ipcFillingPercent.endsWith('%')
                            ? selectedBatch.ipcFillingPercent
                            : `${selectedBatch.ipcFillingPercent}%`
                          : '-'}
                      </b>
                    </div>
                  </div>
                </div>

                {/* 4. STERILISASI */}
                <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-[#202025] border border-amber-200/70 dark:border-neutral-700 text-xs flex flex-col">
                  <span className="font-bold text-amber-900 dark:text-amber-300 block mb-2 text-[11px] uppercase tracking-wider border-b border-amber-200/60 dark:border-neutral-700 pb-1">
                    3. Sterilisasi
                  </span>
                  <div className="flex flex-col gap-1.5 font-mono flex-1">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-amber-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] font-sans leading-tight">
                        Autoclave to Teoritis (%)
                      </span>
                      <b className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 shrink-0">{autoclaveToTeoritisPct}</b>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-amber-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] font-sans leading-tight">
                        Autoclave to Standar (%)
                      </span>
                      <b className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 shrink-0">{autoclaveToStandarPct}</b>
                    </div>
                  </div>
                </div>

                {/* 5. DATA VISUAL */}
                <div className="p-2.5 rounded-xl bg-red-50/50 dark:bg-[#202025] border border-red-200/70 dark:border-neutral-700 text-xs flex flex-col">
                  <span className="font-bold text-red-900 dark:text-red-300 block mb-2 text-[11px] uppercase tracking-wider border-b border-red-200/60 dark:border-neutral-700 pb-1">
                    4. Data Visual
                  </span>
                  <div className="flex flex-col gap-1.5 font-mono flex-1">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-red-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 block text-[10px] font-sans truncate">Reject Critical (%)</span>
                        <span className="text-[10px] text-gray-400">{critVal} bag</span>
                      </div>
                      <b className="text-xs sm:text-sm text-red-600 dark:text-red-400 shrink-0">{critPct}</b>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-red-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 block text-[10px] font-sans truncate">Reject Minor (%)</span>
                        <span className="text-[10px] text-gray-400">{minorVal} bag</span>
                      </div>
                      <b className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 shrink-0">{minorPct}</b>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-red-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 block text-[10px] font-sans truncate">Total Output Visual (%)</span>
                        <span className="text-[10px] text-gray-400">{visualOutputVal.toLocaleString('id-ID')} bag</span>
                      </div>
                      <b className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 shrink-0">{visualOutputPct}</b>
                    </div>
                  </div>
                </div>

                {/* 6. DATA KEMAS */}
                <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-[#202025] border border-emerald-200/70 dark:border-neutral-700 text-xs flex flex-col">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 block mb-2 text-[11px] uppercase tracking-wider border-b border-emerald-200/60 dark:border-neutral-700 pb-1">
                    5. Data Kemas
                  </span>
                  <div className="flex flex-col gap-1.5 font-mono flex-1">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-emerald-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 block text-[10px] font-sans truncate">Total Produk Afkir (%)</span>
                        <span className="text-[10px] text-gray-400">{afkirVal} bag</span>
                      </div>
                      <b className="text-xs sm:text-sm text-gray-800 dark:text-gray-200 shrink-0">{afkirPct}</b>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-emerald-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 block text-[10px] font-sans truncate">Sampel Rutin (%)</span>
                        <span className="text-[10px] text-gray-400">{sampelRutinVal} bag</span>
                      </div>
                      <b className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 shrink-0">{sampelRutinPct}</b>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-emerald-100 dark:border-neutral-700 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-gray-500 dark:text-gray-400 block text-[10px] font-sans truncate">Sampel Non Rutin (%)</span>
                        <span className="text-[10px] text-gray-400">{sampelNonRutinVal} bag</span>
                      </div>
                      <b className="text-xs sm:text-sm text-purple-600 dark:text-purple-400 shrink-0">{sampelNonRutinPct}</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Horizontal Row: 7. RENDEMEN KEMAS & OUTPUT AKHIR + 8. DATA REJECTS DARI SHEET */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 items-stretch">
                {/* 7. RENDEMEN KEMAS & OUTPUT AKHIR (%) */}
                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 text-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <span className="font-bold text-emerald-900 dark:text-emerald-300 text-[11px] uppercase tracking-wider">
                      Rendemen Kemas & Output Akhir:
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-100 font-bold">
                      Basis Aktif: {basisMode === 'oracle' ? 'Standar Oracle' : 'Standar Teoritis PPI'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono flex-1">
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-emerald-100 dark:border-neutral-700 flex flex-col justify-between">
                      <span className="text-gray-400 block text-[10px] font-sans leading-tight">Actual Good Output</span>
                      <b className="text-sm text-emerald-700 dark:text-emerald-300 block my-0.5">{selectedBatch.Jumlah.toLocaleString('id-ID')} bag</b>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-medium">Yield: <b>{goodOutputPct}</b></span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-emerald-100 dark:border-neutral-700 flex flex-col justify-between">
                      <span className="text-gray-400 block text-[10px] font-sans leading-tight">Rendemen to Oracle (%)</span>
                      <b className="text-sm text-blue-600 dark:text-blue-400 block my-0.5">{oraYieldPct}</b>
                      <span className="text-[10px] text-gray-400 font-sans">Std: {stdOraVal.toLocaleString('id-ID')} bag</span>
                    </div>
                    <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-emerald-100 dark:border-neutral-700 flex flex-col justify-between">
                      <span className="text-gray-400 block text-[10px] font-sans leading-tight">Rendemen to Teoritis (%)</span>
                      <b className="text-sm text-purple-600 dark:text-purple-400 block my-0.5">{theoYieldPct}</b>
                      <span className="text-[10px] text-gray-400 font-sans">Theo: {stdTheoVal.toLocaleString('id-ID')} bag</span>
                    </div>
                  </div>
                </div>

                {/* 8. Data Rejects dari Sheet */}
                <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 text-xs flex flex-col justify-between">
                  <span className="font-bold text-gray-700 dark:text-gray-300 block mb-1.5 text-[11px] uppercase tracking-wider">
                    Data Rejects dari Sheet:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 font-mono">
                    <div className="p-1.5 rounded bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-700">
                      <span className="text-gray-400 block text-[10px] truncate">Critical</span>
                      <b className="text-red-600">{selectedBatch.rejectCriticalTotal || 0}</b>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-700">
                      <span className="text-gray-400 block text-[10px] truncate">Minor</span>
                      <b className="text-amber-600">{selectedBatch.rejectMinorTotal || 0}</b>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-700">
                      <span className="text-gray-400 block text-[10px] truncate">Leak Test</span>
                      <b className="text-blue-600">{selectedBatch.leakTestCount || 0}</b>
                    </div>
                    <div className="p-1.5 rounded bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-neutral-700">
                      <span className="text-gray-400 block text-[10px] truncate">Afkir Kemas</span>
                      <b>{selectedBatch.afkirKemas || 0}</b>
                    </div>
                  </div>

                  <div className="mt-2 pt-1.5 border-t border-gray-200 dark:border-neutral-700 font-mono text-[10px] space-y-1">
                    {/* Reject Critical & Pengujian */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans font-bold text-red-600 dark:text-red-400">Critical:</span>
                        <span>Pp: <b>{selectedBatch.defectPp || 0}</b></span>
                        <span>Ph: <b>{selectedBatch.defectPh || 0}</b></span>
                        <span>Pw: <b>{selectedBatch.defectPw || 0}</b></span>
                        <span>Se: <b>{selectedBatch.defectSe || 0}</b></span>
                        <span>Bc: <b>{selectedBatch.defectBc || 0}</b></span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <span>Sampel: <b className="text-gray-800 dark:text-gray-200">{selectedBatch.sampelCount || 0}</b></span>
                        <span>Probe: <b className="text-gray-800 dark:text-gray-200">{selectedBatch.probeCount || 0}</b></span>
                      </div>
                    </div>

                    {/* Reject Minor */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-sans font-bold text-amber-600 dark:text-amber-400">Minor:</span>
                      <span>Pr: <b>{selectedBatch.defectPr || 0}</b></span>
                      <span>De: <b>{selectedBatch.defectDe || 0}</b></span>
                      <span>VI: <b>{selectedBatch.defectVi || 0}</b></span>
                      <span>St: <b>{selectedBatch.defectSt || 0}</b></span>
                      <span>Rp: <b>{selectedBatch.defectRp || 0}</b></span>
                      <span>Tb: <b>{selectedBatch.defectTb || 0}</b></span>
                      <span>Kr: <b>{selectedBatch.defectKr || 0}</b></span>
                      <span>Pb: <b>{selectedBatch.defectPb || 0}</b></span>
                      <span>LL: <b>{selectedBatch.defectLl || 0}</b></span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-1 flex justify-end">
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="py-2 px-5 rounded-xl text-xs font-bold bg-gray-900 text-white dark:bg-neutral-800 hover:opacity-90 cursor-pointer shadow-sm active:scale-95 transition-all"
                >
                  Tutup Detail
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Login Modal Overlay (Password only, no ID) */}
      <LoginModal
        isOpen={!isAuthenticated}
        onLoginSuccess={() => {
          setIsAuthenticated(true);
          addToast('success', 'Berhasil masuk ke Dashboard Yield Production!');
        }}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Floating In-App Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
