import React, { useState } from 'react';
import { CRITICAL_DEFECTS_DATA } from '../utils/mockData';
import { AlertTriangle, X, ShieldAlert, CheckCircle, Search, Printer, Copy, Check } from 'lucide-react';

interface DefectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DefectModal: React.FC<DefectModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const categories = [
    'Semua',
    'Integritas Kemasan Primer',
    'Pencetakan & Koding (Coding/Marking)',
    'Kontaminasi Fisik',
    'Volume & Bobot',
    'Segel Pengaman (Tamper Evident)',
  ];

  const filteredDefects = CRITICAL_DEFECTS_DATA.filter((d) => {
    const matchesSearch =
      d.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.deskripsi.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      selectedCategory === 'Semua' || d.kategori === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopyChecklist = () => {
    const text = filteredDefects
      .map(
        (d) =>
          `[${d.kode}] ${d.nama} (${d.tingkatKritis})\nKategori: ${d.kategori}\nDeskripsi: ${d.deskripsi}\nTindakan: ${d.tindakan}\nStandar Penerimaan: ${d.standarPenerimaan}\n`
      )
      .join('\n---\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-2xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#1A1A1E] text-gray-900 dark:text-white w-full max-w-4xl max-h-[90vh] rounded-2xl p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-neutral-800 flex flex-col transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                Klasifikasi Defect Critical Packaging
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Standar Kepatuhan Mutu CPOB (GMP) • PT FIMA INTERNASIONAL (A Kalbe Company)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Action Bar */}
        <div className="py-3 shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari jenis defect, kode, atau tindakan penanganan..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-gray-300 dark:border-neutral-700 bg-gray-50 dark:bg-[#222228] text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-red-500"
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyChecklist}
              className="py-2 px-3 rounded-lg border border-gray-300 dark:border-neutral-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin SOP</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="py-2 px-3 rounded-lg border border-gray-300 dark:border-neutral-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto shrink-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-neutral-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Defect Cards List */}
        <div className="overflow-y-auto space-y-3 pr-1 py-1 flex-1">
          {filteredDefects.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-xs">
              Tidak ada klasifikasi defect yang cocok dengan pencarian "{searchTerm}"
            </div>
          ) : (
            filteredDefects.map((def) => (
              <div
                key={def.id}
                className="p-3.5 rounded-xl border border-red-200/80 dark:border-red-950/60 bg-red-50/40 dark:bg-red-950/20 flex flex-col gap-2 transition-all hover:border-red-300 dark:hover:border-red-900 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 mr-2">
                      {def.kode}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {def.kategori}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1">
                      {def.nama}
                    </h4>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-red-600 text-white shrink-0">
                    {def.tingkatKritis}
                  </span>
                </div>

                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {def.deskripsi}
                </p>

                <div className="pt-2 border-t border-red-200/60 dark:border-red-900/40 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="text-gray-800 dark:text-gray-200">
                    <span className="font-bold text-red-700 dark:text-red-400 block mb-0.5">
                      Tindakan Segera Line:
                    </span>
                    {def.tindakan}
                  </div>
                  <div className="text-gray-800 dark:text-gray-200">
                    <span className="font-bold text-gray-600 dark:text-gray-400 block mb-0.5">
                      Standar Toleransi Mutu:
                    </span>
                    {def.standarPenerimaan}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-gray-100 dark:border-neutral-800 mt-2 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {filteredDefects.length} standar defect terdaftar
          </span>
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-lg text-xs font-bold bg-[#E53935] hover:bg-red-700 text-white transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
