import { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Info,
  HardDrive,
  Trash2,
  Cloud,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  KeyRound,
  FileSpreadsheet,
  Link,
  Save,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { APP_NAME } from '@/lib/constants';
import {
  getSheetsConfig,
  saveSheetsConfig,
  checkGoogleSheetsConnection,
} from '@/lib/googleSheetsService';

export default function Settings() {
  const { user } = useAuth();
  const { participants, meta, clearAllData, refreshFromGoogleSheets, isCloudSyncing } = useData();

  // Google Sheets Config state
  const [sheetsConfig, setSheetsConfig] = useState({
    endpointUrl: '',
    apiToken: '',
    targetSheetName: 'Form Responses 1',
    spreadsheetId: '',
  });

  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const current = getSheetsConfig();
    setSheetsConfig(current);
  }, []);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    saveSheetsConfig(sheetsConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionResult(null);

    // Simpan dulu config yang sedang diedit
    saveSheetsConfig(sheetsConfig);

    try {
      const res = await checkGoogleSheetsConnection(sheetsConfig);
      setConnectionResult(res);
      if (res.connected && res.spreadsheetId) {
        setSheetsConfig((prev) => ({
          ...prev,
          spreadsheetId: res.spreadsheetId,
        }));
      }
    } catch (err) {
      setConnectionResult({
        success: false,
        connected: false,
        error: err.message,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Pengaturan</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Konfigurasi integrasi Google Sheets, profil administrator, dan penyimpanan data
        </p>
      </div>

      {/* Konfigurasi Google Sheets Integration */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-mr-purple/10 text-mr-purple rounded-xl">
              <Cloud size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Integrasi Google Sheets & Apps Script</h2>
              <p className="text-xs text-neutral-500">
                Hubungkan dashboard dengan Google Spreadsheet utama AE Training 2026
              </p>
            </div>
          </div>

          {sheetsConfig.lastConnectedAt && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={13} /> Terkoneksi
            </span>
          )}
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Google Apps Script Web App URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Link size={15} className="absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="url"
                value={sheetsConfig.endpointUrl}
                onChange={(e) => setSheetsConfig({ ...sheetsConfig, endpointUrl: e.target.value })}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="w-full pl-10 pr-4 py-2.5 text-xs font-mono rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-mr-purple/30 focus:border-mr-purple"
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              URL deployment Web App Google Apps Script (Execute as: Me, Who has access: Anyone).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Nama Tab Sheet Utama <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <FileSpreadsheet size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                <input
                  type="text"
                  value={sheetsConfig.targetSheetName}
                  onChange={(e) => setSheetsConfig({ ...sheetsConfig, targetSheetName: e.target.value })}
                  placeholder="Form Responses 1"
                  className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-mr-purple/30 focus:border-mr-purple"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Tab default formulir pendaftaran peserta di spreadsheet utama.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                API Secret Token (Opsional)
              </label>
              <div className="relative">
                <KeyRound size={15} className="absolute left-3.5 top-3 text-neutral-400" />
                <input
                  type="text"
                  value={sheetsConfig.apiToken}
                  onChange={(e) => setSheetsConfig({ ...sheetsConfig, apiToken: e.target.value })}
                  placeholder="myrep-ae-training-2026-sec"
                  className="w-full pl-10 pr-4 py-2 text-xs font-mono rounded-lg border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-mr-purple/30 focus:border-mr-purple"
                />
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Harus cocok dengan API_SECRET_TOKEN di Script Properties Google Apps Script.
              </p>
            </div>
          </div>

          {/* Status Hasil Test Koneksi */}
          {connectionResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs animate-fade-in ${
                connectionResult.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {connectionResult.connected ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-bold">
                    {connectionResult.connected
                      ? 'Koneksi Berhasil!'
                      : 'Koneksi Google Sheets Gagal'}
                  </p>
                  <p className="text-[11px] opacity-90">
                    {connectionResult.connected
                      ? `Terhubung ke spreadsheet: "${connectionResult.spreadsheetName || 'Utama'}" (Tab: ${connectionResult.sheetName}, Total Baris: ${connectionResult.totalRows || 0})`
                      : connectionResult.error || 'Periksa kembali URL dan pastikan deployment sudah diatur Anyone.'}
                  </p>
                  {connectionResult.connected && connectionResult.spreadsheetId && (
                    <p className="text-[10px] font-mono text-emerald-700">
                      ID: {connectionResult.spreadsheetId}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection || !sheetsConfig.endpointUrl}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-mr-purple bg-mr-purple/10 border border-mr-purple/20 rounded-lg hover:bg-mr-purple/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={testingConnection ? 'animate-spin' : ''} />
                {testingConnection ? 'Memeriksa Koneksi...' : 'Uji Koneksi (Test)'}
              </button>

              {connectionResult?.connected && (
                <button
                  type="button"
                  onClick={() => refreshFromGoogleSheets()}
                  disabled={isCloudSyncing}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={13} className={isCloudSyncing ? 'animate-spin' : ''} />
                  {isCloudSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data Sekarang'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {saveSuccess && (
                <span className="text-xs font-semibold text-emerald-600 animate-fade-in flex items-center gap-1">
                  <CheckCircle2 size={13} /> Pengaturan Tersimpan
                </span>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-mr-purple rounded-lg hover:bg-mr-purple-dark transition-colors shadow-xs"
              >
                <Save size={14} />
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Profil Admin */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
          <div className="p-2.5 bg-neutral-100 rounded-xl text-neutral-700">
            <User size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Sesi Administrator</h2>
            <p className="text-xs text-neutral-500">Akun admin yang sedang aktif</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Email Pengguna
            </label>
            <div className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3.5 py-2.5 rounded-lg border border-neutral-200">
              {user?.email || 'admin@myrepublic.co.id'}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">
              Hak Akses
            </label>
            <div className="text-sm font-semibold text-neutral-900 bg-neutral-50 px-3.5 py-2.5 rounded-lg border border-neutral-200 flex items-center gap-1.5">
              <Shield size={14} className="text-mr-purple" />
              {user?.role || 'Administrator Internal'}
            </div>
          </div>
        </div>
      </div>

      {/* Penyimpanan Browser */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
          <div className="p-2.5 bg-neutral-100 rounded-xl text-neutral-700">
            <HardDrive size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Penyimpanan Browser (LocalStorage)</h2>
            <p className="text-xs text-neutral-500">Status data spreadsheet yang tersimpan pada perangkat ini</p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-neutral-600">
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-500">Sumber Data Aktif</span>
            <span className="font-semibold text-neutral-900">
              {meta?.source === 'google_sheets' ? 'Google Sheets (Live Sync)' : meta?.fileName || 'Belum ada file diunggah'}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-500">Total Peserta Tersimpan</span>
            <span className="font-semibold text-neutral-900">{participants.length} Peserta</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-500">Terakhir Diperbarui</span>
            <span className="font-semibold text-neutral-900">
              {meta?.uploadedAt ? new Date(meta.uploadedAt).toLocaleString('id-ID') : '-'}
            </span>
          </div>
        </div>

        {participants.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => {
                if (window.confirm('Hapus seluruh data peserta dan verifikasi dari penyimpanan browser?')) {
                  clearAllData();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <Trash2 size={14} />
              Reset & Bersihkan Data Lokal
            </button>
          </div>
        )}
      </div>

      {/* Informasi Sistem */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
          <div className="p-2.5 bg-neutral-100 rounded-xl text-neutral-700">
            <Info size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Informasi Aplikasi</h2>
            <p className="text-xs text-neutral-500">Arsitektur Hybrid Frontend & Google Sheets API</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-neutral-600">
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-500">Nama Aplikasi</span>
            <span className="font-semibold text-neutral-900">{APP_NAME}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-neutral-100">
            <span className="text-neutral-500">Arsitektur</span>
            <span className="font-semibold text-neutral-900">
              React + Vite + Google Apps Script Web App (CORS) + LocalStorage
            </span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-neutral-500">Sumber Data Utama</span>
            <span className="font-semibold text-neutral-900">
              Google Sheets (Two-way Read & Write via GAS Endpoint)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

