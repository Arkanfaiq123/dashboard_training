import { Link } from 'react-router-dom';
import {
  MapPin,
  FileText,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  Users,
  Building2,
  GraduationCap,
  Shield,
  Briefcase,
  Clock,
  ChevronRight,
  Sparkles,
  Zap,
  Award,
} from 'lucide-react';
import {
  REGISTRATION_FORM_URL,
  PLACEMENT_CITIES,
  DOCUMENT_TYPES,
  APP_NAME,
} from '@/lib/constants';

/** City metadata for the placement section. */
const CITY_INFO = {
  Purwokerto: {
    description: 'Kota pendidikan dan pusat bisnis dinamis dengan akses infrastruktur modern.',
  },
  Purbalingga: {
    description: 'Wilayah industri strategis dengan potensi pasar penetrasi internet yang terus berkembang.',
  },
  Cilacap: {
    description: 'Kota pesisir industri terbesar di Jawa Tengah dengan peluang ekspansi jaringan yang luar biasa.',
  },
};

/** General requirements for registration. */
const REGISTRATION_REQUIREMENTS = [
  { icon: GraduationCap, text: 'Minimal lulusan SMA/SMK sederajat' },
  { icon: Users, text: 'Usia 18–30 tahun' },
  { icon: Briefcase, text: 'Bersedia ditempatkan di kota penempatan yang tersedia' },
  { icon: Clock, text: 'Bersedia mengikuti program training secara penuh' },
  { icon: Shield, text: 'Memiliki motivasi tinggi dan mampu bekerja dalam tim' },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDFCFE]">
      {/* ==================== NAVBAR ==================== */}
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-neutral-200/80 transition-all">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-mr-purple-dark via-mr-purple to-mr-purple-light flex items-center justify-center shadow-[var(--shadow-purple-sm)]">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-neutral-900 leading-tight">
                My<span className="text-mr-purple">Republic</span>
              </span>
              <span className="text-[10px] font-semibold text-mr-purple tracking-widest uppercase">
                AE Training 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3.5">
            <Link
              to="/login"
              className="text-xs font-bold text-neutral-600 hover:text-mr-purple px-3.5 py-2 rounded-xl hover:bg-mr-purple-50 transition-colors"
            >
              Portal Admin
            </Link>
            <a
              href={REGISTRATION_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-mr-purple to-mr-purple-light px-4.5 py-2 text-xs font-bold text-white shadow-[var(--shadow-purple-sm)] hover:opacity-95 hover:shadow-[var(--shadow-purple)] transition-all active:scale-95"
            >
              <span>Daftar Sekarang</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </nav>

      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#2A0845] via-[#4A1772] to-[#542080] text-white">
        {/* Glow ambient circles */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-mr-purple-light/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:py-32">
          <div className="max-w-2xl">
            {/* Badge Status */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md px-4 py-1.5 text-xs font-semibold text-purple-100 border border-white/15 mb-6 shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Program Resmi Pendaftaran AE Training — Angkatan 2026</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
              Jadilah Bagian Dari <br />
              <span className="bg-gradient-to-r from-purple-200 via-pink-200 to-white bg-clip-text text-transparent">
                Account Executive
              </span>
              <br />
              MyRepublic Indonesia
            </h1>

            <p className="mt-6 text-base sm:text-lg text-purple-100/90 leading-relaxed max-w-xl font-normal">
              Akselerasikan karier profesional Anda di industri Internet Fiber Optic berkecepatan tinggi. Dapatkan pelatihan intensif, mentor berpengalaman, dan benefit kompetitif.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href={REGISTRATION_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-mr-purple px-6 py-3.5 text-sm font-extrabold shadow-xl hover:bg-purple-50 transition-all active:scale-95 hover:shadow-2xl"
              >
                <span>Buka Formulir Pendaftaran</span>
                <ExternalLink className="h-4 w-4" />
              </a>
              <a
                href="#syarat"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                <span>Lihat Persyaratan</span>
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>

            {/* Quick stats grid */}
            <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <p className="text-3xl font-black text-white">3</p>
                <p className="text-xs text-purple-200 font-medium mt-0.5">Kota Penempatan</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">4</p>
                <p className="text-xs text-purple-200 font-medium mt-0.5">Dokumen Wajib</p>
              </div>
              <div>
                <p className="text-3xl font-black text-white">100%</p>
                <p className="text-xs text-purple-200 font-medium mt-0.5">Gratis / Tanpa Biaya</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FITUR / BENEFIT ==================== */}
      <section className="py-20 sm:py-24 bg-white border-b border-neutral-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mr-purple-50 text-mr-purple text-xs font-bold tracking-wide uppercase">
              <Sparkles size={13} />
              Mengapa Bergabung?
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-neutral-900 tracking-tight">
              Benefit Program AE Training 2026
            </h2>
            <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
              Kami mempersiapkan Anda menjadi Account Executive yang handal, percaya diri, dan siap mencapai target terbaik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#FAF7FC] border border-mr-purple/10 hover:border-mr-purple/30 transition-all hover:shadow-[var(--shadow-card-hover)]">
              <div className="h-12 w-12 rounded-xl bg-mr-purple/10 text-mr-purple flex items-center justify-center mb-4">
                <Zap size={22} />
              </div>
              <h3 className="text-base font-bold text-neutral-900 mb-2">Pelatihan Terstruktur</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Pelajari strategi penjualan B2C, product knowledge teknologi fiber optic mutakhir, dan simulasi teknik negosiasi lapangan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF7FC] border border-mr-purple/10 hover:border-mr-purple/30 transition-all hover:shadow-[var(--shadow-card-hover)]">
              <div className="h-12 w-12 rounded-xl bg-mr-purple/10 text-mr-purple flex items-center justify-center mb-4">
                <Users size={22} />
              </div>
              <h3 className="text-base font-bold text-neutral-900 mb-2">Mentoring ASM Berpengalaman</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Didampingi langsung oleh Area Sales Manager (ASM) profesional yang membimbing Anda memahami karakter pasar lokal.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FAF7FC] border border-mr-purple/10 hover:border-mr-purple/30 transition-all hover:shadow-[var(--shadow-card-hover)]">
              <div className="h-12 w-12 rounded-xl bg-mr-purple/10 text-mr-purple flex items-center justify-center mb-4">
                <Award size={22} />
              </div>
              <h3 className="text-base font-bold text-neutral-900 mb-2">Peluang Insentif & Karier</h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Skema komisi menarik dan jenjang karier terbuka luas seiring dengan ekspansi jaringan MyRepublic di berbagai kota.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== KOTA PENEMPATAN ==================== */}
      <section className="py-20 sm:py-24 bg-[#FBF9FD]">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mr-purple-50 text-mr-purple text-xs font-bold tracking-wide uppercase">
              <MapPin size={13} />
              Wilayah Operasional
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-neutral-900 tracking-tight">
              3 Kota Penempatan Utama
            </h2>
            <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
              Pilih kota penempatan terdekat sesuai domisili Anda di Jawa Tengah.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLACEMENT_CITIES.map((city) => (
              <div
                key={city}
                className="bg-white rounded-2xl border border-neutral-200/80 p-6 shadow-xs hover:border-mr-purple/40 hover:shadow-[var(--shadow-card-hover)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-mr-purple/15 to-mr-purple/5 text-mr-purple flex items-center justify-center mb-4 border border-mr-purple/15">
                    <MapPin size={20} />
                  </div>
                  <h3 className="text-lg font-extrabold text-neutral-900">{city}</h3>
                  <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                    {CITY_INFO[city]?.description || 'Penempatan strategis kantor cabang MyRepublic.'}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-mr-purple">
                  <span>Status: Terbuka</span>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PERSYARATAN & DOKUMEN ==================== */}
      <section id="syarat" className="py-20 sm:py-24 bg-white border-t border-neutral-100">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Kiri: Syarat Umum */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mr-purple-50 text-mr-purple text-xs font-bold tracking-wide uppercase">
                <CheckCircle size={13} />
                Kriteria Calon AE
              </span>
              <h2 className="mt-3 text-3xl font-extrabold text-neutral-900 tracking-tight">
                Persyaratan Pendaftaran
              </h2>
              <p className="mt-3 text-sm text-neutral-500 leading-relaxed mb-6">
                Pastikan Anda memenuhi kualifikasi umum berikut sebelum mengisi formulir:
              </p>

              <div className="space-y-3.5">
                {REGISTRATION_REQUIREMENTS.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3.5 p-3.5 rounded-xl bg-[#FAF7FC] border border-mr-purple/10"
                  >
                    <div className="h-8 w-8 rounded-lg bg-mr-purple/10 text-mr-purple flex items-center justify-center shrink-0">
                      <req.icon size={16} />
                    </div>
                    <span className="text-xs font-semibold text-neutral-800">{req.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Kanan: Dokumen Wajib */}
            <div className="bg-gradient-to-br from-neutral-900 to-[#2A0845] p-8 sm:p-10 rounded-3xl text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-mr-purple/30 rounded-full blur-3xl pointer-events-none" />
              <div className="relative">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Dokumen Persiapan
                </span>
                <h3 className="text-2xl font-bold mt-1 mb-2">4 Berkas Wajib Upload</h3>
                <p className="text-xs text-purple-200/80 mb-6 leading-relaxed">
                  Siapkan foto atau scan dokumen berikut dalam format JPG/PNG/PDF sebelum mengisi link form:
                </p>

                <div className="space-y-3">
                  {DOCUMENT_TYPES.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10"
                    >
                      <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center text-purple-200 shrink-0">
                        <FileText size={15} />
                      </div>
                      <span className="text-xs font-bold">{doc.label}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <a
                    href={REGISTRATION_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-mr-purple py-3 text-xs font-extrabold shadow-md hover:bg-purple-50 transition-colors"
                  >
                    <span>Lanjut ke Formulir Google Form</span>
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="bg-neutral-950 text-neutral-400 py-12 border-t border-neutral-900 text-xs">
        <div className="mx-auto max-w-6xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-mr-purple flex items-center justify-center text-white font-bold text-xs">
              AE
            </div>
            <span className="font-bold text-neutral-200">
              MyRepublic Indonesia — AE Training Dashboard 2026
            </span>
          </div>
          <p className="text-neutral-500 text-[11px]">
            © {new Date().getFullYear()} PT Eka Mas Republik. Hak Cipta Dilindungi Undang-Undang.
          </p>
        </div>
      </footer>
    </div>
  );
}
