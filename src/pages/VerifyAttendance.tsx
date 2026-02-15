/**
 * VerifyAttendance.tsx - Student Attendance Verification Page
 * 
 * This page is accessed when a student scans the QR code with their phone camera.
 * It:
 * 1. Validates the token from URL
 * 2. Records attendance automatically
 * 3. Shows confirmation message
 * 4. Redirects to face capture after 2-3 seconds
 */

import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '@/components/attendance/Header';
import Footer from '@/components/attendance/Footer';
import Scene3D from '@/components/3d/Scene3D';
import FloatingCard from '@/components/3d/FloatingCard';
import { validateAttendanceToken, markAttendanceFromScan } from '@/lib/attendanceData';
import { CheckCircle, XCircle, Clock, AlertCircle, Camera, Loader2 } from 'lucide-react';

type Step = 'validating' | 'success' | 'error';

const VerifyAttendance = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [step, setStep] = useState<Step>('validating');
  const [message, setMessage] = useState('');
  const [studentName, setStudentName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [errorType, setErrorType] = useState<'expired' | 'used' | 'invalid' | 'already'>('invalid');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!token) {
      setMessage('No attendance token found. Please scan a valid QR code.');
      setErrorType('invalid');
      return;
    }

    // Process the token - call the function directly, not as a hook
    const result = validateAttendanceToken(token);
    
    if (result.valid) {
      // Mark attendance using the regular function
      const markResult = markAttendanceFromScan(result.studentId!);
      
      if (markResult.success) {
        setStep('success');
        setMessage(markResult.message);
        setStudentName(markResult.studentName || '');
        setStudentId(result.studentId || '');
      } else {
        setErrorType('invalid');
      }
    }
  }, [token]);

  // Countdown and redirect for success
  useEffect(() => {
    if (step !== 'success') return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to face capture
          navigate(`/face-capture?roll_no=${studentId}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, navigate, studentId]);

  const getErrorIcon = () => {
    switch (errorType) {
      case 'expired':
        return <Clock size={40} className="text-yellow-400" />;
      case 'used':
      case 'already':
        return <AlertCircle size={40} className="text-yellow-400" />;
      default:
        return <XCircle size={40} className="text-red-400" />;
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'expired':
        return 'QR Code Expired';
      case 'used':
        return 'Already Used';
      case 'already':
        return 'Already Recorded';
      default:
        return 'Invalid QR Code';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      <Scene3D />
      <Header />

      <main className="container relative z-10 py-8 max-w-lg flex flex-col items-center justify-center min-h-[70vh]">
        {/* Validating State */}
        {step === 'validating' && (
          <FloatingCard>
            <div className="text-center space-y-4 py-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-cyan-500/20 flex items-center justify-center">
                <Loader2 size={40} className="text-cyan-400 animate-spin" />
              </div>
              <h2 className="text-xl font-bold font-display text-cyan-300">
                Verifying Attendance...
              </h2>
              <p className="text-cyan-100/70">Please wait while we process your attendance</p>
            </div>
          </FloatingCard>
        )}

        {/* Success State */}
        {step === 'success' && (
          <div className="space-y-6 animate-scale-in w-full">
            <FloatingCard glowColor="rgba(34, 197, 94, 0.3)">
              <div className="text-center space-y-4 py-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle size={40} className="text-green-400" />
                </div>
                
                <h2 className="text-xl font-bold font-display text-green-400">
                  Attendance Recorded!
                </h2>
                
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-white">
                    {studentId} – {studentName}
                  </p>
                  <p className="text-cyan-100/70">{message}</p>
                </div>
              </div>
            </FloatingCard>

            {/* Redirect Notice */}
            <FloatingCard glowColor="rgba(34, 211, 238, 0.2)">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                  <Camera size={24} className="text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">
                    Redirecting to face verification...
                  </p>
                  <p className="text-sm text-cyan-100/70">
                    Automatically redirecting in <span className="font-mono font-bold text-cyan-300">{countdown}</span> seconds
                  </p>
                </div>
              </div>
            </FloatingCard>
          </div>
        )}

        {/* Error State */}
        {step === 'error' && (
          <div className="animate-scale-in w-full">
            <FloatingCard glowColor="rgba(239, 68, 68, 0.3)">
              <div className="text-center space-y-4 py-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                  {getErrorIcon()}
                </div>
                
                <h2 className="text-xl font-bold font-display text-red-400">
                  {getErrorTitle()}
                </h2>
                
                {studentName && (
                  <p className="text-lg font-semibold text-white">
                    {studentId} – {studentName}
                  </p>
                )}
                
                <p className="text-cyan-100/70">{message}</p>
                
                <div className="pt-4 text-sm text-cyan-200/60">
                  Please ask your teacher for a new QR code
                </div>
              </div>
            </FloatingCard>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default VerifyAttendance;
