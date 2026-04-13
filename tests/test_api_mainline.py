import os
import json
import shutil
import tempfile
from datetime import datetime, timedelta
from pathlib import Path

import pytest


fastapi = pytest.importorskip("fastapi")
pytest.importorskip("httpx")
pytest.importorskip("sqlalchemy")

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.v1 import preferences
from app.api.v1.preferences import _build_growth_overview_profile_snapshot
from app.database import Base, get_db
from app.main import app
from app.models.briefing import Briefing
from app.models.favorite import Favorite
from app.models.chat_message import ChatMessage
from app.models.chat_session import ChatSession
from app.models.history import HistoryEntry
from app.models.hot_topic import HotTopic
from app.models.hot_topic_processing_result import HotTopicProcessingResult
from app.models.note import Note
from app.models.opportunity import Opportunity, OpportunityStatus, OpportunityType
from app.models.opportunity_follow import OpportunityFollow
from app.models.article_processing_result import ArticleProcessingResult
from app.models.rss_article import RSSArticle
from app.models.todo import Todo, TodoPriority, TodoStatus
from app.models.user import User
from app.models.user_interest import UserInterest
from app.services.report_store import upsert_report_result


@pytest.fixture()
def api_client(monkeypatch):
    fd, raw_path = tempfile.mkstemp(prefix="codex-api-mainline-", suffix=".db", dir=tempfile.gettempdir())
    os.close(fd)
    Path(raw_path).unlink(missing_ok=True)
    db_path = Path(raw_path).resolve()
    engine = create_engine(
        f"sqlite:///{db_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    testing_session_local = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = testing_session_local()
        try:
            yield db
        finally:
            db.close()

    monkeypatch.setattr("app.main.rss_scheduler.start", lambda: None)
    monkeypatch.setattr("app.main.rss_scheduler.stop", lambda: None)
    monkeypatch.setattr(preferences, "engine", engine)
    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as client:
        yield client, testing_session_local

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    Path(raw_path).unlink(missing_ok=True)


def _seed_mainline_data(session_factory):
    now = datetime.now()
    db = session_factory()
    try:
        user = User(
            id=1,
            username="tester",
            email="tester@example.com",
            hashed_password="hashed",
            interests=json.dumps(["旧兴趣", "应被表覆盖"], ensure_ascii=False),
        )
        db.add(user)
        db.flush()

        db.add_all(
            [
                UserInterest(user_id=1, interest_name="AI", status="active"),
                UserInterest(user_id=1, interest_name="写作", status="active"),
                UserInterest(user_id=1, interest_name="应忽略", status="inactive"),
            ]
        )

        db.add_all(
            [
                HotTopic(
                    id=1,
                    title="AI 写作工具迎来新一轮升级",
                    summary="聚焦 AI 与写作效率提升。",
                    content="这是一篇关于 AI 写作工具的完整内容。",
                    source="新闻源",
                    source_url="https://example.com/hot-topics/1",
                    author="编辑部",
                    categories=["AI", "写作"],
                    tags=["AI", "写作"],
                    hot_value=95,
                    quality_score=9.2,
                    published_at=now - timedelta(hours=2),
                ),
                HotTopic(
                    id=2,
                    title="AI 行业观察",
                    summary="补充阅读项。",
                    content="第二条热点正文。",
                    source="新闻源",
                    source_url="https://example.com/hot-topics/2",
                    categories=["AI"],
                    tags=["AI", "行业"],
                    hot_value=88,
                    quality_score=8.4,
                    published_at=now - timedelta(hours=4),
                ),
            ]
        )

        db.add_all(
            [
                RSSArticle(
                    id=1,
                    title="写作方法论与 AI 协作",
                    summary="从选题到成稿的协作建议。",
                    content="文章正文：如何把 AI 接入写作流程。",
                    source_id=1,
                    source_name="博客",
                    source_url="https://example.com/articles/1",
                    author="作者A",
                    category="写作",
                    tags=["AI", "写作"],
                    publish_time=now - timedelta(days=1),
                    quality_score=8.8,
                )
            ]
        )

        db.add_all(
            [
                Opportunity(
                    id=1,
                    title="AI 写作训练营征稿",
                    type=OpportunityType.WRITING_SUBMISSION,
                    status=OpportunityStatus.ACTIVE,
                    source="机会站",
                    source_url="https://example.com/opportunities/1",
                    content="机会正文：适合关注 AI 写作的人投稿。",
                    summary="面向 AI 与写作方向的征稿机会。",
                    reward="500元",
                    is_remote=1,
                    category="写作",
                    tags=["AI", "写作"],
                    quality_score=8.9,
                    published_at=now - timedelta(hours=6),
                    deadline=now + timedelta(days=7),
                ),
                Opportunity(
                    id=2,
                    title="数据分析兼职",
                    type=OpportunityType.PART_TIME_JOB,
                    status=OpportunityStatus.ACTIVE,
                    source="机会站",
                    source_url="https://example.com/opportunities/2",
                    content="机会正文：与主题弱相关。",
                    summary="数据方向兼职。",
                    reward="800元",
                    is_remote=0,
                    category="数据",
                    tags=["数据"],
                    quality_score=7.1,
                    published_at=now - timedelta(hours=10),
                    deadline=now + timedelta(days=10),
                ),
            ]
        )

        db.add_all(
            [
                Note(
                    user_id=1,
                    content="这周重点关注 AI 写作的工作流设计。",
                    source_type="manual",
                    tags=["AI", "写作"],
                    created_at=now - timedelta(days=1),
                ),
                Favorite(
                    user_id=1,
                    item_type="hot_topic",
                    item_id=1,
                    item_title="AI 写作工具迎来新一轮升级",
                    item_summary="收藏摘要",
                    item_source="新闻源",
                    item_url="https://example.com/hot-topics/1",
                    created_at=now - timedelta(days=1),
                ),
                HistoryEntry(
                    user_id=1,
                    event_type="read",
                    title="AI 写作工具迎来新一轮升级",
                    summary="历史摘要",
                    ref_type="hot_topic",
                    ref_id=1,
                    created_at=now,
                ),
                Todo(
                    user_id=1,
                    content="跟进 AI 写作训练营征稿",
                    status=TodoStatus.COMPLETED,
                    priority=TodoPriority.HIGH,
                    related_type="opportunity",
                    related_id=1,
                    related_title="AI 写作训练营征稿",
                    created_at=now - timedelta(days=2),
                    completed_at=now - timedelta(days=1),
                ),
                OpportunityFollow(
                    user_id=1,
                    opportunity_id=1,
                    status="watching",
                    note="已看过要求，准备本周提交",
                    next_step="整理投稿提纲",
                ),
            ]
        )

        db.commit()
    finally:
        db.close()


def test_dashboard_today_api_returns_mainline_blocks_and_content_refs(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.get("/api/v1/dashboard/today", params={"user_id": 1})

    assert response.status_code == 200
    data = response.json()
    assert "recommendedForYou" in data
    assert "worthKnowing" in data
    assert "worthActing" in data
    assert data["recommendedForYou"]
    assert data["recommendedForYou"][0]["interestName"] == "AI"
    assert data["recommendedForYou"][0]["topItems"][0]["contentRef"].startswith("hot_topic:")
    assert data["recommendedForYou"][0]["topItems"][0]["processingStage"] == "ranked"
    assert data["worthKnowing"][0]["contentRef"].startswith("hot_topic:")
    assert data["worthActing"][0]["contentRef"].startswith("opportunity:")

    db = session_factory()
    try:
        rows = (
            db.query(HotTopicProcessingResult)
            .filter(HotTopicProcessingResult.source_hot_topic_id.in_([1, 2]))
            .all()
        )
        assert len(rows) >= 2
        assert any(row.source_content_ref == "hot_topic:1" for row in rows)
    finally:
        db.close()


def test_content_by_ref_api_returns_detail_and_related_items(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.get("/api/v1/content/by-ref", params={"content_ref": "opportunity:1"})

    assert response.status_code == 200
    data = response.json()
    assert data["contentRef"] == "opportunity:1"
    assert data["contentType"] == "opportunity"
    assert "AI 写作" in data["content"]
    assert data["detailState"] == "transitional"
    assert data["relatedItems"]
    assert any(item["contentRef"].startswith("hot_topic:") for item in data["relatedItems"])


def test_content_by_ref_hot_topic_local_path_persists_processing_result(api_client, monkeypatch):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)
    monkeypatch.setenv("D1_USE_CLOUD_AS_SOURCE", "false")
    monkeypatch.setattr("app.api.v1.content.settings.D1_USE_CLOUD_AS_SOURCE", False)

    response = client.get("/api/v1/content/by-ref", params={"content_ref": "hot_topic:1"})

    assert response.status_code == 200
    data = response.json()
    assert data["contentRef"] == "hot_topic:1"
    assert data["contentType"] == "hot_topic"

    db = session_factory()
    try:
        rows = (
            db.query(HotTopicProcessingResult)
            .filter(HotTopicProcessingResult.source_hot_topic_id == 1)
            .all()
        )
        assert len(rows) == 1
        assert rows[0].source_content_ref == "hot_topic:1"
        assert rows[0].normalized_title == "AI 写作工具迎来新一轮升级"
        assert rows[0].processing_version == "hot-topic-v1"
    finally:
        db.close()


def test_content_by_ref_article_local_path_persists_processing_result(api_client, monkeypatch):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)
    monkeypatch.setenv("D1_USE_CLOUD_AS_SOURCE", "false")
    monkeypatch.setattr("app.api.v1.content.settings.D1_USE_CLOUD_AS_SOURCE", False)

    response = client.get("/api/v1/content/by-ref", params={"content_ref": "article:1"})

    assert response.status_code == 200
    data = response.json()
    assert data["contentRef"] == "article:1"
    assert data["contentType"] == "article"

    db = session_factory()
    try:
        rows = (
            db.query(ArticleProcessingResult)
            .filter(ArticleProcessingResult.source_article_id == 1)
            .all()
        )
        assert len(rows) == 1
        assert rows[0].source_content_ref == "article:1"
        assert rows[0].normalized_title == "写作方法论与 AI 协作"
        assert rows[0].processing_version == "article-v1"
    finally:
        db.close()


def test_rss_articles_local_path_reuses_persisted_processing_results(api_client, monkeypatch):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.get("/api/v1/rss/articles", params={"limit": 5})

    assert response.status_code == 200
    data = response.json()
    assert data
    assert data[0]["title"]

    db = session_factory()
    try:
        rows = (
            db.query(ArticleProcessingResult)
            .filter(ArticleProcessingResult.source_article_id == 1)
            .all()
        )
        assert len(rows) == 1
        assert rows[0].source_content_ref == "article:1"
    finally:
        db.close()


def test_preferences_interests_api_prefers_user_interest_rows(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.get("/api/v1/preferences/interests", params={"user_id": 1})

    assert response.status_code == 200
    data = response.json()
    assert data["interests"] == ["AI", "写作"]


def test_weekly_report_api_uses_row_interests_as_primary_source(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.get("/api/v1/reports/weekly", params={"user_id": 1})

    assert response.status_code == 200
    data = response.json()
    assert data["overview"]["recorded"] == 1
    assert data["overview"]["collected"] == 1
    assert data["overview"]["completed"] == 1
    assert data["topicTrends"]
    assert data["topicTrends"][0]["title"] == "AI"
    assert data["topicTrends"][0]["hotSpot"]["contentRef"] == "hot_topic:1"
    assert any("真实笔记" in insight or "历史行为" in insight for insight in data["topicTrends"][0]["insights"])


def test_reports_api_returns_history_review_entries(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)
    db = session_factory()
    try:
        weekly_payload = {
            "report_type": "weekly",
            "overview": {"period": "2026-03-24 ~ 2026-03-30", "viewed": 4, "recorded": 2, "collected": 1, "completed": 1, "streak": 2},
            "topic_trends": [],
            "growth": {
                "stats": {"viewed": 4, "recorded": 2, "collected": 1, "completed": 1},
                "trajectory": {"title": "历史周报", "description": "上一周的回顾。", "keywords": ["AI", "写作"]},
                "selected_thoughts": [],
                "suggestions": ["继续记录"],
            },
        }
        monthly_payload = {
            "report_type": "monthly",
            "overview": {"period": "2026-03", "viewed": 10, "recorded": 5, "collected": 3, "completed": 2, "streak": 4},
            "topic_trends": [],
            "growth": {
                "stats": {"viewed": 10, "recorded": 5, "collected": 3, "completed": 2},
                "comparison": {"current": [10, 5, 3, 2], "previous": [8, 4, 2, 1], "change": [2, 1, 1, 1]},
                "trajectory": {"title": "历史月报", "description": "上个月的回顾。", "keywords": ["AI", "远程工作"]},
                "selected_thoughts": [],
                "suggestions": ["继续跟进"],
            },
        }
        annual_payload = {
            "year": 2026,
            "stats": {"topics_viewed": 30, "opinions_posted": 10, "plans_completed": 6, "days_active": 18},
            "keywords": ["AI", "写作", "回顾者"],
            "interests": ["AI", "写作", "远程工作"],
            "thinking_section": "年度思考。",
            "action_section": "年度行动。",
            "closing": "年度收尾。",
        }
        upsert_report_result(
            db,
            user_id=1,
            report_type="weekly",
            period_start="2026-03-24",
            period_end="2026-03-30",
            title="2026-03-24 回顾周报",
            summary_text="历史周报摘要",
            status="ready",
            generated_at="2026-03-30T20:00:00",
            payload=weekly_payload,
        )
        upsert_report_result(
            db,
            user_id=1,
            report_type="monthly",
            period_start="2026-03-01",
            period_end="2026-03-31",
            title="2026-03 回顾月报",
            summary_text="历史月报摘要",
            status="ready",
            generated_at="2026-03-31T21:00:00",
            payload=monthly_payload,
        )
        upsert_report_result(
            db,
            user_id=1,
            report_type="annual",
            period_start="2026-01-01",
            period_end="2026-12-31",
            title="2026年度报告",
            summary_text="年度报告摘要",
            status="ready",
            generated_at="2026-12-31T23:00:00",
            payload=annual_payload,
        )
        db.commit()
    finally:
        db.close()

    response = client.get("/api/v1/reports", params={"user_id": 1})

    assert response.status_code == 200
    data = response.json()
    assert "reports" in data
    assert len(data["reports"]) == 3
    assert data["reports"][0]["reportType"] == "annual"
    assert data["reports"][0]["reportId"] is not None
    assert data["reports"][0]["generatedAt"] == "2026-12-31T23:00:00"
    assert data["reports"][1]["periodStart"] == "2026-03-01"
    assert data["reports"][1]["periodEnd"] == "2026-03-31"
    assert all(item["available"] for item in data["reports"])


def test_reports_api_can_load_historical_weekly_report_by_id(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)
    db = session_factory()
    try:
        row = upsert_report_result(
            db,
            user_id=1,
            report_type="weekly",
            period_start="2026-03-24",
            period_end="2026-03-30",
            title="2026-03-24 回顾周报",
            summary_text="历史周报摘要",
            status="ready",
            generated_at="2026-03-30T20:00:00",
            payload={
                "report_type": "weekly",
                "overview": {"period": "2026-03-24 ~ 2026-03-30", "viewed": 4, "recorded": 2, "collected": 1, "completed": 1, "streak": 2},
                "topic_trends": [],
                "growth": {
                    "stats": {"viewed": 4, "recorded": 2, "collected": 1, "completed": 1},
                    "trajectory": {"title": "历史周报", "description": "上一周的回顾。", "keywords": ["AI", "写作"]},
                    "selected_thoughts": [],
                    "suggestions": ["继续记录"],
                },
            },
        )
        db.commit()
        report_id = row.id
    finally:
        db.close()

    response = client.get("/api/v1/reports/weekly", params={"user_id": 1, "report_id": report_id})

    assert response.status_code == 200
    data = response.json()
    assert data["reportType"] == "weekly"
    assert data["overview"]["period"] == "2026-03-24 ~ 2026-03-30"


def test_actions_overview_api_returns_following_items_from_opportunity_follows(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)
    db = session_factory()
    now = datetime.now()
    try:
        db.add(
            Todo(
                user_id=1,
                content="准备下周投递材料",
                status=TodoStatus.PENDING,
                priority=TodoPriority.MEDIUM,
                deadline=now + timedelta(days=3),
                created_at=now - timedelta(hours=1),
            )
        )
        db.add(
            Todo(
                user_id=1,
                content="今天确认报名信息",
                status=TodoStatus.PENDING,
                priority=TodoPriority.HIGH,
                deadline=now,
                created_at=now,
            )
        )
        db.commit()
    finally:
        db.close()

    response = client.get("/api/v1/actions/overview", params={"user_id": 1})

    assert response.status_code == 200
    data = response.json()
    assert "todayTodos" in data
    assert "futureTodos" in data
    assert "completedTodos" in data
    assert "savedForLater" in data
    assert "followingItems" in data
    assert any(item["title"] == "今天确认报名信息" for item in data["todayTodos"])
    assert any(item["title"] == "准备下周投递材料" for item in data["futureTodos"])
    assert any(item["title"] == "跟进 AI 写作训练营征稿" for item in data["completedTodos"])
    assert data["savedForLater"]
    assert data["followingItems"]
    assert data["followingItems"][0]["title"] == "AI 写作训练营征稿"
    assert data["followingItems"][0]["followStatus"] == "watching"
    assert data["followingItems"][0]["nextStep"] == "整理投稿提纲"
    assert data["checkedInToday"] is True


def test_actions_overview_streak_uses_real_activity_not_only_history(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    db = session_factory()
    now = datetime.now()
    try:
        db.query(HistoryEntry).delete()
        db.add(
            Note(
                user_id=1,
                content="今天有真实记录动作",
                source_type="manual",
                tags=["AI"],
                created_at=now,
            )
        )
        db.commit()
    finally:
        db.close()

    response = client.get("/api/v1/actions/overview", params={"user_id": 1})

    assert response.status_code == 200
    data = response.json()
    assert data["streakDays"] >= 1


def test_actions_check_in_creates_real_backend_state(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    db = session_factory()
    try:
        db.query(HistoryEntry).delete()
        db.query(Note).delete()
        db.query(Favorite).delete()
        db.query(Todo).delete()
        db.query(OpportunityFollow).delete()
        db.commit()
    finally:
        db.close()

    before = client.get("/api/v1/actions/overview", params={"user_id": 1})
    assert before.status_code == 200
    assert before.json()["checkedInToday"] is False
    assert before.json()["streakDays"] == 0

    response = client.post("/api/v1/actions/check-in", params={"user_id": 1})

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["checkedInToday"] is True
    assert data["streakDays"] >= 1

    after = client.get("/api/v1/actions/overview", params={"user_id": 1})
    assert after.status_code == 200
    after_data = after.json()
    assert after_data["checkedInToday"] is True
    assert after_data["streakDays"] >= 1


def test_growth_overview_snapshot_falls_back_to_live_d1_keywords(monkeypatch):
    class FakeBehaviorStore:
        def get_profile_counts(self, user_id):
            assert user_id == 1
            return {
                "notes_count": 3,
                "favorites_count": 2,
                "completed_todos": 1,
                "total_todos": 4,
                "history_count": 5,
            }

        def get_user_profile(self, user_id):
            assert user_id == 1
            return {
                "persona_summary": "这是来自实时 D1 行为画像的摘要。",
                "growth_keywords": ["AI", "写作", "行动"],
            }

    monkeypatch.setattr("app.api.v1.preferences.settings.D1_USE_CLOUD_AS_SOURCE", True)
    monkeypatch.setattr("app.api.v1.preferences._maybe_load_cached_user_profile", lambda user_id, db: {
        "persona_summary": "",
        "growth_keywords": [],
    })

    counts, persona_summary, keywords = _build_growth_overview_profile_snapshot(
        user_id=1,
        db=None,
        behavior_store=FakeBehaviorStore(),
        bundle={
            "notes_count": 3,
            "favorites_count": 2,
            "completed_todos": 1,
            "total_todos": 4,
            "history_count": 5,
        },
    )

    assert counts["notes_count"] == 3
    assert persona_summary == "这是来自实时 D1 行为画像的摘要。"
    assert [item.keyword for item in keywords] == ["AI", "写作", "行动"]


def test_growth_overview_api_returns_recent_history_items(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)
    db = session_factory()
    now = datetime.now()
    try:
        db.add(
            Briefing(
                user_id=1,
                brief_date=now.strftime("%Y-%m-%d"),
                brief_type="daily",
                issue_number=128,
                title="今日简报",
                summary_text="今日要点",
                brief_payload_json=json.dumps(
                    {
                        "date_label": now.strftime("%Y年%m月%d日"),
                        "issue_number": 128,
                        "summary": {
                            "summary_title": "今日总述",
                            "summary_text": "今日要点",
                            "mood_tag": "focus",
                        },
                        "recommended_for_you": [],
                        "worth_knowing": [],
                        "worth_acting": [],
                    },
                    ensure_ascii=False,
                ),
                generated_at=now.isoformat(),
            )
        )
        db.commit()
    finally:
        db.close()

    response = client.get("/api/v1/preferences/growth-overview", params={"user_id": 1})

    assert response.status_code == 200
    data = response.json()
    assert data["persona"]["personaSummary"]
    assert isinstance(data["streakDays"], int)
    assert data["streakDays"] >= 1
    assert data["recentHistoryItems"]
    history_types = {item["historyType"] for item in data["recentHistoryItems"]}
    assert "briefing" in history_types
    assert "journal" in history_types
    assert "action" in history_types


def test_favorites_api_returns_content_ref_and_accepts_content_ref_payload(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    list_response = client.get("/api/v1/favorites", params={"user_id": 1})

    assert list_response.status_code == 200
    list_data = list_response.json()
    assert list_data["items"]
    assert list_data["items"][0]["contentRef"] == "hot_topic:1"

    create_response = client.post(
        "/api/v1/favorites?user_id=1",
        json={
            "content_ref": "opportunity:1",
            "item_title": "AI 写作训练营征稿",
            "item_summary": "面向 AI 与写作方向的征稿机会。",
            "item_source": "机会站",
            "item_url": "https://example.com/opportunities/1",
        },
    )

    assert create_response.status_code == 200
    created = create_response.json()
    assert created["contentRef"] == "opportunity:1"
    assert created["itemType"] == "opportunity"
    assert created["itemId"] == 1


def test_history_api_returns_content_ref_and_accepts_content_ref_payload(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    list_response = client.get("/api/v1/history", params={"user_id": 1})

    assert list_response.status_code == 200
    list_data = list_response.json()
    assert list_data["items"]
    assert list_data["items"][0]["contentRef"] == "hot_topic:1"

    create_response = client.post(
        "/api/v1/history?user_id=1",
        json={
            "event_type": "read",
            "title": "补充阅读：写作方法论与 AI 协作",
            "summary": "通过统一引用写入历史",
            "content_ref": "article:1",
        },
    )

    assert create_response.status_code == 200
    created = create_response.json()
    assert created["contentRef"] == "article:1"
    assert created["refType"] == "article"
    assert created["refId"] == 1


def test_chat_execute_api_creates_todo_and_history_record(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.post(
        "/api/v1/chat/execute?user_id=1",
        json={
            "input": "明天提醒我投AI写作训练营",
            "current_interests": ["AI", "写作"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["actionType"] == "create_todo"
    assert data["affectedEntity"]["type"] == "todo"
    assert data["deepLink"] == "/todo"

    db = session_factory()
    try:
        todos = db.query(Todo).filter(Todo.user_id == 1).order_by(Todo.id.asc()).all()
        assert len(todos) == 2
        assert any("投AI写作训练营" in todo.content for todo in todos)

        history_items = (
            db.query(HistoryEntry)
            .filter(HistoryEntry.user_id == 1, HistoryEntry.event_type == "todo_created")
            .all()
        )
        assert history_items
        assert any("通过对话创建待办" in (item.summary or "") for item in history_items)
        sessions = db.query(ChatSession).filter(ChatSession.user_id == 1).all()
        messages = db.query(ChatMessage).order_by(ChatMessage.id.asc()).all()
        assert len(sessions) == 1
        assert len(messages) == 2
        assert messages[0].role == "user"
        assert messages[1].role == "assistant"
        assert messages[1].message_state == "executed"
        assert messages[1].action_type == "create_todo"
    finally:
        db.close()


def test_chat_execute_api_add_interest_updates_user_interest_rows(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.post(
        "/api/v1/chat/execute?user_id=1",
        json={
            "input": "帮我关注远程工作",
            "current_interests": ["AI", "写作"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["actionType"] == "add_interest"
    assert data["affectedEntity"]["type"] == "interest"
    assert data["deepLink"] == "/today"

    db = session_factory()
    try:
        user = db.query(User).filter(User.id == 1).first()
        assert user is not None
        stored_interests = json.loads(user.interests)
        assert "远程工作" in stored_interests

        active_rows = (
            db.query(UserInterest)
            .filter(UserInterest.user_id == 1, UserInterest.status == "active")
            .order_by(UserInterest.id.asc())
            .all()
        )
        active_interest_names = [row.interest_name for row in active_rows]
        assert "远程工作" in active_interest_names

        history_items = (
            db.query(HistoryEntry)
            .filter(HistoryEntry.user_id == 1, HistoryEntry.event_type == "interest_added")
            .all()
        )
        assert history_items
        assert any("新增关注" in (item.summary or "") for item in history_items)
    finally:
        db.close()


def test_chat_execute_api_records_thought_into_notes_and_history(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.post(
        "/api/v1/chat/execute?user_id=1",
        json={
            "input": "记下：今天看到一个判断。",
            "current_interests": ["AI"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["actionType"] == "record_thought"
    assert data["affectedEntity"]["type"] == "note"
    assert data["deepLink"] == "/log"

    db = session_factory()
    try:
        user = db.query(User).filter(User.id == 1).first()
        assert user is not None
        assert user.total_thoughts == 1

        notes = db.query(Note).filter(Note.user_id == 1).order_by(Note.id.asc()).all()
        assert len(notes) == 2
        assert any("今天看到一个判断" in note.content for note in notes)

        history_items = (
            db.query(HistoryEntry)
            .filter(HistoryEntry.user_id == 1, HistoryEntry.event_type == "note_created")
            .all()
        )
        assert history_items
        assert any((item.ref_type == "note") for item in history_items)
    finally:
        db.close()


def test_chat_execute_api_records_fragmented_thought_with_tags(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.post(
        "/api/v1/chat/execute?user_id=1",
        json={
            "input": "灵感来了，先记一下",
            "current_interests": ["AI"],
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["actionType"] == "fragmented_thought"
    assert data["affectedEntity"]["type"] == "note"
    assert data["deepLink"] == "/log"

    db = session_factory()
    try:
        notes = db.query(Note).filter(Note.user_id == 1).order_by(Note.id.asc()).all()
        assert len(notes) == 2
        fragmented_note = next(
            note for note in notes if "灵感来了" in note.content
        )
        assert fragmented_note.source_type == "chat"
        assert "日常" in (fragmented_note.tags or [])

        history_items = (
            db.query(HistoryEntry)
            .filter(HistoryEntry.user_id == 1, HistoryEntry.event_type == "note_created")
            .all()
        )
        assert history_items
        assert any((item.title == "新增记录") for item in history_items)
    finally:
        db.close()


def test_chat_recognize_api_returns_candidate_intents_and_confirmation_flag(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.post(
        "/api/v1/chat/recognize",
        json={
            "input": "记一下明天要整理这个想法",
            "current_interests": ["AI"],
            "source_context": "today_quick_note",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["recognizedIntent"] in {"create_todo", "record_thought", "fragmented_thought"}
    assert data["candidateIntents"]
    assert "create_todo" in data["candidateIntents"]
    assert data["sourceContext"] == "today_quick_note"
    assert isinstance(data["requiresConfirmation"], bool)
    assert isinstance(data["suggestedPayload"], dict)


def test_chat_execute_api_supports_pending_confirmation_without_writing(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.post(
        "/api/v1/chat/execute?user_id=1",
        json={
            "input": "记一下明天要整理这个想法",
            "current_interests": ["AI"],
            "source_context": "today_quick_note",
            "auto_commit": False,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["requiresConfirmation"] is True
    assert data["candidateIntents"]
    assert data["sourceContext"] == "today_quick_note"
    assert data["affectedEntity"] is None

    db = session_factory()
    try:
        todos = db.query(Todo).filter(Todo.user_id == 1).all()
        notes = db.query(Note).filter(Note.user_id == 1).all()
        assert len(todos) == 1
        assert len(notes) == 1
        sessions = db.query(ChatSession).filter(ChatSession.user_id == 1).all()
        messages = db.query(ChatMessage).order_by(ChatMessage.id.asc()).all()
        assert len(sessions) == 1
        assert len(messages) == 2
        assert messages[1].message_state == "pending_confirmation"
    finally:
        db.close()


def test_chat_sessions_messages_api_returns_session_timeline(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    execute_response = client.post(
        "/api/v1/chat/execute?user_id=1",
        json={
            "input": "明天提醒我补会话接口",
            "current_interests": ["AI"],
            "confirmed_type": "create_todo",
            "auto_commit": True,
            "source_context": "chat_page",
        },
    )

    assert execute_response.status_code == 200

    sessions_response = client.get("/api/v1/chat/sessions", params={"user_id": 1})
    assert sessions_response.status_code == 200
    sessions = sessions_response.json()
    assert sessions
    session_id = sessions[0]["sessionId"]

    messages_response = client.get(f"/api/v1/chat/sessions/{session_id}/messages", params={"user_id": 1})
    assert messages_response.status_code == 200
    data = messages_response.json()
    assert data["sessionId"] == session_id
    assert len(data["messages"]) == 2
    assert data["messages"][0]["role"] == "user"
    assert data["messages"][1]["role"] == "assistant"
    assert data["messages"][1]["messageState"] == "executed"


def test_chat_execute_api_supports_chat_only_confirmation_without_writing(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    response = client.post(
        "/api/v1/chat/execute?user_id=1",
        json={
            "input": "我只是想聊聊今天看到的变化",
            "current_interests": ["AI"],
            "source_context": "chat_mode",
            "auto_commit": True,
            "confirmed_type": "chat_only",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["actionType"] == "chat_only"
    assert data["confirmedType"] == "chat_only"
    assert data["affectedEntity"] is None
    assert "不会写入" in (data["resultSummary"] or "")

    db = session_factory()
    try:
        todos = db.query(Todo).filter(Todo.user_id == 1).all()
        notes = db.query(Note).filter(Note.user_id == 1).all()
        history_items = db.query(HistoryEntry).filter(HistoryEntry.user_id == 1).all()
        assert len(todos) == 1
        assert len(notes) == 1
        assert len(history_items) == 1
    finally:
        db.close()


def test_chat_reclassify_api_turns_todo_into_note_and_cancels_old_todo(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    db = session_factory()
    try:
        todo = db.query(Todo).filter(Todo.user_id == 1).first()
        assert todo is not None
        correction_from = f"todo:{todo.id}"
    finally:
        db.close()

    response = client.post(
        "/api/v1/chat/reclassify?user_id=1",
        json={
            "target_intent": "record_thought",
            "correction_from": correction_from,
            "original_input": "跟进 AI 写作训练营征稿",
            "source_context": "chat_message",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["actionType"] == "record_thought"
    assert data["affectedEntity"]["type"] == "note"
    assert data["deepLink"] == "/log"
    assert "已取消" in (data["resultSummary"] or "")
    assert data["changeLog"]
    assert any(item["change"] == "cancelled" for item in data["changeLog"])
    assert any(item["change"] == "created" for item in data["changeLog"])

    db = session_factory()
    try:
        todo = db.query(Todo).filter(Todo.user_id == 1).first()
        assert todo is not None
        assert todo.status == TodoStatus.CANCELLED

        notes = db.query(Note).filter(Note.user_id == 1).order_by(Note.id.asc()).all()
        assert len(notes) == 2
        assert any(note.source_type == "chat_reclassified" for note in notes)

        history_items = (
            db.query(HistoryEntry)
            .filter(HistoryEntry.user_id == 1, HistoryEntry.event_type == "chat_reclassified")
            .all()
        )
        assert history_items
        assert any("待办纠偏为记录" == item.title for item in history_items)
        messages = db.query(ChatMessage).order_by(ChatMessage.id.asc()).all()
        assert messages
        assert messages[-1].message_state == "executed"
        assert messages[-1].action_type == "record_thought"
    finally:
        db.close()


def test_chat_reclassify_api_turns_note_into_todo_and_keeps_old_note(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    db = session_factory()
    try:
        note = db.query(Note).filter(Note.user_id == 1).first()
        assert note is not None
        correction_from = f"note:{note.id}"
    finally:
        db.close()

    response = client.post(
        "/api/v1/chat/reclassify?user_id=1",
        json={
            "target_intent": "create_todo",
            "correction_from": correction_from,
            "original_input": "这周重点关注 AI 写作的工作流设计。",
            "source_context": "chat_message",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["actionType"] == "create_todo"
    assert data["affectedEntity"]["type"] == "todo"
    assert data["deepLink"] == "/todo"
    assert "已保留" in (data["resultSummary"] or "")
    assert data["changeLog"]
    assert any(item["change"] == "kept" for item in data["changeLog"])
    assert any(item["change"] == "created" for item in data["changeLog"])

    db = session_factory()
    try:
        notes = db.query(Note).filter(Note.user_id == 1).order_by(Note.id.asc()).all()
        todos = db.query(Todo).filter(Todo.user_id == 1).order_by(Todo.id.asc()).all()
        assert len(notes) == 1
        assert len(todos) == 2
        assert any(todo.related_type == "note" for todo in todos)

        history_items = (
            db.query(HistoryEntry)
            .filter(HistoryEntry.user_id == 1, HistoryEntry.event_type == "chat_reclassified")
            .all()
        )
        assert history_items
        assert any("记录纠偏为待办" == item.title for item in history_items)
    finally:
        db.close()


def test_chat_reclassify_api_supports_history_pointer_to_note(api_client):
    client, session_factory = api_client
    _seed_mainline_data(session_factory)

    db = session_factory()
    try:
        note = db.query(Note).filter(Note.user_id == 1).first()
        assert note is not None
        history_item = HistoryEntry(
            user_id=1,
            event_type="note_created",
            title="从历史进入纠偏",
            summary="历史指向 note",
            ref_type="note",
            ref_id=note.id,
        )
        db.add(history_item)
        db.commit()
        db.refresh(history_item)
        correction_from = f"history:{history_item.id}"
    finally:
        db.close()

    response = client.post(
        "/api/v1/chat/reclassify?user_id=1",
        json={
            "target_intent": "create_todo",
            "correction_from": correction_from,
            "original_input": "这周重点关注 AI 写作的工作流设计。",
            "source_context": "history_log",
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["actionType"] == "create_todo"
    assert data["affectedEntity"]["type"] == "todo"
    assert data["deepLink"] == "/todo"
    assert data["changeLog"]
    assert any(item["change"] == "kept" for item in data["changeLog"])
    assert any(item["change"] == "created" for item in data["changeLog"])

    db = session_factory()
    try:
        todos = db.query(Todo).filter(Todo.user_id == 1).order_by(Todo.id.asc()).all()
        assert len(todos) == 2
        assert any(todo.related_type == "note" for todo in todos)
    finally:
        db.close()

    assert "已保留" in (data["resultSummary"] or "")

    db = session_factory()
    try:
        notes = db.query(Note).filter(Note.user_id == 1).order_by(Note.id.asc()).all()
        todos = db.query(Todo).filter(Todo.user_id == 1).order_by(Todo.id.asc()).all()
        assert len(notes) == 1
        assert len(todos) == 2
        assert any(todo.related_type == "note" for todo in todos)

        history_items = (
            db.query(HistoryEntry)
            .filter(HistoryEntry.user_id == 1, HistoryEntry.event_type == "chat_reclassified")
            .all()
        )
        assert history_items
        assert any("记录纠偏为待办" == item.title for item in history_items)
    finally:
        db.close()
