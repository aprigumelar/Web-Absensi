import React, { useState, useEffect } from 'react';
import { Employee, ShiftSchedule, Department } from '../types';
import {
  UserPlus,
  Shield,
  ShieldAlert,
  Check,
  X,
  Camera,
  Briefcase,
  Clock,
} from 'lucide-react';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Employee;
  shifts?: ShiftSchedule[];
  departments?: Department[];
  onAddEmployee: (newEmployee: Employee) => Promise<void>;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  shifts = [],
  departments = [],
  onAddEmployee,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const defaultDeptName = departments.length > 0 ? departments[0].name : 'Teknologi & IT';
  const defaultShift = shifts.length > 0 ? shifts[0] : null;

  const [nik, setNik] = useState(`EMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'employee' | 'admin'>('employee');
  const [position, setPosition] = useState('');
  const [department, setDepartment] = useState<string>(defaultDeptName);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+62 8');
  const [password, setPassword] = useState('karyawan123');
  const [shiftName, setShiftName] = useState(defaultShift ? defaultShift.name : 'Shift Reguler');
  const [startTime, setStartTime] = useState(defaultShift ? defaultShift.startTime : '08:30');
  const [endTime, setEndTime] = useState(defaultShift ? defaultShift.endTime : '17:30');
  const [graceMinutes, setGraceMinutes] = useState(defaultShift ? defaultShift.graceMinutes : 15);
  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80'
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (departments.length > 0 && !departments.some((d) => d.name === department)) {
      setDepartment(departments[0].name);
    }
  }, [departments]);

  if (!isOpen) return null;

  const avatarPresets = [
    { label: 'Pria 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' },
    { label: 'Wanita 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80' },
    { label: 'Pria 2', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80' },
    { label: 'Wanita 2', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      setErrorMsg('Akses ditolak. Hanya akun Admin yang berhak menambahkan karyawan.');
      return;
    }

    if (!name.trim() || !position.trim()) {
      setErrorMsg('Nama lengkap dan jabatan wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        nik: nik.trim(),
        name: name.trim(),
        role,
        password: password.trim() || 'karyawan123',
        position: position.trim(),
        department,
        email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@perusahaan.co.id`,
        phone: phone.trim(),
        avatarUrl,
        enrolledFaceUrl: avatarUrl,
        shift: {
          name: shiftName,
          startTime,
          endTime,
          graceMinutes: Number(graceMinutes),
        },
      };

      await onAddEmployee(newEmp);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data karyawan ke database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-2 backdrop-blur-sm sm:p-4">
      <div className="relative my-2 max-h-[calc(100dvh-1rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl sm:my-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Tambah Karyawan Baru
              </h3>
              <p className="text-xs text-slate-500">
                Pendaftaran data biometrik & hak akses sistem presensi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security / Admin Check Warning */}
        {!isAdmin ? (
          <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
            <div className="flex items-center space-x-2 font-bold text-sm">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Akses Ditolak: Khusus Hak Akses Admin</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed">
              Anda saat ini masuk sebagai <strong>{currentUser.name}</strong> ({currentUser.role === 'admin' ? 'Admin' : 'Karyawan Biasa'}).
              Hanya administrator yang memiliki wewenang untuk menambahkan user baru dan mengelola titik kantor ke database.
            </p>
            <p className="text-xs text-slate-600">
              Silakan ganti profil aktif di menu pojok kanan atas ke akun yang memiliki peran <strong>Admin</strong> (misal: <em>Budi Santoso, S.Kom</em> atau <em>Dewi Lestari, S.Psi</em>).
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Kembali
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Admin Badge */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <span className="flex items-center">
                <Shield className="w-4 h-4 mr-1.5 text-emerald-600" />
                Diverifikasi sebagai Admin: <strong>{currentUser.name}</strong>
              </span>
              <span className="bg-emerald-600 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                AKSES RESMI
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor Induk Karyawan (NIK)
                </label>
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Peran / Hak Akses (Role)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'employee' | 'admin')}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="employee">Karyawan (Absensi Saja)</option>
                  <option value="admin">Administrator (Bisa Tambah User & Kelola Kantor)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nama Lengkap Karyawan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Riko Kurniawan, S.T"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Jabatan / Posisi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Database Administrator"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Departemen / Divisi *
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium"
                >
                  {departments.length > 0
                    ? departments.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name}
                        </option>
                      ))
                    : [
                        'Teknologi & IT',
                        'Keuangan & Akuntansi',
                        'Pemasaran & Sales',
                        'Sumber Daya Manusia (HR)',
                        'Operasional',
                      ].map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nomor Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Kata Sandi (Password Akun) *
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 karakter"
                  className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Shift settings */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800 flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                  Jadwal Shift Kerja Karyawan
                </p>
                {shifts.length > 0 && (
                  <span className="text-[10px] text-slate-500">Pilih dari shift master</span>
                )}
              </div>

              {shifts.length > 0 && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Pilih Template Shift Tersedia
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
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    {shifts.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.startTime} - {s.endTime}, Toleransi {s.graceMinutes}m)
                      </option>
                    ))}
                    <option value="Custom">Custom / Shift Lainnya</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="text-[11px] text-slate-500">Jam Masuk</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Jam Pulang</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500">Toleransi (M)</label>
                  <input
                    type="number"
                    value={graceMinutes}
                    onChange={(e) => setGraceMinutes(parseInt(e.target.value, 10))}
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Biometric Face Sample */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Foto Biometrik Terdaftar (Untuk Verifikasi Wajah)
              </label>
              <div className="flex items-center space-x-3 mb-2">
                <img
                  src={avatarUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500 shadow-sm shrink-0"
                />
                <div className="grid grid-cols-4 gap-2 flex-1">
                  {avatarPresets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(p.url)}
                      className={`text-[11px] py-1 px-2 rounded-lg border text-center transition-all ${
                        avatarUrl === p.url
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold'
                          : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
              >
                {loading ? 'Menyimpan ke Database...' : 'Simpan Karyawan ke Database'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
