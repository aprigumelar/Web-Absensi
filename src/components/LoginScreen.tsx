import React, { useState, useMemo } from 'react';
import { Employee, OfficeLocation } from '../types';
import {
  Lock,
  Shield,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  User,
  Building,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Camera,
  MapPin,
  Database,
  Search,
  Fingerprint,
} from 'lucide-react';

interface LoginScreenProps {
  employees: Employee[];
  office: OfficeLocation;
  isDbConnected: boolean;
  onLoginSuccess: (emp: Employee) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  employees,
  office,
  isDbConnected,
  onLoginSuccess,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'employee'>('all');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.nik.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || emp.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [employees, searchQuery, roleFilter]);

  const targetEmployee = employees.find((e) => e.id === selectedEmpId) || employees[0];

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetEmployee) {
      setErrorMsg('Pilih akun pengguna terlebih dahulu.');
      return;
    }

    const expectedPassword =
      targetEmployee.password || (targetEmployee.role === 'admin' ? 'admin123' : 'user123');

    if (passwordInput.trim() !== expectedPassword) {
      setErrorMsg(
        `Kata sandi salah untuk ${targetEmployee.name}. ${
          targetEmployee.role === 'admin'
            ? 'Akun Administrator terkunci (Gunakan: admin123)'
            : 'Akun Karyawan terkunci (Gunakan: user123)'
        }`
      );
      return;
    }

    setErrorMsg(null);
    setIsAuthenticating(true);
    setSuccessMsg(`Otentikasi berhasil! Mengalihkan ke sistem presensi...`);

    setTimeout(() => {
      onLoginSuccess(targetEmployee);
    }, 600);
  };

  const handleQuickSelect = (emp: Employee, defaultPwd: string) => {
    setSelectedEmpId(emp.id);
    setPasswordInput(defaultPwd);
    setErrorMsg(null);
  };

  const admins = employees.filter((e) => e.role === 'admin');
  const regularEmployees = employees.filter((e) => e.role !== 'admin');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white relative overflow-hidden">
      {/* Background Ambience / Subtle Lighting Accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-4 sm:px-8 py-4 relative z-10">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-3">
          <div className="flex min-w-0 items-center space-x-2 sm:space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="flex min-w-0 items-center gap-2 text-sm font-bold tracking-tight text-white sm:text-base">
                <span className="truncate">Absensi Karyawan Tecso</span>
                <span className="hidden shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 sm:inline">
                  v1.0 Pro
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                PT Technology Solutions Indonesia • Geofencing & Biometrik Wajah
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            <div className="hidden items-center space-x-2 rounded-xl border border-slate-800 bg-slate-900/90 px-3 py-1.5 text-slate-300 sm:flex">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">
                Kantor: <strong>{office.name}</strong>
              </span>
            </div>
            <div
              className={`flex shrink-0 items-center space-x-1.5 rounded-xl border px-2 py-1.5 text-[10px] font-medium sm:px-3 sm:text-[11px] ${
                isDbConnected
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400'
                  : 'bg-slate-800/60 border-slate-700 text-slate-300'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isDbConnected ? 'Cloud Firestore Aktif' : 'Penyimpanan Aktif'}</span>
              <span className="sm:hidden">Aktif</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Authentication Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        <div className="grid w-full max-w-4xl grid-cols-1 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl backdrop-blur-xl lg:grid-cols-12">
          {/* Left Column: Account Selection & Search */}
          <div className="flex flex-col justify-between border-b border-slate-800 bg-slate-900/40 p-4 sm:p-7 lg:col-span-6 lg:border-b-0 lg:border-r">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    <span>Pilih Akun Pengguna</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Silakan pilih profil Anda untuk melakukan login
                  </p>
                </div>
                <span className="text-[11px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                  {filteredEmployees.length} Pengguna
                </span>
              </div>

              {/* Search & Filter Controls */}
              <div className="space-y-2 mb-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama, NIK, atau divisi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center space-x-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setRoleFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      roleFilter === 'all'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('admin')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      roleFilter === 'admin'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ★ Admin ({admins.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleFilter('employee')}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      roleFilter === 'employee'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Staff ({regularEmployees.length})
                  </button>
                </div>
              </div>

              {/* Employees List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Tidak ditemukan karyawan dengan kata kunci tersebut.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
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
                        className={`w-full flex items-center space-x-3 p-2.5 rounded-2xl border text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-950/50 border-emerald-500 text-white ring-2 ring-emerald-500/20 shadow-md'
                            : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/80'
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={emp.avatarUrl}
                            alt={emp.name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-700"
                          />
                          {isAdmin && (
                            <span
                              className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[8px] px-1 rounded-full shadow"
                              title="Administrator"
                            >
                              ★
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-white truncate">
                              {emp.name}
                            </p>
                            <span
                              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                isAdmin
                                  ? 'bg-amber-400 text-amber-950'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {isAdmin ? 'ADMIN' : 'STAFF'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {emp.position} • {emp.department}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Demo Fill Buttons */}
            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                <span>Uji Coba 1-Klik (Demo Testing):</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {admins[0] && (
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(admins[0], 'admin123')}
                    className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-medium text-left truncate transition-colors flex items-center space-x-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Admin ({admins[0].name.split(' ')[0]})</span>
                  </button>
                )}
                {regularEmployees[0] && (
                  <button
                    type="button"
                    onClick={() => handleQuickSelect(regularEmployees[0], 'user123')}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-left truncate transition-colors flex items-center space-x-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">Staff ({regularEmployees[0].name.split(' ')[0]})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Password Authentication Form */}
          <div className="flex flex-col justify-between bg-slate-950 p-4 sm:p-8 lg:col-span-6">
            <div>
              {/* Target Profile Summary */}
              {targetEmployee ? (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={targetEmployee.avatarUrl}
                      alt={targetEmployee.name}
                      className="w-14 h-14 rounded-2xl object-cover ring-2 ring-emerald-500/40 shadow"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-bold text-white truncate">
                          {targetEmployee.name}
                        </h3>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            targetEmployee.role === 'admin'
                              ? 'bg-amber-400 text-amber-950 font-mono'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {targetEmployee.role === 'admin' ? 'ADMIN' : 'KARYAWAN'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {targetEmployee.position} • {targetEmployee.department}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        NIK: {targetEmployee.nik}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Shift: {targetEmployee.shift.name}</span>
                    <span>
                      Jam: {targetEmployee.shift.startTime} - {targetEmployee.shift.endTime}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-6 text-center text-xs text-slate-400">
                  Pilih akun di sebelah kiri untuk melanjutkan.
                </div>
              )}

              {/* Notifications */}
              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Password Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kata Sandi Akun</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {targetEmployee?.role === 'admin'
                        ? 'Default Admin: admin123'
                        : 'Default Karyawan: user123'}
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan kata sandi..."
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full text-xs pl-10 pr-10 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 font-mono tracking-wide"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                  <p className="flex items-center text-slate-300 font-medium">
                    <Shield className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    Sistem Keamanan Terintegrasi:
                  </p>
                  <p>• Akun Administrator memiliki wewenang penuh (tambah user, shift, titik kantor).</p>
                  <p>• Akun Karyawan hanya dapat melakukan presensi dan melihat rekap personal.</p>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating || !targetEmployee}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Masuk ke Sistem Presensi</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-900 text-center">
              <p className="text-[11px] text-slate-500">
                Lupa kata sandi? Hubungi Administrator SDM untuk reset kredensial.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/60 py-3 px-4 text-center text-xs text-slate-500 relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 • PT Technology Solution Indonesia • Dilindungi Hak Cipta</p>
          <div className="flex items-center space-x-4 text-[11px] text-slate-400">
            <span className="flex items-center">
              <Camera className="w-3 h-3 mr-1 text-emerald-400" />
              Biometrik Kamera
            </span>
            <span className="flex items-center">
              <MapPin className="w-3 h-3 mr-1 text-blue-400" />
              Geofence Radius
            </span>
            <span className="flex items-center">
              <Database className="w-3 h-3 mr-1 text-purple-400" />
              Cloud Firestore
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
