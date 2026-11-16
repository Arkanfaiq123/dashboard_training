import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  fetchParticipantsFromSheets,
  checkGoogleSheetsConnection,
  getSheetsConfig,
} from '@/lib/googleSheetsService';

const STORAGE_PARTICIPANTS_KEY = 'ae_training_2026_participants';
const STORAGE_META_KEY = 'ae_training_2026_metadata';
const STORAGE_VERIFICATIONS_KEY = 'ae_training_2026_verifications';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [participants, setParticipants] = useState([]);
  const [meta, setMeta] = useState(null); // { fileName, uploadedAt, totalRows, source: 'local' | 'google_sheets' }
  const [verifications, setVerifications] = useState({}); // { [participantId_docType]: { status, note, verifiedAt, verifiedBy } }
  const [loading, setLoading] = useState(true);

  // Status Google Sheets
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudStatus, setCloudStatus] = useState({
    configured: false,
    connected: false,
    lastChecked: null,
    error: null,
  });

  // 1. Inisialisasi awal dari localStorage (Data lokal tetap aman)
  useEffect(() => {
    try {
      const savedParticipants = localStorage.getItem(STORAGE_PARTICIPANTS_KEY);
      const savedMeta = localStorage.getItem(STORAGE_META_KEY);
      const savedVerifications = localStorage.getItem(STORAGE_VERIFICATIONS_KEY);

      if (savedParticipants) {
        setParticipants(JSON.parse(savedParticipants));
      }
      if (savedMeta) {
        setMeta(JSON.parse(savedMeta));
      }
      if (savedVerifications) {
        setVerifications(JSON.parse(savedVerifications));
      }
    } catch (err) {
      console.error('Error loading data from localStorage:', err);
    } finally {
      setLoading(false);
    }

    // Periksa status koneksi Google Sheets
    const cfg = getSheetsConfig();
    if (cfg.endpointUrl && cfg.endpointUrl.trim()) {
      setCloudStatus((prev) => ({ ...prev, configured: true }));
      checkGoogleSheetsConnection()
        .then((res) => {
          setCloudStatus({
            configured: true,
            connected: Boolean(res.connected),
            lastChecked: new Date().toISOString(),
            error: res.error || null,
          });
        })
        .catch(() => {});
    }
  }, []);

  // Update participant document verification (disimpan lokal agar verifikasi admin tidak hilang)
  const updateDocumentVerification = (participantId, docType, status, note = '', adminName = 'Admin') => {
    const key = `${participantId}_${docType}`;
    const newVerifications = {
      ...verifications,
      [key]: {
        status, // 'verified', 'needs_revision', 'pending_review'
        note,
        verifiedAt: new Date().toISOString(),
        verifiedBy: adminName,
      },
    };

    setVerifications(newVerifications);
    localStorage.setItem(STORAGE_VERIFICATIONS_KEY, JSON.stringify(newVerifications));
  };

  // Import parsed data dari Excel/CSV upload manual
  const importParticipantData = (importedList, fileInfo) => {
    const fullMeta = { ...fileInfo, source: 'local' };
    setParticipants(importedList);
    setMeta(fullMeta);

    localStorage.setItem(STORAGE_PARTICIPANTS_KEY, JSON.stringify(importedList));
    localStorage.setItem(STORAGE_META_KEY, JSON.stringify(fullMeta));
  };

  // Sync / Refresh data langsung dari Google Sheets utama
  const refreshFromGoogleSheets = useCallback(async () => {
    setIsCloudSyncing(true);
    try {
      const res = await fetchParticipantsFromSheets();
      if (!res.success) {
        throw new Error(res.error || 'Gagal mengambil data dari Google Sheets.');
      }

      // Transform data mentah dari Google Sheets menjadi struktur peserta standar
      const transformed = (res.participants || []).map((raw, idx) => {
        // Cari kolom secara fleksibel
        const findVal = (keywords) => {
          for (const key of Object.keys(raw)) {
            const lower = key.toLowerCase();
            if (keywords.some((kw) => lower.includes(kw))) {
              return raw[key];
            }
          }
          return '';
        };

        const id = `GS-${String(idx + 1).padStart(4, '0')}`;
        const fullName = findVal(['nama lengkap', 'nama peserta', 'nama']) || `Peserta ${idx + 1}`;
        const city = findVal(['kota', 'penempatan']) || 'Purwokerto';
        const nik = findVal(['nik']);
        const trainingDate = findVal(['tanggal training', 'tgl training', 'training']) || '2026-01-15';
        const asm = findVal(['asm']) || 'Tanpa ASM';
        const vendor = findVal(['vendor']) || 'Tanpa Vendor';
        const phone = findVal(['wa', 'whatsapp', 'telepon', 'hp']);
        const email = findVal(['email']);
        const timestamp = findVal(['timestamp', 'waktu']) || new Date().toISOString();

        // Dokumen
        const docKtp = findVal(['ktp']);
        const docKk = findVal(['kk', 'kartu keluarga']);
        const docFoto = findVal(['foto']);
        const docIjazah = findVal(['ijazah']);

        const parseDoc = (urlVal) => ({
          available: Boolean(urlVal && String(urlVal).trim().startsWith('http')),
          url: urlVal ? String(urlVal).trim() : null,
        });

        return {
          id,
          rowNumber: raw._rowNumber || idx + 2,
          full_name: fullName,
          nik: nik,
          birth_date: findVal(['lahir']),
          placement_city: city,
          asm_name: asm,
          vendor_name: vendor,
          phone_number: phone,
          email: email,
          address: findVal(['alamat', 'domisili']),
          education: findVal(['pendidikan']) || 'SMA/SMK',
          marital_status: findVal(['kawin', 'nikah']) || 'Belum Menikah',
          vaccination_status: findVal(['vaksin']) || 'Lengkap',
          training_date: trainingDate,
          registered_at: timestamp,
          documents: {
            ktp: parseDoc(docKtp),
            kk: parseDoc(docKk),
            foto: parseDoc(docFoto),
            ijazah: parseDoc(docIjazah),
          },
        };
      });

      const sheetsMeta = {
        fileName: 'Google Sheets (Live Sync)',
        sheetName: getSheetsConfig().targetSheetName,
        totalRows: transformed.length,
        uploadedAt: new Date().toISOString(),
        source: 'google_sheets',
      };

      setParticipants(transformed);
      setMeta(sheetsMeta);

      // Simpan backup ke localStorage agar offline tetap bisa dibaca
      localStorage.setItem(STORAGE_PARTICIPANTS_KEY, JSON.stringify(transformed));
      localStorage.setItem(STORAGE_META_KEY, JSON.stringify(sheetsMeta));

      setCloudStatus((prev) => ({
        ...prev,
        connected: true,
        lastChecked: new Date().toISOString(),
        error: null,
      }));

      return { success: true, count: transformed.length };
    } catch (err) {
      setCloudStatus((prev) => ({
        ...prev,
        error: err.message,
      }));
      return { success: false, error: err.message };
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  // Clear data
  const clearAllData = () => {
    localStorage.removeItem(STORAGE_PARTICIPANTS_KEY);
    localStorage.removeItem(STORAGE_META_KEY);
    localStorage.removeItem(STORAGE_VERIFICATIONS_KEY);
    setParticipants([]);
    setMeta(null);
    setVerifications({});
  };

  // Helper untuk mendapatkan status verifikasi dokumen peserta
  const getDocVerification = (participantId, docType, defaultStatus = 'pending_review') => {
    const key = `${participantId}_${docType}`;
    return (
      verifications[key] || {
        status: defaultStatus,
        note: '',
        verifiedAt: null,
        verifiedBy: null,
      }
    );
  };

  // Computed Statistics
  const statistics = useMemo(() => {
    if (!participants || participants.length === 0) {
      return null;
    }

    const total = participants.length;
    let docsComplete = 0;
    let docsIncomplete = 0;

    const cityMap = {};
    const vendorMap = {};
    const asmMap = {};
    const dateMap = {};

    participants.forEach((p) => {
      const ktpVerif = getDocVerification(p.id, 'ktp').status;
      const kkVerif = getDocVerification(p.id, 'kk').status;
      const fotoVerif = getDocVerification(p.id, 'foto').status;
      const ijazahVerif = getDocVerification(p.id, 'ijazah').status;

      const hasAllFiles =
        p.documents?.ktp?.available &&
        p.documents?.kk?.available &&
        p.documents?.foto?.available &&
        p.documents?.ijazah?.available;

      const isAllVerified =
        ktpVerif === 'verified' &&
        kkVerif === 'verified' &&
        fotoVerif === 'verified' &&
        ijazahVerif === 'verified';

      if (hasAllFiles && isAllVerified) {
        docsComplete++;
      } else {
        docsIncomplete++;
      }

      const city = p.placement_city || 'Lainnya';
      cityMap[city] = (cityMap[city] || 0) + 1;

      const vendor = p.vendor_name || 'Tanpa Vendor';
      vendorMap[vendor] = (vendorMap[vendor] || 0) + 1;

      const asm = p.asm_name || 'Tanpa ASM';
      asmMap[asm] = (asmMap[asm] || 0) + 1;

      if (p.registered_at) {
        const d = p.registered_at.split('T')[0] || p.registered_at.split(' ')[0];
        dateMap[d] = (dateMap[d] || 0) + 1;
      }
    });

    const byCity = Object.entries(cityMap).map(([name, count]) => ({ name, count }));
    const byVendor = Object.entries(vendorMap).map(([name, count]) => ({ name, count }));
    const byAsm = Object.entries(asmMap).map(([name, count]) => ({ name, count }));
    const byDate = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      total,
      docsComplete,
      docsIncomplete,
      uniqueVendors: Object.keys(vendorMap).length,
      uniqueAsm: Object.keys(asmMap).length,
      byCity,
      byVendor,
      byAsm,
      byDate,
    };
  }, [participants, verifications]);

  return (
    <DataContext.Provider
      value={{
        participants,
        meta,
        loading,
        statistics,
        verifications,
        cloudStatus,
        isCloudSyncing,
        refreshFromGoogleSheets,
        getDocVerification,
        updateDocumentVerification,
        importParticipantData,
        clearAllData,
        hasData: participants.length > 0,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
