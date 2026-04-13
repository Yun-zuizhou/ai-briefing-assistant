from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import secrets

from app.database import get_db
from app.models.user import User
from app.config import settings


router = APIRouter()


class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    nickname: Optional[str] = None


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    nickname: Optional[str]


def hash_password(password: str) -> str:
    """简单密码哈希"""
    salt = secrets.token_hex(16)
    hash_obj = hashlib.sha256((password + salt).encode())
    return f"{salt}${hash_obj.hexdigest()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        salt, hash_value = hashed_password.split("$")
        hash_obj = hashlib.sha256((plain_password + salt).encode())
        return hash_obj.hexdigest() == hash_value
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


@router.post("/register", response_model=UserResponse, summary="用户注册")
async def register(
    user_data: UserRegister,
    db: Session = Depends(get_db)
):
    """用户注册"""
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="用户名或邮箱已存在")
    
    hashed_password = hash_password(user_data.password)
    
    user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        nickname=user_data.nickname or user_data.username,
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        nickname=user.nickname
    )


@router.post("/login", response_model=Token, summary="用户登录")
async def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """用户登录"""
    user = db.query(User).filter(User.username == user_data.username).first()
    
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")
    
    user.last_login = datetime.now()
    db.commit()
    
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id}
    )
    
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse, summary="获取当前用户信息")
async def get_current_user(
    token: str,
    db: Session = Depends(get_db)
):
    """获取当前用户信息"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="无效的token")
    except JWTError:
        raise HTTPException(status_code=401, detail="无效的token")
    
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=401, detail="用户不存在")
    
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        nickname=user.nickname
    )


@router.post("/logout", summary="用户登出")
async def logout():
    """用户登出"""
    return {"success": True, "message": "登出成功"}
