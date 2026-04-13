from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

from app.database import get_db
from app.models.opportunity import Opportunity, OpportunityType, OpportunityStatus


router = APIRouter()


class OpportunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    type: str
    status: str
    source: str
    source_url: str
    summary: Optional[str]
    reward: Optional[str]
    location: Optional[str]
    is_remote: int
    deadline: Optional[str]
    tags: List[str]
    quality_score: float


class OpportunityListResponse(BaseModel):
    total: int
    items: List[OpportunityResponse]


@router.get("", response_model=OpportunityListResponse, summary="获取机会信息列表")
async def get_opportunities(
    type: Optional[str] = Query(None, description="机会类型: writing_submission, part_time_job, competition, internship, remote_job"),
    status: Optional[str] = Query(None, description="状态: active, expired, closed"),
    is_remote: Optional[int] = Query(None, description="是否远程: 0=现场, 1=远程"),
    limit: int = Query(20, ge=1, le=100, description="返回数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    min_quality: float = Query(0.0, ge=0, le=1, description="最低质量分数"),
    db: Session = Depends(get_db)
):
    """获取机会信息列表"""
    query = db.query(Opportunity)
    
    if type:
        try:
            query = query.filter(Opportunity.type == OpportunityType(type))
        except ValueError:
            pass
    
    if status:
        try:
            query = query.filter(Opportunity.status == OpportunityStatus(status))
        except ValueError:
            pass
    
    if is_remote is not None:
        query = query.filter(Opportunity.is_remote == is_remote)
    
    if min_quality > 0:
        query = query.filter(Opportunity.quality_score >= min_quality)
    
    total = query.count()
    
    items = query.order_by(
        Opportunity.quality_score.desc(),
        Opportunity.deadline.asc().nullslast()
    ).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "items": [
            OpportunityResponse(
                id=item.id,
                title=item.title,
                type=item.type.value if item.type else "",
                status=item.status.value if item.status else "",
                source=item.source,
                source_url=item.source_url,
                summary=item.summary,
                reward=item.reward,
                location=item.location,
                is_remote=item.is_remote,
                deadline=item.deadline.isoformat() if item.deadline else None,
                tags=item.tags or [],
                quality_score=item.quality_score
            )
            for item in items
        ]
    }


@router.get("/{opportunity_id}", response_model=OpportunityResponse, summary="获取机会信息详情")
async def get_opportunity(
    opportunity_id: int,
    db: Session = Depends(get_db)
):
    """获取机会信息详情"""
    opportunity = db.query(Opportunity).filter(Opportunity.id == opportunity_id).first()
    
    if not opportunity:
        raise HTTPException(status_code=404, detail="机会信息不存在")
    
    return OpportunityResponse(
        id=opportunity.id,
        title=opportunity.title,
        type=opportunity.type.value if opportunity.type else "",
        status=opportunity.status.value if opportunity.status else "",
        source=opportunity.source,
        source_url=opportunity.source_url,
        summary=opportunity.summary,
        reward=opportunity.reward,
        location=opportunity.location,
        is_remote=opportunity.is_remote,
        deadline=opportunity.deadline.isoformat() if opportunity.deadline else None,
        tags=opportunity.tags or [],
        quality_score=opportunity.quality_score
    )


@router.post("/sync", summary="已退役：请改用离线 demo 同步脚本")
async def sync_opportunities():
    raise HTTPException(
        status_code=410,
        detail="机会演示数据同步已从正式 API 退役，请改用 `npm.cmd run demo:sync`。",
    )
