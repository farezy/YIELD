import { ProductionRow } from '../types';

export function cleanLine(s: any): string {
  const str = String(s || '').toUpperCase().trim();
  const match = str.match(/(\d+)/);
  if (!match) return str || 'Line 1';
  return `Line ${match[1]}`;
}

export function cleanAngka(v: any): number {
  if (v == null || v === '') return 0;
  const str = String(v).replace(/%/g, '').trim();
  
  // Handle Indonesian / European vs US number formatting
  let normalized = str;
  if (str.includes(',') && str.includes('.')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      normalized = str.replace(/\./g, '').replace(/,/g, '.');
    } else {
      normalized = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      normalized = str.replace(/,/g, '.');
    } else {
      normalized = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1) {
      normalized = str.replace(/\./g, '');
    }
  }

  const n = parseFloat(normalized);
  return isNaN(n) ? 0 : n;
}

export function extractSheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return trimmed;
}

// Split CSV line taking quotes and escaped quotes into account
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCSVText(csvText: string, preferBasis: 'oracle' | 'teoritis' = 'oracle'): ProductionRow[] {
  const allRows = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (allRows.length < 2) {
    throw new Error('Sheet kosong atau tidak memiliki baris data.');
  }

  const rawHeaders = parseCSVLine(allRows[0]);
  const headersLower = rawHeaders.map(c => c.replace(/["']/g, '').trim().toLowerCase());

  const idx = (needle: string) => headersLower.findIndex(x => x.includes(needle));

  const iBulan = idx('bulan');
  const iLine = idx('line');
  const iProduk = idx('product code') !== -1 ? idx('product code') : idx('produk') !== -1 ? idx('produk') : idx('kode');
  const iBN = idx('bn') !== -1 ? idx('bn') : idx('batch');

  // Standard Yield columns
  const iStandarOracle = idx('yield standard') !== -1 ? idx('yield standard') : idx('standard yield') !== -1 ? idx('standard yield') : idx('standar oracle');
  const iBatchSizeBag = idx('batch size (bag)') !== -1 ? idx('batch size (bag)') : idx('teoritis');
  const iStandarGeneric = idx('standar');

  // Actual good output
  const iActual = idx('actual good output') !== -1 ? idx('actual good output') : idx('jumlah') !== -1 ? idx('jumlah') : idx('dikemas');

  // Yield percentages
  const iRendemenOracle = idx('rendemen kemas to standard') !== -1 ? idx('rendemen kemas to standard') : idx('standard oracle');
  const iRendemenTeoritis = idx('rendemen kemas to teoritis') !== -1 ? idx('rendemen kemas to teoritis') : idx('kemas to teoritis');
  const iStandartLoss = idx('standart loss') !== -1 ? idx('standart loss') : idx('standard loss');

  // Product size & batch size
  const iProductSize = idx('product size');
  const iBatchSizeL = idx('batch size (l)');
  const iAutoclave = idx('keluar dari autoclave') !== -1 ? idx('keluar dari autoclave') : idx('autoclave');
  const iAutoclaveToTeoritis = idx('autoclave to teoritis');
  const iAutoclaveToStandar = idx('autoclave to standart') !== -1 ? idx('autoclave to standart') : idx('autoclave to standar');

  // Defects & Visual
  const iCriticalTotal = headersLower.findIndex(x => x === 'total reject visual critical' || x.startsWith('total reject visual critical '));
  const iCriticalPercent = headersLower.findIndex(x => x.includes('total reject visual critical (%)') || (x.includes('visual critical') && x.includes('%')));
  const iMinorTotal = headersLower.findIndex(x => x === 'total reject visual minor' || x.startsWith('total reject visual minor '));
  const iMinorPercent = headersLower.findIndex(x => x.includes('total reject visual minor (%)') || (x.includes('visual minor') && x.includes('%')));
  const iTotalVisual = headersLower.findIndex(x => x.trim() === 'total reject visual');
  const iOutputVisual = headersLower.findIndex(x => x.trim() === 'total output visual');
  const iOutputVisualPercent = headersLower.findIndex(x => x.includes('total output visual (%)'));

  // Kemas
  const iLeakTest = idx('leak test');
  const iAfkir = idx('afkir kemas');
  const iTotalAfkir = headersLower.findIndex(x => x.trim() === 'total produk afkir');
  const iTotalAfkirPercent = headersLower.findIndex(x => x.includes('total produk afkir (%)'));
  const iSampel = headersLower.findIndex(x => x.includes('sampel rutin') && !x.includes('%')) !== -1 ? headersLower.findIndex(x => x.includes('sampel rutin') && !x.includes('%')) : idx('sampel');
  const iSampelRutinPercent = headersLower.findIndex(x => x.includes('sampel rutin (%)'));
  const iProbe = idx('produk ditusuk probe') !== -1 ? idx('produk ditusuk probe') : idx('probe');
  const iSampelNonRutin = headersLower.findIndex(x => x.includes('sampel non rutin') && !x.includes('%'));
  const iSampelNonRutinPercent = headersLower.findIndex(x => x.includes('sampel non rutin (%)'));

  const iPp = headersLower.findIndex(x => x === 'pp' || x.includes('visual critical pp'));
  const iPh = headersLower.findIndex(x => x === 'ph');
  const iPw = headersLower.findIndex(x => x === 'pw');
  const iSe = headersLower.findIndex(x => x === 'se');
  const iBc = headersLower.findIndex(x => x === 'bc');

  // Minor Defect columns from Sheet
  const iPr = headersLower.findIndex(x => x === 'minor pr' || x === 'pr' || x.startsWith('minor pr'));
  const iDe = headersLower.findIndex(x => x === 'de');
  const iVi = headersLower.findIndex(x => x === 'vi');
  const iSt = headersLower.findIndex(x => x === 'st');
  const iRp = headersLower.findIndex(x => x === 'rp');
  const iTb = headersLower.findIndex(x => x === 'tb');
  const iKr = headersLower.findIndex(x => x === 'kr');
  const iPb = headersLower.findIndex(x => x === 'pb');
  const iLl = headersLower.findIndex(x => x === 'll');

  // Stage percentages (Mixing & Filling) - Exactly matching percentage columns, excluding (L) / Liter
  const iFobLob = headersLower.findIndex(x => (x.includes('fob–lob') || x.includes('fob-lob') || (x.includes('fob') && x.includes('lob'))) && x.includes('%'));
  const iIpcMixing = headersLower.findIndex(x => (x.includes('ipc mixing') && x.includes('%')) || (x.includes('mixing') && x.includes('%') && !x.includes('(l)')));
  const iFlushing = headersLower.findIndex(x => x.includes('flushing') && x.includes('%'));
  const iIpcFilling = headersLower.findIndex(x => x.includes('filling') && x.includes('%') && !x.includes('(l)'));

  const parsed: ProductionRow[] = [];

  for (let i = 1; i < allRows.length; i++) {
    const cols = parseCSVLine(allRows[i]).map(c => c.replace(/^["']|["']$/g, '').trim());
    if (cols.length < 2 || !cols.join('').trim()) continue;

    const lineVal = cleanLine(cols[iLine] || 'Line 1');
    const produkVal = iProduk !== -1 ? cols[iProduk] : `FP-${1000 + i}`;
    const bnVal = iBN !== -1 ? cols[iBN] : `BN-${2600 + i}`;
    
    // Standards
    const stdOracle = iStandarOracle !== -1 ? cleanAngka(cols[iStandarOracle]) : 0;
    const stdTeoritis = iBatchSizeBag !== -1 ? cleanAngka(cols[iBatchSizeBag]) : (iStandarGeneric !== -1 ? cleanAngka(cols[iStandarGeneric]) : 0);
    const standardMain = stdOracle > 0 ? stdOracle : stdTeoritis;

    // Actual Output
    const jumlahVal = iActual !== -1 ? cleanAngka(cols[iActual]) : 0;
    // Yield Calculations (Rendemen Kemas to Standard / Teoritis)
    // Ambil data langsung dari kolom Rendemen Kemas to Standard sesuai link sheet
    let yieldOracle = 0;
    if (iRendemenOracle !== -1 && cols[iRendemenOracle] && cols[iRendemenOracle] !== 'N/A') {
      yieldOracle = cleanAngka(cols[iRendemenOracle]);
    } else if (stdOracle > 0 && jumlahVal > 0) {
      yieldOracle = Number(((jumlahVal / stdOracle) * 100).toFixed(2));
    }

    let yieldTeoritis = 0;
    if (iRendemenTeoritis !== -1 && cols[iRendemenTeoritis] && cols[iRendemenTeoritis] !== 'N/A') {
      yieldTeoritis = cleanAngka(cols[iRendemenTeoritis]);
    } else if (stdTeoritis > 0 && jumlahVal > 0) {
      yieldTeoritis = Number(((jumlahVal / stdTeoritis) * 100).toFixed(2));
    }

    // Hanya lewati baris jika benar-benar kosong (tidak ada standar, output riil, maupun data rendemen)
    if (standardMain <= 0 && jumlahVal <= 0 && yieldOracle <= 0 && yieldTeoritis <= 0) continue;

    const activeYield = preferBasis === 'teoritis' 
      ? (yieldTeoritis > 0 ? yieldTeoritis : yieldOracle)
      : (yieldOracle > 0 ? yieldOracle : yieldTeoritis);

    const standartLossVal =
      iStandartLoss !== -1 && cols[iStandartLoss] && cols[iStandartLoss] !== 'N/A'
        ? cleanAngka(cols[iStandartLoss])
        : stdTeoritis > 0 && stdOracle > 0
        ? Number((((stdTeoritis - stdOracle) / stdTeoritis) * 100).toFixed(2))
        : 0;

    parsed.push({
      id: `row-${i}-${Date.now()}`,
      Line: lineVal,
      Produk: produkVal,
      BN: bnVal,
      Standar: preferBasis === 'teoritis' ? (stdTeoritis > 0 ? stdTeoritis : standardMain) : standardMain,
      StandarOracle: stdOracle,
      StandarTeoritis: stdTeoritis,
      Jumlah: jumlahVal,
      Yield: activeYield,
      YieldOracle: yieldOracle,
      YieldTeoritis: yieldTeoritis,
      StandartLoss: standartLossVal,
      Bulan: iBulan !== -1 ? cols[iBulan] : 'Nov',
      ProductSizeMl: iProductSize !== -1 ? cleanAngka(cols[iProductSize]) : undefined,
      BatchSizeL: iBatchSizeL !== -1 ? cleanAngka(cols[iBatchSizeL]) : undefined,
      BatchSizeBag: stdTeoritis,
      AutoclaveOutput: iAutoclave !== -1 ? cleanAngka(cols[iAutoclave]) : undefined,
      rejectCriticalTotal: iCriticalTotal !== -1 ? cleanAngka(cols[iCriticalTotal]) : 0,
      defectPp: iPp !== -1 ? cleanAngka(cols[iPp]) : 0,
      defectPh: iPh !== -1 ? cleanAngka(cols[iPh]) : 0,
      defectPw: iPw !== -1 ? cleanAngka(cols[iPw]) : 0,
      defectSe: iSe !== -1 ? cleanAngka(cols[iSe]) : 0,
      defectBc: iBc !== -1 ? cleanAngka(cols[iBc]) : 0,
      defectPr: iPr !== -1 ? cleanAngka(cols[iPr]) : 0,
      defectDe: iDe !== -1 ? cleanAngka(cols[iDe]) : 0,
      defectVi: iVi !== -1 ? cleanAngka(cols[iVi]) : 0,
      defectSt: iSt !== -1 ? cleanAngka(cols[iSt]) : 0,
      defectRp: iRp !== -1 ? cleanAngka(cols[iRp]) : 0,
      defectTb: iTb !== -1 ? cleanAngka(cols[iTb]) : 0,
      defectKr: iKr !== -1 ? cleanAngka(cols[iKr]) : 0,
      defectPb: iPb !== -1 ? cleanAngka(cols[iPb]) : 0,
      defectLl: iLl !== -1 ? cleanAngka(cols[iLl]) : 0,
      rejectMinorTotal: iMinorTotal !== -1 ? cleanAngka(cols[iMinorTotal]) : 0,
      leakTestCount: iLeakTest !== -1 ? cleanAngka(cols[iLeakTest]) : 0,
      afkirKemas: iAfkir !== -1 ? cleanAngka(cols[iAfkir]) : 0,
      sampelCount: iSampel !== -1 ? cleanAngka(cols[iSampel]) : 0,
      probeCount: iProbe !== -1 ? cleanAngka(cols[iProbe]) : 0,
      fobLobPercent: iFobLob !== -1 && cols[iFobLob] ? cols[iFobLob] : undefined,
      ipcMixingPercent: iIpcMixing !== -1 && cols[iIpcMixing] ? cols[iIpcMixing] : undefined,
      flushingPercent: iFlushing !== -1 && cols[iFlushing] ? cols[iFlushing] : undefined,
      ipcFillingPercent: iIpcFilling !== -1 && cols[iIpcFilling] ? cols[iIpcFilling] : undefined,
      autoclaveToTeoritisPercent: iAutoclaveToTeoritis !== -1 && cols[iAutoclaveToTeoritis] ? cols[iAutoclaveToTeoritis] : undefined,
      autoclaveToStandarPercent: iAutoclaveToStandar !== -1 && cols[iAutoclaveToStandar] ? cols[iAutoclaveToStandar] : undefined,
      rejectCriticalPercent: iCriticalPercent !== -1 && cols[iCriticalPercent] ? cols[iCriticalPercent] : undefined,
      rejectMinorPercent: iMinorPercent !== -1 && cols[iMinorPercent] ? cols[iMinorPercent] : undefined,
      totalRejectVisual: iTotalVisual !== -1 ? cleanAngka(cols[iTotalVisual]) : undefined,
      totalOutputVisual: iOutputVisual !== -1 ? cleanAngka(cols[iOutputVisual]) : undefined,
      totalOutputVisualPercent: iOutputVisualPercent !== -1 && cols[iOutputVisualPercent] ? cols[iOutputVisualPercent] : undefined,
      totalProdukAfkir: iTotalAfkir !== -1 ? cleanAngka(cols[iTotalAfkir]) : undefined,
      totalProdukAfkirPercent: iTotalAfkirPercent !== -1 && cols[iTotalAfkirPercent] ? cols[iTotalAfkirPercent] : undefined,
      sampelRutinPercent: iSampelRutinPercent !== -1 && cols[iSampelRutinPercent] ? cols[iSampelRutinPercent] : undefined,
      sampelNonRutin: iSampelNonRutin !== -1 ? cleanAngka(cols[iSampelNonRutin]) : undefined,
      sampelNonRutinPercent: iSampelNonRutinPercent !== -1 && cols[iSampelNonRutinPercent] ? cols[iSampelNonRutinPercent] : undefined,
    });
  }

  return parsed;
}

export interface KnownProductTemplate {
  code: string;
  name: string;
  line: 'Line 1' | 'Line 2' | 'Line 4';
  sizeMl: number;
  batchSizeL: number;
  standarOracle: number;
  standarTeoritis: number;
}

export const KNOWN_PRODUCTS_TEMPLATE: KnownProductTemplate[] = [
  {
    code: 'VTTSA',
    name: 'VTTSA 500mL',
    line: 'Line 1',
    sizeMl: 500,
    batchSizeL: 2300,
    standarOracle: 4352,
    standarTeoritis: 4581,
  },
  {
    code: 'VAMPA',
    name: 'VAMPA 100mL',
    line: 'Line 2',
    sizeMl: 100,
    batchSizeL: 1200,
    standarOracle: 10382,
    standarTeoritis: 11538,
  },
  {
    code: 'VCLNB',
    name: 'VCLNB 100mL',
    line: 'Line 2',
    sizeMl: 100,
    batchSizeL: 3500,
    standarOracle: 33000,
    standarTeoritis: 33653,
  },
  {
    code: 'VCRVG',
    name: 'VCRVG 100mL',
    line: 'Line 2',
    sizeMl: 100,
    batchSizeL: 900,
    standarOracle: 8300,
    standarTeoritis: 8653,
  },
  {
    code: 'VLONA',
    name: 'VLONA 100mL',
    line: 'Line 4',
    sizeMl: 100,
    batchSizeL: 2500,
    standarOracle: 23543,
    standarTeoritis: 24509,
  },
  {
    code: 'VPELA',
    name: 'VPELA 100mL',
    line: 'Line 4',
    sizeMl: 100,
    batchSizeL: 3650,
    standarOracle: 34373,
    standarTeoritis: 35436,
  },
];

export function formatRowToSheetCSV(row: ProductionRow): string {
  const lineNum = String(row.Line).replace(/\D/g, '') || '1';
  const sizeMl = row.ProductSizeMl || 100;
  const batchL = row.BatchSizeL || 2300;
  const stdTeoritis = row.StandarTeoritis || row.Standar || 0;
  const stdOracle = row.StandarOracle || row.Standar || 0;
  const goodOutput = row.Jumlah || 0;
  const yieldTeoritis = stdTeoritis > 0 ? ((goodOutput / stdTeoritis) * 100).toFixed(0) : '0';
  const yieldOracle = stdOracle > 0 ? ((goodOutput / stdOracle) * 100).toFixed(0) : '0';
  const volTheo = (sizeMl / 1000).toFixed(3).replace('.', ',');

  const critTotal =
    row.rejectCriticalTotal != null
      ? row.rejectCriticalTotal
      : (row.defectPp || 0) +
        (row.defectPh || 0) +
        (row.defectPw || 0) +
        (row.defectSe || 0) +
        (row.defectBc || 0);
  const minorTotal = row.rejectMinorTotal || 0;

  const cols = [
    `"${row.Bulan || 'November'}"`,
    `"${lineNum}"`,
    `"${row.Produk}"`,
    `"${row.BN}"`,
    `"${sizeMl}"`,
    `"${batchL}"`,
    `"${stdTeoritis}"`,
    `"${stdOracle}"`,
    `"${volTheo}"`,
    `"0,1"`, // FOB (Liter)
    `"0,4"`, // LOB (Liter)
    `"0,02%"`, // FOB-LOB %
    `"2"`, // IPC Mixing (L)
    `"0,08%"`, // IPC Mixing %
    `"20"`, // Jumlah Flushing tiap nozzle
    `"20"`, // Flushing (L)
    `"1,74%"`, // Flushing %
    `"10"`, // IPC Filling (L)
    `"0,44%"`, // IPC Filling %
    `"${row.AutoclaveOutput || goodOutput}"`,
    `"${row.defectPp || 0}"`,
    `"${row.defectPh || 0}"`,
    `"${row.defectPw || 0}"`,
    `"${row.defectSe || 0}"`,
    `"${row.defectBc || 0}"`,
    `"${critTotal}"`,
    `"${row.defectPr || 0}"`, // Pr
    `"${row.defectDe || 0}"`, // De
    `"${row.defectVi || 0}"`, // VI
    `"${row.defectSt || 0}"`, // St
    `"${row.defectRp || 0}"`, // Rp
    `"${row.defectTb || 0}"`, // Tb
    `"${row.defectKr || 0}"`, // Kr
    `"${row.defectPb || 0}"`, // Pb
    `"${row.defectLl || 0}"`, // LL
    `"${minorTotal}"`,
    `"${row.sampelCount || 0}"`,
    `"${row.probeCount || 0}"`,
    `"${row.leakTestCount || 0}"`,
    `"${row.afkirKemas || 0}"`,
    `"${goodOutput}"`,
    `"${yieldTeoritis}%"`,
    `"${yieldOracle}%"`,
  ];

  return cols.join(',');
}

export function formatRowToSheetTSV(row: ProductionRow): string {
  const lineNum = String(row.Line).replace(/\D/g, '') || '1';
  const sizeMl = row.ProductSizeMl || 100;
  const batchL = row.BatchSizeL || 2300;
  const stdTeoritis = row.StandarTeoritis || row.Standar || 0;
  const stdOracle = row.StandarOracle || row.Standar || 0;
  const goodOutput = row.Jumlah || 0;
  const yieldTeoritis = stdTeoritis > 0 ? ((goodOutput / stdTeoritis) * 100).toFixed(0) : '0';
  const yieldOracle = stdOracle > 0 ? ((goodOutput / stdOracle) * 100).toFixed(0) : '0';
  const volTheo = (sizeMl / 1000).toFixed(3).replace('.', ',');

  const critTotal =
    row.rejectCriticalTotal != null
      ? row.rejectCriticalTotal
      : (row.defectPp || 0) +
        (row.defectPh || 0) +
        (row.defectPw || 0) +
        (row.defectSe || 0) +
        (row.defectBc || 0);
  const minorTotal = row.rejectMinorTotal || 0;

  const cols = [
    row.Bulan || 'November',
    lineNum,
    row.Produk,
    row.BN,
    sizeMl,
    batchL,
    stdTeoritis,
    stdOracle,
    volTheo,
    '0,1',
    '0,4',
    '0,02%',
    '2',
    '0,08%',
    '20',
    '20',
    '1,74%',
    '10',
    '0,44%',
    row.AutoclaveOutput || goodOutput,
    row.defectPp || 0,
    row.defectPh || 0,
    row.defectPw || 0,
    row.defectSe || 0,
    row.defectBc || 0,
    critTotal,
    row.defectPr || 0,
    row.defectDe || 0,
    row.defectVi || 0,
    row.defectSt || 0,
    row.defectRp || 0,
    row.defectTb || 0,
    row.defectKr || 0,
    row.defectPb || 0,
    row.defectLl || 0,
    minorTotal,
    row.sampelCount || 0,
    row.probeCount || 0,
    row.leakTestCount || 0,
    row.afkirKemas || 0,
    goodOutput,
    `${yieldTeoritis}%`,
    `${yieldOracle}%`,
  ];

  return cols.join('\t');
}

export function buildRowRawValues(row: ProductionRow): (string | number)[] {
  const lineNum = String(row.Line).replace(/\D/g, '') || '1';
  const sizeMl = row.ProductSizeMl || 100;
  const batchL = row.BatchSizeL || 2300;
  const stdTeoritis = row.StandarTeoritis || row.Standar || 0;
  const stdOracle = row.StandarOracle || row.Standar || 0;
  const goodOutput = row.Jumlah || 0;
  const yieldTeoritis = stdTeoritis > 0 ? `${((goodOutput / stdTeoritis) * 100).toFixed(0)}%` : '0%';
  const yieldOracle = stdOracle > 0 ? `${((goodOutput / stdOracle) * 100).toFixed(0)}%` : '0%';
  const volTheo = (sizeMl / 1000).toFixed(3).replace('.', ',');

  const critTotal =
    row.rejectCriticalTotal != null
      ? row.rejectCriticalTotal
      : (row.defectPp || 0) +
        (row.defectPh || 0) +
        (row.defectPw || 0) +
        (row.defectSe || 0) +
        (row.defectBc || 0);
  const minorTotal = row.rejectMinorTotal || 0;

  return [
    row.Bulan || 'November',
    Number(lineNum) || lineNum,
    row.Produk,
    row.BN,
    sizeMl,
    batchL,
    stdTeoritis,
    stdOracle,
    volTheo,
    '0,1',
    '0,4',
    '0,02%',
    2,
    '0,08%',
    20,
    20,
    '1,74%',
    10,
    '0,44%',
    row.AutoclaveOutput || goodOutput,
    row.defectPp || 0,
    row.defectPh || 0,
    row.defectPw || 0,
    row.defectSe || 0,
    row.defectBc || 0,
    critTotal,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    minorTotal,
    row.sampelCount || 0,
    row.probeCount || 0,
    row.leakTestCount || 0,
    row.afkirKemas || 0,
    goodOutput,
    yieldTeoritis,
    yieldOracle,
  ];
}
