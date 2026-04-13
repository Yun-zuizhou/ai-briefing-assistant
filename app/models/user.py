from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """用户模型"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    nickname = Column(String(50), nullable=True)
    avatar = Column(String(500), nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    interests = Column(Text, default="[]")
    
    total_read = Column(Integer, default=0)
    total_thoughts = Column(Integer, default=0)
    total_completed = Column(Integer, default=0)
    streak_days = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username})>"
