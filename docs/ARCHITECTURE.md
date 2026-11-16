# Dokumentasi Arsitektur & Panduan Setup
## AE Training Dashboard 2026 (MyRepublic)

Dokumen ini memuat ringkasan arsitektur teknis, petunjuk konfigurasi, serta instruksi menghubungkan dashboard dengan layanan backend (Supabase dan Google Sheets API).

---

### 1. Arsitektur Teknis

- **Frontend Application**: React 19 + JavaScript (ES6+) dengan Vite sebagai bundler.
- **Styling**: Tailwind CSS v4 dengan palet identitas merek MyRepublic (`mr-red`: `#E4002B`, latar belakang netral hangat, dan tipografi Inter).
- **Routing**: React Router DOM v7 dengan pemisahan area publik (`/`) dan area terproteksi (`/admin/*`).
- **Visualisasi**: Recharts (AreaChart, BarChart horizontal & vertikal, Donut Chart, progress bar).
- **Backend Database & Autentikasi**: Supabase PostgreSQL + Supabase Auth.
- **Sumber Data Pendaftaran**: Google Sheets terhubung dengan Google Form (`https://bit.ly/FormAETraining2026`).

---

### 2. Skema Database (Supabase PostgreSQL)

File skema lengkap tersedia di [`supabase/schema.sql`](file:///d:/MyRepublic/training-ae/supabase/schema.sql).

1. **`admins`**: Menyimpan metadata admin internal yang terhubung dengan `auth.users(id)` Supabase.
2. **`participants`**: Salinan operasional pendaftaran dari spreadsheet Google Sheets.
   - Menggunakan `source_response_id` yang unik dan stabil sebagai kunci *upsert* (mencegah duplikasi).
   - NIK **bukan** primary key dan di-mask pada tampilan antarmuka.
3. **`participant_documents`**: Menyimpan status ketersediaan (*available*, *missing*, *inaccessible*), status verifikasi admin (*pending_review*, *verified*, *needs_revision*), dan catatan admin untuk 4 jenis dokumen: KTP, KK, Foto Diri, dan Ijazah.
4. **`sync_logs`**: Mencatat riwayat waktu mulai, waktu selesai, jumlah baris data yang diproses, status (*success* / *failed*), serta pesan error jika ada.

Row Level Security (RLS) diaktifkan pada semua tabel untuk membatasi akses hanya kepada admin internal yang terautentikasi.

---

### 3. Petunjuk Menjalankan Frontend

1. Pasang dependensi jika belum:
   ```bash
   npm install
   ```
2. Jalankan development server:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di `http://localhost:5173`.
3. Untuk build production:
   ```bash
   npm run build
   ```

---

### 4. Langkah Menghubungkan Backend (Tahap 3)

#### A. Konfigurasi Supabase
1. Buat proyek baru di [Supabase Dashboard](https://supabase.com).
2. Salin dan jalankan seluruh query SQL dari [`supabase/schema.sql`](file:///d:/MyRepublic/training-ae/supabase/schema.sql) pada menu **SQL Editor** di Supabase.
3. Buat akun administrator di menu **Authentication > Users**.
4. Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
5. Isi nilai `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` sesuai project settings Anda.

#### B. Konfigurasi Google Sheets & Google Drive
1. Buat Service Account melalui Google Cloud Console dan unduh file kredensial JSON.
2. Bagikan (Share) file Google Sheets respons pendaftaran kepada email Service Account dengan izin *Viewer*.
3. Buka [`src/config/sheetMapping.js`](file:///d:/MyRepublic/training-ae/src/config/sheetMapping.js) dan cocokkan urutan indeks kolom (`sheetColumnIndex`) dengan urutan kolom aktual pada spreadsheet asli.
4. Masukkan kredensial Service Account ke environment secret pada Supabase Edge Function ([`supabase/functions/sync-sheets/index.ts`](file:///d:/MyRepublic/training-ae/supabase/functions/sync-sheets/index.ts)). Kredensial server-side tidak boleh diekspos ke frontend browser.

