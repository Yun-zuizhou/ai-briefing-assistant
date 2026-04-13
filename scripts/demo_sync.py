from __future__ import annotations

from pathlib import Path

from app.database import SessionLocal
from app.models.hot_topic import HotTopic
from app.models.opportunity import Opportunity, OpportunityStatus
from app.services.data import mock_data_writer


ROOT = Path(__file__).resolve().parents[1]


def sync_hot_topics() -> dict[str, int]:
    db = SessionLocal()
    try:
        topics = db.query(HotTopic).filter(HotTopic.quality_score >= 0.5).all()
        payload = [
            {
                "id": item.id,
                "title": item.title,
                "summary": item.summary,
                "source": item.source,
                "source_url": item.source_url,
                "categories": item.categories or [],
                "tags": item.tags or [],
                "hot_value": item.hot_value,
                "quality_score": item.quality_score,
                "published_at": item.published_at.isoformat() if item.published_at else None,
                "hot_comments": item.hot_comments or [],
                "guide_questions": item.guide_questions or [],
            }
            for item in topics
        ]
        return mock_data_writer.write_hot_topics(payload)
    finally:
        db.close()


def sync_opportunities() -> dict[str, int]:
    db = SessionLocal()
    try:
        opportunities = db.query(Opportunity).filter(
            Opportunity.quality_score >= 0.5,
            Opportunity.status == OpportunityStatus.ACTIVE,
        ).all()
        payload = [
            {
                "id": item.id,
                "title": item.title,
                "type": item.type.value if item.type else "",
                "source": item.source,
                "source_url": item.source_url,
                "summary": item.summary,
                "content": item.content,
                "reward": item.reward,
                "location": item.location,
                "is_remote": item.is_remote,
                "deadline": item.deadline.isoformat() if item.deadline else None,
                "tags": item.tags or [],
                "quality_score": item.quality_score,
                "published_at": item.published_at.isoformat() if item.published_at else None,
            }
            for item in opportunities
        ]
        return mock_data_writer.write_opportunities(payload)
    finally:
        db.close()


def main() -> None:
    print(f"同步演示数据目录: {ROOT / 'prototype' / 'demo' / 'mock-data'}")
    hot_topic_stats = sync_hot_topics()
    opportunity_stats = sync_opportunities()
    print(f"热点演示数据同步完成: {hot_topic_stats}")
    print(f"机会演示数据同步完成: {opportunity_stats}")


if __name__ == "__main__":
    main()
