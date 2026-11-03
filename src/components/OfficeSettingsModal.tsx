import React, { useState } from 'react';
import { OfficeLocation, Employee } from '../types';
import {
  Building2,
  MapPin,
  Compass,
  Check,
  Plus,
  Trash2,
  Shield,
  ShieldAlert,
  LocateFixed,
  AlertCircle,
} from 'lucide-react';

interface OfficeSettingsProps {
  offices: OfficeLocation[];
  activeOffice: OfficeLocation;
  onSelectOffice: (office: OfficeLocation) => void;
  onAddOffice: (newOffice: OfficeLocation) => Promise<void>;
  onDeleteOffice: (officeId: string) => Promise<void>;
  currentUser: Employee;
  currentLat: number;
  currentLng: number;
}

export const OfficeSettingsModal: React.FC<OfficeSettingsProps> = ({
  offices,
  activeOffice,
  onSelectOffice,
  onAddOffice,
  onDeleteOffice,
  currentUser,
  currentLat,
  currentLng,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(currentLat);
  const [longitude, setLongitude] = useState<number>(currentLng);
  const [radiusMeters, setRadiusMeters] = useState<number>(100);
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUseCurrentLocation = () => {
    setLatitude(currentLat);
    setLongitude(currentLng);
    if (!name) setName('Kantor Baru (Lokasi Saat Ini)');
    if (!address) setAddress('Titik koordinat GPS terverifikasi');
  };

  const handleCreateOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      alert('Akses ditolak: Hanya admin yang dapat menambahkan titik kantor.');
      return;
    }

    if (!name.trim() || !address.trim()) {
      alert('Nama dan alamat kantor wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      const newOff: OfficeLocation = {
        id: `office-${Date.now()}`,
        name: name.trim(),
        address: address.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        radiusMeters: Number(radiusMeters),
        createdBy: currentUser.name,
        createdAt: new Date().toISOString(),
      };

      await onAddOffice(newOff);
      setName('');
      setAddress('');
      setShowAddForm(false);
      showToast('Titik kantor berhasil ditambahkan ke database!');
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan titik kantor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (off: OfficeLocation) => {
    if (!isAdmin) {
      alert('Akses ditolak: Hanya admin yang dapat menghapus titik kantor.');
      return;
    }

    if (offices.length <= 1) {
      alert('Minimal harus ada satu titik kantor aktif yang terdaftar.');
      return;
    }

    if (window.confirm(`Yakin ingin menghapus titik kantor "${off.name}" dari database?`)) {
      try {
        await onDeleteOffice(off.id);
        showToast(`Titik kantor "${off.name}" berhasil dihapus.`);
      } catch (err: any) {
        alert(err.message || 'Gagal menghapus kantor.');
      }
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Manajemen Titik Kantor & Radius Geofencing
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isAdmin
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {isAdmin ? 'Hak Akses: ADMIN' : 'Hak Akses: LIHAT SAJA'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tersimpan di Cloud Firestore • Hanya Admin yang berhak menambah & menghapus titik kantor
            </p>
          </div>
        </div>

        {isAdmin ? (
          <button
            type="button"
            onClick={() => {
              setLatitude(currentLat);
              setLongitude(currentLng);
              setShowAddForm(!showAddForm);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{showAddForm ? 'Tutup Form' : 'Tambah Titik Kantor'}</span>
          </button>
        ) : (
          <div className="text-xs text-slate-400 italic flex items-center">
            <ShieldAlert className="w-4 h-4 text-amber-500 mr-1.5" />
            Mode Baca (Karyawan)
          </div>
        )}
      </div>

      {toastMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Notice when non-admin views */}
      {!isAdmin && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Informasi Hak Akses Administrator:</p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Anda sedang masuk sebagai <strong>{currentUser.name}</strong> (Karyawan).
              Sesuai aturan keamanan perusahaan, penambahan dan penghapusan titik koordinat geofence kantor hanya dapat dilakukan oleh pengguna berstatus <strong>Admin</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Add Office Form (Admin Only) */}
      {showAddForm && isAdmin && (
        <form
          onSubmit={handleCreateOffice}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center">
              <Plus className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Pendaftaran Titik Kantor Baru ke Database
            </h4>
            <span className="text-[11px] text-slate-500">
              Oleh Admin: {currentUser.name}
            </span>
          </div>

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
          >
            <LocateFixed className="w-4 h-4 text-emerald-600" />
            <span>Gunakan Koordinat Posisi Saya Saat Ini ({currentLat.toFixed(5)}, {currentLng.toFixed(5)})</span>
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nama Kantor / Cabang
              </label>
              <input
                type="text"
                placeholder="Contoh: Kantor Cabang Bali"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Radius Izin Absen (Meter)
              </label>
              <input
                type="number"
                min="10"
                max="2000"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(parseInt(e.target.value, 10))}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-mono"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Alamat Lengkap Kantor
            </label>
            <input
              type="text"
              placeholder="Contoh: Jl. Sunset Road No. 88, Kuta, Bali"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Latitude GPS
              </label>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full text-xs px-3 py-2 font-mono rounded-xl border border-slate-300 bg-white"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Longitude GPS
              </label>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full text-xs px-3 py-2 font-mono rounded-xl border border-slate-300 bg-white"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {loading ? 'Menyimpan...' : 'Simpan Titik Kantor ke Database'}
            </button>
          </div>
        </form>
      )}

      {/* Office Locations List */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-slate-600 block">
          Daftar Titik Kantor Terdaftar ({offices.length} Lokasi):
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {offices.map((off) => {
            const isCurrentActive = activeOffice.id === off.id;
            return (
              <div
                key={off.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isCurrentActive
                    ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`p-2 rounded-xl ${
                          isCurrentActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                          {off.name}
                        </h4>
                        {isCurrentActive && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                            Titik Aktif Presensi
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button (Admin Only) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(off)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus Titik Kantor (Hanya Admin)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {off.address}
                  </p>

                  <div className="mt-3 p-2 bg-slate-50 rounded-lg text-[11px] font-mono text-slate-600 flex justify-between border border-slate-100">
                    <span>Radius: <strong>{off.radiusMeters}m</strong></span>
                    <span>{off.latitude.toFixed(4)}, {off.longitude.toFixed(4)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {off.createdBy ? `Ditambahkan oleh ${off.createdBy}` : 'Titik Kantor Standar'}
                  </span>

                  {!isCurrentActive ? (
                    <button
                      type="button"
                      onClick={() => onSelectOffice(off)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Pilih Sebagai Lokasi Presensi
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Sedang Digunakan
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
