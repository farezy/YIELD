import { ProductionRow, CriticalDefect } from '../types';
import { RAW_SHEET_DEFAULT_CSV } from './rawSheetDefault';
import { parseCSVText } from './sheetParser';

// The verified real-world batches from the connected Google Sheet (1pa8tvLJ6Q8LcA9ECByy0HHG0ZmuUeZQq)
export const INITIAL_DEMO_ROWS: ProductionRow[] = parseCSVText(RAW_SHEET_DEFAULT_CSV, 'oracle');

export const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const CRITICAL_DEFECTS_DATA: CriticalDefect[] = [
  {
    id: 'def-1',
    kode: 'DEF-CRIT-01',
    kategori: 'Integritas Kemasan Primer',
    nama: 'Kebocoran Kemasan (Leakage / Bc)',
    deskripsi: 'Seal kemasan primer bocor (Bc), blister berlubang, atau botol infus bocor saat uji tekan desikator.',
    tingkatKritis: 'Critical 1',
    tindakan: 'Stop Line segera. Karantina seluruh batch berjalan. Lakukan leak test ulang 100%. Laporkan ke QA Head.',
    standarPenerimaan: '0 (Zero Tolerance)'
  },
  {
    id: 'def-2',
    kode: 'DEF-CRIT-02',
    kategori: 'Integritas Seal (Se)',
    nama: 'Defect Seal / Port Welding (Se)',
    deskripsi: 'Seal port infus tidak rapat, lelehan seal berlebih (flashing), atau welding bag terbuka.',
    tingkatKritis: 'Critical 1',
    tindakan: 'Kalibrasi temperatur dan tekanan sealing machine. Pisahkan unit terdampak.',
    standarPenerimaan: '0 (Zero Tolerance)'
  },
  {
    id: 'def-3',
    kode: 'DEF-CRIT-03',
    kategori: 'Kontaminasi Partikel (Pp)',
    nama: 'Partikel Asing Melayang (Pp)',
    deskripsi: 'Ditemukan partikel asing, serat, bintik hitam, atau serpihan kaca/logam di dalam larutan infus bag.',
    tingkatKritis: 'Critical 1',
    tindakan: 'Hentikan mesin filling/sealing. Inspeksi filter inline 0.22 micron. Investigasi CAPA menyeluruh.',
    standarPenerimaan: '0 (Zero Tolerance)'
  },
  {
    id: 'def-4',
    kode: 'DEF-CRIT-04',
    kategori: 'Pencetakan & Koding (Coding/Marking)',
    nama: 'Nomor Batch / ED Hilang atau Tertukar',
    deskripsi: 'Pencetakan Batch Number (BN) atau Expired Date (ED) tidak terbaca sama sekali, salah koding, atau mismatch dengan dokumen BMR.',
    tingkatKritis: 'Critical 1',
    tindakan: 'Karantina produk kemas. Identifikasi titik awal salah koding. Lakukan rekonsiliasi bahan kemas sekunder.',
    standarPenerimaan: '0 (Zero Tolerance)'
  },
  {
    id: 'def-5',
    kode: 'DEF-CRIT-05',
    kategori: 'Volume & Bobot',
    nama: 'Underfill / Bobot Kurang Ekstrem',
    deskripsi: 'Volume cairan atau bobot netto sediaan kurang dari batas toleransi Farmakope Indonesia.',
    tingkatKritis: 'Critical 2',
    tindakan: 'Kalibrasi checkweigher. Uji sampel sampling acak setiap 15 menit. Sesuaikan setting pompa dispenser filling.',
    standarPenerimaan: 'Batas toleransi Farmakope Indonesia (±2%)'
  },
  {
    id: 'def-6',
    kode: 'DEF-CRIT-06',
    kategori: 'Segel Pengaman (Tamper Evident)',
    nama: 'Cap / Induction Seal Tidak Menempel',
    deskripsi: 'Aluminium induction foil tidak terlekat rapat pada mulut botol atau cap ulir miring / patah.',
    tingkatKritis: 'Critical 2',
    tindakan: 'Sesuaikan daya induksi sealing machine dan suhu konveyor. Ganti batch cap roll jika ditemukan cacat bahan.',
    standarPenerimaan: '100% kedap udara (uji vakum desikator)'
  }
];
