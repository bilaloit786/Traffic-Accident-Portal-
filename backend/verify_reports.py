import requests
import sys

BASE_URL = "http://localhost:8000"

def register_and_login(username, password, role):
    # Try to login first
    login_data = {"username": username, "password": password}
    response = requests.post(f"{BASE_URL}/token", data=login_data)
    
    if response.status_code == 200:
        return response.json()["access_token"]
    
    # If login fails, try to register
    register_data = {
        "username": username,
        "email": f"{username}@example.com",
        "password": password,
        "role": role
    }
    response = requests.post(f"{BASE_URL}/register", json=register_data)
    if response.status_code == 200:
        return response.json()["access_token"]
    elif response.status_code == 400 and "already registered" in response.text:
         response = requests.post(f"{BASE_URL}/token", data=login_data)
         if response.status_code == 200:
             return response.json()["access_token"]
    
    print(f"Failed to auth {username}: {response.text}")
    return None

def test_reports_api(token, params, expected_status):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    response = requests.get(f"{BASE_URL}/api/reports/generate", params=params, headers=headers)
    return response

def main():
    print("🚀 Starting Reports Endpoint Verification")
    
    # 1. Setup Users
    admin_token = register_and_login("test_admin", "pass123", "admin")
    police_token = register_and_login("test_police", "pass123", "traffic_police")
    user_token = register_and_login("test_user", "pass123", "user")
    
    if not all([admin_token, police_token, user_token]):
        print("❌ Failed to retrieve authentication tokens. Ensure the backend server is running on http://localhost:8000.")
        sys.exit(1)

    all_passed = True

    # 2. Test RBAC access control
    print("\n🔐 1. Checking Role-Based Access Control...")
    params = {"start_date": "2025-01-01", "end_date": "2025-01-07", "period_type": "weekly"}
    
    # Admin (Expected: 200)
    res_admin = test_reports_api(admin_token, params, 200)
    if res_admin.status_code == 200:
        print("✅ Admin Access: PASSED (200)")
    else:
        print(f"❌ Admin Access: FAILED (Expected 200, got {res_admin.status_code})")
        all_passed = False

    # Police (Expected: 200)
    res_police = test_reports_api(police_token, params, 200)
    if res_police.status_code == 200:
        print("✅ Police Access: PASSED (200)")
    else:
        print(f"❌ Police Access: FAILED (Expected 200, got {res_police.status_code})")
        all_passed = False

    # Basic User (Expected: 403)
    res_user = test_reports_api(user_token, params, 403)
    if res_user.status_code == 403:
        print("✅ Basic User Access: PASSED (Forbidden 403)")
    else:
        print(f"❌ Basic User Access: FAILED (Expected 403, got {res_user.status_code})")
        all_passed = False

    # Anonymous (Expected: 401)
    res_anon = test_reports_api(None, params, 401)
    if res_anon.status_code == 401:
        print("✅ Anonymous Access: PASSED (Unauthorized 401)")
    else:
        print(f"❌ Anonymous Access: FAILED (Expected 401, got {res_anon.status_code})")
        all_passed = False

    # 3. Test validation errors
    print("\n📅 2. Checking Invalid Input Validation...")
    invalid_params = {"start_date": "2025-01-07", "end_date": "2025-01-01", "period_type": "custom"}
    res_invalid = test_reports_api(admin_token, invalid_params, 400)
    if res_invalid.status_code == 400:
        print("✅ Start Date > End Date Validation: PASSED (400)")
    else:
        print(f"❌ Start Date > End Date Validation: FAILED (Expected 400, got {res_invalid.status_code})")
        all_passed = False

    # 4. Verify report data schema and correctness
    print("\n📊 3. Checking Response Data Schema and Values...")
    if res_admin.status_code == 200:
        data = res_admin.json()
        
        required_keys = [
            "start_date", "end_date", "period_type", "summary", 
            "severity_breakdown", "weather_breakdown", "road_type_breakdown", 
            "daily_trends", "hourly_trends", "hotspots", "recommendations", "executive_summary"
        ]
        
        missing_keys = [k for k in required_keys if k not in data]
        if not missing_keys:
            print("✅ All required JSON keys present in response schema")
            
            # Verify specific sub-structures
            summary = data["summary"]
            summary_keys = ["total_accidents", "total_injuries", "total_fatalities", "vehicles_involved"]
            missing_summary = [k for k in summary_keys if k not in summary]
            if not missing_summary:
                print("✅ Summary counts structure verified")
                print(f"   - Total Accidents: {summary['total_accidents']}")
                print(f"   - Total Injuries: {summary['total_injuries']}")
                print(f"   - Total Fatalities: {summary['total_fatalities']}")
                print(f"   - Vehicles Involved: {summary['vehicles_involved']}")
            else:
                print(f"❌ Missing summary keys: {missing_summary}")
                all_passed = False
                
            # Verify presence of breakdowns
            print(f"✅ Severity breakdown keys: {list(data['severity_breakdown'].keys())}")
            print(f"✅ Weather breakdowns count: {len(data['weather_breakdown'])}")
            print(f"✅ Road type breakdowns count: {len(data['road_type_breakdown'])}")
            print(f"✅ Daily trends count: {len(data['daily_trends'])}")
            print(f"✅ Hourly trends count: {len(data['hourly_trends'])}")
            print(f"✅ Hotspots count (limit 5): {len(data['hotspots'])}")
            print(f"✅ Recommendations generated: {len(data['recommendations'])}")
            print(f"✅ Executive Summary: \"{data['executive_summary'][:80]}...\"")
        else:
            print(f"❌ Missing keys in response: {missing_keys}")
            all_passed = False
    else:
        print("❌ Cannot verify schema because Admin request failed")
        all_passed = False

    if all_passed:
        print("\n✨ Reports Verification Complete: ALL TESTS PASSED! ✨")
    else:
        print("\n❌ Reports Verification Complete: SOME TESTS FAILED! ❌")
        sys.exit(1)

if __name__ == "__main__":
    main()
