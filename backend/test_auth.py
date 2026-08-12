import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from schemas import LoginRequest
from services.auth_service import AuthService

def test_auth_flow():
    print("Testing AuthService Login with demo credentials...")
    req = LoginRequest(username="officer@nexusbank.com", password="admin123")
    res = AuthService.authenticate_user(req)
    
    assert res.success is True, f"Login failed: {res.message}"
    assert res.token is not None, "Token missing from successful login"
    assert res.user is not None, "User info missing from login response"
    assert res.user.role == "Bank Officer"
    print(f"Login Successful! User: {res.user.full_name}, Role: {res.user.role}, Token: {res.token}")

    print("\nTesting Get Current User with token...")
    user = AuthService.get_current_user(res.token)
    assert user is not None, "Failed to retrieve user by token"
    assert user.username == "officer@nexusbank.com"
    print(f"Token verification successful for {user.full_name}")

    print("\nTesting Invalid Password...")
    bad_req = LoginRequest(username="officer@nexusbank.com", password="wrongpassword")
    bad_res = AuthService.authenticate_user(bad_req)
    assert bad_res.success is False, "Login should have failed for wrong password"
    print("Invalid password test passed!")

    print("\nTesting Logout...")
    logout_success = AuthService.logout_user(res.token)
    assert logout_success is True, "Logout should return True"
    assert AuthService.get_current_user(res.token) is None, "Token should be invalidated after logout"
    print("Logout test passed!")

    print("\nALL AUTH TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_auth_flow()
