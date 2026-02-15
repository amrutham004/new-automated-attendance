/**
 * AdminDashboard.tsx - Admin Dashboard Page (3D Design)
 * 
 * Provides administrators with:
 * - Overview statistics with 3D styled cards
 * - Weekly attendance chart
 * - Export functionality
 * - Today's attendance table
 */

import { useState, useEffect } from 'react';
import Header from '@/components/attendance/Header';
import Footer from '@/components/attendance/Footer';
import Scene3D from '@/components/3d/Scene3D';
import FloatingCard from '@/components/3d/FloatingCard';
import GlassButton from '@/components/3d/GlassButton';
import StatusBadge from '@/components/attendance/StatusBadge';
import TeacherScanCard from '@/components/attendance/TeacherScanCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getDashboardStats, 
  getRecordsForExport, 
  exportToCSV, 
  getWeeklySummary,
  students,
  getTodayAttendanceStatus,
  addSampleTodayAttendance
} from '@/lib/attendanceData';
import { AttendanceRecord } from '@/types/attendance';
import { Users, UserCheck, Clock, UserX, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';

const AdminDashboard = () => {
  const [exportFilter, setExportFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [stats, setStats] = useState({ totalStudents: 0, presentToday: 0, lateToday: 0, absentToday: 0 });
  const [weeklyData, setWeeklyData] = useState<{date: string; present: number; late: number; absent: number}[]>([]);
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        // Add sample today's attendance data for demonstration
        addSampleTodayAttendance();
        
        const statsData = getDashboardStats();
        const weeklyDataResult = getWeeklySummary();
        const todayRecordsResult = getTodayAttendanceStatus(); // Use new function
        
        setStats(statsData);
        setWeeklyData(weeklyDataResult);
        setTodayRecords(todayRecordsResult);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleExport = () => {
    const records = getRecordsForExport(exportFilter);
    console.log(`Exporting ${records.length} records for ${exportFilter}`);
    exportToCSV(records);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-800 to-emerald-900 text-white flex items-center justify-center">
        <div className="text-2xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-teal-800 to-emerald-900 text-white overflow-hidden">
      <Scene3D />
      <Header />

      <main className="container relative z-10 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-green-300 via-teal-300 to-blue-300 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-teal-100/70">
            Overview for {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <FloatingCard glowColor="rgba(34, 197, 94, 0.3)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-200/70 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-white">{stats.totalStudents}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Users size={24} className="text-green-400" />
              </div>
            </div>
          </FloatingCard>

          <FloatingCard glowColor="rgba(34, 197, 94, 0.3)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-200/70 text-sm">Present Today</p>
                <p className="text-3xl font-bold text-green-400">{stats.presentToday}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <UserCheck size={24} className="text-green-400" />
              </div>
            </div>
          </FloatingCard>

          <FloatingCard glowColor="rgba(245, 158, 11, 0.3)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-200/70 text-sm">Late Today</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.lateToday}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock size={24} className="text-yellow-400" />
              </div>
            </div>
          </FloatingCard>

          <FloatingCard glowColor="rgba(239, 68, 68, 0.3)">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-teal-200/70 text-sm">Absent Today</p>
                <p className="text-3xl font-bold text-red-400">{stats.absentToday}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <UserX size={24} className="text-red-400" />
              </div>
            </div>
          </FloatingCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Weekly Attendance Chart */}
          <FloatingCard>
            <h2 className="text-lg font-semibold font-display mb-4 text-white">Weekly Attendance</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="present" fill="#22c55e" name="Present" />
                <Bar dataKey="late" fill="#f59e0b" name="Late" />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </FloatingCard>

          {/* Export Section */}
          <div className="space-y-4">
            <FloatingCard>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold font-display text-white">Export Data</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setExportFilter('daily')}
                    variant={exportFilter === 'daily' ? 'default' : 'outline'}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <Download size={16} className="mr-2" />
                    Daily
                  </Button>
                  <Button
                    onClick={() => setExportFilter('weekly')}
                    variant={exportFilter === 'weekly' ? 'default' : 'outline'}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <Download size={16} className="mr-2" />
                    Weekly
                  </Button>
                  <Button
                    onClick={() => setExportFilter('monthly')}
                    variant={exportFilter === 'monthly' ? 'default' : 'outline'}
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                  >
                    <Download size={16} className="mr-2" />
                    Monthly
                  </Button>
                </div>
              </div>
              <p className="text-teal-200/70 text-sm mb-4">
                Export attendance data for selected time period
              </p>
              <Button onClick={handleExport} className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold">
                <Download size={16} className="mr-2" />
                Download {exportFilter.charAt(0).toUpperCase() + exportFilter.slice(1)} Report
              </Button>
            </FloatingCard>
          </div>

          {/* Today's Attendance Table */}
          <FloatingCard>
            <h2 className="text-lg font-semibold font-display mb-4 text-white">Today's Attendance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-teal-200 font-medium">Student ID</th>
                    <th className="text-left p-3 text-teal-200 font-medium">Name</th>
                    <th className="text-left p-3 text-teal-200 font-medium">Time</th>
                    <th className="text-left p-3 text-teal-200 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayRecords.length > 0 ? (
                    todayRecords.slice(0, 3).map((record, index) => (
                      <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                        <td className="p-3 text-white font-medium">{record.studentId}</td>
                        <td className="p-3 text-white">{record.studentName}</td>
                        <td className="p-3 text-teal-200">{record.time || '-'}</td>
                        <td className="p-3">
                          <StatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-teal-200/70">
                        No attendance records for today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </FloatingCard>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
