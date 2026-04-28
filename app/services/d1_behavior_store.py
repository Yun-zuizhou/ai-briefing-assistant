from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from app.services.activity_streak import calc_streak_from_timestamps, is_checked_in_today
from app.services.d1_client import D1Client
from app.services.persona_keywords import build_growth_keywords


class D1BehaviorStore:
    def __init__(self, client: D1Client | None = None) -> None:
        self.client = client or D1Client()

    def _ensure_user(self, user_id: int) -> dict[str, Any]:
        rows = self.client.query(
            """
            SELECT id, username, email, hashed_password, interests, total_thoughts
            FROM users
            WHERE id = ?
            """,
            [user_id],
        )
        if rows:
            return rows[0]

        self.client.execute(
            """
            INSERT INTO users (id, username, email, hashed_password, interests)
            VALUES (?, ?, ?, ?, ?)
            """,
            [user_id, f"user_{user_id}", f"user_{user_id}@example.com", "temporary", "[]"],
        )
        return {
            "id": user_id,
            "username": f"user_{user_id}",
            "email": f"user_{user_id}@example.com",
            "hashed_password": "temporary",
            "interests": "[]",
            "total_thoughts": 0,
        }

    def get_user_interests(self, user_id: int) -> list[str]:
        self._ensure_user(user_id)
        rows = self.client.query(
            """
            SELECT interest_name
            FROM user_interests
            WHERE user_id = ? AND lower(status) = 'active'
            ORDER BY id ASC
            """,
            [user_id],
        )
        return [str(row["interest_name"]) for row in rows if row.get("interest_name")]

    def replace_user_interests(self, user_id: int, interests: list[str]) -> list[str]:
        normalized: list[str] = []
        for item in interests:
            value = str(item).strip()
            if value and value not in normalized:
                normalized.append(value)

        user = self._ensure_user(user_id)
        self.client.execute("DELETE FROM user_interests WHERE user_id = ?", [user_id])
        for name in normalized:
            self.client.execute(
                """
                INSERT INTO user_interests (user_id, interest_name, status)
                VALUES (?, ?, 'active')
                """,
                [user_id, name],
            )

        self.client.execute(
            "UPDATE users SET interests = ? WHERE id = ?",
            [json.dumps(normalized, ensure_ascii=False), user_id],
        )
        return normalized

    def get_or_create_user_settings(self, user_id: int) -> dict[str, Any]:
        rows = self.client.query(
            """
            SELECT id, user_id, morning_brief_time, evening_brief_time,
                   do_not_disturb_enabled, do_not_disturb_start, do_not_disturb_end,
                   sound_enabled, vibration_enabled
            FROM user_settings
            WHERE user_id = ?
            """,
            [user_id],
        )
        if rows:
            return rows[0]

        self._ensure_user(user_id)
        self.client.execute(
            """
            INSERT INTO user_settings (
                user_id, morning_brief_time, evening_brief_time,
                do_not_disturb_enabled, sound_enabled, vibration_enabled
            ) VALUES (?, '08:00', '21:00', 0, 1, 1)
            """,
            [user_id],
        )
        return self.get_or_create_user_settings(user_id)

    def append_history(
        self,
        user_id: int,
        event_type: str,
        title: str,
        summary: str | None = None,
        ref_type: str | None = None,
        ref_id: int | None = None,
    ) -> dict[str, Any]:
        return self.client.query(
            """
            INSERT INTO history_entries (user_id, event_type, title, summary, ref_type, ref_id)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id, event_type, title, summary, ref_type, ref_id, created_at
            """,
            [user_id, event_type, title, summary, ref_type, ref_id],
        )[0]

    def create_chat_todo(self, user_id: int, content: str, deadline_label: str = "待定") -> dict[str, Any]:
        todo = self.client.query(
            """
            INSERT INTO todos (user_id, content, description, status, priority, tags)
            VALUES (?, ?, ?, 'pending', 'medium', '["chat"]')
            RETURNING id, content, description, status, priority, deadline, tags, created_at
            """,
            [user_id, content, f"通过对话创建，截止：{deadline_label}"],
        )[0]
        todo["tags"] = json.loads(todo.get("tags") or "[]")
        self.append_history(
            user_id=user_id,
            event_type="todo_created",
            title=content,
            summary=f"通过对话创建待办，截止：{deadline_label}",
            ref_type="todo",
            ref_id=todo["id"],
        )
        return todo

    def create_chat_note(
        self,
        user_id: int,
        content: str,
        tags: list[str] | None = None,
        source_type: str = "chat",
        source_id: int | None = None,
    ) -> dict[str, Any]:
        note = self.client.query(
            """
            INSERT INTO notes (user_id, content, source_type, source_id, tags)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, content, source_type, source_id, tags, created_at
            """,
            [user_id, content, source_type, source_id, json.dumps(tags or [], ensure_ascii=False)],
        )[0]
        note["tags"] = json.loads(note.get("tags") or "[]")
        user = self._ensure_user(user_id)
        total_thoughts = int(user.get("total_thoughts") or 0) + 1
        self.client.execute("UPDATE users SET total_thoughts = ? WHERE id = ?", [total_thoughts, user_id])
        self.append_history(
            user_id=user_id,
            event_type="note_created",
            title="新增记录",
            summary=content[:100],
            ref_type="note",
            ref_id=note["id"],
        )
        return note

    def update_interest_action(self, user_id: int, names: list[str], mode: str) -> dict[str, Any]:
        current = self.get_user_interests(user_id)
        if mode == "add":
            updated = current[:]
            for name in names:
                if name not in updated:
                    updated.append(name)
            event_type = "interest_added"
            title = "更新关注"
            summary = f"新增关注：{'、'.join(names)}" if names else "关注内容已更新"
        else:
            updated = [item for item in current if item not in names]
            event_type = "interest_removed"
            title = "更新关注"
            summary = f"移除关注：{'、'.join(names)}" if names else "关注内容已更新"

        self.replace_user_interests(user_id, updated)
        self.append_history(user_id=user_id, event_type=event_type, title=title, summary=summary)
        return {"interests": updated, "summary": summary}

    def record_push_request(self, user_id: int, time_value: str) -> None:
        self.append_history(
            user_id=user_id,
            event_type="push_time_requested",
            title="推送时间调整请求",
            summary=f"请求将推送时间调整为 {time_value}",
        )

    def get_todo(self, todo_id: int, user_id: int) -> dict[str, Any] | None:
        rows = self.client.query(
            """
            SELECT id, user_id, content, description, status, priority, deadline, related_type, related_id, related_title, tags, created_at
            FROM todos WHERE id = ? AND user_id = ?
            """,
            [todo_id, user_id],
        )
        if not rows:
            return None
        row = rows[0]
        row["tags"] = json.loads(row.get("tags") or "[]")
        return row

    def get_note(self, note_id: int, user_id: int) -> dict[str, Any] | None:
        rows = self.client.query(
            """
            SELECT id, user_id, content, source_type, source_id, tags, created_at
            FROM notes WHERE id = ? AND user_id = ?
            """,
            [note_id, user_id],
        )
        if not rows:
            return None
        row = rows[0]
        row["tags"] = json.loads(row.get("tags") or "[]")
        return row

    def reclassify_todo_to_note(self, user_id: int, todo_id: int, content: str, target_intent: str) -> dict[str, Any] | None:
        todo = self.get_todo(todo_id, user_id)
        if not todo:
            return None
        note = self.create_chat_note(
            user_id=user_id,
            content=content,
            tags=(todo.get("tags") or []) + ["纠偏"],
            source_type="chat_reclassified",
            source_id=todo_id,
        )
        self.client.execute(
            "UPDATE todos SET status = 'cancelled', description = COALESCE(description, '') || ? WHERE id = ?",
            ["\n已纠偏改成记录", todo_id],
        )
        self.append_history(
            user_id=user_id,
            event_type="chat_reclassified",
            title="待办纠偏为记录",
            summary=f"原待办 #{todo_id} 已取消，并生成记录 #{note['id']}",
            ref_type="note",
            ref_id=note["id"],
        )
        return note

    def reclassify_todo_to_chat_only(self, user_id: int, todo_id: int) -> bool:
        todo = self.get_todo(todo_id, user_id)
        if not todo:
            return False
        self.client.execute(
            "UPDATE todos SET status = 'cancelled', description = COALESCE(description, '') || ? WHERE id = ?",
            ["\n已纠偏改为仅聊天", todo_id],
        )
        self.append_history(
            user_id=user_id,
            event_type="chat_reclassified",
            title="待办纠偏为仅聊天",
            summary=f"原待办 #{todo_id} 已取消，本次按仅聊天理解处理",
            ref_type="todo",
            ref_id=todo_id,
        )
        return True

    def reclassify_note_to_todo(self, user_id: int, note_id: int, content: str) -> dict[str, Any] | None:
        note = self.get_note(note_id, user_id)
        if not note:
            return None
        todo = self.client.query(
            """
            INSERT INTO todos (user_id, content, description, status, priority, related_type, related_id, related_title, tags)
            VALUES (?, ?, ?, 'pending', 'medium', 'note', ?, ?, '["chat","纠偏"]')
            RETURNING id, content, description, status, priority, deadline, tags, created_at
            """,
            [user_id, content[:500], f"由记录 #{note_id} 纠偏生成", note_id, note["content"][:100]],
        )[0]
        todo["tags"] = json.loads(todo.get("tags") or "[]")
        self.append_history(
            user_id=user_id,
            event_type="chat_reclassified",
            title="记录纠偏为待办",
            summary=f"原记录 #{note_id} 已保留，新待办 #{todo['id']} 已生成",
            ref_type="todo",
            ref_id=todo["id"],
        )
        return todo

    def retag_note(self, user_id: int, note_id: int, tags: list[str]) -> bool:
        note = self.get_note(note_id, user_id)
        if not note:
            return False
        self.client.execute(
            "UPDATE notes SET tags = ? WHERE id = ?",
            [json.dumps(tags, ensure_ascii=False), note_id],
        )
        return True

    def update_user_settings(self, user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        self.get_or_create_user_settings(user_id)
        self.client.execute(
            """
            UPDATE user_settings
            SET morning_brief_time = ?,
                evening_brief_time = ?,
                do_not_disturb_enabled = ?,
                do_not_disturb_start = ?,
                do_not_disturb_end = ?,
                sound_enabled = ?,
                vibration_enabled = ?
            WHERE user_id = ?
            """,
            [
                payload["morning_brief_time"],
                payload["evening_brief_time"],
                1 if payload["do_not_disturb_enabled"] else 0,
                payload.get("do_not_disturb_start"),
                payload.get("do_not_disturb_end"),
                1 if payload["sound_enabled"] else 0,
                1 if payload["vibration_enabled"] else 0,
                user_id,
            ],
        )
        return self.get_or_create_user_settings(user_id)

    def list_todos(self, user_id: int, status: str | None = None, priority: str | None = None) -> list[dict[str, Any]]:
        sql = """
            SELECT id, content, description, status, priority, deadline, tags, created_at
            FROM todos
            WHERE user_id = ?
        """
        params: list[Any] = [user_id]
        if status:
            sql += " AND status = ?"
            params.append(status)
        if priority:
            sql += " AND priority = ?"
            params.append(priority)
        sql += " ORDER BY created_at DESC"
        rows = self.client.query(sql, params)
        for row in rows:
            row["tags"] = json.loads(row.get("tags") or "[]")
        return rows

    def create_todo(self, user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        tags = json.dumps(payload.get("tags") or [], ensure_ascii=False)
        rows = self.client.query(
            """
            INSERT INTO todos (user_id, content, description, status, priority, deadline, tags)
            VALUES (?, ?, ?, 'pending', ?, ?, ?)
            RETURNING id, content, description, status, priority, deadline, tags, created_at
            """,
            [
                user_id,
                payload["content"],
                payload.get("description"),
                payload.get("priority", "medium"),
                payload.get("deadline"),
                tags,
            ],
        )
        row = rows[0]
        row["tags"] = json.loads(row.get("tags") or "[]")
        return row

    def update_todo(self, todo_id: int, payload: dict[str, Any]) -> dict[str, Any] | None:
        rows = self.client.query(
            """
            SELECT id, content, description, status, priority, deadline, tags, created_at
            FROM todos
            WHERE id = ?
            """,
            [todo_id],
        )
        if not rows:
            return None
        current = rows[0]
        next_tags = payload.get("tags")
        if next_tags is not None:
            next_tags = json.dumps(next_tags, ensure_ascii=False)
        else:
            next_tags = current.get("tags") or "[]"

        self.client.execute(
            """
            UPDATE todos
            SET content = ?, description = ?, status = ?, priority = ?, deadline = ?, tags = ?
            WHERE id = ?
            """,
            [
                payload.get("content", current.get("content")),
                payload.get("description", current.get("description")),
                payload.get("status", current.get("status")),
                payload.get("priority", current.get("priority")),
                payload.get("deadline", current.get("deadline")),
                next_tags,
                todo_id,
            ],
        )
        result = self.client.query(
            """
            SELECT id, content, description, status, priority, deadline, tags, created_at
            FROM todos
            WHERE id = ?
            """,
            [todo_id],
        )[0]
        result["tags"] = json.loads(result.get("tags") or "[]")
        return result

    def delete_todo(self, todo_id: int) -> bool:
        rows = self.client.query("SELECT id FROM todos WHERE id = ?", [todo_id])
        if not rows:
            return False
        self.client.execute("DELETE FROM todos WHERE id = ?", [todo_id])
        return True

    def list_notes(self, user_id: int, source_type: str | None = None) -> list[dict[str, Any]]:
        sql = """
            SELECT id, content, source_type, source_id, tags, created_at
            FROM notes
            WHERE user_id = ?
        """
        params: list[Any] = [user_id]
        if source_type:
            sql += " AND source_type = ?"
            params.append(source_type)
        sql += " ORDER BY created_at DESC"
        rows = self.client.query(sql, params)
        for row in rows:
            row["tags"] = json.loads(row.get("tags") or "[]")
        return rows

    def create_note(self, user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        tags = json.dumps(payload.get("tags") or [], ensure_ascii=False)
        row = self.client.query(
            """
            INSERT INTO notes (user_id, content, source_type, source_id, tags)
            VALUES (?, ?, ?, ?, ?)
            RETURNING id, content, source_type, source_id, tags, created_at
            """,
            [user_id, payload["content"], payload.get("source_type", "manual"), payload.get("source_id"), tags],
        )[0]
        row["tags"] = json.loads(row.get("tags") or "[]")
        return row

    def delete_note(self, note_id: int) -> bool:
        rows = self.client.query("SELECT id FROM notes WHERE id = ?", [note_id])
        if not rows:
            return False
        self.client.execute("DELETE FROM notes WHERE id = ?", [note_id])
        return True

    def list_favorites(self, user_id: int, item_type: str | None = None) -> list[dict[str, Any]]:
        sql = """
            SELECT id, item_type, item_id, item_title, item_summary, item_source, item_url, created_at
            FROM favorites
            WHERE user_id = ?
        """
        params: list[Any] = [user_id]
        if item_type:
            sql += " AND item_type = ?"
            params.append(item_type)
        sql += " ORDER BY created_at DESC"
        rows = self.client.query(sql, params)
        for row in rows:
            row["content_ref"] = f"{row['item_type']}:{row['item_id']}"
        return rows

    def create_favorite(self, user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        existing = self.client.query(
            """
            SELECT id, item_type, item_id, item_title, item_summary, item_source, item_url, created_at
            FROM favorites
            WHERE user_id = ? AND item_type = ? AND item_id = ?
            """,
            [user_id, payload["item_type"], payload["item_id"]],
        )
        if existing:
            row = existing[0]
        else:
            row = self.client.query(
                """
                INSERT INTO favorites (user_id, item_type, item_id, item_title, item_summary, item_source, item_url)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                RETURNING id, item_type, item_id, item_title, item_summary, item_source, item_url, created_at
                """,
                [
                    user_id,
                    payload["item_type"],
                    payload["item_id"],
                    payload["item_title"],
                    payload.get("item_summary"),
                    payload.get("item_source"),
                    payload.get("item_url"),
                ],
            )[0]
        row["content_ref"] = f"{row['item_type']}:{row['item_id']}"
        return row

    def delete_favorite(self, favorite_id: int) -> bool:
        rows = self.client.query("SELECT id FROM favorites WHERE id = ?", [favorite_id])
        if not rows:
            return False
        self.client.execute("DELETE FROM favorites WHERE id = ?", [favorite_id])
        return True

    def list_history(self, user_id: int, event_type: str | None = None) -> list[dict[str, Any]]:
        sql = """
            SELECT id, event_type, title, summary, ref_type, ref_id, created_at
            FROM history_entries
            WHERE user_id = ?
        """
        params: list[Any] = [user_id]
        if event_type:
            sql += " AND event_type = ?"
            params.append(event_type)
        sql += " ORDER BY created_at DESC"
        rows = self.client.query(sql, params)
        for row in rows:
            row["content_ref"] = (
                f"{row['ref_type']}:{row['ref_id']}"
                if row.get("ref_type") in {"hot_topic", "article", "opportunity"} and row.get("ref_id") is not None
                else None
            )
        return rows

    def create_history(self, user_id: int, payload: dict[str, Any]) -> dict[str, Any]:
        row = self.client.query(
            """
            INSERT INTO history_entries (user_id, event_type, title, summary, ref_type, ref_id)
            VALUES (?, ?, ?, ?, ?, ?)
            RETURNING id, event_type, title, summary, ref_type, ref_id, created_at
            """,
            [
                user_id,
                payload["event_type"],
                payload["title"],
                payload.get("summary"),
                payload.get("ref_type"),
                payload.get("ref_id"),
            ],
        )[0]
        row["content_ref"] = (
            f"{row['ref_type']}:{row['ref_id']}"
            if row.get("ref_type") in {"hot_topic", "article", "opportunity"} and row.get("ref_id") is not None
            else None
        )
        return row

    def get_user_profile(self, user_id: int) -> dict[str, Any]:
        user = self._ensure_user(user_id)
        interests = self.get_user_interests(user_id)
        notes = self.list_notes(user_id)
        favorites = self.list_favorites(user_id)
        todos = self.list_todos(user_id)
        history = self.list_history(user_id)
        completed = sum(1 for item in todos if item.get("status") == "completed")
        growth_keywords = build_growth_keywords(
            active_interests=interests,
            note_tags=[tag for item in notes for tag in (item.get("tags") or [])],
            note_contents=[str(item.get("content") or "") for item in notes],
            favorite_titles=[str(item.get("item_title") or "") for item in favorites],
        )
        interest_text = "、".join(interests[:3]) if interests else "多个主题"
        return {
            "active_interests": interests,
            "notes_count": len(notes),
            "favorites_count": len(favorites),
            "completed_todos": completed,
            "total_todos": len(todos),
            "history_count": len(history),
            "radar_metrics": {
                "活跃度": min(100, len(history) * 10),
                "收藏量": min(100, len(favorites) * 15),
                "任务完成": round((completed / len(todos)) * 100) if todos else 0,
                "关注广度": min(100, len(interests) * 15),
                "连续打卡": min(100, max(len(history) * 8, 20)),
                "互动深度": min(100, len(notes) * 12),
            },
            "persona_summary": (
                f"你是一位持续关注{interest_text}的探索者，"
                f"已经留下{len(notes)}条真实记录、收藏{len(favorites)}条内容，"
                f"并完成{completed}项待办。当前最明显的特征是从信息浏览逐步走向记录、行动与回顾。"
            ),
            "growth_keywords": growth_keywords,
        }

    def get_profile_counts(self, user_id: int) -> dict[str, int]:
        rows = self.client.query(
            """
            SELECT
                (SELECT COUNT(*) FROM notes WHERE user_id = ?) AS notes_count,
                (SELECT COUNT(*) FROM favorites WHERE user_id = ?) AS favorites_count,
                (SELECT COUNT(*) FROM todos WHERE user_id = ? AND status = 'completed') AS completed_todos,
                (SELECT COUNT(*) FROM todos WHERE user_id = ?) AS total_todos,
                (SELECT COUNT(*) FROM history_entries WHERE user_id = ?) AS history_count
            """,
            [user_id, user_id, user_id, user_id, user_id],
        )
        if not rows:
            return {
                "notes_count": 0,
                "favorites_count": 0,
                "completed_todos": 0,
                "total_todos": 0,
                "history_count": 0,
            }
        row = rows[0]
        return {
            "notes_count": int(row.get("notes_count") or 0),
            "favorites_count": int(row.get("favorites_count") or 0),
            "completed_todos": int(row.get("completed_todos") or 0),
            "total_todos": int(row.get("total_todos") or 0),
            "history_count": int(row.get("history_count") or 0),
        }

    def get_growth_overview_bundle(self, user_id: int) -> dict[str, Any]:
        rows = self.client.query(
            """
            SELECT
                (SELECT COUNT(*) FROM notes WHERE user_id = ?) AS notes_count,
                (SELECT COUNT(*) FROM favorites WHERE user_id = ?) AS favorites_count,
                (SELECT COUNT(*) FROM todos WHERE user_id = ? AND status = 'completed') AS completed_todos,
                (SELECT COUNT(*) FROM todos WHERE user_id = ?) AS total_todos,
                (SELECT COUNT(*) FROM history_entries WHERE user_id = ?) AS history_count,
                (SELECT title FROM briefings WHERE user_id = ? ORDER BY briefing_date DESC, id DESC LIMIT 1) AS latest_briefing_title,
                (SELECT briefing_date FROM briefings WHERE user_id = ? ORDER BY briefing_date DESC, id DESC LIMIT 1) AS latest_briefing_date,
                (SELECT content FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1) AS latest_note_content,
                (SELECT created_at FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 1) AS latest_note_created_at,
                (SELECT next_step FROM opportunity_follows WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1) AS latest_follow_next_step,
                (SELECT note FROM opportunity_follows WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1) AS latest_follow_note,
                (SELECT updated_at FROM opportunity_follows WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1) AS latest_follow_updated_at,
                (SELECT created_at FROM opportunity_follows WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1) AS latest_follow_created_at
            """,
            [
                user_id,
                user_id,
                user_id,
                user_id,
                user_id,
                user_id,
                user_id,
                user_id,
                user_id,
                user_id,
                user_id,
                user_id,
                user_id,
            ],
        )
        if not rows:
            return {
                "notes_count": 0,
                "favorites_count": 0,
                "completed_todos": 0,
                "total_todos": 0,
                "history_count": 0,
                "latest_briefing_title": None,
                "latest_briefing_date": None,
                "latest_note_content": None,
                "latest_note_created_at": None,
                "latest_follow_next_step": None,
                "latest_follow_note": None,
                "latest_follow_updated_at": None,
                "latest_follow_created_at": None,
            }
        row = rows[0]
        return {
            "notes_count": int(row.get("notes_count") or 0),
            "favorites_count": int(row.get("favorites_count") or 0),
            "completed_todos": int(row.get("completed_todos") or 0),
            "total_todos": int(row.get("total_todos") or 0),
            "history_count": int(row.get("history_count") or 0),
            "latest_briefing_title": row.get("latest_briefing_title"),
            "latest_briefing_date": row.get("latest_briefing_date"),
            "latest_note_content": row.get("latest_note_content"),
            "latest_note_created_at": row.get("latest_note_created_at"),
            "latest_follow_next_step": row.get("latest_follow_next_step"),
            "latest_follow_note": row.get("latest_follow_note"),
            "latest_follow_updated_at": row.get("latest_follow_updated_at"),
            "latest_follow_created_at": row.get("latest_follow_created_at"),
        }

    def list_activity_timestamps(self, user_id: int, *, limit: int = 120) -> list[str]:
        rows = self.client.query(
            """
            SELECT ts
            FROM (
                SELECT created_at AS ts FROM history_entries WHERE user_id = ? AND created_at IS NOT NULL
                UNION ALL
                SELECT created_at AS ts FROM notes WHERE user_id = ? AND created_at IS NOT NULL
                UNION ALL
                SELECT created_at AS ts FROM favorites WHERE user_id = ? AND created_at IS NOT NULL
                UNION ALL
                SELECT created_at AS ts FROM todos WHERE user_id = ? AND created_at IS NOT NULL
                UNION ALL
                SELECT COALESCE(updated_at, created_at) AS ts
                FROM opportunity_follows
                WHERE user_id = ? AND COALESCE(updated_at, created_at) IS NOT NULL
            )
            ORDER BY ts DESC
            LIMIT ?
            """,
            [user_id, user_id, user_id, user_id, user_id, limit],
        )
        return [str(row.get("ts") or "") for row in rows if row.get("ts")]

    def get_activity_streak(self, user_id: int, *, limit: int = 120) -> int:
        return calc_streak_from_timestamps(
            self.list_activity_timestamps(user_id, limit=limit),
            assume_utc=True,
        )

    def get_checked_in_today(self, user_id: int, *, limit: int = 120) -> bool:
        return is_checked_in_today(
            self.list_activity_timestamps(user_id, limit=limit),
            assume_utc=True,
        )

    def list_action_todos_grouped(self, user_id: int) -> list[dict[str, Any]]:
        rows = self.client.query(
            """
            WITH action_base AS (
                SELECT
                    id,
                    content,
                    status,
                    priority,
                    deadline,
                    tags,
                    created_at,
                    CASE
                        WHEN status = 'completed' THEN 'completed'
                        WHEN status IN ('pending', 'in_progress')
                             AND deadline IS NOT NULL
                             AND substr(deadline, 1, 10) > date('now', 'localtime') THEN 'future'
                        WHEN status IN ('pending', 'in_progress') THEN 'today'
                        ELSE NULL
                    END AS bucket
                FROM todos
                WHERE user_id = ?
                  AND status IN ('pending', 'in_progress', 'completed')
            ),
            ranked AS (
                SELECT
                    id,
                    content,
                    status,
                    priority,
                    deadline,
                    tags,
                    created_at,
                    bucket,
                    ROW_NUMBER() OVER (
                        PARTITION BY bucket
                        ORDER BY datetime(created_at) DESC, id DESC
                    ) AS rn
                FROM action_base
                WHERE bucket IS NOT NULL
            )
            SELECT id, content, status, priority, deadline, tags, created_at, bucket
            FROM ranked
            WHERE rn <= 10
            ORDER BY
                CASE bucket
                    WHEN 'today' THEN 0
                    WHEN 'future' THEN 1
                    WHEN 'completed' THEN 2
                    ELSE 3
                END,
                datetime(created_at) DESC,
                id DESC
            """,
            [user_id],
        )
        for row in rows:
            row["tags"] = json.loads(row.get("tags") or "[]")
        return rows

    def get_actions_overview_bundle(
        self,
        user_id: int,
        *,
        favorite_limit: int = 10,
        follow_limit: int = 20,
        streak_day_limit: int = 120,
    ) -> dict[str, Any]:
        rows = self.client.query(
            """
            SELECT
                COALESCE((
                    SELECT morning_brief_time
                    FROM user_settings
                    WHERE user_id = ?
                    LIMIT 1
                ), '08:00') AS morning_brief_time,
                COALESCE((
                    SELECT do_not_disturb_enabled
                    FROM user_settings
                    WHERE user_id = ?
                    LIMIT 1
                ), 0) AS do_not_disturb_enabled,
                (
                    SELECT json_group_array(
                        json_object(
                            'saved_id', id,
                            'title', item_title,
                            'content_type', item_type,
                            'source_name', item_source,
                            'saved_at', created_at,
                            'urgency_label', NULL
                        )
                    )
                    FROM (
                        SELECT id, item_title, item_type, item_source, created_at
                        FROM favorites
                        WHERE user_id = ?
                          AND item_type IN ('hot_topic', 'article', 'opportunity')
                        ORDER BY datetime(created_at) DESC, id DESC
                        LIMIT ?
                    )
                ) AS saved_for_later_json,
                (
                    SELECT json_group_array(
                        json_object(
                            'follow_id', follow_id,
                            'title', title,
                            'follow_status', follow_status,
                            'deadline', deadline,
                            'progress_text', progress_text,
                            'next_step', next_step
                        )
                    )
                    FROM (
                        SELECT
                            f.id AS follow_id,
                            o.title AS title,
                            f.status AS follow_status,
                            o.deadline AS deadline,
                            f.note AS progress_text,
                            f.next_step AS next_step
                        FROM opportunity_follows f
                        JOIN opportunities o ON o.id = f.opportunity_id
                        WHERE f.user_id = ?
                        ORDER BY datetime(f.updated_at) DESC, f.id DESC
                        LIMIT ?
                    )
                ) AS following_items_json,
                (
                    SELECT json_group_array(ts)
                    FROM (
                        SELECT created_at AS ts FROM history_entries WHERE user_id = ? AND created_at IS NOT NULL
                        UNION ALL
                        SELECT created_at AS ts FROM notes WHERE user_id = ? AND created_at IS NOT NULL
                        UNION ALL
                        SELECT created_at AS ts FROM favorites WHERE user_id = ? AND created_at IS NOT NULL
                        UNION ALL
                        SELECT created_at AS ts FROM todos WHERE user_id = ? AND created_at IS NOT NULL
                        UNION ALL
                        SELECT COALESCE(updated_at, created_at) AS ts
                        FROM opportunity_follows
                        WHERE user_id = ? AND COALESCE(updated_at, created_at) IS NOT NULL
                        ORDER BY ts DESC
                        LIMIT ?
                    )
                ) AS activity_timestamps_json
            """,
            [
                user_id,
                user_id,
                user_id,
                favorite_limit,
                user_id,
                follow_limit,
                user_id,
                user_id,
                user_id,
                user_id,
                user_id,
                streak_day_limit,
            ],
        )
        if not rows:
            return {
                "morning_brief_time": "08:00",
                "do_not_disturb_enabled": False,
                "saved_for_later": [],
                "following_items": [],
                "streak_days": 0,
            }
        row = rows[0]
        saved_for_later = json.loads(row.get("saved_for_later_json") or "[]")
        following_items = json.loads(row.get("following_items_json") or "[]")
        activity_timestamps = json.loads(row.get("activity_timestamps_json") or "[]")
        return {
            "morning_brief_time": row.get("morning_brief_time") or "08:00",
            "do_not_disturb_enabled": bool(row.get("do_not_disturb_enabled")),
            "saved_for_later": saved_for_later if isinstance(saved_for_later, list) else [],
            "following_items": following_items if isinstance(following_items, list) else [],
            "streak_days": calc_streak_from_timestamps(
                activity_timestamps if isinstance(activity_timestamps, list) else [],
                assume_utc=True,
            ),
            "checked_in_today": is_checked_in_today(
                activity_timestamps if isinstance(activity_timestamps, list) else [],
                assume_utc=True,
            ),
        }
