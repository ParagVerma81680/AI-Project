from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token, get_current_user
)
from app.core.config import settings
from app.database.models import User
from app.schemas.user import UserRegister, UserLogin, UserOut, TokenResponse

router = APIRouter(prefix="/users", tags=["Users & Authentication"])

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED, summary="Register user")
def register_user(payload: UserRegister, db: Session = Depends(get_db)):
    # Check existing username or email
    if db.query(User).filter(User.username == payload.username.strip()).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    if db.query(User).filter(User.email == payload.email.lower().strip()).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    new_user = User(
        username=payload.username.strip(),
        email=payload.email.lower().strip(),
        password_hash=get_password_hash(payload.password),
        role=payload.role if payload.role in ["customer", "admin"] else "customer"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(
        data={"sub": new_user.username, "role": new_user.role, "id": new_user.id}
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=new_user
    )

@router.post("/login", response_model=TokenResponse, summary="Login user and receive JWT")
def login_user(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == payload.username.strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "id": user.id}
    )
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user
    )

@router.get("/me", response_model=UserOut, summary="Get current authenticated user")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
