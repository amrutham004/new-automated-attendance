#!/usr/bin/env python3
"""
Security Testing Script for Automated Attendance System
Tests various security measures and configurations
"""

import requests
import base64
import time
import json
from typing import Dict, List

class SecurityTester:
    def __init__(self, base_url: str = "http://127.0.0.1:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.auth_token = None
        
    def test_authentication_security(self) -> Dict:
        """Test authentication security measures"""
        print("🔐 Testing Authentication Security...")
        results = {}
        
        # Test 1: Brute force protection
        print("  📍 Testing brute force protection...")
        results["brute_force"] = self._test_brute_force_protection()
        
        # Test 2: Invalid token handling
        print("  📍 Testing invalid token handling...")
        results["invalid_token"] = self._test_invalid_token()
        
        # Test 3: Password requirements
        print("  📍 Testing password requirements...")
        results["password_requirements"] = self._test_password_requirements()
        
        return results
    
    def test_input_validation(self) -> Dict:
        """Test input validation security"""
        print("🛡️ Testing Input Validation...")
        results = {}
        
        # Test 1: SQL injection attempts
        print("  📍 Testing SQL injection protection...")
        results["sql_injection"] = self._test_sql_injection()
        
        # Test 2: XSS attempts
        print("  📍 Testing XSS protection...")
        results["xss_protection"] = self._test_xss_protection()
        
        # Test 3: Invalid student ID format
        print("  📍 Testing student ID validation...")
        results["student_id_validation"] = self._test_student_id_validation()
        
        return results
    
    def test_rate_limiting(self) -> Dict:
        """Test rate limiting security"""
        print("⚡ Testing Rate Limiting...")
        results = {}
        
        # Test 1: Login rate limiting
        print("  📍 Testing login rate limiting...")
        results["login_rate_limit"] = self._test_login_rate_limit()
        
        # Test 2: Face verification rate limiting
        print("  📍 Testing face verification rate limiting...")
        results["face_verify_rate_limit"] = self._test_face_verify_rate_limit()
        
        return results
    
    def test_api_security(self) -> Dict:
        """Test API security measures"""
        print("🔒 Testing API Security...")
        results = {}
        
        # Test 1: Unauthorized access
        print("  📍 Testing unauthorized access...")
        results["unauthorized_access"] = self._test_unauthorized_access()
        
        # Test 2: Security headers
        print("  📍 Testing security headers...")
        results["security_headers"] = self._test_security_headers()
        
        # Test 3: CORS configuration
        print("  📍 Testing CORS configuration...")
        results["cors_config"] = self._test_cors_config()
        
        return results
    
    def _test_brute_force_protection(self) -> Dict:
        """Test brute force protection"""
        results = {"status": "pending", "details": []}
        
        try:
            # Attempt multiple failed logins
            for i in range(6):  # More than the limit
                response = self.session.post(
                    f"{self.base_url}/api/auth/login",
                    json={
                        "email": "test@example.com",
                        "password": "wrongpassword"
                    }
                )
                results["details"].append(f"Attempt {i+1}: {response.status_code}")
                
                if response.status_code == 429:
                    results["status"] = "passed"
                    results["message"] = "Brute force protection activated"
                    break
            else:
                results["status"] = "failed"
                results["message"] = "Brute force protection not working"
                
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def _test_invalid_token(self) -> Dict:
        """Test invalid token handling"""
        results = {"status": "pending", "details": []}
        
        try:
            # Test with invalid token
            response = self.session.get(
                f"{self.base_url}/api/auth/me",
                headers={"Authorization": "Bearer invalid_token_12345"}
            )
            
            if response.status_code == 401:
                results["status"] = "passed"
                results["message"] = "Invalid token properly rejected"
            else:
                results["status"] = "failed"
                results["message"] = f"Expected 401, got {response.status_code}"
                
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def _test_password_requirements(self) -> Dict:
        """Test password requirements"""
        results = {"status": "pending", "details": []}
        
        try:
            # Test weak passwords
            weak_passwords = [
                "123",  # Too short
                "password",  # No uppercase, numbers, special chars
                "PASSWORD",  # No lowercase, numbers, special chars
                "12345678",  # No uppercase, lowercase, special chars
            ]
            
            for password in weak_passwords:
                response = self.session.post(
                    f"{self.base_url}/api/auth/register",
                    json={
                        "user_id": "test_user",
                        "email": "test@example.com",
                        "password": password,
                        "role": "student"
                    }
                )
                
                results["details"].append(f"Password '{password}': {response.status_code}")
                
                if response.status_code == 400:
                    results["status"] = "passed"
                else:
                    results["status"] = "failed"
                    break
            
            if results["status"] == "pending":
                results["status"] = "passed"
                results["message"] = "Password requirements enforced"
                
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def _test_sql_injection(self) -> Dict:
        """Test SQL injection protection"""
        results = {"status": "pending", "details": []}
        
        try:
            # Test SQL injection payloads
            sql_payloads = [
                "'; DROP TABLE students; --",
                "' OR '1'='1",
                "1' UNION SELECT * FROM users --",
                "'; INSERT INTO users VALUES ('hacker', 'hacker@evil.com', 'password'); --"
            ]
            
            for payload in sql_payloads:
                response = self.session.post(
                    f"{self.base_url}/api/verify-face",
                    json={
                        "studentId": payload,
                        "studentName": "Test Student",
                        "image": "aW52YWxpZCBpbWFnZSBkYXRh"  # Invalid base64
                    }
                )
                
                results["details"].append(f"Payload '{payload[:20]}...': {response.status_code}")
                
                # Should reject invalid input
                if response.status_code in [400, 422]:
                    results["status"] = "passed"
                else:
                    results["status"] = "failed"
                    break
            
            if results["status"] == "pending":
                results["status"] = "passed"
                results["message"] = "SQL injection protection working"
                
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def _test_xss_protection(self) -> Dict:
        """Test XSS protection"""
        results = {"status": "pending", "details": []}
        
        try:
            # Test XSS payloads
            xss_payloads = [
                "<script>alert('xss')</script>",
                "javascript:alert('xss')",
                "<img src=x onerror=alert('xss')>",
                "';alert('xss');//"
            ]
            
            for payload in xss_payloads:
                response = self.session.post(
                    f"{self.base_url}/api/verify-face",
                    json={
                        "studentId": "20221CIT0043",
                        "studentName": payload,
                        "image": "aW52YWxpZCBpbWFnZSBkYXRh"  # Invalid base64
                    }
                )
                
                results["details"].append(f"Payload '{payload[:20]}...': {response.status_code}")
                
                # Should sanitize or reject
                if response.status_code in [400, 422]:
                    results["status"] = "passed"
                else:
                    results["status"] = "failed"
                    break
            
            if results["status"] == "pending":
                results["status"] = "passed"
                results["message"] = "XSS protection working"
                
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def _test_student_id_validation(self) -> Dict:
        """Test student ID validation"""
        results = {"status": "pending", "details": []}
        
        try:
            # Test invalid student ID formats
            invalid_ids = [
                "123",  # Too short
                "ABCD1234",  # Wrong format
                "20221CIT",  # Missing numbers
                "20221CIT004",  # Too short
                "20221CIT00433",  # Too long
                "2022CIT0043",  # Missing digit
            ]
            
            for student_id in invalid_ids:
                response = self.session.post(
                    f"{self.base_url}/api/verify-face",
                    json={
                        "studentId": student_id,
                        "studentName": "Test Student",
                        "image": "aW52YWxpZCBpbWFnZSBkYXRh"  # Invalid base64
                    }
                )
                
                results["details"].append(f"ID '{student_id}': {response.status_code}")
                
                # Should reject invalid format
                if response.status_code in [400, 422]:
                    results["status"] = "passed"
                else:
                    results["status"] = "failed"
                    break
            
            if results["status"] == "pending":
                results["status"] = "passed"
                results["message"] = "Student ID validation working"
                
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def _test_login_rate_limit(self) -> Dict:
        """Test login rate limiting"""
        results = {"status": "pending", "details": []}
        
        try:
            # Make rapid login attempts
            for i in range(6):  # More than typical rate limit
                response = self.session.post(
                    f"{self.base_url}/api/auth/login",
                    json={
                        "email": f"test{i}@example.com",
                        "password": "password123"
                    }
                )
                results["details"].append(f"Attempt {i+1}: {response.status_code}")
                
                if response.status_code == 429:
                    results["status"] = "passed"
                    results["message"] = "Login rate limiting working"
                    break
            else:
                results["status"] = "failed"
                results["message"] = "Login rate limiting not working"
                
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def _test_face_verify_rate_limit(self) -> Dict:
        """Test face verification rate limiting"""
        results = {"status": "pending", "details": []}
        
        try:
            # Make rapid face verification attempts
            for i in range(12):  # More than typical rate limit
                response = self.session.post(
                    f"{self.base_url}/api/verify-face",
                    json={
                        "studentId": "20221CIT0043",
                        "studentName": "Test Student",
                        "image": "aW52YWxpZCBpbWFnZSBkYXRh"  # Invalid base64
                    }
                )
                results["details"].append(f"Attempt {i+1}: {response.status_code}")
                
                if response.status_code == 429:
                    results["status"] = "passed"
                    results["message"] = "Face verification rate limiting working"
                    break
            else:
                results["status"] = "failed"
                results["message"] = "Face verification rate limiting not working"
                
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def _test_unauthorized_access(self) -> Dict:
        """Test unauthorized access protection"""
        results = {"status": "pending", "details": []}
        
        try:
            # Test accessing protected endpoints without token
            protected_endpoints = [
                "/api/auth/me",
                "/api/admin/upload-student-photo",
            ]
            
            for endpoint in protected_endpoints:
                response = self.session.get(f"{self.base_url}{endpoint}")
                results["details"].append(f"Endpoint '{endpoint}': {response.status_code}")
                
                if response.status_code == 401:
                    results["status"] = "passed"
                else:
                    results["status"] = "failed"
                    break
            
            if results["status"] == "pending":
                results["status"] = "passed"
                results["message"] = "Unauthorized access protection working"
                
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def _test_security_headers(self) -> Dict:
        """Test security headers"""
        results = {"status": "pending", "details": []}
        
        try:
            response = self.session.get(f"{self.base_url}/")
            
            required_headers = [
                "X-Content-Type-Options",
                "X-Frame-Options",
                "X-XSS-Protection",
                "Referrer-Policy"
            ]
            
            missing_headers = []
            for header in required_headers:
                if header not in response.headers:
                    missing_headers.append(header)
            
            if missing_headers:
                results["status"] = "failed"
                results["message"] = f"Missing security headers: {missing_headers}"
            else:
                results["status"] = "passed"
                results["message"] = "All security headers present"
            
            results["details"] = dict(response.headers)
            
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def _test_cors_config(self) -> Dict:
        """Test CORS configuration"""
        results = {"status": "pending", "details": []}
        
        try:
            # Test CORS preflight request
            response = self.session.options(
                f"{self.base_url}/api/verify-face",
                headers={
                    "Origin": "https://evil-site.com",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type"
                }
            )
            
            # Check if evil origin is allowed
            if "Access-Control-Allow-Origin" in response.headers:
                allowed_origin = response.headers["Access-Control-Allow-Origin"]
                if "evil-site.com" in allowed_origin:
                    results["status"] = "failed"
                    results["message"] = "CORS allows unauthorized origins"
                else:
                    results["status"] = "passed"
                    results["message"] = "CORS properly configured"
            else:
                results["status"] = "passed"
                results["message"] = "CORS not allowing unauthorized origins"
            
            results["details"] = dict(response.headers)
            
        except Exception as e:
            results["status"] = "error"
            results["message"] = str(e)
        
        return results
    
    def run_all_tests(self) -> Dict:
        """Run all security tests"""
        print("🔒 Running Comprehensive Security Tests")
        print("=" * 50)
        
        all_results = {}
        
        # Run all test categories
        all_results["authentication"] = self.test_authentication_security()
        all_results["input_validation"] = self.test_input_validation()
        all_results["rate_limiting"] = self.test_rate_limiting()
        all_results["api_security"] = self.test_api_security()
        
        # Generate summary
        total_tests = 0
        passed_tests = 0
        failed_tests = 0
        error_tests = 0
        
        for category, tests in all_results.items():
            for test_name, result in tests.items():
                if isinstance(result, dict) and "status" in result:
                    total_tests += 1
                    if result["status"] == "passed":
                        passed_tests += 1
                    elif result["status"] == "failed":
                        failed_tests += 1
                    elif result["status"] == "error":
                        error_tests += 1
        
        summary = {
            "total_tests": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "errors": error_tests,
            "security_score": (passed_tests / total_tests * 100) if total_tests > 0 else 0
        }
        
        return {
            "summary": summary,
            "results": all_results
        }
    
    def print_results(self, results: Dict):
        """Print test results in a readable format"""
        print("\n" + "=" * 60)
        print("🔒 SECURITY TEST RESULTS")
        print("=" * 60)
        
        # Print summary
        summary = results["summary"]
        print(f"📊 Summary:")
        print(f"   Total Tests: {summary['total_tests']}")
        print(f"   ✅ Passed: {summary['passed']}")
        print(f"   ❌ Failed: {summary['failed']}")
        print(f"   ⚠️ Errors: {summary['errors']}")
        print(f"   🎯 Security Score: {summary['security_score']:.1f}%")
        
        # Print detailed results
        print(f"\n📋 Detailed Results:")
        for category, tests in results["results"].items():
            print(f"\n🔸 {category.upper()}:")
            for test_name, result in tests.items():
                status_icon = {
                    "passed": "✅",
                    "failed": "❌",
                    "error": "⚠️",
                    "pending": "⏳"
                }.get(result.get("status", "pending"), "❓")
                
                print(f"   {status_icon} {test_name}: {result.get('message', 'No message')}")
                
                if result.get("details") and len(str(result["details"])) < 200:
                    print(f"      Details: {result['details']}")
        
        print("\n" + "=" * 60)

def main():
    """Main function to run security tests"""
    tester = SecurityTester()
    
    print("🚀 Starting Security Tests...")
    print("Make sure the backend is running on http://127.0.0.1:8000")
    
    # Run all tests
    results = tester.run_all_tests()
    
    # Print results
    tester.print_results(results)
    
    # Save results to file
    with open("security_test_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Results saved to: security_test_results.json")

if __name__ == "__main__":
    main()
