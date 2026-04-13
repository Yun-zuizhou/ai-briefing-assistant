from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.config import settings
from app.models.rss_article import RSSArticle
from app.models.rss_source import RSSSource
from app.services.article_processing_result_store import get_or_create_article_processing_results
from app.services.content_result import (
    observe_article_processing_result,
    project_article_result_payload,
)
from app.services.d1_article_processing_result_store import D1ArticleProcessingResultStore
from app.services.d1_content_store import D1ContentStore


class RSSRecommender:
    """RSS文章推荐服务"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_hot_articles(
        self,
        hours: int = 24,
        limit: int = 5,
        categories: List[str] = None
    ) -> List[Dict[str, Any]]:
        """获取热门文章"""
        if settings.D1_USE_CLOUD_AS_SOURCE:
            content_store = D1ContentStore()
            result_store = D1ArticleProcessingResultStore()
            articles = content_store.list_articles(limit=limit, category=categories[0] if categories and len(categories) == 1 else None)
            article_results = result_store.get_or_create_article_results(articles)
            payloads = [
                (
                    lambda result_row: (
                        observe_article_processing_result(result_row, source="briefing.hot.d1"),
                        project_article_result_payload(result_row, article),
                    )[1]
                )(article_results[int(article.id)])
                for article in articles
            ]
            return [
                {
                    "title": payload["title"],
                    "summary": payload["summary"][:200] if payload["summary"] else "",
                    "source": payload["source_name"],
                    "url": payload["source_url"],
                    "publish_time": payload["publish_time"],
                    "tags": payload["tags"],
                }
                for payload in payloads
            ]

        query = self.db.query(RSSArticle).filter(
            RSSArticle.fetch_time >= datetime.now() - timedelta(hours=hours)
        )
        
        if categories:
            query = query.filter(RSSArticle.category.in_(categories))
        
        articles = query.order_by(
            RSSArticle.quality_score.desc(),
            RSSArticle.publish_time.desc()
        ).limit(limit).all()
        article_results = get_or_create_article_processing_results(self.db, articles)
        
        payloads = [
            (
                lambda result_row: (
                    observe_article_processing_result(result_row, source="briefing.hot"),
                    project_article_result_payload(result_row, a),
                )[1]
            )(article_results[int(a.id)])
            for a in articles
        ]
        
        return [
            {
                "title": payload["title"],
                "summary": payload["summary"][:200] if payload["summary"] else "",
                "source": payload["source_name"],
                "url": payload["source_url"],
                "publish_time": payload["publish_time"],
                "tags": payload["tags"],
            }
            for payload in payloads
        ]
    
    def get_articles_by_tags(
        self,
        tags: List[str],
        hours: int = 48,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """按标签获取文章"""
        if settings.D1_USE_CLOUD_AS_SOURCE:
            content_store = D1ContentStore()
            result_store = D1ArticleProcessingResultStore()
            articles = content_store.list_articles(limit=max(limit * 3, 20))
            scored_articles = []
            for article in articles:
                article_tags = set(article.tags or [])
                match_score = len(article_tags & set(tags))
                if match_score > 0:
                    scored_articles.append((match_score, article))
            scored_articles.sort(key=lambda x: (-x[0], x[1].publish_time or datetime.min))
            selected_articles = [article for _, article in scored_articles[:limit]]
            article_results = result_store.get_or_create_article_results(selected_articles)
            payloads = [
                (
                    lambda result_row: (
                        observe_article_processing_result(result_row, source="briefing.tags.d1"),
                        project_article_result_payload(result_row, article),
                    )[1]
                )(article_results[int(article.id)])
                for article in selected_articles
            ]
            return [
                {
                    "title": payload["title"],
                    "summary": payload["summary"][:200] if payload["summary"] else "",
                    "source": payload["source_name"],
                    "url": payload["source_url"],
                    "publish_time": payload["publish_time"],
                    "tags": payload["tags"],
                    "match_tags": list(set(payload["tags"] or []) & set(tags)),
                }
                for payload in payloads
            ]

        articles = self.db.query(RSSArticle).filter(
            RSSArticle.fetch_time >= datetime.now() - timedelta(hours=hours)
        ).all()
        
        scored_articles = []
        for article in articles:
            article_tags = set(article.tags or [])
            match_score = len(article_tags & set(tags))
            if match_score > 0:
                scored_articles.append((match_score, article))
        
        scored_articles.sort(key=lambda x: (-x[0], x[1].publish_time or datetime.min))
        selected_articles = [article for _, article in scored_articles[:limit]]
        article_results = get_or_create_article_processing_results(self.db, selected_articles)
        
        payloads = [
            (
                lambda result_row: (
                    observe_article_processing_result(result_row, source="briefing.tags"),
                    project_article_result_payload(result_row, a),
                )[1]
            )(article_results[int(a.id)])
            for a in selected_articles
        ]
        
        return [
            {
                "title": payload["title"],
                "summary": payload["summary"][:200] if payload["summary"] else "",
                "source": payload["source_name"],
                "url": payload["source_url"],
                "publish_time": payload["publish_time"],
                "tags": payload["tags"],
                "match_tags": list(set(payload["tags"] or []) & set(tags))
            }
            for payload in payloads
        ]
    
    def get_articles_for_briefing(
        self,
        user_interests: List[str] = None,
        limit_per_category: int = 3
    ) -> Dict[str, List[Dict[str, Any]]]:
        """为简报获取文章"""
        result = {}
        
        category_names = {
            "ai_tech": "AI技术",
            "blog": "技术博客",
            "industry": "行业资讯",
            "academic": "学术动态"
        }
        
        for category, name in category_names.items():
            articles = self.get_hot_articles(
                hours=24,
                limit=limit_per_category,
                categories=[category]
            )
            if articles:
                result[name] = articles
        
        if user_interests:
            personalized = self.get_articles_by_tags(
                tags=user_interests,
                hours=48,
                limit=5
            )
            if personalized:
                result["为你推荐"] = personalized
        
        return result
