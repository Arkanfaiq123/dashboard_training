/**
 * Application-wide constants.
 * No production data — all values reflect known domain structure only.
 */

// Placement cities as defined in the PRD
export const PLACEMENT_CITIES = ['Purwokerto', 'Purbalingga', 'Cilacap'];

// Document types each participant must provide
export const DOCUMENT_TYPES = [
  { key: 'ktp', label: 'KTP' },
  { key: 'kk', label: 'Kartu Keluarga' },
  { key: 'foto', label: 'Foto Diri' },
  { key: 'ijazah', label: 'Ijazah' },
];

// Document availability status
export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  MISSING: 'missing',
  INACCESSIBLE: 'inaccessible',
};

export const AVAILABILITY_STATUS_LABELS = {
  [AVAILABILITY_STATUS.AVAILABLE]: 'Tersedia',
  [AVAILABILITY_STATUS.MISSING]: 'Belum Ada',
  [AVAILABILITY_STATUS.INACCESSIBLE]: 'Tidak Dapat Diakses',
};

// Document verification status (admin-driven)
export const VERIFICATION_STATUS = {
  PENDING: 'pending_review',
  VERIFIED: 'verified',
  NEEDS_REVISION: 'needs_revision',
};

export const VERIFICATION_STATUS_LABELS = {
  [VERIFICATION_STATUS.PENDING]: 'Menunggu Review',
  [VERIFICATION_STATUS.VERIFIED]: 'Terverifikasi',
  [VERIFICATION_STATUS.NEEDS_REVISION]: 'Perlu Revisi',
};

// Sync status
export const SYNC_STATUS = {
  IDLE: 'idle',
  IN_PROGRESS: 'in_progress',
  SUCCESS: 'success',
  FAILED: 'failed',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Google Form registration URL
export const REGISTRATION_FORM_URL = 'https://bit.ly/FormAETraining2026';

// App metadata
export const APP_NAME = 'AE Training Dashboard 2026';
export const APP_DESCRIPTION = 'Dashboard monitoring pendaftaran peserta AE Training MyRepublic 2026';

