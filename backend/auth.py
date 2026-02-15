"""
Authentication and Authorization System
"""
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, List
from pydantic import BaseModel
import sqlite3
import os
from enum import Enum

# Security configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
JWT_SECRET = os.getenv("JWT_SECRET", "your-jwt-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

class UserRole(str, Enum):
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"

class User(BaseModel):
    user_id: str
    email: str
    password_hash: str
    role: UserRole
    is_active: bool = True
    created_at: datetime

class LoginCredentials(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_role: str
    user_id: str

class AuthManager:
    def __init__(self, db_path: str = "backend/data/users.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize user database"""
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL,
                    is_active BOOLEAN DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            conn.execute('''
                CREATE TABLE IF NOT EXISTS user_sessions (
                    session_id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    token TEXT NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            conn.commit()
    
    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def create_user(self, user_id: str, email: str, password: str, role: UserRole) -> bool:
        """Create new user"""
        try:
            password_hash = self.hash_password(password)
            
            with sqlite3.connect(self.db_path) as conn:
                conn.execute('''
                    INSERT INTO users (user_id, email, password_hash, role)
                    VALUES (?, ?, ?, ?)
                ''', (user_id, email, password_hash, role.value))
                conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate user credentials"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute('''
                SELECT * FROM users WHERE email = ? AND is_active = 1
            ''', (email,))
            user_data = cursor.fetchone()
            
            if user_data and self.verify_password(password, user_data['password_hash']):
                return User(
                    user_id=user_data['user_id'],
                    email=user_data['email'],
                    password_hash=user_data['password_hash'],
                    role=UserRole(user_data['role']),
                    is_active=bool(user_data['is_active']),
                    created_at=user_data['created_at']
                )
        return None
    
    def create_access_token(self, user: User) -> str:
        """Create JWT access token"""
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": user.email,
            "user_id": user.user_id,
            "role": user.role.value,
            "exp": expire
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
            return payload
        except jwt.PyJWTError:
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute('''
                SELECT * FROM users WHERE user_id = ? AND is_active = 1
            ''', (user_id,))
            user_data = cursor.fetchone()
            
            if user_data:
                return User(
                    user_id=user_data['user_id'],
                    email=user_data['email'],
                    password_hash=user_data['password_hash'],
                    role=UserRole(user_data['role']),
                    is_active=bool(user_data['is_active']),
                    created_at=user_data['created_at']
                )
        return None

# Global auth manager instance
auth_manager = AuthManager()

# Create default admin user
def create_default_admin():
    """Create default admin user if not exists"""
    if not auth_manager.get_user_by_id("admin"):
        auth_manager.create_user(
            user_id="admin",
            email="admin@school.edu",
            password="admin123",  # Change this in production!
            role=UserRole.ADMIN
        )
        print("Default admin user created: admin@school.edu / admin123")

# Initialize default admin
create_default_admin()
