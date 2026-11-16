import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  FileSpreadsheet,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { formatDateShort } from '@/lib/formatters';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import FileUploadModal from '@/components/FileUploadModal';

export default function ParticipantList() {
  const { participants, hasData, getDocVerification, refreshFromGoogleSheets, isCloudSyncing } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  const handleManualSync = async () => {
    setSyncFeedback(null);
    const result = await refreshFromGoogleSheets();
    if (result.success) {
      setSyncFeedback({ type: 'success', message: `Berhasil mengambil ${result.count} data peserta dari Google Sheets!` });
    } else {
      setSyncFeedback({ type: 'error', message: result.error || 'Gagal mengambil data dari Google Sheets.' });
    }
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterAsm, setFilterAsm] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterDocStatus, setFilterDocStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('full_name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Dynamic filter options from actual data
  const cityOptions = useMemo(
    () => [...new Set(participants.map((p) => p.placement_city).filter(Boolean))].sort(),
    [participants]
  );
  const asmOptions = useMemo(
    () => [...new Set(participants.map((p) => p.asm_name).filter(Boolean))].sort(),
    [participants]
  );
  const vendorOptions = useMemo(
    () => [...new Set(participants.map((p) => p.vendor_name).filter(Boolean))].sort(),
    [participants]
  );
  const dateOptions = useMemo(
    () => [...new Set(participants.map((p) => p.training_date).filter(Boolean))].sort(),
    [participants]
  );

  // Filter & Search logic
  const filteredData = useMemo(() => {
    let data = [...participants];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      data = data.filter((p) => p.full_name?.toLowerCase().includes(q));
    }
    if (filterCity) data = data.filter((p) => p.placement_city === filterCity);
    if (filterAsm) data = data.filter((p) => p.asm_name === filterAsm);
    if (filterVendor) data = data.filter((p) => p.vendor_name === filterVendor);
    if (filterDate) data = data.filter((p) => p.training_date === filterDate);

    if (filterDocStatus) {
      data = data.filter((p) => {
        const ktpVerif = getDocVerification(p.id, 'ktp').status;
        const kkVerif = getDocVerification(p.id, 'kk').status;
        const fotoVerif = getDocVerification(p.id, 'foto').status;
        const ijazahVerif = getDocVerification(p.id, 'ijazah').status;

        const isComplete =
          p.documents?.ktp?.available &&
          p.documents?.kk?.available &&
          p.documents?.foto?.available &&
          p.documents?.ijazah?.available &&
          ktpVerif === 'verified' &&
          kkVerif === 'verified' &&
          fotoVerif === 'verified' &&
          ijazahVerif === 'verified';

        return filterDocStatus === 'complete' ? isComplete : !isComplete;
      });
    }

    // Sort
    data.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return data;
  }, [
    participants,
    searchQuery,
    filterCity,
    filterAsm,
    filterVendor,
    filterDate,
    filterDocStatus,
    sortField,
    sortDirection,
    getDocVerification,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / DEFAULT_PAGE_SIZE) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * DEFAULT_PAGE_SIZE,
    currentPage * DEFAULT_PAGE_SIZE
  );

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilterCity('');
    setFilterAsm('');
    setFilterVendor('');
    setFilterDate('');
    setFilterDocStatus('');
    setCurrentPage(1);
  };

  const hasActiveFilters = Boolean(
    searchQuery || filterCity || filterAsm || filterVendor || filterDate || filterDocStatus
  );

  const SortableHeader = ({ field, label, className = '' }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer select-none hover:text-neutral-700 transition-colors ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          size={13}
          className={sortField === field ? 'text-mr-purple' : 'text-neutral-300'}
        />
      </div>
    </th>
  );

  if (!hasData) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Data Peserta</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Daftar seluruh calon Account Executive (AE) dari file pendaftaran
          </p>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-12 text-center shadow-[var(--shadow-card)] space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mr-purple-50 text-mr-purple">
            <FileSpreadsheet size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-neutral-900">Tabel Masih Kosong</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Belum ada file data pendaftaran yang diunggah. Silakan upload spreadsheet peserta untuk melihat dan mengelola data.
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
          <h1 className="text-2xl font-bold text-neutral-900">Data Peserta</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Kelola dan pantau {participants.length} data calon peserta AE Training
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleManualSync}
            disabled={isCloudSyncing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-mr-purple/30 bg-mr-purple/10 px-3 py-2 text-xs font-semibold text-mr-purple hover:bg-mr-purple/20 transition-colors disabled:opacity-50"
            title="Tarik data peserta terbaru dari Google Sheets"
          >
            <RefreshCw size={13} className={isCloudSyncing ? 'animate-spin' : ''} />
            {isCloudSyncing ? 'Menyinkronkan...' : 'Sinkronkan Google Sheets'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          >
            <Upload size={14} className="text-mr-purple" />
            Upload Berkas Baru
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div
          className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium animate-fade-in ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {syncFeedback.type === 'success' ? (
            <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={15} className="text-rose-600 shrink-0" />
          )}
          <span>{syncFeedback.message}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari berdasarkan nama peserta..."
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-mr-purple focus:bg-white focus:outline-none focus:ring-2 focus:ring-mr-purple/10 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 uppercase tracking-wide">
            <Filter size={14} /> Filter
          </div>

          <select
            value={filterCity}
            onChange={(e) => {
              setFilterCity(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 focus:border-mr-purple focus:outline-none"
          >
            <option value="">Semua Kota</option>
            {cityOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterAsm}
            onChange={(e) => {
              setFilterAsm(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 focus:border-mr-purple focus:outline-none"
          >
            <option value="">Semua ASM</option>
            {asmOptions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={filterVendor}
            onChange={(e) => {
              setFilterVendor(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 focus:border-mr-purple focus:outline-none"
          >
            <option value="">Semua Vendor</option>
            {vendorOptions.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>

          <select
            value={filterDate}
            onChange={(e) => {
              setFilterDate(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 focus:border-mr-purple focus:outline-none"
          >
            <option value="">Semua Tanggal Training</option>
            {dateOptions.map((d) => (
              <option key={d} value={d}>{formatDateShort(d)}</option>
            ))}
          </select>

          <select
            value={filterDocStatus}
            onChange={(e) => {
              setFilterDocStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-700 focus:border-mr-purple focus:outline-none"
          >
            <option value="">Semua Status Dokumen</option>
            <option value="complete">Lengkap & Terverifikasi</option>
            <option value="incomplete">Belum Lengkap / Pending</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-200 transition-colors"
            >
              <X size={13} /> Reset Filter
            </button>
          )}
        </div>

        <p className="text-xs text-neutral-400">
          Menampilkan {paginatedData.length} dari {filteredData.length} data peserta yang cocok
        </p>
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider w-12">
                  No
                </th>
                <SortableHeader field="full_name" label="Nama Peserta" />
                <SortableHeader field="placement_city" label="Kota" />
                <SortableHeader field="asm_name" label="ASM" />
                <SortableHeader field="vendor_name" label="Vendor" />
                <SortableHeader field="training_date" label="Tgl Training" />
                <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Status Dokumen
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider w-20">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-neutral-400">
                    Tidak ada peserta yang cocok dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                paginatedData.map((participant, idx) => {
                  const ktpVerif = getDocVerification(participant.id, 'ktp').status;
                  const kkVerif = getDocVerification(participant.id, 'kk').status;
                  const fotoVerif = getDocVerification(participant.id, 'foto').status;
                  const ijazahVerif = getDocVerification(participant.id, 'ijazah').status;

                  const isComplete =
                    participant.documents?.ktp?.available &&
                    participant.documents?.kk?.available &&
                    participant.documents?.foto?.available &&
                    participant.documents?.ijazah?.available &&
                    ktpVerif === 'verified' &&
                    kkVerif === 'verified' &&
                    fotoVerif === 'verified' &&
                    ijazahVerif === 'verified';

                  const rowNum = (currentPage - 1) * DEFAULT_PAGE_SIZE + idx + 1;

                  return (
                    <tr key={participant.id} className="table-row-hover">
                      <td className="px-4 py-3 text-sm text-neutral-500">{rowNum}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-neutral-900">
                          {participant.full_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {participant.placement_city}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {participant.asm_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {participant.vendor_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {formatDateShort(participant.training_date)}
                      </td>
                      <td className="px-4 py-3">
                        {isComplete ? (
                          <span className="inline-flex items-center rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-700 border border-success-100">
                            Lengkap
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-semibold text-warning-700 border border-warning-100">
                            Belum Lengkap
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          to={`/admin/participants/${participant.id}`}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-mr-purple transition-colors"
                          title="Lihat Detail Peserta"
                        >
                          <Eye size={16} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-3">
            <p className="text-xs text-neutral-500">
              Halaman {currentPage} dari {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-semibold transition-colors ${
                    page === currentPage
                      ? 'bg-mr-purple text-white'
                      : 'border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <FileUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
