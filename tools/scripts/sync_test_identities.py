from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.d1_client import D1Client


PASSWORD_PLACEHOLDER = "workers-managed-auth-placeholder"


def dt_at(days_offset: int, hour: int, minute: int = 0) -> str:
    target = datetime.now().replace(second=0, microsecond=0)
    target = target + timedelta(days=days_offset)
    target = target.replace(hour=hour, minute=minute)
    return target.strftime("%Y-%m-%d %H:%M:%S")


def day_at(days_offset: int) -> str:
    target = date.today() + timedelta(days=days_offset)
    return target.strftime("%Y-%m-%d")


def dumps(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


@dataclass
class UserIdentity:
    email: str
    username: str
    nickname: str


def query_one(client: D1Client, sql: str, params: list[object] | None = None) -> dict | None:
    rows = client.query(sql, params or [])
    return rows[0] if rows else None


def ensure_user(client: D1Client, identity: UserIdentity) -> int:
    existing = query_one(client, "SELECT id FROM users WHERE email = ?", [identity.email])
    if existing:
        client.execute(
            """
            UPDATE users
            SET username = ?, nickname = ?, is_active = 1, updated_at = datetime('now')
            WHERE id = ?
            """,
            [identity.username, identity.nickname, existing["id"]],
        )
        return int(existing["id"])

    client.execute(
        """
        INSERT INTO users (
            username, email, hashed_password, nickname, avatar,
            is_active, is_superuser, interests, total_read, total_thoughts,
            total_completed, streak_days, created_at, updated_at, last_login
        )
        VALUES (?, ?, ?, ?, NULL, 1, 0, '[]', 0, 0, 0, 0, datetime('now'), datetime('now'), datetime('now'))
        """,
        [identity.username, identity.email, PASSWORD_PLACEHOLDER, identity.nickname],
    )
    created = query_one(client, "SELECT id FROM users WHERE email = ?", [identity.email])
    if not created:
        raise RuntimeError(f"Failed to create user for {identity.email}")
    return int(created["id"])


def clear_user_owned_data(client: D1Client, user_id: int) -> None:
    session_rows = client.query("SELECT id FROM chat_sessions WHERE user_id = ?", [user_id])
    session_ids = [int(row["id"]) for row in session_rows]
    for session_id in session_ids:
        client.execute("DELETE FROM chat_messages WHERE session_id = ?", [session_id])

    statements = [
        ("DELETE FROM chat_sessions WHERE user_id = ?", [user_id]),
        ("DELETE FROM reports WHERE user_id = ?", [user_id]),
        ("DELETE FROM briefings WHERE user_id = ?", [user_id]),
        ("DELETE FROM opportunity_follows WHERE user_id = ?", [user_id]),
        ("DELETE FROM history_entries WHERE user_id = ?", [user_id]),
        ("DELETE FROM notes WHERE user_id = ?", [user_id]),
        ("DELETE FROM favorites WHERE user_id = ?", [user_id]),
        ("DELETE FROM todos WHERE user_id = ?", [user_id]),
        ("DELETE FROM user_profiles WHERE user_id = ?", [user_id]),
        ("DELETE FROM user_interests WHERE user_id = ?", [user_id]),
        ("DELETE FROM user_settings WHERE user_id = ?", [user_id]),
    ]
    for sql, params in statements:
        client.execute(sql, params)


def seed_show_user(client: D1Client, user_id: int) -> None:
    clear_user_owned_data(client, user_id)

    client.execute(
        """
        INSERT INTO user_settings (
            user_id, morning_brief_time, evening_brief_time,
            do_not_disturb_enabled, do_not_disturb_start, do_not_disturb_end,
            sound_enabled, vibration_enabled, created_at, updated_at
        )
        VALUES (?, '09:30', '21:30', 1, '23:00', '07:30', 0, 1, datetime('now'), datetime('now'))
        """,
        [user_id],
    )

    for interest in ["前端", "设计", "远程"]:
        client.execute(
            """
            INSERT INTO user_interests (user_id, interest_name, status, created_at, updated_at)
            VALUES (?, ?, 'active', datetime('now'), datetime('now'))
            """,
            [user_id, interest],
        )

    notes = [
        {
            "content": "这周重新整理了作品集首页，发现标题节奏和信息层级比单纯堆砌案例更重要。",
            "source_type": "manual",
            "source_id": None,
            "tags": ["前端", "设计", "作品集"],
            "created_at": dt_at(-3, 21, 10),
        },
        {
            "content": "远程 UI 外包项目比预期更看重交付节奏，得先把组件规范和沟通模板整理出来。",
            "source_type": "manual",
            "source_id": None,
            "tags": ["远程", "设计", "协作"],
            "created_at": dt_at(-2, 10, 20),
        },
        {
            "content": "准备把简报里的机会内容转成更明确的动作卡片，让我每天只盯真正推进项目的三件事。",
            "source_type": "manual",
            "source_id": None,
            "tags": ["前端", "效率", "行动"],
            "created_at": dt_at(-1, 22, 5),
        },
    ]
    for note in notes:
        client.execute(
            """
            INSERT INTO notes (user_id, content, source_type, source_id, tags, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                user_id,
                note["content"],
                note["source_type"],
                note["source_id"],
                dumps(note["tags"]),
                note["created_at"],
                note["created_at"],
            ],
        )

    todos = [
        {
            "content": "整理作品集首页 Hero 文案",
            "description": "把定位、案例亮点和联系入口压缩到首屏。",
            "status": "pending",
            "priority": "high",
            "deadline": day_at(2),
            "related_type": "opportunity",
            "related_id": 9,
            "related_title": "UI设计外包项目",
            "tags": ["设计", "作品集"],
            "created_at": dt_at(-2, 9, 0),
        },
        {
            "content": "把 UI 设计外包项目拆成报价和交付计划",
            "description": "先明确里程碑和每个阶段交付件。",
            "status": "completed",
            "priority": "medium",
            "deadline": day_at(-1),
            "related_type": "opportunity",
            "related_id": 9,
            "related_title": "UI设计外包项目",
            "tags": ["远程", "项目管理"],
            "created_at": dt_at(-4, 20, 30),
        },
        {
            "content": "补一版远程前端岗位投递简历",
            "description": "突出 React、交付协作和设计系统经验。",
            "status": "pending",
            "priority": "high",
            "deadline": day_at(4),
            "related_type": "opportunity",
            "related_id": 3,
            "related_title": "前端开发工程师（React方向）",
            "tags": ["前端", "远程", "求职"],
            "created_at": dt_at(-1, 8, 45),
        },
    ]
    for todo in todos:
        completed_at = dt_at(-1, 18, 0) if todo["status"] == "completed" else None
        client.execute(
            """
            INSERT INTO todos (
                user_id, content, description, status, priority, deadline,
                reminder_time, related_type, related_id, related_title, tags,
                completed_at, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                user_id,
                todo["content"],
                todo["description"],
                todo["status"],
                todo["priority"],
                todo["deadline"],
                todo["related_type"],
                todo["related_id"],
                todo["related_title"],
                dumps(todo["tags"]),
                completed_at,
                todo["created_at"],
                todo["created_at"],
            ],
        )

    favorites = [
        {
            "item_type": "opportunity",
            "item_id": 9,
            "item_title": "UI设计外包项目",
            "item_summary": "创业公司寻找 UI 设计师负责 App 界面设计，可远程协作。",
            "item_source": "猪八戒",
            "item_url": "https://zbj.com/project/ui-design-app",
            "created_at": dt_at(-3, 20, 15),
        },
        {
            "item_type": "opportunity",
            "item_id": 3,
            "item_title": "前端开发工程师（React方向）",
            "item_summary": "负责核心产品前端开发，偏 React + TypeScript。",
            "item_source": "Boss直聘",
            "item_url": "https://zhipin.com/jobs/frontend-react",
            "created_at": dt_at(-2, 18, 40),
        },
        {
            "item_type": "hot_topic",
            "item_id": 203,
            "item_title": "人工智能技术应用场景",
            "item_summary": "今日头条热点: 人工智能技术应用场景",
            "item_source": "今日头条",
            "item_url": "https://www.toutiao.com/search?keyword=人工智能技术应用场景",
            "created_at": dt_at(-1, 7, 30),
        },
    ]
    for favorite in favorites:
        client.execute(
            """
            INSERT INTO favorites (
                user_id, item_type, item_id, item_title, item_summary,
                item_source, item_url, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                user_id,
                favorite["item_type"],
                favorite["item_id"],
                favorite["item_title"],
                favorite["item_summary"],
                favorite["item_source"],
                favorite["item_url"],
                favorite["created_at"],
            ],
        )

    history_entries = [
        {
            "event_type": "favorite_added",
            "title": "收藏了 UI 设计外包项目",
            "summary": "把外包项目先纳入稍后处理队列。",
            "ref_type": "opportunity",
            "ref_id": 9,
            "created_at": dt_at(-3, 20, 15),
        },
        {
            "event_type": "note_recorded",
            "title": "记录了作品集重构思路",
            "summary": "把首屏信息层级拆清楚了。",
            "ref_type": None,
            "ref_id": None,
            "created_at": dt_at(-3, 21, 10),
        },
        {
            "event_type": "todo_completed",
            "title": "完成了 UI 外包项目拆解",
            "summary": "已经把报价和交付计划整理完。",
            "ref_type": "opportunity",
            "ref_id": 9,
            "created_at": dt_at(-1, 18, 0),
        },
        {
            "event_type": "daily_check_in",
            "title": "今日打卡",
            "summary": "保持了连续的项目推进节奏。",
            "ref_type": None,
            "ref_id": None,
            "created_at": dt_at(0, 9, 35),
        },
    ]
    for entry in history_entries:
        client.execute(
            """
            INSERT INTO history_entries (
                user_id, event_type, title, summary, ref_type, ref_id, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            [
                user_id,
                entry["event_type"],
                entry["title"],
                entry["summary"],
                entry["ref_type"],
                entry["ref_id"],
                entry["created_at"],
            ],
        )

    client.execute(
        """
        INSERT INTO opportunity_follows (
            user_id, opportunity_id, status, note, next_step, created_at, updated_at
        )
        VALUES (?, 9, 'watching', ?, ?, ?, ?)
        """,
        [
            user_id,
            "已整理交付边界，准备补一版案例与报价说明。",
            "今晚补完作品集案例页并确认报价范围",
            dt_at(-1, 18, 20),
            dt_at(-1, 18, 20),
        ],
    )

    client.execute(
        """
        INSERT INTO briefings (
            user_id, briefing_date, briefing_type, issue_number, title,
            summary_text, payload, created_at, updated_at
        )
        VALUES (?, ?, 'morning', 1, ?, ?, ?, ?, ?)
        """,
        [
            user_id,
            day_at(0),
            "展示模式晨间简报",
            "今天优先关注远程前端机会、作品集调整和设计交付节奏。",
            dumps(
                {
                    "summary": "展示账号的晨间内容偏前端、设计和远程协作。",
                    "highlights": ["前端岗位", "设计外包", "作品集优化"],
                }
            ),
            dt_at(0, 9, 30),
            dt_at(0, 9, 30),
        ],
    )

    weekly_payload = {
        "reportType": "weekly",
        "overview": {
            "period": "本周",
            "viewed": 9,
            "recorded": 3,
            "collected": 3,
            "completed": 1,
            "streak": 1,
        },
        "topicTrends": [
            {
                "id": "show-week-1",
                "icon": "🎨",
                "title": "设计",
                "heatData": {"current": 68, "previous": 40, "change": 28, "trend": "up"},
                "hotSpot": {
                    "title": "UI设计外包项目",
                    "contentRef": "opportunity:9",
                    "discussionCount": 3,
                    "userParticipation": 2,
                    "summary": "展示账号本周的重心是设计交付和作品集优化。",
                },
                "insights": ["先把交付边界写清楚，再去补视觉细节，推进效率会更高。"],
            },
            {
                "id": "show-week-2",
                "icon": "💻",
                "title": "前端",
                "heatData": {"current": 54, "previous": 32, "change": 22, "trend": "up"},
                "hotSpot": {
                    "title": "前端开发工程师（React方向）",
                    "contentRef": "opportunity:3",
                    "discussionCount": 2,
                    "userParticipation": 1,
                    "summary": "岗位关注点正逐步从泛投递转向更贴合能力结构的机会。",
                },
                "insights": ["把作品集和简历围绕 React 能力重写，比海投更有效。"],
            },
        ],
        "growth": {
            "stats": {"viewed": 9, "recorded": 3, "collected": 3, "completed": 1},
            "comparison": None,
            "trajectory": {
                "title": "从浏览机会走向主动组织交付",
                "description": "这周你把远程机会、作品集和交付节奏连成了同一条行动线，不再只是收藏，而是开始明确下一步。",
                "keywords": ["前端", "设计", "远程"],
            },
            "selectedThoughts": [
                {"id": 1, "date": day_at(-3), "content": "作品集首页先讲清楚定位，再讲案例。"},
                {"id": 2, "date": day_at(-2), "content": "外包项目更看重沟通和交付，不只是画面好看。"},
            ],
            "suggestions": [
                "把作品集首页 Hero 和案例页作为本周唯一主任务。",
                "下一轮只保留最匹配的远程岗位，减少分心投递。",
                "继续把简报内容转成明确的动作卡片。",
            ],
        },
    }

    monthly_payload = {
        "reportType": "monthly",
        "overview": {
            "period": "本月",
            "viewed": 22,
            "recorded": 7,
            "collected": 6,
            "completed": 4,
            "streak": 3,
        },
        "topicTrends": weekly_payload["topicTrends"],
        "growth": {
            "stats": {"viewed": 22, "recorded": 7, "collected": 6, "completed": 4},
            "comparison": {
                "current": [22, 7, 6, 4],
                "previous": [15, 4, 3, 2],
                "change": [7, 3, 3, 2],
            },
            "trajectory": {
                "title": "展示账号的月度主题逐步聚焦",
                "description": "本月你明显把注意力集中在远程前端机会、作品集优化和交付体系搭建上，个人方向更清晰了。",
                "keywords": ["前端", "设计", "远程"],
            },
            "selectedThoughts": weekly_payload["growth"]["selectedThoughts"],
            "suggestions": [
                "继续完善作品集中的交付过程说明。",
                "让待办只保留当前最关键的两个推进项。",
                "下月把简历版本和作品集版本同步维护。",
            ],
        },
    }

    annual_payload = {
        "year": datetime.now().year,
        "stats": {
            "topicsViewed": 52,
            "opinionsPosted": 15,
            "plansCompleted": 8,
            "daysActive": 19,
        },
        "keywords": ["前端", "设计", "远程"],
        "interests": ["前端", "设计", "远程"],
        "thinkingSection": "这一年的展示账号更像一位会把简报机会转成实际交付动作的前端设计从业者，重点不是看了多少，而是每次都能留下推进痕迹。",
        "actionSection": "从整理作品集到拆解外包项目，你已经建立了“收藏 -> 判断 -> 拆解 -> 跟进”的最小行动闭环。",
        "closing": "展示账号的年度内容将持续保持前端、设计和远程协作这三条主线。",
    }

    reports = [
        (
            "weekly",
            day_at(-6),
            day_at(0),
            "展示账号周报",
            "展示账号最近一周的前端与设计行动回顾。",
            weekly_payload,
            dt_at(0, 9, 45),
        ),
        (
            "monthly",
            day_at(-29),
            day_at(0),
            "展示账号月报",
            "展示账号最近一个月的内容与行动沉淀。",
            monthly_payload,
            dt_at(0, 9, 50),
        ),
        (
            "annual",
            f"{datetime.now().year}-01-01",
            f"{datetime.now().year}-12-31",
            "展示账号年度报告",
            "展示账号本年度的方向与行动主题。",
            annual_payload,
            dt_at(0, 9, 55),
        ),
    ]
    for report_type, period_start, period_end, title, summary_text, payload, generated_at in reports:
        client.execute(
            """
            INSERT INTO reports (
                user_id, report_type, period_start, period_end, title, summary_text,
                status, report_payload_json, generated_at, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'ready', ?, ?, ?, ?)
            """,
            [
                user_id,
                report_type,
                period_start,
                period_end,
                title,
                summary_text,
                dumps(payload),
                generated_at,
                generated_at,
                generated_at,
            ],
        )

    client.execute(
        """
        INSERT INTO chat_sessions (
            user_id, session_title, status, source_context, created_at, updated_at, last_message_at
        )
        VALUES (?, '展示账号会话', 'active', 'today', ?, ?, ?)
        """,
        [user_id, dt_at(-1, 22, 0), dt_at(-1, 22, 12), dt_at(-1, 22, 12)],
    )
    session = query_one(
        client,
        "SELECT id FROM chat_sessions WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        [user_id],
    )
    if not session:
        raise RuntimeError("Failed to create show@example.com chat session")
    session_id = int(session["id"])

    messages = [
        {
            "role": "user",
            "content": "帮我把 UI 设计外包项目拆成今天就能推进的待办。",
            "message_state": "submitted",
            "intent_type": "create_todo",
            "candidate_intents_json": dumps(["create_todo", "chat_only"]),
            "confidence": 0.92,
            "source_context": "today",
            "matched_by": "pattern",
            "confirmed_type": "create_todo",
            "action_type": "create_todo",
            "result_summary": "已生成项目拆解待办。",
            "deep_link": "/actions",
            "next_page_label": "查看待办",
            "affected_entity_type": "todo",
            "affected_entity_id": "show-todo-1",
            "change_log_json": dumps([{"type": "todo_created", "title": "整理作品集首页 Hero 文案"}]),
            "created_at": dt_at(-1, 22, 0),
        },
        {
            "role": "assistant",
            "content": "已经帮你拆成“作品集首屏文案、报价范围、案例页优化”三步，今晚先推进第一步。",
            "message_state": "executed",
            "intent_type": "create_todo",
            "candidate_intents_json": dumps(["create_todo", "chat_only"]),
            "confidence": 0.92,
            "source_context": "today",
            "matched_by": "pattern",
            "confirmed_type": "create_todo",
            "action_type": "create_todo",
            "result_summary": "生成 3 条待办建议。",
            "deep_link": "/actions",
            "next_page_label": "查看待办",
            "affected_entity_type": "todo",
            "affected_entity_id": "show-todo-1",
            "change_log_json": dumps([{"type": "todo_created", "count": 3}]),
            "created_at": dt_at(-1, 22, 1),
        },
    ]
    for message in messages:
        client.execute(
            """
            INSERT INTO chat_messages (
                session_id, role, content, message_state, intent_type,
                candidate_intents_json, confidence, source_context, matched_by,
                confirmed_type, action_type, result_summary, deep_link,
                next_page_label, affected_entity_type, affected_entity_id,
                change_log_json, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                session_id,
                message["role"],
                message["content"],
                message["message_state"],
                message["intent_type"],
                message["candidate_intents_json"],
                message["confidence"],
                message["source_context"],
                message["matched_by"],
                message["confirmed_type"],
                message["action_type"],
                message["result_summary"],
                message["deep_link"],
                message["next_page_label"],
                message["affected_entity_type"],
                message["affected_entity_id"],
                message["change_log_json"],
                message["created_at"],
            ],
        )

    client.execute(
        """
        UPDATE users
        SET interests = ?, total_read = 22, total_thoughts = 7, total_completed = 4, streak_days = 3, updated_at = datetime('now')
        WHERE id = ?
        """,
        [dumps(["前端", "设计", "远程"]), user_id],
    )


def ensure_test_user_baseline(client: D1Client, user_id: int) -> None:
    client.execute(
        """
        UPDATE users
        SET username = 'testuser', nickname = '测试用户', is_active = 1, updated_at = datetime('now')
        WHERE id = ?
        """,
        [user_id],
    )

    monthly_payload = {
        "reportType": "monthly",
        "overview": {
            "period": "本月",
            "viewed": 26,
            "recorded": 18,
            "collected": 5,
            "completed": 6,
            "streak": 6,
        },
        "topicTrends": [
            {
                "id": "test-monthly-1",
                "icon": "🤖",
                "title": "AI",
                "heatData": {"current": 82, "previous": 58, "change": 24, "trend": "up"},
                "hotSpot": {
                    "title": "人工智能技术应用场景",
                    "contentRef": "hot_topic:203",
                    "discussionCount": 12,
                    "userParticipation": 7,
                    "summary": "测试账号的内容主线仍然明显偏向 AI、写作和行动转化。",
                },
                "insights": ["AI 相关关注已经不只是浏览，还会直接影响 Today 推荐和后续行动。"],
            }
        ],
        "growth": {
            "stats": {"viewed": 26, "recorded": 18, "collected": 5, "completed": 6},
            "comparison": {
                "current": [26, 18, 5, 6],
                "previous": [18, 11, 3, 4],
                "change": [8, 7, 2, 2],
            },
            "trajectory": {
                "title": "主测试账号保持完整主链行为",
                "description": "这个账号继续覆盖兴趣、记录、待办、历史和报告的完整主链，适合做接口与页面联调验证。",
                "keywords": ["AI", "写作", "行动"],
            },
            "selectedThoughts": [
                {"id": 1, "date": day_at(-6), "content": "今天看到 GPT 相关内容后又补了一条记录。"},
                {"id": 2, "date": day_at(-3), "content": "想把热点内容再多转成几条可执行待办。"},
            ],
            "suggestions": [
                "继续用这个账号验证 Chat 写入后对 Today 的影响。",
                "用这个账号回归 notes、todos、reports 三条主链。",
                "保留它作为接口级 smoke 的主测试邮箱。",
            ],
        },
    }

    annual_payload = {
        "year": datetime.now().year,
        "stats": {
            "topicsViewed": 60,
            "opinionsPosted": 37,
            "plansCompleted": 8,
            "daysActive": 24,
        },
        "keywords": ["AI", "写作", "行动"],
        "interests": ["AI", "写作", "远程工作"],
        "thinkingSection": "测试账号保留了最完整的主链行为事实，适合验证兴趣写入、待办转化、日志记录和报告回看是否都能稳定工作。",
        "actionSection": "从 AI 主题关注到机会跟进，测试账号更强调主链闭环和接口联调完整度。",
        "closing": "这个账号继续作为主测邮箱，优先承接完整链路验证。",
    }

    report_specs = [
        (
            "monthly",
            day_at(-29),
            day_at(0),
            "测试账号月报",
            "主测试账号最近一个月的完整链路回顾。",
            monthly_payload,
            dt_at(0, 9, 18),
        ),
        (
            "annual",
            f"{datetime.now().year}-01-01",
            f"{datetime.now().year}-12-31",
            "测试账号年度报告",
            "主测试账号年度视角下的完整链路回顾。",
            annual_payload,
            dt_at(0, 9, 20),
        ),
    ]

    for report_type, period_start, period_end, title, summary_text, payload, generated_at in report_specs:
        existing = query_one(
            client,
            "SELECT id FROM reports WHERE user_id = ? AND report_type = ? LIMIT 1",
            [user_id, report_type],
        )
        if existing:
            continue
        client.execute(
            """
            INSERT INTO reports (
                user_id, report_type, period_start, period_end, title, summary_text,
                status, report_payload_json, generated_at, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, 'ready', ?, ?, ?, ?)
            """,
            [
                user_id,
                report_type,
                period_start,
                period_end,
                title,
                summary_text,
                dumps(payload),
                generated_at,
                generated_at,
                generated_at,
            ],
        )


def print_user_summary(client: D1Client, email: str) -> None:
    row = query_one(
        client,
        """
        SELECT
          u.id,
          u.email,
          (SELECT COUNT(*) FROM user_interests ui WHERE ui.user_id = u.id) AS interests_count,
          (SELECT COUNT(*) FROM favorites f WHERE f.user_id = u.id) AS favorites_count,
          (SELECT COUNT(*) FROM notes n WHERE n.user_id = u.id) AS notes_count,
          (SELECT COUNT(*) FROM todos t WHERE t.user_id = u.id) AS todos_count,
          (SELECT COUNT(*) FROM history_entries h WHERE h.user_id = u.id) AS history_count,
          (SELECT COUNT(*) FROM reports r WHERE r.user_id = u.id) AS reports_count,
          (SELECT COUNT(*) FROM briefings b WHERE b.user_id = u.id) AS briefings_count,
          (SELECT COUNT(*) FROM opportunity_follows o WHERE o.user_id = u.id) AS follows_count,
          (SELECT COUNT(*) FROM chat_sessions cs WHERE cs.user_id = u.id) AS sessions_count
        FROM users u
        WHERE u.email = ?
        """,
        [email],
    )
    if not row:
        print(f"[missing] {email}")
        return
    print(
        f"[ok] {email} -> "
        f"id={row['id']}, interests={row['interests_count']}, favorites={row['favorites_count']}, "
        f"notes={row['notes_count']}, todos={row['todos_count']}, history={row['history_count']}, "
        f"reports={row['reports_count']}, briefings={row['briefings_count']}, follows={row['follows_count']}, "
        f"sessions={row['sessions_count']}"
    )


def main() -> None:
    client = D1Client()

    test_user_id = ensure_user(
        client,
        UserIdentity(email="test@example.com", username="testuser", nickname="测试用户"),
    )
    ensure_test_user_baseline(client, test_user_id)

    show_user_id = ensure_user(
        client,
        UserIdentity(email="show@example.com", username="showuser", nickname="展示用户"),
    )
    seed_show_user(client, show_user_id)

    print_user_summary(client, "test@example.com")
    print_user_summary(client, "show@example.com")
    print("fresh account strategy: use the login page preset '新用户新邮箱' to auto-create a blank user on first login.")


if __name__ == "__main__":
    main()
