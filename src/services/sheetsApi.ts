import { ProductionRow } from '../types';
import { buildRowRawValues } from '../utils/sheetParser';
import { getAccessToken, googleSignIn } from './googleAuth';

export interface AppendRowResult {
  success: boolean;
  message: string;
  updatedRange?: string;
  updatedRows?: number;
}

export async function appendRowToGoogleSheet(
  spreadsheetId: string,
  sheetName: string,
  row: ProductionRow,
  explicitToken?: string
): Promise<AppendRowResult> {
  let token = explicitToken || (await getAccessToken());

  // If not signed in yet, prompt login
  if (!token) {
    try {
      const authRes = await googleSignIn();
      if (!authRes?.accessToken) {
        return {
          success: false,
          message: 'Autentikasi Google diperlukan untuk menambahkan baris ke Google Sheet.',
        };
      }
      token = authRes.accessToken;
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Login akun Google dibatalkan atau gagal.',
      };
    }
  }

  const rawValues = buildRowRawValues(row);
  const cleanSheetName = sheetName || 'Sheet1';
  // Standard Sheets API append range
  const range = `'${cleanSheetName}'!A:AQ`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
    spreadsheetId
  )}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [rawValues],
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => null);
      const detail = errJson?.error?.message;
      if (response.status === 403) {
        return {
          success: false,
          message:
            detail ||
            'Akses ditolak (403): Akun Google Anda memerlukan izin Edit pada spreadsheet ini.',
        };
      }
      if (response.status === 404) {
        return {
          success: false,
          message: `Spreadsheet ID "${spreadsheetId}" atau Tab "${cleanSheetName}" tidak ditemukan di Google Drive.`,
        };
      }
      return {
        success: false,
        message: detail || `Gagal menambahkan data (HTTP ${response.status}).`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: `Baris berhasil ditambahkan langsung ke ${cleanSheetName} di Google Sheet!`,
      updatedRange: data?.updates?.updatedRange,
      updatedRows: data?.updates?.updatedRows || 1,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Gagal menghubungi server Google Sheets.',
    };
  }
}
