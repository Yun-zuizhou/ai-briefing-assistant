from sqlalchemy import Column, String, DateTime, Integer, Text
from sqlalchemy.sql import func

from app.database import Base


class Favorite(Base):
    """收藏模型"""

    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, index=True)

    item_type = Column(String(50), nullable=False, index=True)
    item_id = Column(Integer, nullable=False, index=True)
    item_title = Column(String(500), nullable=False)
    item_summary = Column(Text, nullable=True)
    item_source = Column(String(100), nullable=True)
    item_url = Column(String(1000), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<Favorite(id={self.id}, user_id={self.user_id}, item_type={self.item_type}, item_id={self.item_id})>"
