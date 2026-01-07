import { useState, useEffect } from 'react';
import Header from '@/components/attendance/Header';
import StatusBadge from '@/components/attendance/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { markAttendance } from '@/lib/attendanceData';
import { AttendanceStatus } from '@/types/attendance';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, Camera, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

type Step = 'input' | 'scanning' | 'result';

interface ResultState {
  success: boolean;
  message: string;
  status?: AttendanceStatus;
}

const MarkAttendance = () => {
  const [step, setStep] = useState<Step>('input');
  const [studentId, setStudentId] = useState('');
  const [scannedToken, setScannedToken] = useState('');
  const [result, setResult] = useState<ResultState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scanError, setScanError] = useState('');

  const handleStartScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    setScanError('');
    setStep('scanning');
  };

  const handleScanSuccess = (detectedCodes: { rawValue: string }[]) => {
    if (detectedCodes.length > 0 && detectedCodes[0].rawValue) {
      const token = detectedCodes[0].rawValue;
      setScannedToken(token);
      processAttendance(token);
    }
  };

  const processAttendance = (token: string) => {
    setIsSubmitting(true);
    
    setTimeout(() => {
      const response = markAttendance(studentId.toUpperCase(), token);
      setResult(response);
      setStep('result');
      setIsSubmitting(false);
    }, 500);
  };

  const handleReset = () => {
    setStep('input');
    setStudentId('');
    setScannedToken('');
    setResult(null);
    setScanError('');
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
                Enter your Student ID, then scan the QR code displayed in class
              </p>
            </div>

            {/* Attendance Form */}
            <Card className="p-6 card-shadow">
              <form onSubmit={handleStartScan} className="space-y-5">
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

                <Button 
                  type="submit" 
                  className="w-full gradient-primary text-primary-foreground"
                  size="lg"
                  disabled={!studentId}
                >
                  <Camera size={20} className="mr-2" />
                  Scan QR Code
                </Button>
              </form>
            </Card>

            {/* Instructions */}
            <Card className="p-4 card-shadow bg-muted/50">
              <div className="flex items-start gap-3">
                <QrCode size={24} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">How to mark attendance:</p>
                  <ol className="text-sm text-muted-foreground mt-1 space-y-1">
                    <li>1. Enter your Student ID above</li>
                    <li>2. Click "Scan QR Code"</li>
                    <li>3. Point your camera at the QR code displayed by your teacher</li>
                  </ol>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === 'scanning' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="text-2xl font-bold font-display mb-2">Scan QR Code</h1>
              <p className="text-muted-foreground">
                Point your camera at the attendance QR code
              </p>
            </div>

            <Card className="p-4 card-shadow overflow-hidden">
              <div className="aspect-square rounded-lg overflow-hidden bg-black">
                <Scanner
                  onScan={handleScanSuccess}
                  onError={(error) => setScanError(error instanceof Error ? error.message : 'Camera error')}
                  constraints={{ facingMode: 'environment' }}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { width: '100%', height: '100%', objectFit: 'cover' }
                  }}
                />
              </div>
              
              {scanError && (
                <p className="mt-3 text-sm text-danger text-center">{scanError}</p>
              )}
              
              {isSubmitting && (
                <div className="mt-4 text-center">
                  <div className="animate-pulse-soft text-primary font-medium">
                    Processing attendance...
                  </div>
                </div>
              )}
            </Card>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setStep('input')}
            >
              Cancel
            </Button>
          </div>
        )}

        {step === 'result' && (
          <div className="animate-scale-in">
            <Card className="p-8 card-shadow text-center">
              {result?.success ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle size={40} className="text-success" />
                  </div>
                  <h2 className="text-xl font-bold font-display text-success">Success!</h2>
                  <p className="text-muted-foreground">{result.message}</p>
                  {result.status && (
                    <div className="flex justify-center">
                      <StatusBadge status={result.status} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
                    {result?.message.includes('already') ? (
                      <AlertCircle size={40} className="text-warning" />
                    ) : (
                      <XCircle size={40} className="text-danger" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold font-display text-danger">
                    {result?.message.includes('already') ? 'Already Recorded' : 'Error'}
                  </h2>
                  <p className="text-muted-foreground">{result?.message}</p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <Button 
                  onClick={handleReset} 
                  className="w-full"
                  variant={result?.success ? 'outline' : 'default'}
                >
                  {result?.success ? 'Record Another' : 'Try Again'}
                </Button>
                <Button variant="ghost" className="w-full" asChild>
                  <Link to="/">Return to Home</Link>
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
