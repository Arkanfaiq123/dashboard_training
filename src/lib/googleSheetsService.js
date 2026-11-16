/**
 * Service Penghubung Google Sheets (Google Apps Script Integration)
 *
 * Mendukung:
 * - READ: Mengambil data peserta lama dari spreadsheet utama.
 * - WRITE: Mengirim data import absensi baru ke Google Apps Script tanpa menimpa data lama.
 * - STATUS: Memeriksa koneksi spreadsheet dan nama tab aktif.
 * - LOG: Mengambil riwayat import dari tab IMPORT_LOG.
 *
 * Keamanan:
 * - URL dan Token disimpan di localStorage admin (dapat diatur di halaman pengaturan atau .env).
 * - Tidak mengekspos kata sandi atau akun Google pribadi.
 */

const DEFAULT_FETCH_TIMEOUT_MS = 30000; // 30 detik timeout

/**
 * Helper fetch dengan timeout dan penanganan abort
 */
async function fetchWithTimeout(resource, options = {}) {
  const { timeout = DEFAULT_FETCH_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Koneksi terputus (Timeout > ${timeout / 1000}s). Server Google Apps Script memakan waktu terlalu lama merespons.`);
    }
    throw err;
  }
}

/**
 * Konfigurasi default Google Sheets
 */
export const DEFAULT_SHEETS_CONFIG = {
  endpointUrl: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '',
  apiToken: import.meta.env.VITE_GOOGLE_APPS_SCRIPT_TOKEN || 'myrep-ae-training-2026-sec',
  spreadsheetId: '',
  targetSheetName: 'Form Responses 1',
  lastConnectedAt: null,
};

/**
 * Mendapatkan konfigurasi integrasi aktif
 */
export function getSheetsConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_SHEETS_CONFIG_KEY);
    if (saved) {
      return { ...DEFAULT_SHEETS_CONFIG, ...JSON.parse(saved) };
    }
  } catch (err) {
    console.warn('Gagal membaca konfigurasi Google Sheets lokal:', err);
  }
  return { ...DEFAULT_SHEETS_CONFIG };
}

/**
 * Menyimpan konfigurasi integrasi ke localStorage admin
 */
export function saveSheetsConfig(newConfig) {
  const current = getSheetsConfig();
  const merged = { ...current, ...newConfig };
  localStorage.setItem(STORAGE_SHEETS_CONFIG_KEY, JSON.stringify(merged));
  return merged;
}

/**
 * 1. Periksa koneksi ke endpoint Google Apps Script
 */
export async function checkGoogleSheetsConnection(customConfig = null) {
  const cfg = customConfig || getSheetsConfig();

  if (!cfg.endpointUrl || !cfg.endpointUrl.trim()) {
    return {
      success: false,
      connected: false,
      error: 'URL Web App Google Apps Script belum diisi.',
    };
  }

  try {
    const url = new URL(cfg.endpointUrl.trim());
    url.searchParams.set('action', 'checkConnection');
    if (cfg.apiToken) {
      url.searchParams.set('token', cfg.apiToken);
    }

    const res = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      mode: 'cors',
      timeout: 15000,
    });

    if (!res.ok) {
      throw new Error(`HTTP Error status: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.success) {
      // Simpan timestamp koneksi sukses
      saveSheetsConfig({
        lastConnectedAt: new Date().toISOString(),
        spreadsheetId: data.spreadsheetId || cfg.spreadsheetId,
      });
    }
    return data;
  } catch (err) {
    return {
      success: false,
      connected: false,
      error: err.message || 'Gagal menghubungi Google Apps Script.',
    };
  }
}

/**
 * 2. Mengambil data peserta lama dari Google Sheets utama
 */
export async function fetchParticipantsFromSheets() {
  const cfg = getSheetsConfig();

  if (!cfg.endpointUrl || !cfg.endpointUrl.trim()) {
    return {
      success: false,
      error: 'Koneksi Google Sheets belum dikonfigurasi.',
      participants: [],
    };
  }

  try {
    const url = new URL(cfg.endpointUrl.trim());
    url.searchParams.set('action', 'getParticipants');
    if (cfg.apiToken) {
      url.searchParams.set('token', cfg.apiToken);
    }

    const res = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      mode: 'cors',
      timeout: 15000,
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Gagal memuat data dari Google Sheets.',
      participants: [],
    };
  }
}

/**
 * 3. Mengirim data import absensi baru ke Google Apps Script (POST)
 */
export async function submitAttendanceImportToSheets(records, meta = {}) {
  const cfg = getSheetsConfig();

  if (!cfg.endpointUrl || !cfg.endpointUrl.trim()) {
    return {
      success: false,
      error: 'URL Google Apps Script belum dikonfigurasi. Atur URL di Pengaturan.',
    };
  }

  try {
    const payload = {
      action: 'importAttendance',
      token: cfg.apiToken,
      meta: {
        fileName: meta.fileName || 'Upload_Manual',
        totalRows: records.length,
        timestamp: new Date().toISOString(),
      },
      records: records,
    };

    const res = await fetchWithTimeout(cfg.endpointUrl.trim(), {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script menangani text/plain tanpa CORS preflight strict
      },
      body: JSON.stringify(payload),
      timeout: 45000, // 45 detik untuk batch import besar
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Gagal mengirim data import ke Google Sheets.',
    };
  }
}

/**
 * 4. Mengambil riwayat log import dari tab IMPORT_LOG
 */
export async function fetchImportHistoryFromSheets() {
  const cfg = getSheetsConfig();

  if (!cfg.endpointUrl || !cfg.endpointUrl.trim()) {
    return {
      success: false,
      logs: [],
    };
  }

  try {
    const url = new URL(cfg.endpointUrl.trim());
    url.searchParams.set('action', 'getImportHistory');
    if (cfg.apiToken) {
      url.searchParams.set('token', cfg.apiToken);
    }

    const res = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      mode: 'cors',
      timeout: 15000,
    });

    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    return {
      success: false,
      error: err.message,
      logs: [],
    };
  }
}

