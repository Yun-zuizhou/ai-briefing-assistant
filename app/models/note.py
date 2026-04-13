from sqlalchemy import Column, String, DateTime, Integer, Text, JSON
from sqlalchemy.sql import func

from app.database import Base


class Note(Base):
    """用户记录/想法模型"""

    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, index=True)

    content = Column(Text, nullable=False)
    source_type = Column(String(50), nullable=False, default="manual", index=True)
    source_id = Column(Integer, nullable=True)
    tags = Column(JSON, default=list)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Note(id={self.id}, user_id={self.user_id}, source_type={self.source_type})>"
