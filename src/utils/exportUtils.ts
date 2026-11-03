import { AttendanceRecord, MonthlyRecapStats } from '../types';

/**
 * Calculates monthly statistics for a given month string (e.g. "2026-09")
 */
export function calculateMonthlyStats(
  records: AttendanceRecord[],
  selectedMonth: string,
  totalEmployees: number
): MonthlyRecapStats {
  const monthRecords = records.filter(
    (r) => r.date.startsWith(selectedMonth) && r.approvalStatus !== 'PENDING'
  );
  const uniqueDates = Array.from(new Set(monthRecords.map((r) => r.date)));
  const totalWorkingDays = uniqueDates.length || 1;

  const totalExpectedAttendances = totalWorkingDays * totalEmployees;
  const actualAttendances = monthRecords.filter(
    (r) => r.status === 'HADIR_TEPAT_WAKTU' || r.status === 'TERLAMBAT'
  ).length;

  const onTimeCount = monthRecords.filter(
    (r) => r.status === 'HADIR_TEPAT_WAKTU'
  ).length;
  const lateCount = monthRecords.filter((r) => r.status === 'TERLAMBAT').length;
  const sickCount = monthRecords.filter((r) => r.status === 'SAKIT').length;
  const permitCount = monthRecords.filter((r) => r.status === 'IZIN').length;
  const absentCount = monthRecords.filter((r) => r.status === 'ALPHA').length;

  const totalLateMinutes = monthRecords.reduce(
    (sum, r) => sum + (r.lateMinutes || 0),
    0
  );
  const avgLateMinutes =
    lateCount > 0 ? Math.round(totalLateMinutes / lateCount) : 0;

  const attendanceRate =
    totalExpectedAttendances > 0
      ? Math.min(100, Math.round((actualAttendances / totalExpectedAttendances) * 100))
      : 0;

  // Format month name in Indonesian
  const [year, month] = selectedMonth.split('-');
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthName = `${monthNames[parseInt(month, 10) - 1] || month} ${year}`;

  return {
    month: selectedMonth,
    monthName,
    totalEmployees,
    totalWorkingDays,
    totalExpectedAttendances,
    actualAttendances,
    attendanceRate,
    onTimeCount,
    lateCount,
    sickCount,
    permitCount,
    absentCount,
    avgLateMinutes,
    topDepartment: 'Teknologi & IT',
  };
}

/**
 * Exports attendance records to a downloadable CSV spreadsheet
 */
export function exportAttendanceToCSV(
  records: AttendanceRecord[],
  filename: string
) {
  const deductionLabel = (record: AttendanceRecord) => {
    if (record.status === 'HADIR_TEPAT_WAKTU') return 'Hadir 1x';
    if (record.status !== 'TERLAMBAT') return '-';
    return record.lateMinutes <= 30 ? 'Potong 1/4' : 'Potong 1/2';
  };

  const statusPulangLabel = (record: AttendanceRecord) => {
    if (!record.checkOutTime) return 'Belum Pulang';
    return record.earlyMinutes > 0 ? 'Pulang Cepat' : 'Pulang Tepat Waktu';
  };

  const headers = [
    'Tanggal',
    'Nama Karyawan',
    'Departemen',
    'Jam Masuk',
    'Jam Pulang',
    'Durasi Kerja (Jam)',
    'Status Kehadiran',
    'Keterlambatan (Menit)',
    'Lokasi Presensi Masuk',
    'Lokasi Presensi Pulang',
    'Keterangan Potong',
    'Akurasi Wajah (%)',
    'Verifikasi Oleh',
    'Catatan',
  ];

  const statusLabel = (status: string) => {
    switch (status) {
      case 'HADIR_TEPAT_WAKTU':
        return 'Hadir Tepat Waktu';
      case 'TERLAMBAT':
        return 'Terlambat';
      case 'IZIN':
        return 'Izin';
      case 'SAKIT':
        return 'Sakit';
      case 'ALPHA':
        return 'Alpha / Tanpa Keterangan';
      default:
        return status;
    }
  };

  const rows = records.map((r) => [
    `"${r.date}"`,
    `"${r.employeeName}"`,
    `"${r.department}"`,
    `"${r.checkInTime || '-'}"`,
    `"${r.checkOutTime || '-'}"`,
    `"${r.workHours ? r.workHours.toFixed(1) : '-'}"`,
    `"${statusLabel(r.status)}"`,
    `"${r.lateMinutes || 0}"`,
    `"${r.checkInLocationName || '-'}"`,
    `"${r.checkOutLocationName || '-'}"`,
    `"${statusPulangLabel(r)}"`,
    `"${deductionLabel(r)}"`,
    `"${r.faceMatchScore ? r.faceMatchScore.toFixed(1) : '-'}"`,
    `"${r.verifiedBy}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers browser print dialog for an official monthly attendance report
 */
export function printMonthlyReport(
  monthName: string,
  stats: MonthlyRecapStats,
  records: AttendanceRecord[],
  reportTitle?: string,
  employeeInfo?: { name: string; nik?: string; department?: string }
) {
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) {
    window.print();
    return;
  }

  const title = reportTitle || 'LAPORAN REKAPITULASI PRESENSI KARYAWAN';

  const deductionLabel = (record: AttendanceRecord) => {
    if (record.status === 'HADIR_TEPAT_WAKTU') return 'Hadir 1x';
    if (record.status !== 'TERLAMBAT') return '-';
    return record.lateMinutes <= 30 ? 'Potong 1/4' : 'Potong 1/2';
  };

  const statusPulangLabel = (record: AttendanceRecord) => {
    if (!record.checkOutTime) return 'Belum Pulang';
    return record.earlyMinutes > 0 ? 'Pulang Cepat' : 'Pulang Tepat Waktu';
  };

  const rowsHtml = records
    .slice(0, 100) // First 100 rows for clean print
    .map(
      (r, i) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px;">${i + 1}</td>
        <td style="padding: 6px 8px;">${r.date}</td>
        <td style="padding: 6px 8px; font-weight: 600;">${r.employeeName}</td>
        <td style="padding: 6px 8px;">${r.department}</td>
        <td style="padding: 6px 8px;">${r.checkInTime || '-'}</td>
        <td style="padding: 6px 8px;">${r.checkOutTime || '-'}</td>
        <td style="padding: 6px 8px; font-weight: 600; color: ${
          r.status === 'HADIR_TEPAT_WAKTU'
            ? '#059669'
            : r.status === 'TERLAMBAT'
            ? '#d97706'
            : '#dc2626'
        };">
          ${
            r.status === 'HADIR_TEPAT_WAKTU'
              ? 'Tepat Waktu'
              : r.status === 'TERLAMBAT'
              ? `Terlambat (${r.lateMinutes}m)`
              : r.status
          }
        </td>
        <td style="padding: 6px 8px;">${statusPulangLabel(r)}</td>
        <td style="padding: 6px 8px;">${deductionLabel(r)}</td>
        <td style="padding: 6px 8px;">${r.faceMatchScore > 0 ? `${r.faceMatchScore.toFixed(0)}% Match` : '-'}</td>
      </tr>
    `
    )
    .join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title} - ${monthName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 30px; color: #1e293b; }
          .header { border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
          .kpi-card { border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; background: #f8fafc; }
          .kpi-card .val { font-size: 20px; font-weight: bold; color: #0f172a; }
          .kpi-card .lbl { font-size: 11px; color: #64748b; text-transform: uppercase; }
          .emp-info { background: #f1f5f9; padding: 10px 14px; border-radius: 6px; margin-bottom: 16px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; text-align: left; }
          th { background: #f1f5f9; padding: 8px; font-size: 11px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
          @media print {
            body { margin: 0; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2 style="margin: 0 0 4px 0;">${title}</h2>
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            Periode: <strong>${monthName}</strong> • Sistem Verifikasi GPS & Pengenalan Wajah
          </p>
        </div>

        ${
          employeeInfo
            ? `<div class="emp-info">
                <strong>Data Karyawan:</strong> ${employeeInfo.name} ${
                employeeInfo.nik ? `(${employeeInfo.nik})` : ''
              } &nbsp;•&nbsp; <strong>Departemen:</strong> ${
                employeeInfo.department || '-'
              }
              </div>`
            : ''
        }

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="lbl">Tingkat Kehadiran</div>
            <div class="val" style="color: #059669;">${stats.attendanceRate}%</div>
          </div>
          <div class="kpi-card">
            <div class="lbl">Hadir Tepat Waktu</div>
            <div class="val">${stats.onTimeCount} kali</div>
          </div>
          <div class="kpi-card">
            <div class="lbl">Keterlambatan</div>
            <div class="val" style="color: #d97706;">${stats.lateCount} kali</div>
          </div>
          <div class="kpi-card">
            <div class="lbl">Izin / Sakit / Alpha</div>
            <div class="val">${stats.sickCount + stats.permitCount + stats.absentCount} kali</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Nama Karyawan</th>
              <th>Departemen</th>
              <th>Masuk</th>
              <th>Pulang</th>
              <th>Status Masuk</th>
              <th>Status Pulang</th>
              <th>Keterangan Potong</th>
              <th>Akurasi Wajah</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid;">
          <div style="text-align: center; width: 200px;">
            <p style="font-size: 12px; margin-bottom: 60px;">Mengetahui,<br><strong>Operational Manager</strong></p>
            <p style="font-size: 12px; border-top: 1px solid #94a3b8; padding-top: 4px;">( Apri Gumelar )</p>
          </div>
          <div style="text-align: center; width: 200px;">
            <p style="font-size: 12px; margin-bottom: 60px;">Dibuat Otomatis Oleh,<br><strong>Admin Absensi</strong></p>
            <p style="font-size: 12px; border-top: 1px solid #94a3b8; padding-top: 4px;">( Admin )</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
