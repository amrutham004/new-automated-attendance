/**
 * offline/OfflineManager.ts - Production-Grade Offline-First System
 * 
 * Comprehensive offline management for rural attendance system
 * Handles local storage, sync queues, and conflict resolution
 */

import { getConfig } from '@/config';
import { handleError, ErrorCategory, ErrorSeverity } from '@/errors';

export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'attendance' | 'student' | 'face_encoding' | 'notification';
  data: any;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'completed' | 'failed';
  conflictResolution?: 'local' | 'remote' | 'merge';
}

export interface ConflictResolution {
  operationId: string;
  localData: any;
  remoteData: any;
  resolution: 'local' | 'remote' | 'merge';
  resolvedAt: string;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string;
  pendingOperations: number;
  failedOperations: number;
  syncInProgress: boolean;
  storageUsage: number;
  storageQuota: number;
}

export class OfflineManager {
  private config = getConfig().offline;
  private db: IDBDatabase | null = null;
  private syncQueue: SyncOperation[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private syncTimer: number | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  
  constructor() {
    this.initializeDatabase();
    this.setupConnectivityMonitoring();
    this.startSyncTimer();
  }
  
  /**
   * Initialize IndexedDB database
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AttendanceOfflineDB', 1);
      
      request.onerror = () => {
        handleError({
          category: ErrorCategory.SYSTEM_ERROR,
          severity: ErrorSeverity.HIGH,
          code: 'OFFLINE_DB_INIT_FAILED',
          message: 'Failed to initialize offline database',
          userMessage: 'Offline storage initialization failed. Some features may not work.',
          suggestedActions: [
            { type: 'retry', label: 'Try Again' },
            { type: 'refresh', label: 'Refresh Page' }
          ],
          retryable: true
        });
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('Offline database initialized');
        this.loadSyncQueue();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores for different entities
        if (!db.objectStoreNames.contains('attendance')) {
          db.createObjectStore('attendance', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('students')) {
          db.createObjectStore('students', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('face_encodings')) {
          db.createObjectStore('face_encodings', { keyPath: 'studentId' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('status', 'status');
        }
        if (!db.objectStoreNames.contains('conflicts')) {
          db.createObjectStore('conflicts', { keyPath: 'operationId' });
        }
      };
    });
  }
  
  /**
   * Setup connectivity monitoring
   */
  private setupConnectivityMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.startSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }
  
  /**
   * Start periodic sync timer
   */
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = window.setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.startSync();
      }
    }, this.config.syncInterval);
  }
  
  /**
   * Load sync queue from database
   */
  private async loadSyncQueue(): Promise<void> {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['sync_queue'], 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();
      
      request.onsuccess = () => {
        this.syncQueue = request.result || [];
        this.notifyListeners();
      };
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }
  
  /**
   * Add operation to sync queue
   */
  async queueOperation(operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    const syncOperation: SyncOperation = {
      ...operation,
      id: this.generateOperationId(),
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending'
    };
    
    this.syncQueue.push(syncOperation);
    await this.saveSyncQueue();
    this.notifyListeners();
    
    // Try to sync immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.startSync();
    }
    
    return syncOperation.id;
  }
  
  /**
   * Generate unique operation ID
   */
  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Save sync queue to database
   */
  private async saveSyncQueue(): Promise<void> {
    if (!this.db) return;
    
    try {
      const transaction = this.db.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      
      // Clear existing queue
      await store.clear();
      
      // Add all operations
      for (const operation of this.syncQueue) {
        await store.add(operation);
      }
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }
  
  /**
   * Start sync process
   */
  private async startSync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) return;
    
    this.syncInProgress = true;
    this.notifyListeners();
    
    try {
      const pendingOperations = this.syncQueue.filter(op => op.status === 'pending');
      
      for (const operation of pendingOperations) {
        if (operation.retryCount >= 3) {
          operation.status = 'failed';
          continue;
        }
        
        try {
          operation.status = 'syncing';
          await this.saveSyncQueue();
          this.notifyListeners();
          
          await this.syncOperation(operation);
          
          operation.status = 'completed';
        } catch (error) {
          operation.retryCount++;
          operation.status = 'pending';
          
          console.warn(`Sync operation failed (attempt ${operation.retryCount}):`, error);
          
          if (operation.retryCount >= 3) {
            operation.status = 'failed';
            handleError({
              category: ErrorCategory.SYNC_ERROR,
              severity: ErrorSeverity.MEDIUM,
              code: 'SYNC_OPERATION_FAILED',
              message: `Failed to sync ${operation.entity} after multiple attempts`,
              technicalMessage: error instanceof Error ? error.message : String(error),
              userMessage: 'Some data failed to sync. Will retry when connection improves.',
              suggestedActions: [
                { type: 'retry', label: 'Retry Now' }
              ],
              retryable: true
            });
          }
        }
        
        await this.saveSyncQueue();
        this.notifyListeners();
      }
      
      // Clean up completed operations
      this.syncQueue = this.syncQueue.filter(op => op.status !== 'completed');
      await this.saveSyncQueue();
      
    } finally {
      this.syncInProgress = false;
      this.notifyListeners();
    }
  }
  
  /**
   * Sync individual operation
   */
  private async syncOperation(operation: SyncOperation): Promise<void> {
    const endpoint = this.getEndpointForEntity(operation.entity);
    
    const response = await fetch(endpoint, {
      method: this.getHttpMethodForOperation(operation.type),
      headers: {
        'Content-Type': 'application/json',
        'X-Offline-Sync': 'true',
        'X-Operation-Id': operation.id,
        'X-Timestamp': operation.timestamp
      },
      body: JSON.stringify(operation.data)
    });
    
    if (!response.ok) {
      if (response.status === 409) {
        // Conflict detected
        await this.handleConflict(operation, response);
      } else {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }
    }
  }
  
  /**
   * Handle sync conflicts
   */
  private async handleConflict(operation: SyncOperation, response: Response): Promise<void> {
    const remoteData = await response.json();
    
    switch (this.config.conflictResolution) {
      case 'last-write-wins':
        // Use remote data (server wins)
        operation.conflictResolution = 'remote';
        break;
        
      case 'versioned-merge':
        // Attempt to merge data
        const mergedData = await this.mergeData(operation.data, remoteData);
        operation.data = mergedData;
        operation.conflictResolution = 'merge';
        break;
        
      case 'manual':
        // Store conflict for manual resolution
        await this.storeConflict(operation, remoteData);
        operation.status = 'failed';
        return;
    }
    
    // Retry sync with resolved data
    await this.syncOperation(operation);
  }
  
  /**
   * Merge local and remote data
   */
  private async mergeData(localData: any, remoteData: any): Promise<any> {
    // Simple merge strategy - can be enhanced based on entity type
    return {
      ...remoteData,
      ...localData,
      lastModified: new Date().toISOString(),
      conflictResolved: true
    };
  }
  
  /**
   * Store conflict for manual resolution
   */
  private async storeConflict(operation: SyncOperation, remoteData: any): Promise<void> {
    if (!this.db) return;
    
    const conflict: ConflictResolution = {
      operationId: operation.id,
      localData: operation.data,
      remoteData,
      resolution: 'local', // Default to local
      resolvedAt: new Date().toISOString()
    };
    
    const transaction = this.db.transaction(['conflicts'], 'readwrite');
    const store = transaction.objectStore('conflicts');
    await store.add(conflict);
  }
  
  /**
   * Get endpoint for entity type
   */
  private getEndpointForEntity(entity: string): string {
    const endpoints = {
      attendance: '/api/attendance',
      student: '/api/students',
      face_encoding: '/api/face-encodings',
      notification: '/api/notifications'
    };
    
    return endpoints[entity as keyof typeof endpoints] || '/api/sync';
  }
  
  /**
   * Get HTTP method for operation type
   */
  private getHttpMethodForOperation(type: string): string {
    const methods = {
      create: 'POST',
      update: 'PUT',
      delete: 'DELETE'
    };
    
    return methods[type as keyof typeof methods] || 'POST';
  }
  
  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    const pendingCount = this.syncQueue.filter(op => op.status === 'pending').length;
    const failedCount = this.syncQueue.filter(op => op.status === 'failed').length;
    
    return {
      isOnline: this.isOnline,
      lastSyncTime: new Date().toISOString(), // Simplified - should track actual last sync
      pendingOperations: pendingCount,
      failedOperations: failedCount,
      syncInProgress: this.syncInProgress,
      storageUsage: this.getStorageUsage(),
      storageQuota: this.config.maxStorageSize
    };
  }
  
  /**
   * Get storage usage estimate
   */
  private getStorageUsage(): number {
    // Rough estimate - in production, use navigator.storage.estimate()
    return this.syncQueue.length * 1024; // Assume 1KB per operation
  }
  
  /**
   * Notify status listeners
   */
  private notifyListeners(): void {
    const status = this.getSyncStatus();
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync status listener:', error);
      }
    });
  }
  
  /**
   * Subscribe to sync status updates
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSyncStatus());
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Force sync now
   */
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.startSync();
    }
  }
  
  /**
   * Clear failed operations
   */
  async clearFailedOperations(): Promise<void> {
    this.syncQueue = this.syncQueue.filter(op => op.status !== 'failed');
    await this.saveSyncQueue();
    this.notifyListeners();
  }
  
  /**
   * Get pending operations
   */
  getPendingOperations(): SyncOperation[] {
    return this.syncQueue.filter(op => op.status === 'pending');
  }
  
  /**
   * Get failed operations
   */
  getFailedOperations(): SyncOperation[] {
    return this.syncQueue.filter(op => op.status === 'failed');
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
export const offlineManager = new OfflineManager();
