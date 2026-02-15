#!/usr/bin/env python3
"""
Database Persistence Verification Test
Tests that attendance data persists across server restarts
"""

import requests
import base64
import time
import json
from datetime import datetime

class PersistenceTester:
    def __init__(self, base_url: str = "http://127.0.0.1:8000"):
        self.base_url = base_url
        self.test_student_id = "20221CIT0043"
        self.test_student_name = "Amrutha M"
    
    def test_health(self) -> dict:
        """Test if server is running"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Health check failed: {response.status_code}"}
        except Exception as e:
            return {"error": f"Server not accessible: {str(e)}"}
    
    def test_mark_attendance(self) -> dict:
        """Mark attendance for test student"""
        try:
            # Use a simple test image (base64 encoded 1x1 pixel)
            test_image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchHgAhggJ/1wAAABJRU5ErkJggg=="
            
            data = {
                "studentId": self.test_student_id,
                "studentName": self.test_student_name,
                "image": test_image
            }
            
            response = requests.post(
                f"{self.base_url}/api/verify-face",
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "message": "Attendance marked successfully",
                    "result": result
                }
            else:
                return {
                    "success": False,
                    "error": f"API returned {response.status_code}",
                    "details": response.text
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to mark attendance: {str(e)}"
            }
    
    def test_get_attendance(self) -> dict:
        """Get attendance records"""
        try:
            response = requests.get(
                f"{self.base_url}/api/attendance/recent?limit=10",
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "records": result.get("records", []),
                    "count": len(result.get("records", []))
                }
            else:
                return {
                    "success": False,
                    "error": f"API returned {response.status_code}",
                    "details": response.text
                }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get attendance: {str(e)}"
            }
    
    def test_database_file_exists(self) -> dict:
        """Check if database file exists"""
        import os
        from pathlib import Path
        
        db_path = Path(__file__).parent / "data" / "attendance.db"
        
        return {
            "exists": db_path.exists(),
            "path": str(db_path.absolute()),
            "size": db_path.stat().st_size if db_path.exists() else 0
        }
    
    def run_persistence_test(self) -> dict:
        """Run complete persistence test"""
        print("🔍 DATABASE PERSISTENCE VERIFICATION TEST")
        print("=" * 60)
        
        results = {
            "test_start": datetime.now().isoformat(),
            "steps": []
        }
        
        # Step 1: Check server health
        print("\n📋 Step 1: Checking server health...")
        health = self.test_health()
        results["steps"].append({
            "step": "health_check",
            "success": "error" not in health,
            "details": health
        })
        
        if "error" in health:
            print(f"❌ Server health check failed: {health['error']}")
            return results
        
        print("✅ Server is healthy")
        
        # Step 2: Check database file exists
        print("\n📋 Step 2: Checking database file...")
        db_check = self.test_database_file_exists()
        results["steps"].append({
            "step": "database_file_check",
            "success": db_check["exists"],
            "details": db_check
        })
        
        if not db_check["exists"]:
            print(f"❌ Database file not found: {db_check['path']}")
            return results
        
        print(f"✅ Database file exists: {db_check['path']} ({db_check['size']} bytes)")
        
        # Step 3: Mark attendance
        print("\n📋 Step 3: Marking attendance...")
        attendance_result = self.test_mark_attendance()
        results["steps"].append({
            "step": "mark_attendance",
            "success": attendance_result["success"],
            "details": attendance_result
        })
        
        if not attendance_result["success"]:
            print(f"❌ Failed to mark attendance: {attendance_result['error']}")
            return results
        
        print("✅ Attendance marked successfully")
        
        # Step 4: Verify attendance record exists
        print("\n📋 Step 4: Verifying attendance record...")
        get_result = self.test_get_attendance()
        results["steps"].append({
            "step": "verify_attendance",
            "success": get_result["success"],
            "details": get_result
        })
        
        if not get_result["success"]:
            print(f"❌ Failed to get attendance: {get_result['error']}")
            return results
        
        if get_result["count"] == 0:
            print("❌ No attendance records found after marking")
            return results
        
        print(f"✅ Found {get_result['count']} attendance records")
        
        # Step 5: Check for our test record
        test_record_found = False
        for record in get_result["records"]:
            if (record.get("studentId") == self.test_student_id and 
                record.get("studentName") == self.test_student_name):
                test_record_found = True
                print(f"✅ Test record found: {record}")
                break
        
        if not test_record_found:
            print("❌ Test attendance record not found in results")
            results["steps"].append({
                "step": "test_record_verification",
                "success": False,
                "details": "Test attendance record not found"
            })
            return results
        
        results["test_complete"] = True
        results["test_end"] = datetime.now().isoformat()
        
        return results
    
    def print_results(self, results: dict):
        """Print test results"""
        print("\n" + "=" * 60)
        print("🔍 PERSISTENCE TEST RESULTS")
        print("=" * 60)
        
        all_passed = True
        for step in results["steps"]:
            status_icon = "✅" if step["success"] else "❌"
            print(f"{status_icon} Step: {step['step']}")
            if not step["success"]:
                all_passed = False
                print(f"   Error: {step.get('details', 'Unknown error')}")
        
        print("\n" + "=" * 60)
        if all_passed:
            print("🎉 ALL TESTS PASSED - Database persistence is working!")
            print("✅ Data will survive server restarts")
        else:
            print("❌ SOME TESTS FAILED - Database persistence has issues")
            print("⚠️  Data may be lost on server restart")
        
        print("=" * 60)
        
        # Save results to file
        with open("persistence_test_results.json", "w") as f:
            json.dump(results, f, indent=2)
        
        print(f"\n💾 Detailed results saved to: persistence_test_results.json")

def main():
    """Main function"""
    print("🚀 Starting Database Persistence Test")
    print("Make sure the backend server is running on http://127.0.0.1:8000")
    print("This test will verify that attendance data persists across restarts\n")
    
    tester = PersistenceTester()
    results = tester.run_persistence_test()
    tester.print_results(results)
    
    # Instructions for restart test
    if results.get("test_complete"):
        print("\n" + "=" * 60)
        print("🔄 RESTART TEST INSTRUCTIONS:")
        print("=" * 60)
        print("1. Stop the backend server completely")
        print("2. Restart the backend server")
        print("3. Run this test again")
        print("4. The same attendance record should still exist")
        print("5. If it exists, persistence is working!")
        print("=" * 60)

if __name__ == "__main__":
    main()
