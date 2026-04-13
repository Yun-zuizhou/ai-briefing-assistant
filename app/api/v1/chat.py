import json

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.api.v1.intent import parse_intent
from app.api.v1.page_schemas import (
    ChatExecuteAffectedEntity,
    ChatExecuteResponse,
    ChatObjectChange,
    ChatSessionListItem,
    ChatSessionMessagesResponse,
    IntentRecognitionData,
)
from app.database import get_db
from app.models.history import HistoryEntry
from app.models.note import Note
from app.models.todo import Todo, TodoPriority, TodoStatus
from app.models.user import User
from app.models.user_interest import UserInterest
from app.services.d1_behavior_store import D1BehaviorStore
from app.services.d1_chat_session_store import D1ChatSessionStore
from app.services.chat_session_store import (
    append_chat_message,
    get_chat_session_messages,
    get_or_create_active_session,
    list_chat_sessions,
)
from app.services.data import (
    add_virtual_interest,
    create_virtual_note,
    create_virtual_todo,
    remove_virtual_interest,
    set_virtual_interests,
)


router = APIRouter()


class ChatRecognizeRequest(BaseModel):
    input: str
    current_interests: list[str] = []
    source_context: str | None = None


class ChatExecuteRequest(BaseModel):
    input: str
    current_interests: list[str] = []
    draft_type: str | None = None
    preferred_intent: str | None = None
    source_context: str | None = None
    auto_commit: bool = True
    confirmed_type: str | None = None
    correction_from: str | None = None


class ChatReclassifyRequest(BaseModel):
    target_intent: str
    correction_from: str
    original_input: str | None = None
    source_context: str | None = None


@router.get("/sessions", response_model=list[ChatSessionListItem], summary="获取对话会话列表")
async def get_chat_sessions(
    user_id: int = Query(1, description="用户ID"),
    limit: int = Query(20, ge=1, le=100, description="返回数量"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        return D1ChatSessionStore().list_chat_sessions(user_id=user_id, limit=limit)
    return list_chat_sessions(db, user_id=user_id, limit=limit)


@router.get("/sessions/{session_id}/messages", response_model=ChatSessionMessagesResponse, summary="按会话获取消息列表")
async def get_chat_session_messages_by_id(
    session_id: int,
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        payload = D1ChatSessionStore().get_chat_session_messages(user_id=user_id, session_id=session_id)
    else:
        payload = get_chat_session_messages(db, user_id=user_id, session_id=session_id)
    if payload is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="当前会话不存在")
    return payload


def _load_user_interests(user: User) -> list[str]:
    try:
        data = json.loads(user.interests or "[]")
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save_user_interests(user: User, interests: list[str]) -> None:
    user.interests = json.dumps(interests, ensure_ascii=False)


def _sync_user_interests_rows(db: Session, user_id: int, interests: list[str]) -> None:
    UserInterest.__table__.create(bind=db.get_bind(), checkfirst=True)
    normalized: list[str] = []
    for item in interests:
        name = str(item).strip()
        if name and name not in normalized:
            normalized.append(name)

    existing_rows = db.query(UserInterest).filter(UserInterest.user_id == user_id).all()
    existing_map = {row.interest_name: row for row in existing_rows}

    for row in existing_rows:
        if row.interest_name in normalized:
            row.status = "active"
        else:
            row.status = "inactive"

    for name in normalized:
        if name not in existing_map:
            db.add(
                UserInterest(
                    user_id=user_id,
                    interest_name=name,
                    status="active",
                )
            )


def _append_history(
    db: Session,
    user_id: int,
    event_type: str,
    title: str,
    summary: str | None = None,
    ref_type: str | None = None,
    ref_id: int | None = None,
) -> None:
    item = HistoryEntry(
        user_id=user_id,
        event_type=event_type,
        title=title,
        summary=summary,
        ref_type=ref_type,
        ref_id=ref_id,
    )
    db.add(item)


def _build_virtual_response(intent_type: str, entities: dict, user_input: str) -> ChatExecuteResponse:
    if intent_type == "chat_only":
        return ChatExecuteResponse(
            success=True,
            action_type=intent_type,
            candidate_intents=[intent_type],
            confirmed_type=intent_type,
            success_message="当前内容仅作为聊天处理",
            result_summary="这次不会写入待办、记录或关注，只保留对话反馈。",
        )

    if intent_type == "create_todo":
        content = str(entities.get("content", "")).strip() or user_input[:50]
        deadline_label = str(entities.get("deadline", "待定"))
        item = create_virtual_todo(content, deadline_label)
        return ChatExecuteResponse(
            success=True,
            action_type=intent_type,
            candidate_intents=[intent_type],
            affected_entity=ChatExecuteAffectedEntity(type="todo", id=item["id"]),
            confirmed_type=intent_type,
            success_message="已创建待办（虚拟写入）",
            result_summary=f"待办内容：{content}。当前数据库不可写，结果来自虚拟回退。",
            next_page_label="去待办页查看",
            deep_link="/todo",
        )

    if intent_type in {"record_thought", "fragmented_thought"}:
        content = str(entities.get("content", user_input)).strip()
        tags = entities.get("tags", [])
        item = create_virtual_note(content, tags if isinstance(tags, list) else [])
        return ChatExecuteResponse(
            success=True,
            action_type=intent_type,
            candidate_intents=[intent_type],
            affected_entity=ChatExecuteAffectedEntity(type="note", id=item["id"]),
            confirmed_type=intent_type,
            success_message="已记录你的想法（虚拟写入）",
            result_summary=f"{content[:80]}。当前数据库不可写，结果来自虚拟回退。",
            next_page_label="去日志页查看",
            deep_link="/log",
        )

    if intent_type in {"add_interest", "remove_interest"}:
        interests = entities.get("interests", [])
        names = [str(item) for item in interests] if isinstance(interests, list) else []
        action_text = "新增关注" if intent_type == "add_interest" else "移除关注"
        if intent_type == "add_interest":
            add_virtual_interest(names)
        else:
            remove_virtual_interest(names)
        return ChatExecuteResponse(
            success=True,
            action_type=intent_type,
            candidate_intents=[intent_type],
            affected_entity=ChatExecuteAffectedEntity(type="interest", id="virtual-interest"),
            confirmed_type=intent_type,
            success_message=f"已更新关注内容（虚拟写入）",
            result_summary=f"{action_text}：{'、'.join(names) if names else '无明确项'}。当前数据库不可写，结果来自虚拟回退。",
            next_page_label="返回今日页查看推荐变化",
            deep_link="/today",
        )

    if intent_type == "set_push_time":
        time_value = str(entities.get("time", "08:00"))
        return ChatExecuteResponse(
            success=True,
            action_type=intent_type,
            candidate_intents=[intent_type],
            affected_entity=ChatExecuteAffectedEntity(type="settings", id="virtual-settings"),
            confirmed_type=intent_type,
            success_message="已记录推送时间调整请求（虚拟写入）",
            result_summary=f"当前请求时间：{time_value}。当前数据库不可写，结果来自虚拟回退。",
            next_page_label="去通知设置查看",
            deep_link="/notification-settings",
        )

    return ChatExecuteResponse(
        success=True,
        action_type=intent_type,
        candidate_intents=[intent_type],
        affected_entity=ChatExecuteAffectedEntity(type="unknown", id="virtual"),
        confirmed_type=intent_type,
        success_message="已处理当前输入（虚拟写入）",
        result_summary="当前数据库不可写，结果来自虚拟回退。",
    )


def _build_assistant_message_content(success_message: str, result_summary: str | None = None) -> str:
    lines = [success_message]
    if result_summary:
        lines.extend(["", result_summary])
    return "\n".join(lines)


def _candidate_intents_json(candidate_intents: list[str]) -> list[str]:
    return candidate_intents


def _change_log_json(change_log: list[ChatObjectChange] | None) -> list[dict]:
    return [item.model_dump(by_alias=False) for item in (change_log or [])]


def _persist_execute_exchange_local(
    db: Session,
    *,
    user_id: int,
    user_message: str,
    source_context: str | None,
    intent_type: str,
    candidate_intents: list[str],
    confidence: float,
    matched_by: str | None,
    response: ChatExecuteResponse,
    message_state: str,
) -> None:
    session = get_or_create_active_session(
        db,
        user_id=user_id,
        source_context=source_context,
        user_message=user_message,
    )
    append_chat_message(
        db,
        session_id=session.id,
        role="user",
        content=user_message,
        message_state="recognized",
        source_context=source_context,
    )
    append_chat_message(
        db,
        session_id=session.id,
        role="assistant",
        content=_build_assistant_message_content(response.success_message, response.result_summary),
        message_state=message_state,
        intent_type=intent_type,
        candidate_intents=_candidate_intents_json(candidate_intents),
        confidence=confidence,
        source_context=response.source_context or source_context,
        matched_by=matched_by,
        confirmed_type=response.confirmed_type,
        action_type=response.action_type,
        result_summary=response.result_summary,
        deep_link=response.deep_link,
        next_page_label=response.next_page_label,
        affected_entity_type=response.affected_entity.type if response.affected_entity else None,
        affected_entity_id=response.affected_entity.id if response.affected_entity else None,
        change_log=_change_log_json(response.change_log),
    )


def _persist_execute_exchange_d1(
    *,
    session_store: D1ChatSessionStore,
    user_id: int,
    user_message: str,
    source_context: str | None,
    intent_type: str,
    candidate_intents: list[str],
    confidence: float,
    matched_by: str | None,
    response: ChatExecuteResponse,
    message_state: str,
) -> None:
    session = session_store.get_or_create_active_session(
        user_id=user_id,
        source_context=source_context,
        user_message=user_message,
    )
    session_store.append_chat_message(
        session_id=int(session["id"]),
        role="user",
        content=user_message,
        message_state="recognized",
        source_context=source_context,
    )
    session_store.append_chat_message(
        session_id=int(session["id"]),
        role="assistant",
        content=_build_assistant_message_content(response.success_message, response.result_summary),
        message_state=message_state,
        intent_type=intent_type,
        candidate_intents=_candidate_intents_json(candidate_intents),
        confidence=confidence,
        source_context=response.source_context or source_context,
        matched_by=matched_by,
        confirmed_type=response.confirmed_type,
        action_type=response.action_type,
        result_summary=response.result_summary,
        deep_link=response.deep_link,
        next_page_label=response.next_page_label,
        affected_entity_type=response.affected_entity.type if response.affected_entity else None,
        affected_entity_id=response.affected_entity.id if response.affected_entity else None,
        change_log=_change_log_json(response.change_log),
    )


def _persist_reclassify_message_local(
    db: Session,
    *,
    user_id: int,
    original_input: str,
    source_context: str | None,
    response: ChatExecuteResponse,
) -> None:
    session = get_or_create_active_session(
        db,
        user_id=user_id,
        source_context=source_context,
        user_message=original_input or "纠偏消息",
    )
    append_chat_message(
        db,
        session_id=session.id,
        role="assistant",
        content=_build_assistant_message_content(response.success_message, response.result_summary),
        message_state="executed",
        intent_type=response.confirmed_type,
        candidate_intents=[response.confirmed_type] if response.confirmed_type else [],
        source_context=response.source_context or source_context,
        confirmed_type=response.confirmed_type,
        action_type=response.action_type,
        result_summary=response.result_summary,
        deep_link=response.deep_link,
        next_page_label=response.next_page_label,
        affected_entity_type=response.affected_entity.type if response.affected_entity else None,
        affected_entity_id=response.affected_entity.id if response.affected_entity else None,
        change_log=_change_log_json(response.change_log),
    )


def _persist_reclassify_message_d1(
    *,
    session_store: D1ChatSessionStore,
    user_id: int,
    original_input: str,
    source_context: str | None,
    response: ChatExecuteResponse,
) -> None:
    session = session_store.get_or_create_active_session(
        user_id=user_id,
        source_context=source_context,
        user_message=original_input or "纠偏消息",
    )
    session_store.append_chat_message(
        session_id=int(session["id"]),
        role="assistant",
        content=_build_assistant_message_content(response.success_message, response.result_summary),
        message_state="executed",
        intent_type=response.confirmed_type,
        candidate_intents=[response.confirmed_type] if response.confirmed_type else [],
        source_context=response.source_context or source_context,
        confirmed_type=response.confirmed_type,
        action_type=response.action_type,
        result_summary=response.result_summary,
        deep_link=response.deep_link,
        next_page_label=response.next_page_label,
        affected_entity_type=response.affected_entity.type if response.affected_entity else None,
        affected_entity_id=response.affected_entity.id if response.affected_entity else None,
        change_log=_change_log_json(response.change_log),
    )


def _parse_correction_from(value: str) -> tuple[str, int]:
    correction_type, raw_id = value.split(":", 1)
    return correction_type, int(raw_id)


def _build_note_tags(target_intent: str, existing_tags: list[str] | None = None) -> list[str]:
    tags: list[str] = []
    for item in existing_tags or []:
        name = str(item).strip()
        if name and name not in tags:
            tags.append(name)

    if target_intent == "fragmented_thought" and "日常" not in tags:
        tags.append("日常")
    return tags


def _build_candidate_intents(text: str, current_interests: list[str], recognized_intent: str) -> list[str]:
    candidates: list[str] = []

    def append(intent_name: str | None) -> None:
        if intent_name and intent_name not in candidates:
            candidates.append(intent_name)

    append(recognized_intent)

    todo_candidate = parse_intent(text, current_interests)
    append(todo_candidate.get("type"))

    explicit_record_signals = ("记下", "记录", "保存这个想法", "帮我记", "写下")
    fragmented_signals = ("突然想到", "忽然想到", "有个想法", "记一下", "灵感来了", "碎碎念", "冒出个想法")

    if any(signal in text for signal in explicit_record_signals):
        append("record_thought")
    if any(signal in text for signal in fragmented_signals):
        append("fragmented_thought")
    if any(signal in text for signal in ("提醒我", "明天", "下周", "待办", "记得")):
        append("create_todo")
    append("chat_only")

    return candidates


def _requires_confirmation(intent_type: str, candidate_intents: list[str], confidence: float) -> bool:
    content_write_intents = {"create_todo", "record_thought", "fragmented_thought"}
    if intent_type not in content_write_intents:
        return False
    if len(candidate_intents) <= 1:
        return False
    return confidence < 0.9


@router.post("/recognize", response_model=IntentRecognitionData, summary="识别对话意图")
async def recognize_chat(request: ChatRecognizeRequest):
    result = parse_intent(request.input, request.current_interests)
    candidate_intents = _build_candidate_intents(
        request.input,
        request.current_interests,
        result["type"],
    )
    return IntentRecognitionData(
        recognized_intent=result["type"],
        candidate_intents=candidate_intents,
        confidence=result["confidence"],
        requires_confirmation=_requires_confirmation(result["type"], candidate_intents, result["confidence"]),
        extracted_entities=result["entities"],
        suggested_payload=result["entities"],
        source_context=request.source_context,
        matched_by=result.get("matchedBy"),
    )


@router.post("/execute", response_model=ChatExecuteResponse, summary="执行对话动作")
async def execute_chat(
    request: ChatExecuteRequest,
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    result = parse_intent(request.input, request.current_interests)
    candidate_intents = _build_candidate_intents(
        request.input,
        request.current_interests,
        result["type"],
    )
    intent_type = request.confirmed_type or result["type"]
    entities = result["entities"]
    requires_confirmation = (
        not request.auto_commit
        or _requires_confirmation(result["type"], candidate_intents, result["confidence"])
    )

    if settings.D1_USE_CLOUD_AS_SOURCE:
        store = D1BehaviorStore()
        session_store = D1ChatSessionStore(store.client)
        session_store = D1ChatSessionStore(store.client)
        store._ensure_user(user_id)
        if not request.auto_commit and not request.confirmed_type:
            response = ChatExecuteResponse(
                success=True,
                action_type=intent_type,
                candidate_intents=candidate_intents,
                requires_confirmation=requires_confirmation,
                confirmed_type=request.confirmed_type,
                success_message="当前输入已进入待确认状态",
                result_summary="系统已保留候选意图与建议载荷，等待前端确认后再正式写库。",
                source_context=request.source_context,
            )
            _persist_execute_exchange_d1(
                session_store=session_store,
                user_id=user_id,
                user_message=request.input,
                source_context=request.source_context,
                intent_type=result["type"],
                candidate_intents=candidate_intents,
                confidence=result["confidence"],
                matched_by=result.get("matchedBy"),
                response=response,
                message_state="pending_confirmation",
            )
            return response
        affected_entity: ChatExecuteAffectedEntity | None = None
        success_message = "已处理当前输入"
        result_summary: str | None = None
        next_page_label: str | None = None
        deep_link: str | None = None

        if intent_type == "chat_only":
            success_message = "当前内容仅作为聊天处理"
            result_summary = "这次不会写入待办、记录或关注，只保留对话反馈。"
        elif intent_type == "create_todo":
            content = str(entities.get("content", "")).strip() or request.input[:50]
            deadline_label = str(entities.get("deadline", "待定"))
            todo = store.create_chat_todo(user_id, content, deadline_label)
            affected_entity = ChatExecuteAffectedEntity(type="todo", id=todo["id"])
            success_message = "已创建待办"
            result_summary = f"待办内容：{todo['content']}"
            next_page_label = "去待办页查看"
            deep_link = "/todo"
        elif intent_type in {"record_thought", "fragmented_thought"}:
            content = str(entities.get("content", request.input)).strip()
            tags = entities.get("tags", [])
            note = store.create_chat_note(user_id, content, tags if isinstance(tags, list) else [], "chat", None)
            affected_entity = ChatExecuteAffectedEntity(type="note", id=note["id"])
            success_message = "已记录你的想法"
            result_summary = content[:80]
            next_page_label = "去日志页查看"
            deep_link = "/log"
        elif intent_type in {"add_interest", "remove_interest"}:
            interests = entities.get("interests", [])
            names = [str(item) for item in interests] if isinstance(interests, list) else []
            result_data = store.update_interest_action(user_id, names, "add" if intent_type == "add_interest" else "remove")
            success_message = "已更新关注内容" if intent_type == "add_interest" else "已移除关注内容"
            result_summary = result_data["summary"]
            affected_entity = ChatExecuteAffectedEntity(type="interest")
            next_page_label = "返回今日页查看推荐变化"
            deep_link = "/today"
        elif intent_type == "set_push_time":
            time_value = str(entities.get("time", "08:00"))
            store.record_push_request(user_id, time_value)
            affected_entity = ChatExecuteAffectedEntity(type="settings")
            success_message = "已记录你的推送时间调整请求"
            result_summary = f"当前请求时间：{time_value}"
            next_page_label = "去通知设置查看"
            deep_link = "/notification-settings"

        response = ChatExecuteResponse(
            success=True,
            action_type=intent_type,
            candidate_intents=candidate_intents,
            requires_confirmation=requires_confirmation,
            affected_entity=affected_entity,
            confirmed_type=request.confirmed_type or intent_type,
            success_message=success_message,
            result_summary=result_summary,
            next_page_label=next_page_label,
            deep_link=deep_link,
            source_context=request.source_context,
        )
        _persist_execute_exchange_d1(
            session_store=session_store,
            user_id=user_id,
            user_message=request.input,
            source_context=request.source_context,
            intent_type=result["type"],
            candidate_intents=candidate_intents,
            confidence=result["confidence"],
            matched_by=result.get("matchedBy"),
            response=response,
            message_state="executed",
        )
        return response

    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not request.auto_commit and not request.confirmed_type:
            response = ChatExecuteResponse(
                success=True,
                action_type=intent_type,
                candidate_intents=candidate_intents,
                requires_confirmation=requires_confirmation,
                confirmed_type=request.confirmed_type,
                success_message="当前输入已进入待确认状态",
                result_summary="系统已保留候选意图与建议载荷，等待前端确认后再正式写库。",
                source_context=request.source_context,
            )
            if user:
                _persist_execute_exchange_local(
                    db,
                    user_id=user_id,
                    user_message=request.input,
                    source_context=request.source_context,
                    intent_type=result["type"],
                    candidate_intents=candidate_intents,
                    confidence=result["confidence"],
                    matched_by=result.get("matchedBy"),
                    response=response,
                    message_state="pending_confirmation",
                )
                db.commit()
            return response
        if not user:
            return ChatExecuteResponse(
                success=False,
                action_type=intent_type,
                candidate_intents=candidate_intents,
                requires_confirmation=requires_confirmation,
                confirmed_type=request.confirmed_type,
                success_message="当前用户不存在，无法执行写入",
                result_summary="请先初始化默认用户或完成登录接入",
                source_context=request.source_context,
            )

        affected_entity: ChatExecuteAffectedEntity | None = None
        success_message = "已处理当前输入"
        result_summary: str | None = None
        next_page_label: str | None = None
        deep_link: str | None = None

        if intent_type == "chat_only":
            success_message = "当前内容仅作为聊天处理"
            result_summary = "这次不会写入待办、记录或关注，只保留对话反馈。"

        elif intent_type == "create_todo":
            content = str(entities.get("content", "")).strip() or request.input[:50]
            deadline_label = str(entities.get("deadline", "待定"))
            todo = Todo(
                user_id=user_id,
                content=content,
                description=f"通过对话创建，截止：{deadline_label}",
                priority=TodoPriority.MEDIUM,
                status=TodoStatus.PENDING,
                tags=["chat"],
            )
            db.add(todo)
            db.flush()
            _append_history(
                db,
                user_id=user_id,
                event_type="todo_created",
                title=todo.content,
                summary=f"通过对话创建待办，截止：{deadline_label}",
                ref_type="todo",
                ref_id=todo.id,
            )
            affected_entity = ChatExecuteAffectedEntity(type="todo", id=todo.id)
            success_message = "已创建待办"
            result_summary = f"待办内容：{todo.content}"
            next_page_label = "去待办页查看"
            deep_link = "/todo"

        elif intent_type in {"record_thought", "fragmented_thought"}:
            content = str(entities.get("content", request.input)).strip()
            tags = entities.get("tags", [])
            note = Note(
                user_id=user_id,
                content=content,
                source_type="chat",
                source_id=None,
                tags=tags if isinstance(tags, list) else [],
            )
            db.add(note)
            db.flush()
            user.total_thoughts = (user.total_thoughts or 0) + 1
            _append_history(
                db,
                user_id=user_id,
                event_type="note_created",
                title="新增记录",
                summary=content[:100],
                ref_type="note",
                ref_id=note.id,
            )
            affected_entity = ChatExecuteAffectedEntity(type="note", id=note.id)
            success_message = "已记录你的想法"
            result_summary = content[:80]
            next_page_label = "去日志页查看"
            deep_link = "/log"

        elif intent_type in {"add_interest", "remove_interest"}:
            current = _load_user_interests(user)
            interests = entities.get("interests", [])
            names = [str(item) for item in interests] if isinstance(interests, list) else []

            if intent_type == "add_interest":
                updated = current[:]
                for name in names:
                    if name not in updated:
                        updated.append(name)
                _save_user_interests(user, updated)
                _sync_user_interests_rows(db, user_id, updated)
                success_message = "已更新关注内容"
                result_summary = f"新增关注：{'、'.join(names)}" if names else "关注内容已更新"
                _append_history(db, user_id, "interest_added", "更新关注", result_summary)
            else:
                updated = [item for item in current if item not in names]
                _save_user_interests(user, updated)
                _sync_user_interests_rows(db, user_id, updated)
                success_message = "已移除关注内容"
                result_summary = f"移除关注：{'、'.join(names)}" if names else "关注内容已更新"
                _append_history(db, user_id, "interest_removed", "更新关注", result_summary)

            # 在“接口真实化、数据源虚拟化”阶段，Today 页仍读取共享虚拟兴趣状态。
            # 真实写入成功后同步镜像到虚拟状态，保证 Chat -> Today 的写后读一致。
            set_virtual_interests(updated)
            affected_entity = ChatExecuteAffectedEntity(type="interest")
            next_page_label = "返回今日页查看推荐变化"
            deep_link = "/today"

        elif intent_type == "set_push_time":
            time_value = str(entities.get("time", "08:00"))
            _append_history(
                db,
                user_id,
                "push_time_requested",
                "推送时间调整请求",
                f"请求将推送时间调整为 {time_value}",
            )
            affected_entity = ChatExecuteAffectedEntity(type="settings")
            success_message = "已记录你的推送时间调整请求"
            result_summary = f"当前请求时间：{time_value}"
            next_page_label = "去通知设置查看"
            deep_link = "/notification-settings"

        else:
            _append_history(db, user_id, "chat_interaction", "对话交互", request.input[:100])

        db.commit()

        response = ChatExecuteResponse(
            success=True,
            action_type=intent_type,
            candidate_intents=candidate_intents,
            requires_confirmation=requires_confirmation,
            affected_entity=affected_entity,
            confirmed_type=request.confirmed_type or intent_type,
            success_message=success_message,
            result_summary=result_summary,
            next_page_label=next_page_label,
            deep_link=deep_link,
            source_context=request.source_context,
        )
        _persist_execute_exchange_local(
            db,
            user_id=user_id,
            user_message=request.input,
            source_context=request.source_context,
            intent_type=result["type"],
            candidate_intents=candidate_intents,
            confidence=result["confidence"],
            matched_by=result.get("matchedBy"),
            response=response,
            message_state="executed",
        )
        db.commit()
        return response
    except Exception:
        return _build_virtual_response(intent_type, entities, request.input)


@router.post("/reclassify", response_model=ChatExecuteResponse, summary="纠偏重分类")
async def reclassify_chat(
    request: ChatReclassifyRequest,
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    try:
        correction_type, correction_id = _parse_correction_from(request.correction_from)
    except Exception:
        return ChatExecuteResponse(
            success=False,
            action_type=request.target_intent,
            confirmed_type=request.target_intent,
            success_message="纠偏来源格式无效",
            result_summary="请使用 correction_from=todo:id 或 note:id",
            source_context=request.source_context,
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return ChatExecuteResponse(
            success=False,
            action_type=request.target_intent,
            confirmed_type=request.target_intent,
            success_message="当前用户不存在，无法执行纠偏",
            result_summary="请先初始化默认用户或完成登录接入",
            source_context=request.source_context,
        )

    original_input = (request.original_input or "").strip()
    success_message = "已完成纠偏"
    result_summary: str | None = None
    next_page_label: str | None = None
    deep_link: str | None = None
    affected_entity: ChatExecuteAffectedEntity | None = None
    change_log: list[ChatObjectChange] = []

    if settings.D1_USE_CLOUD_AS_SOURCE:
        store = D1BehaviorStore()

        if correction_type == "history":
            history_rows = store.client.query(
                "SELECT id, ref_type, ref_id FROM history_entries WHERE id = ? AND user_id = ?",
                [correction_id, user_id],
            )
            if not history_rows:
                return ChatExecuteResponse(
                    success=False,
                    action_type=request.target_intent,
                    confirmed_type=request.target_intent,
                    success_message="未找到要纠偏的历史记录",
                    result_summary="当前历史事件不存在或不属于该用户",
                    source_context=request.source_context,
                )
            history_item = history_rows[0]
            if history_item.get("ref_type") not in {"todo", "note"} or history_item.get("ref_id") is None:
                return ChatExecuteResponse(
                    success=False,
                    action_type=request.target_intent,
                    confirmed_type=request.target_intent,
                    success_message="这条历史记录当前不支持纠偏",
                    result_summary="目前只支持指向 todo / note 的历史记录进入最小纠偏链路",
                    source_context=request.source_context,
                )
            correction_type = history_item["ref_type"]
            correction_id = int(history_item["ref_id"])

        if correction_type == "todo":
            todo = store.get_todo(correction_id, user_id)
            if not todo:
                return ChatExecuteResponse(success=False, action_type=request.target_intent, confirmed_type=request.target_intent, success_message="未找到要纠偏的待办", result_summary="当前待办不存在或不属于该用户", source_context=request.source_context)
            original_text = original_input or todo["content"]

            if request.target_intent in {"record_thought", "fragmented_thought"}:
                note = store.reclassify_todo_to_note(user_id, correction_id, original_text, request.target_intent)
                affected_entity = ChatExecuteAffectedEntity(type="note", id=note["id"])
                success_message = "已改成记录"
                result_summary = f"原待办 #{correction_id} 已取消，新记录已生成"
                next_page_label = "去日志页查看"
                deep_link = "/log"
                change_log = [
                    ChatObjectChange(entity_type="todo", entity_id=correction_id, change="cancelled", summary="原待办已取消"),
                    ChatObjectChange(entity_type="note", entity_id=note["id"], change="created", summary="新记录已生成"),
                ]
            elif request.target_intent == "chat_only":
                store.reclassify_todo_to_chat_only(user_id, correction_id)
                success_message = "已改成仅聊天"
                result_summary = f"原待办 #{correction_id} 已取消，本次不再保留结构化对象"
                change_log = [
                    ChatObjectChange(entity_type="todo", entity_id=correction_id, change="cancelled", summary="原待办已取消"),
                ]
            else:
                return ChatExecuteResponse(
                    success=True,
                    action_type=request.target_intent,
                    affected_entity=ChatExecuteAffectedEntity(type="todo", id=correction_id),
                    confirmed_type=request.target_intent,
                    success_message="当前待办无需再次改成待办",
                    result_summary=f"待办 #{correction_id} 已保留，无需重复创建",
                    next_page_label="去待办页查看",
                    deep_link="/todo",
                    source_context=request.source_context,
                    change_log=[ChatObjectChange(entity_type="todo", entity_id=correction_id, change="kept", summary="原待办已保留")],
                )

        elif correction_type == "note":
            note = store.get_note(correction_id, user_id)
            if not note:
                return ChatExecuteResponse(success=False, action_type=request.target_intent, confirmed_type=request.target_intent, success_message="未找到要纠偏的记录", result_summary="当前记录不存在或不属于该用户", source_context=request.source_context)
            original_text = original_input or note["content"]

            if request.target_intent == "create_todo":
                todo = store.reclassify_note_to_todo(user_id, correction_id, original_text)
                affected_entity = ChatExecuteAffectedEntity(type="todo", id=todo["id"])
                success_message = "已改成待办"
                result_summary = f"原记录 #{correction_id} 已保留，新待办已生成"
                next_page_label = "去待办页查看"
                deep_link = "/todo"
                change_log = [
                    ChatObjectChange(entity_type="note", entity_id=correction_id, change="kept", summary="原记录已保留"),
                    ChatObjectChange(entity_type="todo", entity_id=todo["id"], change="created", summary="新待办已生成"),
                ]
            elif request.target_intent in {"record_thought", "fragmented_thought"}:
                tags = _build_note_tags(request.target_intent, note.get("tags") if isinstance(note.get("tags"), list) else [])
                store.retag_note(user_id, correction_id, tags)
                affected_entity = ChatExecuteAffectedEntity(type="note", id=correction_id)
                success_message = "已更新记录类型"
                result_summary = f"记录 #{correction_id} 已保留，并按新的理解方式重新标注"
                next_page_label = "去日志页查看"
                deep_link = "/log"
                change_log = [
                    ChatObjectChange(entity_type="note", entity_id=correction_id, change="retagged", summary="原记录已重新标注"),
                ]
            elif request.target_intent == "chat_only":
                success_message = "已调整为仅聊天口径"
                result_summary = f"原记录 #{correction_id} 已保留，本次只调整理解口径，不删除已写入内容"
                change_log = [
                    ChatObjectChange(entity_type="note", entity_id=correction_id, change="kept", summary="原记录已保留"),
                ]
            else:
                return ChatExecuteResponse(success=False, action_type=request.target_intent, confirmed_type=request.target_intent, success_message="当前纠偏目标不受支持", result_summary="目前只支持改成待办 / 记录 / 碎片 / 仅聊天", source_context=request.source_context)
        else:
            return ChatExecuteResponse(success=False, action_type=request.target_intent, confirmed_type=request.target_intent, success_message="当前纠偏来源不受支持", result_summary="目前只支持 todo、note，以及指向它们的 history 进入最小纠偏", source_context=request.source_context)

        response = ChatExecuteResponse(
            success=True,
            action_type=request.target_intent,
            affected_entity=affected_entity,
            confirmed_type=request.target_intent,
            success_message=success_message,
            result_summary=result_summary,
            next_page_label=next_page_label,
            deep_link=deep_link,
            source_context=request.source_context,
            change_log=change_log,
        )
        _persist_reclassify_message_d1(
            session_store=session_store,
            user_id=user_id,
            original_input=original_input,
            source_context=request.source_context,
            response=response,
        )
        return response

    if correction_type == "history":
        history_item = (
            db.query(HistoryEntry)
            .filter(HistoryEntry.id == correction_id, HistoryEntry.user_id == user_id)
            .first()
        )
        if not history_item:
            return ChatExecuteResponse(
                success=False,
                action_type=request.target_intent,
                confirmed_type=request.target_intent,
                success_message="未找到要纠偏的历史记录",
                result_summary="当前历史事件不存在或不属于该用户",
                source_context=request.source_context,
            )
        if history_item.ref_type not in {"todo", "note"} or history_item.ref_id is None:
            return ChatExecuteResponse(
                success=False,
                action_type=request.target_intent,
                confirmed_type=request.target_intent,
                success_message="这条历史记录当前不支持纠偏",
                result_summary="目前只支持指向 todo / note 的历史记录进入最小纠偏链路",
                source_context=request.source_context,
            )
        correction_type = history_item.ref_type
        correction_id = history_item.ref_id

    if correction_type == "todo":
        todo = db.query(Todo).filter(Todo.id == correction_id, Todo.user_id == user_id).first()
        if not todo:
            return ChatExecuteResponse(
                success=False,
                action_type=request.target_intent,
                confirmed_type=request.target_intent,
                success_message="未找到要纠偏的待办",
                result_summary="当前待办不存在或不属于该用户",
                source_context=request.source_context,
            )

        original_text = original_input or todo.content

        if request.target_intent in {"record_thought", "fragmented_thought"}:
            note = Note(
                user_id=user_id,
                content=original_text,
                source_type="chat_reclassified",
                source_id=todo.id,
                tags=_build_note_tags(request.target_intent, ["纠偏"]),
            )
            db.add(note)
            db.flush()
            user.total_thoughts = (user.total_thoughts or 0) + 1
            todo.status = TodoStatus.CANCELLED
            todo.description = (todo.description or "") + "\n已纠偏改成记录"
            _append_history(
                db,
                user_id=user_id,
                event_type="chat_reclassified",
                title="待办纠偏为记录",
                summary=f"原待办 #{todo.id} 已取消，并生成记录 #{note.id}",
                ref_type="note",
                ref_id=note.id,
            )
            affected_entity = ChatExecuteAffectedEntity(type="note", id=note.id)
            success_message = "已改成记录"
            result_summary = f"原待办 #{todo.id} 已取消，新记录已生成"
            next_page_label = "去日志页查看"
            deep_link = "/log"
            change_log = [
                ChatObjectChange(entity_type="todo", entity_id=todo.id, change="cancelled", summary="原待办已取消"),
                ChatObjectChange(entity_type="note", entity_id=note.id, change="created", summary="新记录已生成"),
            ]
        elif request.target_intent == "chat_only":
            todo.status = TodoStatus.CANCELLED
            todo.description = (todo.description or "") + "\n已纠偏改为仅聊天"
            _append_history(
                db,
                user_id=user_id,
                event_type="chat_reclassified",
                title="待办纠偏为仅聊天",
                summary=f"原待办 #{todo.id} 已取消，本次按仅聊天理解处理",
                ref_type="todo",
                ref_id=todo.id,
            )
            success_message = "已改成仅聊天"
            result_summary = f"原待办 #{todo.id} 已取消，本次不再保留结构化对象"
            change_log = [
                ChatObjectChange(entity_type="todo", entity_id=todo.id, change="cancelled", summary="原待办已取消"),
            ]
        else:
            return ChatExecuteResponse(
                success=True,
                action_type=request.target_intent,
                affected_entity=ChatExecuteAffectedEntity(type="todo", id=todo.id),
                confirmed_type=request.target_intent,
                success_message="当前待办无需再次改成待办",
                result_summary=f"待办 #{todo.id} 已保留，无需重复创建",
                next_page_label="去待办页查看",
                deep_link="/todo",
                source_context=request.source_context,
                change_log=[
                    ChatObjectChange(entity_type="todo", entity_id=todo.id, change="kept", summary="原待办已保留"),
                ],
            )

    elif correction_type == "note":
        note = db.query(Note).filter(Note.id == correction_id, Note.user_id == user_id).first()
        if not note:
            return ChatExecuteResponse(
                success=False,
                action_type=request.target_intent,
                confirmed_type=request.target_intent,
                success_message="未找到要纠偏的记录",
                result_summary="当前记录不存在或不属于该用户",
                source_context=request.source_context,
            )

        original_text = original_input or note.content

        if request.target_intent == "create_todo":
            todo = Todo(
                user_id=user_id,
                content=original_text[:500],
                description=f"由记录 #{note.id} 纠偏生成",
                priority=TodoPriority.MEDIUM,
                status=TodoStatus.PENDING,
                related_type="note",
                related_id=note.id,
                related_title=note.content[:100],
                tags=["chat", "纠偏"],
            )
            db.add(todo)
            db.flush()
            _append_history(
                db,
                user_id=user_id,
                event_type="chat_reclassified",
                title="记录纠偏为待办",
                summary=f"原记录 #{note.id} 已保留，新待办 #{todo.id} 已生成",
                ref_type="todo",
                ref_id=todo.id,
            )
            affected_entity = ChatExecuteAffectedEntity(type="todo", id=todo.id)
            success_message = "已改成待办"
            result_summary = f"原记录 #{note.id} 已保留，新待办已生成"
            next_page_label = "去待办页查看"
            deep_link = "/todo"
            change_log = [
                ChatObjectChange(entity_type="note", entity_id=note.id, change="kept", summary="原记录已保留"),
                ChatObjectChange(entity_type="todo", entity_id=todo.id, change="created", summary="新待办已生成"),
            ]
        elif request.target_intent in {"record_thought", "fragmented_thought"}:
            note.tags = _build_note_tags(request.target_intent, note.tags if isinstance(note.tags, list) else [])
            _append_history(
                db,
                user_id=user_id,
                event_type="chat_reclassified",
                title="记录类型已调整",
                summary=f"记录 #{note.id} 已按 {request.target_intent} 重新标注",
                ref_type="note",
                ref_id=note.id,
            )
            affected_entity = ChatExecuteAffectedEntity(type="note", id=note.id)
            success_message = "已更新记录类型"
            result_summary = f"记录 #{note.id} 已保留，并按新的理解方式重新标注"
            next_page_label = "去日志页查看"
            deep_link = "/log"
            change_log = [
                ChatObjectChange(entity_type="note", entity_id=note.id, change="retagged", summary="原记录已重新标注"),
            ]
        elif request.target_intent == "chat_only":
            _append_history(
                db,
                user_id=user_id,
                event_type="chat_reclassified",
                title="记录纠偏为仅聊天",
                summary=f"记录 #{note.id} 已保留，但当前口径调整为仅聊天",
                ref_type="note",
                ref_id=note.id,
            )
            success_message = "已调整为仅聊天口径"
            result_summary = f"原记录 #{note.id} 已保留，本次只调整理解口径，不删除已写入内容"
            change_log = [
                ChatObjectChange(entity_type="note", entity_id=note.id, change="kept", summary="原记录已保留"),
            ]
        else:
            return ChatExecuteResponse(
                success=False,
                action_type=request.target_intent,
                confirmed_type=request.target_intent,
                success_message="当前纠偏目标不受支持",
                result_summary="目前只支持改成待办 / 记录 / 碎片 / 仅聊天",
                source_context=request.source_context,
            )
    else:
        return ChatExecuteResponse(
            success=False,
            action_type=request.target_intent,
            confirmed_type=request.target_intent,
            success_message="当前纠偏来源不受支持",
            result_summary="目前只支持 todo、note，以及指向它们的 history 进入最小纠偏",
            source_context=request.source_context,
        )

    db.commit()

    response = ChatExecuteResponse(
        success=True,
        action_type=request.target_intent,
        affected_entity=affected_entity,
        confirmed_type=request.target_intent,
        success_message=success_message,
        result_summary=result_summary,
        next_page_label=next_page_label,
        deep_link=deep_link,
        source_context=request.source_context,
        change_log=change_log,
    )
    _persist_reclassify_message_local(
        db,
        user_id=user_id,
        original_input=original_input,
        source_context=request.source_context,
        response=response,
    )
    db.commit()
    return response
