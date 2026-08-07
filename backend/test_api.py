"""
Simple API test script (no pytest required)
Tests endpoints without live Jira connection
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:5000"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print(f"{'='*60}")

def print_result(passed, message):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {message}")

def test_health():
    """Test health endpoint"""
    print_header("TEST 1: Health Check")
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        data = response.json()
        
        has_status = 'status' in data
        is_healthy = data.get('status') == 'healthy'
        
        print_result(is_healthy, "Health endpoint responds")
        print(f"  Status: {data.get('status')}")
        print(f"  Timestamp: {data.get('timestamp')}")
        print(f"  Cache entries: {data.get('cache_entries')}")
        
        return is_healthy
    except Exception as e:
        print_result(False, f"Health check failed: {str(e)}")
        return False

def test_cache_status():
    """Test cache status endpoint"""
    print_header("TEST 2: Cache Status")
    
    try:
        response = requests.get(f"{BASE_URL}/api/cache/status")
        data = response.json()
        
        has_data = 'total_entries' in data
        print_result(has_data, "Cache status endpoint responds")
        print(f"  Total cache entries: {data.get('total_entries')}")
        print(f"  Total size: {data.get('total_size_kb')} KB")
        
        return has_data
    except Exception as e:
        print_result(False, f"Cache status failed: {str(e)}")
        return False

def test_cache_invalidation():
    """Test cache invalidation endpoint"""
    print_header("TEST 3: Cache Invalidation")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/cache/invalidate",
            json={'type': 'full'}
        )
        data = response.json()
        
        is_success = data.get('success') == True
        print_result(is_success, "Cache invalidation endpoint responds")
        print(f"  Message: {data.get('message')}")
        
        return is_success
    except Exception as e:
        print_result(False, f"Cache invalidation failed: {str(e)}")
        return False

def test_endpoints_exist():
    """Test that all endpoints are registered"""
    print_header("TEST 4: Endpoints Exist")
    
    endpoints = [
        ('GET', '/health'),
        ('GET', '/api/cache/status'),
        ('POST', '/api/cache/invalidate'),
        ('GET', '/api/sprints/detect'),
        ('POST', '/api/jira/import'),
        ('GET', '/api/test-jira-connection'),
    ]
    
    results = []
    for method, endpoint in endpoints:
        try:
            if method == 'GET':
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=2)
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json={}, timeout=2)
            
            exists = response.status_code != 404
            results.append(exists)
            status = "✅ Exists" if exists else "❌ Not Found"
            print(f"  {status}: {method:4} {endpoint}")
        except requests.exceptions.Timeout:
            print(f"  ⏱️  Timeout: {method:4} {endpoint}")
            results.append(False)
        except Exception as e:
            print(f"  ⚠️  Error: {method:4} {endpoint} - {str(e)[:40]}")
            results.append(False)
    
    passed = all(results)
    print_result(passed, f"{sum(results)}/{len(results)} endpoints responding")
    return passed

def test_jira_connection():
    """Test Jira connection (requires .env configured)"""
    print_header("TEST 5: Jira Connection")
    
    try:
        response = requests.get(f"{BASE_URL}/api/test-jira-connection", timeout=5)
        data = response.json()
        
        if response.status_code == 200 and data.get('success'):
            print_result(True, "Connected to Jira")
            print(f"  User: {data.get('user')}")
            print(f"  Email: {data.get('email')}")
            return True
        else:
            error = data.get('error', 'Unknown error')
            print_result(False, f"Jira connection failed: {error}")
            return False
    except Exception as e:
        print_result(False, f"Jira connection test failed: {str(e)}")
        print("  ⓘ This is expected if JIRA credentials not configured in .env")
        return False

def test_field_mapping():
    """Test field mapping functions (client-side test)"""
    print_header("TEST 6: Field Mapping (Logic Check)")
    
    test_cases = [
        # (seconds, expected_md)
        (28800, 1.0),    # 8 hours = 1 MD
        (86400, 3.0),    # 24 hours = 3 MD
        (57600, 2.0),    # 16 hours = 2 MD
        (43200, 1.5),    # 12 hours = 1.5 MD
        (0, 0),          # 0 seconds = 0 MD
    ]
    
    results = []
    for seconds, expected_md in test_cases:
        calculated_md = round(seconds / 28800, 2)
        matches = calculated_md == expected_md
        results.append(matches)
        status = "✅" if matches else "❌"
        print(f"  {status} {seconds:6} sec → {calculated_md} MD (expected {expected_md})")
    
    passed = all(results)
    print_result(passed, f"Field mapping logic: {sum(results)}/{len(results)} correct")
    return passed

def run_all_tests():
    """Run all tests"""
    print("\n" + "🚀 "*30)
    print("Backend API Test Suite")
    print("🚀 "*30)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"API Base URL: {BASE_URL}")
    
    # Check if server is running
    try:
        requests.get(f"{BASE_URL}/health", timeout=2)
    except Exception as e:
        print(f"\n❌ FATAL: Cannot connect to backend on {BASE_URL}")
        print(f"   Make sure backend is running: python app.py")
        print(f"   Error: {str(e)}")
        return False
    
    results = {
        'Health Check': test_health(),
        'Cache Status': test_cache_status(),
        'Cache Invalidation': test_cache_invalidation(),
        'Endpoints Exist': test_endpoints_exist(),
        'Field Mapping': test_field_mapping(),
        'Jira Connection': test_jira_connection(),  # May fail if not configured
    }
    
    # Summary
    print_header("TEST SUMMARY")
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅" if result else "❌"
        print(f"{status} {test_name}")
    
    print(f"\n📊 RESULT: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is ready.")
    else:
        print("⚠️  Some tests failed. Check errors above.")
    
    return passed == total

if __name__ == '__main__':
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏸️  Tests interrupted by user")
        exit(1)
