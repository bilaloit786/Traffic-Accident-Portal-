from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db, User
from app.core.auth import (
    create_access_token, 
    get_password_hash, 
    verify_password, 
    get_current_active_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from pydantic import BaseModel

router = APIRouter(tags=["Authentication"])

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
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
        role=user_in.role
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
