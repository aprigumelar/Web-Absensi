import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Clock,
  Phone,
  Mail,
  CheckCircle,
  Briefcase,
  Lock,
  Sparkles,
  Edit3,
  UserCog,
  Crown,
  Trash2,
} from 'lucide-react';

interface EmployeeDirectoryProps {
  employees: Employee[];
  currentUser: Employee;
  onOpenAddUser: () => void;
  onOpenLogin: () => void;
  onEditEmployee: (emp: Employee) => void;
  onDeleteEmployee: (emp: Employee) => Promise<void>;
}

export const EmployeeDirectory: React.FC<EmployeeDirectoryProps> = ({
  employees,
  currentUser,
  onOpenAddUser,
  onOpenLogin,
  onEditEmployee,
  onDeleteEmployee,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'employee'>('ALL');
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const adminCount = useMemo(() => employees.filter((e) => e.role === 'admin').length, [employees]);
  const staffCount = useMemo(() => employees.filter((e) => e.role !== 'admin').length, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      // Dept filter
      if (selectedDept !== 'ALL' && emp.department !== selectedDept) return false;
      // Role filter
      if (roleFilter !== 'ALL' && emp.role !== roleFilter) return false;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchNik = emp.nik.toLowerCase().includes(q);
        const matchPos = emp.position.toLowerCase().includes(q);
        const matchDept = emp.department.toLowerCase().includes(q);
        if (!matchName && !matchNik && !matchPos && !matchDept) return false;
      }
      return true;
    });
  }, [employees, selectedDept, roleFilter, searchQuery]);

  const handleDelete = async (employee: Employee) => {
    setDeleteError(null);
    if (employee.id === currentUser.id) {
      setDeleteError('Akun yang sedang digunakan tidak dapat dihapus.');
      return;
    }
    const confirmed = window.confirm(
      `Hapus data karyawan "${employee.name}"? Data profil akan dihapus dari database dan tidak dapat dipulihkan.`
    );
    if (!confirmed) return;

    try {
      setDeletingEmployeeId(employee.id);
      await onDeleteEmployee(employee);
    } catch (error: any) {
      setDeleteError(error?.message || 'Gagal menghapus data karyawan.');
    } finally {
      setDeletingEmployeeId(null);
    }
  };

  // Non-Admin Block Screen
  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 sm:p-12 text-center max-w-2xl mx-auto my-6 space-y-5 animate-in fade-in">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="bg-rose-100 text-rose-800 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Hak Akses Terbatas
          </span>
          <h3 className="text-xl font-bold text-slate-900">
            Direktori & Manajemen Karyawan Khusus Administrator
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Anda saat ini login sebagai <strong>{currentUser.name}</strong> (Karyawan Biasa).
            Sesuai kebijakan keamanan, <em>hanya Admin yang dapat melihat data karyawan, mengedit data, dan memberikan hak admin ke pengguna lain</em>.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 max-w-md mx-auto text-left space-y-1.5">
          <p className="font-semibold text-slate-800 flex items-center">
            <Lock className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Ingin Mengakses Sebagai Admin?
          </p>
          <p className="text-slate-500">
            Masuk dengan akun yang memiliki hak akses administrator (seperti <em>Budi Santoso</em> atau <em>Dewi Lestari</em>) menggunakan kata sandi <strong>admin123</strong>.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenLogin}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all"
          >
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Login Sebagai Admin (Gunakan Kata Sandi)</span>
          </button>
        </div>
      </div>
    );
  }

  // Admin View
  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-slate-900 text-emerald-400 shadow-sm">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Direktori & Manajemen Karyawan
                </h2>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1 text-amber-600" />
                  Wewenang Penuh Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {employees.length} karyawan terdaftar ({adminCount} Admin • {staffCount} Staff). Khusus Admin dapat mengedit data dan memberikan hak admin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAddUser}
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Tambah Karyawan Baru</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Cari berdasarkan nama, NIK, jabatan, divisi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-slate-50/50"
            />
          </div>

          {/* Department Filter */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="ALL">Semua Departemen</option>
              <option value="Teknologi & IT">Teknologi & IT</option>
              <option value="Keuangan & Akuntansi">Keuangan & Akuntansi</option>
              <option value="Pemasaran & Sales">Pemasaran & Sales</option>
              <option value="Sumber Daya Manusia (HR)">Sumber Daya Manusia (HR)</option>
              <option value="Operasional">Operasional</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-full sm:w-auto"
            >
              <option value="ALL">Semua Peran ({employees.length})</option>
              <option value="admin">Hanya Administrator ({adminCount})</option>
              <option value="employee">Hanya Karyawan ({staffCount})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Grid */}
      {deleteError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((emp) => {
          const isSelf = emp.id === currentUser.id;
          const isEmpAdmin = emp.role === 'admin';

          return (
            <div
              key={emp.id}
              className={`bg-white rounded-2xl border p-5 transition-all flex flex-col justify-between relative ${
                isSelf
                  ? 'border-emerald-500/80 shadow-md ring-2 ring-emerald-500/10'
                  : 'border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header Profile */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shadow-sm"
                      />
                      {isEmpAdmin && (
                        <span
                          className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 border-2 border-white rounded-full flex items-center justify-center text-[9px] font-black text-slate-900 shadow"
                          title="Administrator"
                        >
                          ★
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {emp.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        {emp.position}
                      </p>
                      <span className="inline-block text-[10px] font-mono text-slate-400 mt-0.5">
                        {emp.nik}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center ${
                      isEmpAdmin
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isEmpAdmin ? (
                      <>
                        <Crown className="w-2.5 h-2.5 mr-1 text-amber-600" />
                        ADMIN
                      </>
                    ) : (
                      'KARYAWAN'
                    )}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Departemen:</span>
                    <span className="font-semibold text-slate-800">
                      {emp.department}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      Jadwal Shift:
                    </span>
                    <span className="font-mono text-slate-800">
                      {emp.shift.startTime} - {emp.shift.endTime} (Tol. {emp.shift.graceMinutes}m)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1" />
                      Telepon:
                    </span>
                    <span className="font-mono text-slate-700">
                      {emp.phone || '-'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-1" />
                      Email:
                    </span>
                    <span className="text-[11px] text-slate-700 truncate max-w-[170px]">
                      {emp.email}
                    </span>
                  </div>

                  {/* Privilege Badge */}
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-slate-400">Wewenang:</span>
                    {isEmpAdmin ? (
                      <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center">
                        <ShieldCheck className="w-3 h-3 mr-1 text-amber-600" />
                        Kelola Karyawan & Kantor
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                        Hanya Presensi & Rekap Pribadi
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Edit Data & Beri Hak Admin (Only Admin can do this) */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[10px] text-slate-400 font-mono">
                  {isSelf ? (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Profil Anda
                    </span>
                  ) : (
                    <span>Sandi: {emp.password ? 'Terproteksi' : 'Default'}</span>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEditEmployee(emp)}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
                      title="Edit data karyawan dan ubah/berikan hak akses admin"
                    >
                      <UserCog className="w-3.5 h-3.5 text-amber-400" />
                      <span>Edit & Hak Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(emp)}
                      disabled={deletingEmployeeId === emp.id || isSelf}
                      className="inline-flex items-center justify-center p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isSelf ? 'Akun aktif tidak dapat dihapus' : 'Hapus data karyawan'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          <p className="text-sm">Tidak ada karyawan yang sesuai kriteria pencarian.</p>
        </div>
      )}
    </div>
  );
};
