import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger
import httpx
import feedparser
from dateutil import parser as date_parser
import re

from app.crawler.sources.rss_sources import RSSSourceConfig


class RSSParser:
    """RSS解析器"""
    
    def __init__(self, config: RSSSourceConfig):
        self.config = config
        self.client: Optional[httpx.AsyncClient] = None
        self.articles: List[Dict[str, Any]] = []
        self.errors: List[Dict[str, Any]] = []
    
    async def __aenter__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers=self._get_headers()
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": "AI-Briefing-Assistant/1.0 (RSS Reader)",
            "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        }
    
    async def fetch(self, etag: str = None, last_modified: str = None) -> Optional[feedparser.FeedParserDict]:
        try:
            headers = self._get_headers()
            if etag:
                headers["If-None-Match"] = etag
            if last_modified:
                headers["If-Modified-Since"] = last_modified
            
            response = await self.client.get(self.config.url, headers=headers)
            
            if response.status_code == 304:
                logger.info(f"RSS源无更新: {self.config.name}")
                return None
            
            response.raise_for_status()
            
            feed = feedparser.parse(response.content)
            
            if feed.bozo and feed.bozo_exception:
                logger.warning(f"RSS解析警告: {self.config.name}, {feed.bozo_exception}")
            
            feed.etag = response.headers.get("ETag", "")
            feed.last_modified = response.headers.get("Last-Modified", "")
            
            logger.info(f"获取RSS成功: {self.config.name}, {len(feed.entries)}条")
            return feed
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP错误: {self.config.name}, status={e.response.status_code}")
            self.errors.append({"type": "http_error", "message": str(e), "time": datetime.now().isoformat()})
            return None
        except Exception as e:
            logger.error(f"获取RSS失败: {self.config.name}, error={e}")
            self.errors.append({"type": "fetch_error", "message": str(e), "time": datetime.now().isoformat()})
            return None
    
    def parse_entry(self, entry: feedparser.FeedParserDict) -> Dict[str, Any]:
        title = entry.get("title", "")
        if not title:
            title = entry.get("summary", "")[:100]
        
        link = entry.get("link", "")
        if not link:
            for l in entry.get("links", []):
                if l.get("rel") == "alternate":
                    link = l.get("href", "")
                    break
        
        summary = entry.get("summary", "") or entry.get("description", "")
        if summary:
            summary = re.sub(r'<[^>]+>', '', summary)
            summary = summary.strip()[:500]
        
        content = ""
        if "content" in entry:
            for c in entry["content"]:
                content += c.get("value", "")
        elif "summary_detail" in entry:
            content = entry["summary_detail"].get("value", "")
        
        author = ""
        if "author" in entry:
            author = entry["author"]
        elif "authors" in entry and entry["authors"]:
            author = entry["authors"][0].get("name", "")
        
        publish_time = None
        if "published_parsed" in entry and entry["published_parsed"]:
            publish_time = datetime(*entry["published_parsed"][:6])
        elif "published" in entry:
            try:
                publish_time = date_parser.parse(entry["published"])
            except Exception:
                pass
        elif "updated_parsed" in entry and entry["updated_parsed"]:
            publish_time = datetime(*entry["updated_parsed"][:6])
        
        tags = []
        if "tags" in entry:
            for tag in entry["tags"]:
                term = tag.get("term", "") or tag.get("label", "")
                if term:
                    tags.append(term)
        
        guid = entry.get("id", "") or entry.get("guid", "") or link
        
        return {
            "title": title,
            "summary": summary,
            "content": content,
            "source_name": self.config.name,
            "source_url": link,
            "author": author,
            "category": self.config.category,
            "tags": list(set(tags + (self.config.tags or []))),
            "publish_time": publish_time,
            "guid": guid,
            "fetch_time": datetime.now(),
            "raw_data": dict(entry) if entry else None
        }
    
    async def run(self, etag: str = None, last_modified: str = None) -> Dict[str, Any]:
        logger.info(f"开始解析RSS: {self.config.name}")
        
        feed = await self.fetch(etag, last_modified)
        
        if not feed:
            return {"articles": [], "etag": etag, "last_modified": last_modified, "errors": self.errors}
        
        for entry in feed.entries:
            try:
                article = self.parse_entry(entry)
                if article["title"] and article["source_url"]:
                    self.articles.append(article)
            except Exception as e:
                logger.error(f"解析条目失败: {e}")
                self.errors.append({"type": "parse_error", "message": str(e), "time": datetime.now().isoformat()})
        
        logger.info(f"RSS解析完成: {self.config.name}, {len(self.articles)}条文章")
        
        return {
            "articles": self.articles,
            "etag": getattr(feed, "etag", ""),
            "last_modified": getattr(feed, "last_modified", ""),
            "errors": self.errors
        }
