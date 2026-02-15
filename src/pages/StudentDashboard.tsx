/**
 * StudentDashboard.tsx - Student Dashboard Page (3D Design)
 * 
 * Allows students to view their attendance statistics.
 * Features:
 * - 3D background scene
 * - Glassmorphism cards
 * - Animated stat displays
 */

import { useState } from 'react';
import Header from '@/components/attendance/Header';
import Footer from '@/components/attendance/Footer';
import Scene3D from '@/components/3d/Scene3D';
import FloatingCard from '@/components/3d/FloatingCard';
import GlassButton from '@/components/3d/GlassButton';
import StatusBadge from '@/components/attendance/StatusBadge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  getStudentStats, 
  getStudentById, 
  getAttendanceRecords,
  students
} from '@/lib/attendanceData';
import { StudentStats, Student, AttendanceRecord } from '@/types/attendance';
import { CalendarCheck, CalendarX, Clock, Search, User, TrendingUp } from 'lucide-react';

const StudentDashboard = () => {
  const [studentId, setStudentId] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [studentRecords, setStudentRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const student = getStudentById(studentId.toUpperCase());
    if (!student) {
      setError('Student ID not found. Please check and try again.');
      setSearchedStudent(null);
      setStats(null);
      setStudentRecords([]);
      return;
    }

    setSearchedStudent(student);
    const studentStats = getStudentStats(student.id);
    setStats(studentStats);
    
    const records = getAttendanceRecords();
    const filteredRecords = records
      .filter(r => r.studentId === student.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    setStudentRecords(filteredRecords);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 via-teal-800 to-emerald-900 text-white overflow-hidden">
      <Scene3D />
      <Header />

      <main className="container relative z-10 py-8 max-w-4xl flex-1">
        {/* Page Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-green-300 via-teal-300 to-blue-300 bg-clip-text text-transparent mb-2">
            Student Dashboard
          </h1>
          <p className="text-teal-100/70">
            Search for a student to view their attendance statistics
          </p>
        </div>

        {/* Search Form */}
        <FloatingCard className="mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  type="text"
                  placeholder="Enter Student ID (e.g., 20221CIT0043)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-teal-200/50"
                />
              </div>
              <GlassButton disabled={!studentId.trim()}>
                <Search size={20} className="mr-2" />
                Search
              </GlassButton>
            </div>
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300">
                {error}
              </div>
            )}
          </form>
        </FloatingCard>

        {/* Student Results */}
        {searchedStudent && stats && (
          <>
            {/* Student Info Card */}
            <FloatingCard className="mb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <User size={40} className="text-teal-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{searchedStudent.name}</h2>
                  <p className="text-teal-200/70">{searchedStudent.id} - {searchedStudent.grade}</p>
                </div>
              </div>
            </FloatingCard>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Attendance Circle */}
              <FloatingCard>
                <h3 className="text-lg font-semibold text-white mb-4">Attendance Rate</h3>
                <div className="flex justify-center">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        fill="none"
                        stroke={stats.attendancePercentage >= 90 ? '#22c55e' : stats.attendancePercentage >= 75 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(stats.attendancePercentage / 100) * 264} 264`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{stats.attendancePercentage}%</span>
                    </div>
                  </div>
                </div>
              </FloatingCard>

              {/* Stats Grid */}
              <FloatingCard className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-4">30-Day Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { title: 'Total Days', value: stats.totalDays, icon: CalendarCheck, color: 'teal' },
                    { title: 'Present', value: stats.daysPresent, icon: CalendarCheck, color: 'green' },
                    { title: 'Late', value: stats.daysLate, icon: Clock, color: 'yellow' },
                    { title: 'Absent', value: stats.daysAbsent, icon: CalendarX, color: 'red' },
                  ].map((stat) => (
                    <div 
                      key={stat.title}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                    >
                      <stat.icon size={20} className={`mb-2 ${
                        stat.color === 'teal' ? 'text-teal-400' :
                        stat.color === 'green' ? 'text-green-400' :
                        stat.color === 'yellow' ? 'text-yellow-400' :
                        'text-red-400'
                      }`} />
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-teal-200/60">{stat.title}</p>
                    </div>
                  ))}
                </div>
              </FloatingCard>
            </div>

            {/* Recent Attendance Records */}
            <FloatingCard>
              <h3 className="text-lg font-semibold text-white mb-4">Recent Attendance</h3>
              <div className="space-y-3">
                {studentRecords.length > 0 ? (
                  studentRecords.map((record) => (
                    <div key={record.date} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{record.studentName}</p>
                        <p className="text-teal-200/70 text-sm">{record.date}</p>
                      </div>
                      <StatusBadge status={record.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-teal-200/70 text-center py-8">No attendance records found</p>
                )}
              </div>
            </FloatingCard>
          </>
        )}

        {/* No Search Results */}
        {!searchedStudent && !error && (
          <FloatingCard>
            <div className="text-center py-12">
              <User size={48} className="mx-auto mb-4 text-teal-400" />
              <h3 className="text-xl font-semibold text-white mb-2">No Student Selected</h3>
              <p className="text-teal-200/70">Enter a Student ID above to view their attendance statistics</p>
            </div>
          </FloatingCard>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default StudentDashboard;
