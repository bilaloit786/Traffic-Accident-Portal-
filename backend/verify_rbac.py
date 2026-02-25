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
         # Fallback if somehow login failed but user exists (e.g. wrong password before), try login again
         response = requests.post(f"{BASE_URL}/token", data=login_data)
         if response.status_code == 200:
             return response.json()["access_token"]
    
    print(f"Failed to auth {username}: {response.text}")
    return None

def test_endpoint(name, url, method, token, expected_status):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    if method == "GET":
        response = requests.get(f"{BASE_URL}{url}", headers=headers)
    else:
        # Dummy body for predict
        data = {
            "latitude": 32.5, "longitude": 74.0, "hour": 18, 
            "weather": "Clear", "road_type": "Arterial"
        }
        response = requests.post(f"{BASE_URL}{url}", json=data, headers=headers)
    
    status = response.status_code
    result = "✅ PASS" if status == expected_status else f"❌ FAIL (Got {status})"
    print(f"{name:<30} {url:<30} Expected: {expected_status} | Got: {status} | {result}")
    return status == expected_status

def main():
    print("🚀 Starting RBAC Verification")
    
    # 1. Setup Users
    admin_token = register_and_login("test_admin", "pass123", "admin")
    police_token = register_and_login("test_police", "pass123", "traffic_police")
    user_token = register_and_login("test_user", "pass123", "user")
    
    if not all([admin_token, police_token, user_token]):
        print("Failed to get tokens. Is the server running?")
        sys.exit(1)

    print("\n🔐 Verify Public/Common Endpoints (Authenticated)")
    test_endpoint("User -> Accidents", "/api/accidents/", "GET", user_token, 200)
    test_endpoint("User -> Dashboard", "/api/stats/overview", "GET", user_token, 200)
    
    print("\n👮 Verify Admin Only Endpoints")
    test_endpoint("Admin -> Analytics", "/api/stats/by-time", "GET", admin_token, 200)
    test_endpoint("Police -> Analytics", "/api/stats/by-time", "GET", police_token, 403)
    test_endpoint("User -> Analytics", "/api/stats/by-time", "GET", user_token, 403)
    
    print("\n🚔 Verify Police/Admin Endpoints")
    test_endpoint("Admin -> Predict", "/api/predictions/predict", "POST", admin_token, 200)
    test_endpoint("Police -> Predict", "/api/predictions/predict", "POST", police_token, 200)
    test_endpoint("User -> Predict", "/api/predictions/predict", "POST", user_token, 403)
    
    print("\n🚫 Verify Unauthorized Access")
    test_endpoint("Anon -> Accidents", "/api/accidents/", "GET", None, 401)
    
    print("\n✨ Verification Complete")

if __name__ == "__main__":
    main()
