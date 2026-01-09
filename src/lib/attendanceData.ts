/**
 * attendanceData.ts - Attendance Data Management
 * 
 * This file handles all attendance-related data operations:
 * - Mock student data
 * - QR code generation and validation
 * - Attendance record management (using localStorage)
 * - Statistics calculations
 * - Data export functionality
 * - Student photo storage
 */

import { Student, AttendanceRecord, AttendanceStatus, DashboardStats, StudentStats } from '@/types/attendance';

// ========================================
// MOCK STUDENT DATA
// In a real app, this would come from a database
// ========================================
export const students: Student[] = [
  { id: 'STU001', name: 'Aditi Sharma', grade: '8A' },
  { id: 'STU002', name: 'Rahul Kumar', grade: '8A' },
  { id: 'STU003', name: 'Priya Singh', grade: '8B' },
  { id: 'STU004', name: 'Amit Patel', grade: '8A' },
  { id: 'STU005', name: 'Sneha Reddy', grade: '8B' },
  { id: 'STU006', name: 'Vikram Yadav', grade: '9A' },
  { id: 'STU007', name: 'Kavitha Nair', grade: '9A' },
  { id: 'STU008', name: 'Ravi Verma', grade: '9B' },
  { id: 'STU009', name: 'Meera Joshi', grade: '9B' },
  { id: 'STU010', name: 'Arjun Das', grade: '10A' },
];

// ========================================
// CONSTANTS
// ========================================

// Time after which attendance is marked as "late" (8:30 AM)
export const CUTOFF_TIME = '08:30';

// QR codes expire after this many seconds (security feature)
export const QR_VALIDITY_SECONDS = 30;

// How often QR codes refresh (in milliseconds)
export const QR_REFRESH_INTERVAL = 5000;

// ========================================
// LOCAL STORAGE KEYS
// ========================================
const ATTENDANCE_KEY = 'attendance_records';
const STUDENT_PHOTOS_KEY = 'student_photos';
const FACE_CAPTURES_KEY = 'face_captures';

// ========================================
// STUDENT PHOTO MANAGEMENT
// For admin-uploaded reference photos
// ========================================

/**
 * Get a student's reference photo
 * @param studentId - The student's ID
 * @returns The photo as base64 string, or null if not found
 */
export const getStudentPhoto = (studentId: string): string | null => {
  const photos = localStorage.getItem(STUDENT_PHOTOS_KEY);
  if (!photos) return null;
  
  const photosData = JSON.parse(photos) as Record<string, string>;
  return photosData[studentId] || null;
};

/**
 * Save a student's reference photo
 * @param studentId - The student's ID
 * @param photoData - The photo as base64 string
 */
export const saveStudentPhoto = (studentId: string, photoData: string): void => {
  const photos = localStorage.getItem(STUDENT_PHOTOS_KEY);
  const photosData = photos ? JSON.parse(photos) : {};
  
  photosData[studentId] = photoData;
  localStorage.setItem(STUDENT_PHOTOS_KEY, JSON.stringify(photosData));
};

// ========================================
// FACE CAPTURE MANAGEMENT
// For photos captured during attendance
// ========================================

/**
 * Save a face capture for an attendance record
 * @param studentId - The student's ID
 * @param date - The date of attendance
 * @param imageData - The captured image as base64 string
 */
export const saveFaceCapture = (studentId: string, date: string, imageData: string): void => {
  const captures = localStorage.getItem(FACE_CAPTURES_KEY);
  const capturesData = captures ? JSON.parse(captures) : {};
  
  const key = `${studentId}_${date}`;
  capturesData[key] = imageData;
  localStorage.setItem(FACE_CAPTURES_KEY, JSON.stringify(capturesData));
};

/**
 * Get a face capture for an attendance record
 * @param studentId - The student's ID
 * @param date - The date of attendance
 * @returns The captured image as base64 string, or null if not found
 */
export const getFaceCapture = (studentId: string, date: string): string | null => {
  const captures = localStorage.getItem(FACE_CAPTURES_KEY);
  if (!captures) return null;
  
  const capturesData = JSON.parse(captures) as Record<string, string>;
  const key = `${studentId}_${date}`;
  return capturesData[key] || null;
};

// ========================================
// QR CODE FUNCTIONS
// ========================================

/**
 * Generate a daily secret for QR code validation
 * This changes every day for security
 */
const getDailySecret = (): string => {
  const today = new Date().toISOString().split('T')[0];
  return `SECRET-${today.replace(/-/g, '')}`;
};

/**
 * Generate QR code data for a student
 * The QR contains: student ID, timestamp, and a validation hash
 */
export const generateStudentQRData = (studentId: string): string => {
  const timestamp = Date.now();
  const secret = getDailySecret();
  // Create a simple hash for validation
  const hash = btoa(`${studentId}|${timestamp}|${secret}`).slice(0, 8);
  return JSON.stringify({
    id: studentId,
    ts: timestamp,
    h: hash
  });
};

// ========================================
// QR CODE VALIDATION
// ========================================

/**
 * Validate a scanned QR code
 * Checks: student exists, QR is not expired, hash is valid
 */
export const validateStudentQR = (qrData: string): { 
  valid: boolean; 
  studentId?: string; 
  error?: string;
  expired?: boolean;
} => {
  try {
    const data = JSON.parse(qrData);
    const { id, ts, h } = data;
    
    // Check if student exists
    const student = students.find(s => s.id === id);
    if (!student) {
      return { valid: false, error: 'Student ID not found' };
    }
    
    // Check timestamp validity (30 seconds)
    const now = Date.now();
    const ageSeconds = (now - ts) / 1000;
    
    if (ageSeconds > QR_VALIDITY_SECONDS) {
      return { valid: false, studentId: id, error: 'QR code has expired. Student must generate a new one.', expired: true };
    }
    
    // Validate hash
    const secret = getDailySecret();
    const expectedHash = btoa(`${id}|${ts}|${secret}`).slice(0, 8);
    
    if (h !== expectedHash) {
      return { valid: false, error: 'Invalid QR code' };
    }
    
    return { valid: true, studentId: id };
  } catch {
    return { valid: false, error: 'Invalid QR code format' };
  }
};

// ========================================
// ATTENDANCE RECORD MANAGEMENT
// ========================================

/**
 * Get all attendance records from localStorage
 */
export const getAttendanceRecords = (): AttendanceRecord[] => {
  const stored = localStorage.getItem(ATTENDANCE_KEY);
  return stored ? JSON.parse(stored) : generateMockHistory();
};

/**
 * Save attendance records to localStorage
 */
const saveAttendanceRecords = (records: AttendanceRecord[]): void => {
  localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
};

/**
 * Generate mock historical data (30 days)
 * This creates sample data for demonstration
 */
const generateMockHistory = (): AttendanceRecord[] => {
  const records: AttendanceRecord[] = [];
  const today = new Date();
  
  // Generate 30 days of history
  for (let i = 30; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    
    students.forEach(student => {
      const random = Math.random();
      let status: AttendanceStatus;
      let time: string;
      
      if (random > 0.15) {
        if (random > 0.85) {
          status = 'LATE_PRESENT';
          time = '08:45';
        } else {
          status = 'PRESENT';
          time = '08:15';
        }
      } else {
        status = 'ABSENT';
        time = '';
      }
      
      if (status !== 'ABSENT') {
        records.push({
          studentId: student.id,
          studentName: student.name,
          date: dateStr,
          time,
          status,
        });
      }
    });
  }
  
  saveAttendanceRecords(records);
  return records;
};


// Check if student already marked attendance today
export const hasMarkedAttendanceToday = (studentId: string): boolean => {
  const records = getAttendanceRecords();
  const today = new Date().toISOString().split('T')[0];
  return records.some(r => r.studentId === studentId && r.date === today);
};

// Mark attendance (called by teacher after scanning)
export const markAttendanceFromScan = (
  studentId: string
): { success: boolean; message: string; status?: AttendanceStatus; studentName?: string } => {
  // Find student
  const student = students.find(s => s.id === studentId);
  if (!student) {
    return { success: false, message: 'Student ID not found.' };
  }
  
  // Check if already marked
  if (hasMarkedAttendanceToday(studentId)) {
    return { success: false, message: `Attendance already recorded for ${student.name} today.` };
  }
  
  // Determine status based on time
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const status: AttendanceStatus = currentTime <= CUTOFF_TIME ? 'PRESENT' : 'LATE_PRESENT';
  
  // Create record
  const record: AttendanceRecord = {
    studentId,
    studentName: student.name,
    date: now.toISOString().split('T')[0],
    time: currentTime,
    status,
  };
  
  // Save
  const records = getAttendanceRecords();
  records.push(record);
  saveAttendanceRecords(records);
  
  const statusMessage = status === 'PRESENT' 
    ? 'marked PRESENT' 
    : 'marked LATE PRESENT';
  
  return { 
    success: true, 
    message: `${student.name} ${statusMessage}!`, 
    status,
    studentName: student.name 
  };
};

// Get dashboard stats
export const getDashboardStats = (): DashboardStats => {
  const records = getAttendanceRecords();
  const today = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === today);
  
  const presentToday = todayRecords.filter(r => r.status === 'PRESENT').length;
  const lateToday = todayRecords.filter(r => r.status === 'LATE_PRESENT').length;
  const absentToday = students.length - presentToday - lateToday;
  
  return {
    totalStudents: students.length,
    presentToday,
    lateToday,
    absentToday,
  };
};

// Get student stats
export const getStudentStats = (studentId: string): StudentStats | null => {
  const student = students.find(s => s.id === studentId);
  if (!student) return null;
  
  const records = getAttendanceRecords();
  const studentRecords = records.filter(r => r.studentId === studentId);
  
  // Calculate total school days (excluding weekends) in last 30 days
  const today = new Date();
  let totalDays = 0;
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      totalDays++;
    }
  }
  
  const daysPresent = studentRecords.filter(r => r.status === 'PRESENT').length;
  const daysLate = studentRecords.filter(r => r.status === 'LATE_PRESENT').length;
  const daysAbsent = totalDays - daysPresent - daysLate;
  const attendancePercentage = totalDays > 0 
    ? Math.round(((daysPresent + daysLate) / totalDays) * 100) 
    : 0;
  
  return {
    totalDays,
    daysPresent,
    daysLate,
    daysAbsent,
    attendancePercentage,
  };
};

// Get student by ID
export const getStudentById = (studentId: string): Student | undefined => {
  return students.find(s => s.id === studentId);
};

// Get attendance records for export
export const getRecordsForExport = (
  filter: 'daily' | 'weekly' | 'monthly' = 'daily'
): AttendanceRecord[] => {
  const records = getAttendanceRecords();
  const today = new Date();
  
  let startDate: Date;
  switch (filter) {
    case 'weekly':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);
      break;
    case 'monthly':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 30);
      break;
    default:
      startDate = new Date(today.toISOString().split('T')[0]);
  }
  
  return records.filter(r => new Date(r.date) >= startDate);
};

// Export to CSV
export const exportToCSV = (records: AttendanceRecord[]): void => {
  const headers = ['Student ID', 'Student Name', 'Date', 'Time', 'Status'];
  const rows = records.map(r => [r.studentId, r.studentName, r.date, r.time, r.status]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

// Get weekly summary
export const getWeeklySummary = () => {
  const records = getAttendanceRecords();
  const today = new Date();
  const weekData: { date: string; present: number; late: number; absent: number }[] = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateStr = date.toISOString().split('T')[0];
    const dayRecords = records.filter(r => r.date === dateStr);
    
    weekData.push({
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      present: dayRecords.filter(r => r.status === 'PRESENT').length,
      late: dayRecords.filter(r => r.status === 'LATE_PRESENT').length,
      absent: students.length - dayRecords.length,
    });
  }
  
  return weekData;
};
