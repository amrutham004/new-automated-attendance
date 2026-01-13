/**
 * AdminDashboard.tsx - Admin Dashboard Page (3D Design)
 * 
 * Provides administrators with:
 * - Overview statistics with 3D styled cards
 * - Weekly attendance chart
 * - Export functionality
 * - Student photo upload
 * - Today's attendance table
 */

import { useState } from 'react';
import Header from '@/components/attendance/Header';
import Footer from '@/components/attendance/Footer';
import Scene3D from '@/components/3d/Scene3D';
import FloatingCard from '@/components/3d/FloatingCard';
import GlassButton from '@/components/3d/GlassButton';
import StatusBadge from '@/components/attendance/StatusBadge';
import TeacherScanCard from '@/components/attendance/TeacherScanCard';
import StudentPhotoUpload from '@/components/attendance/StudentPhotoUpload';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getDashboardStats, 
  getRecordsForExport, 
  exportToCSV, 
  getWeeklySummary,
  students 
} from '@/lib/attendanceData';
import { Users, UserCheck, Clock, UserX, Download, Calendar, ScanLine } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const AdminDashboard = () => {
  const [exportFilter, setExportFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const stats = getDashboardStats();
  const weeklyData = getWeeklySummary();
  const todayRecords = getRecordsForExport('daily');

  const handleExport = () => {
    const records = getRecordsForExport(exportFilter);
    exportToCSV(records);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <Scene3D />
      <Header />

      <main className="container relative z-10 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-cyan-100/70">
            Overview for {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { title: 'Total Students', value: stats.totalStudents, icon: Users, color: 'cyan' },
            { title: 'Present Today', value: stats.presentToday, subtitle: `${Math.round((stats.presentToday / stats.totalStudents) * 100)}%`, icon: UserCheck, color: 'green' },
            { title: 'Late Today', value: stats.lateToday, icon: Clock, color: 'yellow' },
            { title: 'Absent Today', value: stats.absentToday, icon: UserX, color: 'red' },
          ].map((stat) => (
            <div 
              key={stat.title}
              className={`
                bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5
                hover:bg-white/10 hover:border-white/20 transition-all duration-300
                hover:-translate-y-1
              `}
            >
              <div className={`
                w-10 h-10 rounded-lg mb-3 flex items-center justify-center
                ${stat.color === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' :
                  stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                  stat.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'}
              `}>
                <stat.icon size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-cyan-200/60">{stat.title}</p>
              {stat.subtitle && (
                <p className="text-xs text-green-400 mt-1">{stat.subtitle}</p>
              )}
            </div>
          ))}
        </div>

        {/* Scan Card */}
        <div className="mb-8">
          <FloatingCard glowColor="rgba(168, 85, 247, 0.3)">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                <ScanLine size={28} className="text-purple-400" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-semibold text-white">Scan Student QR Codes</h3>
                <p className="text-sm text-purple-200/70">Use the scanner to quickly record attendance</p>
              </div>
              <GlassButton to="/scan-student">
                Open Scanner
              </GlassButton>
            </div>
          </FloatingCard>
        </div>

        {/* Chart and Export Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Chart */}
          <div className="lg:col-span-2">
            <FloatingCard>
              <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2 text-white">
                <Calendar size={20} className="text-cyan-400" />
                Weekly Attendance Summary
              </h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="date" fontSize={12} stroke="#67e8f9" opacity={0.6} />
                    <YAxis fontSize={12} stroke="#67e8f9" opacity={0.6} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px',
                        border: 'none',
                        background: 'rgba(15, 23, 42, 0.9)',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                      }}
                      labelStyle={{ color: '#67e8f9' }}
                    />
                    <Legend />
                    <Bar dataKey="present" name="Present" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </FloatingCard>
          </div>

          {/* Export and Photo Upload */}
          <div className="space-y-6">
            <FloatingCard>
              <h3 className="font-semibold font-display mb-4 text-white flex items-center gap-2">
                <Download size={18} className="text-cyan-400" />
                Export Reports
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant="ghost"
                      size="sm"
                      onClick={() => setExportFilter(filter)}
                      className={`
                        flex-1 capitalize transition-all
                        ${exportFilter === filter 
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                          : 'text-cyan-200/60 hover:text-cyan-200 hover:bg-white/5'}
                      `}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
                <GlassButton onClick={handleExport} variant="secondary" className="w-full">
                  <Download size={16} />
                  Download CSV
                </GlassButton>
              </div>
            </FloatingCard>

            <StudentPhotoUpload />
          </div>
        </div>

        {/* Today's Attendance Table */}
        <FloatingCard>
          <h2 className="text-lg font-semibold font-display mb-4 text-white">Today's Attendance</h2>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="all" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-300">
                All ({students.length})
              </TabsTrigger>
              <TabsTrigger value="present" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300">
                Present ({stats.presentToday})
              </TabsTrigger>
              <TabsTrigger value="late" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-300">
                Late ({stats.lateToday})
              </TabsTrigger>
              <TabsTrigger value="absent" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300">
                Absent ({stats.absentToday})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <AttendanceTable records={todayRecords} students={students} filter="all" />
            </TabsContent>
            <TabsContent value="present" className="mt-4">
              <AttendanceTable records={todayRecords} students={students} filter="PRESENT" />
            </TabsContent>
            <TabsContent value="late" className="mt-4">
              <AttendanceTable records={todayRecords} students={students} filter="LATE_PRESENT" />
            </TabsContent>
            <TabsContent value="absent" className="mt-4">
              <AttendanceTable records={todayRecords} students={students} filter="ABSENT" />
            </TabsContent>
          </Tabs>
        </FloatingCard>
      </main>

      <Footer />
    </div>
  );
};

// Attendance Table Component
interface AttendanceTableProps {
  records: ReturnType<typeof getRecordsForExport>;
  students: typeof import('@/lib/attendanceData').students;
  filter: 'all' | 'PRESENT' | 'LATE_PRESENT' | 'ABSENT';
}

const AttendanceTable = ({ records, students: allStudents, filter }: AttendanceTableProps) => {
  const today = new Date().toISOString().split('T')[0];
  
  const getStudentStatus = (studentId: string) => {
    return records.find(r => r.studentId === studentId && r.date === today) || null;
  };

  const filteredStudents = allStudents.filter(student => {
    const record = getStudentStatus(student.id);
    if (filter === 'all') return true;
    if (filter === 'ABSENT') return !record;
    return record?.status === filter;
  });

  if (filteredStudents.length === 0) {
    return (
      <div className="py-8 text-center text-cyan-200/60">
        No students in this category
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-left text-xs font-medium text-cyan-200/60 uppercase tracking-wider">
              Student ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-cyan-200/60 uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-cyan-200/60 uppercase tracking-wider">
              Grade
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-cyan-200/60 uppercase tracking-wider">
              Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-cyan-200/60 uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {filteredStudents.map(student => {
            const record = getStudentStatus(student.id);
            return (
              <tr key={student.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-4 text-sm font-mono text-cyan-300">{student.id}</td>
                <td className="px-4 py-4 text-sm font-medium text-white">{student.name}</td>
                <td className="px-4 py-4 text-sm text-cyan-200/70">{student.grade}</td>
                <td className="px-4 py-4 text-sm text-cyan-200/70">{record?.time || '-'}</td>
                <td className="px-4 py-4">
                  <StatusBadge status={record?.status || 'ABSENT'} size="small" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
