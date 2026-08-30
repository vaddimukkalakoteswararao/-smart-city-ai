import hashlib
import hmac
import os
import re
import secrets
import time

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import get_db
from models.user import User


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

security = HTTPBearer(auto_error=False)

AUTH_SECRET = os.getenv(
    "SMART_CITY_AUTH_SECRET",
    "change-this-secret-before-production",
)

TOKEN_LIFETIME_SECONDS = 60 * 60 * 8


# ---------------------------------------------------------
# Request models
# ---------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    full_name: str
    email: str
    password: str


# ---------------------------------------------------------
# Password hashing
# ---------------------------------------------------------

def hash_password(
    password: str,
    salt: bytes | None = None,
) -> str:

    if salt is None:
        salt = os.urandom(16)

    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        200_000,
    )

    return (
        salt.hex()
        + ":"
        + derived_key.hex()
    )


def verify_password(
    password: str,
    stored_hash: str,
) -> bool:

    try:
        salt_hex, hash_hex = stored_hash.split(
            ":",
            1,
        )

        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(hash_hex)

        actual = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            200_000,
        )

        return hmac.compare_digest(
            actual,
            expected,
        )

    except Exception:
        return False


# ---------------------------------------------------------
# Token creation
# ---------------------------------------------------------

def create_token(
    user: User,
) -> str:

    expires_at = int(
        time.time()
        + TOKEN_LIFETIME_SECONDS
    )

    department = user.department or ""

    payload = (
        f"{user.id}|"
        f"{user.email}|"
        f"{user.role}|"
        f"{department}|"
        f"{expires_at}"
    )

    signature = hmac.new(
        AUTH_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return f"{payload}|{signature}"


# ---------------------------------------------------------
# Token validation
# ---------------------------------------------------------

def verify_token(
    token: str,
) -> dict:

    parts = token.split("|")

    if len(parts) != 6:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    user_id = parts[0]
    email = parts[1]
    role = parts[2]
    department = parts[3]
    expires_at = parts[4]
    signature = parts[5]

    payload = (
        f"{user_id}|"
        f"{email}|"
        f"{role}|"
        f"{department}|"
        f"{expires_at}"
    )

    expected_signature = hmac.new(
        AUTH_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        signature,
        expected_signature,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token.",
        )

    if int(expires_at) < int(time.time()):
        raise HTTPException(
            status_code=401,
            detail="Authentication token expired.",
        )

    return {
        "user_id": int(user_id),
        "email": email,
        "role": role,
        "department": department or None,
    }


# ---------------------------------------------------------
# Current authenticated user
# ---------------------------------------------------------

def get_authenticated_user(
    credentials: HTTPAuthorizationCredentials = Depends(
        security
    ),
    db: Session = Depends(get_db),
) -> User:

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    token_data = verify_token(
        credentials.credentials
    )

    user = (
        db.query(User)
        .filter(
            User.id == token_data["user_id"]
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User account not found.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive.",
        )

    return user


# ---------------------------------------------------------
# Register citizen
# ---------------------------------------------------------

@router.post("/register")
def register_citizen(
    request: RegisterRequest,
    db: Session = Depends(get_db),
):

    full_name = request.full_name.strip()
    email = request.email.strip().lower()
    password = request.password

    if len(full_name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid name.",
        )

    if not re.match(
        r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        email,
    ):
        raise HTTPException(
            status_code=400,
            detail="Please provide a valid email address.",
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain at least "
                "8 characters."
            ),
        )

    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail=(
                "An account with this email "
                "already exists."
            ),
        )

    user = User(
        email=email,
        password_hash=hash_password(
            password
        ),
        full_name=full_name,
        role="citizen",
        department=None,
        is_active=1,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "success": True,
        "message": (
            "Citizen account created successfully."
        ),
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department": user.department,
        },
    }


# ---------------------------------------------------------
# Login
# ---------------------------------------------------------

@router.post("/login")
def login(
    request: LoginRequest,
    db: Session = Depends(get_db),
):

    email = request.email.strip().lower()

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=403,
            detail="This account is inactive.",
        )

    if not verify_password(
        request.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    token = create_token(user)

    return {
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "department": user.department,
        },
    }


# ---------------------------------------------------------
# Current user
# ---------------------------------------------------------

@router.get("/me")
def get_me(
    current_user: User = Depends(
        get_authenticated_user
    ),
):

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "department": current_user.department,
    }