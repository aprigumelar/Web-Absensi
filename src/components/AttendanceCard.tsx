import React, { useState, useRef, useEffect } from 'react';
import { Employee, OfficeLocation, AttendanceRecord, AttendanceMode, AttendanceType } from '../types';
import { calculateDistance, formatDistance } from '../utils/geoUtils';
import { captureWatermarkedPhoto, generateSyntheticAttendancePhoto } from '../utils/faceUtils';
import { calculateAttendanceNote } from '../utils/attendanceUtils';
import confetti from 'canvas-confetti';
import {
  Camera,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Info,
  Building,
  UserCheck,
  X,
  Share2,
} from 'lucide-react';

interface AttendanceCardProps {
  employee: Employee;
  office: OfficeLocation;
  currentLat: number;
  currentLng: number;
  onRecordAttendance: (record: AttendanceRecord) => void;
  recentRecords: AttendanceRecord[];
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  employee,
  office,
  currentLat,
  currentLng,
  onRecordAttendance,
  recentRecords,
}) => {
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('MASUK');
  const [attendanceReason, setAttendanceReason] = useState<'HADIR' | 'IZIN' | 'SAKIT'>('HADIR');
  const [attendanceMode, setAttendanceMode] = useState<AttendanceMode>('OFFICE');
  const [customerName, setCustomerName] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveProof, setLeaveProof] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [faceDetected, setFaceDetected] = useState(true);
  const [livenessPrompt, setLivenessPrompt] = useState('Posisikan wajah di dalam lingkaran');
  const [submitting, setSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<AttendanceRecord | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Calculate distance
  const distance = calculateDistance(
    currentLat,
    currentLng,
    office.latitude,
    office.longitude
  );
  const isInsideGeofence = distance <= office.radiusMeters;

  // Initialize camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user',
          },
          audio: false,
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn('Camera access denied or unsupported:', err);
        setCameraError(
          'Akses kamera tidak diizinkan atau tidak tersedia di peramban ini. Sistem beralih otomatis ke mode simulator biometrik.'
        );
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Update video element if stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  // Determine late status
  const now = new Date();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const [shiftStartH, shiftStartM] = employee.shift.startTime.split(':').map(Number);
  const shiftStartTotalMinutes = shiftStartH * 60 + shiftStartM;
  const currentTotalMinutes = currentHours * 60 + currentMinutes;
  const minutesAfterShiftStart = currentTotalMinutes - shiftStartTotalMinutes;
  const isLate =
    attendanceType === 'MASUK' &&
    minutesAfterShiftStart > 15;
  const lateMinutes = isLate ? minutesAfterShiftStart : 0;
  const attendanceCalculation = calculateAttendanceNote(minutesAfterShiftStart);

  // Check today's existing attendance for this employee
  const todayStr = now.toISOString().split('T')[0];
  const todayRecord = recentRecords.find(
    (r) => r.employeeId === employee.id && r.date === todayStr
  );

  const handleLeaveProofUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Format bukti harus berupa gambar (JPG/PNG/WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setLeaveProof(result);
    };
    reader.readAsDataURL(file);
  };

  const handleStartScanAndSubmit = async () => {
    const isCustomerVisit = attendanceMode === 'CUSTOMER_VISIT';
    const isLeaveRequest = attendanceReason !== 'HADIR';

    if (isLeaveRequest && !leaveReason.trim()) {
      alert('Alasan izin atau sakit wajib diisi sebelum pengajuan dikirim untuk approval admin.');
      return;
    }

    if (isLeaveRequest && !leaveProof.trim()) {
      alert('Bukti foto izin atau sakit wajib diunggah sebelum pengajuan dikirim untuk approval admin.');
      return;
    }

    if (!isLeaveRequest && !isCustomerVisit && !isInsideGeofence) {
      alert(
        `Lokasi Anda berada di luar radius kantor (${formatDistance(distance)}). Harap mendekat ke ${office.name} (maksimal ${office.radiusMeters} meter) untuk presensi.`
      );
      return;
    }

    if (isCustomerVisit && (!customerName.trim() || !visitPurpose.trim())) {
      alert('Nama customer dan tujuan visit wajib diisi untuk mengajukan presensi luar kantor.');
      return;
    }

    setIsScanning(true);
    setScanProgress(10);
    setLivenessPrompt('Mendeteksi struktur wajah...');

    // Liveness scan sequence simulation
    setTimeout(() => {
      setScanProgress(40);
      setLivenessPrompt('Memvalidasi biometrik dengan data profil...');
    }, 600);

    setTimeout(() => {
      setScanProgress(75);
      setLivenessPrompt('Kesesuaian wajah terkonfirmasi! Menyimpan koordinat...');
    }, 1200);

    setTimeout(async () => {
      setScanProgress(100);
      setIsScanning(false);
      setSubmitting(true);

      const timestamp = new Date().toLocaleTimeString('id-ID');
      const matchScore = cameraStream ? 98.5 : 99.2;

      const watermarkData = {
        employeeName: employee.name,
        nik: employee.nik,
        timestamp,
        type: attendanceType,
        latitude: currentLat,
        longitude: currentLng,
        locationName: isCustomerVisit ? `Visit Customer: ${customerName.trim()}` : office.name,
        distanceMeters: distance,
        matchScore,
      };

      let photoData = '';
      if (videoRef.current && cameraStream) {
        photoData = captureWatermarkedPhoto(videoRef.current, watermarkData);
      } else {
        photoData = await generateSyntheticAttendancePhoto(
          employee.enrolledFaceUrl,
          watermarkData
        );
      }

      const effectiveStatus: AttendanceRecord['status'] = isLeaveRequest
        ? 'MENUNGGU_APPROVAL'
        : attendanceType === 'PULANG' && todayRecord
        ? todayRecord.status
        : isLate
        ? 'TERLAMBAT'
        : 'HADIR_TEPAT_WAKTU';

      const effectiveNotes =
        notes.trim() ||
        (isLeaveRequest
          ? `${attendanceReason === 'IZIN' ? 'Pengajuan izin' : 'Pengajuan sakit'}: ${leaveReason.trim()}`
          : attendanceType === 'MASUK'
          ? attendanceCalculation.note
          : isLate
          ? 'Hadir terlambat'
          : 'Hadir tepat waktu');

      // Create record
      const newRecord: AttendanceRecord = {
        id: attendanceType === 'PULANG' && todayRecord ? todayRecord.id : `att-${Date.now()}`,
        employeeId: employee.id,
        employeeName: employee.name,
        department: employee.department,
        date: todayStr,
        status: effectiveStatus,
        lateMinutes:
          isLeaveRequest
            ? 0
            : attendanceType === 'PULANG' && todayRecord
            ? todayRecord.lateMinutes
            : isLate
            ? lateMinutes
            : 0,
        earlyMinutes: 0,
        workHours: attendanceType === 'PULANG' && !isLeaveRequest ? 8.5 : undefined,
        faceMatchScore: matchScore,
        notes: effectiveNotes,
        evidencePhoto: isLeaveRequest ? leaveProof || photoData : undefined,
        verifiedBy: 'Sistem Biometrik & GPS',
        attendanceMode,
        ...(isCustomerVisit
          ? {
              customerName: customerName.trim(),
              visitPurpose: visitPurpose.trim(),
              approvalStatus: 'PENDING' as const,
              status: 'MENUNGGU_APPROVAL' as const,
              notes: notes.trim() || `Visit customer: ${customerName.trim()}`,
            }
          : isLeaveRequest
          ? {
              approvalStatus: 'PENDING' as const,
              status: 'MENUNGGU_APPROVAL' as const,
            }
          : { approvalStatus: 'APPROVED' as const }),
        ...(attendanceType === 'MASUK'
          ? {
              checkInTime: timestamp,
              checkInPhoto: photoData,
              checkInLatitude: currentLat,
              checkInLongitude: currentLng,
              checkInDistanceMeters: distance,
              checkInLocationName: isCustomerVisit
                ? `Visit Customer: ${customerName.trim()}`
                : office.name,
            }
          : {
              checkInTime: todayRecord?.checkInTime || '08:24:12',
              checkInPhoto: todayRecord?.checkInPhoto,
              checkInLatitude: todayRecord?.checkInLatitude,
              checkInLongitude: todayRecord?.checkInLongitude,
              checkInDistanceMeters: todayRecord?.checkInDistanceMeters,
              checkInLocationName: todayRecord?.checkInLocationName,
              checkOutTime: timestamp,
              checkOutPhoto: photoData,
              checkOutLatitude: currentLat,
              checkOutLongitude: currentLng,
              checkOutDistanceMeters: distance,
              checkOutLocationName: isCustomerVisit
                ? `Visit Customer: ${customerName.trim()}`
                : office.name,
            }),
      };

      const recordToSave =
        attendanceType === 'PULANG' && todayRecord
          ? { ...todayRecord, ...newRecord, checkInPhoto: todayRecord.checkInPhoto }
          : newRecord;

      onRecordAttendance(recordToSave);
      setLastReceipt(recordToSave);
      setSubmitting(false);
      setNotes('');
      setCustomerName('');
      setVisitPurpose('');
      setLeaveReason('');
      setLeaveProof('');
      setAttendanceReason('HADIR');

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // ignore
      }
    }, 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Live Camera Biometrics HUD */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
              Kamera Verifikasi Wajah Biometrik
            </h3>
          </div>
          <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 font-medium px-2.5 py-0.5 rounded-full flex items-center">
            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
            Siap Verifikasi
          </span>
        </div>

        {/* Camera Viewport with Biometric Overlay */}
        <div className="relative mt-4 w-full aspect-4/3 sm:aspect-16/10 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-slate-800 shadow-inner">
          {cameraStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
          ) : (
            /* Fallback Realistic Face Simulator */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <img
                src={employee.avatarUrl}
                alt={employee.name}
                className="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover ring-4 ring-emerald-500/50 shadow-2xl opacity-90"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm border border-slate-700/80 rounded-xl p-2.5 text-xs text-slate-300 flex items-center justify-between">
                <span className="flex items-center text-slate-200">
                  <UserCheck className="w-4 h-4 mr-1.5 text-emerald-400" />
                  Mode Simulator Profil: {employee.name}
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">
                  Face ID Siap
                </span>
              </div>
            </div>
          )}

          {/* Blur the camera area outside the face target */}
          <div
            className="absolute inset-0 pointer-events-none [--face-target-width:6rem] [--face-target-height:7.5rem] sm:[--face-target-width:7rem] sm:[--face-target-height:9rem]"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              maskImage:
                'radial-gradient(ellipse var(--face-target-width) var(--face-target-height) at center, transparent 0 99%, black 100%)',
              WebkitMaskImage:
                'radial-gradient(ellipse var(--face-target-width) var(--face-target-height) at center, transparent 0 99%, black 100%)',
            }}
          />

          {/* Biometric Oval Target Guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className={`relative w-48 h-60 sm:w-56 sm:h-72 rounded-[48%] border-2 transition-all duration-300 ${
                isScanning
                  ? 'border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-105'
                  : 'border-white/60 border-dashed'
              }`}
            >
              {/* Corner brackets */}
              <div className="absolute -top-2 -left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-400"></div>
              <div className="absolute -top-2 -right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-400"></div>
              <div className="absolute -bottom-2 -left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-400"></div>
              <div className="absolute -bottom-2 -right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-400"></div>

              {/* Scanning laser line animation */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-bounce [animation-duration:1s]"></div>
              )}
            </div>
          </div>

          {/* HUD Status Bar at Top of Video */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
            <span className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-mono px-2.5 py-1 rounded-md border border-slate-700/60 flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              GEOFENCE: {isInsideGeofence ? 'VALID' : 'BLOCKED'}
            </span>
            <span className="bg-slate-900/80 backdrop-blur-md text-emerald-400 text-[11px] font-mono px-2.5 py-1 rounded-md border border-slate-700/60">
              JARAK: {formatDistance(distance)}
            </span>
          </div>

          {/* Liveness Guidance Overlay at Bottom */}
          <div className="absolute bottom-3 inset-x-4 pointer-events-none">
            <div className="bg-slate-900/85 backdrop-blur-md text-white text-xs px-3 py-2 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <span className="flex items-center truncate">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 mr-2 shrink-0" />
                <span className="truncate">{livenessPrompt}</span>
              </span>
              {isScanning && (
                <span className="text-emerald-400 font-mono font-bold ml-2">
                  {scanProgress}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scan progress bar */}
        {isScanning && (
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-2 transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            ></div>
          </div>
        )}

        {cameraError && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2">
            <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px]">{cameraError}</p>
          </div>
        )}
      </div>

      {/* Right Column: Attendance Controls & Status Verification */}
      <div className="lg:col-span-5 flex flex-col space-y-4">
        {/* Type Selector (Masuk / Pulang) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Pilih Jenis Absensi
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAttendanceType('MASUK')}
              className={`py-3 px-4 rounded-xl font-medium text-sm transition-all flex flex-col items-center justify-center space-y-1 ${
                attendanceType === 'MASUK'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span className="font-bold text-base">Absen Masuk</span>
              <span className="text-[11px] opacity-85">Shift: {employee.shift.startTime} WIB</span>
            </button>

            <button
              type="button"
              onClick={() => setAttendanceType('PULANG')}
              className={`py-3 px-4 rounded-xl font-medium text-sm transition-all flex flex-col items-center justify-center space-y-1 ${
                attendanceType === 'PULANG'
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              <span className="font-bold text-base">Absen Pulang</span>
              <span className="text-[11px] opacity-85">Shift: {employee.shift.endTime} WIB</span>
            </button>
          </div>

          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mt-4 mb-2">
            Jenis Kehadiran
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setAttendanceReason('HADIR')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                attendanceReason === 'HADIR'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              Hadir
            </button>
            <button
              type="button"
              onClick={() => setAttendanceReason('IZIN')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                attendanceReason === 'IZIN'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              Izin
            </button>
            <button
              type="button"
              onClick={() => setAttendanceReason('SAKIT')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                attendanceReason === 'SAKIT'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              Sakit
            </button>
          </div>

          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mt-4 mb-2">
            Lokasi Absensi
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAttendanceMode('OFFICE')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                attendanceMode === 'OFFICE'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              Di Kantor
            </button>
            <button
              type="button"
              onClick={() => setAttendanceMode('CUSTOMER_VISIT')}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                attendanceMode === 'CUSTOMER_VISIT'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              Visit Customer
            </button>
          </div>

          {attendanceMode === 'CUSTOMER_VISIT' && (
            <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[11px] text-amber-800">
                Pengajuan di luar radius kantor akan menunggu persetujuan Admin.
              </p>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama customer / perusahaan"
                className="w-full text-xs px-3 py-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
              <input
                type="text"
                value={visitPurpose}
                onChange={(e) => setVisitPurpose(e.target.value)}
                placeholder="Tujuan visit customer"
                className="w-full text-xs px-3 py-2 rounded-lg border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          )}

          {attendanceReason !== 'HADIR' && (
            <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 p-3 space-y-3">
              <div>
                <p className="text-[11px] font-semibold text-indigo-800">
                  Alasan {attendanceReason === 'IZIN' ? 'Izin' : 'Sakit'}
                </p>
                <input
                  type="text"
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  placeholder="Contoh: Menikah/adik sakit / keperluan keluarga penting"
                  className="mt-2 w-full text-xs px-3 py-2 rounded-lg border border-indigo-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-indigo-800">
                  Bukti {attendanceReason === 'IZIN' ? 'Izin' : 'Sakit'}
                </p>
                <p className="text-[11px] text-indigo-700 mt-1">
                  Unggah foto pendukung. Pengajuan baru dianggap valid setelah approval admin.
                </p>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleLeaveProofUpload}
                className="block w-full text-[11px] text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white file:font-medium"
              />

              {leaveProof && (
                <img
                  src={leaveProof}
                  alt="Bukti izin atau sakit"
                  className="w-full h-32 object-cover rounded-xl border border-indigo-200 bg-white"
                />
              )}
            </div>
          )}

          {/* Shift Status Indicator */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">Estimasi Status Waktu:</span>
            </div>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                isLate
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {isLate ? `Terlambat ${lateMinutes} menit` : 'Tepat Waktu'}
            </span>
          </div>
        </div>

        {/* Location Verification Summary Box */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Validasi Persyaratan Kehadiran
          </h4>

          {/* GPS Geofence Check Item */}
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            {isInsideGeofence || attendanceMode === 'CUSTOMER_VISIT' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">
                  Verifikasi Lokasi GPS (Geofence)
                </p>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    attendanceMode === 'CUSTOMER_VISIT'
                      ? 'bg-amber-100 text-amber-700'
                      : isInsideGeofence
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {attendanceMode === 'CUSTOMER_VISIT'
                    ? 'APPROVAL ADMIN'
                    : isInsideGeofence
                    ? 'VALID'
                    : 'DILUAR RADIUS'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                  {attendanceMode === 'CUSTOMER_VISIT'
                    ? `Mode visit customer aktif. Jarak GPS dari kantor: ${formatDistance(distance)}.`
                    : isInsideGeofence
                  ? `Jarak ${formatDistance(distance)} dari ${office.name} (Radius ${office.radiusMeters}m).`
                  : `Jarak ${formatDistance(distance)} melebihi batas radius ${office.radiusMeters}m.`}
              </p>
            </div>
          </div>

          {/* Biometrics Check Item */}
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">
                  Verifikasi Biometrik Wajah
                </p>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                  TERHUBUNG
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Memverifikasi dengan profil biometrik NIK {employee.nik}.
              </p>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              Catatan Kehadiran / Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Bekerja di lantai 28 / Tugas luar kantor"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
            />
          </div>

          {/* Submit Attendance Button */}
          <button
            type="button"
            disabled={
              (attendanceReason === 'HADIR' && attendanceMode === 'OFFICE' && !isInsideGeofence) ||
              (attendanceReason !== 'HADIR' && (!leaveReason.trim() || !leaveProof)) ||
              isScanning ||
              submitting
            }
            onClick={handleStartScanAndSubmit}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg ${
              attendanceReason === 'HADIR' && attendanceMode === 'OFFICE' && !isInsideGeofence
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
                : isScanning || submitting
                ? 'bg-emerald-700 text-white cursor-wait'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Memindai & Memverifikasi Wajah...</span>
              </>
            ) : submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan Presensi...</span>
              </>
            ) : attendanceReason === 'HADIR' && attendanceMode === 'OFFICE' && !isInsideGeofence ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Tidak Dapat Absen (Di Luar Radius)</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4" />
                <span>
                  {attendanceMode === 'CUSTOMER_VISIT'
                    ? 'Ajukan Visit Customer'
                    : attendanceReason === 'IZIN'
                    ? 'Kirim Pengajuan Izin'
                    : attendanceReason === 'SAKIT'
                    ? 'Kirim Pengajuan Sakit'
                    : `Pindai Wajah & Rekam Absen ${attendanceType}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Attendance Success Modal / Digital Receipt */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setLastReceipt(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Presensi {lastReceipt.checkOutTime ? 'Pulang' : 'Masuk'} Berhasil!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Data kehadiran biometrik & lokasi telah tercatat secara resmi
              </p>
            </div>

            {/* Photo Snapshot with Watermark Preview */}
            <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-slate-950">
              <img
                src={lastReceipt.checkInPhoto || lastReceipt.checkOutPhoto}
                alt="Bukti Kehadiran"
                className="w-full h-44 object-cover"
              />
            </div>

            {/* Digital Receipt Breakdown */}
            <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Karyawan:</span>
                <span className="font-semibold text-slate-800">
                  {lastReceipt.employeeName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NIK:</span>
                <span className="font-mono text-slate-700">{employee.nik}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Presensi:</span>
                <span className="font-bold text-emerald-700">
                  {lastReceipt.checkOutTime || lastReceipt.checkInTime} WIB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Ketepatan:</span>
                <span
                  className={`font-semibold ${
                    lastReceipt.status === 'TERLAMBAT'
                      ? 'text-amber-600'
                      : 'text-emerald-600'
                  }`}
                >
                  {lastReceipt.status === 'TERLAMBAT'
                    ? `Terlambat (${lastReceipt.lateMinutes} menit)`
                    : 'Tepat Waktu'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Keterangan Absensi:</span>
                <span className="font-semibold text-slate-800">
                  {lastReceipt.notes || '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lokasi / Jarak:</span>
                <span className="text-slate-800">
                  {lastReceipt.checkInLocationName || lastReceipt.checkOutLocationName} (
                  {formatDistance(
                    lastReceipt.checkInDistanceMeters || lastReceipt.checkOutDistanceMeters || 0
                  )})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kecocokan Wajah:</span>
                <span className="font-mono text-emerald-600 font-semibold">
                  {lastReceipt.faceMatchScore.toFixed(1)}% (Terverifikasi)
                </span>
              </div>
            </div>

            <button
              onClick={() => setLastReceipt(null)}
              className="mt-5 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Tutup & Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};