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
import { StudentStats, Student } from '@/types/attendance';
import { CalendarCheck, CalendarX, Clock, Search, User, TrendingUp } from 'lucide-react';

const StudentDashboard = () => {
  const [studentId, setStudentId] = useState('');
  const [searchedStudent, setSearchedStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const student = getStudentById(studentId.toUpperCase());
    if (!student) {
      setError('Student ID not found. Please check and try again.');
      setSearchedStudent(null);
      setStats(null);
      return;
    }

    setSearchedStudent(student);
    setStats(getStudentStats(student.id));
  };

  const studentRecords = searchedStudent 
    ? getAttendanceRecords()
        .filter(r => r.studentId === searchedStudent.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <Scene3D />
      <Header />

      <main className="container relative z-10 py-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent mb-2">
            Student Dashboard
          </h1>
          <p className="text-cyan-100/70">
            View your attendance history and statistics
          </p>
        </div>

        {/* Search Form */}
        <FloatingCard className="mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="studentSearch" className="text-cyan-100">Enter Your Student ID</Label>
              <Input
                id="studentSearch"
                placeholder="e.g., STU001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="font-mono uppercase bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
              <p className="text-xs text-cyan-200/60">
                Demo IDs: {students.slice(0, 3).map(s => s.id).join(', ')}...
              </p>
            </div>
            <div className="flex items-end">
              <GlassButton>
                <Search size={16} />
                View Dashboard
              </GlassButton>
            </div>
          </form>
          {error && (
            <p className="mt-4 text-sm text-red-400">{error}</p>
          )}
        </FloatingCard>

        {/* Student Info */}
        {searchedStudent && stats && (
          <div className="animate-fade-in space-y-6">
            {/* Student Header */}
            <FloatingCard glowColor="rgba(34, 211, 238, 0.3)">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <User size={36} className="text-white" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h2 className="text-xl font-bold font-display text-white">{searchedStudent.name}</h2>
                  <p className="text-cyan-200/70">
                    ID: {searchedStudent.id} • Grade: {searchedStudent.grade}
                  </p>
                </div>
                {/* Attendance Circle */}
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="48" cy="48" r="42"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="48" cy="48" r="42"
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Total Days', value: stats.totalDays, icon: CalendarCheck, color: 'cyan' },
                { title: 'Present', value: stats.daysPresent, icon: CalendarCheck, color: 'green' },
                { title: 'Late', value: stats.daysLate, icon: Clock, color: 'yellow' },
                { title: 'Absent', value: stats.daysAbsent, icon: CalendarX, color: 'red' },
              ].map((stat) => (
                <div 
                  key={stat.title}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors"
                >
                  <stat.icon size={20} className={`mb-2 ${
                    stat.color === 'cyan' ? 'text-cyan-400' :
                    stat.color === 'green' ? 'text-green-400' :
                    stat.color === 'yellow' ? 'text-yellow-400' :
                    'text-red-400'
                  }`} />
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-cyan-200/60">{stat.title}</p>
                </div>
              ))}
            </div>

            {/* Attendance Bar */}
            <FloatingCard>
              <h3 className="font-semibold font-display mb-4 text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-cyan-400" />
                Attendance Status
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="h-4 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        stats.attendancePercentage >= 90 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-400' 
                          : stats.attendancePercentage >= 75 
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-400' 
                            : 'bg-gradient-to-r from-red-500 to-rose-400'
                      }`}
                      style={{ width: `${stats.attendancePercentage}%` }}
                    />
                  </div>
                </div>
                <span className={`font-bold text-lg ${
                  stats.attendancePercentage >= 90 
                    ? 'text-green-400' 
                    : stats.attendancePercentage >= 75 
                      ? 'text-yellow-400' 
                      : 'text-red-400'
                }`}>
                  {stats.attendancePercentage}%
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-cyan-100/70">≥90% Excellent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span className="text-cyan-100/70">75-89% Needs Improvement</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-cyan-100/70">&lt;75% Critical</span>
                </div>
              </div>
            </FloatingCard>

            {/* Recent Records */}
            <FloatingCard>
              <h3 className="font-semibold font-display mb-4 text-white">Recent Attendance Records</h3>
              {studentRecords.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {studentRecords.map((record, index) => (
                    <div key={index} className="py-4 flex items-center justify-between hover:bg-white/5 -mx-6 px-6 transition-colors">
                      <div>
                        <p className="font-medium text-white">
                          {new Date(record.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-cyan-200/60">
                          Time: {record.time || '-'}
                        </p>
                      </div>
                      <StatusBadge status={record.status} size="small" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-cyan-200/60">
                  No attendance records found
                </div>
              )}
            </FloatingCard>
          </div>
        )}

        {/* Empty State */}
        {!searchedStudent && !error && (
          <div className="text-center py-12">
            <User size={48} className="mx-auto mb-4 text-cyan-500/30" />
            <p className="text-cyan-200/60">Enter your Student ID above to view your attendance dashboard</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
