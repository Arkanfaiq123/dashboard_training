# PANDUAN PENGGUNAAN AE TRAINING DASHBOARD 2026
## Arsitektur Frontend Sederhana (Client-Side & LocalStorage)

Aplikasi **AE Training Dashboard 2026** kini telah disederhanakan menjadi aplikasi **Pure Frontend** tanpa backend, tanpa Supabase, tanpa API eksternal, dan tanpa database server. Seluruh data diproses langsung di browser Anda dan disimpan secara lokal pada `localStorage`.

---

### Cara Menggunakan Dashboard:

1. **Buka Aplikasi**:
   Jalankan server lokal dengan perintah:
   ```bash
   npm run dev
   ```
   Lalu buka tautan `http://localhost:5173` di browser Anda.

2. **Halaman Publik (`/`)**:
   - Menampilkan informasi program AE Training MyRepublic 2026.
   - Tombol **"Daftar Sekarang"** mengarah langsung ke Google Form pendaftaran: `https://bit.ly/FormAETraining2026`.
   - Calon peserta tidak perlu login.

3. **Masuk ke Dashboard Admin (`/login` atau `/admin/login`)**:
   - Klik **Admin Login** di pojok kanan atas.
   - Masukkan email staf MyRepublic Anda dan password bebas (autentikasi berjalan di sisi browser).

4. **Upload File Spreadsheet Google Sheets**:
   - Saat pertama kali masuk, dashboard akan menampilkan **Empty State** dengan tombol **"Upload Spreadsheet Peserta"**.
   - Buka Google Sheets respons pendaftaran Anda, pilih menu **File > Download > Microsoft Excel (.xlsx)** atau **Comma Separated Values (.csv)**.
   - Klik tombol upload di dashboard dan pilih file yang baru diunduh tersebut.

5. **Penyesuaian & Mapping Kolom**:
   - Sistem secara otomatis mencocokkan header kolom spreadsheet dengan kolom sistem (Nama, Kota, NIK, No WA, ASM, Vendor, Tanggal Training, dan 4 Link Dokumen).
   - Anda dapat meninjau dan mengubah pilihan mapping kolom jika diperlukan.
   - Terdapat **Preview 5 Baris Data Teratas** sebelum data disimpan.
   - Klik **"Simpan & Terapkan Data"**.

6. **Pengelolaan & Monitoring**:
   - **Overview Dashboard**: Seluruh grafik (pendaftaran harian, distribusi kota, vendor, ASM) dan kartu statistik otomatis dihitung dari file yang Anda upload.
   - **Data Peserta**: Cari nama peserta, filter kota penempatan, ASM, vendor, tanggal training, dan status kelengkapan dokumen.
   - **Kelengkapan Dokumen**: Pantau matriks ketersediaan link Google Drive dan lakukan verifikasi dokumen (*Terverifikasi*, *Menunggu Review*, *Perlu Revisi*) serta berikan catatan admin per peserta.
   - **Laporan & Rekap**: Tinjau rekapitulasi data dan unduh laporan dalam format **Excel (.xlsx)** atau **PDF**.
   - **Pengaturan**: Cek status file aktif dan tersedia tombol untuk mereset/membersihkan data dari browser jika ingin mengganti data baru.

---

### Catatan Keamanan & Penyimpanan:
- Data hanya tersimpan di perangkat dan browser yang Anda gunakan saat ini (`localStorage`).
- Membersihkan histori browser / cache dapat menghapus data yang tersimpan secara lokal. Anda selalu dapat mengunggah kembali file spreadsheet kapan saja.
- Mengubah status verifikasi secara lokal **tidak mengubah isi file asli di Google Sheets**.

