/**
 * Google Sheets and Drive Integration Adapter
 * 
 * Sesuai panduan proyek:
 * Spreadsheet asli belum diberikan oleh tim operasional.
 * Adapter ini menyediakan abstraksi normalisasi, validasi, parsing URL Google Drive,
 * dan mekanisme upsert yang siap disesuaikan saat file spreadsheet asli diterima.
 */

import { SHEET_MAPPING, SHEET_CONFIG } from '../config/sheetMapping.js';

/**
 * Ekstraksi File ID dan validasi format URL Google Drive.
 * Mendukung format standard:
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/uc?id=FILE_ID
 */
export function extractDriveFileInfo(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      fileId: null,
      rawUrl: null,
      availabilityStatus: 'missing',
    };
  }

  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'null') {
    return {
      fileId: null,
      rawUrl: null,
      availabilityStatus: 'missing',
    };
  }

  // Regex deteksi Google Drive File ID umum (28-45 karakter alfanumerik & simbol)
  const driveIdRegexes = [
    /[?&]id=([a-zA-Z0-9_-]{20,})/,
    /\/file\/d\/([a-zA-Z0-9_-]{20,})/,
    /\/d\/([a-zA-Z0-9_-]{20,})/,
    /id=([a-zA-Z0-9_-]{20,})/,
  ];

  let fileId = null;
  for (const regex of driveIdRegexes) {
    const match = trimmed.match(regex);
    if (match && match[1]) {
      fileId = match[1];
      break;
    }
  }

  // Jika URL tidak valid atau bukan domain Google yang sah
  if (!trimmed.includes('google.com') && !trimmed.includes('drive.google')) {
    return {
      fileId: null,
      rawUrl: trimmed,
      availabilityStatus: 'inaccessible',
    };
  }

  return {
    fileId,
    rawUrl: trimmed,
    availabilityStatus: fileId ? 'available' : 'inaccessible',
  };
}

/**
 * Normalisasi format nomor telepon / WhatsApp Indonesia
 * Contoh: 08123456789 -> +628123456789 atau format standar
 */
export function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return null;
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('62')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+62${digits.substring(1)}`;
  }
  return `+${digits}`;
}

/**
 * Normalisasi format tanggal input ke ISO YYYY-MM-DD
 * Menangani format DD/MM/YYYY, YYYY-MM-DD, dan Date string umum
 */
export function normalizeDate(rawDate) {
  if (!rawDate) return null;
  const str = String(rawDate).trim();
  
  // Format DD/MM/YYYY atau DD-MM-YYYY
  const parts = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (parts) {
    const day = parts[1].padStart(2, '0');
    const month = parts[2].padStart(2, '0');
    const year = parts[3];
    return `${year}-${month}-${day}`;
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0];
    }
  } catch {
    // fallback
  }
  return null;
}

/**
 * Normalisasi timestamp pendaftaran
 */
export function normalizeTimestamp(rawTimestamp) {
  if (!rawTimestamp) return null;
  try {
    const d = new Date(rawTimestamp);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  } catch {
    // fallback
  }
  return null;
}

/**
 * Adapter mentransformasi 1 baris mentah dari Google Sheets menjadi record database.
 * @param {Array<string>} rowData - Array nilai per kolom dalam 1 baris spreadsheet
 * @param {number} rowIndex - Indeks baris untuk fallback identitas
 */
export function parseSheetRowToRecord(rowData, rowIndex) {
  if (!Array.isArray(rowData)) return null;

  const getCol = (fieldKey) => {
    const config = SHEET_MAPPING[fieldKey];
    if (!config || config.sheetColumnIndex === null || config.sheetColumnIndex === undefined) {
      return null;
    }
    const val = rowData[config.sheetColumnIndex];
    return val !== undefined && val !== null ? String(val).trim() : null;
  };

  const rawTimestamp = getCol('timestamp');
  const normalizedTimestamp = normalizeTimestamp(rawTimestamp);

  // Buat source_response_id yang stabil: jika spreadsheet menyediakan id unik gunakan itu,
  // atau kombinasi timestamp + nama lengkap + nomor baris
  const fullName = getCol('fullName') || `Peserta Baris ${rowIndex}`;
  const responseId = rawTimestamp 
    ? `resp-${normalizedTimestamp.replace(/[:.]/g, '-')}-${rowIndex}`
    : `resp-row-${rowIndex}`;

  const participantData = {
    source_response_id: responseId,
    full_name: fullName,
    nik: getCol('nik'),
    birth_date: normalizeDate(getCol('birthDate')),
    training_date: normalizeDate(getCol('trainingDate')),
    placement_city: getCol('placementCity') || 'Purwokerto',
    asm_name: getCol('asmName'),
    vendor_name: getCol('vendorName'),
    phone_number: normalizePhoneNumber(getCol('phoneNumber')),
    email: getCol('email'),
    address: getCol('address'),
    education: getCol('education'),
    marital_status: getCol('maritalStatus'),
    vaccination_status: getCol('vaccinationStatus'),
    registered_at: normalizedTimestamp || new Date().toISOString(),
    synced_at: new Date().toISOString(),
  };

  // 4 dokumen terpisah
  const rawKtp = getCol('docKtp');
  const rawKk = getCol('docKk');
  const rawFoto = getCol('docFoto');
  const rawIjazah = getCol('docIjazah');

  const documents = [
    { type: 'ktp', ...extractDriveFileInfo(rawKtp) },
    { type: 'kk', ...extractDriveFileInfo(rawKk) },
    { type: 'foto', ...extractDriveFileInfo(rawFoto) },
    { type: 'ijazah', ...extractDriveFileInfo(rawIjazah) },
  ];

  return {
    participant: participantData,
    documents,
  };
}

