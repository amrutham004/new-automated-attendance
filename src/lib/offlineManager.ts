/**
 * src/lib/offlineManager.ts - IndexedDB Offline Attendance Manager
 * 
 * Manages offline attendance storage and synchronization
 */

interface OfflineAttendanceRecord {
    id?: string;
    studentId: string;
    studentName: string;
    image: string;
    timestamp: string;
    syncStatus: 'pending' | 'synced' | 'failed';
}

interface SyncResult {
    success: boolean;
    message: string;
    results: Array<{
        studentId: string;
        success: boolean;
        message: string;
    }>;
    summary: {
        total: number;
        success: number;
        failed: number;
    };
}

class OfflineManager {
    private dbName = 'AttendanceOfflineDB';
    private dbVersion = 1;
    private storeName = 'offlineAttendance';
    private db: IDBDatabase | null = null;
    private syncInProgress = false;

    constructor() {
        this.initDB();
        this.setupOnlineListener();
    }

    /**
     * Initialize IndexedDB database
     */
    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('syncStatus', 'syncStatus', { unique: false });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('studentId', 'studentId', { unique: false });
                }
            };
        });
    }

    /**
     * Setup online/offline event listeners
     */
    private setupOnlineListener(): void {
        window.addEventListener('online', () => {
            console.log('Device is online - attempting to sync offline data');
            this.syncPendingRecords();
        });

        window.addEventListener('offline', () => {
            console.log('Device is offline - attendance will be stored locally');
        });
    }

    /**
     * Store attendance record offline
     */
    async storeAttendanceRecord(record: Omit<OfflineAttendanceRecord, 'id' | 'syncStatus'>): Promise<string> {
        if (!this.db) {
            await this.initDB();
        }

        const offlineRecord: OfflineAttendanceRecord = {
            ...record,
            syncStatus: 'pending',
            timestamp: record.timestamp || new Date().toISOString()
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(offlineRecord);

            request.onsuccess = () => {
                const id = request.result as string;
                console.log(`Offline attendance record stored with ID: ${id}`);
                resolve(id);
            };

            request.onerror = () => {
                console.error('Failed to store offline record:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all pending offline records
     */
    async getPendingRecords(): Promise<OfflineAttendanceRecord[]> {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('syncStatus');
            const request = index.getAll('pending');

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Failed to get pending records:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Get all offline records
     */
    async getAllRecords(): Promise<OfflineAttendanceRecord[]> {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Failed to get all records:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Update record sync status
     */
    async updateRecordStatus(id: string, status: 'synced' | 'failed'): Promise<void> {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const record = getRequest.result;
                if (record) {
                    record.syncStatus = status;
                    const updateRequest = store.put(record);

                    updateRequest.onsuccess = () => {
                        console.log(`Record ${id} status updated to ${status}`);
                        resolve();
                    };

                    updateRequest.onerror = () => {
                        console.error('Failed to update record status:', updateRequest.error);
                        reject(updateRequest.error);
                    };
                } else {
                    reject(new Error('Record not found'));
                }
            };

            getRequest.onerror = () => {
                console.error('Failed to get record for status update:', getRequest.error);
                reject(getRequest.error);
            };
        });
    }

    /**
     * Delete synced records (cleanup)
     */
    async deleteSyncedRecords(): Promise<void> {
        if (!this.db) {
            await this.initDB();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const index = store.index('syncStatus');
            const request = index.openCursor(IDBKeyRange.only('synced'));

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    console.log('All synced records deleted');
                    resolve();
                }
            };

            request.onerror = () => {
                console.error('Failed to delete synced records:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Sync pending records to server
     */
    async syncPendingRecords(): Promise<SyncResult> {
        if (this.syncInProgress) {
            return {
                success: false,
                message: 'Sync already in progress',
                results: [],
                summary: { total: 0, success: 0, failed: 0 }
            };
        }

        this.syncInProgress = true;

        try {
            const pendingRecords = await this.getPendingRecords();
            
            if (pendingRecords.length === 0) {
                this.syncInProgress = false;
                return {
                    success: true,
                    message: 'No pending records to sync',
                    results: [],
                    summary: { total: 0, success: 0, failed: 0 }
                };
            }

            console.log(`Syncing ${pendingRecords.length} offline attendance records`);

            // Send to backend
            const response = await fetch('/api/sync-offline-attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pendingRecords)
            });

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.statusText}`);
            }

            const result: SyncResult = await response.json();

            // Update local record statuses based on server response
            for (const recordResult of result.results) {
                const localRecord = pendingRecords.find(r => r.studentId === recordResult.studentId);
                if (localRecord && localRecord.id) {
                    const newStatus = recordResult.success ? 'synced' : 'failed';
                    await this.updateRecordStatus(localRecord.id, newStatus);
                }
            }

            // Cleanup synced records
            if (result.summary.success > 0) {
                await this.deleteSyncedRecords();
            }

            console.log('Sync completed:', result);
            return result;

        } catch (error) {
            console.error('Sync failed:', error);
            return {
                success: false,
                message: `Sync failed: ${error}`,
                results: [],
                summary: { total: 0, success: 0, failed: 0 }
            };
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Check if device is online
     */
    isOnline(): boolean {
        return navigator.onLine;
    }

    /**
     * Get offline statistics
     */
    async getOfflineStats(): Promise<{
        pending: number;
        synced: number;
        failed: number;
        total: number;
    }> {
        const allRecords = await this.getAllRecords();
        
        return {
            pending: allRecords.filter(r => r.syncStatus === 'pending').length,
            synced: allRecords.filter(r => r.syncStatus === 'synced').length,
            failed: allRecords.filter(r => r.syncStatus === 'failed').length,
            total: allRecords.length
        };
    }
}

// Export singleton instance
export const offlineManager = new OfflineManager();

// Export types
export type { OfflineAttendanceRecord, SyncResult };
