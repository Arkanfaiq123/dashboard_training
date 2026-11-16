import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ArrowLeft, Building2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function validate() {
    if (!email.trim()) return 'Email wajib diisi.';
    if (!isValidEmail(email.trim())) return 'Format email tidak valid.';
    if (!password) return 'Password wajib diisi.';
    return '';
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      signIn(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || 'Gagal masuk. Silakan periksa kembali data Anda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FDFCFE] via-[#F8F4FC] to-[#F1E8F8] px-4 py-12 relative overflow-hidden">
      {/* Decorative ambient blobs */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-mr-purple/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-mr-purple/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Back to Home Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-mr-purple transition-colors mb-6 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Halaman Utama</span>
        </Link>

        {/* Login Card */}
        <div className="rounded-3xl border border-neutral-200/80 bg-white shadow-[var(--shadow-dropdown)] p-8">
          <div className="text-center mb-7">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-mr-purple-dark via-mr-purple to-mr-purple-light flex items-center justify-center shadow-[var(--shadow-purple-sm)] text-white mb-4">
              <Building2 className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-extrabold text-neutral-900 tracking-tight">
              Portal Admin <span className="text-mr-purple">AE Training</span>
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Masuk untuk mengelola data pendaftaran & monitoring
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200/70 p-3.5 text-xs text-rose-800 animate-fade-in">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-neutral-700 mb-1.5">
                Email Administrator
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@myrepublic.co.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mr-purple/20 focus:border-mr-purple font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="pass" className="block text-xs font-bold text-neutral-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  id="pass"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mr-purple/20 focus:border-mr-purple font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-mr-purple to-mr-purple-light py-3 text-xs font-bold text-white shadow-[var(--shadow-purple-sm)] hover:opacity-95 hover:shadow-[var(--shadow-purple)] transition-all active:scale-98 disabled:opacity-50"
            >
              <span>{loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
            </button>
          </form>

          {/* Sesi info */}
          <div className="mt-6 pt-5 border-t border-neutral-100 flex items-center justify-center gap-1.5 text-[11px] text-neutral-400">
            <ShieldCheck size={14} className="text-mr-purple" />
            <span>Akses Terbatas Administrator Internal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
