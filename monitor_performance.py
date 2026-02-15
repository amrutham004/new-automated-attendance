#!/usr/bin/env python3
"""
monitor_performance.py - Monitor System Performance

This script monitors the face recognition system performance and health.
"""

import requests
import time
import json
from datetime import datetime

def get_system_health():
    """Get system health status"""
    try:
        response = requests.get("http://127.0.0.1:8000/api/health", timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check error: {e}")
        return None

def get_recent_logs(limit=10):
    """Get recent system logs"""
    try:
        response = requests.get(f"http://127.0.0.1:8000/api/logs/recent?limit={limit}", timeout=10)
        if response.status_code == 200:
            return response.json().get('logs', [])
        else:
            print(f"❌ Log retrieval failed: {response.status_code}")
            return []
    except requests.exceptions.RequestException as e:
        print(f"❌ Log retrieval error: {e}")
        return []

def get_system_stats():
    """Get detailed system statistics"""
    try:
        response = requests.get("http://127.0.0.1:8000/api/stats", timeout=10)
        if response.status_code == 200:
            return response.json()
        else:
            print(f"❌ Stats retrieval failed: {response.status_code}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"❌ Stats retrieval error: {e}")
        return None

def display_health_status():
    """Display system health status"""
    print("🏥 System Health Status")
    print("=" * 50)
    
    health = get_system_health()
    if not health:
        print("❌ Unable to get health status")
        return False
    
    print(f"📊 Status: {health.get('status', 'Unknown')}")
    print(f"🕐 Timestamp: {health.get('timestamp', 'Unknown')}")
    print(f"👥 Registered Students: {health.get('registered_students', 0)}")
    print(f"🔧 Face Recognition: {health.get('active_recognition_system', 'Unknown')}")
    print(f"📸 OpenCV Available: {health.get('opencv_face_recognition_available', False)}")
    
    # Show OpenCV stats if available
    opencv_stats = health.get('opencv_stats', {})
    if opencv_stats:
        print(f"📈 OpenCV Stats:")
        print(f"   - Registered Students: {opencv_stats.get('registered_students', 0)}")
        print(f"   - Total Samples: {opencv_stats.get('total_samples', 0)}")
        print(f"   - Model Trained: {opencv_stats.get('model_trained', False)}")
    
    return True

def display_recent_logs():
    """Display recent system logs"""
    print("\n📋 Recent System Logs")
    print("=" * 50)
    
    logs = get_recent_logs(10)
    if not logs:
        print("📝 No recent logs found")
        return
    
    for log in logs:
        timestamp = log.get('timestamp', 'Unknown')
        event_type = log.get('event_type', 'Unknown')
        message = log.get('message', 'No message')
        level = log.get('level', 'INFO')
        
        # Color code by level
        if level == 'ERROR':
            prefix = "🔴"
        elif level == 'WARNING':
            prefix = "🟡"
        else:
            prefix = "🟢"
        
        print(f"{prefix} {timestamp} [{event_type}] {message}")

def display_performance_metrics():
    """Display performance metrics"""
    print("\n📈 Performance Metrics")
    print("=" * 50)
    
    # Test API response time
    print("🚀 Testing API Response Times...")
    
    endpoints = [
        ("Health Check", "/api/health"),
        ("Students List", "/api/students"),
        ("Recent Logs", "/api/logs/recent?limit=5")
    ]
    
    for name, endpoint in endpoints:
        start_time = time.time()
        try:
            response = requests.get(f"http://127.0.0.1:8000{endpoint}", timeout=10)
            end_time = time.time()
            response_time = (end_time - start_time) * 1000  # Convert to milliseconds
            
            status = "✅" if response.status_code == 200 else "❌"
            print(f"{status} {name}: {response_time:.0f}ms (Status: {response.status_code})")
        except requests.exceptions.RequestException as e:
            print(f"❌ {name}: Failed ({e})")

def monitor_continuous():
    """Continuous monitoring mode"""
    print("🔄 Continuous Monitoring Mode")
    print("=" * 50)
    print("Press Ctrl+C to stop monitoring")
    
    try:
        while True:
            print(f"\n🕐 Monitoring at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Quick health check
            health = get_system_health()
            if health:
                status = health.get('status', 'Unknown')
                students = health.get('registered_students', 0)
                system = health.get('active_recognition_system', 'Unknown')
                print(f"📊 Status: {status} | Students: {students} | System: {system}")
            else:
                print("❌ System unavailable")
            
            # Wait before next check
            time.sleep(30)
            
    except KeyboardInterrupt:
        print("\n👋 Monitoring stopped")

def main():
    """Main monitoring interface"""
    print("🔍 Face Recognition System Monitor")
    print("=" * 50)
    
    while True:
        print("\n📋 Monitoring Options:")
        print("1. 🏥 Health Status")
        print("2. 📋 Recent Logs")
        print("3. 📈 Performance Metrics")
        print("4. 🔄 Continuous Monitoring")
        print("5. 🚪 Exit")
        
        choice = input("\nSelect option (1-5): ").strip()
        
        if choice == "1":
            display_health_status()
        elif choice == "2":
            display_recent_logs()
        elif choice == "3":
            display_performance_metrics()
        elif choice == "4":
            monitor_continuous()
        elif choice == "5":
            print("👋 Goodbye!")
            break
        else:
            print("❌ Invalid option. Please try again.")

if __name__ == "__main__":
    main()
