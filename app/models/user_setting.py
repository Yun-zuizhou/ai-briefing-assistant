from sqlalchemy import Column, DateTime, Integer, String, Boolean, ForeignKey
from sqlalchemy.sql import func

from app.database import Base


class UserSetting(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)

    morning_brief_time = Column(String(10), default="08:00")
    evening_brief_time = Column(String(10), default="21:00")
    do_not_disturb_enabled = Column(Boolean, default=False)
    do_not_disturb_start = Column(String(10), nullable=True)
    do_not_disturb_end = Column(String(10), nullable=True)
    sound_enabled = Column(Boolean, default=True)
    vibration_enabled = Column(Boolean, default=True)
    ai_provider = Column(String(32), nullable=True)
    ai_api_key = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
