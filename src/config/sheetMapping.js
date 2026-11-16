/**
 * Google Sheets Column Mapping Configuration
 *
 * ⚠️ IMPORTANT: This mapping uses CONCEPTUAL field names from the PRD.
 * The actual column headers, order, date formats, and file URL structures
 * MUST be verified against the real spreadsheet before production use.
 *
 * Update `sheetColumnIndex` values once the real spreadsheet is available.
 * Column indices are 0-based.
 */

export const SHEET_MAPPING = {
  // Metadata
  timestamp: {
    sheetColumnIndex: null, // UPDATE after verifying spreadsheet
    dbField: 'registered_at',
    label: 'Timestamp',
    category: 'metadata',
    transform: 'datetime',
  },

  // Personal Information
  fullName: {
    sheetColumnIndex: null,
    dbField: 'full_name',
    label: 'Nama Lengkap',
    category: 'personal',
    transform: 'text',
  },
  nik: {
    sheetColumnIndex: null,
    dbField: 'nik',
    label: 'NIK KTP',
    category: 'personal',
    transform: 'text',
    sensitive: true,
  },
  birthDate: {
    sheetColumnIndex: null,
    dbField: 'birth_date',
    label: 'Tanggal Lahir',
    category: 'personal',
    transform: 'date',
  },

  // Training & Placement
  trainingDate: {
    sheetColumnIndex: null,
    dbField: 'training_date',
    label: 'Tanggal Training',
    category: 'training',
    transform: 'date',
  },
  placementCity: {
    sheetColumnIndex: null,
    dbField: 'placement_city',
    label: 'Kota Penempatan',
    category: 'placement',
    transform: 'text',
  },
  asmName: {
    sheetColumnIndex: null,
    dbField: 'asm_name',
    label: 'Nama ASM',
    category: 'placement',
    transform: 'text',
  },
  vendorName: {
    sheetColumnIndex: null,
    dbField: 'vendor_name',
    label: 'Nama Vendor',
    category: 'placement',
    transform: 'text',
  },

  // Contact
  phoneNumber: {
    sheetColumnIndex: null,
    dbField: 'phone_number',
    label: 'No WA',
    category: 'contact',
    transform: 'phone',
    sensitive: true,
  },
  email: {
    sheetColumnIndex: null,
    dbField: 'email',
    label: 'Email',
    category: 'contact',
    transform: 'email',
  },
  address: {
    sheetColumnIndex: null,
    dbField: 'address',
    label: 'Alamat Domisili',
    category: 'personal',
    transform: 'text',
    sensitive: true,
  },

  // Administrative
  education: {
    sheetColumnIndex: null,
    dbField: 'education',
    label: 'Pendidikan Terakhir',
    category: 'administration',
    transform: 'text',
  },
  maritalStatus: {
    sheetColumnIndex: null,
    dbField: 'marital_status',
    label: 'Status Perkawinan',
    category: 'administration',
    transform: 'text',
  },
  vaccinationStatus: {
    sheetColumnIndex: null,
    dbField: 'vaccination_status',
    label: 'Status Vaksin',
    category: 'administration',
    transform: 'text',
  },

  // Documents — file reference fields
  docKtp: {
    sheetColumnIndex: null,
    dbField: null, // Stored in participant_documents table
    label: 'Upload KTP',
    category: 'document',
    documentType: 'ktp',
    transform: 'file_url',
  },
  docKk: {
    sheetColumnIndex: null,
    dbField: null,
    label: 'Upload KK',
    category: 'document',
    documentType: 'kk',
    transform: 'file_url',
  },
  docFoto: {
    sheetColumnIndex: null,
    dbField: null,
    label: 'Foto Diri',
    category: 'document',
    documentType: 'foto',
    transform: 'file_url',
  },
  docIjazah: {
    sheetColumnIndex: null,
    dbField: null,
    label: 'Upload Ijazah',
    category: 'document',
    documentType: 'ijazah',
    transform: 'file_url',
  },
};

/**
 * Configuration placeholder for the Google Sheet source.
 * Fill these in once the actual spreadsheet is shared.
 */
export const SHEET_CONFIG = {
  spreadsheetId: null, // The Google Spreadsheet ID from the URL
  sheetName: null, // The specific sheet tab name (e.g., "Form Responses 1")
  headerRow: 1, // Row number that contains headers (1-based)
  dataStartRow: 2, // Row where data starts (1-based)

  /**
   * Column used as unique identifier for each response to enable upsert.
   * Typically the Timestamp column or a response ID.
   * Maps to `source_response_id` in the database.
   *
   * ⚠️ Must be verified from the actual spreadsheet.
   */
  uniqueIdentifierField: 'timestamp',
};

/**
 * Get all fields for a given category.
 * @param {string} category
 * @returns {Array}
 */
export function getFieldsByCategory(category) {
  return Object.entries(SHEET_MAPPING)
    .filter(([, config]) => config.category === category)
    .map(([key, config]) => ({ key, ...config }));
}

/**
 * Get all document fields.
 * @returns {Array}
 */
export function getDocumentFields() {
  return getFieldsByCategory('document');
}

/**
 * Check if all column indices have been configured.
 * @returns {boolean}
 */
export function isMappingConfigured() {
  return Object.values(SHEET_MAPPING).every(
    (config) => config.sheetColumnIndex !== null
  );
}

