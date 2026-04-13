from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger
from sqlalchemy.orm import Session

from app.crawler.hot_topic_crawler import HotTopicItem
from app.crawler.platform_crawlers import (
    WeiboHotTopicCrawler,
    ZhihuHotTopicCrawler,
    ToutiaoHotTopicCrawler
)
from app.models.hot_topic import HotTopic


class HotTopicAggregator:
    """热点聚合服务"""
    
    CRAWLERS = {
        "weibo": WeiboHotTopicCrawler,
        "zhihu": ZhihuHotTopicCrawler,
        "toutiao": ToutiaoHotTopicCrawler,
    }
    
    def __init__(self, db: Session):
        self.db = db
    
    async def fetch_platform(self, platform: str) -> Dict[str, Any]:
        """获取单个平台热点"""
        crawler_class = self.CRAWLERS.get(platform)
        
        if not crawler_class:
            logger.error(f"未知平台: {platform}")
            return {"platform": platform, "topics": [], "count": 0, "errors": [{"message": "未知平台"}]}
        
        async with crawler_class() as crawler:
            result = await crawler.run()
        
        return result
    
    async def fetch_all(self, platforms: List[str] = None) -> Dict[str, Any]:
        """获取所有平台热点"""
        if platforms is None:
            platforms = list(self.CRAWLERS.keys())
        
        total_stats = {
            "platforms": {},
            "total_count": 0,
            "total_errors": 0
        }
        
        for platform in platforms:
            result = await self.fetch_platform(platform)
            total_stats["platforms"][platform] = {
                "count": result["count"],
                "errors": len(result["errors"])
            }
            total_stats["total_count"] += result["count"]
            total_stats["total_errors"] += len(result["errors"])
        
        logger.info(f"热点聚合完成: {total_stats}")
        return total_stats
    
    async def fetch_and_save(self, platform: str) -> Dict[str, Any]:
        """获取并保存热点到数据库"""
        result = await self.fetch_platform(platform)
        
        saved_count = 0
        for topic in result["topics"]:
            try:
                saved = self._save_topic(topic)
                if saved:
                    saved_count += 1
            except Exception as e:
                logger.error(f"保存热点失败: {e}")
        
        self.db.commit()
        
        return {
            "platform": platform,
            "fetched": result["count"],
            "saved": saved_count,
            "errors": result["errors"]
        }
    
    async def fetch_and_save_all(self, platforms: List[str] = None) -> Dict[str, Any]:
        """获取并保存所有平台热点"""
        if platforms is None:
            platforms = list(self.CRAWLERS.keys())
        
        total_stats = {
            "platforms": {},
            "total_fetched": 0,
            "total_saved": 0,
            "total_errors": 0
        }
        
        for platform in platforms:
            result = await self.fetch_and_save(platform)
            total_stats["platforms"][platform] = {
                "fetched": result["fetched"],
                "saved": result["saved"]
            }
            total_stats["total_fetched"] += result["fetched"]
            total_stats["total_saved"] += result["saved"]
            total_stats["total_errors"] += len(result["errors"])
        
        logger.info(f"热点保存完成: {total_stats}")
        return total_stats
    
    def _save_topic(self, topic: HotTopicItem) -> bool:
        """保存热点到数据库"""
        existing = self.db.query(HotTopic).filter(
            HotTopic.source_url == topic.source_url
        ).first()
        
        if existing:
            existing.hot_value = topic.hot_value
            existing.fetched_at = datetime.now()
            if topic.summary:
                existing.summary = topic.summary
            return True
        
        hot_topic = HotTopic(
            title=topic.title,
            summary=topic.summary,
            source=topic.source,
            source_url=topic.source_url,
            hot_value=topic.hot_value,
            categories=topic.categories,
            tags=topic.tags,
            published_at=topic.published_at,
            raw_data=topic.raw_data
        )
        
        self.db.add(hot_topic)
        return True
    
    def get_topics(
        self,
        platform: str = None,
        limit: int = 20,
        offset: int = 0,
        min_hot_value: int = 0
    ) -> List[Dict[str, Any]]:
        """获取热点列表"""
        query = self.db.query(HotTopic)
        
        if platform:
            source_map = {
                "weibo": "微博热搜",
                "zhihu": "知乎热榜",
                "toutiao": "今日头条",
                "baidu": "百度热搜"
            }
            source = source_map.get(platform, platform)
            query = query.filter(HotTopic.source == source)
        
        if min_hot_value > 0:
            query = query.filter(HotTopic.hot_value >= min_hot_value)
        
        topics = query.order_by(
            HotTopic.hot_value.desc()
        ).offset(offset).limit(limit).all()
        
        return [
            {
                "id": t.id,
                "title": t.title,
                "summary": t.summary,
                "source": t.source,
                "source_url": t.source_url,
                "hot_value": t.hot_value,
                "categories": t.categories or [],
                "tags": t.tags or [],
                "published_at": t.published_at.isoformat() if t.published_at else None
            }
            for t in topics
        ]
