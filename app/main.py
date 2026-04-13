from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.api.v1 import (
    rss,
    hot_topics,
    opportunities,
    todos,
    auth,
    intent,
    chat,
    content,
    dashboard,
    actions,
    api_config,
    favorites,
    notes,
    history,
    preferences,
    reports,
)
from app.crawler.scheduler import rss_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    rss_scheduler.start()
    yield
    rss_scheduler.stop()


app = FastAPI(
    title="AI简报助手",
    description="每天一份简报，帮你收集世界，记录自己，看见成长",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["用户认证"])
app.include_router(hot_topics.router, prefix="/api/v1/hot-topics", tags=["热点资讯"])
app.include_router(opportunities.router, prefix="/api/v1/opportunities", tags=["机会信息"])
app.include_router(todos.router, prefix="/api/v1/todos", tags=["待办事项"])
app.include_router(favorites.router, prefix="/api/v1/favorites", tags=["收藏"])
app.include_router(notes.router, prefix="/api/v1/notes", tags=["记录"])
app.include_router(history.router, prefix="/api/v1/history", tags=["历史"])
app.include_router(preferences.router, prefix="/api/v1/preferences", tags=["用户偏好"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["报告"])
app.include_router(rss.router, prefix="/api/v1/rss", tags=["RSS管理"])
app.include_router(intent.router, prefix="/api/v1/intent", tags=["意图识别"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["对话执行"])
app.include_router(content.router, prefix="/api/v1/content", tags=["统一内容"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["今日聚合"])
app.include_router(actions.router, prefix="/api/v1/actions", tags=["行动概览"])
app.include_router(api_config.router, tags=["API配置"])


@app.get("/")
async def root():
    return {
        "message": "AI简报助手 API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
