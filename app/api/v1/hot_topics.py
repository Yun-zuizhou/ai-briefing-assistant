from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.database import get_db
from app.models.hot_topic import HotTopic


router = APIRouter()


class HotTopicResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    summary: Optional[str]
    source: str
    source_url: str
    categories: List[str]
    tags: List[str]
    hot_value: int
    quality_score: float
    published_at: Optional[str]


class HotTopicListResponse(BaseModel):
    total: int
    items: List[HotTopicResponse]


class CrawlerStatusResponse(BaseModel):
    success: bool
    platform: str
    fetched: int
    saved: int
    errors: List[dict]


@router.get("", response_model=HotTopicListResponse, summary="获取热点资讯列表")
async def get_hot_topics(
    category: Optional[str] = Query(None, description="分类过滤"),
    source: Optional[str] = Query(None, description="来源过滤(weibo/zhihu/toutiao)"),
    limit: int = Query(20, ge=1, le=100, description="返回数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    min_quality: float = Query(0.0, ge=0, le=1, description="最低质量分数"),
    db: Session = Depends(get_db)
):
    """获取热点资讯列表"""
    query = db.query(HotTopic)
    
    if category:
        query = query.filter(HotTopic.categories.contains([category]))
    
    if source:
        source_map = {
            "weibo": "微博热搜",
            "zhihu": "知乎热榜",
            "toutiao": "今日头条",
            "baidu": "百度热搜"
        }
        source_name = source_map.get(source, source)
        query = query.filter(HotTopic.source == source_name)
    
    if min_quality > 0:
        query = query.filter(HotTopic.quality_score >= min_quality)
    
    total = query.count()
    
    items = query.order_by(
        HotTopic.hot_value.desc(),
        HotTopic.quality_score.desc()
    ).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            HotTopicResponse(
                id=item.id,
                title=item.title,
                summary=item.summary,
                source=item.source,
                source_url=item.source_url,
                categories=item.categories or [],
                tags=item.tags or [],
                hot_value=item.hot_value,
                quality_score=item.quality_score,
                published_at=item.published_at.isoformat() if item.published_at else None
            )
            for item in items
        ]
    }


@router.get("/{topic_id}", response_model=HotTopicResponse, summary="获取热点资讯详情")
async def get_hot_topic(
    topic_id: int,
    db: Session = Depends(get_db)
):
    """获取热点资讯详情"""
    topic = db.query(HotTopic).filter(HotTopic.id == topic_id).first()
    
    if not topic:
        raise HTTPException(status_code=404, detail="热点资讯不存在")
    
    return HotTopicResponse(
        id=topic.id,
        title=topic.title,
        summary=topic.summary,
        source=topic.source,
        source_url=topic.source_url,
        categories=topic.categories or [],
        tags=topic.tags or [],
        hot_value=topic.hot_value,
        quality_score=topic.quality_score,
        published_at=topic.published_at.isoformat() if topic.published_at else None
    )


@router.post("/sync", summary="已退役：请改用离线 demo 同步脚本")
async def sync_hot_topics():
    raise HTTPException(
        status_code=410,
        detail="热点演示数据同步已从正式 API 退役，请改用 `npm.cmd run demo:sync`。",
    )


@router.post("/crawl/{platform}", response_model=CrawlerStatusResponse, summary="手动触发爬虫")
async def crawl_hot_topics(
    platform: str,
    db: Session = Depends(get_db)
):
    """手动触发指定平台的热点爬虫
    
    支持平台: weibo, zhihu, toutiao
    """
    from app.services.crawler.hot_topic_aggregator import HotTopicAggregator
    
    valid_platforms = ["weibo", "zhihu", "toutiao"]
    if platform not in valid_platforms:
        raise HTTPException(
            status_code=400, 
            detail=f"不支持的平台: {platform}。支持的平台: {', '.join(valid_platforms)}"
        )
    
    aggregator = HotTopicAggregator(db)
    result = await aggregator.fetch_and_save(platform)
    
    return CrawlerStatusResponse(
        success=True,
        platform=platform,
        fetched=result["fetched"],
        saved=result["saved"],
        errors=result["errors"]
    )


@router.post("/crawl-all", summary="手动触发所有平台爬虫")
async def crawl_all_hot_topics(
    db: Session = Depends(get_db)
):
    """手动触发所有平台的热点爬虫"""
    from app.services.crawler.hot_topic_aggregator import HotTopicAggregator
    
    aggregator = HotTopicAggregator(db)
    result = await aggregator.fetch_and_save_all()
    
    return {
        "success": True,
        "message": "爬取完成",
        "stats": result
    }
