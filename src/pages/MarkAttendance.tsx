import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/attendance/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  generateStudentQRData, 
  getStudentById, 
  hasMarkedAttendanceToday,
  QR_REFRESH_INTERVAL,
  QR_VALIDITY_SECONDS 
} from '@/lib/attendanceData';
import { ArrowLeft, CheckCircle, RefreshCw, Clock, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Progress } from '@/components/ui/progress';

type Step = 'input' | 'qr-display' | 'already-marked';

const MarkAttendance = () => {
  const [step, setStep] = useState<Step>('input');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [qrData, setQrData] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(QR_VALIDITY_SECONDS);
  const [error, setError] = useState('');

  // Generate new QR code
  const generateNewQR = useCallback(() => {
    const data = generateStudentQRData(studentId.toUpperCase());
    setQrData(data);
    setTimeRemaining(QR_VALIDITY_SECONDS);
  }, [studentId]);

  // Auto-refresh QR code
  useEffect(() => {
    if (step !== 'qr-display') return;

    // Generate initial QR
    generateNewQR();

    // Refresh QR every 5 seconds
    const refreshInterval = setInterval(() => {
      generateNewQR();
    }, QR_REFRESH_INTERVAL);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return QR_VALIDITY_SECONDS; // Reset when new QR is generated
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(countdownInterval);
    };
  }, [step, generateNewQR]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const student = getStudentById(studentId.toUpperCase());
    if (!student) {
      setError('Student ID not found. Please check and try again.');
      return;
    }

    // Check if already marked
    if (hasMarkedAttendanceToday(student.id)) {
      setStudentName(student.name);
      setStep('already-marked');
      return;
    }

    setStudentName(student.name);
    setStep('qr-display');
  };

  const handleReset = () => {
    setStep('input');
    setStudentId('');
    setStudentName('');
    setQrData('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-lg">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </Button>

        {step === 'input' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="text-2xl font-bold font-display mb-2">Mark Attendance</h1>
              <p className="text-muted-foreground">
                Enter your Student ID to generate your attendance QR code
              </p>
            </div>

            <Card className="p-6 card-shadow">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    placeholder="e.g., STU001"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    className="text-center text-lg font-mono uppercase"
                  />
                  <p className="text-xs text-muted-foreground">
                    Demo IDs: STU001 - STU010
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-danger text-center">{error}</p>
                )}

                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-primary-foreground"
                  size="lg"
                  disabled={!studentId}
                >
                  Generate My QR Code
                </Button>
              </form>
            </Card>

            {/* Security Info */}
            <Card className="p-4 card-shadow bg-muted/50">
              <div className="flex items-start gap-3">
                <Shield size={24} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Secure Attendance</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your QR code refreshes every 5 seconds and expires in 30 seconds. 
                    Show it to your teacher for scanning.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === 'qr-display' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="text-2xl font-bold font-display mb-2">Your Attendance QR</h1>
              <p className="text-muted-foreground">
                Show this to your teacher for scanning
              </p>
            </div>

            <Card className="p-6 card-shadow">
              {/* Student Info */}
              <div className="text-center mb-4 pb-4 border-b border-border">
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="text-lg font-bold font-display">{studentName}</p>
                <p className="text-sm font-mono text-muted-foreground">{studentId.toUpperCase()}</p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white rounded-xl border border-border">
                  <QRCodeSVG 
                    value={qrData}
                    size={200}
                    level="H"
                    includeMargin={false}
                    bgColor="transparent"
                    fgColor="hsl(200, 25%, 15%)"
                  />
                </div>
              </div>

              {/* Timer */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock size={14} />
                    Valid for
                  </span>
                  <span className={`font-mono font-bold ${timeRemaining <= 10 ? 'text-danger' : 'text-foreground'}`}>
                    {timeRemaining}s
                  </span>
                </div>
                <Progress 
                  value={(timeRemaining / QR_VALIDITY_SECONDS) * 100} 
                  className="h-2"
                />
              </div>

              {/* Refresh indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <RefreshCw size={12} className="animate-spin" style={{ animationDuration: '3s' }} />
                Auto-refreshing every 5 seconds
              </div>
            </Card>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleReset}
            >
              Cancel
            </Button>
          </div>
        )}

        {step === 'already-marked' && (
          <div className="animate-scale-in">
            <Card className="p-8 card-shadow text-center">
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle size={40} className="text-success" />
                </div>
                <h2 className="text-xl font-bold font-display text-success">Already Recorded!</h2>
                <p className="text-muted-foreground">
                  Attendance for <strong>{studentName}</strong> has already been recorded for today.
                </p>
              </div>

              <div className="mt-8 space-y-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/student">View My Attendance</Link>
                </Button>
                <Button variant="ghost" className="w-full" onClick={handleReset}>
                  Use Different ID
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default MarkAttendance;
