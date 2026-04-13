from __future__ import annotations

from datetime import datetime
from pathlib import Path
import sys


def _bootstrap_python_path() -> None:
    root_dir = Path(__file__).resolve().parent.parent
    candidates: list[str] = []
    for candidate in [root_dir, root_dir / ".pydeps_runtime", root_dir / ".pydeps"]:
        if candidate.exists():
            candidate_str = str(candidate)
            if candidate_str not in sys.path:
                candidates.append(candidate_str)
    sys.path[:0] = candidates


_bootstrap_python_path()

from fastapi.testclient import TestClient

import app.main as app_main
from app.database import SessionLocal
from app.main import app
from app.services.briefing.rss_recommender import RSSRecommender
from app.services.d1_client import D1Client


def assert_ok(response, label: str) -> dict:
    if response.status_code != 200:
        raise RuntimeError(f"{label} failed: {response.status_code} {response.text}")
    return response.json()


def main() -> None:
    if not app_main.settings.D1_USE_CLOUD_AS_SOURCE:
        raise RuntimeError("当前未启用 D1 云端主读，请先确保 D1_USE_CLOUD_AS_SOURCE=true")

    app_main.rss_scheduler.start = lambda: None
    app_main.rss_scheduler.stop = lambda: None

    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    todo_text = f"D1切换验证待办-{stamp}"
    note_text = f"D1切换验证记录-{stamp}"
    history_title = f"D1切换验证历史-{stamp}"

    with TestClient(app) as client:
        interests = assert_ok(
            client.put(
                "/api/v1/preferences/interests",
                params={"user_id": 1},
                json={"interests": ["AI", "写作", f"D1验证{stamp}"]},
            ),
            "update interests",
        )
        assert "AI" in interests["interests"]

        settings = assert_ok(
            client.get("/api/v1/preferences/settings", params={"user_id": 1}),
            "get settings",
        )
        assert "morning_brief_time" in settings

        note = assert_ok(
            client.post(
                "/api/v1/notes",
                params={"user_id": 1},
                json={"content": note_text, "source_type": "manual", "tags": ["D1", "验证"]},
            ),
            "create note",
        )
        assert note["content"] == note_text

        todo = assert_ok(
            client.post(
                "/api/v1/todos",
                params={"user_id": 1},
                json={"content": todo_text, "description": "云端 D1 行为事实验证", "tags": ["D1", "验证"]},
            ),
            "create todo",
        )
        assert todo["content"] == todo_text

        favorite = assert_ok(
            client.post(
                "/api/v1/favorites",
                params={"user_id": 1},
                json={
                    "contentRef": "hot_topic:1",
                    "itemTitle": f"D1切换验证收藏-{stamp}",
                    "itemSummary": "验证收藏写入",
                    "itemSource": "codex",
                    "itemUrl": f"https://example.com/d1-verify/{stamp}",
                },
            ),
            "create favorite",
        )
        assert favorite["contentRef"] == "hot_topic:1"

        history = assert_ok(
            client.post(
                "/api/v1/history",
                params={"user_id": 1},
                json={
                    "eventType": "verify",
                    "title": history_title,
                    "summary": "云端 D1 行为事实验证",
                    "contentRef": "hot_topic:1",
                },
            ),
            "create history",
        )
        assert history["contentRef"] == "hot_topic:1"

        chat = assert_ok(
            client.post(
                "/api/v1/chat/execute",
                params={"user_id": 1},
                json={
                    "input": f"记下：{note_text}，这是云端 D1 验证输入。",
                    "current_interests": ["AI", "写作"],
                },
            ),
            "chat execute",
        )
        assert chat["success"] is True

        todo_list = assert_ok(
            client.get("/api/v1/todos", params={"user_id": 1}),
            "list todos",
        )
        assert any(item["content"] == todo_text for item in todo_list["items"])

        note_list = assert_ok(
            client.get("/api/v1/notes", params={"user_id": 1}),
            "list notes",
        )
        assert any(item["content"] == note_text for item in note_list["items"])

        history_list = assert_ok(
            client.get("/api/v1/history", params={"user_id": 1}),
            "list history",
        )
        assert any(item["title"] == history_title for item in history_list["items"])

        reports_availability = assert_ok(
            client.get("/api/v1/reports", params={"user_id": 1}),
            "reports availability",
        )
        assert reports_availability["reports"]
        assert reports_availability["reports"][0]["available"] is True

        weekly_report = assert_ok(
            client.get("/api/v1/reports/weekly", params={"user_id": 1}),
            "weekly report",
        )
        assert weekly_report["overview"]["recorded"] >= 1
        assert weekly_report["topicTrends"]

        today = assert_ok(
            client.get("/api/v1/dashboard/today", params={"user_id": 1}),
            "today dashboard",
        )
        assert today["worthKnowing"]
        assert today["worthActing"]
        hot_topic_ref = today["worthKnowing"][0]["contentRef"]
        opportunity_ref = today["worthActing"][0]["contentRef"]
        assert hot_topic_ref.startswith("hot_topic:")
        assert opportunity_ref.startswith("opportunity:")

        hot_topic_detail = assert_ok(
            client.get("/api/v1/content/by-ref", params={"content_ref": hot_topic_ref}),
            "content by-ref hot_topic",
        )
        assert hot_topic_detail["contentType"] == "hot_topic"

        opportunity_detail = assert_ok(
            client.get("/api/v1/content/by-ref", params={"content_ref": opportunity_ref}),
            "content by-ref opportunity",
        )
        assert opportunity_detail["contentType"] == "opportunity"

        d1_client = D1Client()
        d1_client.execute(
            "DELETE FROM opportunity_follows WHERE user_id = ? AND opportunity_id = ?",
            [1, 1],
        )
        d1_client.execute(
            """
            INSERT INTO opportunity_follows (user_id, opportunity_id, status, note, next_step)
            VALUES (?, ?, ?, ?, ?)
            """,
            [1, 1, "watching", f"D1跟进验证-{stamp}", "整理投稿提纲"],
        )

        actions_overview = assert_ok(
            client.get("/api/v1/actions/overview", params={"user_id": 1}),
            "actions overview",
        )
        assert "todayTodos" in actions_overview
        assert "futureTodos" in actions_overview
        assert "completedTodos" in actions_overview
        assert actions_overview["followingItems"]
        assert any(item["followStatus"] == "watching" for item in actions_overview["followingItems"])
        assert any(item["nextStep"] == "整理投稿提纲" for item in actions_overview["followingItems"])

        growth_overview = assert_ok(
            client.get("/api/v1/preferences/growth-overview", params={"user_id": 1}),
            "growth overview",
        )
        assert growth_overview["recentHistoryItems"]
        history_types = {item["historyType"] for item in growth_overview["recentHistoryItems"]}
        assert "briefing" in history_types
        assert "journal" in history_types
        assert "action" in history_types

        article_ref = "article:1"
        article_detail = assert_ok(
            client.get("/api/v1/content/by-ref", params={"content_ref": article_ref}),
            "content by-ref article",
        )
        assert article_detail["contentType"] == "article"

        rss_articles = assert_ok(
            client.get("/api/v1/rss/articles", params={"limit": 5}),
            "rss articles",
        )
        assert rss_articles
        assert rss_articles[0]["title"]

    db = SessionLocal()
    try:
        recommender = RSSRecommender(db)
        hot_articles = recommender.get_hot_articles(limit=3)
        tagged_articles = recommender.get_articles_by_tags(tags=["AI", "写作"], limit=3)
        assert hot_articles
        assert tagged_articles
    finally:
        db.close()

    print("Cloud D1 behavior mainline verification passed.")


if __name__ == "__main__":
    main()
