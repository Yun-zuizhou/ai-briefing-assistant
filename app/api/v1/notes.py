from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.note import Note
from app.services.d1_behavior_store import D1BehaviorStore
router = APIRouter()


class NoteCreate(BaseModel):
    content: str
    source_type: str = "manual"
    source_id: int | None = None
    tags: list[str] = []


class NoteResponse(BaseModel):
    id: int
    content: str
    source_type: str
    source_id: int | None
    tags: list[str]
    created_at: str


class NoteListResponse(BaseModel):
    total: int
    items: list[NoteResponse]


@router.get("", response_model=NoteListResponse, summary="获取记录列表")
async def get_notes(
    user_id: int = Query(1, description="用户ID"),
    source_type: str | None = Query(None, description="来源类型过滤"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        items = D1BehaviorStore().list_notes(user_id=user_id, source_type=source_type)
        return {"total": len(items), "items": items}

    try:
        query = db.query(Note).filter(Note.user_id == user_id)

        if source_type:
            query = query.filter(Note.source_type == source_type)

        items = query.order_by(Note.created_at.desc()).all()

        return {
            "total": len(items),
            "items": [
                NoteResponse(
                    id=item.id,
                    content=item.content,
                    source_type=item.source_type,
                    source_id=item.source_id,
                    tags=item.tags or [],
                    created_at=item.created_at.isoformat() if item.created_at else "",
                )
                for item in items
            ],
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail="记录列表读取失败，请稍后重试") from exc


@router.post("", response_model=NoteResponse, summary="创建记录")
async def create_note(
    note_data: NoteCreate,
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        return NoteResponse(**D1BehaviorStore().create_note(user_id, note_data.model_dump()))

    note = Note(
        user_id=user_id,
        content=note_data.content,
        source_type=note_data.source_type,
        source_id=note_data.source_id,
        tags=note_data.tags,
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return NoteResponse(
        id=note.id,
        content=note.content,
        source_type=note.source_type,
        source_id=note.source_id,
        tags=note.tags or [],
        created_at=note.created_at.isoformat() if note.created_at else "",
    )


@router.delete("/{note_id}", summary="删除记录")
async def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        if not D1BehaviorStore().delete_note(note_id):
            raise HTTPException(status_code=404, detail="记录不存在")
        return {"success": True, "message": "记录已删除"}

    note = db.query(Note).filter(Note.id == note_id).first()

    if not note:
        raise HTTPException(status_code=404, detail="记录不存在")

    db.delete(note)
    db.commit()

    return {"success": True, "message": "记录已删除"}
