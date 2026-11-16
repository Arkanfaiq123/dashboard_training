import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
  Edit3,
  Check,
  Save,
  FileSpreadsheet,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/formatters';
import { DOCUMENT_TYPES, AVAILABILITY_STATUS_LABELS, VERIFICATION_STATUS_LABELS } from '@/lib/constants';

function maskNik(nik) {
  if (!nik || nik.length <= 8) return nik || '-';
  return `${nik.slice(0, 4)}${'•'.repeat(nik.length - 8)}${nik.slice(-4)}`;
}

function maskPhone(phone) {
  if (!phone || phone.length <= 7) return phone || '-';
  return `${phone.slice(0, 4)}${'•'.repeat(phone.length - 7)}${phone.slice(-3)}`;
}

function getVerificationIcon(status) {
  switch (status) {
    case 'verified':
      return <CheckCircle size={16} className="text-success-600" />;
    case 'needs_revision':
      return <AlertCircle size={16} className="text-error-500" />;
    case 'pending_review':
    default:
      return <Clock size={16} className="text-warning-500" />;
  }
}

function getVerificationBadge(status) {
  const label = VERIFICATION_STATUS_LABELS[status] || status;
  switch (status) {
    case 'verified':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-semibold text-success-700 border border-success-100">
          <CheckCircle size={12} />
          {label}
        </span>
      );
    case 'needs_revision':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-error-50 px-2 py-0.5 text-xs font-semibold text-error-600 border border-error-100">
          <XCircle size={12} />
          {label}
        </span>
      );
    case 'pending_review':
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-xs font-semibold text-warning-700 border border-warning-100">
          <Clock size={12} />
          {label}
        </span>
      );
  }
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-neutral-100 last:border-0">
      <dt className="text-sm text-neutral-500 sm:w-40 shrink-0">{label}</dt>
      <dd className="text-sm font-semibold text-neutral-900">{value || '-'}</dd>
    </div>
  );
}

export default function ParticipantDetail() {
  const { id } = useParams();
  const { participants, getDocVerification, updateDocumentVerification } = useData();
  const { user } = useAuth();

  const participant = useMemo(
    () => participants.find((p) => p.id === id),
    [participants, id]
  );

  const [editingDoc, setEditingDoc] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [feedback, setFeedback] = useState(null);

  if (!participant) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Link
          to="/admin/participants"
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-mr-purple transition-colors"
        >
          <ArrowLeft size={16} /> Kembali ke Data Peserta
        </Link>
        <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center shadow-[var(--shadow-card)] space-y-2">
          <XCircle size={44} className="mx-auto text-neutral-300" />
          <h2 className="text-lg font-bold text-neutral-800">Peserta Tidak Ditemukan</h2>
          <p className="text-sm text-neutral-500">
            ID &quot;{id}&quot; tidak terdapat pada berkas spreadsheet yang sedang dibuka.
          </p>
        </div>
      </div>
    );
  }

  const handleStartEdit = (docType) => {
    const current = getDocVerification(participant.id, docType);
    setEditingDoc(docType);
    setNewStatus(current.status || 'pending_review');
    setAdminNote(current.note || '');
    setFeedback(null);
  };

  const handleSave = (docType) => {
    updateDocumentVerification(
      participant.id,
      docType,
      newStatus,
      adminNote,
      user?.name || 'Admin'
    );
    setEditingDoc(null);
    setFeedback(`Status verifikasi ${docType.toUpperCase()} berhasil disimpan.`);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        to="/admin/participants"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-mr-purple transition-colors"
      >
        <ArrowLeft size={16} /> Kembali ke Data Peserta
      </Link>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 animate-fade-in">
          <Check size={16} className="text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Header Info */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mr-purple-50 text-mr-purple">
          <User size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{participant.full_name}</h1>
          <p className="text-xs text-neutral-400">
            ID: {participant.id} • Baris Spreadsheet #{participant.rowNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personal Info */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3.5 bg-neutral-50">
            <User size={16} className="text-neutral-500" />
            <h2 className="text-sm font-bold text-neutral-800">Informasi Pribadi</h2>
          </div>
          <div className="px-5 py-2">
            <dl>
              <InfoRow label="Nama Lengkap" value={participant.full_name} />
              <InfoRow label="NIK KTP" value={maskNik(participant.nik)} />
              <InfoRow label="Tanggal Lahir" value={formatDate(participant.birth_date)} />
              <InfoRow label="Email" value={participant.email} />
              <InfoRow label="No. WhatsApp" value={maskPhone(participant.phone_number)} />
              <InfoRow label="Alamat Domisili" value={participant.address} />
            </dl>
          </div>
        </div>

        {/* Placement Info */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3.5 bg-neutral-50">
            <MapPin size={16} className="text-neutral-500" />
            <h2 className="text-sm font-bold text-neutral-800">Informasi Penempatan</h2>
          </div>
          <div className="px-5 py-2">
            <dl>
              <InfoRow label="Kota Penempatan" value={participant.placement_city} />
              <InfoRow label="Nama ASM" value={participant.asm_name} />
              <InfoRow label="Nama Vendor" value={participant.vendor_name} />
              <InfoRow label="Tanggal Training" value={formatDate(participant.training_date)} />
              <InfoRow label="Waktu Pendaftaran" value={formatDate(participant.registered_at)} />
            </dl>
          </div>
        </div>

        {/* Administration Info */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-3.5 bg-neutral-50">
            <GraduationCap size={16} className="text-neutral-500" />
            <h2 className="text-sm font-bold text-neutral-800">Administrasi</h2>
          </div>
          <div className="px-5 py-2">
            <dl>
              <InfoRow label="Pendidikan Terakhir" value={participant.education} />
              <InfoRow label="Status Perkawinan" value={participant.marital_status} />
              <InfoRow
                label="Status Vaksin"
                value={
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-success-50 text-success-700 border border-success-100">
                    {participant.vaccination_status || '-'}
                  </span>
                }
              />
            </dl>
          </div>
        </div>

        {/* Document Verification Section */}
        <div className="rounded-xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5 bg-neutral-50">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-neutral-500" />
              <h2 className="text-sm font-bold text-neutral-800">Pemeriksaan Dokumen Peserta</h2>
            </div>
            <span className="text-[11px] text-neutral-400">Verifikasi disimpan lokal</span>
          </div>

          <div className="p-5 space-y-3.5">
            {DOCUMENT_TYPES.map((docType) => {
              const doc = participant.documents?.[docType.key] || { available: false, url: null };
              const verif = getDocVerification(participant.id, docType.key);
              const isEditing = editingDoc === docType.key;

              return (
                <div
                  key={docType.key}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-neutral-200">
                        {getVerificationIcon(verif.status)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{docType.label}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              doc.available
                                ? 'bg-success-50 text-success-700 border border-success-100'
                                : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                            }`}
                          >
                            {doc.available ? 'Link Tersedia' : 'Belum Ada File'}
                          </span>
                          {getVerificationBadge(verif.status)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-mr-purple bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
                        >
                          Buka
                          <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Tidak ada link</span>
                      )}

                      {!isEditing && (
                        <button
                          onClick={() => handleStartEdit(docType.key)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-neutral-600 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
                        >
                          <Edit3 size={12} />
                          Ubah Status
                        </button>
                      )}
                    </div>
                  </div>

                  {verif.note && !isEditing && (
                    <div className="text-xs bg-white rounded-lg p-2.5 border border-neutral-200 text-neutral-700">
                      <strong>Catatan Admin:</strong> {verif.note}
                    </div>
                  )}

                  {isEditing && (
                    <div className="bg-white p-3.5 rounded-xl border border-mr-purple/20 space-y-3 animate-fade-in">
                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Status Pemeriksaan:
                        </label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="w-full text-xs rounded-lg border border-neutral-300 p-2 focus:border-mr-purple focus:outline-none"
                        >
                          <option value="pending_review">Menunggu Review</option>
                          <option value="verified">Terverifikasi (Lolos)</option>
                          <option value="needs_revision">Perlu Revisi</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-neutral-700 mb-1">
                          Catatan Pemeriksa:
                        </label>
                        <textarea
                          rows={2}
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Tuliskan catatan verifikasi atau alasan perbaikan..."
                          className="w-full text-xs rounded-lg border border-neutral-300 p-2 focus:border-mr-purple focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setEditingDoc(null)}
                          className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSave(docType.key)}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-mr-purple rounded-lg hover:bg-mr-purple-dark transition-colors"
                        >
                          <Save size={13} />
                          Simpan Verifikasi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
