from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.sql import func

from app.database import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False, index=True)
    content = Column(Text, nullable=False)

    message_state = Column(String(50), nullable=True, index=True)
    intent_type = Column(String(50), nullable=True, index=True)
    candidate_intents = Column(JSON, default=list, nullable=False)
    confidence = Column(Float, nullable=True)
    source_context = Column(String(100), nullable=True)
    matched_by = Column(String(50), nullable=True)
    confirmed_type = Column(String(50), nullable=True)
    action_type = Column(String(50), nullable=True)
    result_summary = Column(Text, nullable=True)
    deep_link = Column(String(200), nullable=True)
    next_page_label = Column(String(100), nullable=True)
    affected_entity_type = Column(String(50), nullable=True)
    affected_entity_id = Column(String(100), nullable=True)
    change_log = Column(JSON, default=list, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
