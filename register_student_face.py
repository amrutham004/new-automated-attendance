#!/usr/bin/env python3
"""
register_student_face.py - Register Student Face via API

This script helps register student faces using the API.
"""

import requests
import base64
import json
from pathlib import Path

def encode_image_to_base64(image_path):
    """Convert image file to base64 string"""
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
        return base64.b64encode(image_data).decode('utf-8')
    except Exception as e:
        print(f"❌ Error reading image: {e}")
        return None

def register_student_face(student_id, student_name, image_path, grade=None):
    """Register a student face via API"""
    
    # Convert image to base64
    base64_image = encode_image_to_base64(image_path)
    if not base64_image:
        return False
    
    # Prepare request data
    data = {
        "studentId": student_id,
        "studentName": student_name,
        "image": base64_image,
        "grade": grade
    }
    
    try:
        # Send request
        response = requests.post(
            "http://127.0.0.1:8000/api/admin/upload-student-photo",
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {result.get('message')}")
            print(f"   Student ID: {result.get('studentId')}")
            print(f"   OpenCV Mode: {result.get('opencv_mode', False)}")
            return True
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def main():
    """Interactive student registration"""
    print("🎓 Student Face Registration")
    print("=" * 40)
    
    # Get student details
    print("\n📝 Enter Student Details:")
    student_id = input("Student ID (e.g., 20221CIT0043): ").strip()
    student_name = input("Student Name (e.g., Amrutha M): ").strip()
    grade = input("Grade (optional, e.g., CIT 2022): ").strip() or None
    
    # Get image path
    print("\n📸 Image Requirements:")
    print("   - Clear front-facing photo")
    print("   - Good lighting")
    print("   - Only one face in image")
    print("   - JPG/PNG format")
    
    image_path = input("Image file path: ").strip()
    
    # Validate image exists
    if not Path(image_path).exists():
        print(f"❌ Image file not found: {image_path}")
        return False
    
    # Register student
    print(f"\n🔄 Registering {student_name} ({student_id})...")
    success = register_student_face(student_id, student_name, image_path, grade)
    
    if success:
        print("\n🎉 Registration successful!")
        print("💡 Next steps:")
        print("   1. Register more students")
        print("   2. Test face recognition")
        print("   3. Check system health")
    else:
        print("\n❌ Registration failed. Please check the error above.")
    
    return success

if __name__ == "__main__":
    main()
