/**
 * Test Suite: Verifikasi Logika Integrasi Google Sheets & Import Absensi
 *
 * Menguji:
 * 1. Logika pembuatan ID Respons Unik (generateAttendanceResponseId).
 * 2. Penolakan duplikat jika respons identik diunggah kembali.
 * 3. Penerimaan NIK yang sama jika tanggal training berbeda (Multi-session attendance).
 * 4. Penanganan data tidak lengkap (missing full_name atau NIK invalid).
 * 5. Format payload dan deteksi otomatis kolom header.
 */

import {
  generateAttendanceResponseId,
  processAttendanceRecords,
  detectAttendanceColumnIndices,
} from '../src/lib/attendanceParser.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    passedTests++;
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('=== MEMULAI TEST INTEGRASI GOOGLE SHEETS & IMPORT ABSENSI ===\n');

// TEST 1: Generate ID Respons Unik
const id1 = generateAttendanceResponseId(
  {
    timestamp: '2026-02-10 08:30:00',
    nik: '3302011234567890',
    fullName: 'Ahmad Faisal',
    trainingDate: '2026-02-15',
    placementCity: 'Purwokerto',
  },
  2
);

const id2 = generateAttendanceResponseId(
  {
    timestamp: '2026-02-10 08:30:00',
    nik: '3302011234567890',
    fullName: 'Ahmad Faisal',
    trainingDate: '2026-02-15',
    placementCity: 'Purwokerto',
  },
  2
);

assert(id1 === id2, 'ID respons harus identik untuk respons dengan parameter waktu, NIK, nama, dan tanggal yang sama');
assert(id1.startsWith('ATT-'), 'ID respons harus memiliki prefix ATT-');

// TEST 2: NIK yang sama di tanggal berbeda harus memiliki Response ID berbeda
const idDifferentDate = generateAttendanceResponseId(
  {
    timestamp: '2026-03-01 09:00:00',
    nik: '3302011234567890', // NIK sama
    fullName: 'Ahmad Faisal',
    trainingDate: '2026-03-05', // Tanggal berbeda
    placementCity: 'Purwokerto',
  },
  3
);

assert(
  id1 !== idDifferentDate,
  'NIK yang sama pada tanggal training berbeda harus menghasilkan ID respons berbeda (multi-sesi diizinkan)'
);

// TEST 3: Deteksi Kolom Header Otomatis
const sampleHeaders = [
  'Timestamp',
  'Nama Lengkap Peserta',
  'Nomor Induk Kependudukan (NIK)',
  'Tanggal Pelaksanaan Training',
  'Kota Penempatan',
  'Nama Area Sales Manager (ASM)',
  'Nama Vendor',
  'No. WhatsApp Aktif',
  'Alamat Email',
];
const mapping = detectAttendanceColumnIndices(sampleHeaders);
assert(mapping.fullName === 1, 'Header "Nama Lengkap Peserta" harus terpetakan ke kolom fullName (index 1)');
assert(mapping.nik === 2, 'Header NIK harus terpetakan ke kolom nik (index 2)');
assert(mapping.trainingDate === 3, 'Header Tanggal harus terpetakan ke kolom trainingDate (index 3)');

// TEST 4: Validasi Berbagai Kasus Record via processAttendanceRecords
const rawRows = [
  // 1. Valid record
  ['2026-02-10 08:00', 'Budi Santoso', '3302012345678901', '2026-02-15', 'Purwokerto', 'ASM 1', 'Vendor A', '08123456789', 'budi@test.com'],
  // 2. Missing name (incomplete)
  ['2026-02-10 08:05', '', '3302012345678902', '2026-02-15', 'Tegal', 'ASM 1', 'Vendor A', '08123456788', 'noname@test.com'],
  // 3. Format NIK invalid (< 10 digit angka)
  ['2026-02-10 08:10', 'Citra Kirana', '12345', '2026-02-15', 'Cilacap', 'ASM 2', 'Vendor B', '08123456787', 'citra@test.com'],
  // 4. Record sama dengan record 1 (duplicate dalam file yang sama)
  ['2026-02-10 08:00', 'Budi Santoso', '3302012345678901', '2026-02-15', 'Purwokerto', 'ASM 1', 'Vendor A', '08123456789', 'budi@test.com'],
  // 5. Peserta sama (Budi Santoso) tapi tanggal training & timestamp berbeda (harus READY, bukan duplicate)
  ['2026-03-01 09:00', 'Budi Santoso', '3302012345678901', '2026-03-05', 'Purwokerto', 'ASM 1', 'Vendor A', '08123456789', 'budi@test.com'],
];

const processed = processAttendanceRecords(rawRows, sampleHeaders, mapping, []);

assert(processed[0].validation.status === 'ready', 'Baris 1 valid harus berstatus "ready"');
assert(processed[1].validation.status === 'incomplete', 'Baris 2 tanpa nama harus berstatus "incomplete"');
assert(processed[2].validation.status === 'invalid_format', 'Baris 3 dengan NIK < 10 digit harus berstatus "invalid_format"');
assert(processed[3].validation.status === 'duplicate', 'Baris 4 identik dengan Baris 1 harus dideteksi sebagai "duplicate"');
assert(
  processed[4].validation.status === 'ready',
  'Baris 5 dengan NIK yang sama tapi tanggal training berbeda HARUS berstatus "ready" (multi-date didukung)'
);

// TEST 5: Deteksi Duplikat dari Riwayat Sebelumnya (importedIds)
const existingId = processed[0].responseId;
const reprocessed = processAttendanceRecords(
  [['2026-02-10 08:00', 'Budi Santoso', '3302012345678901', '2026-02-15', 'Purwokerto', 'ASM 1', 'Vendor A', '08123456789', 'budi@test.com']],
  sampleHeaders,
  mapping,
  [existingId] // ID sudah pernah diimpor
);

assert(
  reprocessed[0].validation.status === 'duplicate',
  'Baris dengan ID yang sudah ada di riwayat import harus ditolak sebagai "duplicate"'
);

console.log(`\n🎉 SELURUH TEST INTEGRASI BERHASIL! (${passedTests}/${totalTests} PASS)`);
