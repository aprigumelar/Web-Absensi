import React, { useState } from 'react';
import { ShiftSchedule, Department, Employee } from '../types';
import {
  Clock,
  Building2,
  Plus,
  Trash2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Users,
  Briefcase,
  Layers,
  Lock,
  Calendar,
  Sparkles,
  Info,
} from 'lucide-react';

interface ShiftDepartmentManagerProps {
  shifts: ShiftSchedule[];
  departments: Department[];
  employees: Employee[];
  currentUser: Employee;
  onAddShift: (newShift: ShiftSchedule) => Promise<void>;
  onDeleteShift: (shiftId: string, fallbackShiftId?: string) => Promise<void>;
  onAddDepartment: (newDept: Department) => Promise<void>;
  onDeleteDepartment: (deptId: string, fallbackDeptName?: string) => Promise<void>;
  onOpenLogin: () => void;
}

export const ShiftDepartmentManager: React.FC<ShiftDepartmentManagerProps> = ({
  shifts,
  departments,
  employees,
  currentUser,
  onAddShift,
  onDeleteShift,
  onAddDepartment,
  onDeleteDepartment,
  onOpenLogin,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [activeTab, setActiveTab] = useState<'shifts' | 'departments'>('shifts');

  // Form State: New Shift
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [shiftDesc, setShiftDesc] = useState('');
  const [shiftLoading, setShiftLoading] = useState(false);

  // Form State: New Department
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [deptName, setDeptName] = useState('');
  const [deptDesc, setDeptDesc] = useState('');
  const [managerName, setManagerName] = useState('');
  const [deptLoading, setDeptLoading] = useState(false);

  // Delete Confirm Modal State
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'shift' | 'dept';
    id: string;
    name: string;
    affectedCount: number;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Non-Admin Screen
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
            Pengelolaan Jadwal Shift & Departemen Khusus Administrator
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Anda login sebagai <strong>{currentUser.name}</strong> (Karyawan Biasa).
            Hanya pengguna dengan wewenang <em>Administrator</em> yang dapat membuat, mengubah, dan menghapus jadwal shift serta struktur departemen perusahaan.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onOpenLogin}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md shadow-slate-900/10 transition-all"
          >
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Login Sebagai Admin</span>
          </button>
        </div>
      </div>
    );
  }

  // Handle Add Shift
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftName.trim()) {
      showFeedback('error', 'Nama jadwal shift tidak boleh kosong.');
      return;
    }

    setShiftLoading(true);
    try {
      const newShift: ShiftSchedule = {
        id: `shift-${Date.now()}`,
        name: shiftName.trim(),
        startTime,
        endTime,
        graceMinutes: Number(graceMinutes) || 15,
        description: shiftDesc.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await onAddShift(newShift);
      showFeedback('success', `Jadwal shift "${shiftName}" berhasil dibuat dan disimpan!`);
      setShiftName('');
      setShiftDesc('');
      setStartTime('08:00');
      setEndTime('17:00');
      setGraceMinutes(15);
      setIsAddShiftOpen(false);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Gagal menambahkan jadwal shift.');
    } finally {
      setShiftLoading(false);
    }
  };

  // Handle Add Department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) {
      showFeedback('error', 'Nama departemen tidak boleh kosong.');
      return;
    }

    // Check duplicate
    const exists = departments.some((d) => d.name.toLowerCase() === deptName.trim().toLowerCase());
    if (exists) {
      showFeedback('error', `Departemen "${deptName}" sudah terdaftar.`);
      return;
    }

    setDeptLoading(true);
    try {
      const newDept: Department = {
        id: `dept-${Date.now()}`,
        name: deptName.trim(),
        description: deptDesc.trim() || undefined,
        managerName: managerName.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      await onAddDepartment(newDept);
      showFeedback('success', `Departemen "${deptName}" berhasil ditambahkan!`);
      setDeptName('');
      setDeptDesc('');
      setManagerName('');
      setIsAddDeptOpen(false);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Gagal menambahkan departemen.');
    } finally {
      setDeptLoading(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);

    try {
      if (itemToDelete.type === 'shift') {
        if (shifts.length <= 1) {
          throw new Error('Tidak dapat menghapus shift ini karena minimal harus ada 1 jadwal shift di sistem.');
        }
        const fallback = shifts.find((s) => s.id !== itemToDelete.id);
        await onDeleteShift(itemToDelete.id, fallback?.id);
        showFeedback('success', `Jadwal shift "${itemToDelete.name}" berhasil dihapus.`);
      } else {
        if (departments.length <= 1) {
          throw new Error('Tidak dapat menghapus departemen ini karena minimal harus ada 1 departemen di sistem.');
        }
        const fallback = departments.find((d) => d.id !== itemToDelete.id);
        await onDeleteDepartment(itemToDelete.id, fallback?.name);
        showFeedback('success', `Departemen "${itemToDelete.name}" berhasil dihapus.`);
      }
      setItemToDelete(null);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Gagal menghapus data.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-slate-900 text-amber-400 shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Manajemen Jadwal Shift & Departemen
                </h2>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1 text-amber-600" />
                  Khusus Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin memiliki kewenangan penuh membuat dan menghapus jadwal shift jam kerja serta unit departemen/divisi perusahaan.
              </p>
            </div>
          </div>

          {/* Quick Action to Add */}
          <div className="flex items-center space-x-2">
            {activeTab === 'shifts' ? (
              <button
                type="button"
                onClick={() => setIsAddShiftOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Jadwal Shift Baru</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddDeptOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Departemen Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('shifts')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'shifts'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Jadwal Shift Kerja ({shifts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'departments'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Daftar Departemen ({departments.length})</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center space-x-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* ----------------- TAB 1: JADWAL SHIFT KERJA ----------------- */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan <strong>{shifts.length} jadwal shift</strong> operasional aktif.
            </span>
            <span className="text-[11px] text-amber-800 font-medium">
              *Shift yang dihapus akan otomatis mengalihkan karyawan terkait ke shift utama
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map((s) => {
              const assignedEmployees = employees.filter((e) => e.shift?.name === s.name);

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">ID: {s.id}</span>
                        </div>
                      </div>

                      {s.isDefault && (
                        <span className="text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                          DEFAULT
                        </span>
                      )}
                    </div>

                    {/* Shift Times */}
                    <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Jam Kerja:</span>
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {s.startTime} - {s.endTime}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Toleransi Terlambat:</span>
                        <span className="font-mono text-amber-700 font-semibold">
                          {s.graceMinutes} Menit
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {s.description && (
                      <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                        {s.description}
                      </p>
                    )}

                    {/* Assigned Employees */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Karyawan Terdaftar:
                      </span>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        {assignedEmployees.length} Orang
                      </span>
                    </div>

                    {assignedEmployees.length > 0 && (
                      <div className="mt-2 flex -space-x-1.5 overflow-hidden py-1">
                        {assignedEmployees.slice(0, 5).map((emp) => (
                          <img
                            key={emp.id}
                            src={emp.avatarUrl}
                            alt={emp.name}
                            title={`${emp.name} (${emp.position})`}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                          />
                        ))}
                        {assignedEmployees.length > 5 && (
                          <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                            +{assignedEmployees.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {assignedEmployees.length > 0 ? `${assignedEmployees.length} staf aktif` : 'Belum ada staf'}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setItemToDelete({
                          type: 'shift',
                          id: s.id,
                          name: s.name,
                          affectedCount: assignedEmployees.length,
                        })
                      }
                      disabled={shifts.length <= 1}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title={
                        shifts.length <= 1
                          ? 'Tidak dapat menghapus shift satu-satunya'
                          : `Hapus jadwal shift ${s.name}`
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Shift</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- TAB 2: DAFTAR DEPARTEMEN ----------------- */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan <strong>{departments.length} unit departemen</strong> perusahaan.
            </span>
            <span className="text-[11px] text-amber-800 font-medium">
              *Departemen yang dihapus akan mengalihkan karyawan terkait ke departemen utama
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => {
              const deptEmployees = employees.filter((e) => e.department === d.name);

              return (
                <div
                  key={d.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{d.name}</h4>
                          <span className="text-[10px] font-mono text-slate-400">ID: {d.id}</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                        Divisi
                      </span>
                    </div>

                    {/* Details */}
                    {d.description && (
                      <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                        {d.description}
                      </p>
                    )}

                    {d.managerName && (
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Pimpinan / PIC:</span>
                        <span className="font-semibold text-slate-800">{d.managerName}</span>
                      </div>
                    )}

                    {/* Assigned Employees */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center">
                        <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Karyawan Divisi:
                      </span>
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                        {deptEmployees.length} Orang
                      </span>
                    </div>

                    {deptEmployees.length > 0 && (
                      <div className="mt-2 flex -space-x-1.5 overflow-hidden py-1">
                        {deptEmployees.slice(0, 5).map((emp) => (
                          <img
                            key={emp.id}
                            src={emp.avatarUrl}
                            alt={emp.name}
                            title={`${emp.name} (${emp.position})`}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover"
                          />
                        ))}
                        {deptEmployees.length > 5 && (
                          <div className="h-6 w-6 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                            +{deptEmployees.length - 5}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      {deptEmployees.length > 0 ? `${deptEmployees.length} karyawan` : 'Belum ada karyawan'}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setItemToDelete({
                          type: 'dept',
                          id: d.id,
                          name: d.name,
                          affectedCount: deptEmployees.length,
                        })
                      }
                      disabled={departments.length <= 1}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title={
                        departments.length <= 1
                          ? 'Tidak dapat menghapus departemen satu-satunya'
                          : `Hapus departemen ${d.name}`
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Dept</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ----------------- MODAL: TAMBAH SHIFT BARU ----------------- */}
      {isAddShiftOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Buat Jadwal Shift Baru</h3>
                  <p className="text-[11px] text-slate-500">Tentukan jam masuk, jam pulang, dan toleransi keterlambatan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddShiftOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Jadwal Shift *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Shift Pagi Gudang, Shift Malam IT, Shift Middle"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Jam Mulai (Masuk) *
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Jam Selesai (Pulang) *
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Toleransi Keterlambatan (Menit) *
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  required
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Presensi setelah jam masuk + toleransi akan ditandai sebagai status TERLAMBAT.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Keterangan / Deskripsi Shift (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Keterangan peruntukan shift ini..."
                  value={shiftDesc}
                  onChange={(e) => setShiftDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddShiftOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={shiftLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md disabled:opacity-50"
                >
                  {shiftLoading ? 'Menyimpan...' : 'Simpan Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL: TAMBAH DEPARTEMEN BARU ----------------- */}
      {isAddDeptOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Buat Departemen / Divisi Baru</h3>
                  <p className="text-[11px] text-slate-500">Tambahkan unit divisi kerja baru ke struktur perusahaan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddDeptOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Departemen / Divisi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Riset & Inovasi (R&D), Legal & Compliance, Logistik"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Deskripsi Tanggung Jawab (Opsional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Contoh: Mengelola inovasi produk dan riset teknologi baru..."
                  value={deptDesc}
                  onChange={(e) => setDeptDesc(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Pimpinan / Manager Divisi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Nama PIC atau Manager Divisi"
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddDeptOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={deptLoading}
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md disabled:opacity-50"
                >
                  {deptLoading ? 'Menyimpan...' : 'Simpan Departemen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------- MODAL KONFIRMASI HAPUS ----------------- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">
                Hapus {itemToDelete.type === 'shift' ? 'Jadwal Shift' : 'Departemen'}?
              </h3>
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin menghapus <strong>"{itemToDelete.name}"</strong>?
              </p>
            </div>

            {itemToDelete.affectedCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Perhatian:</strong> Terdapat <strong>{itemToDelete.affectedCount} karyawan</strong> yang saat ini terdaftar pada {itemToDelete.type === 'shift' ? 'shift' : 'departemen'} ini. Karyawan tersebut akan dialihkan secara aman ke {itemToDelete.type === 'shift' ? 'shift standar' : 'departemen alternatif'}.
                </p>
              </div>
            )}

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md disabled:opacity-50"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
