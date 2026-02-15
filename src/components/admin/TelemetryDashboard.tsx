/**
 * src/components/admin/TelemetryDashboard.tsx - Admin Telemetry Dashboard
 * 
 * Component for viewing system logs and telemetry data
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RefreshCw, Download, AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface LogEntry {
  id: number;
  event_type: string;
  message: string;
  details?: string;
  student_id?: string;
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'ERROR';
}

interface NotificationStatus {
  pending: number;
  sent: number;
  failed: number;
  total: number;
}

const TelemetryDashboard: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [limit, setLimit] = useState(50);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(selectedEventType !== 'all' && { event_type: selectedEventType })
      });
      
      const response = await fetch(`/api/logs/recent?${params}`);
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventTypes = async () => {
    try {
      const response = await fetch('/api/logs/events');
      const data = await response.json();
      setEventTypes(data.event_types || []);
    } catch (error) {
      console.error('Failed to fetch event types:', error);
    }
  };

  const fetchNotificationStatus = async () => {
    try {
      const response = await fetch('/api/notifications/status');
      const data = await response.json();
      setNotificationStatus(data);
    } catch (error) {
      console.error('Failed to fetch notification status:', error);
    }
  };

  const retryNotifications = async () => {
    try {
      await fetch('/api/notifications/retry', { method: 'POST' });
      await fetchNotificationStatus();
    } catch (error) {
      console.error('Failed to retry notifications:', error);
    }
  };

  const exportLogs = () => {
    const csvContent = [
      'Timestamp,Level,Event Type,Student ID,Message,Details',
      ...logs.map(log => 
        `"${log.timestamp}","${log.level}","${log.event_type}","${log.student_id || ''}","${log.message}","${log.details || ''}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchLogs();
    fetchEventTypes();
    fetchNotificationStatus();
  }, [selectedEventType, limit]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'WARNING': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'INFO': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getLevelBadge = (level: string) => {
    const variants = {
      ERROR: 'destructive',
      WARNING: 'secondary',
      INFO: 'default'
    } as const;
    
    return (
      <Badge variant={variants[level as keyof typeof variants] || 'default'}>
        {level}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">System Telemetry</h1>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportLogs} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Notification Status */}
      {notificationStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Notification Queue Status
              <Button onClick={retryNotifications} size="sm" variant="outline">
                Retry Failed
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{notificationStatus.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{notificationStatus.sent}</div>
                <div className="text-sm text-gray-600">Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{notificationStatus.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{notificationStatus.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <Select value={selectedEventType} onValueChange={setSelectedEventType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {eventTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Limit</label>
              <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem value="200">200</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getLevelIcon(log.level)}
                      <Badge variant="outline">{log.event_type}</Badge>
                      {getLevelBadge(log.level)}
                      {log.student_id && (
                        <Badge variant="secondary">Student: {log.student_id}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm">{log.message}</div>
                  {log.details && (
                    <details className="text-xs text-gray-600">
                      <summary className="cursor-pointer hover:text-gray-800">Details</summary>
                      <pre className="mt-1 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                        {JSON.stringify(JSON.parse(log.details), null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default TelemetryDashboard;
