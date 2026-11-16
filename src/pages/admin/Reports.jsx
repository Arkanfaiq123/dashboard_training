import { useState, useMemo } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Building2,
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  FileCheck,
  AlertCircle,
  Upload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useData } from '@/contexts/DataContext';
import { formatNumber, formatDate } from '@/lib/formatters';
import FileUploadModal from '@/components/FileUploadModal';

const TABS = [
  { id: 'city', label: 'Per Kota', icon: MapPin },
  { id: 'vendor', label: 'Per Vendor', icon: Building2 },
  { id: 'asm', label: 'Per ASM', icon: Users },
  { id: 'training_date', label: 'Per Tanggal Training', icon: Calendar },
  { id: 'documents', label: 'Kelengkapan Dokumen', icon: FileCheck },
];

export default function Reports() {
  const { participants, statistics, hasData, getDocVerification } = useData();
  const [activeTab, setActiveTab] = useState('city');
  const [notice, setNotice] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Grouping by training date
  const byTrainingDate = useMemo(() => {
    const map = {};
    participants.forEach((p) => {
      const d = p.training_date || 'Belum Dijadwalkan';
      map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }, [participants]);

  // Handle Excel Export
  const handleExportExcel = () => {
    if (!hasData) return;
    setExporting(true);

    try {
      const exportRows = participants.map((p, index) => {
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

        return {
          No: index + 1,
          'Nama Lengkap': p.full_name,
          'Kota Penempatan': p.placement_city,
          'Nama ASM': p.asm_name || '-',
          'Nama Vendor': p.vendor_name || '-',
          'Tanggal Training': p.training_date || '-',
          'Waktu Pendaftaran': p.registered_at || '-',
          'Pendidikan': p.education || '-',
          'Status Dokumen': isComplete ? 'LENGKAP' : 'BELUM LENGKAP',
          'KTP (Verifikasi)': ktpVerif,
          'KK (Verifikasi)': kkVerif,
          'Foto (Verifikasi)': fotoVerif,
          'Ijazah (Verifikasi)': ijazahVerif,
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Peserta AE');

      // Auto width
      worksheet['!cols'] = Array(12).fill({ wch: 22 });

      XLSX.writeFile(workbook, `Rekap_AE_Training_${new Date().toISOString().split('T')[0]}.xlsx`);

      setNotice({
        type: 'success',
        text: `Berhasil mengunduh rekap Excel (${exportRows.length} peserta).`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        text: `Gagal membuat Excel: ${err.message}`,
      });
    } finally {
      setExporting(false);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  // Handle PDF Export
  const handleExportPDF = () => {
    if (!hasData) return;
    setExporting(true);

    try {
      const doc = new jsPDF();

      // Title & Header
      doc.setFontSize(16);
      doc.setTextColor(84, 32, 128); // MyRepublic Deep Purple (#542080)
      doc.text('MyRepublic - AE Training 2026', 14, 20);

      doc.setFontSize(11);
      doc.setTextColor(40, 40, 40);
      doc.text('Laporan Rekapitulasi Calon Peserta Account Executive', 14, 27);

      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(
        `Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')} | Total Peserta: ${participants.length}`,
        14,
        33
      );

      const headers = [['No', 'Nama Peserta', 'Kota', 'ASM', 'Vendor', 'Tgl Training', 'Dokumen']];

      const rows = participants.map((p, index) => {
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

        return [
          index + 1,
          p.full_name,
          p.placement_city,
          p.asm_name || '-',
          p.vendor_name || '-',
          p.training_date || '-',
          isComplete ? 'Lengkap' : 'Kurang',
        ];
      });

      doc.autoTable({
        head: headers,
        body: rows,
        startY: 38,
        theme: 'grid',
        headStyles: { fillColor: [84, 32, 128], textColor: [255, 255, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
      });

      doc.save(`Laporan_AE_Training_${new Date().toISOString().split('T')[0]}.pdf`);

      setNotice({
        type: 'success',
        text: `Berhasil mengunduh dokumen PDF (${participants.length} peserta).`,
      });
    } catch (err) {
      setNotice({
        type: 'error',
        text: `Gagal membuat PDF: ${err.message}`,
      });
    } finally {
      setExporting(false);
      setTimeout(() => setNotice(null), 5000);
    }
  };

  if (!hasData) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Laporan & Rekapitulasi</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Rekap pendaftaran peserta per kota, vendor, ASM, dan status dokumen
          </p>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-12 text-center shadow-[var(--shadow-card)] space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mr-purple-50 text-mr-purple">
            <FileSpreadsheet size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-neutral-900">Belum Ada Data Rekapitulasi</h2>
            <p className="text-sm text-neutral-500 mt-1">
              Silakan unggah spreadsheet pendaftaran terlebih dahulu untuk melihat rekapitulasi data dan mengunduh berkas laporan.
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

  const total = statistics?.total || participants.length;

  return (
    <div className="space-y-6 animate-fade-in">
      {notice && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold border animate-fade-in ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-error-50 border-error-200 text-error-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle size={16} className="text-emerald-600" />
          ) : (
            <AlertCircle size={16} className="text-error-600" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* Header and Export actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Laporan & Rekapitulasi</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Ringkasan data {total} calon peserta dari file spreadsheet yang diunggah
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            {exporting ? 'Mengolah...' : 'Export Excel (.xlsx)'}
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-neutral-700 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors shadow-xs"
          >
            <FileText size={15} className="text-rose-600" />
            {exporting ? 'Mengolah...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-neutral-200 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
                isActive
                  ? 'border-mr-purple text-mr-purple bg-white'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
              }`}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Tables */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden">
        {activeTab === 'city' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Kota Penempatan</th>
                <th className="px-6 py-3 font-semibold text-right">Jumlah Peserta</th>
                <th className="px-6 py-3 font-semibold text-right">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {statistics?.byCity.map((item) => (
                <tr key={item.name} className="hover:bg-neutral-50/50">
                  <td className="px-6 py-3.5 font-semibold text-neutral-900">{item.name}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-neutral-900">{formatNumber(item.count)}</td>
                  <td className="px-6 py-3.5 text-right text-neutral-500">
                    {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-neutral-50/80 font-bold text-neutral-900">
              <tr>
                <td className="px-6 py-3">Total Seluruh Kota</td>
                <td className="px-6 py-3 text-right">{formatNumber(total)}</td>
                <td className="px-6 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        )}

        {activeTab === 'vendor' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Nama Vendor Perekrut</th>
                <th className="px-6 py-3 font-semibold text-right">Jumlah Peserta</th>
                <th className="px-6 py-3 font-semibold text-right">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {statistics?.byVendor.map((item) => (
                <tr key={item.name} className="hover:bg-neutral-50/50">
                  <td className="px-6 py-3.5 font-semibold text-neutral-900">{item.name}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-neutral-900">{formatNumber(item.count)}</td>
                  <td className="px-6 py-3.5 text-right text-neutral-500">
                    {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-neutral-50/80 font-bold text-neutral-900">
              <tr>
                <td className="px-6 py-3">Total Seluruh Vendor</td>
                <td className="px-6 py-3 text-right">{formatNumber(total)}</td>
                <td className="px-6 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        )}

        {activeTab === 'asm' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Area Sales Manager (ASM)</th>
                <th className="px-6 py-3 font-semibold text-right">Jumlah Peserta</th>
                <th className="px-6 py-3 font-semibold text-right">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {statistics?.byAsm.map((item) => (
                <tr key={item.name} className="hover:bg-neutral-50/50">
                  <td className="px-6 py-3.5 font-semibold text-neutral-900">{item.name}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-neutral-900">{formatNumber(item.count)}</td>
                  <td className="px-6 py-3.5 text-right text-neutral-500">
                    {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-neutral-50/80 font-bold text-neutral-900">
              <tr>
                <td className="px-6 py-3">Total Seluruh ASM</td>
                <td className="px-6 py-3 text-right">{formatNumber(total)}</td>
                <td className="px-6 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        )}

        {activeTab === 'training_date' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Tanggal Training</th>
                <th className="px-6 py-3 font-semibold text-right">Jumlah Peserta</th>
                <th className="px-6 py-3 font-semibold text-right">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {byTrainingDate.map((item) => (
                <tr key={item.date} className="hover:bg-neutral-50/50">
                  <td className="px-6 py-3.5 font-semibold text-neutral-900">{formatDate(item.date)}</td>
                  <td className="px-6 py-3.5 text-right font-bold text-neutral-900">{formatNumber(item.count)}</td>
                  <td className="px-6 py-3.5 text-right text-neutral-500">
                    {total > 0 ? ((item.count / total) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-neutral-50/80 font-bold text-neutral-900">
              <tr>
                <td className="px-6 py-3">Total Peserta</td>
                <td className="px-6 py-3 text-right">{formatNumber(total)}</td>
                <td className="px-6 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        )}

        {activeTab === 'documents' && (
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase text-neutral-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Status Kelengkapan Dokumen</th>
                <th className="px-6 py-3 font-semibold text-right">Jumlah Peserta</th>
                <th className="px-6 py-3 font-semibold text-right">Persentase</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              <tr className="hover:bg-neutral-50/50">
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle size={12} /> Lengkap (4 Dokumen Terverifikasi Lolos)
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right font-bold text-neutral-900">
                  {formatNumber(statistics?.docsComplete || 0)}
                </td>
                <td className="px-6 py-3.5 text-right text-neutral-500">
                  {total > 0 ? (((statistics?.docsComplete || 0) / total) * 100).toFixed(1) : 0}%
                </td>
              </tr>
              <tr className="hover:bg-neutral-50/50">
                <td className="px-6 py-3.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertCircle size={12} /> Belum Lengkap / Menunggu Review
                  </span>
                </td>
                <td className="px-6 py-3.5 text-right font-bold text-neutral-900">
                  {formatNumber(statistics?.docsIncomplete || 0)}
                </td>
                <td className="px-6 py-3.5 text-right text-neutral-500">
                  {total > 0 ? (((statistics?.docsIncomplete || 0) / total) * 100).toFixed(1) : 0}%
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-neutral-50/80 font-bold text-neutral-900">
              <tr>
                <td className="px-6 py-3">Total Seluruh Peserta</td>
                <td className="px-6 py-3 text-right">{formatNumber(total)}</td>
                <td className="px-6 py-3 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      <FileUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
