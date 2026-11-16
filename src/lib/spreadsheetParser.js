/**
 * Helper untuk membaca file Excel/CSV menggunakan library XLSX
 * dan memprosesnya menjadi struktur data peserta.
 */
import * as XLSX from 'xlsx';

/**
 * Baca file spreadsheet dan kembalikan nama header kolom serta baris raw.
 */
export async function readSpreadsheetFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Ambil sheet pertama
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Konversi ke array of arrays (header + baris data)
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('File spreadsheet kosong.');
        }

        const headers = (rawRows[0] || []).map((h) => String(h).trim());
        const dataRows = rawRows.slice(1).filter((r) => r.some((cell) => cell !== ''));

        resolve({
          fileName: file.name,
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
 * Deteksi otomatis kecocokan kolom berdasarkan kata kunci umum di formulir pendaftaran
 */
export function autoSuggestColumnMapping(headers) {
  const mapping = {
    timestamp: '',
    fullName: '',
    nik: '',
    birthDate: '',
    placementCity: '',
    asmName: '',
    vendorName: '',
    phoneNumber: '',
    email: '',
    address: '',
    education: '',
    maritalStatus: '',
    vaccinationStatus: '',
    trainingDate: '',
    docKtp: '',
    docKk: '',
    docFoto: '',
    docIjazah: '',
  };

  headers.forEach((h, idx) => {
    const lower = h.toLowerCase();

    if (!mapping.timestamp && (lower.includes('timestamp') || lower.includes('waktu') || lower.includes('tanggal pendaftaran'))) {
      mapping.timestamp = idx;
    } else if (!mapping.fullName && (lower.includes('nama lengkap') || lower.includes('nama peserta') || lower === 'nama')) {
      mapping.fullName = idx;
    } else if (!mapping.nik && (lower.includes('nik') || lower.includes('ktp') && lower.includes('nomor'))) {
      mapping.nik = idx;
    } else if (!mapping.birthDate && (lower.includes('lahir') || lower.includes('tgl lahir') || lower.includes('tanggal lahir'))) {
      mapping.birthDate = idx;
    } else if (!mapping.placementCity && (lower.includes('kota') || lower.includes('penempatan') || lower.includes('domisili kerja'))) {
      mapping.placementCity = idx;
    } else if (!mapping.asmName && (lower.includes('asm') || lower.includes('area sales manager'))) {
      mapping.asmName = idx;
    } else if (!mapping.vendorName && (lower.includes('vendor') || lower.includes('mitra') || lower.includes('agency'))) {
      mapping.vendorName = idx;
    } else if (!mapping.phoneNumber && (lower.includes('wa') || lower.includes('whatsapp') || lower.includes('telepon') || lower.includes('no hp'))) {
      mapping.phoneNumber = idx;
    } else if (!mapping.email && lower.includes('email')) {
      mapping.email = idx;
    } else if (!mapping.address && (lower.includes('alamat') || lower.includes('domisili'))) {
      mapping.address = idx;
    } else if (!mapping.education && (lower.includes('pendidikan') || lower.includes('lulusan'))) {
      mapping.education = idx;
    } else if (!mapping.maritalStatus && (lower.includes('kawin') || lower.includes('perkawinan') || lower.includes('menikah'))) {
      mapping.maritalStatus = idx;
    } else if (!mapping.vaccinationStatus && lower.includes('vaksin')) {
      mapping.vaccinationStatus = idx;
    } else if (!mapping.trainingDate && (lower.includes('training') && lower.includes('tanggal') || lower.includes('jadwal training'))) {
      mapping.trainingDate = idx;
    } else if (!mapping.docKtp && (lower.includes('ktp') && (lower.includes('upload') || lower.includes('foto') || lower.includes('file')))) {
      mapping.docKtp = idx;
    } else if (!mapping.docKk && (lower.includes('kk') || lower.includes('kartu keluarga'))) {
      mapping.docKk = idx;
    } else if (!mapping.docFoto && (lower.includes('foto diri') || lower.includes('pas foto') || lower.includes('foto terbaru'))) {
      mapping.docFoto = idx;
    } else if (!mapping.docIjazah && (lower.includes('ijazah') || lower.includes('skl'))) {
      mapping.docIjazah = idx;
    }
  });

  return mapping;
}

/**
 * Normalisasi URL dokumen Google Drive dan periksa ketersediaan
 */
function parseDocInfo(val) {
  if (!val || typeof val !== 'string') {
    return { available: false, url: null, label: 'Belum Ada' };
  }
  const trimmed = val.trim();
  if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'null') {
    return { available: false, url: null, label: 'Belum Ada' };
  }

  // URL dianggap tersedia jika memiliki link
  const isUrl = trimmed.startsWith('http://') || trimmed.startsWith('https://');
  return {
    available: true,
    url: isUrl ? trimmed : null,
    rawText: trimmed,
    label: 'Tersedia',
  };
}

/**
 * Transformasi baris data mentah menjadi array objek peserta terstruktur
 */
export function processSpreadsheetRows(dataRows, mapping) {
  return dataRows.map((row, index) => {
    const getCell = (key) => {
      const idx = mapping[key];
      if (idx === '' || idx === undefined || idx === null) return '';
      const val = row[idx];
      if (val instanceof Date) {
        return val.toISOString().split('T')[0];
      }
      return val !== undefined && val !== null ? String(val).trim() : '';
    };

    const id = `PST-${String(index + 1).padStart(4, '0')}`;
    const fullName = getCell('fullName') || `Peserta ${index + 1}`;
    const city = getCell('placementCity') || 'Purwokerto';
    const timestamp = getCell('timestamp') || new Date().toISOString();

    return {
      id,
      rowNumber: index + 2, // 1-based baris spreadsheet
      full_name: fullName,
      nik: getCell('nik'),
      birth_date: getCell('birthDate'),
      placement_city: city,
      asm_name: getCell('asmName') || 'Tanpa ASM',
      vendor_name: getCell('vendorName') || 'Tanpa Vendor',
      phone_number: getCell('phoneNumber'),
      email: getCell('email'),
      address: getCell('address'),
      education: getCell('education') || 'SMA/SMK',
      marital_status: getCell('maritalStatus') || 'Belum Menikah',
      vaccination_status: getCell('vaccinationStatus') || 'Lengkap',
      training_date: getCell('trainingDate') || '2026-01-15',
      registered_at: timestamp,
      documents: {
        ktp: parseDocInfo(getCell('docKtp')),
        kk: parseDocInfo(getCell('docKk')),
        foto: parseDocInfo(getCell('docFoto')),
        ijazah: parseDocInfo(getCell('docIjazah')),
      },
    };
  });
}

