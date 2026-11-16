# PANDUAN INTEGRASI GOOGLE SHEETS & GOOGLE APPS SCRIPT
## AE TRAINING DASHBOARD 2026 — MYREPUBLIC INDONESIA

Dokumen ini menjelaskan langkah-langkah menghubungkan website React AE Training Dashboard 2026 dengan Google Spreadsheet utama menggunakan Google Apps Script (GAS) Web App Endpoint.

---

### ARSITEKTUR KONEKSI

```
[Google Form Absensi]
        │
        ▼ (Download respons XLSX/CSV)
[AE Training Dashboard (React UI)]
        │
        ├── 1. Parsing & Validasi Lokal (NIK, Kolom, Response ID)
        ├── 2. Cek Duplikasi (Deduplikasi berbasis ID Respons, BUKAN NIK)
        ▼
[Google Apps Script Web App Endpoint]
   (doGet: Ambil Data Peserta & Cek Koneksi)
   (doPost: Tambah Baris Baru & Catat Log)
        │
        ├── [Tab Form Responses 1] -> Tambah baris baru tanpa menimpa data lama
        └── [Tab IMPORT_LOG]       -> Catat ID, timestamp, dan status eksekusi
```

---

### LANGKAH 1 — BUKA SPREADSHEET UTAMA & SCRIPT EDITOR

1. Buka Google Spreadsheet pendaftaran & absensi AE Training yang sudah ada di Google Drive Anda.
2. Pada menu atas, klik **Extensions** (Ekstensi) > **Apps Script**.
3. Beri nama project Apps Script, misalnya: `AE Training 2026 Backend`.

---

### LANGKAH 2 — SALIN KODE GOOGLE APPS SCRIPT

1. Buka file [`google-apps-script/Code.gs`](file:///d:/MyRepublic/training-ae/google-apps-script/Code.gs) pada repository project ini.
2. Hapus seluruh isi default pada editor Apps Script, lalu tempel (paste) seluruh kode dari `Code.gs`.
3. Klik ikon simpan (Save / Ctrl+S).

---

### LANGKAH 3 — ATUR SCRIPT PROPERTIES (AMAN & FLEKSIBEL)

Agar kode tidak mengekspos ID rahasia:
1. Di bilah menu kiri Google Apps Script, klik ikon gerigi **Project Settings** (Setelan Project).
2. Gulir ke bawah ke bagian **Script Properties** (Properti Skrip).
3. Klik **Add script property** dan masukkan:

| Property Name | Contoh Nilai | Deskripsi |
|---|---|---|
| `SPREADSHEET_ID` | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` | ID Spreadsheet utama Anda (dapat diambil dari URL spreadsheet di antara `/d/` dan `/edit`). |
| `TARGET_SHEET_NAME` | `Form Responses 1` | Nama sheet/tab utama tempat data pendaftaran & kehadiran berada. |
| `API_SECRET_TOKEN` | `myrep-ae-training-2026-sec` | Token pengaman request (opsional, sesuaikan dengan token yang Anda inginkan). |

4. Klik **Save script properties**.

---

### LANGKAH 4 — DEPLOY SEBAGAI WEB APP

1. Di pojok kanan atas editor Apps Script, klik tombol biru **Deploy** > **New deployment**.
2. Klik ikon gerigi di sebelah kiri **Select type** dan pilih **Web app**.
3. Isi parameter deployment berikut:
   - **Description**: `AE Training 2026 Production Endpoint v1`
   - **Execute as**: **Me (email Anda@...)** *(Sangat penting agar script memiliki izin menulis ke spreadsheet)*
   - **Who has access**: **Anyone** *(Sangat penting agar website frontend dapat memanggil endpoint tanpa login akun Google)*
4. Klik **Deploy**.
5. Jika muncul permintaan izin (*Authorization required*):
   - Klik **Authorize access**.
   - Pilih akun Google Anda.
   - Jika muncul peringatan *"Google hasn't verified this app"*, klik **Advanced**, lalu klik **Go to AE Training 2026 Backend (unsafe)**.
   - Klik **Allow**.
6. Salin **Web app URL** yang dihasilkan (formatnya: `https://script.google.com/macros/s/AKfycb.../exec`).

---

### LANGKAH 5 — HUBUNGKAN KE DASHBOARD AE TRAINING

1. Buka dashboard AE Training pada peramban Anda.
2. Masuk ke halaman **Pengaturan** (`/admin/settings`).
3. Pada kartu **Integrasi Google Sheets & Apps Script**:
   - Tempel **Web app URL** yang telah disalin.
   - Pastikan **Nama Tab Sheet Utama** sesuai (misalnya: `Form Responses 1`).
   - Masukkan **API Secret Token** yang cocok dengan Script Properties Anda.
4. Klik tombol **Uji Koneksi (Test)**.
   - Sistem akan memanggil endpoint `action=checkConnection`.
   - Jika berhasil, akan muncul indikator hijau: *"Koneksi Berhasil! Terhubung ke spreadsheet..."*.
5. Klik **Simpan Pengaturan**.

---

### FITUR DUA ARAH (READ & WRITE)

#### 1. Membaca Data Peserta (READ)
- Buka menu **Overview Dashboard** atau **Data Peserta**.
- Klik tombol **Tarik dari Google Sheets** / **Sinkronkan Google Sheets**.
- Data peserta lama akan ditarik dari spreadsheet utama tanpa menghapus status verifikasi lokal yang pernah dibuat admin.

#### 2. Menulis Respons Absensi Baru (WRITE)
- Buka menu **Import Absensi** (`/admin/attendance-import`).
- Unggah file respons Google Form (.xlsx atau .csv).
- Sistem memvalidasi data dan mendeteksi duplikat:
  - NIK yang sama pada **tanggal training berbeda** tetap diizinkan.
  - Baris dengan kombinasi waktu, nama, NIK, dan tanggal yang identik akan ditandai *Pernah Diimpor*.
- Klik **Proses Import**.
- Baris valid akan dikirim ke Google Apps Script dan **ditambahkan sebagai baris baru di bawah baris terakhir** spreadsheet utama tanpa mengubah struktur kolom atau menghapus data lama.
- Riwayat import secara otomatis dicatat pada tab sheet `IMPORT_LOG`.

---

### TABEL LOG OTOMATIS: `IMPORT_LOG`
Google Apps Script secara otomatis membuat tab `IMPORT_LOG` jika belum ada dengan struktur kolom:
1. `Timestamp`
2. `Response ID`
3. `File Name`
4. `Status`
5. `Error Message`

Ini memastikan proses import bersifat idempoten (tidak akan ada respons ganda yang masuk meskipun diunggah berulang kali).

