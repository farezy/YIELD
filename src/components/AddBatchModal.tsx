import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { ProductionRow } from '../types';
import {
  X,
  PlusCircle,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Layers,
  Sparkles,
  Send,
  RefreshCw,
  LogIn,
  LogOut,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { MONTH_LABELS } from '../utils/mockData';
import {
  KNOWN_PRODUCTS_TEMPLATE,
  formatRowToSheetCSV,
  formatRowToSheetTSV,
} from '../utils/sheetParser';
import {
  initAuth,
  googleSignIn,
  logout,
} from '../services/googleAuth';
import {
  appendRowToGoogleSheet,
  AppendRowResult,
} from '../services/sheetsApi';

interface AddBatchModalProps {
  isOpen: boolean;
  sheetId: string;
  sheetName: string;
  onClose: () => void;
  onAddRow: (row: ProductionRow, rawCsvLine: string) => void;
}

export const AddBatchModal: React.FC<AddBatchModalProps> = ({
  isOpen,
  sheetId,
  sheetName,
  onClose,
  onAddRow,
}) => {
  // Preset selector
  const [selectedPresetCode, setSelectedPresetCode] = useState<string>('VTTSA');

  // Core Template Form Fields
  const [line, setLine] = useState<'Line 1' | 'Line 2' | 'Line 4'>('Line 1');
  const [bulan, setBulan] = useState('Nov');
  const [produk, setProduk] = useState('VTTSA');
  const [bn, setBn] = useState(`L030${Math.floor(240 + Math.random() * 60)}`);
  const [productSizeMl, setProductSizeMl] = useState('500');
  const [batchSizeL, setBatchSizeL] = useState('2300');
  const [standarOracle, setStandarOracle] = useState('4352');
  const [standarTeoritis, setStandarTeoritis] = useState('4581');
  const [jumlah, setJumlah] = useState('4294');

  // Advanced CPOB & Defect Parameters (Collapsible)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoclaveOutput, setAutoclaveOutput] = useState('4460');
  const [defectPp, setDefectPp] = useState('0');
  const [defectPh, setDefectPh] = useState('0');
  const [defectPw, setDefectPw] = useState('0');
  const [defectSe, setDefectSe] = useState('0');
  const [defectBc, setDefectBc] = useState('0');
  const [leakTest, setLeakTest] = useState('0');
  const [afkirKemas, setAfkirKemas] = useState('0');
  const [sampelCount, setSampelCount] = useState('97');
  const [probeCount, setProbeCount] = useState('5');

  // Cloud Google Sheet Direct Write Options
  const [autoWriteToSheet, setAutoWriteToSheet] = useState(true);
  const [isSyncingToSheet, setIsSyncingToSheet] = useState(false);
  const [cloudSyncResult, setCloudSyncResult] = useState<AppendRowResult | null>(null);

  // Google Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Confirmation Dialog State before writing to Sheet
  const [pendingRowToConfirm, setPendingRowToConfirm] = useState<{
    row: ProductionRow;
    csvLine: string;
  } | null>(null);

  // Webhook for Google Apps Script backup
  const [webhookUrl, setWebhookUrl] = useState(() => localStorage.getItem('fima_sheet_webhook') || '');
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);

  // Success Modal State for Sheet Linking
  const [createdRow, setCreatedRow] = useState<ProductionRow | null>(null);
  const [copiedRow, setCopiedRow] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-fill template values when choosing product preset
  const handleSelectPreset = (code: string) => {
    setSelectedPresetCode(code);
    const template = KNOWN_PRODUCTS_TEMPLATE.find((p) => p.code === code);
    if (template) {
      setLine(template.line);
      setProduk(template.code);
      setProductSizeMl(String(template.sizeMl));
      setBatchSizeL(String(template.batchSizeL));
      setStandarOracle(String(template.standarOracle));
      setStandarTeoritis(String(template.standarTeoritis));
      // Propose realistic Good Output close to standard (99%)
      const realisticGood = Math.round(template.standarOracle * 0.995);
      setJumlah(String(realisticGood));
      setAutoclaveOutput(String(Math.round(template.standarTeoritis * 0.98)));
    }
  };

  // Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setCreatedRow(null);
      setCopiedRow(false);
      setErrorMsg('');
      setCloudSyncResult(null);
      setPendingRowToConfirm(null);
      handleSelectPreset('VTTSA');
      setBn(`L030${Math.floor(240 + Math.random() * 60)}`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stdOracleNum = parseFloat(standarOracle) || 0;
  const stdTeoritisNum = parseFloat(standarTeoritis) || 0;
  const jmlNum = parseFloat(jumlah) || 0;

  const yieldOracle = stdOracleNum > 0 ? (jmlNum / stdOracleNum) * 100 : 0;
  const yieldTeoritis = stdTeoritisNum > 0 ? (jmlNum / stdTeoritisNum) * 100 : 0;

  const handleLoginGoogle = async () => {
    setIsLoggingIn(true);
    setErrorMsg('');
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal login akun Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogoutGoogle = async () => {
    try {
      await logout();
      setCurrentUser(null);
    } catch (err) {
      console.warn('Logout failed:', err);
    }
  };

  // Pre-validate and show confirmation dialog
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!produk.trim()) {
      setErrorMsg('Kode Produk wajib diisi');
      return;
    }
    if (!bn.trim()) {
      setErrorMsg('Batch Number (BN) wajib diisi');
      return;
    }
    if (stdOracleNum <= 0 && stdTeoritisNum <= 0) {
      setErrorMsg('Standar Oracle atau Standar Teoritis harus lebih besar dari 0');
      return;
    }
    if (jmlNum <= 0) {
      setErrorMsg('Jumlah Dikemas harus lebih besar dari 0');
      return;
    }

    const pp = parseInt(defectPp) || 0;
    const ph = parseInt(defectPh) || 0;
    const pw = parseInt(defectPw) || 0;
    const se = parseInt(defectSe) || 0;
    const bc = parseInt(defectBc) || 0;
    const critTotal = pp + ph + pw + se + bc;

    const newRow: ProductionRow = {
      id: `manual-${Date.now()}`,
      Line: line,
      Produk: produk.trim().toUpperCase(),
      BN: bn.trim().toUpperCase(),
      Standar: stdOracleNum > 0 ? stdOracleNum : stdTeoritisNum,
      StandarOracle: stdOracleNum,
      StandarTeoritis: stdTeoritisNum,
      Jumlah: jmlNum,
      Yield: Number(yieldOracle.toFixed(2)),
      YieldOracle: Number(yieldOracle.toFixed(2)),
      YieldTeoritis: Number(yieldTeoritis.toFixed(2)),
      Bulan: bulan,
      Tanggal: new Date().toISOString().split('T')[0],
      ProductSizeMl: parseFloat(productSizeMl) || 100,
      BatchSizeL: parseFloat(batchSizeL) || 2300,
      BatchSizeBag: stdTeoritisNum,
      AutoclaveOutput: parseFloat(autoclaveOutput) || jmlNum,
      rejectCriticalTotal: critTotal,
      defectPp: pp,
      defectPh: ph,
      defectPw: pw,
      defectSe: se,
      defectBc: bc,
      rejectMinorTotal: (parseInt(leakTest) || 0) + (parseInt(afkirKemas) || 0),
      leakTestCount: parseInt(leakTest) || 0,
      afkirKemas: parseInt(afkirKemas) || 0,
      sampelCount: parseInt(sampelCount) || 0,
      probeCount: parseInt(probeCount) || 0,
    };

    const csvLine = formatRowToSheetCSV(newRow);

    // If writing directly to cloud Google Sheet, show user confirmation first
    if (autoWriteToSheet) {
      setPendingRowToConfirm({ row: newRow, csvLine });
    } else {
      executeSaveBatch(newRow, csvLine, false);
    }
  };

  // Perform actual batch execution and Google Sheets API append
  const executeSaveBatch = async (
    targetRow: ProductionRow,
    csvLine: string,
    syncToSheet: boolean
  ) => {
    setPendingRowToConfirm(null);
    setIsSyncingToSheet(true);
    setErrorMsg('');

    let result: AppendRowResult | null = null;

    if (syncToSheet) {
      try {
        result = await appendRowToGoogleSheet(sheetId, sheetName || 'Sheet1', targetRow);
        setCloudSyncResult(result);
      } catch (err: any) {
        result = {
          success: false,
          message: err?.message || 'Gagal mengirim data ke Google Sheet.',
        };
        setCloudSyncResult(result);
      }
    }

    // Optional Apps Script Webhook dispatch
    if (webhookUrl.trim()) {
      try {
        await fetch(webhookUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'appendRow',
            sheetName: sheetName || 'Sheet1',
            row: targetRow,
            csvLine: csvLine,
          }),
        });
      } catch (err) {
        console.warn('Webhook dispatch failed:', err);
      }
    }

    setIsSyncingToSheet(false);
    onAddRow(targetRow, csvLine);
    setCreatedRow(targetRow);
  };

  // Retry sending to Google Sheet from success screen
  const handleRetrySendToSheet = async () => {
    if (!createdRow) return;
    setIsSyncingToSheet(true);
    try {
      const res = await appendRowToGoogleSheet(sheetId, sheetName || 'Sheet1', createdRow);
      setCloudSyncResult(res);
    } catch (err: any) {
      setCloudSyncResult({
        success: false,
        message: err?.message || 'Gagal mengirim ke Google Sheet.',
      });
    } finally {
      setIsSyncingToSheet(false);
    }
  };

  const handleCopyTSV = () => {
    if (!createdRow) return;
    const tsvText = formatRowToSheetTSV(createdRow);
    navigator.clipboard.writeText(tsvText);
    setCopiedRow(true);
    setTimeout(() => setCopiedRow(false), 2500);
  };

  const openSheetDirectly = () => {
    const sheetEditUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit`;
    window.open(sheetEditUrl, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !createdRow && !pendingRowToConfirm) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white w-full max-w-xl rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-neutral-800 transition-colors my-8">
        
        {/* CONFIRMATION DIALOG (Mandatory before mutating Google Sheet) */}
        {pendingRowToConfirm ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-neutral-800">
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Konfirmasi Tambah Baris ke Google Sheet
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Operasi ini akan menambahkan 1 baris baru ke file spreadsheet Google Anda.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 space-y-2 text-xs">
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                <span className="text-gray-500 font-sans">Target Spreadsheet ID:</span>
                <span className="font-mono font-bold">{sheetId.slice(0, 16)}...</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                <span className="text-gray-500 font-sans">Tab Lembar Kerja:</span>
                <span className="font-semibold">{sheetName || 'Sheet1'}</span>
              </div>
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-200 dark:border-neutral-700">
                <span className="text-gray-500 font-sans">Batch & Produk:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                  {pendingRowToConfirm.row.BN} • {pendingRowToConfirm.row.Produk} ({pendingRowToConfirm.row.Line})
                </span>
              </div>
              <div className="flex justify-between items-center text-gray-600 dark:text-gray-300">
                <span className="text-gray-500 font-sans">Good Output (Dikemas):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {pendingRowToConfirm.row.Jumlah.toLocaleString('id-ID')} bag
                </span>
              </div>
            </div>

            {/* Google Account Notice */}
            <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
              <FileSpreadsheet className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span>
                  Data akan ditambahkan secara resmi menggunakan <b>Google Sheets API</b> dengan izin akun Google Anda.
                </span>
                {currentUser && (
                  <p className="mt-1 font-semibold text-[11px] text-emerald-700 dark:text-emerald-400">
                    Akun Google Aktif: {currentUser.email}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPendingRowToConfirm(null)}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() =>
                  executeSaveBatch(
                    pendingRowToConfirm.row,
                    pendingRowToConfirm.csvLine,
                    true
                  )
                }
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Ya, Kirim ke Google Sheet</span>
              </button>
            </div>
          </div>
        ) : createdRow ? (
          /* SUCCESS STATE MODAL: After saving, provide direct update & copy to Sheet Link */
          <div className="space-y-4 animate-fadeIn">
            <div className="text-center py-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Batch {createdRow.BN} Berhasil Disimpan!
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-md mx-auto">
                Data telah diperbarui di dashboard dan tabel produksi lokal.
              </p>
            </div>

            {/* Cloud Google Sheets API Status Card */}
            {cloudSyncResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs ${
                  cloudSyncResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {cloudSyncResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-bold block text-sm">
                      {cloudSyncResult.success
                        ? '✓ Sukses Ditambahkan ke Google Sheet Link!'
                        : 'Belum Terupdate Otomatis ke Google Sheet'}
                    </span>
                    <p className="mt-0.5 text-xs opacity-90 leading-relaxed">
                      {cloudSyncResult.message}
                    </p>
                    {cloudSyncResult.updatedRange && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 rounded font-mono text-[11px]">
                        Range: {cloudSyncResult.updatedRange}
                      </span>
                    )}

                    {!cloudSyncResult.success && (
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleRetrySendToSheet}
                          disabled={isSyncingToSheet}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingToSheet ? 'animate-spin' : ''}`} />
                          <span>Coba Kirim Ulang ke Sheet</span>
                        </button>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          atau gunakan tombol <b>Salin Baris</b> di bawah untuk paste manual.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Template Summary Card */}
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-[11px] pb-1.5 border-b border-gray-200 dark:border-neutral-700">
                <span className="font-sans text-gray-500">Produk & Lini:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {createdRow.Produk} ({createdRow.ProductSizeMl}mL) • {createdRow.Line}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="font-sans text-gray-400 block text-[10px]">Standar Oracle</span>
                  <b>{createdRow.StandarOracle?.toLocaleString('id-ID')} bag</b>
                  <span className="text-blue-600 dark:text-blue-400 block font-bold text-[10px]">
                    Yield: {createdRow.YieldOracle}%
                  </span>
                </div>
                <div>
                  <span className="font-sans text-gray-400 block text-[10px]">Standar Teoritis PPI</span>
                  <b>{createdRow.StandarTeoritis?.toLocaleString('id-ID')} bag</b>
                  <span className="text-purple-600 dark:text-purple-400 block font-bold text-[10px]">
                    Yield: {createdRow.YieldTeoritis}%
                  </span>
                </div>
              </div>
              <div className="pt-1.5 border-t border-gray-200 dark:border-neutral-700 flex justify-between items-center">
                <span className="font-sans text-emerald-700 dark:text-emerald-300 font-semibold">
                  Actual Good Output:
                </span>
                <div className="flex items-center gap-2">
                  <b className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {createdRow.Jumlah.toLocaleString('id-ID')} bag
                  </b>
                  <span className="text-[11px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    {createdRow.YieldOracle || createdRow.Yield}%
                  </span>
                </div>
              </div>
            </div>

            {/* Row CSV Preview */}
            <div className="p-2.5 rounded-lg bg-gray-900 text-gray-200 text-[10px] font-mono overflow-x-auto whitespace-pre">
              <span className="text-gray-400 block mb-1 font-sans font-bold">Baris 43 Kolom Sesuai Template Sheet:</span>
              <code>{formatRowToSheetCSV(createdRow)}</code>
            </div>

            {/* Action Buttons to update Google Sheet */}
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyTSV}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-all"
                >
                  {copiedRow ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-200" />
                      <span>Baris Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Baris untuk Sheet</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={openSheetDirectly}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-700 cursor-pointer transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-blue-500" />
                  <span>Buka Google Sheet Link</span>
                </button>
              </div>

              {!cloudSyncResult && (
                <button
                  type="button"
                  onClick={handleRetrySendToSheet}
                  disabled={isSyncingToSheet}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>{isSyncingToSheet ? 'Menyimpan ke Google Sheet...' : 'Kirim Langsung ke Google Sheet Link'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-gray-100 dark:bg-neutral-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Selesai & Tutup
              </button>
            </div>
          </div>
        ) : (
          /* FORM INPUT STATE */
          <>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-gray-900 dark:text-white">
                    Tambah Batch Sesuai Template Sheet
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Form input disesuaikan dengan 43 parameter template Google Sheet FIMA
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Google Authentication Status Card */}
            <div className="mt-3 p-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-[#222228] flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="truncate">
                  {currentUser ? (
                    <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block">
                      Tersambung Google: <span className="text-emerald-600 dark:text-emerald-400">{currentUser.email}</span>
                    </span>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-400 truncate block">
                      Google Sheets API: Masuk untuk update langsung ke sheet
                    </span>
                  )}
                </div>
              </div>

              {currentUser ? (
                <button
                  type="button"
                  onClick={handleLogoutGoogle}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-gray-100 text-gray-700 dark:text-gray-300 flex items-center gap-1 cursor-pointer"
                  title="Logout Akun Google"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleLoginGoogle}
                  disabled={isLoggingIn}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 hover:bg-gray-50 text-gray-800 dark:text-gray-200 flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <LogIn className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isLoggingIn ? 'Memproses...' : 'Masuk Google'}</span>
                </button>
              )}
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-3.5">
              {/* Quick Template Preset Buttons */}
              <div>
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Pilih Template Produk Standar FIMA:</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {KNOWN_PRODUCTS_TEMPLATE.map((preset) => {
                    const isSelected = selectedPresetCode === preset.code;
                    return (
                      <button
                        key={preset.code}
                        type="button"
                        onClick={() => handleSelectPreset(preset.code)}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-gray-50 dark:bg-[#222228] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-700 hover:border-blue-400'
                        }`}
                      >
                        <div className="truncate">{preset.code}</div>
                        <div className="text-[10px] opacity-80">{preset.sizeMl}mL</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Line & Bulan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Line Produksi:
                  </label>
                  <select
                    value={line}
                    onChange={(e) => setLine(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Line 1">Line 1 (Khusus VTTSA 500mL)</option>
                    <option value="Line 2">Line 2 (VAMPA, VCLNB, VCRVG 100mL)</option>
                    <option value="Line 4">Line 4 (VLONA, VPELA 100mL)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Bulan Produksi:
                  </label>
                  <select
                    value={bulan}
                    onChange={(e) => setBulan(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MONTH_LABELS.map((m) => (
                      <option key={m} value={m}>
                        {m} (2026)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Kode Produk & BN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Kode Produk (SKU):
                  </label>
                  <input
                    type="text"
                    required
                    value={produk}
                    onChange={(e) => setProduk(e.target.value.toUpperCase())}
                    placeholder="Contoh: VTTSA, VAMPA"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] text-gray-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Batch Number (BN):
                  </label>
                  <input
                    type="text"
                    required
                    value={bn}
                    onChange={(e) => setBn(e.target.value.toUpperCase())}
                    placeholder="Contoh: L030233"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] text-gray-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Ukuran mL & Batch Size (L) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Ukuran Produk (mL):
                  </label>
                  <input
                    type="number"
                    value={productSizeMl}
                    onChange={(e) => setProductSizeMl(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                    Batch Size (Liter):
                  </label>
                  <input
                    type="number"
                    value={batchSizeL}
                    onChange={(e) => setBatchSizeL(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Standar Dual-Basis & Actual Good Output */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 block mb-1">
                    Standar Oracle (Bag):
                  </label>
                  <input
                    type="number"
                    required
                    value={standarOracle}
                    onChange={(e) => setStandarOracle(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-blue-300 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-purple-700 dark:text-purple-400 block mb-1">
                    Standar Teoritis PPI (Bag):
                  </label>
                  <input
                    type="number"
                    required
                    value={standarTeoritis}
                    onChange={(e) => setStandarTeoritis(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                    Actual Good Output:
                  </label>
                  <input
                    type="number"
                    required
                    value={jumlah}
                    onChange={(e) => setJumlah(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 text-gray-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Live Yield Calculation Preview */}
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-neutral-800">
                  <span className="text-[10px] text-gray-500 block">Yield Standar Oracle:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                      {yieldOracle.toFixed(2)}%
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        yieldOracle >= 99 && yieldOracle <= 102
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : yieldOracle > 102
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                      }`}
                    >
                      {yieldOracle >= 99 && yieldOracle <= 102
                        ? 'Sesuai Standar'
                        : yieldOracle > 102
                        ? 'Over Output'
                        : 'Di Bawah Standar'}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-[#1A1A1E] border border-gray-100 dark:border-neutral-800">
                  <span className="text-[10px] text-gray-500 block">Yield Standar Teoritis PPI:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-base font-extrabold text-purple-600 dark:text-purple-400">
                      {yieldTeoritis.toFixed(2)}%
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        yieldTeoritis >= 87 && yieldTeoritis <= 98
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300'
                      }`}
                    >
                      Teoritis Bag
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapsible Advanced Parameters */}
              <div className="border border-gray-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-[#222228] hover:bg-gray-100 dark:hover:bg-neutral-800 flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-gray-500" />
                    <span>Parameter Tambahan CPOB (Defect, Reject & In-Process)</span>
                  </span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                  <div className="p-3 bg-white dark:bg-[#1A1A1E] space-y-3 border-t border-gray-200 dark:border-neutral-700 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Output Autoclave (Bag)</label>
                        <input
                          type="number"
                          value={autoclaveOutput}
                          onChange={(e) => setAutoclaveOutput(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Leak Test</label>
                        <input
                          type="number"
                          value={leakTest}
                          onChange={(e) => setLeakTest(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 text-[10px] font-mono">
                      <div>
                        <span className="text-gray-400 block">Pp</span>
                        <input
                          type="number"
                          value={defectPp}
                          onChange={(e) => setDefectPp(e.target.value)}
                          className="w-full px-1 py-1 text-xs rounded border border-gray-200 dark:border-neutral-700 text-center"
                        />
                      </div>
                      <div>
                        <span className="text-gray-400 block">Ph</span>
                        <input
                          type="number"
                          value={defectPh}
                          onChange={(e) => setDefectPh(e.target.value)}
                          className="w-full px-1 py-1 text-xs rounded border border-gray-200 dark:border-neutral-700 text-center"
                        />
                      </div>
                      <div>
                        <span className="text-gray-400 block">Pw</span>
                        <input
                          type="number"
                          value={defectPw}
                          onChange={(e) => setDefectPw(e.target.value)}
                          className="w-full px-1 py-1 text-xs rounded border border-gray-200 dark:border-neutral-700 text-center"
                        />
                      </div>
                      <div>
                        <span className="text-gray-400 block">Se</span>
                        <input
                          type="number"
                          value={defectSe}
                          onChange={(e) => setDefectSe(e.target.value)}
                          className="w-full px-1 py-1 text-xs rounded border border-gray-200 dark:border-neutral-700 text-center"
                        />
                      </div>
                      <div>
                        <span className="text-gray-400 block">Bc</span>
                        <input
                          type="number"
                          value={defectBc}
                          onChange={(e) => setDefectBc(e.target.value)}
                          className="w-full px-1 py-1 text-xs rounded border border-gray-200 dark:border-neutral-700 text-center"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Afkir Kemas</label>
                        <input
                          type="number"
                          value={afkirKemas}
                          onChange={(e) => setAfkirKemas(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Sampel QC</label>
                        <input
                          type="number"
                          value={sampelCount}
                          onChange={(e) => setSampelCount(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-0.5">Probe</label>
                        <input
                          type="number"
                          value={probeCount}
                          onChange={(e) => setProbeCount(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Write to Connected Google Sheet Checkbox */}
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoWriteToSheet}
                    onChange={(e) => setAutoWriteToSheet(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">
                      Tulis & Tambahkan Langsung ke Google Sheet Link
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                      Menggunakan Google Sheets API resmi (tab: {sheetName || 'Sheet1'})
                    </span>
                  </div>
                </label>

                <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
              </div>

              {/* Optional Webhook Sync */}
              <div className="pt-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-gray-400">
                    Cadangan Webhook Apps Script:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowWebhookConfig(!showWebhookConfig)}
                    className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {showWebhookConfig ? 'Tutup' : 'Atur URL Webhook'}
                  </button>
                </div>

                {showWebhookConfig && (
                  <div className="mt-1.5 p-2.5 rounded-lg bg-gray-50 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 text-xs space-y-1.5 animate-fadeIn">
                    <label className="text-[10px] text-gray-500 block">
                      Google Apps Script Web App URL:
                    </label>
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={(e) => {
                        setWebhookUrl(e.target.value);
                        localStorage.setItem('fima_sheet_webhook', e.target.value);
                      }}
                      placeholder="https://script.google.com/macros/s/.../exec"
                      className="w-full px-2.5 py-1.5 text-xs rounded-md border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#1A1A1E]"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSyncingToSheet}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#1E3A8A] hover:bg-blue-900 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSyncingToSheet ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan ke Sheet...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{autoWriteToSheet ? 'Simpan & Tambah ke Sheet' : 'Simpan ke Dashboard'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
