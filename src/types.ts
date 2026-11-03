export interface ShiftSchedule {
  id: string;
  name: string;
  startTime: string; // e.g., "08:30"
  endTime: string;   // e.g., "17:30"
  graceMinutes: number; // e.g., 15 minutes grace period
  description?: string;
  isDefault?: boolean;
  createdAt?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  color?: string;
  managerName?: string;
  createdAt?: string;
}

export interface Employee {
  id: string;
  nik: string;
  name: string;
  role: 'admin' | 'employee';
  password?: string;
  position: string;
  department: string;
  avatarUrl: string;
  email: string;
  phone: string;
  enrolledFaceUrl: string;
  shift: {
    name: string;
    startTime: string; // e.g., "08:30"
    endTime: string;   // e.g., "17:30"
    graceMinutes: number; // e.g., 15 minutes grace period
  };
}

export interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radiusMeters: number; // e.g., 100 meters
  createdBy?: string;
  createdAt?: string;
}

export type AttendanceType = 'MASUK' | 'PULANG';
export type AttendanceStatus = 'HADIR_TEPAT_WAKTU' | 'TERLAMBAT' | 'PULANG_CEPAT' | 'LEMBUR' | 'IZIN' | 'SAKIT' | 'ALPHA' | 'MENUNGGU_APPROVAL';
export type AttendanceMode = 'OFFICE' | 'CUSTOMER_VISIT';
export type ApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string; // YYYY-MM-DD
  month?: string; // YYYY-MM
  checkInTime?: string; // HH:mm:ss
  checkOutTime?: string; // HH:mm:ss
  checkInPhoto?: string; // Base64 or URL
  checkOutPhoto?: string;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInDistanceMeters?: number;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutDistanceMeters?: number;
  checkInLocationName?: string;
  checkOutLocationName?: string;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyMinutes: number;
  workHours?: number; // In hours
  faceMatchScore: number; // 0 - 100%
  notes?: string;
  evidencePhoto?: string;
  verifiedBy: 'Sistem Biometrik & GPS' | 'Manual Admin';
  attendanceMode?: AttendanceMode;
  customerName?: string;
  visitPurpose?: string;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
}

export interface MonthlyRecapStats {
  month: string; // e.g., "2026-09"
  monthName: string; // e.g., "September 2026"
  totalEmployees: number;
  totalWorkingDays: number;
  totalExpectedAttendances: number;
  actualAttendances: number;
  attendanceRate: number; // percentage
  onTimeCount: number;
  lateCount: number;
  sickCount: number;
  permitCount: number;
  absentCount: number;
  avgLateMinutes: number;
  topDepartment: string;
}
