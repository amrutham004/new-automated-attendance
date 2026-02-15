#!/usr/bin/env python3
"""
setup_opencv_face_recognition.py - Setup and Test OpenCV Face Recognition

This script helps install the required dependencies and test the OpenCV face recognition system.
"""

import subprocess
import sys
import requests
import json
import time
from pathlib import Path

def print_header(title):
    print("\n" + "="*60)
    print(f"🔧 {title}")
    print("="*60)

def run_command(command, check=True):
    """Run a command and return the result"""
    print(f"📝 Running: {command}")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, check=check)
        if result.stdout:
            print(result.stdout)
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"❌ Error: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return False

def check_python_packages():
    """Check if required Python packages are installed"""
    print_header("Checking Python Packages")
    
    required_packages = [
        'opencv-python',
        'opencv-contrib-python',  # For face recognition module
        'numpy',
        'fastapi',
        'uvicorn',
        'python-multipart'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            if package == 'opencv-contrib-python':
                import cv2
                # Check if face module is available
                if hasattr(cv2, 'face'):
                    print(f"✅ {package} - Face module available")
                else:
                    print(f"⚠️  {package} - Face module not available")
                    missing_packages.append(package)
            else:
                __import__(package.replace('-', '_'))
                print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - NOT INSTALLED")
            missing_packages.append(package)
    
    return missing_packages

def install_packages(packages):
    """Install missing packages"""
    if not packages:
        print("✅ All packages are already installed")
        return True
    
    print_header("Installing Missing Packages")
    
    for package in packages:
        print(f"📦 Installing {package}...")
        if run_command(f"pip install {package}"):
            print(f"✅ {package} installed successfully")
        else:
            print(f"❌ Failed to install {package}")
            return False
    
    return True

def test_opencv_import():
    """Test OpenCV import and face recognition module"""
    print_header("Testing OpenCV Import")
    
    try:
        import cv2
        print(f"✅ OpenCV version: {cv2.__version__}")
        
        # Check face module
        if hasattr(cv2, 'face'):
            print("✅ OpenCV face module available")
            
            # Test LBPH recognizer
            try:
                recognizer = cv2.face.LBPHFaceRecognizer_create()
                print("✅ LBPH Face Recognizer created successfully")
                return True
            except Exception as e:
                print(f"❌ Failed to create LBPH recognizer: {e}")
                return False
        else:
            print("❌ OpenCV face module not available")
            print("💡 Install opencv-contrib-python: pip install opencv-contrib-python")
            return False
            
    except ImportError as e:
        print(f"❌ Failed to import OpenCV: {e}")
        return False

def start_backend():
    """Start the backend server"""
    print_header("Starting Backend Server")
    
    # Check if backend directory exists
    backend_dir = Path("backend")
    if not backend_dir.exists():
        print("❌ Backend directory not found")
        return False
    
    # Change to backend directory
    import os
    original_dir = os.getcwd()
    os.chdir(backend_dir)
    
    try:
        # Start the server in background
        import subprocess
        import threading
        
        def run_server():
            subprocess.run([sys.executable, "app.py"], capture_output=True)
        
        server_thread = threading.Thread(target=run_server, daemon=True)
        server_thread.start()
        
        # Wait for server to start
        print("⏳ Waiting for server to start...")
        time.sleep(5)
        
        # Test health endpoint
        try:
            response = requests.get("http://localhost:8000/api/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                print("✅ Backend server is running")
                print(f"📊 Status: {data.get('status')}")
                print(f"🔧 Face Recognition: {data.get('active_recognition_system')}")
                if data.get('opencv_stats'):
                    stats = data['opencv_stats']
                    print(f"👥 Registered Students: {stats.get('registered_students', 0)}")
                    print(f"📸 Total Samples: {stats.get('total_samples', 0)}")
                return True
            else:
                print(f"❌ Server responded with status: {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Failed to connect to server: {e}")
            return False
            
    finally:
        os.chdir(original_dir)

def test_face_registration():
    """Test face registration with a sample image"""
    print_header("Testing Face Registration")
    
    # This would require a sample image - for now, just test the endpoint
    print("💡 To test face registration:")
    print("   1. Go to http://localhost:8000/docs")
    print("   2. Use the POST /api/admin/upload-student-photo endpoint")
    print("   3. Upload a student photo with studentId and studentName")
    print("   4. Check if registration is successful")
    
    return True

def main():
    """Main setup function"""
    print_header("OpenCV Face Recognition Setup")
    
    # Step 1: Check packages
    missing_packages = check_python_packages()
    
    # Step 2: Install missing packages
    if not install_packages(missing_packages):
        print("❌ Failed to install required packages")
        return False
    
    # Step 3: Test OpenCV import
    if not test_opencv_import():
        print("❌ OpenCV setup failed")
        return False
    
    # Step 4: Start backend
    if not start_backend():
        print("❌ Failed to start backend")
        return False
    
    # Step 5: Test face registration
    test_face_registration()
    
    print_header("Setup Complete!")
    print("✅ OpenCV Face Recognition is ready!")
    print("📚 API Documentation: http://localhost:8000/docs")
    print("🔍 Health Check: http://localhost:8000/api/health")
    print("\n💡 Next Steps:")
    print("   1. Register student faces using the API")
    print("   2. Test face recognition with the /api/verify-face endpoint")
    print("   3. Check logs for face recognition events")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
