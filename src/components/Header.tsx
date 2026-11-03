import React, { useState, useEffect } from 'react';
import { Employee, OfficeLocation } from '../types';
import {
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  MapPin,
  Camera,
  ChevronDown,
  Building2,
  Calendar,
  UserPlus,
  Shield,
  Database,
  Users,
  Lock,
  KeyRound,
  UserCog,
  Sliders,
  LogOut,
  MoreHorizontal,
} from 'lucide-react';

interface HeaderProps {
  currentTab: 'presensi' | 'rekap' | 'lokasi' | 'karyawan' | 'shift_dept';
  setCurrentTab: (tab: 'presensi' | 'rekap' | 'lokasi' | 'karyawan' | 'shift_dept') => void;
  activeEmployee: Employee;
  employees: Employee[];
  onSelectEmployeeWithAuth: (emp: Employee) => void;
  office: OfficeLocation;
  onOpenAddUser: () => void;
  onOpenLogin: () => void;
  onLogout?: () => void;
  isDbConnected: boolean;
  onEditEmployee?: (emp: Employee) => void;
  onOpenBiometric?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  activeEmployee,
  employees,
  onSelectEmployeeWithAuth,
  office,
  onOpenAddUser,
  onOpenLogin,
  onLogout,
  isDbConnected,
  onEditEmployee,
  onOpenBiometric,
}) => {
  const [time, setTime] = useState(new Date());
  const [showEmployeeMenu, setShowEmployeeMenu] = useState(false);
  const [showMobileMore, setShowMobileMore] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isAdmin = activeEmployee.role === 'admin';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between h-16 sm:h-20">

          {/* Brand Logo & Live Time */}
          <div className="flex min-w-0 items-center space-x-2 sm:space-x-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="max-w-[145px] truncate font-bold text-sm sm:max-w-none sm:text-lg tracking-tight text-white">
                  Absensi
                </span>
                
              {/* Date & Time */}
              </div>
              <div className="hidden items-center text-xs text-slate-400 space-x-2 sm:flex">
                <span className="flex items-center text-emerald-400 font-mono font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {formattedDate} {formattedTime}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <nav className="hidden lg:flex items-center bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setCurrentTab('presensi')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'presensi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Absensi</span>
            </button>

            <button
              onClick={() => setCurrentTab('rekap')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'rekap'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Laporan</span>
              {!isAdmin && (
                <span className="bg-slate-700 text-slate-300 text-[9px] px-1.5 py-0.2 rounded">
                  Pribadi
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentTab('lokasi')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'lokasi'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Kantor</span>
            </button>

            {/* Admin-Only Tab for Employee Directory */}
            <button
              onClick={() => setCurrentTab('karyawan')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'karyawan'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isAdmin
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={isAdmin ? 'Daftar Seluruh Karyawan (Admin)' : 'Terkunci (Hanya Admin)'}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Karyawan</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  isAdmin
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-slate-700 text-slate-400 flex items-center'
                }`}
              >
                {!isAdmin && <Lock className="w-2.5 h-2.5 mr-0.5" />}
                ADMIN
              </span>
            </button>

            {/* Admin-Only Tab for Shift & Department Management */}
            <button
              onClick={() => setCurrentTab('shift_dept')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'shift_dept'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : isAdmin
                  ? 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={isAdmin ? 'Kelola Shift & Departemen (Admin)' : 'Terkunci (Hanya Admin)'}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Shift</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                  isAdmin
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-slate-700 text-slate-400 flex items-center'
                }`}
              >
                {!isAdmin && <Lock className="w-2.5 h-2.5 mr-0.5" />}
                ADMIN
              </span>
            </button>
          </nav>

          {/* User & Admin Controls */}
          <div className="flex shrink-0 items-center space-x-1 sm:space-x-2 sm:px-2">
            {/* Quick Login / Lock Button */}
            <button
              type="button"
              onClick={onOpenLogin}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shadow-sm"
              title="Kunci sesi atau login dengan kata sandi"
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Kunci / Login Sandi</span>
            </button>

            {/* Employee Profile Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowEmployeeMenu(!showEmployeeMenu)}
                className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 px-2.5 py-1.5 rounded-xl transition-all text-left"
              >
                <div className="relative">
                  <img
                    src={activeEmployee.avatarUrl}
                    alt={activeEmployee.name}
                    className="h-8 w-10 rounded-lg object-cover ring-2 ring-emerald-500/50 sm:w-16"
                  />
                  {isAdmin && (
                    <span
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-950"
                      title="Admin Terproteksi Sandi"
                    >
                      ★
                    </span>
                  )}
                </div>

                  <div className="hidden sm:block text-left">
                  <div className="flex items-center space-x-1">
                    <p className="text-xs font-semibold text-white leading-tight truncate max-w-[110px]">
                      {activeEmployee.name.split(',')[0]}
                    </p>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        isAdmin
                          ? 'bg-amber-400 text-amber-950 font-mono'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {isAdmin ? 'ADMIN' : 'STAFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-none truncate max-w-[110px] mt-0.5">
                    {activeEmployee.position}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* Dropdown Employee Selector with Password Guard */}
              {showEmployeeMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 divide-y divide-slate-800">
                  <div className="px-3.5 py-2.5 bg-slate-800/60">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center">
                        <Lock className="w-3 h-3 mr-1 text-emerald-400" />
                        Ganti Akun (Butuh Sandi)
                      </p>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowEmployeeMenu(false);
                            onOpenAddUser();
                          }}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center"
                        >
                          <UserPlus className="w-3 h-3 mr-1" />
                          + User
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Peralihan ke akun Admin dikunci kata sandi (admin123)
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                    {employees.map((emp) => (
                      <div
                        key={emp.id}
                        className={`w-full flex items-center justify-between px-3.5 py-2 hover:bg-slate-800 text-left transition-colors ${
                          emp.id === activeEmployee.id
                            ? 'bg-emerald-950/40 text-emerald-300'
                            : 'text-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setShowEmployeeMenu(false);
                            onSelectEmployeeWithAuth(emp);
                          }}
                          className="flex items-center space-x-3 min-w-0 flex-1 text-left"
                        >
                          <img
                            src={emp.avatarUrl}
                            alt={emp.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-600"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium truncate">{emp.name}</p>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded ml-1 shrink-0 ${
                                  emp.role === 'admin'
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {emp.role === 'admin' ? 'ADMIN' : 'STAFF'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 truncate">
                              {emp.department} • {emp.nik}
                            </p>
                          </div>
                        </button>

                        {/* If current user is Admin, allow editing this employee directly */}
                        {isAdmin && onEditEmployee && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEmployeeMenu(false);
                              onEditEmployee(emp);
                            }}
                            className="p-1.5 ml-2 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-700 transition-colors shrink-0"
                            title={`Edit ${emp.name} & Hak Akses`}
                          >
                            <UserCog className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="p-2 bg-slate-950/60 space-y-1.5 text-center">
                    {onOpenBiometric && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowEmployeeMenu(false);
                          onOpenBiometric();
                        }}
                        className="w-full py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-xs font-semibold text-emerald-300 flex items-center justify-center space-x-1.5 border border-emerald-800/40"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Ganti Biometrik Saya</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowEmployeeMenu(false);
                        onOpenLogin();
                      }}
                      className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 flex items-center justify-center space-x-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Otentikasi Sandi Manual</span>
                    </button>
                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowEmployeeMenu(false);
                          onLogout();
                        }}
                        className="w-full py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-xs font-semibold text-rose-300 flex items-center justify-center space-x-1.5 border border-rose-800/40"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Keluar / Ganti Akun</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Direct Logout Action Button */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="hidden items-center space-x-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 shadow-sm transition-all hover:bg-rose-500/20 sm:inline-flex"
                title="Keluar dari sesi akun saat ini"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed inset-x-0 bottom-0 z-40 flex lg:hidden items-stretch justify-around border-t border-slate-700/80 bg-slate-950/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(15,23,42,0.24)] backdrop-blur-xl">
            <button
              onClick={() => setCurrentTab('presensi')}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors ${
                currentTab === 'presensi'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>Absensi</span>
            </button>
            <button
              onClick={() => setCurrentTab('rekap')}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors ${
                currentTab === 'rekap'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Laporan</span>
            </button>
            <button
              onClick={() => setCurrentTab('lokasi')}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors ${
                currentTab === 'lokasi'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapPin className="h-4 w-4" />
              <span>Titik</span>
            </button>
            <button
              onClick={() => setShowMobileMore(!showMobileMore)}
              className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors ${
                showMobileMore || currentTab === 'karyawan' || currentTab === 'shift_dept'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span>Lainnya</span>
            </button>

          {showMobileMore && (
            <div className="absolute bottom-full right-2 mb-2 w-56 rounded-2xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
              <button
                onClick={() => {
                  setCurrentTab('karyawan');
                  setShowMobileMore(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                <Users className="h-4 w-4 text-emerald-400" />
                <span>Direktori Karyawan</span>
              </button>
              <button
                onClick={() => {
                  setCurrentTab('shift_dept');
                  setShowMobileMore(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                <Sliders className="h-4 w-4 text-emerald-400" />
                <span>Shift & Departemen</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobileMore(false);
                  onOpenLogin();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold text-emerald-300 hover:bg-slate-800"
              >
                <KeyRound className="h-4 w-4" />
                <span>Login dengan Sandi</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
