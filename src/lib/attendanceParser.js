/**
 * Helper dan Parser Spreadsheet Khusus Respons Absensi Google Form
 * Memisahkan:
 * - Data mentah sumber Google Form (termasuk kolom tambahan).
 * - Identitas unik respons (bukan NIK, agar peserta sama bisa hadir di tanggal/sesi berbeda).
 * - Status validasi (ready, duplicate, incomplete, invalid_format).
 * - Status import.
 */

import * as XLSX from 'xlsx';

/**
 * Buat hash string sederhana untuk fingerprint konten respons
 */
function createContentHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Bangun ID unik unik yang stabil untuk setiap baris respons absensi.
 * Menggabungkan: Timestamp respons yang dinormalisasi + NIK/Nama + Tanggal Training + Sesi (jika ada).
 * NIK diperbolehkan hadir berkali-kali di tanggal berbeda, tapi baris respons persis sama tidak boleh ganda.
 */
export function generateAttendanceResponseId(normalizedFields, rowIndex = null) {
  const ts = normalizedFields.timestamp || '';
  const name = (normalizedFields.fullName || '').toLowerCase().replace(/\s+/g, '');
  const nik = (normalizedFields.nik || '').replace(/\D/g, '');
  const date = normalizedFields.trainingDate || '';
  const city = (normalizedFields.placementCity || '').toLowerCase().trim();

  // Signature unik berbasis data respons asli dari Google Form:
  // Waktu pengisian respons + NIK + Nama + Tanggal Training + Kota
  // Ini stabil terlepas dari nomor urut baris di file mana data tersebut berada
  if (ts && (nik || name)) {
    const signature = `${ts}|${nik}|${name}|${date}|${city}`;
    return `ATT-${createContentHash(signature)}`;
  }

  // Fallback signature jika timestamp tidak ada
  const fallbackSig = `ROW-${rowIndex || 'X'}|${name}|${nik}|${date}|${city}`;
  return `ATT-${createContentHash(fallbackSig)}`;
}

/**
 * Baca berkas Excel (.xlsx, .xls) atau CSV
 */
export async function readAttendanceFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Header 1 membaca array baris (array of arrays)
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('File spreadsheet kosong.');
        }

        const headers = (rawRows[0] || []).map((h) => String(h).trim());
        const dataRows = rawRows.slice(1).filter((r) => r.some((cell) => cell !== ''));

        resolve({
          fileName: file.name,
          fileSize: file.size,
          sheetName: firstSheetName,
          headers,
          dataRows,
          totalRows: dataRows.length,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Deteksi indeks kolom berdasarkan kata kunci umum form absensi
 */
export function detectAttendanceColumnIndices(headers) {
  const mapping = {
    timestamp: -1,
    fullName: -1,
    nik: -1,
    trainingDate: -1,
    placementCity: -1,
    asmName: -1,
    vendorName: -1,
    phoneNumber: -1,
    email: -1,
  };

  headers.forEach((h, idx) => {
    const lower = h.toLowerCase().trim();

    if (mapping.timestamp === -1 && (lower.includes('timestamp') || lower.includes('waktu') || lower.includes('tanggal pengisian'))) {
      mapping.timestamp = idx;
    } else if (mapping.fullName === -1 && (lower.includes('nama lengkap') || lower.includes('nama peserta') || lower === 'nama')) {
      mapping.fullName = idx;
    } else if (mapping.nik === -1 && (lower.includes('nik') || (lower.includes('ktp') && lower.includes('nomor')))) {
      mapping.nik = idx;
    } else if (mapping.trainingDate === -1 && (lower.includes('tanggal training') || lower.includes('tgl training') || lower.includes('jadwal training') || (lower.includes('tanggal') && !lower.includes('lahir')))) {
      mapping.trainingDate = idx;
    } else if (mapping.placementCity === -1 && (lower.includes('kota') || lower.includes('penempatan') || lower.includes('lokasi'))) {
      mapping.placementCity = idx;
    } else if (mapping.asmName === -1 && (lower.includes('asm') || lower.includes('area sales manager'))) {
      mapping.asmName = idx;
    } else if (mapping.vendorName === -1 && (lower.includes('vendor') || lower.includes('mitra') || lower.includes('agensi'))) {
      mapping.vendorName = idx;
    } else if (mapping.phoneNumber === -1 && (lower.includes('wa') || lower.includes('whatsapp') || lower.includes('hp') || lower.includes('telepon'))) {
      mapping.phoneNumber = idx;
    } else if (mapping.email === -1 && lower.includes('email')) {
      mapping.email = idx;
    }
  });

  return mapping;
}

/**
 * Normalisasi format tanggal atau string cell
 */
function cleanCellValue(val) {
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  return val !== undefined && val !== null ? String(val).trim() : '';
}

/**
 * Proses dan validasi seluruh baris absensi
 * @param {Array} dataRows - Array baris mentah spreadsheet
 * @param {Array} headers - Daftar nama header asli
 * @param {Object} columnMapping - Indeks kolom yang terdeteksi
 * @param {Array<string>} previouslyImportedIds - Daftar respons ID yang sudah pernah diimpor
 */
export function processAttendanceRecords(dataRows, headers, columnMapping, previouslyImportedIds = []) {
  const importedIdSet = new Set(previouslyImportedIds);
  const currentBatchSeenIds = new Set();

  return dataRows.map((row, index) => {
    const rowNumber = index + 2; // Row number spreadsheet (1-based header)

    // 1. Ekstrak kolom utama yang dipetakan
    const getMappedVal = (key) => {
      const colIdx = columnMapping[key];
      if (colIdx === undefined || colIdx === -1) return '';
      return cleanCellValue(row[colIdx]);
    };

    const normalized = {
      timestamp: getMappedVal('timestamp'),
      fullName: getMappedVal('fullName'),
      nik: getMappedVal('nik'),
      trainingDate: getMappedVal('trainingDate'),
      placementCity: getMappedVal('placementCity'),
      asmName: getMappedVal('asmName'),
      vendorName: getMappedVal('vendorName'),
      phoneNumber: getMappedVal('phoneNumber'),
      email: getMappedVal('email'),
    };

    // 2. Simpan seluruh rawData dan kolom tambahan yang tidak terpetakan (preserve all columns)
    const rawData = {};
    const unmappedExtraColumns = {};

    headers.forEach((h, colIdx) => {
      const cellVal = cleanCellValue(row[colIdx]);
      rawData[h || `Kolom_${colIdx + 1}`] = cellVal;

      const isKnownField = Object.values(columnMapping).includes(colIdx);
      if (!isKnownField && cellVal !== '') {
        unmappedExtraColumns[h || `Kolom_${colIdx + 1}`] = cellVal;
      }
    });

    // 3. Generate identitas unik respons (bukan NIK)
    const responseId = generateAttendanceResponseId(normalized, rowNumber);

    // 4. Lakukan evaluasi validasi
    let validationStatus = 'ready'; // 'ready' | 'duplicate' | 'incomplete' | 'invalid_format'
    const validationErrors = [];

    // Validasi kelengkapan field wajib: Nama Lengkap minimal harus ada
    if (!normalized.fullName) {
      validationStatus = 'incomplete';
      validationErrors.push('Nama lengkap peserta kosong');
    }

    // Validasi NIK (jika diisi, harus berupa angka minimal 10 digit)
    if (normalized.nik) {
      const cleanNik = normalized.nik.replace(/\D/g, '');
      if (cleanNik.length < 10) {
        validationStatus = 'invalid_format';
        validationErrors.push('Format NIK KTP tidak valid (minimal 10 digit angka)');
      }
    }

    // Deteksi duplikasi respons: apakah sudah pernah diimpor sebelumnya atau duplikat dalam batch file yang sama
    if (importedIdSet.has(responseId) || currentBatchSeenIds.has(responseId)) {
      validationStatus = 'duplicate';
      validationErrors.push('Respons kehadiran ini sudah pernah diimpor sebelumnya');
    } else {
      currentBatchSeenIds.add(responseId);
    }

    return {
      responseId,
      rowNumber,
      normalized,
      rawData,
      unmappedExtraColumns,
      validation: {
        status: validationStatus, // ready, duplicate, incomplete, invalid_format
        errors: validationErrors,
        isReady: validationStatus === 'ready',
      },
      importStatus: {
        imported: false,
        importedAt: null,
      },
    };
  });
}

