from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum


class RSSCategory(str, Enum):
    AI_TECH = "ai_tech"
    BLOG = "blog"
    INDUSTRY = "industry"
    ACADEMIC = "academic"


@dataclass
class RSSSourceConfig:
    name: str
    url: str
    category: RSSCategory
    tags: Optional[List[str]] = None
    enabled: bool = True
    description: Optional[str] = None
    fetch_interval: int = 60
    
    def __post_init__(self):
        if self.tags is None:
            self.tags = []


AI_TECH_SOURCES: List[RSSSourceConfig] = [
    RSSSourceConfig(
        name="量子位",
        url="https://www.qbitai.com/feed",
        category=RSSCategory.AI_TECH,
        tags=["AI", "量子计算"],
        description="量子位AI资讯"
    ),
    RSSSourceConfig(
        name="InfoQ AI",
        url="https://www.infoq.cn/feed/topic/ai",
        category=RSSCategory.AI_TECH,
        tags=["AI", "技术"],
        description="InfoQ AI频道"
    ),
    RSSSourceConfig(
        name="OpenAI Blog",
        url="https://openai.com/blog/rss.xml",
        category=RSSCategory.AI_TECH,
        tags=["AI", "OpenAI", "GPT"],
        description="OpenAI官方博客"
    ),
    RSSSourceConfig(
        name="Google AI Blog",
        url="https://blog.google/technology/ai/rss/",
        category=RSSCategory.AI_TECH,
        tags=["AI", "Google", "深度学习"],
        description="Google AI博客"
    ),
]

BLOG_SOURCES: List[RSSSourceConfig] = [
    RSSSourceConfig(
        name="阮一峰的网络日志",
        url="https://www.ruanyifeng.com/blog/atom.xml",
        category=RSSCategory.BLOG,
        tags=["技术", "科技"],
        description="阮一峰科技博客"
    ),
    RSSSourceConfig(
        name="美团技术团队",
        url="https://tech.meituan.com/feed/",
        category=RSSCategory.BLOG,
        tags=["技术", "后端", "架构"],
        description="美团技术博客"
    ),
    RSSSourceConfig(
        name="字节跳动技术团队",
        url="https://blog.bytebytego.com/feed",
        category=RSSCategory.BLOG,
        tags=["技术", "架构"],
        description="字节跳动技术博客"
    ),
]

INDUSTRY_SOURCES: List[RSSSourceConfig] = [
    RSSSourceConfig(
        name="36氪",
        url="https://36kr.com/feed",
        category=RSSCategory.INDUSTRY,
        tags=["创业", "投资", "科技"],
        description="36氪科技资讯"
    ),
    RSSSourceConfig(
        name="少数派",
        url="https://sspai.com/feed",
        category=RSSCategory.INDUSTRY,
        tags=["效率", "工具", "数码"],
        description="少数派数字生活"
    ),
    RSSSourceConfig(
        name="虎嗅",
        url="https://www.huxiu.com/rss/0.xml",
        category=RSSCategory.INDUSTRY,
        tags=["商业", "科技"],
        description="虎嗅商业资讯"
    ),
]

ACADEMIC_SOURCES: List[RSSSourceConfig] = [
    RSSSourceConfig(
        name="arXiv AI",
        url="http://export.arxiv.org/api/query?search_query=cat:cs.AI&start=0&max_results=50&sortBy=lastUpdatedDate&sortOrder=descending",
        category=RSSCategory.ACADEMIC,
        tags=["学术", "AI", "论文"],
        description="arXiv AI最新论文",
        fetch_interval=120
    ),
    RSSSourceConfig(
        name="arXiv Machine Learning",
        url="http://export.arxiv.org/api/query?search_query=cat:cs.LG&start=0&max_results=50&sortBy=lastUpdatedDate&sortOrder=descending",
        category=RSSCategory.ACADEMIC,
        tags=["学术", "机器学习", "论文"],
        description="arXiv机器学习论文",
        fetch_interval=120
    ),
    RSSSourceConfig(
        name="arXiv NLP",
        url="http://export.arxiv.org/api/query?search_query=cat:cs.CL&start=0&max_results=50&sortBy=lastUpdatedDate&sortOrder=descending",
        category=RSSCategory.ACADEMIC,
        tags=["学术", "NLP", "论文"],
        description="arXiv自然语言处理论文",
        fetch_interval=120
    ),
]

ALL_RSS_SOURCES: List[RSSSourceConfig] = (
    AI_TECH_SOURCES + BLOG_SOURCES + INDUSTRY_SOURCES + ACADEMIC_SOURCES
)


def get_sources_by_category(category: RSSCategory) -> List[RSSSourceConfig]:
    return [s for s in ALL_RSS_SOURCES if s.category == category and s.enabled]


def get_enabled_sources() -> List[RSSSourceConfig]:
    return [s for s in ALL_RSS_SOURCES if s.enabled]
