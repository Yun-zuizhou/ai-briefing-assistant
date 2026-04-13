from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from typing import Dict, Any
from loguru import logger
from datetime import datetime


class RSSScheduler:
    """RSS聚合调度器"""
    
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._setup_jobs()
    
    async def run_rss_aggregator(self):
        """运行RSS聚合"""
        await self._run_rss_aggregator('all', 'RSS聚合')
    
    async def run_rss_ai_tech(self):
        """运行AI技术类RSS"""
        await self._run_rss_aggregator('ai_tech', 'AI技术资讯聚合')
    
    async def run_rss_blog(self):
        """运行博客类RSS"""
        await self._run_rss_aggregator('blog', '技术博客聚合')
    
    async def run_rss_industry(self):
        """运行行业资讯类RSS"""
        await self._run_rss_aggregator('industry', '行业资讯聚合')
    
    async def run_rss_academic(self):
        """运行学术类RSS"""
        await self._run_rss_aggregator('academic', '学术动态聚合')
    
    async def _run_rss_aggregator(self, category: str, task_name: str):
        """运行RSS聚合"""
        from app.database import SessionLocal
        from app.services.crawler.rss_aggregator import RSSAggregator
        
        db = SessionLocal()
        
        try:
            logger.info(f"开始执行任务: {task_name}")
            
            aggregator = RSSAggregator(db)
            
            if category == 'all':
                stats = await aggregator.fetch_all()
            else:
                stats = await aggregator.fetch_by_category(category)
            
            logger.info(f"任务完成: {task_name}, {stats}")
            
        except Exception as e:
            logger.error(f"任务执行失败: {task_name}, error={e}")
            
        finally:
            db.close()
    
    async def run_hot_topic_aggregator(self):
        """运行热点聚合"""
        await self._run_hot_topic_aggregator('all', '热点聚合')
    
    async def run_hot_topic_weibo(self):
        """运行微博热搜爬虫"""
        await self._run_hot_topic_aggregator('weibo', '微博热搜')
    
    async def run_hot_topic_zhihu(self):
        """运行知乎热榜爬虫"""
        await self._run_hot_topic_aggregator('zhihu', '知乎热榜')
    
    async def run_hot_topic_toutiao(self):
        """运行今日头条爬虫"""
        await self._run_hot_topic_aggregator('toutiao', '今日头条')
    
    async def _run_hot_topic_aggregator(self, platform: str, task_name: str):
        """运行热点聚合"""
        from app.database import SessionLocal
        from app.services.crawler.hot_topic_aggregator import HotTopicAggregator
        
        db = SessionLocal()
        
        try:
            logger.info(f"开始执行任务: {task_name}")
            
            aggregator = HotTopicAggregator(db)
            
            if platform == 'all':
                stats = await aggregator.fetch_and_save_all()
            else:
                stats = await aggregator.fetch_and_save(platform)
            
            logger.info(f"任务完成: {task_name}, {stats}")
            
        except Exception as e:
            logger.error(f"任务执行失败: {task_name}, error={e}")
            
        finally:
            db.close()
    
    def _setup_jobs(self):
        """设置定时任务"""
        # RSS聚合任务
        # 每小时执行一次全量RSS聚合
        self.scheduler.add_job(
            self.run_rss_aggregator,
            IntervalTrigger(hours=1),
            id='rss_aggregator_hourly',
            name='RSS聚合',
            replace_existing=True
        )
        
        # AI技术资讯 - 每30分钟
        self.scheduler.add_job(
            self.run_rss_ai_tech,
            IntervalTrigger(minutes=30),
            id='rss_ai_tech',
            name='AI技术资讯聚合',
            replace_existing=True
        )
        
        # 学术动态 - 每2小时
        self.scheduler.add_job(
            self.run_rss_academic,
            IntervalTrigger(hours=2),
            id='rss_academic',
            name='学术动态聚合',
            replace_existing=True
        )
        
        # 热点聚合任务
        # 每30分钟执行一次全量热点聚合
        self.scheduler.add_job(
            self.run_hot_topic_aggregator,
            IntervalTrigger(minutes=30),
            id='hot_topic_aggregator',
            name='热点聚合',
            replace_existing=True
        )
        
        # 微博热搜 - 每15分钟
        self.scheduler.add_job(
            self.run_hot_topic_weibo,
            IntervalTrigger(minutes=15),
            id='hot_topic_weibo',
            name='微博热搜',
            replace_existing=True
        )
        
        # 知乎热榜 - 每20分钟
        self.scheduler.add_job(
            self.run_hot_topic_zhihu,
            IntervalTrigger(minutes=20),
            id='hot_topic_zhihu',
            name='知乎热榜',
            replace_existing=True
        )
        
        # 今日头条 - 每20分钟
        self.scheduler.add_job(
            self.run_hot_topic_toutiao,
            IntervalTrigger(minutes=20),
            id='hot_topic_toutiao',
            name='今日头条',
            replace_existing=True
        )
        
        logger.info("RSS和热点定时任务设置完成")
    
    def start(self):
        """启动调度器"""
        self.scheduler.start()
        logger.info("RSS调度器已启动")
    
    def stop(self):
        """停止调度器"""
        self.scheduler.shutdown()
        logger.info("RSS调度器已停止")


rss_scheduler = RSSScheduler()
