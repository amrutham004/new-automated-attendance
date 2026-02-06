/**
 * camera/LowLightDetector.ts - Production-Grade Low-Light Detection
 * 
 * Advanced low-light detection system for rural attendance
 * Uses multiple detection methods and adaptive thresholds
 */

import { getConfig } from '@/config';
import { handleError, ErrorCategory, ErrorSeverity } from '@/errors';

export interface LightConditions {
  brightness: number; // 0-1
  contrast: number; // 0-1
  isLowLight: boolean;
  confidence: number; // 0-1
  recommendations: string[];
  metadata: {
    method: 'histogram' | 'sensor' | 'heuristic';
    iso?: number;
    exposureTime?: number;
    timestamp: string;
  };
}

export interface CameraMetadata {
  iso?: number;
  exposureTime?: number;
  aperture?: number;
  whiteBalance?: string;
  flashMode?: string;
}

export class LowLightDetector {
  private config = getConfig().lowLight;
  private isSupported: boolean = false;
  private ambientLightSensor: any = null;
  
  constructor() {
    this.initializeSensors();
  }
  
  /**
   * Initialize available sensors
   */
  private async initializeSensors(): Promise<void> {
    try {
      // Check for ambient light sensor
      if ('AmbientLightSensor' in window) {
        this.ambientLightSensor = new (window as any).AmbientLightSensor();
        await this.ambientLightSensor.start();
        console.log('Ambient light sensor initialized');
      }
      
      this.isSupported = true;
    } catch (error) {
      console.warn('Sensor initialization failed, using fallback:', error);
      this.isSupported = false;
    }
  }
  
  /**
   * Analyze light conditions from video stream
   */
  async analyzeLightConditions(
    videoElement: HTMLVideoElement,
    cameraMetadata?: CameraMetadata
  ): Promise<LightConditions> {
    try {
      // Try multiple detection methods in order of reliability
      const methods = [
        () => this.analyzeWithSensor(cameraMetadata),
        () => this.analyzeWithCameraMetadata(cameraMetadata),
        () => this.analyzeWithHistogram(videoElement),
        () => this.analyzeWithHeuristic(videoElement)
      ];
      
      for (const method of methods) {
        try {
          const result = await method();
          if (result.confidence > 0.5) {
            return this.enhanceWithRecommendations(result);
          }
        } catch (methodError) {
          console.warn('Detection method failed:', methodError);
          continue;
        }
      }
      
      // Fallback to basic analysis
      return this.getBasicAnalysis(videoElement);
      
    } catch (error) {
      handleError({
        category: ErrorCategory.CAMERA_ERROR,
        severity: ErrorSeverity.MEDIUM,
        code: 'LOW_LIGHT_DETECTION_FAILED',
        message: 'Low-light detection failed',
        technicalMessage: error instanceof Error ? error.message : String(error),
        userMessage: 'Camera light analysis failed. Using basic settings.',
        suggestedActions: [
          { type: 'retry', label: 'Try Again' }
        ],
        retryable: true
      });
      
      return this.getBasicAnalysis(videoElement);
    }
  }
  
  /**
   * Analyze using ambient light sensor
   */
  private async analyzeWithSensor(cameraMetadata?: CameraMetadata): Promise<LightConditions> {
    if (!this.ambientLightSensor) {
      throw new Error('Ambient light sensor not available');
    }
    
    const lux = this.ambientLightSensor.illuminance;
    
    // Convert lux to brightness (0-1 scale)
    // Typical ranges: 0.001-0.01 (moonlight) to 10000+ (direct sunlight)
    let brightness = Math.log10(Math.max(lux, 0.001)) / 5; // Log scale
    brightness = Math.max(0, Math.min(1, brightness));
    
    const isLowLight = lux < this.config.minBrightness * 1000; // Convert to lux
    
    return {
      brightness,
      contrast: this.estimateContrast(brightness),
      isLowLight,
      confidence: 0.9,
      recommendations: this.generateRecommendations(isLowLight, brightness),
      metadata: {
        method: 'sensor',
        timestamp: new Date().toISOString(),
        lux
      }
    };
  }
  
  /**
   * Analyze using camera metadata
   */
  private analyzeWithCameraMetadata(cameraMetadata?: CameraMetadata): Promise<LightConditions> {
    if (!cameraMetadata?.iso) {
      throw new Error('Camera metadata not available');
    }
    
    const { iso, exposureTime } = cameraMetadata;
    
    // High ISO and long exposure indicate low light
    const isoScore = Math.min(iso / this.config.maxISO, 1);
    const exposureScore = exposureTime ? Math.min(exposureTime / 1000, 1) : 0;
    
    const lowLightScore = (isoScore + exposureScore) / 2;
    const brightness = 1 - lowLightScore;
    const isLowLight = lowLightScore > this.config.threshold;
    
    return {
      brightness,
      contrast: this.estimateContrast(brightness),
      isLowLight,
      confidence: 0.8,
      recommendations: this.generateRecommendations(isLowLight, brightness),
      metadata: {
        method: 'sensor',
        iso,
        exposureTime,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Analyze using image histogram
   */
  private async analyzeWithHistogram(videoElement: HTMLVideoElement): Promise<LightConditions> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    
    // Draw current frame
    ctx.drawImage(videoElement, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Calculate histogram
    const histogram = new Array(this.config.histogramBins).fill(0);
    const pixelCount = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const binIndex = Math.floor((gray / 255) * (this.config.histogramBins - 1));
      histogram[binIndex]++;
    }
    
    // Calculate brightness and contrast
    const brightness = this.calculateBrightnessFromHistogram(histogram, pixelCount);
    const contrast = this.calculateContrastFromHistogram(histogram);
    
    const isLowLight = brightness < this.config.threshold;
    
    return {
      brightness,
      contrast,
      isLowLight,
      confidence: 0.7,
      recommendations: this.generateRecommendations(isLowLight, brightness),
      metadata: {
        method: 'histogram',
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Analyze using heuristic methods
   */
  private async analyzeWithHeuristic(videoElement: HTMLVideoElement): Promise<LightConditions> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Cannot get canvas context');
    
    // Sample smaller area for performance
    const sampleSize = 100;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    
    ctx.drawImage(videoElement, 0, 0, sampleSize, sampleSize);
    
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;
    
    let totalBrightness = 0;
    let variance = 0;
    const pixelCount = data.length / 4;
    
    // Calculate average brightness
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      totalBrightness += gray;
    }
    
    const avgBrightness = totalBrightness / pixelCount / 255;
    
    // Calculate variance for contrast
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      variance += Math.pow((gray / 255) - avgBrightness, 2);
    }
    
    const contrast = Math.sqrt(variance / pixelCount);
    const isLowLight = avgBrightness < this.config.threshold;
    
    return {
      brightness: avgBrightness,
      contrast,
      isLowLight,
      confidence: 0.6,
      recommendations: this.generateRecommendations(isLowLight, avgBrightness),
      metadata: {
        method: 'heuristic',
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Get basic analysis as fallback
   */
  private getBasicAnalysis(videoElement: HTMLVideoElement): LightConditions {
    return {
      brightness: 0.5,
      contrast: 0.5,
      isLowLight: false,
      confidence: 0.3,
      recommendations: ['Ensure adequate lighting for best results'],
      metadata: {
        method: 'heuristic',
        timestamp: new Date().toISOString()
      }
    };
  }
  
  /**
   * Calculate brightness from histogram
   */
  private calculateBrightnessFromHistogram(histogram: number[], pixelCount: number): number {
    let weightedSum = 0;
    
    for (let i = 0; i < histogram.length; i++) {
      weightedSum += (i / histogram.length) * histogram[i];
    }
    
    return weightedSum / pixelCount;
  }
  
  /**
   * Calculate contrast from histogram
   */
  private calculateContrastFromHistogram(histogram: number[]): number {
    // Find 10th and 90th percentiles
    const totalPixels = histogram.reduce((sum, count) => sum + count, 0);
    const p10Threshold = totalPixels * 0.1;
    const p90Threshold = totalPixels * 0.9;
    
    let cumulative = 0;
    let p10Index = 0;
    let p90Index = histogram.length - 1;
    
    for (let i = 0; i < histogram.length; i++) {
      cumulative += histogram[i];
      if (cumulative >= p10Threshold && p10Index === 0) {
        p10Index = i;
      }
      if (cumulative >= p90Threshold) {
        p90Index = i;
        break;
      }
    }
    
    return (p90Index - p10Index) / histogram.length;
  }
  
  /**
   * Estimate contrast based on brightness
   */
  private estimateContrast(brightness: number): number {
    // In low light, contrast is typically lower
    return Math.max(0.1, brightness * 0.8);
  }
  
  /**
   * Generate recommendations based on light conditions
   */
  private generateRecommendations(isLowLight: boolean, brightness: number): string[] {
    const recommendations: string[] = [];
    
    if (isLowLight) {
      if (brightness < 0.1) {
        recommendations.push('Very low light detected. Move to a well-lit area.');
        recommendations.push('Consider using additional lighting sources.');
      } else if (brightness < 0.3) {
        recommendations.push('Low light detected. Enhancing capture settings.');
        recommendations.push('Move closer to a light source if possible.');
      } else {
        recommendations.push('Moderate light detected. Optimizing capture.');
      }
      
      recommendations.push('Ensure face is clearly visible and well-illuminated.');
    } else {
      if (brightness > 0.9) {
        recommendations.push('Very bright light detected. Adjusting exposure.');
        recommendations.push('Avoid direct overhead lighting if possible.');
      } else {
        recommendations.push('Good lighting conditions detected.');
      }
    }
    
    return recommendations;
  }
  
  /**
   * Enhance analysis with user-friendly recommendations
   */
  private enhanceWithRecommendations(analysis: LightConditions): LightConditions {
    return {
      ...analysis,
      recommendations: [
        ...analysis.recommendations,
        ...this.getEnvironmentSpecificTips(analysis)
      ]
    };
  }
  
  /**
   * Get environment-specific tips
   */
  private getEnvironmentSpecificTips(analysis: LightConditions): string[] {
    const tips: string[] = [];
    
    if (analysis.isLowLight) {
      tips.push('Rural environment tip: Use natural light from windows when available.');
      tips.push('Consider face the light source for better illumination.');
    }
    
    if (analysis.contrast < 0.3) {
      tips.push('Low contrast detected. Ensure even lighting on your face.');
    }
    
    return tips;
  }
  
  /**
   * Check if low-light detection is supported
   */
  isDetectionSupported(): boolean {
    return this.isSupported;
  }
  
  /**
   * Get current configuration
   */
  getConfig() {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.ambientLightSensor) {
      this.ambientLightSensor.stop();
      this.ambientLightSensor = null;
    }
  }
}

// Singleton instance
export const lowLightDetector = new LowLightDetector();
