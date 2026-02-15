#!/usr/bin/env python3
"""
test_face_recognition.py - Test Face Recognition

This script tests the face recognition system with uploaded photos.
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

def verify_face(student_id, student_name, image_path):
    """Test face recognition for a student"""
    
    # Convert image to base64
    base64_image = encode_image_to_base64(image_path)
    if not base64_image:
        return False
    
    # Prepare request data
    data = {
        "studentId": student_id,
        "studentName": student_name,
        "image": base64_image
    }
    
    try:
        # Send request
        response = requests.post(
            "http://127.0.0.1:8000/api/verify-face",
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Verification completed")
            print(f"   Success: {result.get('success', False)}")
            print(f"   Verified: {result.get('verified', False)}")
            print(f"   Message: {result.get('message', 'N/A')}")
            
            if 'confidenceScore' in result:
                print(f"   Confidence: {result['confidenceScore']:.1f}%")
            
            if 'studentId' in result:
                print(f"   Recognized Student: {result['studentId']}")
            
            return result.get('verified', False)
        else:
            print(f"❌ Verification failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return False

def get_registered_students():
    """Get list of registered students"""
    try:
        response = requests.get("http://127.0.0.1:8000/api/students", timeout=10)
        if response.status_code == 200:
            students = response.json()
            return students
        else:
            print(f"❌ Failed to get students: {response.status_code}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
        return []

def main():
    """Interactive face recognition test"""
    print("👤 Face Recognition Test")
    print("=" * 40)
    
    # Show registered students
    print("\n📋 Registered Students:")
    students = get_registered_students()
    
    if not students:
        print("   No students registered yet.")
        print("   💡 First register students using register_student_face.py")
        return False
    
    for i, student in enumerate(students, 1):
        print(f"   {i}. {student['name']} ({student['id']}) - Grade: {student.get('grade', 'N/A')}")
    
    # Get student to test
    print("\n🎯 Select Student to Test:")
    try:
        choice = input("Enter student number (or 0 for custom ID): ").strip()
        
        if choice == "0":
            student_id = input("Enter Student ID: ").strip()
            student_name = input("Enter Student Name: ").strip()
        else:
            choice_idx = int(choice) - 1
            if 0 <= choice_idx < len(students):
                student = students[choice_idx]
                student_id = student['id']
                student_name = student['name']
            else:
                print("❌ Invalid selection")
                return False
    except ValueError:
        print("❌ Invalid input")
        return False
    
    # Get image path
    print(f"\n📸 Testing face recognition for {student_name} ({student_id})")
    print("   Image Requirements:")
    print("   - Clear front-facing photo")
    print("   - Good lighting")
    print("   - Same person as registered")
    
    image_path = input("Image file path: ").strip()
    
    # Validate image exists
    if not Path(image_path).exists():
        print(f"❌ Image file not found: {image_path}")
        return False
    
    # Test face recognition
    print(f"\n🔄 Testing face recognition...")
    success = verify_face(student_id, student_name, image_path)
    
    if success:
        print("\n🎉 Face recognition successful!")
        print("✅ The system correctly identified the student.")
    else:
        print("\n⚠️ Face recognition failed or confidence too low.")
        print("💡 Possible reasons:")
        print("   - Different lighting conditions")
        print("   - Different angle or expression")
        print("   - Low confidence threshold")
        print("   - Different person in photo")
    
    return success

if __name__ == "__main__":
    main()
