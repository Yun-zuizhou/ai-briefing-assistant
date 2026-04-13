from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.api.v1.page_schemas import CamelModel
from app.models.favorite import Favorite
from app.services.d1_behavior_store import D1BehaviorStore
from app.services.data import get_virtual_favorites


router = APIRouter()


def _build_content_ref(item_type: str, item_id: int) -> str:
    return f"{item_type}:{item_id}"


def _parse_content_ref(content_ref: str) -> tuple[str, int]:
    try:
        item_type, raw_id = content_ref.split(":", 1)
        return item_type, int(raw_id)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="content_ref 格式无效，应为 item_type:id")


class FavoriteCreate(CamelModel):
    item_type: str | None = None
    item_id: int | None = None
    content_ref: str | None = None
    item_title: str
    item_summary: str | None = None
    item_source: str | None = None
    item_url: str | None = None


class FavoriteResponse(CamelModel):
    id: int
    item_type: str
    item_id: int
    content_ref: str
    item_title: str
    item_summary: str | None
    item_source: str | None
    item_url: str | None
    created_at: str


class FavoriteListResponse(CamelModel):
    total: int
    items: list[FavoriteResponse]


@router.get("", response_model=FavoriteListResponse, summary="获取收藏列表")
async def get_favorites(
    user_id: int = Query(1, description="用户ID"),
    item_type: str | None = Query(None, description="收藏类型过滤"),
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        items = D1BehaviorStore().list_favorites(user_id=user_id, item_type=item_type)
        return {"total": len(items), "items": items}

    try:
        query = db.query(Favorite).filter(Favorite.user_id == user_id)

        if item_type:
            query = query.filter(Favorite.item_type == item_type)

        items = query.order_by(Favorite.created_at.desc()).all()

        return {
            "total": len(items),
            "items": [
                FavoriteResponse(
                    id=item.id,
                    item_type=item.item_type,
                    item_id=item.item_id,
                    content_ref=_build_content_ref(item.item_type, item.item_id),
                    item_title=item.item_title,
                    item_summary=item.item_summary,
                    item_source=item.item_source,
                    item_url=item.item_url,
                    created_at=item.created_at.isoformat() if item.created_at else "",
                )
                for item in items
            ],
        }
    except Exception:
        return get_virtual_favorites()


@router.post("", response_model=FavoriteResponse, summary="创建收藏")
async def create_favorite(
    favorite_data: FavoriteCreate,
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db),
):
    item_type = favorite_data.item_type
    item_id = favorite_data.item_id
    if favorite_data.content_ref:
        item_type, item_id = _parse_content_ref(favorite_data.content_ref)

    if not item_type or item_id is None:
        raise HTTPException(status_code=400, detail="item_type/item_id 或 content_ref 至少需要提供一种")

    if settings.D1_USE_CLOUD_AS_SOURCE:
        return FavoriteResponse(**D1BehaviorStore().create_favorite(user_id, {
            "item_type": item_type,
            "item_id": item_id,
            "item_title": favorite_data.item_title,
            "item_summary": favorite_data.item_summary,
            "item_source": favorite_data.item_source,
            "item_url": favorite_data.item_url,
        }))

    existing = db.query(Favorite).filter(
        Favorite.user_id == user_id,
        Favorite.item_type == item_type,
        Favorite.item_id == item_id,
    ).first()

    if existing:
        return FavoriteResponse(
            id=existing.id,
            item_type=existing.item_type,
            item_id=existing.item_id,
            content_ref=_build_content_ref(existing.item_type, existing.item_id),
            item_title=existing.item_title,
            item_summary=existing.item_summary,
            item_source=existing.item_source,
            item_url=existing.item_url,
            created_at=existing.created_at.isoformat() if existing.created_at else "",
        )

    favorite = Favorite(
        user_id=user_id,
        item_type=item_type,
        item_id=item_id,
        item_title=favorite_data.item_title,
        item_summary=favorite_data.item_summary,
        item_source=favorite_data.item_source,
        item_url=favorite_data.item_url,
    )

    db.add(favorite)
    db.commit()
    db.refresh(favorite)

    return FavoriteResponse(
        id=favorite.id,
        item_type=favorite.item_type,
        item_id=favorite.item_id,
        content_ref=_build_content_ref(favorite.item_type, favorite.item_id),
        item_title=favorite.item_title,
        item_summary=favorite.item_summary,
        item_source=favorite.item_source,
        item_url=favorite.item_url,
        created_at=favorite.created_at.isoformat() if favorite.created_at else "",
    )


@router.delete("/{favorite_id}", summary="删除收藏")
async def delete_favorite(
    favorite_id: int,
    db: Session = Depends(get_db),
):
    if settings.D1_USE_CLOUD_AS_SOURCE:
        if not D1BehaviorStore().delete_favorite(favorite_id):
            raise HTTPException(status_code=404, detail="收藏不存在")
        return {"success": True, "message": "收藏已删除"}

    favorite = db.query(Favorite).filter(Favorite.id == favorite_id).first()

    if not favorite:
        raise HTTPException(status_code=404, detail="收藏不存在")

    db.delete(favorite)
    db.commit()

    return {"success": True, "message": "收藏已删除"}
