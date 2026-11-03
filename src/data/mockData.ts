import { Employee, AttendanceRecord, ShiftSchedule, Department } from '../types';

export const INITIAL_SHIFTS: ShiftSchedule[] = [
  {
    id: 'shift-1789433955514',
    name: 'Normal Office',
    startTime: '08:30',
    endTime: '17:30',
    graceMinutes: 15,
    description: 'Jam kerja standar operasional kantor pusatOperasional, Warehouse, Logistik & IT',
    isDefault: true,
  },
  {
    id: 'shift-1789434016225',
    name: 'Office Boy',
    startTime: '07:00',
    endTime: '17:30',
    graceMinutes: 15,
    description: 'Hanya berlaku di hari tertentu saja untuk Office Boy',
  },
  {
    id: 'shift-1789434062658',
    name: 'Account Manager Shift',
    startTime: '08:30',
    endTime: '17:30',
    graceMinutes: 15,
    description: 'Sales Office',
  },
];

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-1789534241757',
    name: 'Operasioanal',
    description: 'Mengelola seluruh sumber daya perusahaan dan juga membantu sales untuk mencapai target',
    color: 'emerald',
    managerName: 'Apri Gumelar',
  },
  {
    id: 'dept-1789534618637',
    name: 'Sales',
    description: 'Melakukan penjualan',
    color: 'blue',
    managerName: 'Apri Gumelar',
  },
  {
    id: 'dept-1789534666354',
    name: 'Technical',
    description: 'Melakukan perbaikan secara onsite',
    color: 'amber',
    managerName: 'Apri Gumelar',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-001',
    nik: 'EMP-2024-001',
    name: 'Administrator',
    role: 'admin',
    password: 'admin123',
    position: 'Manager',
    department: 'Operational',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    enrolledFaceUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    email: 'xxxxx@tecso.co.id',
    phone: '+62 8xx-xxxx-xxxx',
    shift: {
      name: 'Shift Reguler IT',
      startTime: '08:30',
      endTime: '17:30',
      graceMinutes: 15,
    },
  },
  {
    id: 'emp-002',
    nik: 'EMP-2024-002',
    name: 'Siti Rahmawati, S.E',
    role: 'employee',
    password: 'user123',
    position: 'Finance & Accounting Lead',
    department: 'Keuangan & Akuntansi',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    enrolledFaceUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    email: 'siti.rahmawati@perusahaan.co.id',
    phone: '+62 813-9876-5432',
    shift: {
      name: 'Shift Reguler Pagi',
      startTime: '08:00',
      endTime: '17:00',
      graceMinutes: 10,
    },
  },
  {
    id: 'emp-003',
    nik: 'EMP-2024-003',
    name: 'Ahmad Fauzi, M.M',
    role: 'employee',
    password: 'user123',
    position: 'Marketing & Brand Strategist',
    department: 'Pemasaran & Sales',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    enrolledFaceUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    email: 'ahmad.fauzi@perusahaan.co.id',
    phone: '+62 821-2233-4455',
    shift: {
      name: 'Shift Fleksibel Pemasaran',
      startTime: '09:00',
      endTime: '18:00',
      graceMinutes: 15,
    },
  },
  {
    id: 'emp-004',
    nik: 'EMP-2024-004',
    name: 'Dewi Lestari, S.Psi',
    role: 'admin',
    password: 'admin123',
    position: 'Human Resources Manager & Admin',
    department: 'Sumber Daya Manusia (HR)',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    enrolledFaceUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    email: 'dewi.lestari@perusahaan.co.id',
    phone: '+62 856-1122-3344',
    shift: {
      name: 'Shift Kantor Pusat',
      startTime: '08:00',
      endTime: '17:00',
      graceMinutes: 15,
    },
  },
  {
    id: 'emp-005',
    nik: 'EMP-2024-005',
    name: 'Rian Pratama',
    role: 'employee',
    password: 'user123',
    position: 'Operations & Logistics Officer',
    department: 'Operasional',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    enrolledFaceUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    email: 'rian.pratama@perusahaan.co.id',
    phone: '+62 878-5566-7788',
    shift: {
      name: 'Shift Operasional Lapangan',
      startTime: '08:00',
      endTime: '17:00',
      graceMinutes: 10,
    },
  },
];

// Generate realistic pre-existing attendance data for current month (September 2026) and previous month (August 2026)
export function generateInitialAttendanceHistory(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const employees = INITIAL_EMPLOYEES;

  // Days in September 2026 up to current date (14 Sept 2026)
  const septDays = [
    '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',
    '2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
    '2026-09-14',
  ];

  // Days in August 2026 (full month sample)
  const augDays = [
    '2026-08-03', '2026-08-04', '2026-08-05', '2026-08-06', '2026-08-07',
    '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
    '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
    '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28',
  ];

  let idCounter = 1000;

  const processDays = (days: string[]) => {
    days.forEach((dateStr) => {
      employees.forEach((emp, index) => {
        idCounter++;
        // Variety of attendance states
        const rand = (index * 13 + parseInt(dateStr.slice(-2))) % 100;

        if (rand < 75) {
          // On time
          const minuteOffset = Math.floor((rand % 20) - 15); // -15m to +5m
          const [startH, startM] = emp.shift.startTime.split(':').map(Number);
          let checkInM = startM + minuteOffset;
          let checkInH = startH;
          if (checkInM < 0) {
            checkInM += 60;
            checkInH -= 1;
          }
          const checkInTime = `${String(checkInH).padStart(2, '0')}:${String(checkInM).padStart(2, '0')}:24`;
          const checkOutTime = '17:35:12';
          const distance = 14 + (rand % 35);

          records.push({
            id: `att-${idCounter}`,
            employeeId: emp.id,
            employeeName: emp.name,
            department: emp.department,
            date: dateStr,
            checkInTime,
            checkOutTime,
            checkInLatitude: -6.225588 + (Math.random() - 0.5) * 0.0003,
            checkInLongitude: 106.809424 + (Math.random() - 0.5) * 0.0003,
            checkInDistanceMeters: distance,
            checkInLocationName: 'Kantor Pusat SCBD Jakarta',
            status: 'HADIR_TEPAT_WAKTU',
            lateMinutes: 0,
            earlyMinutes: 0,
            workHours: 8.5,
            faceMatchScore: 97.5 + (rand % 3),
            notes: 'Hadir tepat waktu di kantor',
            verifiedBy: 'Sistem Biometrik & GPS',
            checkInPhoto: emp.avatarUrl,
          });
        } else if (rand < 88) {
          // Terlambat (Late)
          const lateMin = 16 + (rand % 35);
          const [startH, startM] = emp.shift.startTime.split(':').map(Number);
          const checkInM = (startM + lateMin) % 60;
          const checkInH = startH + Math.floor((startM + lateMin) / 60);
          const checkInTime = `${String(checkInH).padStart(2, '0')}:${String(checkInM).padStart(2, '0')}:15`;
          const distance = 25 + (rand % 40);

          records.push({
            id: `att-${idCounter}`,
            employeeId: emp.id,
            employeeName: emp.name,
            department: emp.department,
            date: dateStr,
            checkInTime,
            checkOutTime: '17:45:00',
            checkInLatitude: -6.225588 + (Math.random() - 0.5) * 0.0003,
            checkInLongitude: 106.809424 + (Math.random() - 0.5) * 0.0003,
            checkInDistanceMeters: distance,
            checkInLocationName: 'Kantor Pusat SCBD Jakarta',
            status: 'TERLAMBAT',
            lateMinutes: lateMin,
            earlyMinutes: 0,
            workHours: 8.1,
            faceMatchScore: 96.2,
            notes: 'Kemacetan lalu lintas tol dalam kota',
            verifiedBy: 'Sistem Biometrik & GPS',
            checkInPhoto: emp.avatarUrl,
          });
        } else if (rand < 94) {
          // Izin / Sakit
          const isSick = rand % 2 === 0;
          records.push({
            id: `att-${idCounter}`,
            employeeId: emp.id,
            employeeName: emp.name,
            department: emp.department,
            date: dateStr,
            status: isSick ? 'SAKIT' : 'IZIN',
            lateMinutes: 0,
            earlyMinutes: 0,
            workHours: 0,
            faceMatchScore: 0,
            notes: isSick ? 'Surat dokter terlampir di portal HR' : 'Keperluan keluarga penting',
            verifiedBy: 'Manual Admin',
          });
        } else {
          // Alpha / Tidak Hadir
          records.push({
            id: `att-${idCounter}`,
            employeeId: emp.id,
            employeeName: emp.name,
            department: emp.department,
            date: dateStr,
            status: 'ALPHA',
            lateMinutes: 0,
            earlyMinutes: 0,
            workHours: 0,
            faceMatchScore: 0,
            notes: 'Tanpa keterangan resmi',
            verifiedBy: 'Manual Admin',
          });
        }
      });
    });
  };

  processDays(augDays);
  processDays(septDays);

  return records;
}
