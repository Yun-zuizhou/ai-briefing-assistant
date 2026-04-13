from sqlalchemy import Column, String, DateTime, Integer, Text, JSON, Float, Enum
from sqlalchemy.sql import func
import enum
from app.database import Base


class OpportunityType(str, enum.Enum):
    """机会类型"""
    WRITING_SUBMISSION = "writing_submission"
    PART_TIME_JOB = "part_time_job"
    COMPETITION = "competition"
    INTERNSHIP = "internship"
    REMOTE_JOB = "remote_job"


class OpportunityStatus(str, enum.Enum):
    """机会状态"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CLOSED = "closed"


class Opportunity(Base):
    """机会信息模型"""
    __tablename__ = "opportunities"
    
    id = Column(Integer, primary_key=True, index=True)
    
    title = Column(String(500), nullable=False, index=True)
    type = Column(Enum(OpportunityType), nullable=False, index=True)
    status = Column(Enum(OpportunityStatus), default=OpportunityStatus.ACTIVE, index=True)
    
    source = Column(String(100), nullable=False, index=True)
    source_url = Column(String(1000), nullable=False, unique=True)
    source_id = Column(String(100), nullable=True)
    
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    deadline = Column(DateTime(timezone=True), nullable=True, index=True)
    start_time = Column(DateTime(timezone=True), nullable=True)
    
    reward = Column(String(200), nullable=True)
    reward_min = Column(Integer, nullable=True)
    reward_max = Column(Integer, nullable=True)
    reward_unit = Column(String(20), nullable=True)
    
    location = Column(String(200), nullable=True)
    is_remote = Column(Integer, default=0)
    
    tags = Column(JSON, default=list)
    category = Column(String(100), nullable=True)
    
    quality_score = Column(Float, default=0.0, index=True)
    reliability_score = Column(Float, default=0.0)
    
    view_count = Column(Integer, default=0)
    favorite_count = Column(Integer, default=0)
    
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    raw_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<Opportunity(id={self.id}, title={self.title[:30]}, type={self.type})>"
