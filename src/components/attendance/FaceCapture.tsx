/**
 * FaceCapture.tsx - Face Capture Component
 * 
 * This component handles capturing a student's face photo after QR attendance:
 * - Accesses the device camera (front-facing by default)
 * - Displays a live video preview
 * - Allows capturing a photo with a button click
 * - Returns the captured image as base64 data
 * 
 * Props:
 * - onCapture: Callback function called with the captured image data
 * - onCancel: Callback function to cancel the capture process
 * - studentName: Name of the student being captured (for display)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X, RotateCcw, Check } from 'lucide-react';

interface FaceCaptureProps {
  onCapture: (imageData: string) => void;
  onCancel: () => void;
  studentName: string;
}

const FaceCapture = ({ onCapture, onCancel, studentName }: FaceCaptureProps) => {
  // State for managing capture flow
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  
  // Refs for video and canvas elements
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Start the camera stream
   * Requests camera access and displays video preview
   */
  const startCamera = useCallback(async () => {
    try {
      setError('');
      
      // Request camera access with front-facing camera preference
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera for face capture
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      // Store stream reference for cleanup
      streamRef.current = stream;
      
      // Connect stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  }, []);

  /**
   * Stop the camera stream
   * Releases camera resources
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  /**
   * Capture a photo from the video stream
   * Draws the current video frame to canvas and converts to base64
   */
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;

    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to base64 image data
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
    
    // Stop the camera stream after capture
    stopCamera();
  }, [stopCamera]);

  /**
   * Retake the photo
   * Clears captured image and restarts camera
   */
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  /**
   * Confirm and submit the captured photo
   */
  const confirmCapture = useCallback(() => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  }, [capturedImage, onCapture]);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    
    // Cleanup: stop camera when component unmounts
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  return (
    <Card className="p-6 card-shadow">
      {/* Header with student name */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold font-display">Capture Face Photo</h2>
        <p className="text-muted-foreground">
          {studentName} - Please look at the camera
        </p>
      </div>

      {/* Error message display */}
      {error && (
        <div className="mb-4 p-3 bg-danger/10 text-danger rounded-lg text-center text-sm">
          {error}
        </div>
      )}

      {/* Video preview or captured image */}
      <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden relative mb-4">
        {/* Live video preview */}
        {!capturedImage && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Captured image preview */}
        {capturedImage && (
          <img
            src={capturedImage}
            alt="Captured face"
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Face guide overlay */}
        {!capturedImage && isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-56 border-2 border-primary/50 rounded-full" />
          </div>
        )}
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Action buttons */}
      <div className="flex gap-3">
        {!capturedImage ? (
          <>
            {/* Cancel button */}
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              <X size={18} className="mr-2" />
              Cancel
            </Button>
            
            {/* Capture button */}
            <Button
              onClick={capturePhoto}
              disabled={!isStreaming}
              className="flex-1 gradient-primary text-primary-foreground"
            >
              <Camera size={18} className="mr-2" />
              Capture Face
            </Button>
          </>
        ) : (
          <>
            {/* Retake button */}
            <Button
              variant="outline"
              onClick={retakePhoto}
              className="flex-1"
            >
              <RotateCcw size={18} className="mr-2" />
              Retake
            </Button>
            
            {/* Confirm button */}
            <Button
              onClick={confirmCapture}
              className="flex-1 gradient-success text-primary-foreground"
            >
              <Check size={18} className="mr-2" />
              Confirm
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};

export default FaceCapture;
