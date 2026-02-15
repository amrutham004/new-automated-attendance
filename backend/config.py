"""
backend/config.py - Backend Configuration

Centralized configuration for the attendance system backend
"""

import os
from pathlib import Path
from typing import Optional

# Base paths
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / 'data'
DB_FILE = DATA_DIR / 'attendance.db'

# Ensure data directory exists
DATA_DIR.mkdir(exist_ok=True)

# Low-light detection configuration
LOW_LIGHT_THRESHOLD = float(os.getenv('LOW_LIGHT_THRESHOLD', '50.0'))  # 0-255 brightness threshold
APPLY_HISTOGRAM_EQUALIZATION = os.getenv('APPLY_HISTOGRAM_EQUALIZATION', 'true').lower() == 'true'

# Email notification configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USERNAME = os.getenv('SMTP_USERNAME', 'your-email@gmail.com')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', 'your-app-password')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@school.edu')
EMAIL_ENABLED = os.getenv('EMAIL_ENABLED', 'true').lower() == 'true'

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL', f'sqlite:///{DB_FILE.absolute()}')

# Logging configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_TO_FILE = os.getenv('LOG_TO_FILE', 'true').lower() == 'true'
LOG_FILE_PATH = DATA_DIR / 'attendance.log'

# Application configuration
APP_NAME = "Automated Attendance System"
APP_VERSION = "1.0.0"
DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'

# CORS configuration
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:8080/,http://192.168.0.108:8080/').split(',')

# Face recognition configuration
FACE_RECOGNITION_TOLERANCE = float(os.getenv('FACE_RECOGNITION_TOLERANCE', '0.6'))
FACE_RECOGNITION_MODEL = os.getenv('FACE_RECOGNITION_MODEL', 'hog')

# Offline sync configuration
MAX_OFFLINE_RECORDS_PER_BATCH = int(os.getenv('MAX_OFFLINE_RECORDS_PER_BATCH', '50'))
OFFLINE_SYNC_RETRY_DELAY = int(os.getenv('OFFLINE_SYNC_RETRY_DELAY', '300'))  # 5 minutes

# Notification retry configuration
NOTIFICATION_RETRY_ATTEMPTS = int(os.getenv('NOTIFICATION_RETRY_ATTEMPTS', '3'))
NOTIFICATION_RETRY_DELAY = int(os.getenv('NOTIFICATION_RETRY_DELAY', '60'))  # 1 minute

def get_config_summary():
    """Get a summary of current configuration (without sensitive data)"""
    return {
        'app_name': APP_NAME,
        'version': APP_VERSION,
        'debug': DEBUG,
        'low_light_threshold': LOW_LIGHT_THRESHOLD,
        'histogram_equalization': APPLY_HISTOGRAM_EQUALIZATION,
        'email_enabled': EMAIL_ENABLED,
        'smtp_server': SMTP_SERVER,
        'smtp_port': SMTP_PORT,
        'admin_email': ADMIN_EMAIL,
        'database_type': 'sqlite',
        'log_level': LOG_LEVEL,
        'log_to_file': LOG_TO_FILE,
        'cors_origins': CORS_ORIGINS,
        'face_recognition_tolerance': FACE_RECOGNITION_TOLERANCE,
        'max_offline_records': MAX_OFFLINE_RECORDS_PER_BATCH,
        'notification_retry_attempts': NOTIFICATION_RETRY_ATTEMPTS
    }

def validate_config():
    """Validate configuration and return list of warnings"""
    warnings = []
    
    # Check email configuration
    if EMAIL_ENABLED:
        if SMTP_USERNAME == 'your-email@gmail.com':
            warnings.append("Email is enabled but SMTP username is not configured")
        if SMTP_PASSWORD == 'your-app-password':
            warnings.append("Email is enabled but SMTP password is not configured")
        if ADMIN_EMAIL == 'admin@school.edu':
            warnings.append("Admin email is not configured")
    
    # Check database directory
    if not DATA_DIR.exists():
        warnings.append(f"Data directory does not exist: {DATA_DIR}")
    
    # Check low-light threshold
    if not (0 <= LOW_LIGHT_THRESHOLD <= 255):
        warnings.append(f"Invalid low-light threshold: {LOW_LIGHT_THRESHOLD}. Must be between 0 and 255.")
    
    return warnings
