from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.api.v1.page_schemas import CamelModel
from app.models.history import HistoryEntry
from app.services.d1_behavior_store import D1BehaviorStore
router = APIRouter()


def _build_content_ref(ref_type: str | None, ref_id: int | None) -> str | None:
    if ref_type not in {"hot_topic", "article", "opportunity"} or ref_id is None:
        return None
    return f"{ref_type}:{ref_id}"


def _parse_content_ref(content_ref: str) -> tuple[str, int]:
    try:
        ref_type, raw_id = content_ref.split(":", 1)
        return ref_type, int(raw_id)
    except (TypeError, ValueError):
        raise ValueError("content_ref 格式无效，应为 ref_type:id")


class HistoryCreate(CamelModel):
    event_type: str
    title: str
    summary: str | None = None
    ref_type: str | None = None
    ref_id: int | None = None
    content_ref: str | None = None


class HistoryResponse(CamelModel):
    id: int
    event_type: str
    title: str
    summary: str | None
    ref_type: str | None
    ref_id: int | None
    content_ref: str | None
    created_at: str


class HistoryListResponse(CamelModel):
    total: int
    items: list[HistoryResponse]


@router.get("", response_model=HistoryListResponse, summary="获取历史事件列表")
async def get_history(
    user_id: int = Query(1, description="用户ID"),
    event_type: str | None = Query(None, description="事件类型过滤"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        items = D1BehaviorStore().list_history(user_id=user_id, event_type=event_type)
        return {"total": len(items), "items": items}

    try:
        query = db.query(HistoryEntry).filter(HistoryEntry.user_id == user_id)

        if event_type:
            query = query.filter(HistoryEntry.event_type == event_type)

        items = query.order_by(HistoryEntry.created_at.desc()).all()

        return {
            "total": len(items),
            "items": [
                HistoryResponse(
                    id=item.id,
                    event_type=item.event_type,
                    title=item.title,
                    summary=item.summary,
                    ref_type=item.ref_type,
                    ref_id=item.ref_id,
                    content_ref=_build_content_ref(item.ref_type, item.ref_id),
                    created_at=item.created_at.isoformat() if item.created_at else "",
                )
                for item in items
            ],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail="历史列表读取失败，请稍后重试") from exc


@router.post("", response_model=HistoryResponse, summary="创建历史事件")
async def create_history(
    history_data: HistoryCreate,
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    ref_type = history_data.ref_type
    ref_id = history_data.ref_id
    if history_data.content_ref:
        try:
            ref_type, ref_id = _parse_content_ref(history_data.content_ref)
        except ValueError as exc:
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail=str(exc))

    if settings.D1_USE_CLOUD_AS_SOURCE:
        return HistoryResponse(**D1BehaviorStore().create_history(user_id, {
            "event_type": history_data.event_type,
            "title": history_data.title,
            "summary": history_data.summary,
            "ref_type": ref_type,
            "ref_id": ref_id,
        }))

    item = HistoryEntry(
        user_id=user_id,
        event_type=history_data.event_type,
        title=history_data.title,
        summary=history_data.summary,
        ref_type=ref_type,
        ref_id=ref_id,
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return HistoryResponse(
        id=item.id,
        event_type=item.event_type,
        title=item.title,
        summary=item.summary,
        ref_type=item.ref_type,
        ref_id=item.ref_id,
        content_ref=_build_content_ref(item.ref_type, item.ref_id),
        created_at=item.created_at.isoformat() if item.created_at else "",
    )
