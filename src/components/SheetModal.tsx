import React, { useState, useEffect, useRef } from 'react';
import { extractSheetId, parseCSVText } from '../utils/sheetParser';
import { X, ExternalLink, HelpCircle, Check, Copy, Upload, Radio, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ProductionRow } from '../types';

interface SheetModalProps {
  isOpen: boolean;
  currentSheetId: string;
  currentSheetName: string;
  onClose: () => void;
  onSave: (sheetId: string, sheetName: string) => void;
  onImportCsvRows?: (rows: ProductionRow[], rawCsv?: string) => void;
}

export const SheetModal: React.FC<SheetModalProps> = ({
  isOpen,
  currentSheetId,
  currentSheetName,
  onClose,
  onSave,
  onImportCsvRows,
}) => {
  const [activeTab, setActiveTab] = useState<'sheet' | 'csv'>('sheet');
  const [inputLink, setInputLink] = useState('');
  const [inputSheetName, setInputSheetName] = useState('Sheet1');
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [validationError, setValidationError] = useState('');
  
  // Connection tester state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [csvTextData, setCsvTextData] = useState('');
  const [csvError, setCsvError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputLink(
        currentSheetId
          ? `https://docs.google.com/spreadsheets/d/${currentSheetId}/edit`
          : ''
      );
      setInputSheetName(currentSheetName || 'Sheet1');
      setValidationError('');
      setTestResult(null);
      setCsvError('');
    }
  }, [isOpen, currentSheetId, currentSheetName]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const raw = inputLink.trim();
    if (!raw) {
      setValidationError('Silakan masukkan Link atau ID Google Sheet terlebih dahulu');
      return;
    }
    setValidationError('');
    setIsTesting(true);
    setTestResult(null);

    const sheetId = extractSheetId(raw);
    const sName = inputSheetName.trim() || 'Sheet1';
    const testUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
      sName
    )}&t=${Date.now()}`;

    try {
      const res = await fetch(testUrl);
      if (!res.ok) {
        throw new Error('Akses ditolak. Pastikan sharing: Anyone with link can view.');
      }
      const txt = await res.text();
      const parsed = parseCSVText(txt);
      setTestResult({
        success: true,
        msg: `Koneksi Berhasil! Terbaca ${parsed.length} baris data valid.`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: `Uji gagal: ${err.message || 'Tidak dapat mengakses sheet'}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setValidationError('');
    const raw = inputLink.trim();
    if (!raw) {
      setValidationError('Mohon masukkan Link atau ID Google Sheet terlebih dahulu!');
      return;
    }
    const extractedId = extractSheetId(raw);
    const sName = inputSheetName.trim() || 'Sheet1';
    onSave(extractedId, sName);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvTextData(content);
      try {
        const parsed = parseCSVText(content);
        if (onImportCsvRows) {
          onImportCsvRows(parsed, content);
          onClose();
        }
      } catch (err: any) {
        setCsvError(err.message || 'Gagal memproses file CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessCsvText = () => {
    setCsvError('');
    if (!csvTextData.trim()) {
      setCsvError('Teks CSV masih kosong');
      return;
    }
    try {
      const parsed = parseCSVText(csvTextData);
      if (onImportCsvRows) {
        onImportCsvRows(parsed, csvTextData);
        onClose();
      }
    } catch (err: any) {
      setCsvError(err.message || 'Format CSV tidak valid');
    }
  };

  const copyTemplateCsv = () => {
    const template = `Line,Produk,BN,Standar,Jumlah,Bulan\nLine 1,FP-1023,BN25091,5000,4644,Jan\nLine 1,FP-1024,BN25092,4800,4578,Feb\nLine 2,FP-2041,BN25094,6000,6035,Feb\nLine 4,FP-4042,BN25095,5500,5512,Mar`;
    navigator.clipboard.writeText(template);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white w-full max-w-xl rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-neutral-800 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-neutral-800">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Koneksi Sumber Data
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Hubungkan Google Spreadsheet online atau unggah file data lokal
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-2 mt-4 p-1 rounded-xl bg-gray-100 dark:bg-[#222228]">
          <button
            type="button"
            onClick={() => setActiveTab('sheet')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'sheet'
                ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Google Sheet (Online)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'csv'
                ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Unggah / Tempel CSV
          </button>
        </div>

        {activeTab === 'sheet' ? (
          <div className="mt-4 space-y-3.5">
            {validationError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Tempel Link Google Sheet
              </label>
              <input
                type="text"
                value={inputLink}
                onChange={(e) => {
                  setInputLink(e.target.value);
                  setValidationError('');
                }}
                placeholder="https://docs.google.com/spreadsheets/d/1pa8tvLJ6Q8LcA9ECByy0HHG0ZmuUeZQq/edit"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#222228] text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nama Tab / Sheet
                </label>
                <input
                  type="text"
                  value={inputSheetName}
                  onChange={(e) => setInputSheetName(e.target.value)}
                  placeholder="Nama Sheet (mis: Sheet1)"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#222228] text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 font-mono"
                />
              </div>

              {/* Test Connection Button */}
              <div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="w-full py-2.5 px-3 rounded-lg text-xs font-bold border border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Menguji...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Uji Koneksi Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Test Connection Result Feedback */}
            {testResult && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 font-medium ${
                  testResult.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                )}
                <span>{testResult.msg}</span>
              </div>
            )}

            {/* Quick Actions & Presets */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setInputLink('https://docs.google.com/spreadsheets/d/1pa8tvLJ6Q8LcA9ECByy0HHG0ZmuUeZQq/edit');
                  setInputSheetName('Sheet1');
                  setValidationError('');
                }}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                • Gunakan Link Sheet FIMA
              </button>
              <span className="text-gray-300 dark:text-neutral-700">|</span>
              <button
                type="button"
                onClick={copyTemplateCsv}
                className="text-xs text-gray-600 dark:text-gray-400 font-semibold hover:underline inline-flex items-center gap-1"
              >
                {copiedTemplate ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>Format Kolom Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin Format Header Kolom</span>
                  </>
                )}
              </button>
            </div>

            {/* Guide Info */}
            <div className="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 p-3 text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                Petunjuk Akses Google Sheet:
              </p>
              <p className="text-blue-800 dark:text-blue-300 text-[11px] leading-relaxed">
                1. Buka Sheet, klik <b>Bagikan (Share)</b> di pojok kanan atas.<br />
                2. Ubah akses umum: <b>Siapa saja yang memiliki link (Anyone with link can view)</b>.<br />
                3. Pastikan kolom pertama memiliki nama: <b>Line, Produk, BN, Standar, Jumlah, Bulan</b>.
              </p>
            </div>

            <div className="mt-5 flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-[#1E3A8A] hover:bg-blue-900 text-white shadow-xs transition-colors"
              >
                Simpan & Tarik Data
              </button>
            </div>
          </div>
        ) : (
          /* CSV Upload Tab */
          <div className="mt-4 space-y-3.5">
            {csvError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{csvError}</span>
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-6 px-4 border-2 border-dashed border-gray-300 dark:border-neutral-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-neutral-800/40 transition-all flex flex-col items-center justify-center gap-2 text-center"
              >
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Klik untuk Memilih File CSV dari Komputer
                </span>
                <span className="text-[11px] text-gray-400 dark:text-gray-500">
                  Mendukung file .csv hasil ekspor dari Excel atau Google Sheets
                </span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Atau Tempel Teks CSV Secara Manual
              </label>
              <textarea
                rows={4}
                value={csvTextData}
                onChange={(e) => setCsvTextData(e.target.value)}
                placeholder="Line,Produk,BN,Standar,Jumlah,Bulan&#10;Line 1,FP-1023,BN25091,5000,4644,Jan"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-[#222228] text-gray-900 dark:text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-gray-800 dark:text-gray-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleProcessCsvText}
                className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Terapkan Data CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
