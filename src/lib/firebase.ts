import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
import { Employee, OfficeLocation, AttendanceRecord, ShiftSchedule, Department } from '../types';

let firebaseConfig: any = null;

try {
  // Read config directly or use injected configuration
  firebaseConfig = {
    projectId: "idyllic-reef-0xjsq",
    appId: "1:821815438451:web:45d57270195b73e72dce06",
    apiKey: "AIzaSyBHeIPdYZFVyVFhcZ1niWshWV3Ex8O2TYU",
    authDomain: "idyllic-reef-0xjsq.firebaseapp.com",
    firestoreDatabaseId: "ai-studio-presensikaryawan-01aeac5b-d217-4a85-852d-4c93beac9488",
    storageBucket: "idyllic-reef-0xjsq.firebasestorage.app",
    messagingSenderId: "821815438451",
  };
} catch (e) {
  console.warn('Firebase config error:', e);
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the provisioned firestore database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Validates connection to Firestore at boot
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline:', error.message);
    }
    return false;
  }
}

// ----------------- EMPLOYEES CRUD -----------------

export async function fetchEmployeesFromDB(): Promise<Employee[]> {
  try {
    const colRef = collection(db, 'employees');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => d.data() as Employee);
  } catch (err) {
    console.error('Error fetching employees from Firestore:', err);
    return [];
  }
}

export async function saveEmployeeToDB(emp: Employee): Promise<void> {
  const docRef = doc(db, 'employees', emp.id);
  await setDoc(docRef, emp, { merge: true });
}

export async function deleteEmployeeFromDB(employeeId: string): Promise<void> {
  await deleteDoc(doc(db, 'employees', employeeId));
}

// ----------------- OFFICES CRUD (ADMIN ONLY) -----------------

export async function fetchOfficesFromDB(): Promise<OfficeLocation[]> {
  try {
    const colRef = collection(db, 'offices');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => d.data() as OfficeLocation);
  } catch (err) {
    console.error('Error fetching offices from Firestore:', err);
    return [];
  }
}

export async function saveOfficeToDB(office: OfficeLocation): Promise<void> {
  const docRef = doc(db, 'offices', office.id);
  await setDoc(docRef, office, { merge: true });
}

export async function deleteOfficeFromDB(officeId: string): Promise<void> {
  const docRef = doc(db, 'offices', officeId);
  await deleteDoc(docRef);
}

// ----------------- SHIFTS CRUD (ADMIN ONLY) -----------------

export async function fetchShiftsFromDB(): Promise<ShiftSchedule[]> {
  try {
    const colRef = collection(db, 'shifts');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => d.data() as ShiftSchedule);
  } catch (err) {
    console.error('Error fetching shifts from Firestore:', err);
    return [];
  }
}

export async function saveShiftToDB(shift: ShiftSchedule): Promise<void> {
  const docRef = doc(db, 'shifts', shift.id);
  await setDoc(docRef, shift, { merge: true });
}

export async function deleteShiftFromDB(shiftId: string): Promise<void> {
  const docRef = doc(db, 'shifts', shiftId);
  await deleteDoc(docRef);
}

// ----------------- DEPARTMENTS CRUD (ADMIN ONLY) -----------------

export async function fetchDepartmentsFromDB(): Promise<Department[]> {
  try {
    const colRef = collection(db, 'departments');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];
    return snapshot.docs.map((d) => d.data() as Department);
  } catch (err) {
    console.error('Error fetching departments from Firestore:', err);
    return [];
  }
}

export async function saveDepartmentToDB(dept: Department): Promise<void> {
  const docRef = doc(db, 'departments', dept.id);
  await setDoc(docRef, dept, { merge: true });
}

export async function deleteDepartmentFromDB(deptId: string): Promise<void> {
  const docRef = doc(db, 'departments', deptId);
  await deleteDoc(docRef);
}

// ----------------- ATTENDANCE RECORDS (1-MONTH+ PERSISTENCE) -----------------

export async function fetchAttendancesFromDB(monthFilter?: string): Promise<AttendanceRecord[]> {
  try {
    const colRef = collection(db, 'attendances');
    let q = query(colRef);
    if (monthFilter) {
      q = query(colRef, where('month', '==', monthFilter));
    }
    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];
    const list = snapshot.docs.map((d) => d.data() as AttendanceRecord);
    // Sort descending by date
    return list.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    console.error('Error fetching attendances from Firestore:', err);
    return [];
  }
}

export async function saveAttendanceToDB(record: AttendanceRecord): Promise<void> {
  const docRef = doc(db, 'attendances', record.id);
  // Ensure month field exists for clean 1-month range filtering
  const month = record.month || record.date.slice(0, 7);
  await setDoc(docRef, { ...record, month }, { merge: true });
}

// ----------------- SEED INITIAL DATA -----------------

export async function seedInitialFirestoreData(
  defaultEmployees: Employee[],
  defaultOffices: OfficeLocation[],
  initialRecords: AttendanceRecord[],
  defaultShifts?: ShiftSchedule[],
  defaultDepartments?: Department[]
): Promise<{
  employees: Employee[];
  offices: OfficeLocation[];
  records: AttendanceRecord[];
  shifts: ShiftSchedule[];
  departments: Department[];
}> {
  try {
    // 1. Employees check
    let currentEmployees = await fetchEmployeesFromDB();
    if (currentEmployees.length === 0) {
      for (const emp of defaultEmployees) {
        await saveEmployeeToDB(emp);
      }
      currentEmployees = defaultEmployees;
    }

    // 2. Offices check
    let currentOffices = await fetchOfficesFromDB();
    if (currentOffices.length === 0) {
      for (const off of defaultOffices) {
        await saveOfficeToDB(off);
      }
      currentOffices = defaultOffices;
    }

    // 3. Shifts check
    let currentShifts = await fetchShiftsFromDB();
    if (currentShifts.length === 0 && defaultShifts && defaultShifts.length > 0) {
      for (const shift of defaultShifts) {
        await saveShiftToDB(shift);
      }
      currentShifts = defaultShifts;
    }

    // 4. Departments check
    let currentDepts = await fetchDepartmentsFromDB();
    if (currentDepts.length === 0 && defaultDepartments && defaultDepartments.length > 0) {
      for (const dept of defaultDepartments) {
        await saveDepartmentToDB(dept);
      }
      currentDepts = defaultDepartments;
    }

    // 5. Attendances check (Store 1-month historical records)
    let currentRecords = await fetchAttendancesFromDB();
    if (currentRecords.length === 0) {
      // Seed initial 30 days of data
      for (const rec of initialRecords) {
        await saveAttendanceToDB(rec);
      }
      currentRecords = initialRecords;
    }

    return {
      employees: currentEmployees,
      offices: currentOffices,
      records: currentRecords,
      shifts: currentShifts.length > 0 ? currentShifts : (defaultShifts || []),
      departments: currentDepts.length > 0 ? currentDepts : (defaultDepartments || []),
    };
  } catch (err) {
    console.warn('Seeding fallback to local initial state:', err);
    return {
      employees: defaultEmployees,
      offices: defaultOffices,
      records: initialRecords,
      shifts: defaultShifts || [],
      departments: defaultDepartments || [],
    };
  }
}
