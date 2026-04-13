from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    session_title = Column(String(200), nullable=True)
    status = Column(String(20), nullable=False, default="active", index=True)
    source_context = Column(String(100), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    last_message_at = Column(DateTime(timezone=True), nullable=True, index=True)
