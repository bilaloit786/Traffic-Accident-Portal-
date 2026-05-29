from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import timedelta
from app.database import get_db, LoginAudit, User
from app.core.auth import (
    create_access_token, 
    get_password_hash, 
    verify_password, 
    get_current_active_user,
    get_current_admin_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from pydantic import BaseModel
from typing import Optional

router = APIRouter(tags=["Authentication"])
VALID_ROLES = {"admin", "traffic_police", "user"}

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserRoleUpdate(BaseModel):
    role: str

class UserStatusUpdate(BaseModel):
    is_active: bool

def serialize_user(user: User, last_login=None):
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "is_active": bool(user.is_active),
        "created_at": user.created_at,
        "last_login": last_login
    }

def get_client_ip(request: Request):
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

def record_login_attempt(
    db: Session,
    request: Request,
    username: str,
    success: bool,
    user: Optional[User] = None,
    failure_reason: Optional[str] = None
):
    db.add(LoginAudit(
        username=username,
        user_id=user.id if user else None,
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("user-agent", "unknown"),
        success=1 if success else 0,
        failure_reason=failure_reason
    ))
    db.commit()

@router.post("/token", response_model=Token)
async def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        record_login_attempt(db, request, form_data.username, False, user, "invalid_credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        record_login_attempt(db, request, form_data.username, False, user, "inactive_user")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive. Contact an administrator.",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    record_login_attempt(db, request, form_data.username, True, user)
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.post("/register", response_model=Token)
async def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == user_in.username).first()
    if user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    user_email = db.query(User).filter(User.email == user_in.email).first()
    if user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_password,
        role="user"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": db_user.username, "role": db_user.role},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": db_user.role}

@router.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active
    }

@router.get("/api/admin/users")
async def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    last_login_subquery = db.query(
        LoginAudit.user_id,
        func.max(LoginAudit.created_at).label("last_login")
    ).filter(LoginAudit.success == 1).group_by(LoginAudit.user_id).subquery()

    rows = db.query(User, last_login_subquery.c.last_login).outerjoin(
        last_login_subquery,
        User.id == last_login_subquery.c.user_id
    ).order_by(User.created_at.desc()).all()

    return [serialize_user(user, last_login) for user, last_login in rows]

@router.patch("/api/admin/users/{user_id}/role")
async def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and payload.role != "admin":
        raise HTTPException(status_code=400, detail="Admins cannot remove their own admin role")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return serialize_user(user)

@router.patch("/api/admin/users/{user_id}/status")
async def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and not payload.is_active:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate their own account")

    user.is_active = 1 if payload.is_active else 0
    db.commit()
    db.refresh(user)
    return serialize_user(user)

@router.get("/api/admin/login-activity")
async def list_login_activity(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    safe_limit = min(max(limit, 1), 200)
    rows = db.query(LoginAudit).order_by(LoginAudit.created_at.desc()).limit(safe_limit).all()
    return [{
        "id": row.id,
        "username": row.username,
        "user_id": row.user_id,
        "ip_address": row.ip_address,
        "user_agent": row.user_agent,
        "success": bool(row.success),
        "failure_reason": row.failure_reason,
        "created_at": row.created_at
    } for row in rows]

@router.get("/api/admin/security-summary")
async def get_security_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active == 1).scalar() or 0
    admins = db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0
    failed_logins = db.query(func.count(LoginAudit.id)).filter(LoginAudit.success == 0).scalar() or 0
    successful_logins = db.query(func.count(LoginAudit.id)).filter(LoginAudit.success == 1).scalar() or 0

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "admins": admins,
        "failed_logins": failed_logins,
        "successful_logins": successful_logins,
        "token_expiry_minutes": ACCESS_TOKEN_EXPIRE_MINUTES,
        "registration_default_role": "user"
    }
