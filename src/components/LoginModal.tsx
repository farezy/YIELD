import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Moon, Sun, AlertCircle, User, CheckCircle2, UserPlus } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onLoginSuccess: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

interface StoredUser {
  id: string;
  pass: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onLoginSuccess,
  darkMode,
  onToggleTheme,
}) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Retrieve any accounts created via "Buat Akun"
  const getRegisteredUsers = (): StoredUser[] => {
    try {
      const stored = localStorage.getItem('fima_registered_users');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedId = id.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedId) {
      setErrorMsg('Masukkan ID terlebih dahulu');
      return;
    }

    if (!trimmedPassword) {
      setErrorMsg('Masukkan password terlebih dahulu');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const registeredUsers = getRegisteredUsers();
      const userFound = registeredUsers.find(
        (u) => u.id.toLowerCase() === trimmedId && u.pass === trimmedPassword
      );

      // Allow admin / admin or any account created via "Buat Akun"
      if ((trimmedId === 'admin' && trimmedPassword === 'admin') || userFound) {
        if (rememberMe) {
          localStorage.setItem('fima_authenticated', 'true');
        } else {
          sessionStorage.setItem('fima_authenticated', 'true');
        }
        setIsLoading(false);
        onLoginSuccess();
      } else {
        setIsLoading(false);
        setErrorMsg('ID atau Password salah! Akses ditolak.');
      }
    }, 300);
  };

  const handleRegisterSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const trimmedId = id.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirm = confirmPassword.trim();

    if (!trimmedId) {
      setErrorMsg('Masukkan ID yang diinginkan');
      return;
    }

    if (trimmedId.length < 3) {
      setErrorMsg('ID minimal harus 3 karakter');
      return;
    }

    if (!trimmedPassword) {
      setErrorMsg('Masukkan password');
      return;
    }

    if (trimmedPassword.length < 4) {
      setErrorMsg('Password minimal harus 4 karakter');
      return;
    }

    if (trimmedPassword !== trimmedConfirm) {
      setErrorMsg('Konfirmasi password tidak cocok');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const users = getRegisteredUsers();
      if (
        trimmedId.toLowerCase() === 'admin' ||
        users.some((u) => u.id.toLowerCase() === trimmedId.toLowerCase())
      ) {
        setIsLoading(false);
        setErrorMsg('ID ini sudah digunakan, silakan pilih ID lain.');
        return;
      }

      users.push({ id: trimmedId, pass: trimmedPassword });
      try {
        localStorage.setItem('fima_registered_users', JSON.stringify(users));
      } catch (err) {
        console.error('Failed to save user', err);
      }

      // Automatically log in with the new account
      if (rememberMe) {
        localStorage.setItem('fima_authenticated', 'true');
      } else {
        sessionStorage.setItem('fima_authenticated', 'true');
      }

      setIsLoading(false);
      onLoginSuccess();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/65 backdrop-blur-md animate-fadeIn">
      {/* Centered Card */}
      <div className="w-full max-w-[390px] rounded-3xl bg-white/85 dark:bg-[#18181D]/90 backdrop-blur-xl border border-white/70 dark:border-white/10 shadow-2xl p-6 sm:p-7 flex flex-col transition-all">
        
        {/* Top Icon Badge */}
        <div className="flex justify-center mb-4">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 shadow-lg shadow-sky-500/30 text-white">
            {isRegisterMode ? (
              <UserPlus className="w-8 h-8 stroke-[2.2]" />
            ) : (
              <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
            )}
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-700 border-2 border-white dark:border-[#18181D] flex items-center justify-center text-white">
              <Lock className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-5">
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {isRegisterMode ? 'Buat Akun' : 'Selamat Datang'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
            {isRegisterMode
              ? 'Daftar akun baru Dashboard Yield'
              : 'Masuk ke Dashboard Yield Production'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={isRegisterMode ? handleRegisterSubmit : handleLoginSubmit} className="space-y-3.5">
          {/* ID Input - without placeholder shadow text */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              ID
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={id}
                onChange={(e) => {
                  setId(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                autoFocus
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-medium bg-white/90 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-transparent transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Password Input - without placeholder shadow text */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium bg-white/90 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-transparent transition-all shadow-2xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-1"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field (Only in Buat Akun mode) */}
          {isRegisterMode && (
            <div className="animate-fadeIn">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Konfirmasi Password
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl text-sm font-medium bg-white/90 dark:bg-[#222228] border border-gray-200 dark:border-neutral-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/80 focus:border-transparent transition-all shadow-2xs"
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <p className="flex items-center gap-1 text-[11px] text-red-500 mt-1 font-medium animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMsg}</span>
            </p>
          )}

          {/* Success Message */}
          {successMsg && (
            <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{successMsg}</span>
            </p>
          )}

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-gray-600 dark:text-gray-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-gray-300 dark:border-neutral-600 dark:bg-neutral-800 cursor-pointer"
              />
              <span className="font-medium">Ingat saya</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 shadow-md shadow-sky-500/30 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 mt-1"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{isRegisterMode ? 'Daftar & Masuk' : 'Masuk'}</span>
            )}
          </button>
        </form>

        {/* Buat Akun / Masuk Switch Link */}
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400">
          {isRegisterMode ? (
            <p>
              Sudah punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(false);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Masuk
              </button>
            </p>
          ) : (
            <p>
              Belum punya akun?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsRegisterMode(true);
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 hover:underline cursor-pointer"
              >
                Buat Akun
              </button>
            </p>
          )}
        </div>

        {/* Security & Version Footnote */}
        <div className="mt-3 text-center">
          <p className="text-[11px] text-gray-400 dark:text-neutral-500 font-medium">
            v2.1 • Keamanan dilindungi
          </p>
        </div>

        {/* Dark Mode Switch at bottom */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-neutral-800 flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
          <div className="flex items-center gap-2">
            {darkMode ? (
              <Moon className="w-4 h-4 text-sky-400" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span className="font-medium">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={onToggleTheme}
            className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
              darkMode ? 'bg-sky-600' : 'bg-gray-300 dark:bg-neutral-700'
            }`}
            title="Ganti Mode Gelap / Terang"
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                darkMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

      </div>
    </div>
  );
};
