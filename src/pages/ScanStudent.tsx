import { useState } from 'react';
import Header from '@/components/attendance/Header';
import StatusBadge from '@/components/attendance/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  validateStudentQR, 
  markAttendanceFromScan,
  QR_VALIDITY_SECONDS 
} from '@/lib/attendanceData';
import { AttendanceStatus } from '@/types/attendance';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, ScanLine, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

type Step = 'scanning' | 'result';

interface ResultState {
  success: boolean;
  message: string;
  status?: AttendanceStatus;
  studentName?: string;
  expired?: boolean;
}

const ScanStudent = () => {
  const [step, setStep] = useState<Step>('scanning');
  const [result, setResult] = useState<ResultState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanError, setScanError] = useState('');

  const handleScanSuccess = (detectedCodes: { rawValue: string }[]) => {
    if (isProcessing) return;
    if (detectedCodes.length > 0 && detectedCodes[0].rawValue) {
      processScannedQR(detectedCodes[0].rawValue);
    }
  };

  const processScannedQR = (qrData: string) => {
    setIsProcessing(true);
    
    // Validate QR code
    const validation = validateStudentQR(qrData);
    
    if (!validation.valid) {
      setResult({
        success: false,
        message: validation.error || 'Invalid QR code',
        expired: validation.expired
      });
      setStep('result');
      setIsProcessing(false);
      return;
    }

    // Mark attendance
    const attendanceResult = markAttendanceFromScan(validation.studentId!);
    setResult({
      success: attendanceResult.success,
      message: attendanceResult.message,
      status: attendanceResult.status,
      studentName: attendanceResult.studentName
    });
    setStep('result');
    setIsProcessing(false);
  };

  const handleReset = () => {
    setStep('scanning');
    setResult(null);
    setScanError('');
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-lg">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/admin" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </Button>

        {step === 'scanning' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="text-2xl font-bold font-display mb-2">Scan Student QR</h1>
              <p className="text-muted-foreground">
                Point the camera at the student's QR code
              </p>
            </div>

            <Card className="p-4 card-shadow overflow-hidden">
              <div className="aspect-square rounded-lg overflow-hidden bg-black relative">
                <Scanner
                  onScan={handleScanSuccess}
                  onError={(error) => setScanError(error instanceof Error ? error.message : 'Camera error')}
                  constraints={{ facingMode: 'environment' }}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { width: '100%', height: '100%', objectFit: 'cover' }
                  }}
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-50" />
                </div>
              </div>
              
              {scanError && (
                <p className="mt-3 text-sm text-danger text-center">{scanError}</p>
              )}
              
              {isProcessing && (
                <div className="mt-4 text-center">
                  <div className="animate-pulse-soft text-primary font-medium">
                    Processing...
                  </div>
                </div>
              )}
            </Card>

            {/* Info Card */}
            <Card className="p-4 card-shadow bg-muted/50">
              <div className="flex items-start gap-3">
                <Clock size={20} className="text-warning flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Time-Limited QR Codes</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Student QR codes expire in {QR_VALIDITY_SECONDS} seconds. 
                    Ensure students show a fresh code.
                  </p>
                </div>
              </div>
            </Card>
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
                  <h2 className="text-xl font-bold font-display text-success">Attendance Recorded!</h2>
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
                    {result?.expired ? (
                      <Clock size={40} className="text-warning" />
                    ) : result?.message.includes('already') ? (
                      <AlertCircle size={40} className="text-warning" />
                    ) : (
                      <XCircle size={40} className="text-danger" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold font-display text-danger">
                    {result?.expired ? 'QR Expired' : result?.message.includes('already') ? 'Already Recorded' : 'Error'}
                  </h2>
                  <p className="text-muted-foreground">{result?.message}</p>
                </div>
              )}

              <div className="mt-8">
                <Button 
                  onClick={handleReset} 
                  className="w-full gradient-primary text-primary-foreground"
                  size="lg"
                >
                  <ScanLine size={18} className="mr-2" />
                  Scan Next Student
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default ScanStudent;
