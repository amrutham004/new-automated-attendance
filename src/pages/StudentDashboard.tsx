import { useState } from 'react';
import Header from '@/components/attendance/Header';
import Footer from '@/components/attendance/Footer';
import Scene3D from '@/components/3d/Scene3D';
import FloatingCard from '@/components/3d/FloatingCard';
import GlassButton from '@/components/3d/GlassButton';
import { Input } from '@/components/ui/input';
import { 
  getStudentStats, 
  getStudentById, 
  getAttendanceRecords
} from '@/lib/attendanceData';
import { StudentStats, Student, AttendanceRecord } from '@/types/attendance';
import { Search, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';

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
    // Show last 30 days of attendance records
    const filteredRecords = records
      .filter(r => r.studentId === student.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30); // Show up to 30 days
    setStudentRecords(filteredRecords);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-900 via-teal-800 to-emerald-900 text-white overflow-hidden">
      <Scene3D />
      <Header />

      <main className="container relative z-10 py-8 max-w-4xl mx-auto px-4 flex-1">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-3">
            Student Dashboard
          </h1>
          <p className="text-teal-100/80">
            Search for a student to view their attendance statistics and performance
          </p>
        </div>

        {/* Search Form */}
        <FloatingCard className="mb-8">
          <form onSubmit={handleSearch}>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-teal-200 text-sm mb-2 block">Student ID</label>
                <Input
                  type="text"
                  placeholder="Enter Student ID (e.g., 20221CIT0043)"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="bg-teal-900/30 border-teal-700/50 text-white placeholder-teal-300/50 h-12"
                />
              </div>
              <GlassButton disabled={!studentId.trim()} className="px-6 h-12 mt-7">
                <Search size={18} className="mr-2" />
                Search
              </GlassButton>
            </div>
            {error && (
              <div className="mt-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}
          </form>
        </FloatingCard>

        {/* Student Results */}
        {searchedStudent && stats && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Attendance Rate Card */}
              <FloatingCard className="flex flex-col items-center justify-center p-6">
                <h3 className="text-sm font-medium text-white mb-4">Attendance Rate</h3>
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.1)"
                      strokeWidth="10"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke={stats.attendancePercentage >= 90 ? '#22c55e' : stats.attendancePercentage >= 75 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(stats.attendancePercentage / 100) * 352} 352`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{stats.attendancePercentage}%</span>
                    <span className="text-xs text-teal-200/70">Overall</span>
                  </div>
                </div>
                <p className={`mt-3 text-xs font-medium ${
                  stats.attendancePercentage >= 90 ? 'text-green-400' :
                  stats.attendancePercentage >= 75 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {stats.attendancePercentage >= 90 ? 'Excellent' :
                   stats.attendancePercentage >= 75 ? 'Good' :
                   'Needs Improvement'}
                </p>
              </FloatingCard>

              {/* Total Days */}
              <FloatingCard className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-3">
                    <Calendar size={24} className="text-teal-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{stats.totalDays}</p>
                  <p className="text-sm text-teal-200">Total Days</p>
                  <p className="text-xs text-teal-200/60 mt-1">School days tracked</p>
                </div>
              </FloatingCard>

              {/* Present */}
              <FloatingCard className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
                    <CheckCircle size={24} className="text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{stats.daysPresent}</p>
                  <p className="text-sm text-teal-200">Present</p>
                  <p className="text-xs text-teal-200/60 mt-1">On-time attendance</p>
                </div>
              </FloatingCard>

              {/* Late */}
              <FloatingCard className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center mb-3">
                    <Clock size={24} className="text-yellow-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{stats.daysLate}</p>
                  <p className="text-sm text-teal-200">Late</p>
                  <p className="text-xs text-teal-200/60 mt-1">Late arrivals</p>
                </div>
              </FloatingCard>

              {/* Absent */}
              <FloatingCard className="p-6 md:col-start-2 lg:col-start-1">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-3">
                    <XCircle size={24} className="text-red-400" />
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{stats.daysAbsent}</p>
                  <p className="text-sm text-teal-200">Absent</p>
                  <p className="text-xs text-teal-200/60 mt-1">Missed classes</p>
                </div>
              </FloatingCard>
            </div>

            {/* Recent Attendance */}
            <FloatingCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Recent Attendance</h3>
                <span className="text-xs text-teal-200/60">Last 10 records</span>
              </div>
              {studentRecords.length > 0 ? (
                <div className="space-y-2">
                  {studentRecords.slice(0, 10).map((record, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-teal-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          record.status === 'PRESENT' ? 'bg-green-500/20' :
                          record.status === 'LATE_PRESENT' ? 'bg-yellow-500/20' :
                          'bg-red-500/20'
                        }`}>
                          {record.status === 'PRESENT' && <CheckCircle size={18} className="text-green-400" />}
                          {record.status === 'LATE_PRESENT' && <Clock size={18} className="text-yellow-400" />}
                          {record.status === 'ABSENT' && <XCircle size={18} className="text-red-400" />}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{record.studentName}</p>
                          <p className="text-teal-200/60 text-xs">{record.date} at {record.time}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        record.status === 'PRESENT' ? 'bg-green-500/20 text-green-400' :
                        record.status === 'LATE_PRESENT' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {record.status === 'PRESENT' ? 'Present' :
                         record.status === 'LATE_PRESENT' ? 'Late' : 'Absent'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar size={48} className="mx-auto mb-3 text-teal-400/30" />
                  <p className="text-teal-200/70">No attendance records found</p>
                  <p className="text-teal-200/50 text-sm mt-1">Attendance data will appear here once recorded</p>
                </div>
              )}
            </FloatingCard>
          </div>
        )}

        {/* No Search Results */}
        {!searchedStudent && !error && (
          <FloatingCard className="p-12">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-teal-500/20 flex items-center justify-center mb-4">
                <Search size={32} className="text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Search for Student</h3>
              <p className="text-teal-200/80 mb-1">Enter a Student ID to view their attendance statistics</p>
              <p className="text-teal-200/60 text-sm">Example: 20221CIT0043</p>
            </div>
          </FloatingCard>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default StudentDashboard;
