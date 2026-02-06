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
  { 
    id: '20221CIT0043', 
    name: 'Amrutha M', 
    grade: 'CIT 2022',
    department: 'Computer and Information Technology',
    email: 'amrutha.m@college.edu'
  },
  { 
    id: '20221CIT0049', 
    name: 'CM Shalini', 
    grade: 'CIT 2022',
    department: 'Computer and Information Technology',
    email: 'shalini.cm@college.edu'
  },
  { 
    id: '20221CIT0151', 
    name: 'Vismaya L', 
    grade: 'CIT 2022',
    department: 'Computer and Information Technology',
    email: 'vismaya.l@college.edu'
  },
];

// ========================================
// CONSTANTS
// ========================================

// Student ID validation regex
export const STUDENT_ID_REGEX = /^20221CIT\d{4}$/;

// Time after which attendance is marked as "late" (1:00 PM)
export const CUTOFF_TIME = '13:00';

// QR codes expire after this many seconds (security feature)
export const QR_VALIDITY_SECONDS = 60; 

// How often QR codes refresh (in milliseconds)
export const QR_REFRESH_INTERVAL = 5000;

// ========================================
// LOCAL STORAGE KEYS
// ========================================
const ATTENDANCE_KEY = 'attendance_records';
const STUDENT_PHOTOS_KEY = 'student_photos';
const FACE_CAPTURES_KEY = 'face_captures';
const ATTENDANCE_TOKENS_KEY = 'attendance_tokens';

// ========================================
// ATTENDANCE TOKEN TYPES
// ========================================
export interface AttendanceToken {
  token: string;
  studentId: string;
  studentName: string;
  expiryTimestamp: number;
  isUsed: boolean;
  createdAt: number;
}

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
// ATTENDANCE TOKEN MANAGEMENT (URL-based)
// For student-side QR scanning flow
// ========================================

/**
 * Generate a unique token for URL-based attendance
 * Stores token with student info, expiry, and used status
 */
export const generateAttendanceToken = (studentId: string): string => {
  const student = students.find(s => s.id === studentId);
  if (!student) return '';
  
  // Generate unique token
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10);
  const token = `${studentId}-${timestamp}-${randomPart}`;
  
  // Create token record
  const tokenRecord: AttendanceToken = {
    token,
    studentId,
    studentName: student.name,
    expiryTimestamp: timestamp + (QR_VALIDITY_SECONDS * 1000),
    isUsed: false,
    createdAt: timestamp
  };
  
  // Store token
  const tokens = getAttendanceTokens();
  
  // Clean up expired tokens first
  const now = Date.now();
  const validTokens = tokens.filter(t => t.expiryTimestamp > now && !t.isUsed);
  
  // Remove old tokens for this student
  const filteredTokens = validTokens.filter(t => t.studentId !== studentId);
  filteredTokens.push(tokenRecord);
  saveAttendanceTokens(filteredTokens);
  
  return token;
};

/**
 * Get all attendance tokens from localStorage
 */
const getAttendanceTokens = (): AttendanceToken[] => {
  const stored = localStorage.getItem(ATTENDANCE_TOKENS_KEY);
  return stored ? JSON.parse(stored) : [];
};

/**
 * Save attendance tokens to localStorage
 */
const saveAttendanceTokens = (tokens: AttendanceToken[]): void => {
  localStorage.setItem(ATTENDANCE_TOKENS_KEY, JSON.stringify(tokens));
};

/**
 * Validate an attendance token from URL
 * Returns student info if valid, error otherwise
 */
export const validateAttendanceToken = (token: string): {
  valid: boolean;
  studentId?: string;
  studentName?: string;
  error?: string;
  expired?: boolean;
  alreadyUsed?: boolean;
} => {
  const tokens = getAttendanceTokens();
  const tokenRecord = tokens.find(t => t.token === token);
  
  if (!tokenRecord) {
    return { valid: false, error: 'Invalid or expired token' };
  }
  
  // Check if already used
  if (tokenRecord.isUsed) {
    return { 
      valid: false, 
      studentId: tokenRecord.studentId,
      studentName: tokenRecord.studentName,
      error: 'This attendance link has already been used',
      alreadyUsed: true
    };
  }
  
  // Check if expired
  const now = Date.now();
  if (now > tokenRecord.expiryTimestamp) {
    // Clean up expired token
    const updatedTokens = tokens.filter(t => t.token !== token);
    saveAttendanceTokens(updatedTokens);
    
    return { 
      valid: false, 
      studentId: tokenRecord.studentId,
      studentName: tokenRecord.studentName,
      error: 'This attendance link has expired. Please get a new QR code.',
      expired: true 
    };
  }
  
  return { 
    valid: true, 
    studentId: tokenRecord.studentId,
    studentName: tokenRecord.studentName 
  };
};

/**
 * Mark a token as used and record attendance
 */
export const useAttendanceToken = (token: string): {
  success: boolean;
  message: string;
  studentId?: string;
  studentName?: string;
  status?: AttendanceStatus;
} => {
  const validation = validateAttendanceToken(token);
  
  if (!validation.valid) {
    return { 
      success: false, 
      message: validation.error || 'Invalid token',
      studentId: validation.studentId,
      studentName: validation.studentName
    };
  }
  
  const { studentId, studentName } = validation;
  
  // Check if already marked today
  if (hasMarkedAttendanceToday(studentId!)) {
    return { 
      success: false, 
      message: `Attendance already recorded for ${studentName} today.`,
      studentId,
      studentName
    };
  }
  
  // Mark token as used
  const tokens = getAttendanceTokens();
  const updatedTokens = tokens.map(t => 
    t.token === token ? { ...t, isUsed: true } : t
  );
  saveAttendanceTokens(updatedTokens);
  
  // Record attendance
  const result = markAttendanceFromScan(studentId!);
  
  return {
    success: result.success,
    message: result.message,
    studentId,
    studentName,
    status: result.status
  };
};

/**
 * Generate attendance URL for QR code
 * Automatically detects and uses current network address
 * Supports localhost, network IP, and dynamic changes
 */
export const generateAttendanceURL = (studentId: string): string => {
  const token = generateAttendanceToken(studentId);
  if (!token) return '';
  
  // Smart network detection - automatically adapts to current access method
  const currentHostname = window.location.hostname;
  const currentPort = window.location.port || '8080';
  const currentProtocol = window.location.protocol;
  
  console.log('Network detection:', { 
    hostname: currentHostname, 
    port: currentPort, 
    protocol: currentProtocol 
  });
  
  let baseUrl: string;
  
  // Determine base URL based on access method
  if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
    // Local development access
    baseUrl = `${currentProtocol}//localhost:${currentPort}`;
    console.log('Using localhost URL:', baseUrl);
  } else if (currentHostname.match(/^192\.168\.\d+\.\d+$/)) {
    // Local network IP access
    baseUrl = `${currentProtocol}//${currentHostname}:${currentPort}`;
    console.log('Using network IP URL:', baseUrl);
  } else {
    // Fallback - try to detect local network IP
    baseUrl = `${currentProtocol}//${currentHostname}:${currentPort}`;
    console.log('Using detected URL:', baseUrl);
  }
  
  const fullUrl = `${baseUrl}/verify-attendance?token=${token}`;
  console.log('Generated QR URL:', fullUrl);
  
  return fullUrl;
};

/**
 * Check if attendance is pending (token used but no face capture)
 */
export const isAttendancePendingFaceCapture = (studentId: string, date: string): boolean => {
  const faceCapture = getFaceCapture(studentId, date);
  const records = getAttendanceRecords();
  const hasAttendance = records.some(r => r.studentId === studentId && r.date === date);
  
  return hasAttendance && !faceCapture;
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

// Get attendance records for export (includes absent students)
export const getRecordsForExport = (
  filter: 'daily' | 'weekly' | 'monthly' = 'daily'
): AttendanceRecord[] => {
  const records = getAttendanceRecords();
  const today = new Date();
  
  let startDate: Date;
  let endDate: Date = new Date(today.toISOString().split('T')[0]);
  
  switch (filter) {
    case 'weekly':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
      break;
    case 'monthly':
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 29);
      break;
    default:
      startDate = new Date(today.toISOString().split('T')[0]);
  }
  
  // Get all dates in the range (excluding weekends)
  const dates: string[] = [];
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      dates.push(currentDate.toISOString().split('T')[0]);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Build complete records including absent students
  const completeRecords: AttendanceRecord[] = [];
  
  dates.forEach(date => {
    students.forEach(student => {
      const existingRecord = records.find(
        r => r.studentId === student.id && r.date === date
      );
      
      if (existingRecord) {
        completeRecords.push(existingRecord);
      } else {
        // Student was absent on this date
        completeRecords.push({
          studentId: student.id,
          studentName: student.name,
          date,
          time: '',
          status: 'ABSENT'
        });
      }
    });
  });
  
  return completeRecords;
};

// Export to CSV with proper formatting
export const exportToCSV = (records: AttendanceRecord[]): void => {
  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const headers = ['Student ID', 'Student Name', 'Date', 'Time', 'Status'];
  
  // Format status for readability
  const formatStatus = (status: AttendanceStatus): string => {
    switch (status) {
      case 'PRESENT': return 'Present';
      case 'LATE_PRESENT': return 'Late';
      case 'ABSENT': return 'Absent';
      default: return status;
    }
  };
  
  // Escape fields that may contain commas or quotes
  const escapeCSVField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };
  
  const rows = records.map(r => [
    escapeCSVField(r.studentId),
    escapeCSVField(r.studentName),
    r.date,
    r.time || '-',
    formatStatus(r.status)
  ]);
  
  const csvContent = BOM + [
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

/**
 * Clear all localStorage data and regenerate mock history
 * Used to reset data when student list changes
 */
export const clearAllAttendanceData = (): void => {
  localStorage.removeItem(ATTENDANCE_KEY);
  localStorage.removeItem(STUDENT_PHOTOS_KEY);
  localStorage.removeItem(FACE_CAPTURES_KEY);
  localStorage.removeItem(ATTENDANCE_TOKENS_KEY);
};
