from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, ConfigDict
from datetime import datetime

from app.config import settings
from app.database import get_db
from app.models.todo import Todo, TodoStatus, TodoPriority
from app.services.d1_behavior_store import D1BehaviorStore
router = APIRouter()


class TodoCreate(BaseModel):
    content: str
    description: Optional[str] = None
    priority: str = "medium"
    deadline: Optional[str] = None
    tags: List[str] = []


class TodoUpdate(BaseModel):
    content: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[str] = None
    tags: Optional[List[str]] = None


class TodoResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    content: str
    description: Optional[str]
    status: str
    priority: str
    deadline: Optional[str]
    tags: List[str]
    created_at: str


class TodoListResponse(BaseModel):
    total: int
    items: List[TodoResponse]


router = APIRouter()


@router.get("", response_model=TodoListResponse, summary="获取待办事项列表")
async def get_todos(
    status: Optional[str] = Query(None, description="状态: pending, in_progress, completed, cancelled"),
    priority: Optional[str] = Query(None, description="优先级: low, medium, high, urgent"),
    limit: int = Query(20, ge=1, le=100, description="返回数量"),
    offset: int = Query(0, ge=0, description="偏移量"),
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db)
):
    """获取待办事项列表"""
    if settings.D1_USE_CLOUD_AS_SOURCE:
        items = D1BehaviorStore().list_todos(user_id=user_id, status=status, priority=priority)
        return {"total": len(items), "items": items[offset: offset + limit]}

    try:
        query = db.query(Todo).filter(Todo.user_id == user_id)
        
        if status:
            try:
                query = query.filter(Todo.status == TodoStatus(status))
            except ValueError:
                pass
        
        if priority:
            try:
                query = query.filter(Todo.priority == TodoPriority(priority))
            except ValueError:
                pass
        
        total = query.count()
        
        items = query.order_by(
            Todo.priority.desc(),
            Todo.deadline.asc().nullslast(),
            Todo.created_at.desc()
        ).offset(offset).limit(limit).all()
        
        return {
            "total": total,
            "items": [
                TodoResponse(
                    id=item.id,
                    content=item.content,
                    description=item.description,
                    status=item.status.value if item.status else "pending",
                    priority=item.priority.value if item.priority else "medium",
                    deadline=item.deadline.isoformat() if item.deadline else None,
                    tags=item.tags or [],
                    created_at=item.created_at.isoformat() if item.created_at else ""
                )
                for item in items
            ]
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail="待办列表读取失败，请稍后重试") from exc


@router.post("", response_model=TodoResponse, summary="创建待办事项")
async def create_todo(
    todo_data: TodoCreate,
    user_id: int = Query(1, description="用户ID"),
    db: Session = Depends(get_db)
):
    """创建待办事项"""
    if settings.D1_USE_CLOUD_AS_SOURCE:
        return TodoResponse(**D1BehaviorStore().create_todo(user_id, todo_data.model_dump()))

    try:
        priority = TodoPriority(todo_data.priority)
    except ValueError:
        priority = TodoPriority.MEDIUM
    
    todo = Todo(
        user_id=user_id,
        content=todo_data.content,
        description=todo_data.description,
        priority=priority,
        status=TodoStatus.PENDING,
        tags=todo_data.tags,
    )
    
    if todo_data.deadline:
        try:
            todo.deadline = datetime.fromisoformat(todo_data.deadline.replace("Z", "+00:00"))
        except Exception:
            pass
    
    db.add(todo)
    db.commit()
    db.refresh(todo)
    
    return TodoResponse(
        id=todo.id,
        content=todo.content,
        description=todo.description,
        status=todo.status.value,
        priority=todo.priority.value,
        deadline=todo.deadline.isoformat() if todo.deadline else None,
        tags=todo.tags or [],
        created_at=todo.created_at.isoformat() if todo.created_at else ""
    )


@router.put("/{todo_id}", response_model=TodoResponse, summary="更新待办事项")
async def update_todo(
    todo_id: int,
    todo_data: TodoUpdate,
    db: Session = Depends(get_db)
):
    """更新待办事项"""
    if settings.D1_USE_CLOUD_AS_SOURCE:
        item = D1BehaviorStore().update_todo(todo_id, todo_data.model_dump(exclude_none=True))
        if not item:
            raise HTTPException(status_code=404, detail="待办事项不存在")
        return TodoResponse(**item)

    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    
    if not todo:
        raise HTTPException(status_code=404, detail="待办事项不存在")
    
    if todo_data.content is not None:
        todo.content = todo_data.content
    if todo_data.description is not None:
        todo.description = todo_data.description
    if todo_data.priority is not None:
        try:
            todo.priority = TodoPriority(todo_data.priority)
        except ValueError:
            pass
    if todo_data.status is not None:
        try:
            todo.status = TodoStatus(todo_data.status)
            if todo.status == TodoStatus.COMPLETED:
                todo.completed_at = datetime.now()
        except ValueError:
            pass
    if todo_data.deadline is not None:
        try:
            todo.deadline = datetime.fromisoformat(todo_data.deadline.replace("Z", "+00:00"))
        except Exception:
            pass
    if todo_data.tags is not None:
        todo.tags = todo_data.tags
    
    db.commit()
    db.refresh(todo)
    
    return TodoResponse(
        id=todo.id,
        content=todo.content,
        description=todo.description,
        status=todo.status.value,
        priority=todo.priority.value,
        deadline=todo.deadline.isoformat() if todo.deadline else None,
        tags=todo.tags or [],
        created_at=todo.created_at.isoformat() if todo.created_at else ""
    )


@router.delete("/{todo_id}", summary="删除待办事项")
async def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db)
):
    """删除待办事项"""
    if settings.D1_USE_CLOUD_AS_SOURCE:
        if not D1BehaviorStore().delete_todo(todo_id):
            raise HTTPException(status_code=404, detail="待办事项不存在")
        return {"success": True, "message": "待办事项已删除"}

    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    
    if not todo:
        raise HTTPException(status_code=404, detail="待办事项不存在")
    
    db.delete(todo)
    db.commit()
    
    return {"success": True, "message": "待办事项已删除"}
