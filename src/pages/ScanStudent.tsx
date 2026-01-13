/**
 * ScanStudent.tsx - QR Scanner with Face Capture
 * 
 * This page allows teachers to:
 * 1. Scan a student's QR code
 * 2. If valid, capture the student's face photo (mandatory)
 * 3. Save attendance with the face capture
 * 
 * Flow: Scanning → Face Capture → Result
 */

import { useState } from 'react';
import Header from '@/components/attendance/Header';
import Footer from '@/components/attendance/Footer';
import StatusBadge from '@/components/attendance/StatusBadge';
import FaceCapture from '@/components/attendance/FaceCapture';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  validateStudentQR, 
  markAttendanceFromScan,
  saveFaceCapture,
  QR_VALIDITY_SECONDS,
  getStudentById
} from '@/lib/attendanceData';
import { AttendanceStatus } from '@/types/attendance';
import { CheckCircle, XCircle, AlertCircle, ArrowLeft, ScanLine, Clock, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Scanner } from '@yudiel/react-qr-scanner';

// ========================================
// TYPE DEFINITIONS
// ========================================

// Possible steps in the attendance flow
type Step = 'scanning' | 'face-capture' | 'result';

// Result of the attendance marking
interface ResultState {
  success: boolean;
  message: string;
  status?: AttendanceStatus;
  studentName?: string;
  expired?: boolean;
}

// ========================================
// MAIN COMPONENT
// ========================================

const ScanStudent = () => {
  // Current step in the flow
  const [step, setStep] = useState<Step>('scanning');
  
  // Result of attendance marking
  const [result, setResult] = useState<ResultState | null>(null);
  
  // Processing state for QR validation
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Any errors from camera/scanning
  const [scanError, setScanError] = useState('');
  
  // Student info from validated QR
  const [validatedStudentId, setValidatedStudentId] = useState<string>('');
  const [validatedStudentName, setValidatedStudentName] = useState<string>('');

  /**
   * Handle successful QR code scan
   * Called by the Scanner component when a QR is detected
   */
  const handleScanSuccess = (detectedCodes: { rawValue: string }[]) => {
    if (isProcessing) return;
    if (detectedCodes.length > 0 && detectedCodes[0].rawValue) {
      processScannedQR(detectedCodes[0].rawValue);
    }
  };

  /**
   * Process the scanned QR code
   * Validates the QR and transitions to face capture if valid
   */
  const processScannedQR = (qrData: string) => {
    setIsProcessing(true);
    
    // Validate QR code
    const validation = validateStudentQR(qrData);
    
    if (!validation.valid) {
      // QR validation failed - show error result
      setResult({
        success: false,
        message: validation.error || 'Invalid QR code',
        expired: validation.expired
      });
      setStep('result');
      setIsProcessing(false);
      return;
    }

    // QR is valid - get student info and proceed to face capture
    const student = getStudentById(validation.studentId!);
    if (student) {
      setValidatedStudentId(validation.studentId!);
      setValidatedStudentName(student.name);
      setStep('face-capture');
    } else {
      setResult({
        success: false,
        message: 'Student not found in system'
      });
      setStep('result');
    }
    
    setIsProcessing(false);
  };

  /**
   * Handle face capture completion
   * Saves the face image and marks attendance
   */
  const handleFaceCapture = (imageData: string) => {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Save the face capture image
    saveFaceCapture(validatedStudentId, today, imageData);
    
    // Mark attendance
    const attendanceResult = markAttendanceFromScan(validatedStudentId);
    
    setResult({
      success: attendanceResult.success,
      message: attendanceResult.message,
      status: attendanceResult.status,
      studentName: attendanceResult.studentName
    });
    
    setStep('result');
  };

  /**
   * Handle face capture cancellation
   * Goes back to scanning without marking attendance
   */
  const handleCancelFaceCapture = () => {
    setValidatedStudentId('');
    setValidatedStudentName('');
    setStep('scanning');
  };

  /**
   * Reset to scan another student
   */
  const handleReset = () => {
    setStep('scanning');
    setResult(null);
    setScanError('');
    setIsProcessing(false);
    setValidatedStudentId('');
    setValidatedStudentName('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8 max-w-lg">
        {/* Back button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/admin" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </Button>

        {/* ========================================
            STEP 1: QR SCANNING
        ======================================== */}
        {step === 'scanning' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <h1 className="text-2xl font-bold font-display mb-2">Scan Student QR</h1>
              <p className="text-muted-foreground">
                Point the camera at the student's QR code
              </p>
            </div>

            <Card className="p-4 card-shadow overflow-hidden">
              {/* Camera view for QR scanning */}
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
                
                {/* Scanning overlay guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-primary rounded-lg opacity-50" />
                </div>
              </div>
              
              {/* Error message */}
              {scanError && (
                <p className="mt-3 text-sm text-danger text-center">{scanError}</p>
              )}
              
              {/* Processing indicator */}
              {isProcessing && (
                <div className="mt-4 text-center">
                  <div className="animate-pulse-soft text-primary font-medium">
                    Processing...
                  </div>
                </div>
              )}
            </Card>

            {/* Info about QR expiration */}
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

            {/* Info about face capture requirement */}
            <Card className="p-4 card-shadow bg-primary/5">
              <div className="flex items-start gap-3">
                <Camera size={20} className="text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Face Capture Required</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    After a valid QR scan, you'll need to capture the student's face photo.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ========================================
            STEP 2: FACE CAPTURE (Mandatory)
        ======================================== */}
        {step === 'face-capture' && (
          <div className="animate-fade-in">
            <FaceCapture
              studentName={validatedStudentName}
              onCapture={handleFaceCapture}
              onCancel={handleCancelFaceCapture}
            />
          </div>
        )}

        {/* ========================================
            STEP 3: RESULT DISPLAY
        ======================================== */}
        {step === 'result' && (
          <div className="animate-scale-in">
            <Card className="p-8 card-shadow text-center">
              {result?.success ? (
                /* Success state */
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle size={40} className="text-success" />
                  </div>
                  <h2 className="text-xl font-bold font-display text-success">
                    Attendance Recorded!
                  </h2>
                  <p className="text-muted-foreground">{result.message}</p>
                  {result.status && (
                    <div className="flex justify-center">
                      <StatusBadge status={result.status} />
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Face photo has been saved with this attendance record.
                  </p>
                </div>
              ) : (
                /* Error state */
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

              {/* Scan next student button */}
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

      <Footer />
    </div>
  );
};

export default ScanStudent;
