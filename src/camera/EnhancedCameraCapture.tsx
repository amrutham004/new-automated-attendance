/**
 * camera/EnhancedCameraCapture.ts - Production-Grade Camera System
 * 
 * Integrates low-light detection, error handling, and offline capabilities
 * Optimized for rural environments with robust fallback mechanisms
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, CameraOff, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { lowLightDetector, LightConditions } from './LowLightDetector';
import { handleError, ErrorCategory, ErrorSeverity } from '@/errors';
import { offlineManager, SyncStatus } from '@/offline/OfflineManager';
import { notificationManager } from '@/notifications/NotificationManager';
import { getConfig } from '@/config';

interface EnhancedCameraCaptureProps {
  onCapture: (imageData: string, metadata: any) => void;
  onError?: (error: string) => void;
  className?: string;
  showControls?: boolean;
  autoCapture?: boolean;
}

export const EnhancedCameraCapture: React.FC<EnhancedCameraCaptureProps> = ({
  onCapture,
  onError,
  className = '',
  showControls = true,
  autoCapture = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureTimeoutRef = useRef<number | null>(null);
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lightConditions, setLightConditions] = useState<LightConditions | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraMetadata, setCameraMetadata] = useState<any>(null);
  const [isAnalyzingLight, setIsAnalyzingLight] = useState(false);
  
  const config = getConfig();
  
  // Subscribe to sync status updates
  useEffect(() => {
    const unsubscribe = offlineManager.subscribe(setSyncStatus);
    return unsubscribe;
  }, []);
  
  // Subscribe to error notifications
  useEffect(() => {
    const unsubscribe = handleError({
      category: ErrorCategory.CAMERA_ERROR,
      severity: ErrorSeverity.MEDIUM,
      code: 'CAMERA_SUBSCRIPTION',
      message: 'Camera error subscription active',
      userMessage: '',
      suggestedActions: [],
      retryable: false
    });
    
    return () => {
      // Cleanup subscription if needed
    };
  }, []);
  
  /**
   * Start camera with enhanced error handling
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      setIsStreaming(false);
      
      // Stop any existing stream
      stopCamera();
      
      // Enhanced iOS detection and constraints
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      
      // Progressive constraint sets for maximum compatibility
      const constraintSets = [
        // High quality (ideal)
        {
          video: {
            facingMode: 'user',
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          },
          audio: false
        },
        // Medium quality (fallback)
        {
          video: {
            facingMode: 'user',
            width: { ideal: 640, max: 1280 },
            height: { ideal: 480, max: 720 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: false
        },
        // Low quality (final fallback)
        {
          video: {
            facingMode: 'user'
          },
          audio: false
        }
      ];
      
      let stream: MediaStream | null = null;
      let lastError: Error | null = null;
      
      // Try each constraint set
      for (let i = 0; i < constraintSets.length; i++) {
        try {
          console.log(`Trying camera constraint set ${i + 1}:`, constraintSets[i]);
          stream = await navigator.mediaDevices.getUserMedia(constraintSets[i]);
          console.log(`Camera access successful with constraint set ${i + 1}`);
          break;
        } catch (err) {
          console.warn(`Constraint set ${i + 1} failed:`, err);
          lastError = err instanceof Error ? err : new Error('Unknown error');
          
          // Don't try other constraints if permission denied
          if (err instanceof Error && err.name === 'NotAllowedError') {
            break;
          }
        }
      }
      
      if (!stream) {
        throw lastError || new Error('Failed to access camera');
      }
      
      streamRef.current = stream;
      
      // Extract camera metadata if available
      try {
        const tracks = stream.getVideoTracks();
        if (tracks.length > 0) {
          const track = tracks[0];
          const settings = track.getSettings();
          const capabilities = track.getCapabilities ? track.getCapabilities() : {};
          
          setCameraMetadata({
            width: settings.width,
            height: settings.height,
            frameRate: settings.frameRate,
            facingMode: settings.facingMode,
            deviceId: settings.deviceId,
            capabilities
          });
        }
      } catch (metadataError) {
        console.warn('Failed to extract camera metadata:', metadataError);
      }
      
      // Setup video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          // iOS Safari specific handling
          if (isIOS && isSafari) {
            setTimeout(() => {
              videoRef.current?.play().catch(playErr => {
                console.error('iOS video play failed:', playErr);
                setError('Video playback failed. Please try again.');
              });
            }, 100);
          } else {
            videoRef.current?.play().catch(playErr => {
              console.error('Video play failed:', playErr);
            });
          }
          
          setIsStreaming(true);
          
          // Start light analysis if enabled
          if (config.lowLight.enabled) {
            startLightAnalysis();
          }
        };
        
        videoRef.current.onerror = (videoErr) => {
          console.error('Video element error:', videoErr);
          setError('Video display error. Please try again.');
        };
      }
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown camera error');
      
      // Handle specific error types
      let userMessage = 'Camera access failed. Please try again.';
      let suggestedActions = [{ type: 'retry' as const, label: 'Try Again' }];
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      
      if (error.name === 'NotAllowedError') {
        userMessage = isIOS 
          ? 'Camera permission denied. Please go to Settings > Safari > Camera and allow access.'
          : 'Camera permission denied. Please allow camera access in your browser settings.';
        suggestedActions = [{ type: 'retry' as const, label: 'Try Again' }];
      } else if (error.name === 'NotFoundError') {
        userMessage = 'No camera found. Please ensure your device has a working camera.';
      } else if (error.name === 'NotReadableError') {
        userMessage = 'Camera is already in use. Please close other apps and try again.';
      } else if (error.name === 'OverconstrainedError') {
        userMessage = 'Camera does not support required settings. Using basic mode...';
      }
      
      // Log error through centralized system
      handleError({
        category: ErrorCategory.CAMERA_ERROR,
        severity: ErrorSeverity.HIGH,
        code: `CAMERA_${error.name.toUpperCase()}`,
        message: error.message,
        technicalMessage: error.stack,
        userMessage,
        suggestedActions,
        retryable: error.name !== 'NotAllowedError'
      });
      
      setError(userMessage);
      onError?.(userMessage);
    }
  }, [onError, config.lowLight.enabled]);
  
  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setLightConditions(null);
    setIsAnalyzingLight(false);
    
    if (captureTimeoutRef.current) {
      clearTimeout(captureTimeoutRef.current);
      captureTimeoutRef.current = null;
    }
  }, []);
  
  /**
   * Start light analysis
   */
  const startLightAnalysis = useCallback(async () => {
    if (!videoRef.current || !isStreaming || isAnalyzingLight) return;
    
    setIsAnalyzingLight(true);
    
    try {
      const conditions = await lowLightDetector.analyzeLightConditions(
        videoRef.current,
        cameraMetadata
      );
      
      setLightConditions(conditions);
      
      // Show recommendations if low light detected
      if (conditions.isLowLight && conditions.recommendations.length > 0) {
        console.log('Low-light recommendations:', conditions.recommendations);
      }
      
    } catch (error) {
      console.warn('Light analysis failed:', error);
    } finally {
      setIsAnalyzingLight(false);
    }
  }, [isStreaming, isAnalyzingLight, cameraMetadata]);
  
  /**
   * Capture photo with enhanced processing
   */
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    
    setIsCapturing(true);
    setError(null);
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Cannot get canvas context');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Apply low-light optimizations if needed
      if (lightConditions?.isLowLight) {
        ctx.filter = 'brightness(1.2) contrast(1.1)';
      }
      
      // Draw current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Reset filter
      ctx.filter = 'none';
      
      // Get image data
      const imageData = canvas.toDataURL('image/jpeg', config.performance.imageCompression);
      
      // Prepare metadata
      const metadata = {
        timestamp: new Date().toISOString(),
        lightConditions,
        cameraMetadata,
        syncStatus,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };
      
      // Queue for offline sync if needed
      if (!syncStatus?.isOnline) {
        await offlineManager.queueOperation({
          type: 'create',
          entity: 'attendance',
          data: { imageData, metadata }
        });
      }
      
      // Call capture callback
      onCapture(imageData, metadata);
      
      // Send notification if critical error or system event
      if (lightConditions?.isLowLight && lightConditions.brightness < 0.1) {
        await notificationManager.sendSystemNotification(
          'admin@school.edu',
          `Very low light conditions detected during attendance capture: ${lightConditions.brightness}`,
          'medium'
        );
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Capture failed';
      
      handleError({
        category: ErrorCategory.CAMERA_ERROR,
        severity: ErrorSeverity.MEDIUM,
        code: 'PHOTO_CAPTURE_FAILED',
        message: errorMessage,
        userMessage: 'Failed to capture photo. Please try again.',
        suggestedActions: [{ type: 'retry' as const, label: 'Try Again' }],
        retryable: true
      });
      
      setError('Failed to capture photo. Please try again.');
      onError?.(errorMessage);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing, lightConditions, cameraMetadata, syncStatus, onCapture, onError, config.performance.imageCompression]);
  
  /**
   * Auto-capture functionality
   */
  useEffect(() => {
    if (autoCapture && isStreaming && !isCapturing) {
      captureTimeoutRef.current = window.setTimeout(() => {
        capturePhoto();
      }, 3000); // Auto-capture after 3 seconds
    }
    
    return () => {
      if (captureTimeoutRef.current) {
        clearTimeout(captureTimeoutRef.current);
      }
    };
  }, [autoCapture, isStreaming, isCapturing, capturePhoto]);
  
  /**
   * Periodic light analysis
   */
  useEffect(() => {
    if (!isStreaming || !config.lowLight.enabled) return;
    
    const interval = setInterval(() => {
      startLightAnalysis();
    }, 5000); // Analyze every 5 seconds
    
    return () => clearInterval(interval);
  }, [isStreaming, config.lowLight.enabled, startLightAnalysis]);
  
  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
  return (
    <div className={`enhanced-camera-capture ${className}`}>
      {/* Status Indicators */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <Badge variant={isStreaming ? 'default' : 'secondary'}>
            {isStreaming ? 'Camera Active' : 'Camera Inactive'}
          </Badge>
          
          {syncStatus && (
            <Badge variant={syncStatus.isOnline ? 'default' : 'destructive'}>
              {syncStatus.isOnline ? (
                <><Wifi className="w-3 h-3 mr-1" /> Online</>
              ) : (
                <><WifiOff className="w-3 h-3 mr-1" /> Offline</>
              )}
            </Badge>
          )}
          
          {lightConditions?.isLowLight && (
            <Badge variant="secondary">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Low Light
            </Badge>
          )}
        </div>
        
        {isAnalyzingLight && (
          <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {/* Camera View */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-auto"
          autoPlay
          playsInline
          muted
        />
        
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <CameraOff className="w-16 h-16 text-gray-600" />
          </div>
        )}
        
        {isCapturing && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        )}
      </div>
      
      {/* Light Conditions Display */}
      {lightConditions && config.lowLight.enabled && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
          <div className="flex justify-between">
            <span>Brightness: {(lightConditions.brightness * 100).toFixed(1)}%</span>
            <span>Contrast: {(lightConditions.contrast * 100).toFixed(1)}%</span>
            <span>Confidence: {(lightConditions.confidence * 100).toFixed(1)}%</span>
          </div>
          
          {lightConditions.recommendations.length > 0 && (
            <div className="mt-1 text-xs text-amber-600">
              💡 {lightConditions.recommendations[0]}
            </div>
          )}
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <Alert className="mt-4" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Controls */}
      {showControls && (
        <div className="mt-4 flex justify-center space-x-2">
          {!isStreaming ? (
            <Button onClick={startCamera} className="flex items-center space-x-2">
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </Button>
          ) : (
            <>
              <Button 
                onClick={capturePhoto} 
                disabled={isCapturing}
                className="flex items-center space-x-2"
              >
                {isCapturing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
                <span>{isCapturing ? 'Capturing...' : 'Capture'}</span>
              </Button>
              
              <Button variant="outline" onClick={stopCamera}>
                Stop Camera
              </Button>
            </>
          )}
        </div>
      )}
      
      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
