import { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Users,
  FileCheck,
  FileX,
  Building2,
  TrendingUp,
  Upload,
  FileSpreadsheet,
  Trash2,
  Calendar,
  AlertCircle,
  Database,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { formatNumber, formatDate } from '@/lib/formatters';
import FileUploadModal from '@/components/FileUploadModal';

// Brand MyRepublic Chart Colors
const CHART_COLORS = ['#542080', '#7541A5', '#9E5CD8', '#C498EC', '#351052', '#22C55E'];
const DONUT_COLORS = ['#542080', '#7541A5', '#9E5CD8', '#C498EC', '#DCBFF5', '#EEDBFA'];

function StatCard({ icon: Icon, label, value, iconBg, iconColor, trend, gradient }) {
  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-xs hover:shadow-[var(--shadow-card-hover)] transition-all hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-neutral-500 mb-1">{label}</p>
          <p className="text-3xl font-black text-neutral-900 tracking-tight">
            {formatNumber(value)}
          </p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBg} shadow-2xs`}>
          <Icon size={22} className={iconColor} />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-neutral-500 font-medium">
          <TrendingUp size={14} className="text-emerald-500" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}

function ChartCard({ title, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs ${className}`}>
      <h3 className="text-sm font-bold text-neutral-800 mb-5 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-mr-purple" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-neutral-200/80 bg-white px-3.5 py-2.5 shadow-[var(--shadow-dropdown)] text-xs">
      <p className="font-bold text-neutral-800 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} style={{ color: entry.color }} className="text-xs font-medium">
          {entry.name}: <span className="font-bold">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardOverview() {
  const { statistics, meta, hasData, clearAllData, refreshFromGoogleSheets, isCloudSyncing } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  const handleManualSync = async () => {
    setSyncFeedback(null);
    const result = await refreshFromGoogleSheets();
    if (result.success) {
      setSyncFeedback({ type: 'success', message: `Berhasil sinkronisasi ${result.count} peserta dari Google Sheets!` });
    } else {
      setSyncFeedback({ type: 'error', message: result.error || 'Gagal sinkronisasi data dari Google Sheets.' });
    }
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight flex items-center gap-2">
            Overview Dashboard
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Monitoring pendaftaran & verifikasi dokumen calon peserta AE Training 2026
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol Sinkronisasi Google Sheets */}
          <button
            onClick={handleManualSync}
            disabled={isCloudSyncing}
            className="inline-flex items-center gap-2 rounded-xl border border-mr-purple/30 bg-mr-purple/10 px-4 py-2.5 text-xs font-bold text-mr-purple hover:bg-mr-purple/20 transition-all active:scale-95 disabled:opacity-50"
            title="Tarik data terbaru langsung dari Google Sheets utama"
          >
            <RefreshCw size={14} className={isCloudSyncing ? 'animate-spin' : ''} />
            <span>{isCloudSyncing ? 'Menyinkronkan...' : 'Tarik dari Google Sheets'}</span>
          </button>

          {hasData && (
            <button
              onClick={() => {
                if (window.confirm('Yakin ingin menghapus data yang tersimpan di browser ini?')) {
                  clearAllData();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-neutral-600 hover:bg-rose-50 hover:text-rose-600 transition-colors shadow-2xs"
            >
              <Trash2 size={14} />
              <span>Hapus Data</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-mr-purple to-mr-purple-light px-4.5 py-2.5 text-xs font-bold text-white shadow-[var(--shadow-purple-sm)] hover:opacity-95 hover:shadow-[var(--shadow-purple)] transition-all active:scale-95"
          >
            <Upload size={14} />
            <span>{hasData ? 'Upload Ulang Spreadsheet' : 'Upload Spreadsheet Peserta'}</span>
          </button>
        </div>
      </div>

      {/* Sync Feedback Message */}
      {syncFeedback && (
        <div
          className={`flex items-center gap-2.5 p-3.5 rounded-2xl border text-xs font-medium animate-fade-in shadow-2xs ${
            syncFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {syncFeedback.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{syncFeedback.message}</span>
        </div>
      )}

      {/* Upload Info Banner if data exists */}
      {hasData && meta && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-neutral-200/80 bg-white px-4.5 py-3 text-xs text-neutral-700 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={16} />
            </div>
            <span>
              Sumber data: <strong className="text-neutral-900">{meta.fileName}</strong> ({meta.totalRows} peserta)
            </span>
            <span className="text-neutral-300">•</span>
            <span className="text-neutral-500">
              Diperbarui: {new Date(meta.uploadedAt).toLocaleString('id-ID')}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-mr-purple bg-mr-purple/10 px-3 py-1.5 rounded-xl border border-mr-purple/20 flex items-center gap-2 self-start sm:self-auto">
            <span className={`h-2 w-2 rounded-full ${meta.source === 'google_sheets' ? 'bg-emerald-500' : 'bg-mr-purple'} animate-pulse`} />
            {meta.source === 'google_sheets' ? 'Live Cloud Sync (Google Sheets)' : 'Upload Berkas Lokal'}
          </span>
        </div>
      )}

      {/* EMPTY STATE IF NO DATA */}
      {!hasData ? (
        <div className="rounded-3xl border-2 border-dashed border-mr-purple/20 bg-gradient-to-b from-white to-[#FAF7FC] p-12 text-center shadow-xs space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-mr-purple/10 text-mr-purple shadow-inner">
            <FileSpreadsheet size={32} />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-lg font-bold text-neutral-900">
              Belum Ada Data Pendaftaran
            </h2>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Statistik dan grafik pendaftaran akan otomatis terisi setelah Anda mengunggah file spreadsheet peserta atau menekan tombol tarik data dari Google Sheets.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-mr-purple to-mr-purple-light px-5 py-3 text-xs font-bold text-white shadow-[var(--shadow-purple-sm)] hover:opacity-95 transition-all"
            >
              <Upload size={15} />
              Pilih & Upload File Sekarang
            </button>
            <button
              onClick={handleManualSync}
              className="inline-flex items-center gap-2 rounded-xl border border-mr-purple/30 bg-white px-4 py-3 text-xs font-bold text-mr-purple hover:bg-mr-purple/5 transition-all"
            >
              <RefreshCw size={14} />
              Tarik dari Google Sheets
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* STAT CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Users}
              label="Total Peserta Terdaftar"
              value={statistics.total}
              iconBg="bg-mr-purple/10"
              iconColor="text-mr-purple"
              trend="Data dari spreadsheet aktif"
            />
            <StatCard
              icon={FileCheck}
              label="Dokumen Lengkap"
              value={statistics.docsComplete}
              iconBg="bg-emerald-50"
              iconColor="text-emerald-600"
            />
            <StatCard
              icon={FileX}
              label="Dokumen Belum Lengkap"
              value={statistics.docsIncomplete}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
            <StatCard
              icon={Building2}
              label="Total Vendor Mitra"
              value={statistics.uniqueVendors}
              iconBg="bg-indigo-50"
              iconColor="text-indigo-600"
            />
          </div>

          {/* CHARTS ROW 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <ChartCard title="Tren Pendaftaran Peserta Harian" className="lg:col-span-2">
              <div className="h-72">
                {statistics.byDate.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={statistics.byDate}>
                      <defs>
                        <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#542080" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7541A5" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EBF5" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="Pendaftar" stroke="#542080" strokeWidth={2.5} fill="url(#purpleGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                    Tidak ada timestamp tanggal pada file
                  </div>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Distribusi per Kota Penempatan">
              <div className="h-72">
                {statistics.byCity.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.byCity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EBF5" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Peserta" radius={[8, 8, 0, 0]}>
                        {statistics.byCity.map((_, idx) => (
                          <Cell key={`city-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                    Tidak ada data kota
                  </div>
                )}
              </div>
            </ChartCard>
          </div>

          {/* CHARTS ROW 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Distribusi Peserta Berdasarkan Area Sales Manager (ASM)">
              <div className="h-64">
                {statistics.byAsm.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statistics.byAsm} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EBF5" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#78716C' }} tickLine={false} axisLine={false} width={130} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Peserta" radius={[0, 8, 8, 0]}>
                        {statistics.byAsm.map((_, idx) => (
                          <Cell key={`asm-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-neutral-400">
                    Tidak ada data ASM
                  </div>
                )}
              </div>
            </ChartCard>

            <ChartCard title="Pangsa Partisipasi Vendor Rekrutmen">
              <div className="h-64 flex flex-col items-center justify-center">
                {statistics.byVendor.length > 0 ? (
                  <>
                    <div className="w-full h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statistics.byVendor}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            paddingAngle={4}
                            dataKey="count"
                            nameKey="name"
                            strokeWidth={0}
                          >
                            {statistics.byVendor.map((_, idx) => (
                              <Cell key={`vendor-${idx}`} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
                      {statistics.byVendor.map((v, idx) => (
                        <div key={v.name} className="flex items-center gap-1.5 text-xs text-neutral-600 font-medium">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                          />
                          {v.name} ({v.count})
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-neutral-400">Tidak ada data vendor</div>
                )}
              </div>
            </ChartCard>
          </div>

          {/* DOKUMEN PROGRESS */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs">
            <h3 className="text-sm font-bold text-neutral-800 mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Progress Kelengkapan Berkas Dokumen Peserta
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
                <span>Total Peserta Memiliki 4 Dokumen Lengkap (KTP, KK, Foto, Ijazah)</span>
                <span className="font-bold text-mr-purple">
                  {statistics.docsComplete} dari {statistics.total} peserta ({((statistics.docsComplete / (statistics.total || 1)) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-neutral-100 overflow-hidden p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-mr-purple to-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${(statistics.docsComplete / (statistics.total || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* File Upload Modal */}
      <FileUploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
