from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from loguru import logger
import httpx
import asyncio
import random


@dataclass
class HotTopicItem:
    title: str
    summary: str
    source: str
    source_url: str
    hot_value: int = 0
    categories: List[str] = field(default_factory=lambda: ["社会", "热点"])
    tags: List[str] = field(default_factory=list)
    published_at: Optional[datetime] = None
    raw_data: Optional[Dict[str, Any]] = None


class ComplianceChecker:
    """合规性检查器"""
    
    RULES = {
        "weibo": {
            "robots_txt": "https://weibo.com/robots.txt",
            "allowed_paths": ["/ajax/", "/hot", "/search"],
            "rate_limit": 2.0,
            "description": "微博热搜"
        },
        "zhihu": {
            "robots_txt": "https://www.zhihu.com/robots.txt",
            "allowed_paths": ["/api/v3/", "/hot"],
            "rate_limit": 2.0,
            "description": "知乎热榜"
        },
        "toutiao": {
            "robots_txt": "https://www.toutiao.com/robots.txt",
            "allowed_paths": ["/"],
            "rate_limit": 3.0,
            "description": "今日头条"
        },
        "baidu": {
            "robots_txt": "https://www.baidu.com/robots.txt",
            "allowed_paths": ["/"],
            "rate_limit": 2.0,
            "description": "百度热搜"
        }
    }
    
    def __init__(self, platform: str):
        self.platform = platform
        self.rules = self.RULES.get(platform, {})
    
    async def check_robots_txt(self, client: httpx.AsyncClient) -> bool:
        try:
            robots_url = self.rules.get("robots_txt")
            if not robots_url:
                return True
            
            response = await client.get(robots_url, timeout=10.0)
            if response.status_code == 200:
                content = response.text.lower()
                if "disallow: /" in content and "user-agent: *" in content:
                    logger.warning(f"{self.platform} robots.txt 可能禁止爬取")
                    return False
            return True
        except Exception as e:
            logger.warning(f"检查robots.txt失败: {self.platform}, {e}")
            return True
    
    def get_rate_limit(self) -> float:
        return self.rules.get("rate_limit", 2.0)
    
    def is_allowed_path(self, path: str) -> bool:
        allowed = self.rules.get("allowed_paths", [])
        return any(path.startswith(p) for p in allowed)


class BaseHotTopicCrawler:
    """热点爬虫基类"""
    
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ]
    
    def __init__(self):
        self.platform: str = "base"
        self.client: Optional[httpx.AsyncClient] = None
        self.compliance: Optional[ComplianceChecker] = None
        self.topics: List[HotTopicItem] = []
        self.errors: List[Dict[str, Any]] = []
    
    async def __aenter__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers=self._get_headers()
        )
        self.compliance = ComplianceChecker(self.platform)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.client:
            await self.client.aclose()
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": random.choice(self.USER_AGENTS),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Cache-Control": "max-age=0",
        }
    
    def _get_api_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": random.choice(self.USER_AGENTS),
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "X-Requested-With": "XMLHttpRequest",
        }
    
    async def _rate_limit(self):
        delay = self.compliance.get_rate_limit() if self.compliance else 2.0
        jitter = random.uniform(0.5, 1.5)
        await asyncio.sleep(delay * jitter)
    
    async def fetch(self) -> List[HotTopicItem]:
        raise NotImplementedError
    
    async def run(self) -> Dict[str, Any]:
        logger.info(f"开始爬取: {self.platform}")
        
        try:
            topics = await self.fetch()
            self.topics = topics
            logger.info(f"爬取完成: {self.platform}, {len(topics)}条热点")
        except Exception as e:
            logger.error(f"爬取失败: {self.platform}, {e}")
            self.errors.append({
                "type": "fetch_error",
                "message": str(e),
                "time": datetime.now().isoformat()
            })
        
        return {
            "platform": self.platform,
            "topics": self.topics,
            "count": len(self.topics),
            "errors": self.errors
        }
