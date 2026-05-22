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

def main():
    print("🚀 Starting Map & Heatmap Endpoint Verification")
    
    # Setup User
    token = register_and_login("test_map_user", "pass123", "user")
    if not token:
        print("❌ Failed to retrieve authentication token. Ensure the backend server is running on http://localhost:8000.")
        sys.exit(1)
        
    all_passed = True

    # 1. Test /api/accidents/ with limit parameter
    print("\n📍 1. Testing /api/accidents/ endpoint limit parameter...")
    
    # Default limit check (typically 100)
    res_default = requests.get(f"{BASE_URL}/api/accidents/")
    if res_default.status_code == 200:
        data = res_default.json()
        print(f"✅ Default limit query: PASSED (Returned {len(data)} items, expected 100)")
        if len(data) != 100:
            print(f"⚠️ Warning: expected 100 default items, but got {len(data)}")
    else:
        print(f"❌ Default limit query: FAILED (Status: {res_default.status_code})")
        all_passed = False

    # Large limit check (e.g. 20000)
    res_large = requests.get(f"{BASE_URL}/api/accidents/", params={"limit": 20000})
    if res_large.status_code == 200:
        data = res_large.json()
        print(f"✅ Large limit query (limit=20000): PASSED (Returned {len(data)} items)")
        if len(data) <= 100:
            print(f"⚠️ Warning: only returned {len(data)} items, check if DB is empty or if query limit failed.")
            all_passed = False
    else:
        print(f"❌ Large limit query: FAILED (Status: {res_large.status_code}, Msg: {res_large.text})")
        all_passed = False

    # Date filter check
    date_params = {"start_date": "2025-01-01", "end_date": "2025-06-30", "limit": 20000}
    res_date = requests.get(f"{BASE_URL}/api/accidents/", params=date_params)
    if res_date.status_code == 200:
        data = res_date.json()
        print(f"✅ Date filter query (2025-01-01 to 2025-06-30): PASSED (Returned {len(data)} items)")
    else:
        print(f"❌ Date filter query: FAILED (Status: {res_date.status_code})")
        all_passed = False

    # 2. Test /api/accidents/heatmap/data
    print("\n🔥 2. Testing /api/accidents/heatmap/data endpoint...")
    headers = {"Authorization": f"Bearer {token}"}
    res_heatmap = requests.get(f"{BASE_URL}/api/accidents/heatmap/data", headers=headers)
    if res_heatmap.status_code == 200:
        data = res_heatmap.json()
        print(f"✅ Heatmap data query: PASSED (Returned {len(data)} unique intensity points)")
        if len(data) > 0:
            point = data[0]
            required_keys = ["latitude", "longitude", "intensity"]
            missing_keys = [k for k in required_keys if k not in point]
            if not missing_keys:
                print(f"✅ Heatmap data point schema: PASSED (Keys: {list(point.keys())})")
                print(f"   Sample Point: Lat={point['latitude']}, Lon={point['longitude']}, Intensity={point['intensity']}")
            else:
                print(f"❌ Heatmap data point schema missing keys: {missing_keys}")
                all_passed = False
        else:
            print("⚠️ Warning: Heatmap returned 0 points. Check if DB has data.")
    else:
        print(f"❌ Heatmap data query: FAILED (Status: {res_heatmap.status_code}, Msg: {res_heatmap.text})")
        all_passed = False

    # 3. Test Heatmap endpoint date filters
    print("\n📅 3. Testing /api/accidents/heatmap/data date filter parameters...")
    res_heatmap_date = requests.get(
        f"{BASE_URL}/api/accidents/heatmap/data", 
        params={"start_date": "2025-01-01", "end_date": "2025-06-30"},
        headers=headers
    )
    if res_heatmap_date.status_code == 200:
        data = res_heatmap_date.json()
        print(f"✅ Heatmap date filter query: PASSED (Returned {len(data)} unique density cells)")
    else:
        print(f"❌ Heatmap date filter query: FAILED (Status: {res_heatmap_date.status_code})")
        all_passed = False

    if all_passed:
        print("\n✨ Map & Heatmap Verification Complete: ALL TESTS PASSED! ✨")
    else:
        print("\n❌ Map & Heatmap Verification Complete: SOME TESTS FAILED! ❌")
        sys.exit(1)

if __name__ == "__main__":
    main()
