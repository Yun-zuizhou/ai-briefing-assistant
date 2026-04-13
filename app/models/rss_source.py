from sqlalchemy import Column, String, DateTime, Integer, Text, JSON, Boolean
from sqlalchemy.sql import func
from app.database import Base

class RSSSource(Base):
    """RSS订阅源模型"""
    __tablename__ = "rss_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    category = Column(String(50), nullable=False, index=True)
    tags = Column(JSON, default=list)
    enabled = Column(Boolean, default=True)
    last_fetch_time = Column(DateTime(timezone=True), nullable=True)
    last_etag = Column(String(100), nullable=True)
    last_modified = Column(String(100), nullable=True)
    total_articles = Column(Integer, default=0)
    fetch_count = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    last_error = Column(Text, nullable=True)
    fetch_interval = Column(Integer, default=3600)
    config = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
