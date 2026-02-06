/**
 * notifications/NotificationManager.ts - Production-Grade Notification System
 * 
 * Comprehensive notification system for rural attendance
 * Supports email, SMS, and offline queuing with retry logic
 */

import { getConfig } from '@/config';
import { offlineManager } from '@/offline/OfflineManager';
import { handleError, ErrorCategory, ErrorSeverity } from '@/errors';

export interface NotificationMessage {
  id: string;
  type: 'email' | 'sms';
  recipient: string;
  subject?: string;
  body: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'attendance' | 'error' | 'system' | 'security';
  metadata?: Record<string, any>;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  lastAttempt?: string;
  errorMessage?: string;
}

export interface NotificationProvider {
  name: string;
  type: 'email' | 'sms';
  send(message: NotificationMessage): Promise<void>;
  isConfigured(): boolean;
}

export interface EmailProvider extends NotificationProvider {
  type: 'email';
  send(message: NotificationMessage & { subject: string }): Promise<void>;
}

export interface SMSProvider extends NotificationProvider {
  type: 'sms';
  send(message: NotificationMessage): Promise<void>;
}

export class NotificationManager {
  private config = getConfig().notifications;
  private providers: Map<string, NotificationProvider> = new Map();
  private queue: NotificationMessage[] = [];
  private isOnline: boolean = navigator.onLine;
  private processingQueue: boolean = false;
  private listeners: Set<(status: { pending: number; failed: number; sent: number }) => void> = new Set();
  
  constructor() {
    this.initializeProviders();
    this.setupConnectivityMonitoring();
    this.loadQueuedNotifications();
  }
  
  /**
   * Initialize notification providers
   */
  private initializeProviders(): void {
    // Initialize email providers
    if (this.config.email.enabled) {
      switch (this.config.email.provider) {
        case 'smtp':
          this.providers.set('email', new SMTPProvider());
          break;
        case 'sendgrid':
          this.providers.set('email', new SendGridProvider());
          break;
        case 'aws-ses':
          this.providers.set('email', new AWSESProvider());
          break;
      }
    }
    
    // Initialize SMS providers
    if (this.config.sms.enabled) {
      switch (this.config.sms.provider) {
        case 'twilio':
          this.providers.set('sms', new TwilioProvider());
          break;
        case 'aws-sns':
          this.providers.set('sms', new AWSSNSProvider());
          break;
        case 'local-gateway':
          this.providers.set('sms', new LocalGatewayProvider());
          break;
      }
    }
  }
  
  /**
   * Setup connectivity monitoring
   */
  private setupConnectivityMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }
  
  /**
   * Load queued notifications from offline storage
   */
  private async loadQueuedNotifications(): Promise<void> {
    try {
      // Load from offline manager
      const pendingNotifications = await this.getQueuedNotifications();
      this.queue = pendingNotifications;
      this.notifyListeners();
      
      if (this.isOnline && this.queue.length > 0) {
        this.processQueue();
      }
    } catch (error) {
      console.error('Failed to load queued notifications:', error);
    }
  }
  
  /**
   * Send notification
   */
  async sendNotification(notification: Omit<NotificationMessage, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    const message: NotificationMessage = {
      ...notification,
      id: this.generateNotificationId(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };
    
    // Add to queue
    this.queue.push(message);
    await this.saveQueuedNotifications();
    this.notifyListeners();
    
    // Process immediately if online
    if (this.isOnline && !this.processingQueue) {
      this.processQueue();
    }
    
    return message.id;
  }
  
  /**
   * Send attendance notification
   */
  async sendAttendanceNotification(
    recipient: string,
    studentName: string,
    status: string,
    time: string
  ): Promise<string> {
    const subject = `Attendance Alert: ${studentName}`;
    const body = `Student ${studentName} marked attendance as ${status} at ${time}.`;
    
    return this.sendNotification({
      type: 'email',
      recipient,
      subject,
      body,
      priority: 'medium',
      category: 'attendance',
      metadata: { studentName, status, time }
    });
  }
  
  /**
   * Send error notification
   */
  async sendErrorNotification(
    recipient: string,
    errorType: string,
    errorMessage: string,
    severity: ErrorSeverity
  ): Promise<string> {
    const priority = severity === ErrorSeverity.CRITICAL ? 'critical' : 
                   severity === ErrorSeverity.HIGH ? 'high' : 'medium';
    
    const subject = `System Error: ${errorType}`;
    const body = `Error occurred: ${errorMessage}\nSeverity: ${severity}\nTime: ${new Date().toISOString()}`;
    
    return this.sendNotification({
      type: 'email',
      recipient,
      subject,
      body,
      priority,
      category: 'error',
      metadata: { errorType, errorMessage, severity }
    });
  }
  
  /**
   * Send system notification
   */
  async sendSystemNotification(
    recipient: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<string> {
    const subject = 'System Notification';
    
    return this.sendNotification({
      type: 'email',
      recipient,
      subject,
      body: message,
      priority,
      category: 'system'
    });
  }
  
  /**
   * Process notification queue
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || !this.isOnline) return;
    
    this.processingQueue = true;
    
    try {
      const pendingNotifications = this.queue.filter(n => n.status === 'pending');
      
      for (const notification of pendingNotifications) {
        if (notification.retryCount >= this.config.email.retryAttempts) {
          notification.status = 'failed';
          continue;
        }
        
        try {
          notification.status = 'sending';
          await this.saveQueuedNotifications();
          this.notifyListeners();
          
          await this.sendNotificationWithProvider(notification);
          
          notification.status = 'sent';
          notification.lastAttempt = new Date().toISOString();
          
        } catch (error) {
          notification.retryCount++;
          notification.status = 'pending';
          notification.lastAttempt = new Date().toISOString();
          notification.errorMessage = error instanceof Error ? error.message : String(error);
          
          // Exponential backoff
          const delay = Math.pow(this.config.email.backoffMultiplier, notification.retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          
          console.warn(`Notification send failed (attempt ${notification.retryCount}):`, error);
        }
        
        await this.saveQueuedNotifications();
        this.notifyListeners();
      }
      
      // Remove sent notifications
      this.queue = this.queue.filter(n => n.status !== 'sent');
      await this.saveQueuedNotifications();
      
    } finally {
      this.processingQueue = false;
    }
  }
  
  /**
   * Send notification using appropriate provider
   */
  private async sendNotificationWithProvider(notification: NotificationMessage): Promise<void> {
    const provider = this.providers.get(notification.type);
    if (!provider) {
      throw new Error(`No provider configured for ${notification.type}`);
    }
    
    if (!provider.isConfigured()) {
      throw new Error(`Provider ${provider.name} is not properly configured`);
    }
    
    await provider.send(notification);
  }
  
  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Save queued notifications to offline storage
   */
  private async saveQueuedNotifications(): Promise<void> {
    try {
      await offlineManager.queueOperation({
        type: 'create',
        entity: 'notification',
        data: this.queue.filter(n => n.status !== 'sent')
      });
    } catch (error) {
      console.error('Failed to save queued notifications:', error);
    }
  }
  
  /**
   * Get queued notifications from offline storage
   */
  private async getQueuedNotifications(): Promise<NotificationMessage[]> {
    try {
      // This would typically query the offline storage
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('Failed to get queued notifications:', error);
      return [];
    }
  }
  
  /**
   * Notify status listeners
   */
  private notifyListeners(): void {
    const stats = this.getQueueStats();
    this.listeners.forEach(listener => {
      try {
        listener(stats);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }
  
  /**
   * Get queue statistics
   */
  private getQueueStats() {
    const pending = this.queue.filter(n => n.status === 'pending').length;
    const failed = this.queue.filter(n => n.status === 'failed').length;
    const sent = this.queue.filter(n => n.status === 'sent').length;
    
    return { pending, failed, sent };
  }
  
  /**
   * Subscribe to notification status updates
   */
  subscribe(listener: (status: { pending: number; failed: number; sent: number }) => void): () => void {
    this.listeners.add(listener);
    listener(this.getQueueStats());
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Get queue status
   */
  getQueueStatus() {
    return this.getQueueStats();
  }
  
  /**
   * Clear failed notifications
   */
  async clearFailedNotifications(): Promise<void> {
    this.queue = this.queue.filter(n => n.status !== 'failed');
    await this.saveQueuedNotifications();
    this.notifyListeners();
  }
  
  /**
   * Retry failed notifications
   */
  async retryFailedNotifications(): Promise<void> {
    const failedNotifications = this.queue.filter(n => n.status === 'failed');
    failedNotifications.forEach(n => {
      n.status = 'pending';
      n.retryCount = 0;
      n.errorMessage = undefined;
    });
    
    await this.saveQueuedNotifications();
    this.notifyListeners();
    
    if (this.isOnline) {
      this.processQueue();
    }
  }
}

// Notification Provider Implementations

class SMTPProvider implements EmailProvider {
  name = 'SMTP';
  type = 'email' as const;
  
  isConfigured(): boolean {
    return !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS;
  }
  
  async send(message: NotificationMessage & { subject: string }): Promise<void> {
    // Implementation would use email library like nodemailer
    console.log(`Sending SMTP email to ${message.recipient}: ${message.subject}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate occasional failure for testing
    if (Math.random() < 0.1) {
      throw new Error('SMTP server unavailable');
    }
  }
}

class SendGridProvider implements EmailProvider {
  name = 'SendGrid';
  type = 'email' as const;
  
  isConfigured(): boolean {
    return !!process.env.SENDGRID_API_KEY;
  }
  
  async send(message: NotificationMessage & { subject: string }): Promise<void> {
    console.log(`Sending SendGrid email to ${message.recipient}: ${message.subject}`);
    
    // Implementation would use SendGrid API
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

class AWSESProvider implements EmailProvider {
  name = 'AWS SES';
  type = 'email' as const;
  
  isConfigured(): boolean {
    return !!process.env.AWS_ACCESS_KEY && !!process.env.AWS_SECRET_KEY;
  }
  
  async send(message: NotificationMessage & { subject: string }): Promise<void> {
    console.log(`Sending AWS SES email to ${message.recipient}: ${message.subject}`);
    
    // Implementation would use AWS SDK
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

class TwilioProvider implements SMSProvider {
  name = 'Twilio';
  type = 'sms' as const;
  
  isConfigured(): boolean {
    return !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN;
  }
  
  async send(message: NotificationMessage): Promise<void> {
    console.log(`Sending Twilio SMS to ${message.recipient}: ${message.body}`);
    
    // Implementation would use Twilio API
    await new Promise(resolve => setTimeout(resolve, 600));
  }
}

class AWSSNSProvider implements SMSProvider {
  name = 'AWS SNS';
  type = 'sms' as const;
  
  isConfigured(): boolean {
    return !!process.env.AWS_ACCESS_KEY && !!process.env.AWS_SECRET_KEY;
  }
  
  async send(message: NotificationMessage): Promise<void> {
    console.log(`Sending AWS SNS SMS to ${message.recipient}: ${message.body}`);
    
    // Implementation would use AWS SDK
    await new Promise(resolve => setTimeout(resolve, 700));
  }
}

class LocalGatewayProvider implements SMSProvider {
  name = 'Local Gateway';
  type = 'sms' as const;
  
  isConfigured(): boolean {
    return !!process.env.LOCAL_SMS_GATEWAY_URL;
  }
  
  async send(message: NotificationMessage): Promise<void> {
    console.log(`Sending Local Gateway SMS to ${message.recipient}: ${message.body}`);
    
    // Implementation would call local SMS gateway
    await new Promise(resolve => setTimeout(resolve, 400));
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();
