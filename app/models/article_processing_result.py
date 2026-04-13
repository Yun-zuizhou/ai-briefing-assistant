from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, String
from sqlalchemy.sql import func

from app.database import Base


class ArticleProcessingResult(Base):
    __tablename__ = "article_processing_results"

    id = Column(Integer, primary_key=True, index=True)
    source_article_id = Column(Integer, nullable=False, unique=True, index=True)
    source_content_ref = Column(String(100), nullable=False, unique=True, index=True)

    normalized_title = Column(String(500), nullable=False)
    normalized_summary = Column(String, nullable=True)
    normalized_category_labels = Column(JSON, default=list, nullable=False)
    normalized_tags = Column(JSON, default=list, nullable=False)
    quality_score = Column(Float, default=0.0, nullable=False)
    published_at = Column(String(100), nullable=True)

    processing_version = Column(String(50), nullable=False, index=True)
    processed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    is_stale = Column(Boolean, default=False, nullable=False)
