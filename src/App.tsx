import React, { useState, useEffect } from 'react';
import {
  Employee,
  OfficeLocation,
  AttendanceRecord,
  ShiftSchedule,
  Department,
} from './types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_SHIFTS,
  INITIAL_DEPARTMENTS,
  generateInitialAttendanceHistory,
} from './data/mockData';
import { DEFAULT_OFFICES } from './utils/geoUtils';
import { Header } from './components/Header';
import { AttendanceCard } from './components/AttendanceCard';
import { GpsRadar } from './components/GpsRadar';
import { MonthlyReport } from './components/MonthlyReport';
import { OfficeSettingsModal } from './components/OfficeSettingsModal';
import { AddUserModal } from './components/AddUserModal';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { EmployeeDirectory } from './components/EmployeeDirectory';
import { ShiftDepartmentManager } from './components/ShiftDepartmentManager';
import { LoginModal } from './components/LoginModal';
import { LoginScreen } from './components/LoginScreen';
import { BiometricModal } from './components/BiometricModal';
import {
  testFirestoreConnection,
  seedInitialFirestoreData,
  saveEmployeeToDB,
  deleteEmployeeFromDB,
  saveOfficeToDB,
  deleteOfficeFromDB,
  saveAttendanceToDB,
  saveShiftToDB,
  deleteShiftFromDB,
  saveDepartmentToDB,
  deleteDepartmentFromDB,
} from './lib/firebase';
import {
  Building,
  Shield,
  ShieldAlert,
  UserPlus,
  Database,
  CheckCircle2,
  Lock,
  Users,
  KeyRound,
  Sliders,
} from 'lucide-react';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [activeEmployee, setActiveEmployee] = useState<Employee>(INITIAL_EMPLOYEES[0]);
  const [offices, setOffices] = useState<OfficeLocation[]>(DEFAULT_OFFICES);
  const [activeOffice, setActiveOffice] = useState<OfficeLocation>(DEFAULT_OFFICES[0]);
  const [shifts, setShifts] = useState<ShiftSchedule[]>(INITIAL_SHIFTS);
  const [departments, setDepartments] = useState<Department[]>(INITIAL_DEPARTMENTS);
  const [currentTab, setCurrentTab] = useState<
    'presensi' | 'rekap' | 'lokasi' | 'karyawan' | 'shift_dept'
  >('presensi');
  const [records, setRecords] = useState<AttendanceRecord[]>(() =>
    generateInitialAttendanceHistory()
  );
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState<boolean>(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);

  // Initial Authentication Gate: Must login if opening for the first time
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const savedUserId = sessionStorage.getItem('presensi_active_user_id');
    return Boolean(savedUserId);
  });

  // Password Lock & Login State
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginTargetEmployee, setLoginTargetEmployee] = useState<Employee | null>(null);
  const [loginForcedReason, setLoginForcedReason] = useState<string | null>(null);

  // Real or simulated GPS coordinates (SCBD test perimeter)
  const [currentLat, setCurrentLat] = useState<number>(-6.22572);
  const [currentLng, setCurrentLng] = useState<number>(106.80951);
  const [accuracy, setAccuracy] = useState<number>(12);
  const [isRealGpsActive, setIsRealGpsActive] = useState<boolean>(false);

  // Initialize and synchronize with Firebase Firestore
  useEffect(() => {
    async function initDatabase() {
      const connected = await testFirestoreConnection();
      setIsDbConnected(connected);

      // Seed and fetch data from Firestore for 1-month persistence
      const result = await seedInitialFirestoreData(
        INITIAL_EMPLOYEES,
        DEFAULT_OFFICES,
        generateInitialAttendanceHistory(),
        INITIAL_SHIFTS,
        INITIAL_DEPARTMENTS
      );

      if (result.employees && result.employees.length > 0) {
        setEmployees(result.employees);
        const savedUserId = sessionStorage.getItem('presensi_active_user_id');
        if (savedUserId) {
          const foundSaved = result.employees.find((e) => e.id === savedUserId);
          if (foundSaved) setActiveEmployee(foundSaved);
        } else {
          const found = result.employees.find((e) => e.id === activeEmployee.id);
          setActiveEmployee(found || result.employees[0]);
        }
      }

      if (result.offices && result.offices.length > 0) {
        setOffices(result.offices);
        const foundOff = result.offices.find((o) => o.id === activeOffice.id);
        setActiveOffice(foundOff || result.offices[0]);
      }

      if (result.records && result.records.length > 0) {
        setRecords(result.records);
      }

      if (result.shifts && result.shifts.length > 0) {
        setShifts(result.shifts);
      }

      if (result.departments && result.departments.length > 0) {
        setDepartments(result.departments);
      }
    }

    initDatabase();
  }, []);

  // Request browser GPS position
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLat(pos.coords.latitude);
          setCurrentLng(pos.coords.longitude);
          setAccuracy(pos.coords.accuracy || 10);
          setIsRealGpsActive(true);
        },
        (err) => {
          console.info(
            'GPS prompt skipped or denied, using office test perimeter coordinates:',
            err.message
          );
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  const handleRefreshGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLat(pos.coords.latitude);
          setCurrentLng(pos.coords.longitude);
          setAccuracy(pos.coords.accuracy || 8);
          setIsRealGpsActive(true);
        },
        (err) => {
          alert(
            `Gagal mengambil koordinat GPS: ${err.message}. Tetap menggunakan koordinat saat ini.`
          );
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      alert('Perangkat Anda tidak mendukung fitur Geolocation GPS.');
    }
  };

  const handleSimulateLocation = (lat: number, lng: number) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    setAccuracy(10);
    setIsRealGpsActive(false);
  };

  // Record Attendance -> saves to Firestore for 1-month persistence & updates state
  const handleRecordAttendance = async (newRecord: AttendanceRecord) => {
    const existingRecord = records.find((record) => record.id === newRecord.id);
    const recordToSave = existingRecord ? { ...existingRecord, ...newRecord } : newRecord;

    setRecords((prev) => {
      if (!existingRecord) return [recordToSave, ...prev];

      return prev.map((record) =>
        record.id === newRecord.id ? recordToSave : record
      );
    });
    try {
      await saveAttendanceToDB(recordToSave);
    } catch (e) {
      console.warn('Firestore attendance save error, cached locally:', e);
    }
  };

  const handleUpdateAttendance = async (updatedRecord: AttendanceRecord) => {
    if (activeEmployee.role !== 'admin') {
      throw new Error('Akses ditolak: Hanya admin yang dapat memproses approval visit customer.');
    }

    setRecords((prev) => prev.map((record) => (record.id === updatedRecord.id ? updatedRecord : record)));
    try {
      await saveAttendanceToDB(updatedRecord);
    } catch (e) {
      console.warn('Firestore attendance approval error, cached locally:', e);
    }
  };

  // Switch Employee with Password Authentication Guard
  const handleSelectEmployeeWithAuth = (targetEmp: Employee) => {
    if (targetEmp.id === activeEmployee.id) return;

    setLoginTargetEmployee(targetEmp);
    if (targetEmp.role === 'admin') {
      setLoginForcedReason(
        `Akun Admin "${targetEmp.name}" terkunci. Masukkan kata sandi Administrator (admin123) untuk membuka sesi.`
      );
    } else {
      setLoginForcedReason(
        `Konfirmasi kata sandi pengguna "${targetEmp.name}" (user123) untuk beralih profil.`
      );
    }
    setIsLoginModalOpen(true);
  };

  const handleOpenLogin = (target?: Employee, reason?: string) => {
    setLoginTargetEmployee(target || activeEmployee);
    setLoginForcedReason(reason || null);
    setIsLoginModalOpen(true);
  };

  // Add User (Employee) -> Admin Only
  const handleAddEmployee = async (newEmployee: Employee) => {
    if (activeEmployee.role !== 'admin') {
      throw new Error('Akses ditolak: Hanya admin yang dapat menambahkan user.');
    }

    await saveEmployeeToDB(newEmployee);
    setEmployees((prev) => [...prev, newEmployee]);
  };

  // Edit Employee & Manage Admin Privileges -> Admin Only
  const handleUpdateEmployee = async (updatedEmp: Employee) => {
    if (activeEmployee.role !== 'admin') {
      throw new Error(
        'Akses ditolak: Hanya admin yang dapat mengedit data karyawan dan mengubah hak akses.'
      );
    }

    await saveEmployeeToDB(updatedEmp);
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmp.id ? updatedEmp : e)));

    if (activeEmployee.id === updatedEmp.id) {
      setActiveEmployee(updatedEmp);
    }
  };

  const handleDeleteEmployee = async (employee: Employee) => {
    if (activeEmployee.role !== 'admin') {
      throw new Error('Akses ditolak: Hanya admin yang dapat menghapus data karyawan.');
    }
    if (employee.id === activeEmployee.id) {
      throw new Error('Akun yang sedang digunakan tidak dapat dihapus.');
    }
    if (employee.role === 'admin' && employees.filter((item) => item.role === 'admin').length <= 1) {
      throw new Error('Admin terakhir tidak dapat dihapus. Tambahkan Admin lain terlebih dahulu.');
    }

    await deleteEmployeeFromDB(employee.id);
    setEmployees((prev) => prev.filter((item) => item.id !== employee.id));
  };

  const handleUpdateOwnBiometric = async (photoData: string) => {
    const updatedEmployee = {
      ...activeEmployee,
      avatarUrl: photoData,
      enrolledFaceUrl: photoData,
    };

    await saveEmployeeToDB(updatedEmployee);
    setEmployees((prev) => prev.map((employee) => (
      employee.id === updatedEmployee.id ? updatedEmployee : employee
    )));
    setActiveEmployee(updatedEmployee);
  };

  const handleOpenEditEmployee = (emp: Employee) => {
    if (activeEmployee.role !== 'admin') {
      handleOpenLogin(
        undefined,
        'Login dengan akun Admin untuk mengedit data karyawan dan memberikan hak admin.'
      );
      return;
    }
    setEditingEmployee(emp);
    setIsEditUserOpen(true);
  };

  // Add Office Location -> Admin Only
  const handleAddOffice = async (newOffice: OfficeLocation) => {
    if (activeEmployee.role !== 'admin') {
      throw new Error('Akses ditolak: Hanya admin yang dapat menambahkan titik kantor.');
    }

    await saveOfficeToDB(newOffice);
    setOffices((prev) => [...prev, newOffice]);
    setActiveOffice(newOffice);
  };

  // Delete Office Location -> Admin Only
  const handleDeleteOffice = async (officeId: string) => {
    if (activeEmployee.role !== 'admin') {
      throw new Error('Akses ditolak: Hanya admin yang dapat menghapus titik kantor.');
    }

    await deleteOfficeFromDB(officeId);
    setOffices((prev) => prev.filter((o) => o.id !== officeId));
    if (activeOffice.id === officeId) {
      const remaining = offices.filter((o) => o.id !== officeId);
      if (remaining.length > 0) setActiveOffice(remaining[0]);
    }
  };

  // Shift Management Handlers (Admin Only)
  const handleAddShift = async (newShift: ShiftSchedule) => {
    if (activeEmployee.role !== 'admin') {
      throw new Error('Akses ditolak: Hanya admin yang dapat membuat jadwal shift.');
    }
    await saveShiftToDB(newShift);
    setShifts((prev) => [newShift, ...prev]);
  };

  const handleDeleteShift = async (shiftId: string, fallbackShiftId?: string) => {
    if (activeEmployee.role !== 'admin') {
      throw new Error('Akses ditolak: Hanya admin yang dapat menghapus jadwal shift.');
    }
    await deleteShiftFromDB(shiftId);
    setShifts((prev) => prev.filter((s) => s.id !== shiftId));
  };

  // Department Management Handlers (Admin Only)
  const handleAddDepartment = async (newDept: Department) => {
    if (activeEmployee.role !== 'admin') {
      throw new Error('Akses ditolak: Hanya admin yang dapat membuat departemen baru.');
    }
    await saveDepartmentToDB(newDept);
    setDepartments((prev) => [newDept, ...prev]);
  };

  const handleDeleteDepartment = async (deptId: string, fallbackDeptName?: string) => {
    if (activeEmployee.role !== 'admin') {
      throw new Error('Akses ditolak: Hanya admin yang dapat menghapus departemen.');
    }
    await deleteDepartmentFromDB(deptId);
    setDepartments((prev) => prev.filter((d) => d.id !== deptId));
  };

  const isAdmin = activeEmployee.role === 'admin';

  const handleLoginSuccess = (emp: Employee) => {
    setActiveEmployee(emp);
    setIsAuthenticated(true);
    sessionStorage.setItem('presensi_active_user_id', emp.id);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('presensi_active_user_id');
    setCurrentTab('presensi');
  };

  // If opening for the first time or logged out, show initial Login Screen
  if (!isAuthenticated) {
    return (
      <LoginScreen
        employees={employees}
        office={activeOffice}
        isDbConnected={isDbConnected}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      {/* App Header */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeEmployee={activeEmployee}
        employees={employees}
        onSelectEmployeeWithAuth={handleSelectEmployeeWithAuth}
        office={activeOffice}
        onOpenAddUser={() => setIsAddUserOpen(true)}
        onOpenLogin={() => handleOpenLogin()}
        onLogout={handleLogout}
        isDbConnected={isDbConnected}
        onEditEmployee={handleOpenEditEmployee}
        onOpenBiometric={() => setIsBiometricModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-24 lg:pb-8 min-w-0">
        {/* Tab 1: Presensi Wajah & GPS */}
        {currentTab === 'presensi' && (
          <div className="space-y-6">
            {/* Active Employee Status & Quick Admin Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex min-w-0 items-center space-x-3.5">
                <div className="relative">
                  <img
                    src={activeEmployee.avatarUrl}
                    alt={activeEmployee.name}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/40 shadow-sm"
                  />
                  {isAdmin && (
                    <span
                      className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full border border-white shadow"
                      title="Akun Admin Terproteksi Sandi"
                    >
                      ADMIN
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h2 className="max-w-full truncate text-base font-bold text-slate-900">
                      {activeEmployee.name}
                    </h2>
                    <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {activeEmployee.nik}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isAdmin
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isAdmin ? 'Administrator (Kunci Sandi)' : 'Karyawan Biasa'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {activeEmployee.position} • {activeEmployee.department}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                  <Building className="w-4 h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-600">
                    Titik Kantor Aktif:{' '}
                    <strong className="text-slate-900">{activeOffice.name}</strong> (Maks{' '}
                    {activeOffice.radiusMeters}m)
                  </span>
                </div>

                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => setIsAddUserOpen(true)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors flex items-center space-x-1 shadow-sm shadow-emerald-600/20"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Tambah Karyawan</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handleOpenLogin(
                        undefined,
                        'Login dengan akun Admin untuk menambah user, shift, atau titik kantor.'
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-slate-200 font-medium transition-colors flex items-center space-x-1"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Masuk Mode Admin</span>
                  </button>
                )}
              </div>
            </div>

            {/* Attendance Camera & Verification Card */}
            <AttendanceCard
              employee={activeEmployee}
              office={activeOffice}
              currentLat={currentLat}
              currentLng={currentLng}
              onRecordAttendance={handleRecordAttendance}
              recentRecords={records}
            />

            {/* Geofence Radar Preview under attendance */}
            <GpsRadar
              currentLat={currentLat}
              currentLng={currentLng}
              accuracy={accuracy}
              office={activeOffice}
              onRefreshGps={handleRefreshGps}
              onSimulateLocation={handleSimulateLocation}
              isRealGpsActive={isRealGpsActive}
            />
          </div>
        )}

        {/* Tab 2: Rekap Laporan Bulanan (Admin bisa tarik ALL, User hanya bisa tarik diri sendiri) */}
        {currentTab === 'rekap' && (
          <MonthlyReport
            records={records}
            employees={employees}
            departments={departments}
            currentUser={activeEmployee}
            onOpenLogin={() => handleOpenLogin()}
            onUpdateAttendance={handleUpdateAttendance}
          />
        )}

        {/* Tab 3: Radar & Pengaturan Titik Kantor (Hanya Admin yang dapat Tambah/Hapus) */}
        {currentTab === 'lokasi' && (
          <div className="space-y-6">
            <GpsRadar
              currentLat={currentLat}
              currentLng={currentLng}
              accuracy={accuracy}
              office={activeOffice}
              onRefreshGps={handleRefreshGps}
              onSimulateLocation={handleSimulateLocation}
              isRealGpsActive={isRealGpsActive}
            />

            <OfficeSettingsModal
              offices={offices}
              activeOffice={activeOffice}
              onSelectOffice={setActiveOffice}
              onAddOffice={handleAddOffice}
              onDeleteOffice={handleDeleteOffice}
              currentUser={activeEmployee}
              currentLat={currentLat}
              currentLng={currentLng}
            />
          </div>
        )}

        {/* Tab 4: Direktori Data Karyawan (Admin bisa melihat semua karyawan, User biasa tidak bisa) */}
        {currentTab === 'karyawan' && (
          <EmployeeDirectory
            employees={employees}
            currentUser={activeEmployee}
            onOpenAddUser={() => setIsAddUserOpen(true)}
            onOpenLogin={() => handleOpenLogin()}
            onEditEmployee={handleOpenEditEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        )}

        {/* Tab 5: Manajemen Jadwal Shift & Departemen (Hanya Admin yang dapat Buat & Hapus) */}
        {currentTab === 'shift_dept' && (
          <ShiftDepartmentManager
            shifts={shifts}
            departments={departments}
            employees={employees}
            currentUser={activeEmployee}
            onAddShift={handleAddShift}
            onDeleteShift={handleDeleteShift}
            onAddDepartment={handleAddDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onOpenLogin={() =>
              handleOpenLogin(
                undefined,
                'Login dengan akun Admin untuk mengelola jadwal shift dan departemen.'
              )
            }
          />
        )}
      </main>

      {/* Modal Login & Kunci Password */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        employees={employees}
        currentEmployee={loginTargetEmployee || activeEmployee}
        onLoginSuccess={(emp) => {
          setActiveEmployee(emp);
          setIsLoginModalOpen(false);
          setLoginForcedReason(null);
        }}
        forcedReason={loginForcedReason}
      />

      {/* Modal Tambah User (Admin Only) */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        currentUser={activeEmployee}
        shifts={shifts}
        departments={departments}
        onAddEmployee={handleAddEmployee}
      />

      {/* Modal Edit User & Kelola Hak Akses Admin (Admin Only) */}
      <EditEmployeeModal
        isOpen={isEditUserOpen}
        onClose={() => {
          setIsEditUserOpen(false);
          setEditingEmployee(null);
        }}
        employee={editingEmployee}
        currentUser={activeEmployee}
        totalAdminsCount={employees.filter((e) => e.role === 'admin').length}
        shifts={shifts}
        departments={departments}
        onSaveEmployee={handleUpdateEmployee}
      />

      <BiometricModal
        isOpen={isBiometricModalOpen}
        employee={activeEmployee}
        onClose={() => setIsBiometricModalOpen(false)}
        onSave={handleUpdateOwnBiometric}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Sistem Absensi Karyawan Geofencing GPS Real-Time & Verifikasi Biometrik Wajah
          </p>
          <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-400">
            <Database className="w-3.5 h-3.5 text-blue-500" />
            <span>Penyimpanan Cloud Aktif</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
