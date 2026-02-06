/**
 * config/index.ts - Production Configuration Management
 * 
 * Centralized configuration system for rural attendance system
 * Supports environment-based configuration and runtime adjustments
 */

export interface SystemConfig {
  // Low-Light Detection Configuration
  lowLight: {
    enabled: boolean;
    threshold: number; // 0-1, lower = more sensitive
    fallbackEnabled: boolean;
    histogramBins: number;
    minBrightness: number;
    maxISO: number;
    exposureCompensation: number;
  };
  
  // Error Handling Configuration
  errorHandling: {
    maxRetries: number;
    retryDelay: number; // milliseconds
    timeoutDuration: number; // milliseconds
    enableTelemetry: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    userFeedbackDelay: number; // milliseconds
  };
  
  // Offline Configuration
  offline: {
    enabled: boolean;
    maxQueueSize: number;
    syncInterval: number; // milliseconds
    conflictResolution: 'last-write-wins' | 'versioned-merge' | 'manual';
    maxStorageSize: number; // bytes
    cleanupInterval: number; // milliseconds
  };
  
  // Notification Configuration
  notifications: {
    enabled: boolean;
    email: {
      enabled: boolean;
      provider: 'smtp' | 'sendgrid' | 'aws-ses';
      retryAttempts: number;
      backoffMultiplier: number;
    };
    sms: {
      enabled: boolean;
      provider: 'twilio' | 'aws-sns' | 'local-gateway';
      retryAttempts: number;
      backoffMultiplier: number;
    };
    queueOffline: boolean;
    maxQueueSize: number;
  };
  
  // Performance Configuration
  performance: {
    maxConcurrentRequests: number;
    requestTimeout: number;
    imageCompression: number; // 0-1 quality
    maxImageSize: number; // pixels
    backgroundSync: boolean;
    batteryOptimization: boolean;
  };
  
  // Security Configuration
  security: {
    encryptionEnabled: boolean;
    tokenExpiry: number; // seconds
    maxLoginAttempts: number;
    sessionTimeout: number; // minutes
    dataRetention: number; // days
  };
}

// Default configuration optimized for rural environments
const defaultConfig: SystemConfig = {
  lowLight: {
    enabled: true,
    threshold: 0.3, // 30% brightness threshold
    fallbackEnabled: true,
    histogramBins: 256,
    minBrightness: 0.1,
    maxISO: 3200,
    exposureCompensation: 1.5
  },
  
  errorHandling: {
    maxRetries: 3,
    retryDelay: 1000,
    timeoutDuration: 10000,
    enableTelemetry: true,
    logLevel: 'warn',
    userFeedbackDelay: 2000
  },
  
  offline: {
    enabled: true,
    maxQueueSize: 1000,
    syncInterval: 30000, // 30 seconds
    conflictResolution: 'last-write-wins',
    maxStorageSize: 50 * 1024 * 1024, // 50MB
    cleanupInterval: 3600000 // 1 hour
  },
  
  notifications: {
    enabled: true,
    email: {
      enabled: true,
      provider: 'smtp',
      retryAttempts: 3,
      backoffMultiplier: 2
    },
    sms: {
      enabled: false, // Disabled by default for rural areas
      provider: 'twilio',
      retryAttempts: 3,
      backoffMultiplier: 2
    },
    queueOffline: true,
    maxQueueSize: 500
  },
  
  performance: {
    maxConcurrentRequests: 3,
    requestTimeout: 15000,
    imageCompression: 0.7,
    maxImageSize: 1920 * 1080, // Full HD max
    backgroundSync: true,
    batteryOptimization: true
  },
  
  security: {
    encryptionEnabled: true,
    tokenExpiry: 3600, // 1 hour
    maxLoginAttempts: 5,
    sessionTimeout: 480, // 8 hours
    dataRetention: 365 // 1 year
  }
};

class ConfigManager {
  private config: SystemConfig;
  private listeners: Set<(config: SystemConfig) => void> = new Set();
  
  constructor() {
    this.config = this.loadConfig();
  }
  
  /**
   * Load configuration from environment variables and localStorage
   */
  private loadConfig(): SystemConfig {
    try {
      // Load from environment variables (for backend)
      const envConfig = this.loadFromEnvironment();
      
      // Load from localStorage (for frontend)
      const localConfig = this.loadFromLocalStorage();
      
      // Merge configurations with precedence: env > local > default
      return this.mergeConfigs(defaultConfig, localConfig, envConfig);
    } catch (error) {
      console.warn('Failed to load configuration, using defaults:', error);
      return { ...defaultConfig };
    }
  }
  
  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(): Partial<SystemConfig> {
    const config: any = {};
    
    // Low-light settings
    if (process.env.LOW_LIGHT_ENABLED !== undefined) {
      config.lowLight = { ...defaultConfig.lowLight };
      config.lowLight.enabled = process.env.LOW_LIGHT_ENABLED === 'true';
    }
    if (process.env.LOW_LIGHT_THRESHOLD) {
      config.lowLight = config.lowLight || { ...defaultConfig.lowLight };
      config.lowLight.threshold = parseFloat(process.env.LOW_LIGHT_THRESHOLD);
    }
    
    // Error handling settings
    if (process.env.ERROR_MAX_RETRIES) {
      config.errorHandling = { ...defaultConfig.errorHandling };
      config.errorHandling.maxRetries = parseInt(process.env.ERROR_MAX_RETRIES);
    }
    if (process.env.ERROR_LOG_LEVEL) {
      config.errorHandling = config.errorHandling || { ...defaultConfig.errorHandling };
      config.errorHandling.logLevel = process.env.ERROR_LOG_LEVEL as any;
    }
    
    // Offline settings
    if (process.env.OFFLINE_ENABLED !== undefined) {
      config.offline = { ...defaultConfig.offline };
      config.offline.enabled = process.env.OFFLINE_ENABLED === 'true';
    }
    if (process.env.SYNC_INTERVAL) {
      config.offline = config.offline || { ...defaultConfig.offline };
      config.offline.syncInterval = parseInt(process.env.SYNC_INTERVAL);
    }
    
    // Notification settings
    if (process.env.EMAIL_ENABLED !== undefined) {
      config.notifications = { ...defaultConfig.notifications };
      config.notifications.email = { ...defaultConfig.notifications.email };
      config.notifications.email.enabled = process.env.EMAIL_ENABLED === 'true';
    }
    if (process.env.SMS_ENABLED !== undefined) {
      config.notifications = config.notifications || { ...defaultConfig.notifications };
      config.notifications.sms = { ...defaultConfig.notifications.sms };
      config.notifications.sms.enabled = process.env.SMS_ENABLED === 'true';
    }
    
    return config;
  }
  
  /**
   * Load configuration from localStorage
   */
  private loadFromLocalStorage(): Partial<SystemConfig> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem('attendance_system_config');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    }
    
    return {};
  }
  
  /**
   * Merge multiple configuration objects
   */
  private mergeConfigs(...configs: Partial<SystemConfig>[]): SystemConfig {
    return configs.reduce((merged, config) => {
      return this.deepMerge(merged, config);
    }, defaultConfig) as SystemConfig;
  }
  
  /**
   * Deep merge objects
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
  
  /**
   * Get current configuration
   */
  get(): SystemConfig {
    return { ...this.config };
  }
  
  /**
   * Update configuration
   */
  update(updates: Partial<SystemConfig>): void {
    this.config = this.deepMerge(this.config, updates);
    this.saveToLocalStorage();
    this.notifyListeners();
  }
  
  /**
   * Save configuration to localStorage
   */
  private saveToLocalStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('attendance_system_config', JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save config to localStorage:', error);
    }
  }
  
  /**
   * Notify configuration listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config));
  }
  
  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: SystemConfig) => void): () => void {
    this.listeners.add(listener);
    listener(this.config);
    
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  /**
   * Reset to default configuration
   */
  reset(): void {
    this.config = { ...defaultConfig };
    this.saveToLocalStorage();
    this.notifyListeners();
  }
  
  /**
   * Export configuration
   */
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }
  
  /**
   * Import configuration
   */
  import(configJson: string): boolean {
    try {
      const imported = JSON.parse(configJson);
      this.config = this.deepMerge(defaultConfig, imported);
      this.saveToLocalStorage();
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      return false;
    }
  }
}

// Singleton instance
export const configManager = new ConfigManager();

// Export configuration getter for convenience
export const getConfig = () => configManager.get();

// Export configuration updater for convenience
export const updateConfig = (updates: Partial<SystemConfig>) => configManager.update(updates);

// Export subscription helper
export const subscribeToConfig = (listener: (config: SystemConfig) => void) => 
  configManager.subscribe(listener);
