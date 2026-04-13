from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.database import Base


class UserInterest(Base):
    """用户关注项关系模型。

    当前阶段先落最小模型骨架，后续再把 preferences / chat / dashboard / reports
    从 users.interests 逐步切到这张表。
    """

    __tablename__ = "user_interests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    interest_name = Column(String(100), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="active")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<UserInterest(id={self.id}, user_id={self.user_id}, interest_name={self.interest_name})>"
