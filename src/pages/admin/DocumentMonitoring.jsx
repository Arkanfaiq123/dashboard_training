import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  Clock,
  AlertTriangle,
  XCircle,
  Eye,
  Filter,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { DOCUMENT_TYPES, VERIFICATION_STATUS, VERIFICATION_STATUS_LABELS } from '@/lib/constants';
import FileUploadModal from '@/components/FileUploadModal';

function getVerificationBadge(status) {
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-[11px] font-semibold text-success-700 border border-success-100">
          <FileCheck size={11} /> OK
        </span>
      );
    case 'needs_revision':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-error-50 px-2 py-0.5 text-[11px] font-semibold text-error-600 border border-error-100">
          <AlertTriangle size={11} /> Revisi
        </span>
      );
    case 'pending_review':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-[11px] font-semibold text-warning-700 border border-warning-100">
          <Clock size={11} /> Pending
        </span>
      );
  }
}

function getMissingBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-400 border border-neutral-200">
      <XCircle size={11} /> Kosong
    </span>
  );
}

export default function DocumentMonitoring() {
  const navigate = useNavigate();
  const { participants, hasData, getDocVerification } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterDocType, setFilterDocType] = useState('');
  const [filterVerification, setFilterVerification] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const cityOptions = useMemo(
    () => [...new Set(participants.map((p) => p.placement_city).filter(Boolean))].sort(),
    [participants]
  );

  // Overall document counter
  const docSummary = useMemo(() => {
    let totalDocs = 0;
    let verified = 0;
    let pending = 0;
    let needsRevision = 0;

    participants.forEach((p) => {
      DOCUMENT_TYPES.forEach((dt) => {
        const isAvail = p.documents?.[dt.key]?.available;
        if (isAvail) {
          totalDocs++;
          const status = getDocVerification(p.id, dt.key).status;
          if (status === 'verified') verified++;
          else if (status === 'needs_revision') needsRevision++;
          else pending++;
        }
      });
    });

    return { totalDocs, verified, pending, needsRevision };
  }, [participants, getDocVerification]);

  // Filter logic
  const filteredParticipants = useMemo(() => {
    let data = [...participants];

    if (filterCity) {
      data = data.filter((p) => p.placement_city === filterCity);
    }

    if (filterDocType || filterVerification) {
      data = data.filter((p) => {
        if (filterDocType) {
          const doc = p.documents?.[filterDocType];
          if (!doc || !doc.available) return false;
          if (filterVerification) {
            const verif = getDocVerification(p.id, filterDocType).status;
            return verif === filterVerification;
          }
          return true;
        }

        if (filterVerification) {
          return DOCUMENT_TYPES.some((dt) => {
            const doc = p.documents?.[dt.key];
            if (!doc || !doc.available) return false;
            return getDocVerification(p.id, dt.key).status === filterVerification;
          });
        }
        return true;
      });
    }

    return data;
  }, [participants, filterCity, filterDocType, filterVerification, getDocVerification]);

  if (!hasData) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kelengkapan Dokumen</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Monitoring kelengkapan 4 dokumen wajib (KTP, KK, Foto Diri, Ijazah)
          </p>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-12 text-center shadow-[var(--shadow-card)] space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mr-purple-50 text-mr-purple">
            <FileSpreadsheet size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-neutral-900">Belum Ada Berkas Peserta</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Silakan unggah spreadsheet peserta terlebih dahulu untuk memantau status dokumen dan melakukan verifikasi.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-mr-purple px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-mr-purple-dark transition-colors"
          >
            <Upload size={15} />
            Upload File Spreadsheet
          </button>
        </div>

        <FileUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Kelengkapan Dokumen</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Pantau dan verifikasi 4 dokumen administrasi calon peserta AE
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <Upload size={14} className="text-mr-purple" />
          Upload Berkas Baru
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info-50 text-info-600">
              <FileCheck size={16} />
            </div>
            <span className="text-xs text-neutral-500">File Tersedia</span>
          </div>
          <p className="text-2xl font-bold text-neutral-900">{docSummary.totalDocs}</p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50 text-success-600">
              <FileCheck size={16} />
            </div>
            <span className="text-xs text-neutral-500">Terverifikasi</span>
          </div>
          <p className="text-2xl font-bold text-success-700">{docSummary.verified}</p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
              <Clock size={16} />
            </div>
            <span className="text-xs text-neutral-500">Menunggu Review</span>
          </div>
          <p className="text-2xl font-bold text-warning-700">{docSummary.pending}</p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error-50 text-error-600">
              <AlertTriangle size={16} />
            </div>
            <span className="text-xs text-neutral-500">Perlu Revisi</span>
          </div>
          <p className="text-2xl font-bold text-error-600">{docSummary.needsRevision}</p>
        </div>
      </div>

      {/* Filter Row */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
            <Filter size={14} /> Filter
          </div>

          <select
            value={filterDocType}
            onChange={(e) => setFilterDocType(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 focus:border-mr-purple focus:outline-none"
          >
            <option value="">Semua Tipe Dokumen</option>
            {DOCUMENT_TYPES.map((dt) => (
              <option key={dt.key} value={dt.key}>{dt.label}</option>
            ))}
          </select>

          <select
            value={filterVerification}
            onChange={(e) => setFilterVerification(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 focus:border-mr-purple focus:outline-none"
          >
            <option value="">Semua Status Verifikasi</option>
            <option value={VERIFICATION_STATUS.VERIFIED}>
              {VERIFICATION_STATUS_LABELS[VERIFICATION_STATUS.VERIFIED]}
            </option>
            <option value={VERIFICATION_STATUS.PENDING}>
              {VERIFICATION_STATUS_LABELS[VERIFICATION_STATUS.PENDING]}
            </option>
            <option value={VERIFICATION_STATUS.NEEDS_REVISION}>
              {VERIFICATION_STATUS_LABELS[VERIFICATION_STATUS.NEEDS_REVISION]}
            </option>
          </select>

          <select
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 focus:border-mr-purple focus:outline-none"
          >
            <option value="">Semua Kota</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {(filterDocType || filterVerification || filterCity) && (
            <button
              onClick={() => {
                setFilterDocType('');
                setFilterVerification('');
                setFilterCity('');
              }}
              className="flex items-center gap-1 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 transition-colors"
            >
              <XCircle size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Document Matrix Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Nama Peserta
                </th>
                {DOCUMENT_TYPES.map((dt) => (
                  <th
                    key={dt.key}
                    className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider"
                  >
                    {dt.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider w-20">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredParticipants.length === 0 ? (
                <tr>
                  <td colSpan={DOCUMENT_TYPES.length + 2} className="px-4 py-12 text-center text-sm text-neutral-400">
                    Tidak ada dokumen peserta yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredParticipants.map((p) => (
                  <tr
                    key={p.id}
                    className="table-row-hover cursor-pointer"
                    onClick={() => navigate(`/admin/participants/${p.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{p.full_name}</p>
                        <p className="text-xs text-neutral-400">{p.placement_city}</p>
                      </div>
                    </td>
                    {DOCUMENT_TYPES.map((dt) => {
                      const doc = p.documents?.[dt.key];
                      const verif = getDocVerification(p.id, dt.key);

                      return (
                        <td key={dt.key} className="px-4 py-3 text-center">
                          {doc?.available ? getVerificationBadge(verif.status) : getMissingBadge()}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/participants/${p.id}`);
                        }}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-mr-purple transition-colors"
                        title="Periksa Dokumen"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <FileUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
