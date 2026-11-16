# PRODUCT REQUIREMENTS DOCUMENT (PRD)
# AE TRAINING DASHBOARD 2026

**Version:** 1.0  
**Status:** Initial Product Specification  
**Product Type:** Internal Web Dashboard  
**Target Platform:** Web Application  
**Primary Users:** Administrator dan Calon Account Executive (AE)

---

## 1. Product Overview

### 1.1 Latar Belakang

AE Training Dashboard 2026 merupakan aplikasi web internal yang dirancang untuk membantu administrator memantau, mengelola, dan menganalisis data pendaftaran calon Account Executive (AE) MyRepublic.

Saat ini proses pendaftaran dilakukan melalui Google Form yang responsnya tersimpan secara otomatis di Google Sheets.

Pengelolaan melalui spreadsheet secara langsung memiliki keterbatasan dalam hal visualisasi data, monitoring kelengkapan dokumen, pencarian peserta, serta penyusunan laporan.

Oleh karena itu, diperlukan dashboard terpusat yang mengintegrasikan Google Sheets dengan antarmuka web modern agar informasi peserta lebih mudah dipantau dan dikelola.

### 1.2 Product Vision

Membangun platform monitoring AE Training yang mampu menyajikan informasi pendaftaran, administrasi, dan kelengkapan dokumen secara terstruktur, akurat, dan mudah dipahami.

### 1.3 Tujuan Produk

1. Mempermudah monitoring seluruh peserta AE Training.
2. Menyediakan visualisasi statistik pendaftaran.
3. Memantau kelengkapan dokumen administrasi peserta.
4. Mempermudah pencarian dan penyaringan data.
5. Menyediakan laporan yang dapat diekspor.
6. Mengurangi ketergantungan pada pembacaan Google Sheets secara manual.

---

## 2. Target Pengguna dan Hak Akses

Produk memiliki dua jenis pengguna.

### 2.1 Administrator

Administrator merupakan pengguna internal yang memiliki akses ke dashboard.

Hak akses:
- Login dan logout.
- Melihat overview dashboard.
- Melihat seluruh data peserta.
- Melihat detail identitas peserta.
- Melihat informasi ASM dan vendor.
- Memantau kelengkapan dokumen.
- Melakukan pencarian dan filter data.
- Melakukan sinkronisasi data.
- Melihat laporan statistik.
- Export data ke Excel dan PDF.

### 2.2 Peserta

Peserta merupakan calon AE yang akan melakukan pendaftaran.

Hak akses:
- Mengakses halaman publik.
- Melihat informasi AE Training 2026.
- Melihat petunjuk dan persyaratan pendaftaran.
- Mengakses Google Form melalui tombol pendaftaran.

Peserta tidak membutuhkan akun dan tidak memiliki akses ke dashboard administrator.

---

## 3. Product Scope

### 3.1 In Scope (MVP)

Fitur yang wajib tersedia pada versi pertama:

1. Public Landing Page.
2. Administrator Authentication.
3. Dashboard Overview.
4. Data Peserta.
5. Detail Peserta.
6. Monitoring Kelengkapan Dokumen.
7. Filter dan Search.
8. Google Sheets Integration.
9. Export Excel dan PDF.

### 3.2 Out of Scope (MVP)

Fitur berikut belum menjadi prioritas versi pertama:

- Ujian atau penilaian kompetensi AE.
- Sistem ranking berdasarkan nilai ujian.
- Manajemen absensi training.
- Sistem penjadwalan otomatis.
- Portal akun peserta.
- Integrasi WhatsApp otomatis.
- Sistem payroll.

Fitur tersebut dapat dipertimbangkan pada pengembangan berikutnya.

---

## 4. Functional Requirements

### 4.1 Public Landing Page

Halaman publik menjadi pintu masuk bagi calon peserta.

Komponen:
- Logo dan identitas AE Training.
- Informasi pendaftaran.
- Persyaratan administrasi.
- Informasi dokumen yang wajib disiapkan.
- Informasi kota penempatan.
- Tombol Daftar Sekarang.

Tombol Daftar Sekarang mengarahkan pengguna ke Google Form AE Training 2026 yang sudah digunakan.

URL Google Form:
https://bit.ly/FormAETraining2026

### 4.2 Authentication

Sistem menggunakan Supabase Auth untuk autentikasi administrator.

Fitur:
- Login menggunakan email dan password.
- Logout.
- Proteksi halaman dashboard.
- Session management.
- Pembatasan akses untuk pengguna yang belum terautentikasi.

Tidak tersedia registrasi publik administrator.

### 4.3 Dashboard Overview

Menampilkan ringkasan kondisi pendaftaran.

Komponen statistik:

| Komponen | Deskripsi |
|---|---|
| Total Peserta | Jumlah seluruh respons pendaftaran |
| Dokumen Lengkap | Peserta dengan empat dokumen tersedia dan lolos pemeriksaan |
| Dokumen Belum Lengkap | Peserta yang masih memiliki dokumen kurang |
| Total Vendor | Jumlah vendor unik |
| Total ASM | Jumlah ASM unik |
| Total per Kota | Jumlah peserta setiap kota |

Visualisasi:
- Grafik pendaftaran berdasarkan tanggal.
- Grafik peserta berdasarkan kota.
- Distribusi vendor.
- Distribusi ASM.
- Grafik kelengkapan dokumen.

Semua statistik wajib dihitung berdasarkan data aktual Google Sheets, bukan angka statis.

### 4.4 Data Peserta

Menampilkan seluruh peserta dalam bentuk tabel.

Kolom utama:

| Kolom | Keterangan |
|---|---|
| Nama Lengkap | Nama sesuai KTP |
| Tanggal Training | Tanggal training |
| Kota Penempatan | Kota peserta |
| Nama ASM | ASM terkait |
| Vendor | Vendor perekrut |
| Pendidikan | Pendidikan terakhir |
| Dokumen | Status kelengkapan |
| Tanggal Daftar | Timestamp respons |

Fitur:
- Search nama peserta.
- Filter kota.
- Filter vendor.
- Filter ASM.
- Filter tanggal training.
- Filter status dokumen.
- Pagination.
- Sorting kolom.
- Akses halaman detail peserta.

NIK, nomor WhatsApp, alamat lengkap, dan data sensitif lainnya tidak ditampilkan dalam tabel utama.

### 4.5 Detail Peserta

Saat administrator memilih salah satu peserta, sistem membuka halaman detail.

Informasi dibagi menjadi beberapa bagian:

**A. Identitas Personal**
- Nama lengkap.
- NIK.
- Tanggal lahir.
- Nomor WhatsApp.
- Email.
- Alamat domisili.

**B. Informasi Penempatan**
- Kota penempatan.
- Nama ASM.
- Nama vendor.
- Tanggal training.

**C. Informasi Administrasi**
- Pendidikan terakhir.
- Status perkawinan.
- Status vaksin.

**D. Dokumen**
- KTP.
- KK.
- Foto diri.
- Ijazah.

Setiap dokumen memiliki status:
- Belum tersedia.
- Menunggu pemeriksaan.
- Terverifikasi.
- Perlu revisi.

Administrator dapat membuka dokumen melalui tautan Google Drive jika memiliki izin akses.

### 4.6 Document Monitoring

Sistem melakukan pemantauan terhadap empat jenis dokumen:

1. KTP.
2. Kartu Keluarga.
3. Foto diri terbaru.
4. Ijazah.

Ketentuan:
- Dokumen dianggap tersedia jika respons memiliki referensi file.
- Dokumen tidak otomatis dianggap valid hanya karena file tersedia.
- Status verifikasi ditentukan oleh administrator.
- Dokumen yang perlu diperbaiki dapat diberi catatan.

### 4.7 Data Filtering

Sistem menyediakan filter berdasarkan:

- Kota: Purwokerto, Purbalingga, Cilacap.
- Vendor.
- ASM.
- Tanggal training.
- Tanggal pendaftaran.
- Status dokumen.

Filter dapat dikombinasikan.

### 4.8 Reporting

Administrator dapat menghasilkan laporan:

- Data seluruh peserta.
- Rekap peserta per kota.
- Rekap peserta per vendor.
- Rekap peserta per ASM.
- Rekap kelengkapan dokumen.

Format:
- Excel (.xlsx).
- PDF.

Data sensitif harus dilindungi dan hanya dapat diekspor oleh administrator yang berwenang.

---

## 5. Data Source & Integration

### 5.1 Primary Data Source

Google Sheets yang terhubung dengan Google Form AE Training 2026 menjadi sumber data utama.

Alur:

Google Form → Google Sheets → Backend Integration → Dashboard.

### 5.2 Google Sheets Integration

Integrasi menggunakan salah satu pendekatan:

**Pilihan A: Google Sheets API**
- Backend membaca data spreadsheet.
- Menggunakan Service Account.
- Spreadsheet dibagikan kepada akun Service Account dengan izin minimum yang diperlukan.
- Kredensial hanya tersimpan di server.

**Pilihan B: Google Apps Script**
- Apps Script membaca respons spreadsheet.
- Menyediakan endpoint integrasi yang dilindungi autentikasi.
- Backend mengambil data melalui endpoint tersebut.

Rekomendasi awal: Google Sheets API dengan backend Next.js.

### 5.3 Synchronization

Sistem menyediakan dua metode sinkronisasi:

1. Manual Sync: administrator menekan tombol sinkronisasi.
2. Automatic Sync: sistem mengambil perubahan secara berkala.

Setiap proses sinkronisasi harus:
- Mengambil respons terbaru.
- Memvalidasi format data.
- Memperbarui data yang berubah.
- Menghindari duplikasi peserta.
- Mencatat waktu sinkronisasi terakhir.
- Menampilkan informasi apabila sinkronisasi gagal.

Gunakan timestamp respons atau identitas respons yang stabil untuk membantu identifikasi data.

### 5.4 Google Drive Documents

File upload Google Form disimpan di Google Drive.

Sistem harus memverifikasi:
- Format referensi file.
- Hak akses file.
- Kemampuan backend membaca metadata.
- Izin administrator membuka file.

Keberadaan URL file tidak menjamin dokumen dapat diakses.

---

## 6. Data Mapping

Mapping berikut dibuat berdasarkan pertanyaan Google Form yang telah diberikan.

| Field | Kategori |
|---|---|
| Timestamp | Metadata |
| Nama Lengkap | Personal |
| NIK KTP | Personal |
| Tanggal Lahir | Personal |
| Tanggal Training | Training |
| Kota Penempatan | Penempatan |
| Nama ASM | Penempatan |
| Nama Vendor | Penempatan |
| No WA | Kontak |
| Email | Kontak |
| Alamat Domisili | Personal |
| Pendidikan Terakhir | Administrasi |
| Status Perkawinan | Administrasi |
| Vaksin | Administrasi |
| Upload KTP | Dokumen |
| Upload KK | Dokumen |
| Foto Diri | Dokumen |
| Upload Ijazah | Dokumen |

**Catatan penting:** nama kolom di atas merupakan nama konseptual berdasarkan pertanyaan formulir. Nama header sebenarnya, urutan kolom, tipe data, timestamp, serta format tautan file wajib diverifikasi dari spreadsheet asli sebelum implementasi.

---

## 7. Database Design

Google Sheets tetap menjadi sumber data utama. Supabase digunakan untuk autentikasi administrator dan penyimpanan data operasional dashboard.

Usulan tabel:

### 7.1 admins
- id
- email
- created_at

### 7.2 participants
- id
- source_response_id
- full_name
- nik
- birth_date
- training_date
- placement_city
- asm_name
- vendor_name
- phone_number
- email
- address
- education
- marital_status
- vaccination_status
- registered_at
- synced_at

### 7.3 participant_documents
- id
- participant_id
- document_type
- drive_file_id
- drive_file_url
- availability_status
- verification_status
- admin_note
- verified_at
- verified_by

### 7.4 sync_logs
- id
- sync_started_at
- sync_completed_at
- sync_status
- records_processed
- error_message

Catatan:
- `source_response_id` harus stabil dan unik.
- NIK tidak boleh digunakan sebagai identifier publik.
- Data sensitif harus dibatasi melalui kebijakan akses database.
- Jika data peserta disimpan di Supabase, database tersebut merupakan salinan operasional dari sumber Google Sheets, bukan sumber pendaftaran baru.

---

## 8. API Requirements

Usulan endpoint backend:

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | /api/dashboard/overview | Statistik dashboard |
| GET | /api/participants | Daftar peserta |
| GET | /api/participants/[id] | Detail peserta |
| GET | /api/participants/[id]/documents | Referensi dokumen |
| PATCH | /api/participants/[id]/documents | Memperbarui status verifikasi |
| POST | /api/sync | Menjalankan sinkronisasi |
| GET | /api/sync/status | Status sinkronisasi |
| GET | /api/reports/export | Export laporan |

Seluruh endpoint internal wajib menggunakan autentikasi dan pemeriksaan hak akses.

Endpoint publik hanya menyediakan informasi yang memang ditujukan untuk publik, bukan data peserta.

---

## 9. Non-Functional Requirements

### Performance
- Dashboard dapat dimuat secara responsif.
- Gunakan pagination untuk data peserta.
- Hindari mengambil seluruh dokumen sekaligus.
- Terapkan caching untuk statistik yang tidak perlu diperbarui setiap request.

### Security
- Seluruh halaman admin dilindungi autentikasi.
- API memvalidasi session administrator.
- Service Account tidak boleh diekspos di browser.
- Data sensitif tidak boleh muncul di URL atau log.
- Terapkan prinsip least privilege.
- Gunakan HTTPS.
- Batasi akses dokumen Google Drive.

### Privacy
- NIK, nomor telepon, alamat, dan dokumen identitas merupakan data yang perlu dilindungi.
- Batasi akses berdasarkan kebutuhan pekerjaan.
- Hindari menampilkan data sensitif pada overview.
- Terapkan kebijakan retensi dan penghapusan data sesuai kebijakan perusahaan dan peraturan perlindungan data pribadi.

### Usability
- Desain desktop-first tetapi tetap responsif.
- Navigasi sederhana.
- Tabel mudah dibaca.
- Status menggunakan label visual yang konsisten.
- Grafik memiliki keterangan yang jelas.

### Reliability
- Kegagalan sinkronisasi tidak boleh menghapus data yang sudah tersimpan.
- Tampilkan waktu pembaruan terakhir.
- Catat kesalahan integrasi.
- Sediakan mekanisme retry.

---

## 10. UI/UX Guidelines

Arah desain: Modern Enterprise Dashboard.

### Visual Identity
- Primary: Merah MyRepublic.
- Background: Putih dan light neutral.
- Text: Near-black.
- Secondary: Neutral gray.
- Status: Hijau, kuning, dan merah sesuai konteks.

### Layout
- Sidebar navigation.
- Top navigation dengan profil admin.
- Breadcrumb.
- Overview dengan statistik.
- Data table dengan filter.
- Detail peserta dengan section yang terorganisir.

### Design Principles
1. Hindari terlalu banyak card yang berulang.
2. Prioritaskan keterbacaan informasi.
3. Gunakan visualisasi yang benar-benar membantu analisis.
4. Gunakan whitespace yang proporsional.
5. Hindari dekorasi yang tidak memiliki fungsi.
6. Pastikan tampilan nyaman digunakan dalam pekerjaan administratif sehari-hari.

---

## 11. Acceptance Criteria

Produk MVP dianggap memenuhi kebutuhan apabila:

| ID | Kriteria | Expected Result |
|---|---|---|
| AC-01 | Login admin | Admin dapat login dengan akun valid |
| AC-02 | Proteksi dashboard | Pengguna tanpa session tidak dapat mengakses dashboard |
| AC-03 | Google Sheets integration | Sistem dapat mengambil data respons |
| AC-04 | Data peserta | Seluruh data yang dipetakan tampil dengan benar |
| AC-05 | Detail peserta | Admin dapat melihat detail peserta |
| AC-06 | Document monitoring | Status empat dokumen tampil dengan benar |
| AC-07 | Filter | Data dapat difilter berdasarkan kota, vendor, ASM, dan tanggal |
| AC-08 | Search | Admin dapat mencari peserta |
| AC-09 | Synchronization | Data baru dapat masuk tanpa duplikasi |
| AC-10 | Reporting | Laporan dapat diekspor ke Excel dan PDF |
| AC-11 | Privacy | Data sensitif tidak dapat diakses pengguna publik |
| AC-12 | Responsiveness | Website nyaman digunakan di desktop dan mobile |

---

## 12. Development Roadmap

### Phase 1 — Foundation
- Inisialisasi Next.js.
- Setup TypeScript.
- Setup Tailwind CSS dan shadcn/ui.
- Setup Supabase.
- Setup autentikasi admin.
- Setup struktur project.

### Phase 2 — Data Integration
- Setup Google Sheets API.
- Verifikasi mapping kolom.
- Implementasi sinkronisasi.
- Validasi data.
- Setup database operasional.

### Phase 3 — Dashboard Development
- Overview.
- Data peserta.
- Detail peserta.
- Document monitoring.
- Filter dan pencarian.

### Phase 4 — Reporting
- Grafik statistik.
- Export Excel.
- Export PDF.
- Sinkronisasi otomatis.

### Phase 5 — Testing & Deployment
- Functional testing.
- Security testing.
- Data validation.
- Responsive testing.
- Deployment ke Vercel.

---

## 13. Success Metrics

Keberhasilan produk diukur melalui:

1. Seluruh respons Google Form dapat ditampilkan dengan benar.
2. Data peserta baru dapat tersinkronisasi.
3. Tidak terjadi duplikasi data akibat sinkronisasi berulang.
4. Status dokumen dapat dipantau dengan mudah.
5. Administrator dapat menemukan peserta menggunakan filter dan pencarian.
6. Laporan dapat dibuat tanpa mengolah spreadsheet secara manual.
7. Tidak ada kebocoran informasi pribadi peserta.

---

## 14. Assumptions & Open Questions

### Fakta yang sudah diketahui
- Google Form AE Training 2026 sudah tersedia.
- Respons Google Form sudah terhubung ke Google Sheets.
- Kota penempatan terdiri dari Purwokerto, Purbalingga, dan Cilacap.
- Form meminta identitas, informasi penempatan, administrasi, dan empat dokumen.
- Peserta tidak membutuhkan akun dashboard.
- Administrator membutuhkan monitoring data terpusat.

### Asumsi yang perlu diverifikasi
- Spreadsheet memiliki satu baris untuk setiap respons.
- Google Drive menyimpan dokumen upload.
- Administrator memiliki izin mengakses spreadsheet dan dokumen.
- Google Sheets dapat dijadikan sumber data yang konsisten.
- Jumlah respons masih sesuai dengan kapasitas sinkronisasi yang direncanakan.

### Open Questions
1. Apa URL Google Sheets respons asli?
2. Apakah administrator hanya satu akun atau beberapa akun?
3. Apakah status dokumen membutuhkan persetujuan manual?
4. Apakah peserta dapat mengirim respons lebih dari satu kali?
5. Apakah perlu fitur mengedit data peserta?
6. Apakah data peserta perlu dipisahkan berdasarkan periode training?
7. Apakah laporan harus memiliki format resmi perusahaan?

---

## 15. Final Product Definition

AE Training Dashboard 2026 merupakan aplikasi web internal yang mengintegrasikan Google Form dan Google Sheets untuk menyediakan sistem monitoring pendaftaran calon AE secara terpusat.

Versi MVP berfokus pada:
- Pengambilan data otomatis.
- Visualisasi statistik.
- Monitoring peserta.
- Monitoring kelengkapan dokumen.
- Pengelolaan data oleh administrator.
- Export laporan.

Google Form tetap menjadi media pendaftaran utama. Dashboard menjadi media monitoring dan analisis.

**Product Goal:** One Platform to Monitor AE Training Registration, Administration, and Participant Readiness.

**End of Document.**