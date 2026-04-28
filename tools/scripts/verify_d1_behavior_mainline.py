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
from app.services.d1_client import D1Client, D1ClientError

VERIFY_EMAIL = "verify+d1@example.com"
VERIFY_USERNAME = "verify_d1_user"
VERIFY_NICKNAME = "D1验证用户"


def assert_ok(response, label: str) -> dict:
    if response.status_code != 200:
        raise RuntimeError(f"{label} failed: {response.status_code} {response.text}")
    return response.json()


def assert_d1_auth_ready() -> None:
    """Fail fast when D1 credentials are invalid, to avoid local fallback masking."""
    client = D1Client()
    probe = client.query("SELECT 1 AS ok")
    if not probe or int(probe[0].get("ok") or 0) != 1:
        raise RuntimeError("D1 credential probe failed: expected SELECT 1 AS ok")


def ensure_verify_user(client: D1Client) -> int:
    existing = client.query(
        "SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1",
        [VERIFY_EMAIL],
    )
    if existing:
        return int(existing[0]["id"])

    client.execute(
        """
        INSERT INTO users (
            username, email, hashed_password, nickname, is_active, is_superuser, interests,
            created_at, updated_at, last_login
        )
        VALUES (?, ?, ?, ?, 1, 0, '[]', datetime('now'), datetime('now'), datetime('now'))
        """,
        [VERIFY_USERNAME, VERIFY_EMAIL, "verify-script-placeholder", VERIFY_NICKNAME],
    )
    created = client.query(
        "SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1",
        [VERIFY_EMAIL],
    )
    if not created:
        raise RuntimeError("Failed to create dedicated D1 verify user")
    return int(created[0]["id"])


def cleanup_verify_user_data(client: D1Client, user_id: int) -> None:
    statements = [
        ("DELETE FROM chat_messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = ?)", [user_id]),
        ("DELETE FROM chat_sessions WHERE user_id = ?", [user_id]),
        ("DELETE FROM opportunity_execution_results WHERE user_id = ?", [user_id]),
        ("DELETE FROM opportunity_follows WHERE user_id = ?", [user_id]),
        ("DELETE FROM briefing_dispatch_logs WHERE user_id = ?", [user_id]),
        ("DELETE FROM briefing_schedules WHERE user_id = ?", [user_id]),
        ("DELETE FROM reports WHERE user_id = ?", [user_id]),
        ("DELETE FROM briefings WHERE user_id = ?", [user_id]),
        ("DELETE FROM history_entries WHERE user_id = ?", [user_id]),
        ("DELETE FROM favorites WHERE user_id = ?", [user_id]),
        ("DELETE FROM notes WHERE user_id = ?", [user_id]),
        ("DELETE FROM todos WHERE user_id = ?", [user_id]),
        ("DELETE FROM user_interests WHERE user_id = ?", [user_id]),
        ("DELETE FROM user_settings WHERE user_id = ?", [user_id]),
        ("DELETE FROM summary_generation_results WHERE user_id = ?", [user_id]),
        ("DELETE FROM summary_generation_tasks WHERE user_id = ?", [user_id]),
    ]
    for statement, params in statements:
        try:
            client.execute(statement, params)
        except D1ClientError as error:
            if "no such table" in str(error).lower():
                continue
            raise


def main() -> None:
    if not app_main.settings.D1_USE_CLOUD_AS_SOURCE:
        raise RuntimeError("当前未启用 D1 云端主读，请先确保 D1_USE_CLOUD_AS_SOURCE=true")
    assert_d1_auth_ready()

    app_main.rss_scheduler.start = lambda: None
    app_main.rss_scheduler.stop = lambda: None

    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    todo_text = f"D1切换验证待办-{stamp}"
    note_text = f"D1切换验证记录-{stamp}"
    history_title = f"D1切换验证历史-{stamp}"
    d1_client = D1Client()
    user_id = ensure_verify_user(d1_client)
    cleanup_verify_user_data(d1_client, user_id)

    try:
        with TestClient(app) as client:
            interests = assert_ok(
                client.put(
                    "/api/v1/preferences/interests",
                    params={"user_id": user_id},
                    json={"interests": ["AI", "写作", f"D1验证{stamp}"]},
                ),
                "update interests",
            )
            assert "AI" in interests["interests"]

            settings = assert_ok(
                client.get("/api/v1/preferences/settings", params={"user_id": user_id}),
                "get settings",
            )
            assert "morning_brief_time" in settings

            note = assert_ok(
                client.post(
                    "/api/v1/notes",
                    params={"user_id": user_id},
                    json={"content": note_text, "source_type": "manual", "tags": ["D1", "验证"]},
                ),
                "create note",
            )
            assert note["content"] == note_text

            todo = assert_ok(
                client.post(
                    "/api/v1/todos",
                    params={"user_id": user_id},
                    json={"content": todo_text, "description": "云端 D1 行为事实验证", "tags": ["D1", "验证"]},
                ),
                "create todo",
            )
            assert todo["content"] == todo_text

            favorite = assert_ok(
                client.post(
                    "/api/v1/favorites",
                    params={"user_id": user_id},
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
                    params={"user_id": user_id},
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
                    params={"user_id": user_id},
                    json={
                        "input": f"记下：{note_text}，这是云端 D1 验证输入。",
                        "current_interests": ["AI", "写作"],
                    },
                ),
                "chat execute",
            )
            assert chat["success"] is True

            push_request = assert_ok(
                client.post(
                    "/api/v1/chat/execute",
                    params={"user_id": user_id},
                    json={
                        "input": "每天早上9点给我发简报",
                        "current_interests": ["AI", "写作"],
                    },
                ),
                "chat execute set push time",
            )
            assert push_request["success"] is True
            assert push_request["actionType"] == "set_push_time"

            interest_flow = assert_ok(
                client.post(
                    "/api/v1/chat/execute",
                    params={"user_id": user_id},
                    json={
                        "input": "今天特别关注了AI，以后希望得到更多关于AI的咨询",
                        "current_interests": ["写作"],
                    },
                ),
                "chat execute interest flow",
            )
            assert interest_flow["success"] is True
            assert interest_flow["actionType"] == "add_interest"

            interests = assert_ok(
                client.get("/api/v1/preferences/interests", params={"user_id": user_id}),
                "get interests after chat flow",
            )
            assert "AI" in interests["interests"]

            todo_list = assert_ok(
                client.get("/api/v1/todos", params={"user_id": user_id}),
                "list todos",
            )
            assert any(item["content"] == todo_text for item in todo_list["items"])

            note_list = assert_ok(
                client.get("/api/v1/notes", params={"user_id": user_id}),
                "list notes",
            )
            assert any(item["content"] == note_text for item in note_list["items"])

            history_list = assert_ok(
                client.get("/api/v1/history", params={"user_id": user_id}),
                "list history",
            )
            assert any(item["title"] == history_title for item in history_list["items"])
            assert any(item["eventType"] == "push_time_requested" for item in history_list["items"])

            weekly_report = assert_ok(
                client.get("/api/v1/reports/weekly", params={"user_id": user_id}),
                "weekly report",
            )
            assert weekly_report["overview"]["recorded"] >= 1
            assert weekly_report["topicTrends"]

            annual_report = assert_ok(
                client.get("/api/v1/reports/annual", params={"user_id": user_id}),
                "annual report",
            )
            assert annual_report["year"]
            assert annual_report["stats"]["topicsViewed"] >= 1

            reports_availability = assert_ok(
                client.get("/api/v1/reports", params={"user_id": user_id}),
                "reports availability",
            )
            assert reports_availability["reports"]
            assert reports_availability["reports"][0]["available"] is True

            today = assert_ok(
                client.get("/api/v1/dashboard/today", params={"user_id": user_id}),
                "today dashboard",
            )
            assert any(item["interestName"] == "AI" for item in today["recommendedForYou"])
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

            d1_client.execute(
                """
                INSERT INTO opportunity_follows (user_id, opportunity_id, status, note, next_step)
                VALUES (?, ?, ?, ?, ?)
                """,
                [user_id, 1, "watching", f"D1跟进验证-{stamp}", "整理投稿提纲"],
            )

            actions_overview = assert_ok(
                client.get("/api/v1/actions/overview", params={"user_id": user_id}),
                "actions overview",
            )
            assert "todayTodos" in actions_overview
            assert "futureTodos" in actions_overview
            assert "completedTodos" in actions_overview
            assert actions_overview["followingItems"]
            assert any(item["followStatus"] == "watching" for item in actions_overview["followingItems"])
            assert any(item["nextStep"] == "整理投稿提纲" for item in actions_overview["followingItems"])

            growth_overview = assert_ok(
                client.get("/api/v1/preferences/growth-overview", params={"user_id": user_id}),
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
    finally:
        cleanup_verify_user_data(d1_client, user_id)

    print("Cloud D1 behavior mainline verification passed.")


if __name__ == "__main__":
    main()
