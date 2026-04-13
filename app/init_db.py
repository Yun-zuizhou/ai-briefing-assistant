from app.database import engine, Base
from app.models import (
    RSSSource, RSSArticle,
    User, Todo, HotTopic, Opportunity, Favorite, Note, HistoryEntry, UserSetting
)


def init_db():
    """初始化数据库，创建所有表"""
    Base.metadata.create_all(bind=engine)
    print("数据库初始化完成")


if __name__ == "__main__":
    init_db()
