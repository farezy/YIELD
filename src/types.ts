export interface ProductionRow {
  id: string;
  Line: 'Line 1' | 'Line 2' | 'Line 4' | string;
  Produk: string;
  BN: string;
  Standar: number; // Standard Oracle or chosen standard
  StandarOracle?: number;
  StandarTeoritis?: number;
  Jumlah: number; // Actual Good Output
  Yield: number; // Active Yield %
  YieldOracle?: number;
  YieldTeoritis?: number;
  StandartLoss?: number; // Standard Loss % ((StandarTeoritis - StandarOracle) / StandarTeoritis * 100)
  Bulan?: string;
  Tanggal?: string;
  ProductSizeMl?: number;
  BatchSizeL?: number;
  BatchSizeBag?: number;
  AutoclaveOutput?: number;

  // Sterilisasi percentages directly from Sheet
  autoclaveToTeoritisPercent?: string;
  autoclaveToStandarPercent?: string;
  
  // Critical defect breakdown from Sheet
  rejectCriticalTotal?: number;
  rejectCriticalPercent?: string;
  defectPp?: number; // Partikel Plastik
  defectPh?: number; // Partikel Hitam
  defectPw?: number; // Partikel Warna
  defectSe?: number; // Seal
  defectBc?: number; // Bocor
  
  // Minor & in-process rejects from Sheet
  rejectMinorTotal?: number;
  rejectMinorPercent?: string;
  defectPr?: number; // Minor Pr
  defectDe?: number; // Minor De
  defectVi?: number; // Minor VI
  defectSt?: number; // Minor St
  defectRp?: number; // Minor Rp
  defectTb?: number; // Minor Tb
  defectKr?: number; // Minor Kr
  defectPb?: number; // Minor Pb
  defectLl?: number; // Minor LL (Lain-Lain)
  totalRejectVisual?: number;
  totalOutputVisual?: number;
  totalOutputVisualPercent?: string;

  // Kemas & in-process rejects from Sheet
  leakTestCount?: number;
  afkirKemas?: number;
  totalProdukAfkir?: number;
  totalProdukAfkirPercent?: string;
  sampelCount?: number; // Sampel Rutin
  sampelRutinPercent?: string;
  probeCount?: number; // Produk ditusuk probe
  sampelNonRutin?: number;
  sampelNonRutinPercent?: string;

  // Mixing & Filling percentages directly from Sheet
  fobLobPercent?: string;
  flushingPercent?: string;
  ipcMixingPercent?: string;
  ipcFillingPercent?: string;
  Catatan?: string;
}

export interface MonthlyStats {
  labels: string[];
  L1: number[];
  L2: number[];
  L4: number[];
}

export type FetchStatus = 'live' | 'loading' | 'error' | 'idle';

export interface CriticalDefect {
  id: string;
  kode: string;
  kategori: string;
  nama: string;
  deskripsi: string;
  tingkatKritis: 'Critical 1' | 'Critical 2' | 'Major';
  tindakan: string;
  standarPenerimaan: string;
}
