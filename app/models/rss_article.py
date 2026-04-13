from sqlalchemy import Column, String, DateTime, Integer, Text, JSON, Float
from sqlalchemy.sql import func
from app.database import Base

class RSSArticle(Base):
    """RSS文章模型"""
    __tablename__ = "rss_articles"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(500), nullable=False, index=True)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=True)
    source_id = Column(Integer, nullable=False, index=True)
    source_name = Column(String(100), nullable=False)
    source_url = Column(String(1000), nullable=False, unique=True)
    author = Column(String(100), nullable=True)
    category = Column(String(50), nullable=True, index=True)
    tags = Column(JSON, default=list)
    publish_time = Column(DateTime(timezone=True), nullable=True, index=True)
    fetch_time = Column(DateTime(timezone=True), server_default=func.now())
    guid = Column(String(500), nullable=True, unique=True)
    quality_score = Column(Float, default=0.0)
    view_count = Column(Integer, default=0)
    raw_data = Column(JSON, nullable=True)
