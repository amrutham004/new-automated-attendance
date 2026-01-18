/**
 * MarkAttendance.tsx - Student QR Code Generation Page (3D Design)
 * 
 * Allows students to generate a time-limited QR code for attendance.
 * Features:
 * - 3D styled glassmorphism cards
 * - Interactive 3D background
 * - Animated transitions
 */

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/attendance/Header';
import Footer from '@/components/attendance/Footer';
import Scene3D from '@/components/3d/Scene3D';
import FloatingCard from '@/components/3d/FloatingCard';
import GlassButton from '@/components/3d/GlassButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  generateAttendanceURL, 
  getStudentById, 
  hasMarkedAttendanceToday,
  QR_VALIDITY_SECONDS 
} from '@/lib/attendanceData';
import { ArrowLeft, CheckCircle, Clock, Shield, QrCode, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

type Step = 'input' | 'qr-display' | 'already-marked';

const MarkAttendance = () => {
  const [step, setStep] = useState<Step>('input');
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [qrData, setQrData] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(QR_VALIDITY_SECONDS);
  const [error, setError] = useState('');

  // Generate new QR code with URL for student scanning
  const generateNewQR = useCallback(() => {
    const url = generateAttendanceURL(studentId.toUpperCase());
    setQrData(url);
    setTimeRemaining(QR_VALIDITY_SECONDS);
  }, [studentId]);

  // Generate QR code once when step changes
  useEffect(() => {
    if (step !== 'qr-display') return;
    generateNewQR();

    const countdownInterval = setInterval(() => {
      setTimeRemaining(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [step, generateNewQR]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const student = getStudentById(studentId.toUpperCase());
    if (!student) {
      setError('Student ID not found. Please check and try again.');
      return;
    }

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

        {/* Step: Input */}
        {step === 'input' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center">
                <QrCode size={32} className="text-cyan-400" />
              </div>
              <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent mb-2">
                Mark Attendance
              </h1>
              <p className="text-cyan-100/70">
                Enter your Student ID to generate your attendance QR code
              </p>
            </div>

            <FloatingCard>
              <form onSubmit={handleSubmit} className="space-y-5">
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
        {step === 'qr-display' && (
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

            <GlassButton variant="secondary" onClick={handleReset} className="w-full">
              Cancel
            </GlassButton>
          </div>
        )}

        {/* Step: Already Marked */}
        {step === 'already-marked' && (
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
                  onClick={handleReset}
                  className="w-full text-cyan-300/70 hover:text-cyan-300 transition-colors text-sm"
                >
                  Use Different ID
                </button>
              </div>
            </FloatingCard>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default MarkAttendance;
