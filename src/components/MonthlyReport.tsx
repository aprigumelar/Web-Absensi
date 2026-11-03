import React, { useState, useMemo } from 'react';
import { AttendanceRecord, Employee, Department } from '../types';
import { calculateMonthlyStats, exportAttendanceToCSV, printMonthlyReport } from '../utils/exportUtils';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  UserCheck,
  TrendingUp,
  Award,
  Eye,
  X,
  Sparkles,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Users,
  User,
} from 'lucide-react';

interface MonthlyReportProps {
  records: AttendanceRecord[];
  employees: Employee[];
  departments?: Department[];
  currentUser: Employee;
  onOpenLogin: () => void;
  onUpdateAttendance: (record: AttendanceRecord) => Promise<void>;
}

const timeToMinutes = (time?: string) => {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return Number.isNaN(hours) || Number.isNaN(minutes) ? null : hours * 60 + minutes;
};

export const MonthlyReport: React.FC<MonthlyReportProps> = ({
  records,
  employees,
  departments = [],
  currentUser,
  onOpenLogin,
  onUpdateAttendance,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [previewPhotoLabel, setPreviewPhotoLabel] = useState('Bukti Foto Presensi');
  const [reviewRequest, setReviewRequest] = useState<AttendanceRecord | null>(null);

  const pendingVisitRequests = useMemo(
    () => records.filter((record) => record.approvalStatus === 'PENDING'),
    [records]
  );

  const getApprovalRequestMeta = (request: AttendanceRecord) => {
    if (request.customerName) {
      return {
        type: 'Visit Customer',
        title: 'Pengajuan Visit Customer',
        detail: request.visitPurpose || 'Kegiatan luar kantor',
      };
    }

    const leaveReasonText = (request.notes || '').replace(/^(Pengajuan (izin|sakit):\s*)/i, '');
    const isSick = (request.notes || '').toLowerCase().includes('sakit');
    return {
      type: isSick ? 'Sakit' : 'Izin',
      title: isSick ? 'Pengajuan Sakit' : 'Pengajuan Izin',
      detail: leaveReasonText || (isSick ? 'Keterangan sakit' : 'Keterangan izin'),
    };
  };

  const handleVisitApproval = async (record: AttendanceRecord, approved: boolean) => {
    const isLeaveApproval = record.status === 'MENUNGGU_APPROVAL' && record.approvalStatus === 'PENDING';
    const finalStatus = isLeaveApproval
      ? record.notes?.toLowerCase().includes('sakit')
        ? 'SAKIT'
        : 'IZIN'
      : approved
      ? record.lateMinutes > 0
        ? 'TERLAMBAT'
        : 'HADIR_TEPAT_WAKTU'
      : 'ALPHA';

    await onUpdateAttendance({
      ...record,
      approvalStatus: approved ? 'APPROVED' : 'REJECTED',
      status: approved ? finalStatus : 'ALPHA',
      verifiedBy: 'Manual Admin',
      approvedBy: currentUser.name,
      approvedAt: new Date().toISOString(),
    });
  };

  // Department options from dynamic list or defaults
  const departmentNames = useMemo(() => {
    if (departments.length > 0) {
      return ['ALL', ...departments.map((d) => d.name)];
    }
    return [
      'ALL',
      'Teknologi & IT',
      'Keuangan & Akuntansi',
      'Pemasaran & Sales',
      'Sumber Daya Manusia (HR)',
      'Operasional',
    ];
  }, [departments]);

  // Filter records based on role and filters
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // RULE: Non-admin can ONLY view and pull their own record
      if (!isAdmin && r.employeeId !== currentUser.id) {
        return false;
      }

      // If Admin and specific employee selected
      if (isAdmin && selectedEmployeeId !== 'ALL' && r.employeeId !== selectedEmployeeId) {
        return false;
      }

      // Month filter
      if (!r.date.startsWith(selectedMonth)) return false;

      // Department filter
      if (selectedDepartment !== 'ALL' && r.department !== selectedDepartment) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'ALL') {
        const isNotCheckedOut = Boolean(r.checkInTime) && !r.checkOutTime;
        if (selectedStatus === 'BELUM_PULANG' ? !isNotCheckedOut : r.status !== selectedStatus) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.employeeName.toLowerCase().includes(q);
        const matchDept = r.department.toLowerCase().includes(q);
        const matchDate = r.date.includes(q);
        if (!matchName && !matchDept && !matchDate) return false;
      }

      return true;
    });
  }, [
    records,
    selectedMonth,
    selectedEmployeeId,
    selectedDepartment,
    selectedStatus,
    searchQuery,
    isAdmin,
    currentUser.id,
  ]);

  // Calculate monthly recap statistics
  const stats = useMemo(() => {
    const targetRecords = isAdmin
      ? selectedEmployeeId === 'ALL'
        ? records.filter((r) => r.date.startsWith(selectedMonth))
        : records.filter((r) => r.date.startsWith(selectedMonth) && r.employeeId === selectedEmployeeId)
      : records.filter((r) => r.date.startsWith(selectedMonth) && r.employeeId === currentUser.id);

    const targetEmpCount = isAdmin
      ? selectedEmployeeId === 'ALL'
        ? employees.length
        : 1
      : 1;

    return calculateMonthlyStats(targetRecords, selectedMonth, targetEmpCount);
  }, [records, selectedMonth, employees.length, isAdmin, selectedEmployeeId, currentUser.id]);

  // Identify top disciplined employee (for Admin view)
  const topEmployees = useMemo(() => {
    const monthRecs = records.filter((r) => r.date.startsWith(selectedMonth));
    const scores: { [empId: string]: { onTime: number; late: number; name: string; dept: string } } = {};

    employees.forEach((emp) => {
      scores[emp.id] = { onTime: 0, late: 0, name: emp.name, dept: emp.department };
    });

    monthRecs.forEach((r) => {
      if (scores[r.employeeId]) {
        if (r.status === 'HADIR_TEPAT_WAKTU') scores[r.employeeId].onTime += 1;
        if (r.status === 'TERLAMBAT') scores[r.employeeId].late += 1;
      }
    });

    return Object.values(scores).sort((a, b) => b.onTime - a.onTime);
  }, [records, selectedMonth, employees]);

  // Handle Export CSV
  const handleExportCSV = () => {
    if (isAdmin) {
      if (selectedEmployeeId === 'ALL') {
        // Admin pulls ALL
        const filename = `Rekap_Presensi_ALL_KARYAWAN_${stats.monthName.replace(/\s+/g, '_')}`;
        exportAttendanceToCSV(filteredRecords, filename);
      } else {
        const emp = employees.find((e) => e.id === selectedEmployeeId);
        const empNameClean = (emp?.name || 'Karyawan').replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Rekap_Presensi_${empNameClean}_${stats.monthName.replace(/\s+/g, '_')}`;
        exportAttendanceToCSV(filteredRecords, filename);
      }
    } else {
      // User can ONLY pull self
      const selfNameClean = currentUser.name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `Rekap_Presensi_Pribadi_${selfNameClean}_${stats.monthName.replace(/\s+/g, '_')}`;
      exportAttendanceToCSV(filteredRecords, filename);
    }
  };

  // Handle Print PDF
  const handlePrint = () => {
    if (isAdmin) {
      if (selectedEmployeeId === 'ALL') {
        printMonthlyReport(
          stats.monthName,
          stats,
          filteredRecords,
          'LAPORAN ABSENSI BULANAN SELURUH KARYAWAN (TECSO)'
        );
      } else {
        const emp = employees.find((e) => e.id === selectedEmployeeId);
        printMonthlyReport(
          stats.monthName,
          stats,
          filteredRecords,
          `LAPORAN ABSENSI KARYAWAN - ${emp?.name || ''}`,
          emp ? { name: emp.name, nik: emp.nik, department: emp.department } : undefined
        );
      }
    } else {
      printMonthlyReport(
        stats.monthName,
        stats,
        filteredRecords,
        'LAPORAN REKAPITULASI PRESENSI PRIBADI KARYAWAN',
        {
          name: currentUser.name,
          nik: currentUser.nik,
          department: currentUser.department,
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Access Mode Notification Banner */}
      {!isAdmin ? (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm animate-in fade-in">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="font-bold text-amber-950 text-sm">
                  Mode Karyawan: Tarik Rekap Pribadi ({currentUser.name})
                </p>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-mono px-2 py-0.2 rounded font-bold">
                  HANYA DIRI SENDIRI
                </span>
              </div>
              <p className="text-amber-800 text-xs mt-1 leading-relaxed">
                Anda masuk sebagai staf karyawan. Sesuai kebijakan wewenang, Anda <strong>hanya dapat menarik rekap kehadiran untuk diri Anda sendiri</strong>. Fitur penarikan rekapitulasi seluruh karyawan (ALL) dikunci khusus bagi Administrator.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenLogin}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center space-x-1.5 shadow-sm"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Login Sebagai Admin</span>
          </button>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-emerald-950">
                  Mode Administrator: Tarik Rekap Seluruh Karyawan (ALL)
                </span>
                <span className="bg-emerald-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded">
                  FULL ACCESS ALL STAFF
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Admin <strong>{currentUser.name}</strong> memiliki wewenang menarik rekap kehadiran seluruh karyawan ({employees.length} staf) maupun menyaring per individu.
              </p>
            </div>
          </div>
        </div>
      )}

      {isAdmin && pendingVisitRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-amber-950 text-sm">Notifikasi Approval Pengajuan</h3>
              <p className="text-xs text-amber-800 mt-0.5">
                {pendingVisitRequests.length} pengajuan menunggu keputusan Admin.
              </p>
            </div>
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div className="divide-y divide-amber-100">
            {pendingVisitRequests.map((request) => {
              const meta = getApprovalRequestMeta(request);
              return (
                <div key={request.id} className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="text-xs text-slate-700 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-900">{request.employeeName}</p>
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        {meta.type}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-500">
                      {meta.title} • {request.date}
                    </p>
                    <p className="mt-1 text-slate-600">
                      <span className="font-semibold">Detail:</span> {meta.detail}
                    </p>
                    {request.customerName ? (
                      <p className="text-slate-500 mt-1">
                        Customer: <strong>{request.customerName}</strong> • Tujuan: {request.visitPurpose || '-'}
                      </p>
                    ) : (
                      <p className="text-slate-500 mt-1">
                        Bukti: {request.evidencePhoto ? 'Foto terlampir' : 'Belum ada foto'}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setReviewRequest(request)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVisitApproval(request, false)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                    >
                      <X className="w-3.5 h-3.5" /> Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVisitApproval(request, true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Header Card with Month Picker & Action Buttons */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                {isAdmin
                  ? 'Tarik Rekapitulasi Presensi Karyawan'
                  : `Tarik Rekapitulasi Presensi Pribadi - ${currentUser.name}`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAdmin
                  ? 'Tarik dan cetak laporan kehadiran seluruh karyawan terintegrasi biometrik & GPS'
                  : 'Unduh atau cetak riwayat absensi bulanan Anda yang telah terverifikasi sistem'}
              </p>
            </div>
          </div>

          {/* Month Selector & Action Buttons */}
          <div className="grid w-full grid-cols-1 items-stretch gap-2 sm:flex sm:flex-wrap sm:items-center md:w-auto">
            <div className="flex min-w-0 items-center space-x-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="2026-09">September 2026 (Bulan Berjalan)</option>
                <option value="2026-08">Agustus 2026</option>
                <option value="2026-07">Juli 2026</option>
              </select>
            </div>

            {/* TARIK REKAP BUTTON (ADMIN: ALL, USER: DIRI SENDIRI) */}
            {isAdmin ? (
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-center text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700"
                title="Unduh seluruh data kehadiran staf dalam format CSV/Excel"
              >
                <Download className="w-4 h-4" />
                <span>
                  {selectedEmployeeId === 'ALL'
                    ? '📥 Tarik Rekap Seluruh Karyawan (ALL)'
                    : '📥 Tarik Rekap Karyawan Terpilih'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center justify-center space-x-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-center text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700"
                title="Unduh data kehadiran milik Anda sendiri"
              >
                <Download className="w-4 h-4" />
                <span>📥 Tarik Rekap Saya ({currentUser.name})</span>
              </button>
            )}

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center space-x-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-center text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-900"
            >
              <Printer className="w-4 h-4" />
              <span>{isAdmin ? 'Cetak Laporan (PDF)' : 'Cetak Rekap Saya (PDF)'}</span>
            </button>

            {/* Visual Locked Button for Non-Admin */}
            {!isAdmin && (
              <div
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                title="Fitur Tarik Rekap All hanya dapat diakses oleh Administrator"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Tarik Rekap All (Terkunci)</span>
              </div>
            )}
          </div>
        </div>

        {/* Automatic KPI Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-6">
          {/* Rate */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {isAdmin ? 'Tingkat Kehadiran' : 'Kehadiran Saya'}
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">
              {stats.attendanceRate}%
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.actualAttendances} dari {stats.totalExpectedAttendances} presensi
            </p>
          </div>

          {/* On Time */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Tepat Waktu
              </span>
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {stats.onTimeCount}
            </p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">
              Kedisiplinan Terverifikasi
            </p>
          </div>

          {/* Late */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Terlambat
              </span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-600 mt-2">
              {stats.lateCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rata-rata {stats.avgLateMinutes} menit
            </p>
          </div>

          {/* Permit / Sick */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Izin & Sakit
              </span>
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-2">
              {stats.sickCount + stats.permitCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {stats.sickCount} Sakit • {stats.permitCount} Izin Resmi
            </p>
          </div>

          {/* Alpha */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Tanpa Keterangan
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-600 mt-2">
              {stats.absentCount}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {isAdmin ? 'Perlu tindak lanjut HR' : 'Tidak ada catatan alpha'}
            </p>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div className="mt-5 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
          <div className="flex items-center space-x-2 text-emerald-900 font-semibold text-xs mb-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>
              {isAdmin
                ? `Ringkasan Eksekutif Kehadiran Perusahaan (${stats.monthName}):`
                : `Ringkasan Presensi Pribadi Anda (${stats.monthName}):`}
            </span>
          </div>
          <div className="text-xs text-emerald-950 space-y-1 leading-relaxed">
            <p>
              • <strong>Tingkat Kepatuhan:</strong> Rata-rata kehadiran tercatat{' '}
              <strong>{stats.attendanceRate}%</strong> dengan total{' '}
              <strong>{stats.onTimeCount}</strong> kehadiran tepat waktu terverifikasi GPS & biometrik.
            </p>
            {isAdmin ? (
              <p>
                • <strong>Karyawan Teladan:</strong> {topEmployees[0]?.name} memimpin presensi dengan catatan{' '}
                <strong>{topEmployees[0]?.onTime} kehadiran tepat waktu</strong> tanpa keterlambatan.
              </p>
            ) : (
              <p>
                • <strong>Catatan Karyawan:</strong> Data kehadiran Anda tersinkronisasi otomatis dengan server cloud dan dapat ditarik sewaktu-waktu.
              </p>
            )}
            <p>
              • <strong>Keterlambatan:</strong> Terjadi {stats.lateCount} keterlambatan dengan akumulasi{' '}
              {stats.avgLateMinutes} menit.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Employee Filter: Admin can choose ALL or specific employee; User is locked to self */}
          <div className="sm:col-span-4">
            {isAdmin ? (
              <div className="relative">
                <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white font-medium"
                >
                  <option value="ALL">👥 Tarik Rekap Seluruh Karyawan (ALL)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      👤 {emp.name} ({emp.nik} - {emp.department})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="relative">
                <User className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled
                  value={`🔒 Hanya Anda Sendiri: ${currentUser.name}`}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold cursor-not-allowed"
                />
              </div>
            )}
          </div>

          {/* Search Box */}
          <div className="sm:col-span-3 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, tanggal, divisi..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Department Filter (uses dynamic departments) */}
          <div className="sm:col-span-3">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              {departmentNames.map((d) => (
                <option key={d} value={d}>
                  {d === 'ALL' ? 'Semua Departemen' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="HADIR_TEPAT_WAKTU">Tepat Waktu</option>
              <option value="TERLAMBAT">Terlambat</option>
              <option value="BELUM_PULANG">Belum Pulang</option>
              <option value="IZIN">Izin</option>
              <option value="SAKIT">Sakit</option>
              <option value="ALPHA">Alpha</option>
              <option value="MENUNGGU_APPROVAL">Menunggu Approval</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              Log Detail Presensi {isAdmin ? 'Karyawan (ALL)' : `Pribadi (${currentUser.name})`}
            </h3>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredRecords.length} rekaman presensi pada periode terpilih
            </p>
          </div>
          <span className="text-xs font-mono bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
            Periode: {stats.monthName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Nama Karyawan</th>
                <th className="px-4 py-3">Departemen</th>
                <th className="px-4 py-3">Masuk</th>
                <th className="px-4 py-3">Pulang</th>
                <th className="px-4 py-3">Status Masuk</th>
                <th className="px-4 py-3">Status Keluar</th>
                <th className="px-4 py-3">GPS Masuk</th>
                <th className="px-4 py-3">GPS Keluar</th>
                <th className="px-4 py-3">Biometrik</th>
                <th className="px-4 py-3 text-center">Bukti Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada rekaman presensi yang sesuai dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono text-slate-900 whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900 whitespace-nowrap">
                      {r.employeeName}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {r.department}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {r.checkInTime || '-'}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 whitespace-nowrap">
                      {r.checkOutTime || '-'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {r.status === 'HADIR_TEPAT_WAKTU' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Tepat Waktu
                        </span>
                      )}
                      {r.status === 'TERLAMBAT' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Terlambat ({r.lateMinutes}m)
                        </span>
                      )}
                      {r.status === 'IZIN' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          Izin Resmi
                        </span>
                      )}
                      {r.status === 'SAKIT' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Sakit
                        </span>
                      )}
                      {r.status === 'ALPHA' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Alpha
                        </span>
                      )}
                      {r.status === 'MENUNGGU_APPROVAL' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Menunggu Approval
                        </span>
                      )}
                      {r.notes && (
                        <div className="mt-1 text-[11px] text-slate-500">{r.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {!r.checkOutTime ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Belum Pulang
                        </span>
                      ) : (() => {
                        const employee = employees.find((item) => item.id === r.employeeId);
                        const checkOutMinutes = timeToMinutes(r.checkOutTime);
                        const shiftEndMinutes = timeToMinutes(employee?.shift.endTime);
                        const leftEarly =
                          checkOutMinutes !== null &&
                          shiftEndMinutes !== null &&
                          checkOutMinutes < shiftEndMinutes;

                        return (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              leftEarly
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {leftEarly ? 'Pulang Cepat' : 'Pulang Tepat Waktu'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {r.attendanceMode === 'CUSTOMER_VISIT' ? (
                        <span className="text-amber-700 font-semibold">Visit Customer</span>
                      ) : r.checkInDistanceMeters !== undefined ? (
                        <span className="text-slate-600">
                          <span className="font-semibold text-emerald-700">
                            {r.checkInDistanceMeters}m
                          </span>{' '}
                          (Valid)
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {r.checkOutDistanceMeters !== undefined ? (
                        <span className="text-slate-600">
                          <span className="font-semibold text-emerald-700">
                            {r.checkOutDistanceMeters}m
                          </span>{' '}
                          (Valid)
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono whitespace-nowrap">
                      {r.faceMatchScore > 0 ? (
                        <span className="text-emerald-600 font-semibold">
                          {r.faceMatchScore.toFixed(1)}% Match
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {r.checkInPhoto || r.checkOutPhoto ? (
                        <div className="flex items-center justify-center gap-1">
                          {r.checkInPhoto && (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewPhotoLabel('Bukti Foto Presensi Masuk');
                                setPreviewPhoto(r.checkInPhoto || null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                              title="Lihat foto presensi masuk"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Masuk
                            </button>
                          )}
                          {r.checkOutPhoto && (
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewPhotoLabel('Bukti Foto Presensi Pulang');
                                setPreviewPhoto(r.checkOutPhoto || null);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                              title="Lihat foto presensi pulang"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Pulang
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reviewRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-2 backdrop-blur-sm sm:p-4">
          <div className="relative my-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in fade-in sm:my-4">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Review Pengajuan</h4>
              <button
                onClick={() => setReviewRequest(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-slate-500">Nama Karyawan</p>
                  <p className="font-bold text-slate-900 mt-1">{reviewRequest.employeeName}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-slate-500">Jenis Pengajuan</p>
                  <p className="font-bold text-slate-900 mt-1">{getApprovalRequestMeta(reviewRequest).title}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-slate-500">Tanggal</p>
                  <p className="font-bold text-slate-900 mt-1">{reviewRequest.date}</p>
                </div>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-slate-500">Status</p>
                  <p className="font-bold text-amber-700 mt-1">Menunggu Approval</p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                <p className="font-bold text-slate-900 mb-1">Detail Pengajuan</p>
                <p>{getApprovalRequestMeta(reviewRequest).detail}</p>
                {reviewRequest.customerName && (
                  <div className="mt-2 space-y-1">
                    <p><span className="font-semibold">Customer:</span> {reviewRequest.customerName}</p>
                    <p><span className="font-semibold">Tujuan:</span> {reviewRequest.visitPurpose || '-'}</p>
                  </div>
                )}
              </div>

              {reviewRequest.evidencePhoto && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-700 mb-2">Bukti Foto</p>
                  <img
                    src={reviewRequest.evidencePhoto}
                    alt="Bukti pengajuan"
                    className="w-full max-h-72 object-contain rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    handleVisitApproval(reviewRequest, false);
                    setReviewRequest(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100"
                >
                  <X className="w-3.5 h-3.5" /> Tolak
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleVisitApproval(reviewRequest, true);
                    setReviewRequest(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Setujui
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/70 p-2 backdrop-blur-sm sm:p-4">
          <div className="relative my-2 max-h-[calc(100dvh-1rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl animate-in fade-in sm:my-4">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">{previewPhotoLabel}</h4>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex min-h-40 items-center justify-center bg-slate-950 p-4">
              <img
                src={previewPhoto}
                alt="Foto Bukti Kehadiran"
                className="max-h-[70dvh] max-w-full rounded-xl object-contain shadow"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                  event.currentTarget.parentElement?.classList.add('photo-preview-error');
                }}
              />
              <p className="hidden text-center text-xs text-slate-300 [.photo-preview-error_&]:block">
                Bukti foto tidak dapat dimuat. Data foto mungkin sudah tidak tersedia atau URL sudah kedaluwarsa.
              </p>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex justify-end">
              <button
                onClick={() => setPreviewPhoto(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-medium text-xs hover:bg-slate-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
