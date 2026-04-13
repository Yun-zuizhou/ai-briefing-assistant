import json
from datetime import datetime
from pathlib import Path

from app.database import Base, SessionLocal, engine
from app.models.favorite import Favorite
from app.models.hot_topic import HotTopic
from app.models.note import Note
from app.models.opportunity import Opportunity, OpportunityStatus, OpportunityType
from app.models.todo import Todo, TodoPriority, TodoStatus
from app.models.user import User
from app.models.user_interest import UserInterest
from app.models.user_setting import UserSetting


ROOT = Path(__file__).resolve().parents[1]
MOCK_DIR = ROOT / "prototype" / "demo" / "mock-data"


def parse_datetime(value: str | None):
    if not value:
        return None
    text = str(value).replace("Z", "+00:00")
    try:
        return datetime.fromisoformat(text)
    except ValueError:
        return None


def load_json(path: Path, default):
    if not path.exists():
        return default
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def bootstrap_user(db):
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        user = User(
            id=1,
            username="testuser",
            email="test@example.com",
            hashed_password="temporary-dev-password",
            nickname="测试用户",
            interests=json.dumps(["AI", "写作"], ensure_ascii=False),
        )
        db.add(user)
        db.flush()

    if not db.query(UserInterest).filter(UserInterest.user_id == 1).count():
        db.add_all(
            [
                UserInterest(user_id=1, interest_name="AI", status="active"),
                UserInterest(user_id=1, interest_name="写作", status="active"),
            ]
        )

    if not db.query(UserSetting).filter(UserSetting.user_id == 1).first():
        db.add(UserSetting(user_id=1))


def bootstrap_hot_topics(db):
    if db.query(HotTopic).count():
        return
    items = load_json(MOCK_DIR / "hot-topics" / "hot-topics.json", [])
    for item in items[:20]:
        db.add(
            HotTopic(
                id=item.get("id"),
                title=item.get("title") or "未命名热点",
                summary=item.get("summary"),
                content=item.get("content"),
                source=item.get("source") or "mock",
                source_url=item.get("source_url") or f"https://example.com/hot-topics/{item.get('id')}",
                author=item.get("author"),
                categories=item.get("categories") or [],
                tags=item.get("tags") or [],
                keywords=item.get("keywords") or [],
                hot_value=item.get("hot_value") or 0,
                view_count=item.get("view_count") or 0,
                like_count=item.get("like_count") or 0,
                comment_count=item.get("comment_count") or 0,
                quality_score=item.get("quality_score") or 0,
                relevance_score=item.get("relevance_score") or 0,
                published_at=parse_datetime(item.get("published_at")),
                fetched_at=parse_datetime(item.get("fetched_at")),
                hot_comments=item.get("hot_comments") or [],
                guide_questions=item.get("guide_questions") or [],
                raw_data=item,
            )
        )


def normalize_opportunity_type(raw_type: str | None) -> OpportunityType:
    mapping = {
        "writing_submission": OpportunityType.WRITING_SUBMISSION,
        "part_time_job": OpportunityType.PART_TIME_JOB,
        "competition": OpportunityType.COMPETITION,
        "internship": OpportunityType.INTERNSHIP,
        "remote_job": OpportunityType.REMOTE_JOB,
    }
    return mapping.get(str(raw_type), OpportunityType.PART_TIME_JOB)


def bootstrap_opportunities(db):
    if db.query(Opportunity).count():
        return
    items = load_json(MOCK_DIR / "opportunities" / "opportunities.json", [])
    for item in items[:12]:
        db.add(
            Opportunity(
                id=item.get("id"),
                title=item.get("title") or "未命名机会",
                type=normalize_opportunity_type(item.get("type")),
                status=OpportunityStatus.ACTIVE if item.get("status", "active") == "active" else OpportunityStatus.CLOSED,
                source=item.get("source") or "mock",
                source_url=item.get("source_url") or f"https://example.com/opportunities/{item.get('id')}",
                source_id=item.get("source_id"),
                content=item.get("content"),
                summary=item.get("summary"),
                requirements=json.dumps(item.get("requirements") or [], ensure_ascii=False),
                published_at=parse_datetime(item.get("published_at")),
                deadline=parse_datetime(item.get("deadline")),
                start_time=parse_datetime(item.get("start_time")),
                reward=item.get("reward"),
                reward_min=item.get("reward_min"),
                reward_max=item.get("reward_max"),
                reward_unit=item.get("reward_unit"),
                location=item.get("location"),
                is_remote=1 if item.get("is_remote") else 0,
                tags=item.get("tags") or [],
                category=item.get("category"),
                quality_score=item.get("quality_score") or 0,
                reliability_score=item.get("reliability_score") or 0,
                view_count=item.get("view_count") or 0,
                favorite_count=item.get("favorite_count") or 0,
                fetched_at=parse_datetime(item.get("fetched_at")),
                updated_at=parse_datetime(item.get("updated_at")),
                raw_data=item,
            )
        )


def bootstrap_user_side_data(db):
    if not db.query(Note).filter(Note.user_id == 1).count():
        thoughts = load_json(MOCK_DIR / "user-data" / "thoughts.json", [])
        for item in thoughts[:2]:
            db.add(
                Note(
                    user_id=1,
                    content=item.get("content") or "默认测试记录",
                    source_type=item.get("source_type") or "manual",
                    source_id=item.get("source_id"),
                    tags=item.get("tags") or [],
                    created_at=parse_datetime(item.get("created_at")),
                )
            )

    if not db.query(Todo).filter(Todo.user_id == 1).count():
        db.add(
            Todo(
                user_id=1,
                content="跟进 Today / 内容层当前收束结果",
                description="环境初始化后默认生成的最小待办",
                status=TodoStatus.PENDING,
                priority=TodoPriority.MEDIUM,
                tags=["bootstrap"],
            )
        )

    if not db.query(Favorite).filter(Favorite.user_id == 1).count():
        favorites = load_json(MOCK_DIR / "user-data" / "favorites.json", [])
        for item in favorites[:2]:
            db.add(
                Favorite(
                    user_id=1,
                    item_type=item.get("item_type") or "hot_topic",
                    item_id=item.get("item_id") or 1,
                    item_title=item.get("item_title") or "默认收藏",
                    item_summary=item.get("item_summary"),
                    item_source=item.get("item_source"),
                    item_url=item.get("item_url"),
                    created_at=parse_datetime(item.get("created_at")),
                )
            )


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        bootstrap_user(db)
        bootstrap_hot_topics(db)
        bootstrap_opportunities(db)
        bootstrap_user_side_data(db)
        db.commit()
        print("Local SQLite runtime data is ready")
    finally:
        db.close()


if __name__ == "__main__":
    main()
