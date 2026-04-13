"""
RSS聚合测试脚本

运行方式:
    python scripts/test_rss_aggregation.py

功能:
    1. 初始化数据库
    2. 同步RSS源配置
    3. 抓取RSS内容
    4. 验证数据质量
    5. 写入模拟数据集
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app.models import RSSSource, RSSArticle
from app.services.crawler.rss_aggregator import RSSAggregator
from app.services.data import mock_data_writer


def init_database():
    """初始化数据库"""
    print("=" * 50)
    print("1. 初始化数据库")
    print("=" * 50)
    
    Base.metadata.create_all(bind=engine)
    print("✅ 数据库表创建完成\n")


async def sync_rss_sources():
    """同步RSS源配置"""
    print("=" * 50)
    print("2. 同步RSS源配置")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        aggregator = RSSAggregator(db)
        await aggregator.sync_sources()
        
        sources = db.query(RSSSource).all()
        print(f"✅ 已同步 {len(sources)} 个RSS源:")
        for s in sources:
            status = "✓" if s.enabled else "✗"
            print(f"   [{status}] {s.name} ({s.category})")
        print()
    finally:
        db.close()


async def fetch_rss_content():
    """抓取RSS内容"""
    print("=" * 50)
    print("3. 抓取RSS内容")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        aggregator = RSSAggregator(db)
        
        stats = await aggregator.fetch_all()
        
        print(f"\n📊 抓取统计:")
        print(f"   - 源数量: {stats['sources_count']}")
        print(f"   - 总文章: {stats['total']}")
        print(f"   - 新增: {stats['created']}")
        print(f"   - 更新: {stats['updated']}")
        print(f"   - 错误: {stats['errors']}")
        print()
        
        return stats
    finally:
        db.close()


def show_articles():
    """显示抓取的文章"""
    print("=" * 50)
    print("4. 显示抓取的文章")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        articles = db.query(RSSArticle).order_by(
            RSSArticle.fetch_time.desc()
        ).limit(10).all()
        
        print(f"\n📰 最新10篇文章:\n")
        for i, a in enumerate(articles, 1):
            print(f"{i}. [{a.source_name}] {a.title[:50]}...")
            print(f"   分类: {a.category} | 标签: {', '.join(a.tags[:3]) if a.tags else '无'}")
            print(f"   质量: {a.quality_score:.2f}")
            print()
    finally:
        db.close()


def sync_to_mock_data():
    """同步到模拟数据集"""
    print("=" * 50)
    print("5. 同步到模拟数据集")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        articles = db.query(RSSArticle).all()
        
        article_list = [
            {
                "id": a.id,
                "title": a.title,
                "summary": a.summary,
                "source_name": a.source_name,
                "source_url": a.source_url,
                "author": a.author,
                "category": a.category,
                "tags": a.tags or [],
                "publish_time": a.publish_time.isoformat() if a.publish_time else None,
                "quality_score": a.quality_score,
            }
            for a in articles
        ]
        
        stats = mock_data_writer.write_rss_articles(article_list)
        
        print(f"\n📤 同步统计:")
        print(f"   - 总文章: {stats['total']}")
        print(f"   - 有效: {stats['valid']}")
        print(f"   - 无效: {stats['invalid']}")
        print(f"   - 新增: {stats['added']}")
        print()
        
        mock_stats = mock_data_writer.get_stats()
        print(f"📁 模拟数据集统计:")
        for name, info in mock_stats.items():
            print(f"   - {name}: {info['count']} 条")
        print()
        
    finally:
        db.close()


async def main():
    """主函数"""
    print("\n" + "=" * 50)
    print("🚀 RSS聚合测试脚本")
    print("=" * 50 + "\n")
    
    init_database()
    await sync_rss_sources()
    await fetch_rss_content()
    show_articles()
    sync_to_mock_data()
    
    print("=" * 50)
    print("✅ 测试完成!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
