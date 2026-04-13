from sqlalchemy import Column, String, DateTime, Integer, Text
from sqlalchemy.sql import func

from app.database import Base


class HistoryEntry(Base):
    """用户历史事件模型"""

    __tablename__ = "history_entries"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, index=True)

    event_type = Column(String(50), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    summary = Column(Text, nullable=True)
    ref_type = Column(String(50), nullable=True)
    ref_id = Column(Integer, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<HistoryEntry(id={self.id}, user_id={self.user_id}, event_type={self.event_type})>"
