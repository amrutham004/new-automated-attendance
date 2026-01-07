import { useState } from 'react';
import Header from '@/components/attendance/Header';
import StatCard from '@/components/attendance/StatCard';
import StatusBadge from '@/components/attendance/StatusBadge';
import QRCodeDisplay from '@/components/attendance/QRCodeDisplay';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  getDashboardStats, 
  getRecordsForExport, 
  exportToCSV, 
  getWeeklySummary,
  students 
} from '@/lib/attendanceData';
import { Users, UserCheck, Clock, UserX, Download, Calendar } from 'lucide-react';
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
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold font-display mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of school attendance for {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={Users}
            variant="default"
          />
          <StatCard
            title="Present Today"
            value={stats.presentToday}
            subtitle={`${Math.round((stats.presentToday / stats.totalStudents) * 100)}%`}
            icon={UserCheck}
            variant="success"
          />
          <StatCard
            title="Late Today"
            value={stats.lateToday}
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Absent Today"
            value={stats.absentToday}
            icon={UserX}
            variant="danger"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart Section */}
          <div className="lg:col-span-2">
            <Card className="p-6 card-shadow">
              <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Weekly Attendance Summary
              </h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="present" name="Present" fill="hsl(142, 70%, 45%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="late" name="Late" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="absent" name="Absent" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* QR Code & Export */}
          <div className="space-y-6">
            <QRCodeDisplay showForAdmin />

            <Card className="p-6 card-shadow">
              <h3 className="font-semibold font-display mb-4">Export Reports</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((filter) => (
                    <Button
                      key={filter}
                      variant={exportFilter === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setExportFilter(filter)}
                      className="flex-1 capitalize"
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
                <Button onClick={handleExport} className="w-full" variant="outline">
                  <Download size={16} className="mr-2" />
                  Download CSV
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Today's Attendance Table */}
        <Card className="mt-8 card-shadow">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold font-display">Today's Attendance</h2>
          </div>
          <Tabs defaultValue="all" className="w-full">
            <div className="px-6 pt-4">
              <TabsList>
                <TabsTrigger value="all">All ({students.length})</TabsTrigger>
                <TabsTrigger value="present">Present ({stats.presentToday})</TabsTrigger>
                <TabsTrigger value="late">Late ({stats.lateToday})</TabsTrigger>
                <TabsTrigger value="absent">Absent ({stats.absentToday})</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="all" className="mt-0">
              <AttendanceTable records={todayRecords} students={students} filter="all" />
            </TabsContent>
            <TabsContent value="present" className="mt-0">
              <AttendanceTable records={todayRecords} students={students} filter="PRESENT" />
            </TabsContent>
            <TabsContent value="late" className="mt-0">
              <AttendanceTable records={todayRecords} students={students} filter="LATE_PRESENT" />
            </TabsContent>
            <TabsContent value="absent" className="mt-0">
              <AttendanceTable records={todayRecords} students={students} filter="ABSENT" />
            </TabsContent>
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

interface AttendanceTableProps {
  records: ReturnType<typeof getRecordsForExport>;
  students: typeof import('@/lib/attendanceData').students;
  filter: 'all' | 'PRESENT' | 'LATE_PRESENT' | 'ABSENT';
}

const AttendanceTable = ({ records, students: allStudents, filter }: AttendanceTableProps) => {
  const today = new Date().toISOString().split('T')[0];
  
  const getStudentStatus = (studentId: string) => {
    const record = records.find(r => r.studentId === studentId && r.date === today);
    return record ? record : null;
  };

  const filteredStudents = allStudents.filter(student => {
    const record = getStudentStatus(student.id);
    if (filter === 'all') return true;
    if (filter === 'ABSENT') return !record;
    return record?.status === filter;
  });

  if (filteredStudents.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No students in this category
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Student ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Grade
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filteredStudents.map(student => {
            const record = getStudentStatus(student.id);
            return (
              <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 text-sm font-mono">{student.id}</td>
                <td className="px-6 py-4 text-sm font-medium">{student.name}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{student.grade}</td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {record?.time || '-'}
                </td>
                <td className="px-6 py-4">
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
