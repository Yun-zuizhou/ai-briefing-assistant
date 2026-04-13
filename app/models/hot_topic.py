from sqlalchemy import Column, String, DateTime, Integer, Text, JSON, Float
from sqlalchemy.sql import func
from app.database import Base


class HotTopic(Base):
    """热点资讯模型"""
    __tablename__ = "hot_topics"
    
    id = Column(Integer, primary_key=True, index=True)
    
    title = Column(String(500), nullable=False, index=True)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    
    source = Column(String(100), nullable=False, index=True)
    source_url = Column(String(1000), nullable=False, unique=True)
    author = Column(String(100), nullable=True)
    
    categories = Column(JSON, default=list)
    tags = Column(JSON, default=list)
    keywords = Column(JSON, default=list)
    
    hot_value = Column(Integer, default=0, index=True)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    quality_score = Column(Float, default=0.0)
    relevance_score = Column(Float, default=0.0)
    
    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    fetched_at = Column(DateTime(timezone=True), server_default=func.now())
    
    hot_comments = Column(JSON, default=list)
    guide_questions = Column(JSON, default=list)
    
    raw_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<HotTopic(id={self.id}, title={self.title[:30]})>"
