from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict
from typing import Optional, List

from app.config import settings
from app.database import get_db
from app.models.rss_source import RSSSource
from app.models.rss_article import RSSArticle
from app.services.article_processing_result_store import get_or_create_article_processing_results
from app.services.content_result import (
    observe_article_processing_result,
    project_article_result_payload,
)
from app.services.d1_article_processing_result_store import D1ArticleProcessingResultStore
from app.services.d1_content_store import D1ContentStore


router = APIRouter(tags=["RSS管理"])


class RSSSourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """RSS源响应"""
    id: int
    name: str
    url: str
    category: str
    tags: List[str]
    enabled: bool
    last_fetch_time: Optional[str]
    total_articles: int
    error_count: int


class RSSArticleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    """RSS文章响应"""
    id: int
    title: str
    summary: Optional[str]
    source_name: str
    source_url: str
    author: Optional[str]
    category: Optional[str]
    tags: List[str]
    publish_time: Optional[str]


@router.get(
    "/sources",
    response_model=List[RSSSourceResponse],
    summary="获取RSS源列表"
)
async def get_rss_sources(
    category: str = None,
    enabled: bool = None,
    db: Session = Depends(get_db)
):
    """获取RSS源列表"""
    query = db.query(RSSSource)
    
    if category:
        query = query.filter(RSSSource.category == category)
    if enabled is not None:
        query = query.filter(RSSSource.enabled == enabled)
    
    sources = query.all()
    
    return [
        RSSSourceResponse(
            id=s.id,
            name=s.name,
            url=s.url,
            category=s.category,
            tags=s.tags or [],
            enabled=s.enabled,
            last_fetch_time=s.last_fetch_time.isoformat() if s.last_fetch_time else None,
            total_articles=s.total_articles,
            error_count=s.error_count
        )
        for s in sources
    ]


@router.post(
    "/sources/{source_id}/toggle",
    summary="启用/禁用RSS源"
)
async def toggle_rss_source(
    source_id: int,
    db: Session = Depends(get_db)
):
    """启用或禁用RSS源"""
    source = db.query(RSSSource).filter(RSSSource.id == source_id).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="RSS源不存在")
    
    source.enabled = not source.enabled
    db.commit()
    
    return {"success": True, "enabled": source.enabled}


@router.post(
    "/fetch",
    summary="手动触发RSS聚合"
)
async def trigger_rss_fetch(
    background_tasks: BackgroundTasks,
    category: str = None
):
    """手动触发RSS聚合"""
    async def run_fetch():
        from app.database import SessionLocal
        from app.services.crawler.rss_aggregator import RSSAggregator
        db = SessionLocal()
        try:
            aggregator = RSSAggregator(db)
            if category:
                await aggregator.fetch_by_category(category)
            else:
                await aggregator.fetch_all()
        finally:
            db.close()
    
    background_tasks.add_task(run_fetch)
    
    return {"success": True, "message": "RSS聚合任务已提交"}


@router.get(
    "/articles",
    response_model=List[RSSArticleResponse],
    summary="获取RSS文章列表"
)
async def get_rss_articles(
    category: str = None,
    source_id: int = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """获取RSS文章列表"""
    if settings.D1_USE_CLOUD_AS_SOURCE:
        content_store = D1ContentStore()
        result_store = D1ArticleProcessingResultStore()
        articles = content_store.list_articles(limit=limit, offset=offset, category=category, source_id=source_id)
        article_results = result_store.get_or_create_article_results(articles)
        payloads = [
            (
                lambda result_row: (
                    observe_article_processing_result(result_row, source="rss.list.d1"),
                    project_article_result_payload(result_row, article),
                )[1]
            )(article_results[int(article.id)])
            for article in articles
        ]
        return [
            RSSArticleResponse(
                id=payload["id"],
                title=payload["title"],
                summary=payload["summary"],
                source_name=payload["source_name"],
                source_url=payload["source_url"],
                author=payload["author"],
                category=payload["category"],
                tags=payload["tags"],
                publish_time=payload["publish_time"],
            )
            for payload in payloads
        ]

    query = db.query(RSSArticle)
    
    if category:
        query = query.filter(RSSArticle.category == category)
    if source_id:
        query = query.filter(RSSArticle.source_id == source_id)
    
    articles = query.order_by(
        RSSArticle.publish_time.desc()
    ).offset(offset).limit(limit).all()
    article_results = get_or_create_article_processing_results(db, articles)

    payloads = [
        (
            lambda result_row: (
                observe_article_processing_result(result_row, source="rss.list"),
                project_article_result_payload(result_row, a),
            )[1]
        )(article_results[int(a.id)])
        for a in articles
    ]

    return [
        RSSArticleResponse(
            id=payload["id"],
            title=payload["title"],
            summary=payload["summary"],
            source_name=payload["source_name"],
            source_url=payload["source_url"],
            author=payload["author"],
            category=payload["category"],
            tags=payload["tags"],
            publish_time=payload["publish_time"],
        )
        for payload in payloads
    ]
