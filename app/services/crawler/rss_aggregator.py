from typing import List, Dict, Any
from datetime import datetime
from loguru import logger
from sqlalchemy.orm import Session

from app.crawler.rss_parser import RSSParser
from app.crawler.sources.rss_sources import ALL_RSS_SOURCES, RSSSourceConfig
from app.models.rss_source import RSSSource
from app.models.rss_article import RSSArticle


class RSSAggregator:
    """RSS聚合服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    async def sync_sources(self):
        """同步RSS源配置到数据库"""
        for config in ALL_RSS_SOURCES:
            existing = self.db.query(RSSSource).filter(
                RSSSource.url == config.url
            ).first()
            
            if existing:
                existing.name = config.name
                existing.category = config.category.value if hasattr(config.category, 'value') else config.category
                existing.tags = config.tags
                existing.description = config.description
                existing.fetch_interval = config.fetch_interval
                existing.enabled = config.enabled
            else:
                source = RSSSource(
                    name=config.name,
                    url=config.url,
                    category=config.category.value if hasattr(config.category, 'value') else config.category,
                    tags=config.tags or [],
                    description=config.description,
                    fetch_interval=config.fetch_interval,
                    enabled=config.enabled
                )
                self.db.add(source)
        
        self.db.commit()
        logger.info("RSS源配置同步完成")
    
    async def fetch_source(self, source: RSSSource) -> Dict[str, int]:
        """获取单个RSS源"""
        stats = {"total": 0, "created": 0, "updated": 0, "errors": 0}
        
        from app.crawler.sources.rss_sources import RSSCategory
        category = source.category
        if isinstance(category, str):
            try:
                category = RSSCategory(category)
            except ValueError:
                pass
        
        config = RSSSourceConfig(
            name=source.name,
            url=source.url,
            category=category,
            tags=source.tags,
            description=source.description or "",
            fetch_interval=source.fetch_interval,
            enabled=source.enabled
        )
        
        async with RSSParser(config) as parser:
            result = await parser.run(
                etag=source.last_etag,
                last_modified=source.last_modified
            )
        
        stats["total"] = len(result["articles"])
        stats["errors"] = len(result["errors"])
        
        for article_data in result["articles"]:
            try:
                saved = await self._save_article(source.id, article_data)
                if saved == "created":
                    stats["created"] += 1
                elif saved == "updated":
                    stats["updated"] += 1
            except Exception as e:
                logger.error(f"保存文章失败: {e}")
                stats["errors"] += 1
        
        source.last_fetch_time = datetime.now()
        source.last_etag = result["etag"]
        source.last_modified = result["last_modified"]
        source.fetch_count += 1
        source.total_articles = self.db.query(RSSArticle).filter(
            RSSArticle.source_id == source.id
        ).count()
        
        if result["errors"]:
            source.error_count += 1
            source.last_error = str(result["errors"][-1])
        
        self.db.commit()
        
        logger.info(f"RSS源获取完成: {source.name}, {stats}")
        return stats
    
    async def _save_article(self, source_id: int, article_data: Dict[str, Any]) -> str:
        """保存文章，返回 'created' | 'updated' | 'skipped'"""
        guid = article_data.get("guid")
        existing = None
        
        if guid:
            existing = self.db.query(RSSArticle).filter(
                RSSArticle.guid == guid
            ).first()
        
        if not existing:
            existing = self.db.query(RSSArticle).filter(
                RSSArticle.source_url == article_data["source_url"]
            ).first()
        
        if existing:
            changed = False
            for key, value in article_data.items():
                if value is not None and hasattr(existing, key):
                    old_value = getattr(existing, key)
                    if old_value != value:
                        setattr(existing, key, value)
                        changed = True
            
            if changed:
                return "updated"
            return "skipped"
        else:
            article = RSSArticle(
                source_id=source_id,
                **article_data
            )
            self.db.add(article)
            return "created"
    
    async def fetch_all(self, category: str = None) -> Dict[str, Any]:
        """获取所有启用的RSS源"""
        query = self.db.query(RSSSource).filter(RSSSource.enabled == True)
        
        if category:
            query = query.filter(RSSSource.category == category)
        
        sources = query.all()
        
        total_stats = {
            "sources_count": len(sources),
            "total": 0,
            "created": 0,
            "updated": 0,
            "errors": 0
        }
        
        for source in sources:
            stats = await self.fetch_source(source)
            total_stats["total"] += stats["total"]
            total_stats["created"] += stats["created"]
            total_stats["updated"] += stats["updated"]
            total_stats["errors"] += stats["errors"]
        
        logger.info(f"RSS聚合完成: {total_stats}")
        return total_stats
    
    async def fetch_by_category(self, category: str) -> Dict[str, Any]:
        """按分类获取RSS源"""
        return await self.fetch_all(category)
