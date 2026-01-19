/**
 * MarkAttendance.tsx - Unified Attendance Page (3D Design)
 * 
 * This page handles both:
 * 1. Student QR Code Generation - Generate time-limited QR for attendance
 * 2. Teacher QR Scanning - Scan student QR codes with face capture
 * 
 * Features:
 * - 3D styled glassmorphism cards
 * - Interactive 3D background
 * - Animated transitions
 * - Mode toggle between Generate and Scan
 */

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/attendance/Header';
import Footer from '@/components/attendance/Footer';
import Scene3D from '@/components/3d/Scene3D';
import FloatingCard from '@/components/3d/FloatingCard';
import GlassButton from '@/components/3d/GlassButton';
import StatusBadge from '@/components/attendance/StatusBadge';
import FaceCapture from '@/components/attendance/FaceCapture';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  generateAttendanceURL, 
  getStudentById, 
  hasMarkedAttendanceToday,
  validateStudentQR,
  markAttendanceFromScan,
  saveFaceCapture,
  QR_VALIDITY_SECONDS 
} from '@/lib/attendanceData';
import { AttendanceStatus } from '@/types/attendance';
import { 
  ArrowLeft, CheckCircle, Clock, Shield, QrCode, Smartphone, 
  ScanLine, Camera, XCircle, AlertCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';

// ========================================
// TYPE DEFINITIONS
// ========================================

// Main mode: Generate QR or Scan QR
type Mode = 'generate' | 'scan';

// Steps for Generate mode
type GenerateStep = 'input' | 'qr-display' | 'already-marked';

// Steps for Scan mode
type ScanStep = 'scanning' | 'face-capture' | 'result';

// Result of the attendance marking (for scan mode)
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

const MarkAttendance = () => {
  // Current mode (generate or scan)
  const [mode, setMode] = useState<Mode>('generate');
  
  // ========== GENERATE MODE STATE ==========
  const [generateStep, setGenerateStep] = useState<GenerateStep>('input');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [qrData, setQrData] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(QR_VALIDITY_SECONDS);
  const [error, setError] = useState('');

  // ========== SCAN MODE STATE ==========
  const [scanStep, setScanStep] = useState<ScanStep>('scanning');
  const [result, setResult] = useState<ResultState | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanError, setScanError] = useState('');
  const [validatedStudentId, setValidatedStudentId] = useState<string>('');
  const [validatedStudentName, setValidatedStudentName] = useState<string>('');

  // ========================================
  // GENERATE MODE FUNCTIONS
  // ========================================

  // Generate new QR code with URL for student scanning
  const generateNewQR = useCallback(() => {
    const url = generateAttendanceURL(studentId.toUpperCase());
    setQrData(url);
    setTimeRemaining(QR_VALIDITY_SECONDS);
  }, [studentId]);

  // Generate QR code once when step changes
  useEffect(() => {
    if (mode !== 'generate' || generateStep !== 'qr-display') return;
    generateNewQR();

    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [mode, generateStep, generateNewQR]);

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const student = getStudentById(studentId.toUpperCase());
    if (!student) {
      setError('Student ID not found. Please check and try again.');
      return;
    }

    if (hasMarkedAttendanceToday(student.id)) {
      setStudentName(student.name);
      setGenerateStep('already-marked');
      return;
    }

    setStudentName(student.name);
    setGenerateStep('qr-display');
  };

  const handleGenerateReset = () => {
    setGenerateStep('input');
    setStudentId('');
    setStudentName('');
    setQrData('');
    setError('');
  };

  // ========================================
  // SCAN MODE FUNCTIONS
  // ========================================

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
      setScanStep('result');
      setIsProcessing(false);
      return;
    }

    // QR is valid - get student info and proceed to face capture
    const student = getStudentById(validation.studentId!);
    if (student) {
      setValidatedStudentId(validation.studentId!);
      setValidatedStudentName(student.name);
      setScanStep('face-capture');
    } else {
      setResult({
        success: false,
        message: 'Student not found in system'
      });
      setScanStep('result');
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
    
    setScanStep('result');
  };

  /**
   * Handle face capture cancellation
   * Goes back to scanning without marking attendance
   */
  const handleCancelFaceCapture = () => {
    setValidatedStudentId('');
    setValidatedStudentName('');
    setScanStep('scanning');
  };

  /**
   * Reset scan mode to scan another student
   */
  const handleScanReset = () => {
    setScanStep('scanning');
    setResult(null);
    setScanError('');
    setIsProcessing(false);
    setValidatedStudentId('');
    setValidatedStudentName('');
  };

  // ========================================
  // MODE SWITCHING
  // ========================================

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    // Reset both modes when switching
    handleGenerateReset();
    handleScanReset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* 3D Background */}
      <Scene3D />
      <Header />

      <main className="container relative z-10 py-8 max-w-lg">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-cyan-300/70 hover:text-cyan-300 transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => switchMode('generate')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'generate'
                ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-white/10 text-cyan-100/70 hover:bg-white/20'
            }`}
          >
            <QrCode size={18} />
            Generate QR
          </button>
          <button
            onClick={() => switchMode('scan')}
            className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              mode === 'scan'
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-white/10 text-cyan-100/70 hover:bg-white/20'
            }`}
          >
            <ScanLine size={18} />
            Scan QR
          </button>
        </div>

        {/* ========================================
            GENERATE MODE
        ======================================== */}
        {mode === 'generate' && (
          <>
            {/* Step: Input */}
            {generateStep === 'input' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <QrCode size={32} className="text-cyan-400" />
                  </div>
                  <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent mb-2">
                    Generate QR Code
                  </h1>
                  <p className="text-cyan-100/70">
                    Enter your Student ID to generate your attendance QR code
                  </p>
                </div>

                <FloatingCard>
                  <form onSubmit={handleGenerateSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="studentId" className="text-cyan-100">Student ID</Label>
                      <Input
                        id="studentId"
                        placeholder="e.g., STU001"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        required
                        className="text-center text-lg font-mono uppercase bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      />
                      <p className="text-xs text-cyan-200/60">
                        Demo IDs: STU001 - STU010
                      </p>
                    </div>

                    {error && (
                      <p className="text-sm text-red-400 text-center">{error}</p>
                    )}

                    <GlassButton variant="primary" className="w-full">
                      Generate My QR Code
                    </GlassButton>
                  </form>
                </FloatingCard>

                {/* Security Info */}
                <FloatingCard glowColor="rgba(168, 85, 247, 0.2)">
                  <div className="flex items-start gap-3">
                    <Shield size={24} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-white">Secure Attendance</p>
                      <p className="text-sm text-purple-100/70 mt-1">
                        Your QR code expires in 30 seconds. Scan it with your phone camera to mark attendance.
                      </p>
                    </div>
                  </div>
                </FloatingCard>
              </div>
            )}

            {/* Step: QR Display */}
            {generateStep === 'qr-display' && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent mb-2">
                    Your Attendance QR
                  </h1>
                  <p className="text-cyan-100/70 flex items-center justify-center gap-2">
                    <Smartphone size={16} />
                    Scan with your phone camera to mark attendance
                  </p>
                </div>

                <FloatingCard>
                  {/* Student Info */}
                  <div className="text-center mb-4 pb-4 border-b border-white/10">
                    <p className="text-sm text-cyan-200/60">Student</p>
                    <p className="text-lg font-bold text-white">{studentName}</p>
                    <p className="text-sm font-mono text-cyan-300/70">{studentId.toUpperCase()}</p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-white rounded-xl shadow-2xl shadow-cyan-500/20">
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
                      <span className="flex items-center gap-1.5 text-cyan-200/60">
                        <Clock size={14} />
                        Valid for
                      </span>
                      <span className={`font-mono font-bold ${timeRemaining <= 10 ? 'text-red-400' : 'text-cyan-300'}`}>
                        {timeRemaining}s
                      </span>
                    </div>
                    <Progress 
                      value={(timeRemaining / QR_VALIDITY_SECONDS) * 100} 
                      className="h-2 bg-white/10"
                    />
                  </div>
                </FloatingCard>

                <GlassButton variant="secondary" onClick={handleGenerateReset} className="w-full">
                  Cancel
                </GlassButton>
              </div>
            )}

            {/* Step: Already Marked */}
            {generateStep === 'already-marked' && (
              <div className="animate-scale-in">
                <FloatingCard glowColor="rgba(34, 197, 94, 0.3)">
                  <div className="text-center space-y-4">
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle size={40} className="text-green-400" />
                    </div>
                    <h2 className="text-xl font-bold font-display text-green-400">Already Recorded!</h2>
                    <p className="text-cyan-100/70">
                      Attendance for <strong className="text-white">{studentName}</strong> has already been recorded for today.
                    </p>
                  </div>

                  <div className="mt-8 space-y-3">
                    <GlassButton to="/student" variant="secondary" className="w-full">
                      View My Attendance
                    </GlassButton>
                    <button 
                      onClick={handleGenerateReset}
                      className="w-full text-cyan-300/70 hover:text-cyan-300 transition-colors text-sm"
                    >
                      Use Different ID
                    </button>
                  </div>
                </FloatingCard>
              </div>
            )}
          </>
        )}

        {/* ========================================
            SCAN MODE
        ======================================== */}
        {mode === 'scan' && (
          <>
            {/* Step: Scanning */}
            {scanStep === 'scanning' && (
              <div className="space-y-6 animate-fade-in">
                {/* Page Header */}
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center">
                    <ScanLine size={32} className="text-purple-400" />
                  </div>
                  <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent mb-2">
                    Scan Student QR
                  </h1>
                  <p className="text-cyan-100/70">
                    Point the camera at the student's QR code
                  </p>
                </div>

                {/* Scanner Card */}
                <FloatingCard>
                  {/* Camera view for QR scanning */}
                  <div className="aspect-square rounded-xl overflow-hidden bg-black relative">
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
                      <div className="w-48 h-48 border-2 border-cyan-400 rounded-xl opacity-60 shadow-lg shadow-cyan-500/30" />
                    </div>
                  </div>
                  
                  {/* Error message */}
                  {scanError && (
                    <p className="mt-4 text-sm text-red-400 text-center">{scanError}</p>
                  )}
                  
                  {/* Processing indicator */}
                  {isProcessing && (
                    <div className="mt-4 text-center">
                      <div className="animate-pulse text-cyan-400 font-medium">
                        Processing...
                      </div>
                    </div>
                  )}
                </FloatingCard>

                {/* Info about QR expiration */}
                <FloatingCard glowColor="rgba(234, 179, 8, 0.2)">
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-white">Time-Limited QR Codes</p>
                      <p className="text-sm text-cyan-100/70 mt-1">
                        Student QR codes expire in {QR_VALIDITY_SECONDS} seconds. 
                        Ensure students show a fresh code.
                      </p>
                    </div>
                  </div>
                </FloatingCard>

                {/* Info about face capture requirement */}
                <FloatingCard glowColor="rgba(34, 211, 238, 0.2)">
                  <div className="flex items-start gap-3">
                    <Camera size={20} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-white">Face Capture Required</p>
                      <p className="text-sm text-cyan-100/70 mt-1">
                        After a valid QR scan, you'll need to capture the student's face photo.
                      </p>
                    </div>
                  </div>
                </FloatingCard>
              </div>
            )}

            {/* Step: Face Capture */}
            {scanStep === 'face-capture' && (
              <div className="animate-fade-in">
                <FaceCapture
                  studentName={validatedStudentName}
                  onCapture={handleFaceCapture}
                  onCancel={handleCancelFaceCapture}
                />
              </div>
            )}

            {/* Step: Result */}
            {scanStep === 'result' && (
              <div className="animate-scale-in">
                <FloatingCard glowColor={result?.success ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}>
                  <div className="text-center space-y-4">
                    {result?.success ? (
                      /* Success state */
                      <>
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                          <CheckCircle size={40} className="text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold font-display text-green-400">
                          Attendance Recorded!
                        </h2>
                        <p className="text-cyan-100/70">{result.message}</p>
                        {result.status && (
                          <div className="flex justify-center">
                            <StatusBadge status={result.status} />
                          </div>
                        )}
                        <p className="text-sm text-cyan-200/60">
                          Face photo has been saved with this attendance record.
                        </p>
                      </>
                    ) : (
                      /* Error state */
                      <>
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                          {result?.expired ? (
                            <Clock size={40} className="text-yellow-400" />
                          ) : result?.message.includes('already') ? (
                            <AlertCircle size={40} className="text-yellow-400" />
                          ) : (
                            <XCircle size={40} className="text-red-400" />
                          )}
                        </div>
                        <h2 className="text-xl font-bold font-display text-red-400">
                          {result?.expired ? 'QR Expired' : result?.message.includes('already') ? 'Already Recorded' : 'Error'}
                        </h2>
                        <p className="text-cyan-100/70">{result?.message}</p>
                      </>
                    )}

                    {/* Scan next student button */}
                    <div className="mt-8">
                      <GlassButton onClick={handleScanReset} className="w-full">
                        <ScanLine size={18} />
                        Scan Next Student
                      </GlassButton>
                    </div>
                  </div>
                </FloatingCard>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MarkAttendance;