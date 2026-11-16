import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building2,
  Users,
  MapPin,
  ClipboardList,
  History,
  Cloud,
  Check,
} from 'lucide-react';
import {
  readAttendanceFile,
  detectAttendanceColumnIndices,
  processAttendanceRecords,
} from '@/lib/attendanceParser';
import { formatDateShort } from '@/lib/formatters';
import {
  submitAttendanceImportToSheets,
  fetchImportHistoryFromSheets,
  getSheetsConfig,
} from '@/lib/googleSheetsService';
import { useData } from '@/contexts/DataContext';

const STORAGE_IMPORTED_ATTENDANCE_IDS_KEY = 'ae_training_2026_imported_attendance_ids';
const DEFAULT_PAGE_SIZE = 10;

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export default function AttendanceImport() {
  const { refreshFromGoogleSheets } = useData();

  const [fileInfo, setFileInfo] = useState(null);
  const [rawHeaders, setRawHeaders] = useState([]);
  const [parsedRows, setParsedRows] = useState([]);
  const [columnMapping, setColumnMapping] = useState({});
  const [readingFile, setReadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [importNotification, setImportNotification] = useState(null);

  // Import execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importHistory, setImportHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'history'

  // Filter & Pagination preview state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterValidation, setFilterValidation] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef(null);

  // Ambil ID respons yang sudah pernah diimpor dari localStorage
  const [importedIds, setImportedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_IMPORTED_ATTENDANCE_IDS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Muat riwayat import dari Google Sheets
  const loadImportHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetchImportHistoryFromSheets();
      if (res && res.logs) {
        setImportHistory(res.logs);
      }
    } catch (err) {
      console.warn('Gagal memuat riwayat import:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    loadImportHistory();
  }, [loadImportHistory]);

  // Parse & validasi file saat file dibaca
  const handleProcessFile = useCallback(
    async (file) => {
      if (!file) return;

      setReadingFile(true);
      setErrorMessage('');
      setImportNotification(null);

      try {
        const fileData = await readAttendanceFile(file);
        setFileInfo({
          name: fileData.fileName,
          size: fileData.fileSize,
          sheetName: fileData.sheetName,
          totalRows: fileData.totalRows,
        });

        setRawHeaders(fileData.headers);

        // Otomatis deteksi mapping kolom
        const detectedMapping = detectAttendanceColumnIndices(fileData.headers);
        setColumnMapping(detectedMapping);

        // Proses seluruh baris data respons
        const processed = processAttendanceRecords(
          fileData.dataRows,
          fileData.headers,
          detectedMapping,
          importedIds
        );

        setParsedRows(processed);
        setCurrentPage(1);
      } catch (err) {
        setErrorMessage(err.message || 'Gagal membaca berkas spreadsheet absensi.');
        setFileInfo(null);
        setParsedRows([]);
      } finally {
        setReadingFile(false);
      }
    },
    [importedIds]
  );

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleReset = () => {
    setFileInfo(null);
    setRawHeaders([]);
    setParsedRows([]);
    setColumnMapping({});
    setErrorMessage('');
    setImportNotification(null);
    setSearchQuery('');
    setFilterValidation('');
    setCurrentPage(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Hitung ringkasan status import
  const summary = useMemo(() => {
    const total = parsedRows.length;
    let ready = 0;
    let duplicate = 0;
    let incomplete = 0;
    let invalid = 0;

    parsedRows.forEach((r) => {
      if (r.validation.status === 'ready') ready++;
      else if (r.validation.status === 'duplicate') duplicate++;
      else if (r.validation.status === 'incomplete') incomplete++;
      else if (r.validation.status === 'invalid_format') invalid++;
    });

    return {
      total,
      ready,
      duplicate,
      incomplete,
      invalid,
    };
  }, [parsedRows]);

  // Tombol Eksekusi Import ke Google Sheets
  const handleTriggerImport = async () => {
    if (!fileInfo || parsedRows.length === 0 || summary.ready === 0) return;

    const readyRecords = parsedRows.filter((r) => r.validation.status === 'ready');
    if (readyRecords.length === 0) {
      setImportNotification({
        type: 'warning',
        title: 'Tidak Ada Data Siap Diimpor',
        message: 'Seluruh data dalam berkas ini berstatus duplikat atau memiliki kesalahan validasi.',
      });
      return;
    }

    const cfg = getSheetsConfig();
    if (!cfg.endpointUrl) {
      setImportNotification({
        type: 'warning',
        title: 'Google Sheets Belum Terhubung',
        message: 'Silakan isi URL Web App Google Apps Script di menu Pengaturan sebelum menjalankan proses import.',
      });
      return;
    }

    setIsSubmitting(true);
    setImportNotification(null);

    try {
      // Siapkan payload data untuk Google Apps Script
      const recordsToSubmit = readyRecords.map((r) => ({
        responseId: r.responseId,
        normalized: {
          timestamp: r.normalized.timestamp,
          fullName: r.normalized.fullName,
          nik: r.normalized.nik,
          trainingDate: r.normalized.trainingDate,
          placementCity: r.normalized.placementCity,
          asmName: r.normalized.asmName,
          vendorName: r.normalized.vendorName,
          phoneNumber: r.normalized.phoneNumber,
          email: r.normalized.email,
          birthDate: r.normalized.birthDate,
          address: r.normalized.address,
          education: r.normalized.education,
        },
        rawData: r.rawData || {},
        unmappedExtraColumns: r.unmappedExtraColumns || {},
      }));

      const res = await submitAttendanceImportToSheets(recordsToSubmit, {
        fileName: fileInfo.name,
      });

      if (!res.success) {
        throw new Error(res.error || 'Server Google Apps Script menolak permintaan import.');
      }

      // Catat response ID baru ke local storage agar deduplikasi tetap terjaga
      const newlyImportedIds = recordsToSubmit.map((r) => r.responseId);
      const updatedIds = Array.from(new Set([...importedIds, ...newlyImportedIds]));
      setImportedIds(updatedIds);
      localStorage.setItem(STORAGE_IMPORTED_ATTENDANCE_IDS_KEY, JSON.stringify(updatedIds));

      // Tandai baris yang baru saja berhasil diimpor sebagai 'duplicate' (pernah diimpor)
      setParsedRows((prev) =>
        prev.map((row) => {
          if (newlyImportedIds.includes(row.responseId)) {
            return {
              ...row,
              validation: {
                status: 'duplicate',
                errors: ['Respons baru saja berhasil diimpor ke Google Sheets.'],
              },
            };
          }
          return row;
        })
      );

      setImportNotification({
        type: 'success',
        title: 'Import Berhasil Ditambahkan ke Google Sheets!',
        message: `Sebanyak ${res.inserted || newlyImportedIds.length} data absensi baru berhasil ditambahkan sebagai baris baru ke sheet "${res.sheetName || cfg.targetSheetName}". Riwayat tercatat di tab IMPORT_LOG.`,
      });

      // Muat ulang riwayat & sinkronkan data peserta
      loadImportHistory();
      refreshFromGoogleSheets().catch(() => {});
    } catch (err) {
      setImportNotification({
        type: 'error',
        title: 'Proses Import Gagal',
        message: err.message || 'Terjadi kesalahan saat berkomunikasi dengan Google Apps Script.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter preview data
  const filteredRows = useMemo(() => {
    let result = [...parsedRows];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.normalized.fullName.toLowerCase().includes(q) ||
          r.normalized.nik.toLowerCase().includes(q) ||
          r.normalized.placementCity.toLowerCase().includes(q)
      );
    }

    if (filterValidation) {
      result = result.filter((r) => r.validation.status === filterValidation);
    }

    return result;
  }, [parsedRows, searchQuery, filterValidation]);

  // Paginasi
  const totalPages = Math.ceil(filteredRows.length / DEFAULT_PAGE_SIZE) || 1;
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * DEFAULT_PAGE_SIZE,
    currentPage * DEFAULT_PAGE_SIZE
  );

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Title & Breadcrumb Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="text-mr-purple" size={26} />
            Import Absensi AE Training
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Unggah dan validasi berkas respons kehadiran Google Form sebelum ditambahkan ke Google Sheets utama
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab Navigation Button */}
          <div className="inline-flex rounded-xl bg-neutral-100 p-1 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('import')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'import'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Upload size={13} />
              Unggah & Validasi
            </button>
            <button
              onClick={() => {
                setActiveTab('history');
                loadImportHistory();
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <History size={13} />
              Riwayat Import ({importHistory.length})
            </button>
          </div>

          {fileInfo && activeTab === 'import' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-neutral-600 bg-white border border-neutral-300 rounded-xl hover:bg-neutral-50 transition-colors shadow-xs disabled:opacity-50"
              >
                <Trash2 size={14} className="text-neutral-400" />
                Reset Berkas
              </button>
              <button
                onClick={handleTriggerImport}
                disabled={summary.ready === 0 || isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-mr-purple rounded-xl hover:bg-mr-purple-dark transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Cloud size={14} className={isSubmitting ? 'animate-bounce' : ''} />
                {isSubmitting ? 'Mengirim ke Google Sheets...' : `Proses Import (${summary.ready} Data Siap)`}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {importNotification && (
        <div
          className={`flex items-start gap-3 rounded-2xl p-4 text-xs animate-fade-in shadow-xs border ${
            importNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : importNotification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-950'
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}
        >
          {importNotification.type === 'success' ? (
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : importNotification.type === 'error' ? (
            <XCircle size={18} className="text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 space-y-1">
            <h4 className="font-bold">{importNotification.title}</h4>
            <p className="opacity-90 leading-relaxed">{importNotification.message}</p>
          </div>
          <button
            onClick={() => setImportNotification(null)}
            className="text-xs font-semibold opacity-70 hover:opacity-100 hover:underline shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* TAB: RIWAYAT IMPORT */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <History size={18} className="text-mr-purple" />
                Catatan Log Import (Google Sheets & Local)
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Mencatat respon_id yang sudah pernah diimpor untuk mencegah duplikasi data
              </p>
            </div>
            <button
              onClick={loadImportHistory}
              disabled={loadingHistory}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
              Segarkan Log
            </button>
          </div>

          {importHistory.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 space-y-2">
              <ClipboardList size={36} className="mx-auto text-neutral-300" />
              <p className="text-sm font-semibold">Belum Ada Riwayat Import</p>
              <p className="text-xs max-w-sm mx-auto">
                Riwayat akan tercatat secara otomatis di tab IMPORT_LOG Google Spreadsheet setelah proses import pertama berhasil dijalankan.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600">
                  <tr>
                    <th className="px-3.5 py-2.5 font-bold">Waktu Import</th>
                    <th className="px-3.5 py-2.5 font-bold">Response ID</th>
                    <th className="px-3.5 py-2.5 font-bold">Nama File</th>
                    <th className="px-3.5 py-2.5 font-bold">Status</th>
                    <th className="px-3.5 py-2.5 font-bold">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {importHistory.map((log, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50">
                      <td className="px-3.5 py-2.5 text-neutral-600 whitespace-nowrap">
                        {log.importTimestamp || log.timestamp || '-'}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-[11px] text-neutral-800">
                        {log.responseId || '-'}
                      </td>
                      <td className="px-3.5 py-2.5 text-neutral-700">{log.fileName || '-'}</td>
                      <td className="px-3.5 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={10} /> {log.status || 'SUCCESS'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-neutral-500">{log.errorMessage || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: UNGGAH & IMPORT */}
      {activeTab === 'import' && (
        <>
          {/* Section 1: Ringkasan Kartu Metrik */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Total Respons */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold">Total Respons</span>
                <span className="p-1.5 bg-neutral-100 rounded-lg text-neutral-700">
                  <FileSpreadsheet size={15} />
                </span>
              </div>
              <p className="text-2xl font-black text-neutral-900 tracking-tight">
                {summary.total}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Baris data pada berkas</p>
            </div>

            {/* Siap Diimpor */}
            <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs bg-gradient-to-br from-white to-emerald-50/40">
              <div className="flex items-center justify-between text-emerald-700 mb-2">
                <span className="text-xs font-semibold">Siap Diimpor</span>
                <span className="p-1.5 bg-emerald-100 rounded-lg text-emerald-700">
                  <CheckCircle2 size={15} />
                </span>
              </div>
              <p className="text-2xl font-black text-emerald-700 tracking-tight">
                {summary.ready}
              </p>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">Data valid & respons baru</p>
            </div>

            {/* Pernah Diimpor */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 p-4 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 mb-2">
                <span className="text-xs font-semibold">Pernah Diimpor</span>
                <span className="p-1.5 bg-neutral-100 rounded-lg text-neutral-600">
                  <Copy size={15} />
                </span>
              </div>
              <p className="text-2xl font-black text-neutral-700 tracking-tight">
                {summary.duplicate}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">Dilewati otomatis</p>
            </div>

            {/* Data Belum Lengkap */}
            <div className="bg-white rounded-2xl border border-warning-200/80 p-4 shadow-xs bg-gradient-to-br from-white to-warning-50/30">
              <div className="flex items-center justify-between text-warning-700 mb-2">
                <span className="text-xs font-semibold">Data Kurang</span>
                <span className="p-1.5 bg-warning-100 rounded-lg text-warning-700">
                  <AlertTriangle size={15} />
                </span>
              </div>
              <p className="text-2xl font-black text-warning-700 tracking-tight">
                {summary.incomplete}
              </p>
              <p className="text-[11px] text-warning-600/80 mt-0.5">Wajib: Nama, NIK, Tgl</p>
            </div>

            {/* Format Salah */}
            <div className="bg-white rounded-2xl border border-error-200/80 p-4 shadow-xs bg-gradient-to-br from-white to-error-50/30 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-error-700 mb-2">
                <span className="text-xs font-semibold">Format Salah</span>
                <span className="p-1.5 bg-error-100 rounded-lg text-error-700">
                  <XCircle size={15} />
                </span>
              </div>
              <p className="text-2xl font-black text-error-700 tracking-tight">
                {summary.invalid}
              </p>
              <p className="text-[11px] text-error-600/80 mt-0.5">NIK bukan 16 digit angka</p>
            </div>
          </div>

          {/* Section 2: Area Upload File */}
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Upload size={18} className="text-mr-purple" />
                  Area Unggah Respons Form
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Unggah berkas spreadsheet hasil ekspor formulir absensi Google Form (.xlsx atau .csv)
                </p>
              </div>

              {fileInfo && (
                <div className="text-right">
                  <span className="text-xs font-bold text-mr-purple bg-mr-purple/10 px-2.5 py-1 rounded-full">
                    {fileInfo.name} ({formatFileSize(fileInfo.size)})
                  </span>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            {!fileInfo ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? 'border-mr-purple bg-mr-purple/5 scale-[0.99]'
                    : 'border-neutral-300 hover:border-mr-purple/60 hover:bg-neutral-50/70 bg-neutral-50/30'
                }`}
              >
                <div className="max-w-md mx-auto space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-mr-purple/10 text-mr-purple flex items-center justify-center">
                    <FileSpreadsheet size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900">
                      Klik untuk memilih berkas atau seret berkas ke sini
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV (.csv)
                    </p>
                  </div>
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-mr-purple bg-mr-purple/10 rounded-xl hover:bg-mr-purple/20 transition-colors">
                      <Upload size={13} />
                      Pilih Berkas Spreadsheet
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-mr-purple/10 text-mr-purple rounded-xl shrink-0">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-neutral-900 text-sm">{fileInfo.name}</p>
                    <p className="text-neutral-500">
                      Ukuran: {formatFileSize(fileInfo.size)} • Lembar: &quot;{fileInfo.sheetName}&quot; • Total: {fileInfo.totalRows} baris respons
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 font-semibold text-mr-purple bg-white border border-mr-purple/30 rounded-lg hover:bg-mr-purple/5 transition-colors"
                  >
                    Ganti Berkas
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Hapus berkas"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {readingFile && (
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-mr-purple p-3 bg-mr-purple/5 rounded-xl animate-pulse">
                <RefreshCw size={14} className="animate-spin" />
                Membaca dan memvalidasi berkas spreadsheet absensi...
              </div>
            )}

            {errorMessage && (
              <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl animate-fade-in">
                <XCircle size={16} className="shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Section 3: Mapping Kolom & Preview Data */}
      {fileInfo && activeTab === 'import' && (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-xs p-6 space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-neutral-100">
            <div>
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Layers size={18} className="text-mr-purple" />
                Pemetaan Kolom & Pratinjau Data Respons
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Kolom terdeteksi secara otomatis berdasarkan kata kunci header formulir
              </p>
            </div>

            {/* Quick Mapping Indicators */}
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 font-semibold border border-neutral-200">
                Nama: {columnMapping.fullName >= 0 ? rawHeaders[columnMapping.fullName] : '—'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 font-semibold border border-neutral-200">
                NIK: {columnMapping.nik >= 0 ? rawHeaders[columnMapping.nik] : '—'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-700 font-semibold border border-neutral-200">
                Tgl: {columnMapping.trainingDate >= 0 ? rawHeaders[columnMapping.trainingDate] : '—'}
              </span>
            </div>
          </div>

          {/* Filter & Search Bar Preview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari nama, NIK, atau kota penempatan..."
                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50/50 focus:outline-none focus:ring-2 focus:ring-mr-purple/20 focus:border-mr-purple transition-all"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <Filter size={14} className="text-neutral-400" />
              <select
                value={filterValidation}
                onChange={(e) => {
                  setFilterValidation(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-xs rounded-xl border border-neutral-200 bg-white font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-mr-purple/20"
              >
                <option value="">Semua Status ({parsedRows.length})</option>
                <option value="ready">Siap Diimpor ({summary.ready})</option>
                <option value="duplicate">Pernah Diimpor ({summary.duplicate})</option>
                <option value="incomplete">Data Kurang ({summary.incomplete})</option>
                <option value="invalid_format">Format Salah ({summary.invalid})</option>
              </select>
            </div>
          </div>

          {/* Table Preview */}
          <div className="overflow-x-auto rounded-xl border border-neutral-200/90 shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/80 border-b border-neutral-200 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-bold w-12 text-center">#</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">Status Validasi</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">Waktu Respons</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">Nama Lengkap</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">NIK</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">Tgl Training</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">Kota</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">ASM</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">Vendor</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">No WhatsApp</th>
                  <th className="px-4 py-3 font-bold whitespace-nowrap">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8 text-neutral-400">
                      Tidak ada data yang sesuai dengan filter atau pencarian.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((r) => {
                    const vStatus = r.validation.status;
                    return (
                      <tr
                        key={r.rowIndex}
                        className={`transition-colors ${
                          vStatus === 'ready'
                            ? 'hover:bg-emerald-50/30'
                            : vStatus === 'duplicate'
                            ? 'bg-neutral-50/60 opacity-80'
                            : 'bg-rose-50/20 hover:bg-rose-50/40'
                        }`}
                      >
                        <td className="px-4 py-3 text-center text-neutral-400 font-mono text-[11px]">
                          {r.rowIndex}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {vStatus === 'ready' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} /> Siap Diimpor
                            </span>
                          )}
                          {vStatus === 'duplicate' && (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200"
                              title={r.validation.errors.join(', ')}
                            >
                              <Copy size={12} /> Pernah Diimpor
                            </span>
                          )}
                          {vStatus === 'incomplete' && (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-warning-50 text-warning-700 border border-warning-200"
                              title={r.validation.errors.join(', ')}
                            >
                              <AlertTriangle size={12} /> Data Kurang
                            </span>
                          )}
                          {vStatus === 'invalid_format' && (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-error-50 text-error-700 border border-error-200"
                              title={r.validation.errors.join(', ')}
                            >
                              <XCircle size={12} /> Format Salah
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                          {r.normalized.timestamp || '-'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-neutral-900 whitespace-nowrap">
                          {r.normalized.fullName || '-'}
                        </td>
                        <td className="px-4 py-3 text-neutral-700 font-mono whitespace-nowrap">
                          {r.normalized.nik || '-'}
                        </td>
                        <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">
                          {formatDateShort(r.normalized.trainingDate)}
                        </td>
                        <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">
                          {r.normalized.placementCity || '-'}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                          {r.normalized.asmName || '-'}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                          {r.normalized.vendorName || '-'}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                          {r.normalized.phoneNumber || '-'}
                        </td>
                        <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                          {r.normalized.email || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-xs text-neutral-500">
              <p>
                Halaman {currentPage} dari {totalPages} ({filteredRows.length} total baris)
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
