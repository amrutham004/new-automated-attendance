/**
 * attendance.ts - TypeScript Type Definitions
 * 
 * This file defines all the types used throughout the attendance system.
 * Using TypeScript helps catch errors early and improves code readability.
 */

// Possible attendance statuses for a student
export type AttendanceStatus = 'PRESENT' | 'LATE_PRESENT' | 'ABSENT';

// Student information
export interface Student {
  id: string;        // Unique student ID (e.g., "STU001")
  name: string;      // Full name of the student
  grade: string;     // Class/grade (e.g., "8A")
  photoUrl?: string; // Optional reference photo URL for face verification
}

// Single attendance record
export interface AttendanceRecord {
  studentId: string;    // ID of the student
  studentName: string;  // Name of the student
  date: string;         // Date in YYYY-MM-DD format
  time: string;         // Time in HH:MM format
  status: AttendanceStatus;
  faceImage?: string;   // Optional captured face image (base64)
}

// Configuration for attendance rules
export interface AttendanceConfig {
  cutoffTime: string; // Time after which attendance is "late" (HH:MM format)
}

// Statistics displayed on the admin dashboard
export interface DashboardStats {
  totalStudents: number;  // Total number of students
  presentToday: number;   // Students marked present today
  lateToday: number;      // Students marked late today
  absentToday: number;    // Students not yet marked
}

// Statistics for an individual student
export interface StudentStats {
  totalDays: number;          // Total school days in period
  daysPresent: number;        // Days marked present
  daysLate: number;           // Days marked late
  daysAbsent: number;         // Days absent
  attendancePercentage: number; // Overall attendance %
}
