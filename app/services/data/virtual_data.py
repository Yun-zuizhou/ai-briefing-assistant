from __future__ import annotations

from copy import deepcopy
from datetime import datetime
from typing import Any


def _now() -> str:
    return datetime.now().isoformat()


def _initial_state() -> dict[str, Any]:
    now = _now()
    return {
        "next_ids": {
            "todo": 10003,
            "favorite": 20003,
            "note": 30003,
            "history": 40004,
        },
        "todos": [
            {
                "id": 10001,
                "content": "投递远程工作简历",
                "description": "通过对话创建的示例待办",
                "status": "pending",
                "priority": "medium",
                "deadline": now,
                "tags": ["chat"],
                "created_at": now,
            },
            {
                "id": 10002,
                "content": "整理本周学习笔记",
                "description": "虚拟数据示例",
                "status": "completed",
                "priority": "low",
                "deadline": now,
                "tags": ["note"],
                "created_at": now,
            },
        ],
        "favorites": [
            {
                "id": 20001,
                "item_type": "hot_topic",
                "item_id": 1,
                "item_title": "AI 模型应用正在从工具走向代理",
                "item_summary": "虚拟收藏数据，用于行动页演示。",
                "item_source": "虚拟来源",
                "item_url": "https://example.com/fake-hot-topic",
                "created_at": now,
            },
            {
                "id": 20002,
                "item_type": "opportunity",
                "item_id": 2,
                "item_title": "远程内容运营兼职",
                "item_summary": "虚拟收藏的机会信息。",
                "item_source": "虚拟来源",
                "item_url": "https://example.com/fake-opportunity",
                "created_at": now,
            },
        ],
        "notes": [
            {
                "id": 30001,
                "content": "今天突然想到，AI 发展太快了，人的节奏很容易被技术拖着走。",
                "source_type": "chat",
                "source_id": None,
                "tags": ["AI", "思考"],
                "created_at": now,
            },
            {
                "id": 30002,
                "content": "如果内容只看不记，就不会真的变成自己的东西。",
                "source_type": "manual",
                "source_id": None,
                "tags": ["学习", "记录"],
                "created_at": now,
            },
        ],
        "history": [
            {
                "id": 40001,
                "event_type": "todo_created",
                "title": "投递远程工作简历",
                "summary": "通过对话创建待办",
                "ref_type": "todo",
                "ref_id": 10001,
                "created_at": now,
            },
            {
                "id": 40002,
                "event_type": "note_created",
                "title": "新增记录",
                "summary": "记录了关于 AI 与节奏的想法",
                "ref_type": "note",
                "ref_id": 30001,
                "created_at": now,
            },
            {
                "id": 40003,
                "event_type": "interest_added",
                "title": "更新关注",
                "summary": "新增关注：AI、远程工作",
                "ref_type": None,
                "ref_id": None,
                "created_at": now,
            },
        ],
        "interests": ["AI", "远程工作"],
    }


_STATE = _initial_state()


def reset_virtual_state() -> None:
    global _STATE
    _STATE = _initial_state()


def _list_payload(key: str) -> dict[str, Any]:
    items = deepcopy(_STATE[key])
    return {"total": len(items), "items": items}


def get_virtual_todos() -> dict[str, Any]:
    return _list_payload("todos")


def get_virtual_favorites() -> dict[str, Any]:
    return _list_payload("favorites")


def get_virtual_notes() -> dict[str, Any]:
    return _list_payload("notes")


def get_virtual_history() -> dict[str, Any]:
    return _list_payload("history")


def create_virtual_todo(content: str, deadline_label: str = "待定") -> dict[str, Any]:
    todo_id = _STATE["next_ids"]["todo"]
    _STATE["next_ids"]["todo"] += 1
    now = _now()
    item = {
        "id": todo_id,
        "content": content,
        "description": f"通过对话虚拟创建，截止：{deadline_label}",
        "status": "pending",
        "priority": "medium",
        "deadline": now,
        "tags": ["chat", "virtual"],
        "created_at": now,
    }
    _STATE["todos"].insert(0, item)
    append_virtual_history(
        event_type="todo_created",
        title=content,
        summary=f"通过对话虚拟创建待办，截止：{deadline_label}",
        ref_type="todo",
        ref_id=todo_id,
    )
    return deepcopy(item)


def create_virtual_note(content: str, tags: list[str] | None = None) -> dict[str, Any]:
    note_id = _STATE["next_ids"]["note"]
    _STATE["next_ids"]["note"] += 1
    now = _now()
    item = {
        "id": note_id,
        "content": content,
        "source_type": "chat",
        "source_id": None,
        "tags": tags or [],
        "created_at": now,
    }
    _STATE["notes"].insert(0, item)
    append_virtual_history(
        event_type="note_created",
        title="新增记录",
        summary=content[:100],
        ref_type="note",
        ref_id=note_id,
    )
    return deepcopy(item)


def append_virtual_history(
    event_type: str,
    title: str,
    summary: str | None = None,
    ref_type: str | None = None,
    ref_id: int | None = None,
) -> dict[str, Any]:
    history_id = _STATE["next_ids"]["history"]
    _STATE["next_ids"]["history"] += 1
    now = _now()
    item = {
        "id": history_id,
        "event_type": event_type,
        "title": title,
        "summary": summary,
        "ref_type": ref_type,
        "ref_id": ref_id,
        "created_at": now,
    }
    _STATE["history"].insert(0, item)
    return deepcopy(item)


def add_virtual_interest(names: list[str]) -> list[str]:
    for name in names:
        if name not in _STATE["interests"]:
            _STATE["interests"].append(name)
    append_virtual_history(
        event_type="interest_added",
        title="更新关注",
        summary=f"新增关注：{'、'.join(names)}" if names else "关注内容已更新",
    )
    return deepcopy(_STATE["interests"])


def set_virtual_interests(names: list[str]) -> list[str]:
    deduped: list[str] = []
    for name in names:
        if name and name not in deduped:
            deduped.append(name)
    _STATE["interests"] = deduped
    return deepcopy(_STATE["interests"])


def remove_virtual_interest(names: list[str]) -> list[str]:
    _STATE["interests"] = [item for item in _STATE["interests"] if item not in names]
    append_virtual_history(
        event_type="interest_removed",
        title="更新关注",
        summary=f"移除关注：{'、'.join(names)}" if names else "关注内容已更新",
    )
    return deepcopy(_STATE["interests"])


def get_virtual_interests() -> list[str]:
    return deepcopy(_STATE["interests"])
