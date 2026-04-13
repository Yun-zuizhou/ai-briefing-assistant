from sqlalchemy import Column, String, DateTime, Integer, Text, JSON, Enum
from sqlalchemy.sql import func
import enum
from app.database import Base


class TodoStatus(str, enum.Enum):
    """待办状态"""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TodoPriority(str, enum.Enum):
    """待办优先级"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Todo(Base):
    """待办事项模型"""
    __tablename__ = "todos"
    
    id = Column(Integer, primary_key=True, index=True)
    
    user_id = Column(Integer, nullable=False, index=True)
    
    content = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    
    status = Column(Enum(TodoStatus), default=TodoStatus.PENDING, index=True)
    priority = Column(Enum(TodoPriority), default=TodoPriority.MEDIUM, index=True)
    
    deadline = Column(DateTime(timezone=True), nullable=True, index=True)
    reminder_time = Column(DateTime(timezone=True), nullable=True)
    
    related_type = Column(String(50), nullable=True)
    related_id = Column(Integer, nullable=True)
    related_title = Column(String(200), nullable=True)
    
    tags = Column(JSON, default=list)
    
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Todo(id={self.id}, content={self.content[:20]}, status={self.status})>"
