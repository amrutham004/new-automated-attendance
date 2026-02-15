#!/usr/bin/env python3
"""
test_opencv_face_recognition.py - Quick Test for OpenCV Face Recognition

This script tests if the OpenCV face recognition system is working properly.
"""

import requests
import json
import time
import sys

def test_health():
    """Test the health endpoint"""
    print("🔍 Testing Backend Health...")
    try:
        response = requests.get("http://localhost:8000/api/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print("✅ Backend is running")
            print(f"   Status: {data.get('status')}")
            print(f"   Face Recognition System: {data.get('active_recognition_system')}")
            print(f"   OpenCV Available: {data.get('opencv_face_recognition_available')}")
            if data.get('opencv_stats'):
                stats = data['opencv_stats']
                print(f"   Registered Students: {stats.get('registered_students', 0)}")
                print(f"   Total Samples: {stats.get('total_samples', 0)}")
                print(f"   Model Trained: {stats.get('model_trained', False)}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False

def test_student_registration():
    """Test student face registration"""
    print("\n🧪 Testing Student Registration...")
    
    # Test data (you would replace this with actual image data)
    test_student = {
        "studentId": "TEST001",
        "studentName": "Test Student",
        "image": "/9j/4AAQSkZJRgABAQEAYABgAD/8QAFhABAwEAAAAAAAAAAAAIAAAAAAAA/4AAAABgBU"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/admin/upload-student-photo",
            json=test_student,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Registration endpoint responding")
            print(f"   Message: {data.get('message')}")
            print(f"   OpenCV Mode: {data.get('opencv_mode', False)}")
            return True
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Registration request failed: {e}")
        return False

def test_face_verification():
    """Test face verification"""
    print("\n👤 Testing Face Verification...")
    
    # Test data
    test_verification = {
        "studentId": "TEST001",
        "studentName": "Test Student",
        "image": "/9j/4AAQSkZJRgABAQEAYABgAD/8QAFhABAwEAAAAAAAAAAAAIAAAAAAAA/4AAAABgBU"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/verify-face",
            json=test_verification,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Verification endpoint responding")
            print(f"   Verified: {data.get('verified', False)}")
            print(f"   Message: {data.get('message')}")
            if 'confidenceScore' in data:
                print(f"   Confidence: {data['confidenceScore']}")
            return True
        else:
            print(f"❌ Verification failed: {response.status_code}")
            print(f"   Error: {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Verification request failed: {e}")
        return False

def test_logs():
    """Test log retrieval"""
    print("\n📊 Testing Log Access...")
    
    try:
        response = requests.get(
            "http://localhost:8000/api/logs/recent?limit=5",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            logs = data.get('logs', [])
            print(f"✅ Retrieved {len(logs)} log entries")
            for log in logs[:3]:  # Show first 3
                print(f"   {log['timestamp']}: {log['event_type']} - {log['message']}")
            return True
        else:
            print(f"❌ Log access failed: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Log request failed: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 OpenCV Face Recognition Test Suite")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health),
        ("Student Registration", test_student_registration),
        ("Face Verification", test_face_verification),
        ("Log Access", test_logs)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🔍 Running: {test_name}")
        result = test_func()
        results.append((test_name, result))
        time.sleep(1)  # Small delay between tests
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 TEST RESULTS SUMMARY")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
        if result:
            passed += 1
    
    print(f"\n📊 Overall: {passed}/{len(tests)} tests passed")
    
    if passed == len(tests):
        print("🎉 All tests passed! OpenCV Face Recognition is working!")
        print("\n💡 Next Steps:")
        print("   1. Register real student faces")
        print("   2. Test with actual photos")
        print("   3. Adjust confidence threshold if needed")
    else:
        print("⚠️  Some tests failed. Check the errors above.")
    
    return passed == len(tests)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
