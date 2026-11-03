import React, { useState } from 'react';
import { Employee } from '../types';
import {
  Lock,
  KeyRound,
  Shield,
  ShieldAlert,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  User,
  Sparkles,
} from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  currentEmployee: Employee | null;
  onLoginSuccess: (emp: Employee) => void;
  forcedReason?: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  employees,
  currentEmployee,
  onLoginSuccess,
  forcedReason,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    currentEmployee ? currentEmployee.id : employees[0]?.id || ''
  );
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetEmployee) return;

    // Check password
    const expectedPassword = targetEmployee.password || (targetEmployee.role === 'admin' ? 'admin123' : 'user123');

    if (passwordInput !== expectedPassword) {
      setErrorMsg(`Kata sandi salah untuk ${targetEmployee.name}. Akun ${targetEmployee.role === 'admin' ? 'ADMIN' : 'karyawan'} terkunci demi keamanan.`);
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(`Otentikasi berhasil! Masuk sebagai ${targetEmployee.name} (${targetEmployee.role === 'admin' ? 'ADMIN' : 'KARYAWAN'}).`);

    setTimeout(() => {
      onLoginSuccess(targetEmployee);
      setSuccessMsg(null);
      setPasswordInput('');
      onClose();
    }, 600);
  };

  const handleQuickFill = (emp: Employee, pwd: string) => {
    setSelectedEmpId(emp.id);
    setPasswordInput(pwd);
    setErrorMsg(null);
  };

  const admins = employees.filter((e) => e.role === 'admin');
  const regularEmployees = employees.filter((e) => e.role !== 'admin');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/75 p-2 backdrop-blur-sm sm:p-4">
      <div className="relative my-2 max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-100 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:my-4 sm:p-7">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-slate-900 text-emerald-400 shadow-sm">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                <span>Login & Kunci Akun</span>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Sandi Aktif
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Fitur Admin dilindungi kata sandi agar tidak dapat diakses sembarangan
              </p>
            </div>
          </div>
          {!forcedReason && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Forced Lock Reason Notice if any */}
        {forcedReason && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{forcedReason}</span>
          </div>
        )}

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleLogin} className="mt-5 space-y-4">
          {/* Target Profile Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Pilih Pengguna yang Ingin Masuk:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {employees.map((emp) => {
                const isSelected = emp.id === selectedEmpId;
                const isAdmin = emp.role === 'admin';
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => {
                      setSelectedEmpId(emp.id);
                      setErrorMsg(null);
                    }}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <img
                      src={emp.avatarUrl}
                      alt={emp.name}
                      className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {emp.name.split(',')[0]}
                        </p>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                            isAdmin
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isAdmin ? 'ADMIN' : 'STAFF'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">
                        {emp.position}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Account Detail Banner */}
          {targetEmployee && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Shield
                  className={`w-5 h-5 ${
                    targetEmployee.role === 'admin'
                      ? 'text-amber-500'
                      : 'text-slate-500'
                  }`}
                />
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {targetEmployee.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Status:{' '}
                    <strong className={targetEmployee.role === 'admin' ? 'text-amber-700' : 'text-slate-700'}>
                      {targetEmployee.role === 'admin' ? 'Administrator (Akses Penuh)' : 'Karyawan Biasa (Akses Terbatas)'}
                    </strong>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {targetEmployee.nik}
              </span>
            </div>
          )}

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Masukkan Kata Sandi:
              </label>
              <span className="text-[11px] text-slate-400">
                {targetEmployee?.role === 'admin' ? 'Sandi Admin: admin123' : 'Sandi Karyawan: user123'}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Ketik kata sandi akun..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Quick Demo Fill Buttons for Testing Convenience */}
          <div className="pt-1">
            <p className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-emerald-600" />
              Tombol Cepat Pengujian:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {admins[0] && (
                <button
                  type="button"
                  onClick={() => handleQuickFill(admins[0], 'admin123')}
                  className="py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-medium text-left truncate"
                >
                  ★ Masuk sbg Admin ({admins[0].name.split(' ')[0]})
                </button>
              )}
              {regularEmployees[0] && (
                <button
                  type="button"
                  onClick={() => handleQuickFill(regularEmployees[0], 'user123')}
                  className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 font-medium text-left truncate"
                >
                  • Masuk sbg Staff ({regularEmployees[0].name.split(' ')[0]})
                </button>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            {!forcedReason && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/20 flex items-center justify-center space-x-2 transition-all"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Buka Kunci & Masuk</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
