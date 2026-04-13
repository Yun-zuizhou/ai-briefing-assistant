from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    report_type = Column(String(20), nullable=False, index=True)
    period_start = Column(String(20), nullable=True, index=True)
    period_end = Column(String(20), nullable=True, index=True)
    title = Column(String(200), nullable=False)
    summary_text = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="ready", index=True)
    report_payload_json = Column(Text, nullable=True)
    generated_at = Column(String(50), nullable=True, index=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
