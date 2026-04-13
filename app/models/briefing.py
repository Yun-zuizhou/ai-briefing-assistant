from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class Briefing(Base):
    __tablename__ = "briefings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    brief_date = Column(String(20), nullable=False, index=True)
    brief_type = Column(String(20), nullable=False, index=True)
    issue_number = Column(Integer, nullable=True)
    title = Column(String(200), nullable=False)
    summary_text = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="ready", index=True)
    brief_payload_json = Column(Text, nullable=True)
    generated_at = Column(String(50), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
