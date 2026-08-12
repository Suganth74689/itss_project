import time
import uuid
from typing import Dict, Optional
from schemas import LoginRequest, LoginResponse, UserResponse

# Pre-configured Enterprise Demo Accounts
DEMO_USERS: Dict[str, dict] = {
    "officer@nexusbank.com": {
        "id": "usr_officer_01",
        "username": "officer@nexusbank.com",
        "password": "admin123",
        "email": "officer@nexusbank.com",
        "full_name": "Sarah Jenkins",
        "role": "Bank Officer",
        "department": "Retail Banking & Credit Risk",
        "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
    "analyst@nexusbank.com": {
        "id": "usr_analyst_02",
        "username": "analyst@nexusbank.com",
        "password": "nexus2026",
        "email": "analyst@nexusbank.com",
        "full_name": "Marcus Vance",
        "role": "KYC & Anti-Money Laundering Analyst",
        "department": "Financial Crime & Compliance",
        "avatar_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
    },
    "admin@nexusbank.com": {
        "id": "usr_admin_03",
        "username": "admin@nexusbank.com",
        "password": "admin123",
        "email": "admin@nexusbank.com",
        "full_name": "Elena Rostova",
        "role": "System Administrator",
        "department": "Enterprise AI & Risk Core",
        "avatar_url": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    }
}

# In-memory active tokens store: token -> (user_dict, expire_timestamp)
ACTIVE_SESSIONS: Dict[str, dict] = {}

class AuthService:
    @staticmethod
    def authenticate_user(req: LoginRequest) -> LoginResponse:
        username = req.username.strip().lower()
        password = req.password.strip()

        user_info = DEMO_USERS.get(username)

        # Allow flexible matching for demo convenience if user typed short username like "officer" or "analyst"
        if not user_info:
            for key, val in DEMO_USERS.items():
                if username in key.split("@")[0]:
                    user_info = val
                    break

        if not user_info:
            # Fallback for dynamic demo login if non-empty username & password provided
            if username and password:
                demo_id = f"usr_{uuid.uuid4().hex[:8]}"
                name_title = username.split("@")[0].capitalize()
                user_info = {
                    "id": demo_id,
                    "username": username,
                    "password": password,
                    "email": username if "@" in username else f"{username}@nexusbank.com",
                    "full_name": f"{name_title} User",
                    "role": req.role or "Banking Specialist",
                    "department": "Core Banking Intelligence",
                    "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                }

        if not user_info or (user_info.get("password") and user_info["password"] != password):
            return LoginResponse(
                success=False,
                message="Invalid username/email or password. Please try demo credentials (e.g. officer@nexusbank.com / admin123)."
            )

        # Create session token
        token = f"nexus_token_{uuid.uuid4().hex}"
        last_login_str = time.strftime("%Y-%m-%d %H:%M:%S UTC")

        user_resp = UserResponse(
            id=user_info["id"],
            username=user_info["username"],
            email=user_info["email"],
            full_name=user_info["full_name"],
            role=req.role or user_info["role"],
            department=user_info["department"],
            avatar_url=user_info.get("avatar_url"),
            last_login=last_login_str
        )

        ACTIVE_SESSIONS[token] = user_resp.dict()

        return LoginResponse(
            success=True,
            message=f"Welcome back, {user_resp.full_name}!",
            token=token,
            user=user_resp
        )

    @staticmethod
    def get_current_user(token: str) -> Optional[UserResponse]:
        if not token:
            return None
        session_data = ACTIVE_SESSIONS.get(token)
        if not session_data:
            return None
        return UserResponse(**session_data)

    @staticmethod
    def logout_user(token: str) -> bool:
        if token in ACTIVE_SESSIONS:
            del ACTIVE_SESSIONS[token]
            return True
        return False
