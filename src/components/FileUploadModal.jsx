import { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  X,
  FileText,
} from 'lucide-react';
import { readSpreadsheetFile, autoSuggestColumnMapping, processSpreadsheetRows } from '@/lib/spreadsheetParser';
import { useData } from '@/contexts/DataContext';

export default function FileUploadModal({ isOpen, onClose }) {
  const { importParticipantData } = useData();

  const [step, setStep] = useState('upload'); // 'upload' | 'mapping' | 'preview'
  const [fileData, setFileData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [processedPreview, setProcessedPreview] = useState([]);
  const [readingFile, setReadingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReadingFile(true);
    setErrorMessage('');

    try {
      const parsed = await readSpreadsheetFile(file);
      setFileData(parsed);

      // Auto map columns
      const suggested = autoSuggestColumnMapping(parsed.headers);
      setMapping(suggested);

      // Preview first 5 rows
      const preview = processSpreadsheetRows(parsed.dataRows.slice(0, 5), suggested);
      setProcessedPreview(preview);

      setStep('mapping');
    } catch (err) {
      setErrorMessage(err.message || 'Gagal membaca berkas spreadsheet.');
    } finally {
      setReadingFile(false);
    }
  };

  const handleMappingChange = (fieldKey, columnIndex) => {
    const updated = {
      ...mapping,
      [fieldKey]: columnIndex === '' ? '' : Number(columnIndex),
    };
    setMapping(updated);

    if (fileData) {
      const preview = processSpreadsheetRows(fileData.dataRows.slice(0, 5), updated);
      setProcessedPreview(preview);
    }
  };

  const handleConfirmImport = () => {
    if (!fileData) return;

    const allProcessed = processSpreadsheetRows(fileData.dataRows, mapping);
    importParticipantData(allProcessed, {
      fileName: fileData.fileName,
      sheetName: fileData.sheetName,
      totalRows: allProcessed.length,
      uploadedAt: new Date().toISOString(),
    });

    onClose();
  };

  const FIELD_LABELS = [
    { key: 'fullName', label: 'Nama Lengkap Peserta *', required: true },
    { key: 'placementCity', label: 'Kota Penempatan (Purwokerto, dll) *', required: true },
    { key: 'nik', label: 'NIK KTP' },
    { key: 'phoneNumber', label: 'Nomor WhatsApp / HP' },
    { key: 'email', label: 'Alamat Email' },
    { key: 'trainingDate', label: 'Tanggal Training' },
    { key: 'asmName', label: 'Nama ASM' },
    { key: 'vendorName', label: 'Nama Vendor' },
    { key: 'birthDate', label: 'Tanggal Lahir' },
    { key: 'address', label: 'Alamat Domisili' },
    { key: 'education', label: 'Pendidikan Terakhir' },
    { key: 'maritalStatus', label: 'Status Perkawinan' },
    { key: 'vaccinationStatus', label: 'Status Vaksin' },
    { key: 'docKtp', label: 'Kolom Link Upload KTP' },
    { key: 'docKk', label: 'Kolom Link Upload KK' },
    { key: 'docFoto', label: 'Kolom Link Foto Diri' },
    { key: 'docIjazah', label: 'Kolom Link Upload Ijazah' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-mr-purple-50 text-mr-purple">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Import Data Peserta dari Spreadsheet
              </h2>
              <p className="text-xs text-neutral-500">
                Mendukung file Excel (.xlsx, .xls) dan CSV hasil export Google Sheets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-lg border border-error-200 bg-error-50 p-3.5 text-sm text-error-700">
              <AlertCircle size={18} className="shrink-0 text-error-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50/60 p-10 text-center cursor-pointer hover:border-mr-purple/50 hover:bg-mr-purple-50/10 transition-all"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-neutral-200 mb-4 text-mr-purple">
                  {readingFile ? (
                    <RefreshCw size={28} className="animate-spin" />
                  ) : (
                    <Upload size={28} />
                  )}
                </div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {readingFile ? 'Sedang membaca file...' : 'Klik untuk memilih file spreadsheet'}
                </h3>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm">
                  Pilih file .xlsx, .xls, atau .csv yang diunduh langsung dari Google Sheets formulir pendaftaran AE Training 2026.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Security info banner */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-600 space-y-1">
                <p className="font-semibold text-neutral-800">Catatan Privasi & Penyimpanan Browser:</p>
                <p>
                  • Seluruh data diproses 100% lokal di browser Anda dan disimpan ke <code>localStorage</code> perangkat ini.<br />
                  • Tidak ada data yang dikirim ke server luar atau database pihak ketiga.<br />
                  • Data tetap tersimpan selama Anda membuka browser ini pada komputer yang sama.
                </p>
              </div>
            </div>
          )}

          {step === 'mapping' && fileData && (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-xl bg-neutral-100 p-3.5 text-xs text-neutral-700">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-neutral-500" />
                  <span>
                    Berkas: <strong>{fileData.fileName}</strong> ({fileData.totalRows} baris data ditemukan)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setFileData(null);
                  }}
                  className="text-mr-purple hover:underline font-semibold"
                >
                  Pilih Berkas Lain
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                    <SlidersHorizontal size={16} className="text-mr-purple" />
                    Penyesuaian Kolom Spreadsheet
                  </h3>
                  <span className="text-xs text-neutral-400">
                    Sistem telah mencocokkan kolom secara otomatis
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mb-3">
                  Cocokkan nama kolom di spreadsheet Anda dengan field data pendaftaran di bawah ini:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-72 overflow-y-auto p-1 border border-neutral-200 rounded-xl bg-white">
                  {FIELD_LABELS.map((field) => (
                    <div key={field.key} className="p-2.5 rounded-lg border border-neutral-100 bg-neutral-50/50">
                      <label className="block text-xs font-semibold text-neutral-700 mb-1">
                        {field.label}
                      </label>
                      <select
                        value={mapping[field.key] !== undefined ? mapping[field.key] : ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className="w-full text-xs rounded-lg border border-neutral-300 bg-white p-2 text-neutral-800 focus:border-mr-purple focus:outline-none"
                      >
                        <option value="">-- (Tidak Ada / Kosongkan) --</option>
                        {fileData.headers.map((h, colIdx) => (
                          <option key={colIdx} value={colIdx}>
                            Kolom {colIdx + 1}: {h || `(Kolom ${colIdx + 1})`}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sample Preview */}
              <div>
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
                  Preview 5 Baris Data Teratas:
                </h4>
                <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-50 text-neutral-600 border-b border-neutral-200">
                      <tr>
                        <th className="p-2.5">Nama Peserta</th>
                        <th className="p-2.5">Kota</th>
                        <th className="p-2.5">ASM</th>
                        <th className="p-2.5">Vendor</th>
                        <th className="p-2.5">Tgl Training</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {processedPreview.map((p, idx) => (
                        <tr key={idx} className="hover:bg-neutral-50/50">
                          <td className="p-2.5 font-semibold text-neutral-900">{p.full_name}</td>
                          <td className="p-2.5 text-neutral-600">{p.placement_city}</td>
                          <td className="p-2.5 text-neutral-600">{p.asm_name}</td>
                          <td className="p-2.5 text-neutral-600">{p.vendor_name}</td>
                          <td className="p-2.5 text-neutral-600">{p.training_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-neutral-200 px-6 py-4 bg-neutral-50">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 transition-colors"
          >
            Batal
          </button>

          {step === 'mapping' && (
            <button
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-mr-purple px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-mr-purple-dark transition-colors"
            >
              Simpan & Terapkan Data ({fileData?.totalRows || 0} Peserta)
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

