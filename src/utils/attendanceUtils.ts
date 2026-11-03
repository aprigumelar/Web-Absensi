export type AttendanceDeduction = '1x' | 'POTONG_1_4' | 'POTONG_1_2';

export interface AttendanceCalculation {
  deduction: AttendanceDeduction;
  note: string;
}

/**
 * Calculates the attendance note from the number of minutes after shift start.
 * The policy applies to the first 31 minutes after the configured shift start.
 */
export function calculateAttendanceNote(minutesAfterShiftStart: number): AttendanceCalculation {
  if (minutesAfterShiftStart <= 15) {
    return { deduction: '1x', note: 'Hadir 1x' };
  }

  if (minutesAfterShiftStart <= 30) {
    return { deduction: 'POTONG_1_4', note: 'Potong 1/4' };
  }

  return { deduction: 'POTONG_1_2', note: 'Potong 1/2' };
}