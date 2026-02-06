/**
 * errors/index.ts - Production-Grade Error Handling System
 * 
 * Centralized error handling for rural attendance system
 * Provides structured error classification, user feedback, and telemetry
 */

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  USER_RECOVERABLE = 'user_recoverable',
  SYSTEM_ERROR = 'system_error',
  CRITICAL_FAILURE = 'critical_failure',
  NETWORK_ERROR = 'network_error',
  PERMISSION_ERROR = 'permission_error',
  VALIDATION_ERROR = 'validation_error',
  CAMERA_ERROR = 'camera_error',
  SYNC_ERROR = 'sync_error',
  NOTIFICATION_ERROR = 'notification_error'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  timestamp: string;
  userAgent?: string;
  url?: string;
  action?: string;
  additionalData?: Record<string, any>;
}

export interface UserAction {
  type: 'retry' | 'refresh' | 'contact_support' | 'offline_mode' | 'change_settings';
  label: string;
  callback?: () => void | Promise<void>;
}

export interface SystemError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  message: string;
  technicalMessage?: string;
  userMessage: string;
  suggestedActions: UserAction[];
  context: ErrorContext;
  retryable: boolean;
  retryCount?: number;
  maxRetries?: number;
  timestamp: string;
  resolved?: boolean;
}

export interface ErrorTelemetry {
  errorId: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  code: string;
  timestamp: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  resolved: boolean;
  timeToResolution?: number;
  userActionTaken?: string;
}

class ErrorManager {
  private errors: Map<string, SystemError> = new Map();
  private listeners: Set<(error: SystemError) => void> = new Set();
  private telemetryQueue: ErrorTelemetry[] = [];
  private isOnline: boolean = true;
  
  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupConnectivityMonitoring();
  }
  
  /**
   * Setup global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError({
          category: ErrorCategory.SYSTEM_ERROR,
          severity: ErrorSeverity.HIGH,
          code: 'UNHANDLED_PROMISE_REJECTION',
          message: event.reason?.message || 'Unhandled promise rejection',
          technicalMessage: event.reason?.stack,
          userMessage: 'An unexpected error occurred. Please try again.',
          suggestedActions: [
            {
              type: 'retry',
              label: 'Try Again'
            }
          ],
          retryable: true
        });
      });
      
      // Handle uncaught errors
      window.addEventListener('error', (event) => {
        this.handleError({
          category: ErrorCategory.SYSTEM_ERROR,
          severity: ErrorSeverity.HIGH,
          code: 'UNCAUGHT_ERROR',
          message: event.message,
          technicalMessage: event.error?.stack,
          userMessage: 'An unexpected error occurred. Please refresh the page.',
          suggestedActions: [
            {
              type: 'refresh',
              label: 'Refresh Page'
            }
          ],
          retryable: false
        });
      });
    }
  }
  
  /**
   * Setup connectivity monitoring
   */
  private setupConnectivityMonitoring(): void {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      this.isOnline = navigator.onLine;
      
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushTelemetryQueue();
      });
      
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }
  
  /**
   * Handle and classify errors
   */
  handleError(error: Partial<SystemError>): string {
    const errorId = this.generateErrorId();
    const systemError: SystemError = {
      id: errorId,
      category: error.category || ErrorCategory.SYSTEM_ERROR,
      severity: error.severity || ErrorSeverity.MEDIUM,
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      technicalMessage: error.technicalMessage,
      userMessage: error.userMessage || this.getDefaultUserMessage(error.category),
      suggestedActions: error.suggestedActions || this.getDefaultActions(error.category),
      context: {
        timestamp: new Date().toISOString(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
        ...error.context
      },
      retryable: error.retryable ?? true,
      retryCount: error.retryCount || 0,
      maxRetries: error.maxRetries || 3,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    this.errors.set(errorId, systemError);
    this.notifyListeners(systemError);
    this.logError(systemError);
    
    return errorId;
  }
  
  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get default user message for error category
   */
  private getDefaultUserMessage(category: ErrorCategory): string {
    const messages = {
      [ErrorCategory.USER_RECOVERABLE]: 'Something went wrong, but you can try again.',
      [ErrorCategory.SYSTEM_ERROR]: 'A system error occurred. Please try again later.',
      [ErrorCategory.CRITICAL_FAILURE]: 'A critical error occurred. Please contact support.',
      [ErrorCategory.NETWORK_ERROR]: 'Network connection issue. Please check your connection.',
      [ErrorCategory.PERMISSION_ERROR]: 'Permission denied. Please check your settings.',
      [ErrorCategory.VALIDATION_ERROR]: 'Invalid input. Please check your data.',
      [ErrorCategory.CAMERA_ERROR]: 'Camera access failed. Please check permissions.',
      [ErrorCategory.SYNC_ERROR]: 'Data sync failed. Will retry automatically.',
      [ErrorCategory.NOTIFICATION_ERROR]: 'Notification failed. Will retry later.'
    };
    
    return messages[category] || 'An error occurred.';
  }
  
  /**
   * Get default suggested actions for error category
   */
  private getDefaultActions(category: ErrorCategory): UserAction[] {
    const actions: Record<ErrorCategory, UserAction[]> = {
      [ErrorCategory.USER_RECOVERABLE]: [
        { type: 'retry', label: 'Try Again' }
      ],
      [ErrorCategory.SYSTEM_ERROR]: [
        { type: 'refresh', label: 'Refresh Page' },
        { type: 'contact_support', label: 'Contact Support' }
      ],
      [ErrorCategory.CRITICAL_FAILURE]: [
        { type: 'contact_support', label: 'Contact Support' }
      ],
      [ErrorCategory.NETWORK_ERROR]: [
        { type: 'retry', label: 'Try Again' },
        { type: 'offline_mode', label: 'Work Offline' }
      ],
      [ErrorCategory.PERMISSION_ERROR]: [
        { type: 'change_settings', label: 'Check Settings' }
      ],
      [ErrorCategory.VALIDATION_ERROR]: [
        { type: 'retry', label: 'Fix and Try Again' }
      ],
      [ErrorCategory.CAMERA_ERROR]: [
        { type: 'retry', label: 'Retry Camera' },
        { type: 'change_settings', label: 'Check Permissions' }
      ],
      [ErrorCategory.SYNC_ERROR]: [
        { type: 'retry', label: 'Retry Sync' }
      ],
      [ErrorCategory.NOTIFICATION_ERROR]: [
        { type: 'retry', label: 'Retry Notification' }
      ]
    };
    
    return actions[category] || [{ type: 'retry', label: 'Try Again' }];
  }
  
  /**
   * Log error to console and telemetry
   */
  private logError(error: SystemError): void {
    // Console logging with appropriate level
    const logMethod = this.getConsoleMethod(error.severity);
    logMethod(`[${error.category.toUpperCase()}] ${error.code}: ${error.message}`, error);
    
    // Add to telemetry queue
    this.addToTelemetryQueue(error);
  }
  
  /**
   * Get appropriate console method for severity
   */
  private getConsoleMethod(severity: ErrorSeverity): (message?: any, ...optionalParams: any[]) => void {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return console.error;
      case ErrorSeverity.MEDIUM:
        return console.warn;
      case ErrorSeverity.LOW:
        return console.info;
      default:
        return console.log;
    }
  }
  
  /**
   * Add error to telemetry queue
   */
  private addToTelemetryQueue(error: SystemError): void {
    const telemetry: ErrorTelemetry = {
      errorId: error.id,
      category: error.category,
      severity: error.severity,
      code: error.code,
      timestamp: error.timestamp,
      userAgent: error.context.userAgent || '',
      userId: error.context.userId,
      sessionId: error.context.sessionId,
      resolved: error.resolved || false
    };
    
    this.telemetryQueue.push(telemetry);
    
    // Flush queue if online
    if (this.isOnline) {
      this.flushTelemetryQueue();
    }
  }
  
  /**
   * Flush telemetry queue to server
   */
  private async flushTelemetryQueue(): Promise<void> {
    if (this.telemetryQueue.length === 0) return;
    
    const telemetryBatch = [...this.telemetryQueue];
    this.telemetryQueue = [];
    
    try {
      // Send telemetry to server
      await fetch('/api/telemetry/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(telemetryBatch)
      });
    } catch (error) {
      // Re-add to queue if failed
      this.telemetryQueue.unshift(...telemetryBatch);
      console.warn('Failed to send telemetry, re-queued:', error);
    }
  }
  
  /**
   * Notify error listeners
   */
  private notifyListeners(error: SystemError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }
  
  /**
   * Retry an error
   */
  async retryError(errorId: string): Promise<boolean> {
    const error = this.errors.get(errorId);
    if (!error || !error.retryable) {
      return false;
    }
    
    if (error.retryCount! >= error.maxRetries!) {
      return false;
    }
    
    // Update retry count
    error.retryCount = (error.retryCount || 0) + 1;
    
    // Find retry action and execute
    const retryAction = error.suggestedActions.find(action => action.type === 'retry');
    if (retryAction?.callback) {
      try {
        await retryAction.callback();
        this.resolveError(errorId, 'retry_success');
        return true;
      } catch (retryError) {
        // Retry failed, keep error unresolved
        this.notifyListeners(error);
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * Resolve an error
   */
  resolveError(errorId: string, resolution?: string): void {
    const error = this.errors.get(errorId);
    if (!error) return;
    
    error.resolved = true;
    
    // Update telemetry
    const telemetry = this.telemetryQueue.find(t => t.errorId === errorId);
    if (telemetry) {
      telemetry.resolved = true;
      telemetry.timeToResolution = Date.now() - new Date(error.timestamp).getTime();
      telemetry.userActionTaken = resolution;
    }
    
    this.notifyListeners(error);
  }
  
  /**
   * Get error by ID
   */
  getError(errorId: string): SystemError | undefined {
    return this.errors.get(errorId);
  }
  
  /**
   * Get all unresolved errors
   */
  getUnresolvedErrors(): SystemError[] {
    return Array.from(this.errors.values()).filter(error => !error.resolved);
  }
  
  /**
   * Subscribe to error notifications
   */
  subscribe(listener: (error: SystemError) => void): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Clear resolved errors
   */
  clearResolvedErrors(): void {
    const resolvedIds = Array.from(this.errors.entries())
      .filter(([_, error]) => error.resolved)
      .map(([id, _]) => id);
    
    resolvedIds.forEach(id => this.errors.delete(id));
  }
  
  /**
   * Get error statistics
   */
  getStatistics(): {
    total: number;
    unresolved: number;
    byCategory: Record<ErrorCategory, number>;
    bySeverity: Record<ErrorSeverity, number>;
  } {
    const errors = Array.from(this.errors.values());
    const unresolved = errors.filter(e => !e.resolved);
    
    const byCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<ErrorCategory, number>);
    
    const bySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<ErrorSeverity, number>);
    
    return {
      total: errors.length,
      unresolved: unresolved.length,
      byCategory,
      bySeverity
    };
  }
}

// Singleton instance
export const errorManager = new ErrorManager();

// Convenience functions
export const handleError = (error: Partial<SystemError>) => errorManager.handleError(error);
export const retryError = (errorId: string) => errorManager.retryError(errorId);
export const resolveError = (errorId: string, resolution?: string) => errorManager.resolveError(errorId, resolution);
export const subscribeToErrors = (listener: (error: SystemError) => void) => errorManager.subscribe(listener);
