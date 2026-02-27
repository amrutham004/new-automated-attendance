import { useState, useEffect } from 'react';
import Header from '@/components/attendance/Header';
import Footer from '@/components/attendance/Footer';
import Scene3D from '@/components/3d/Scene3D';
import FloatingCard from '@/components/3d/FloatingCard';
import { 
  getDashboardStats, 
  getAttendanceRecords,
  getRecordsForExport,
  exportToCSV
} from '@/lib/attendanceData';
import { AttendanceRecord } from '@/types/attendance';
import { Calendar, CheckCircle, Clock, XCircle, Download } from 'lucide-react';
import GlassButton from '@/components/3d/GlassButton';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, lateToday: 0, absentToday: 0 });
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceRate, setAttendanceRate] = useState(0);
  const [exportFilter, setExportFilter] = useState<'daily' | 'weekly'>('daily');

  useEffect(() => {
    const statsData = getDashboardStats();
    setStats(statsData);

    const records = getAttendanceRecords();
    const sorted = records.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime());
    setRecentRecords(sorted.slice(0, 10));

    // Calculate attendance rate
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'PRESENT').length;
    const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
    setAttendanceRate(rate);
  }, []);

  const handleExport = () => {
    const records = getRecordsForExport(exportFilter);
    exportToCSV(records);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-800 to-emerald-900 text-white overflow-hidden">
      <Scene3D />
      <Header />

      <main className="container relative z-10 py-8 max-w-6xl mx-auto px-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                  stroke={attendanceRate >= 90 ? '#22c55e' : attendanceRate >= 75 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${(attendanceRate / 100) * 352} 352`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{attendanceRate}%</span>
                <span className="text-xs text-teal-200/70">Overall</span>
              </div>
            </div>
            <p className={`mt-3 text-xs font-medium ${
              attendanceRate >= 90 ? 'text-green-400' :
              attendanceRate >= 75 ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {attendanceRate >= 90 ? 'Excellent' :
               attendanceRate >= 75 ? 'Good' :
               'Needs Improvement'}
            </p>
          </FloatingCard>

          {/* Total Days */}
          <FloatingCard className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mb-3">
                <Calendar size={24} className="text-teal-400" />
              </div>
              <p className="text-3xl font-bold text-white mb-1">{stats.totalStudents}</p>
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
              <p className="text-3xl font-bold text-white mb-1">{stats.presentToday}</p>
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
              <p className="text-3xl font-bold text-white mb-1">{stats.lateToday}</p>
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
              <p className="text-3xl font-bold text-white mb-1">{stats.absentToday}</p>
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
          {recentRecords.length > 0 ? (
            <div className="space-y-2">
              {recentRecords.map((record, index) => (
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

        {/* Export Section */}
        <FloatingCard className="p-6 mt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Export Attendance Data</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setExportFilter('daily')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  exportFilter === 'daily'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-900/30 text-teal-200 hover:bg-teal-900/50'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setExportFilter('weekly')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  exportFilter === 'weekly'
                    ? 'bg-teal-500 text-white'
                    : 'bg-teal-900/30 text-teal-200 hover:bg-teal-900/50'
                }`}
              >
                Weekly
              </button>
            </div>
            <GlassButton onClick={handleExport} className="px-6 py-2">
              <Download size={18} className="mr-2" />
              Download {exportFilter === 'daily' ? 'Daily' : 'Weekly'} Report
            </GlassButton>
          </div>
          <p className="text-teal-200/60 text-sm mt-3">
            Export attendance records as CSV file for {exportFilter === 'daily' ? 'today' : 'the past 7 days'}
          </p>
        </FloatingCard>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
