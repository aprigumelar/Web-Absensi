import React, { useState, useEffect } from 'react';
import { Employee, ShiftSchedule, Department } from '../types';
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  User,
  Mail,
  Phone,
  Clock,
  Briefcase,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  currentUser: Employee;
  totalAdminsCount: number;
  shifts?: ShiftSchedule[];
  departments?: Department[];
  onSaveEmployee: (updated: Employee) => Promise<void>;
}

const DEFAULT_DEPARTMENTS: string[] = [
  'Teknologi & IT',
  'Keuangan & Akuntansi',
  'Pemasaran & Sales',
  'Sumber Daya Manusia (HR)',
  'Operasional',
];

const PRESET_AVATARS = [
  { label: 'Pria Profesional 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&fit=crop&q=80' },
  { label: 'Wanita Profesional 1', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&fit=crop&q=80' },
  { label: 'Pria Profesional 2', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&q=80' },
  { label: 'Wanita Profesional 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&fit=crop&q=80' },
  { label: 'Pria Muda', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&fit=crop&q=80' },
  { label: 'Wanita Modern', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&fit=crop&q=80' },
];

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  employee,
  currentUser,
  totalAdminsCount,
  shifts = [],
  departments = [],
  onSaveEmployee,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('employee');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState<Employee['department']>('Teknologi & IT');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [shiftName, setShiftName] = useState('Shift Reguler');
  const [startTime, setStartTime] = useState('08:30');
  const [endTime, setEndTime] = useState('17:30');
  const [graceMinutes, setGraceMinutes] = useState(15);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync state with selected employee
  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setNik(employee.nik);
      setRole(employee.role);
      setPosition(employee.position);
      setDepartment(employee.department);
      setEmail(employee.email);
      setPhone(employee.phone || '');
      setPassword(employee.password || (employee.role === 'admin' ? 'admin123' : 'karyawan123'));
      setAvatarUrl(employee.avatarUrl);
      setShiftName(employee.shift?.name || 'Shift Reguler');
      setStartTime(employee.shift?.startTime || '08:30');
      setEndTime(employee.shift?.endTime || '17:30');
      setGraceMinutes(employee.shift?.graceMinutes ?? 15);
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  // Non-admin security check
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-slate-900">Akses Ditolak</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hanya pengguna dengan peran <strong>Administrator</strong> yang memiliki wewenang untuk mengedit data karyawan dan memberikan hak admin lain.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>
    );
  }

  const isDemotingOnlyAdmin =
    employee.role === 'admin' && role === 'employee' && totalAdminsCount <= 1;

  const isSelf = employee.id === currentUser.id;
  const isGrantingAdmin = employee.role === 'employee' && role === 'admin';
  const isRevokingAdmin = employee.role === 'admin' && role === 'employee';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Nama karyawan tidak boleh kosong.');
      return;
    }

    if (!nik.trim()) {
      setErrorMessage('NIK tidak boleh kosong.');
      return;
    }

    if (isDemotingOnlyAdmin) {
      setErrorMessage(
        'Tidak dapat mencabut hak admin untuk user ini karena merupakan satu-satunya Administrator di sistem. Berikan hak admin pada user lain terlebih dahulu.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const updated: Employee = {
        ...employee,
        name: name.trim(),
        nik: nik.trim(),
        role,
        position: position.trim(),
        department,
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim() || (role === 'admin' ? 'admin123' : 'karyawan123'),
        avatarUrl: avatarUrl || employee.avatarUrl,
        enrolledFaceUrl: avatarUrl || employee.enrolledFaceUrl,
        shift: {
          name: shiftName.trim() || 'Shift Reguler',
          startTime,
          endTime,
          graceMinutes: Number(graceMinutes) || 15,
        },
      };

      await onSaveEmployee(updated);
      setSuccessMessage('Data karyawan dan hak akses berhasil diperbarui!');
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err?.message || 'Gagal menyimpan perubahan data karyawan.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/80 p-2 backdrop-blur-sm sm:p-4">
      <div className="relative my-2 flex max-h-[calc(100dvh-1rem)] w-full max-w-2xl flex-col rounded-3xl border border-slate-100 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 sm:my-8 sm:p-7">
        {/* Top Decorative Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-500 rounded-t-3xl" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-slate-900 text-amber-400 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-900 text-base">
                  Edit Karyawan & Hak Akses
                </h3>
                <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                  Khusus Admin
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Kelola profil, jadwal shift, dan kewenangan administrator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2 shrink-0">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 mt-4 space-y-5 flex-1">
          {/* Current Account Summary Banner */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img
                src={avatarUrl || employee.avatarUrl}
                alt={employee.name}
                className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-200 shadow-sm"
              />
              <div>
                <p className="text-xs font-bold text-slate-900">{employee.name}</p>
                <p className="text-[11px] text-slate-500">{employee.position} • {employee.department}</p>
                <span className="text-[10px] font-mono text-slate-400">NIK: {employee.nik}</span>
              </div>
            </div>
            {isSelf && (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-1 rounded-lg font-bold">
                Akun Anda Sendiri
              </span>
            )}
          </div>

          {/* Section 1: Hak Akses & Peran (Role Management - Core User Request) */}
          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-950 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Pengaturan Hak Akses Administrator</span>
              </label>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Otorisasi Khusus Admin
              </span>
            </div>

            <p className="text-[11px] text-amber-900 leading-relaxed">
              Sebagai Admin, Anda dapat memberikan wewenang Administrator kepada karyawan ini atau menurunkannya menjadi karyawan biasa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Option: Karyawan Biasa */}
              <button
                type="button"
                onClick={() => {
                  setRole('employee');
                  setErrorMessage(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  role === 'employee'
                    ? 'border-slate-800 bg-white shadow-sm ring-2 ring-slate-900/10'
                    : 'border-amber-200/80 bg-amber-50/50 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    Karyawan Biasa (Staff)
                  </span>
                  {role === 'employee' && (
                    <CheckCircle2 className="w-4 h-4 text-slate-900" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Akses standar: Presensi wajah & GPS, dan hanya dapat melihat rekap presensi milik pribadi.
                </p>
              </button>

              {/* Option: Administrator */}
              <button
                type="button"
                onClick={() => {
                  setRole('admin');
                  setErrorMessage(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  role === 'admin'
                    ? 'border-amber-500 bg-white shadow-sm ring-2 ring-amber-500/20'
                    : 'border-amber-200/80 bg-amber-50/50 hover:bg-white text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-amber-950 flex items-center">
                    <Shield className="w-3.5 h-3.5 mr-1 text-amber-600" />
                    Administrator (Hak Penuh)
                  </span>
                  {role === 'admin' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <p className="text-[10px] text-amber-800/80 leading-normal">
                  Wewenang penuh: Edit karyawan, beri hak admin, kelola titik radius kantor, dan rekap seluruh staf.
                </p>
              </button>
            </div>

            {/* Notification when granting admin */}
            {isGrantingAdmin && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Pemberian Hak Admin:</strong> Karyawan ini akan langsung memperoleh hak akses penuh Administrator setelah Anda menekan tombol simpan.
                </p>
              </div>
            )}

            {/* Warning when revoking admin */}
            {isRevokingAdmin && (
              <div className="p-3 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Pencabutan Hak Admin:</strong> Pengguna ini tidak lagi dapat mengakses direktori karyawan, pengaturan lokasi, ataupun rekap perusahaan.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: Data Pribadi & Pekerjaan */}
          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Data Profil & Kontak
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor Induk Karyawan (NIK)
                </label>
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Departemen / Divisi *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                  >
                    {departments.length > 0
                      ? departments.map((dept) => (
                          <option key={dept.id} value={dept.name}>
                            {dept.name}
                          </option>
                        ))
                      : DEFAULT_DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Jabatan
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Email Kantor
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor WhatsApp / Telepon
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-xs font-mono pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Kata Sandi Akun (Password Management) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center">
                <KeyRound className="w-3.5 h-3.5 mr-1 text-slate-600" />
                Kata Sandi Akun (Login)
              </label>
              <span className="text-[10px] text-slate-500">
                {role === 'admin' ? 'Default Admin: admin123' : 'Default Staff: user123'}
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kata sandi akun..."
                className="w-full text-xs font-mono pl-3 pr-10 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500">
              Admin dapat mereset kata sandi karyawan kapan saja jika diperlukan.
            </p>
          </div>

          {/* Section 4: Jadwal Shift Kerja */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-800 flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Jadwal Shift & Aturan Keterlambatan
              </p>
              {shifts.length > 0 && (
                <span className="text-[10px] text-slate-500">Master shift aktif</span>
              )}
            </div>

            {shifts.length > 0 && (
              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Pilih dari Template Shift Master:
                </label>
                <select
                  value={shiftName}
                  onChange={(e) => {
                    const found = shifts.find((s) => s.name === e.target.value);
                    if (found) {
                      setShiftName(found.name);
                      setStartTime(found.startTime);
                      setEndTime(found.endTime);
                      setGraceMinutes(found.graceMinutes);
                    } else {
                      setShiftName(e.target.value);
                    }
                  }}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.startTime} - {s.endTime}, Toleransi {s.graceMinutes}m)
                    </option>
                  ))}
                  <option value={shiftName}>Tetap Menggunakan: {shiftName}</option>
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Nama Shift
                </label>
                <input
                  type="text"
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Jam Mulai
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Jam Pulang
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Toleransi (Menit)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={graceMinutes}
                  onChange={(e) => setGraceMinutes(Number(e.target.value))}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Foto Biometrik & Avatar */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <label className="text-xs font-bold text-slate-800 flex items-center">
              <ImageIcon className="w-3.5 h-3.5 mr-1 text-slate-600" />
              Pilih Foto Biometrik / Avatar
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_AVATARS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(p.url)}
                  className={`relative rounded-xl overflow-hidden ring-2 transition-all ${
                    avatarUrl === p.url ? 'ring-emerald-500 scale-105 shadow-sm' : 'ring-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p.url} alt={p.label} className="w-10 h-10 object-cover" />
                </button>
              ))}
            </div>
            <div className="pt-1">
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="Atau masukkan URL foto kustom..."
                className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </form>

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            Peran setelah disimpan:{' '}
            <strong className={role === 'admin' ? 'text-amber-700' : 'text-slate-700'}>
              {role === 'admin' ? 'Administrator' : 'Karyawan'}
            </strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md shadow-slate-900/10 flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
