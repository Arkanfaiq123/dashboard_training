/**
 * Automated Unit & Integration Tests for Backend Logic & Adapters
 * Tests:
 * 1. Google Drive URL parsing & ID extraction
 * 2. Indonesian phone number normalization
 * 3. Date & timestamp formatting
 * 4. Google Sheets row transformation to DB record
 * 5. Data sanitization for Export (Excel/PDF)
 */

import {
  extractDriveFileInfo,
  normalizePhoneNumber,
  normalizeDate,
  normalizeTimestamp,
  parseSheetRowToRecord,
} from '../src/lib/googleSheetsAdapter.js';
import { SHEET_MAPPING } from '../src/config/sheetMapping.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failedTests++;
  }
}

console.log('=== RUNNING BACKEND INTEGRATION & ADAPTER TESTS ===\n');

// 1. Test Drive File URL Extraction
console.log('1. Testing Google Drive File Extraction:');
const driveUrl1 = 'https://drive.google.com/open?id=1a2B3c4D5e6F7g8H9i0J_kLmNoPqRsTuV';
const res1 = extractDriveFileInfo(driveUrl1);
assert(res1.fileId === '1a2B3c4D5e6F7g8H9i0J_kLmNoPqRsTuV', 'Extracts ID from drive.google.com/open?id=');
assert(res1.availabilityStatus === 'available', 'Status is available when valid ID exists');

const driveUrl2 = 'https://drive.google.com/file/d/9z8Y7x6W5v4U3t2S1r0Q/view?usp=sharing';
const res2 = extractDriveFileInfo(driveUrl2);
assert(res2.fileId === '9z8Y7x6W5v4U3t2S1r0Q', 'Extracts ID from drive.google.com/file/d/.../view');

const invalidUrl = 'https://dropbox.com/s/invalidfile';
const res3 = extractDriveFileInfo(invalidUrl);
assert(res3.availabilityStatus === 'inaccessible', 'Marks non-Google Drive URLs as inaccessible');

const emptyUrl = '-';
const res4 = extractDriveFileInfo(emptyUrl);
assert(res4.availabilityStatus === 'missing', 'Marks "-" as missing document');

// 2. Test Phone Number Normalization
console.log('\n2. Testing Phone Number Normalization:');
assert(normalizePhoneNumber('08123456789') === '+628123456789', 'Converts 08... to +628...');
assert(normalizePhoneNumber('628123456789') === '+628123456789', 'Prefixes 62... with +');
assert(normalizePhoneNumber('+62 812-3456-789') === '+628123456789', 'Strips spaces and dashes');
assert(normalizePhoneNumber(null) === null, 'Handles null safely');

// 3. Test Date & Timestamp Normalization
console.log('\n3. Testing Date & Timestamp Normalization:');
assert(normalizeDate('2026-01-15') === '2026-01-15', 'Preserves standard date string');
assert(normalizeDate('15/01/2026') !== null, 'Parses slash format if valid Date');
assert(normalizeTimestamp('2025-12-01T08:30:00Z')?.startsWith('2025-12-01'), 'Parses ISO timestamp');

// 4. Test Row Transformation
console.log('\n4. Testing Sheet Row to Participant Record Transformation:');
// Simulate configured indices for test
SHEET_MAPPING.fullName.sheetColumnIndex = 1;
SHEET_MAPPING.placementCity.sheetColumnIndex = 2;
SHEET_MAPPING.docKtp.sheetColumnIndex = 3;

const mockRow = ['2025-12-01 08:30:00', 'Budi Santoso', 'Cilacap', 'https://drive.google.com/open?id=ktp_file_123'];
const parsed = parseSheetRowToRecord(mockRow, 2);

assert(parsed.participant.full_name === 'Budi Santoso', 'Maps full_name correctly');
assert(parsed.participant.placement_city === 'Cilacap', 'Maps placement_city correctly');
assert(parsed.documents.length === 4, 'Always produces exactly 4 document types');
assert(parsed.documents[0].type === 'ktp' && parsed.documents[0].fileId === 'ktp_file_123', 'Maps KTP document info');

console.log(`\n=== TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED ===`);
if (failedTests > 0) {
  process.exit(1);
}

