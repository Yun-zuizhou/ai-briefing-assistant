from sqlalchemy import Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.database import Base


class OpportunityFollow(Base):
    __tablename__ = "opportunity_follows"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    opportunity_id = Column(Integer, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="watching", index=True)
    note = Column(Text, nullable=True)
    next_step = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
