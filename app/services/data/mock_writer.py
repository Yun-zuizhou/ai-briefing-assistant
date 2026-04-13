import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
from loguru import logger

from app.config import settings
from app.services.data.validator import DataValidator


class MockDataWriter:
    """模拟数据写入服务 - 将合格的数据写入模拟数据集"""
    
    def __init__(self):
        self.mock_data_path = settings.MOCK_DATA_PATH
        self.validator = DataValidator()
        self._ensure_directories()
    
    def _ensure_directories(self):
        """确保目录存在"""
        dirs = [
            self.mock_data_path,
            os.path.join(self.mock_data_path, "hot-topics"),
            os.path.join(self.mock_data_path, "opportunities"),
            os.path.join(self.mock_data_path, "briefings"),
            os.path.join(self.mock_data_path, "user-data"),
            os.path.join(self.mock_data_path, "learning-resources"),
        ]
        for d in dirs:
            os.makedirs(d, exist_ok=True)
    
    def write_hot_topics(self, topics: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        写入热点资讯数据
        
        Returns:
            {"total": int, "valid": int, "invalid": int, "added": int}
        """
        stats = {"total": len(topics), "valid": 0, "invalid": 0, "added": 0}
        
        valid_topics = []
        for topic in topics:
            is_valid, errors = self.validator.validate_hot_topic(topic)
            if is_valid:
                topic["quality_score"] = self.validator.calculate_quality_score(topic, "hot_topic")
                valid_topics.append(topic)
                stats["valid"] += 1
            else:
                stats["invalid"] += 1
                logger.warning(f"热点资讯验证失败: {topic.get('title', 'Unknown')}, errors: {errors}")
        
        if valid_topics:
            file_path = os.path.join(self.mock_data_path, "hot-topics", "hot-topics.json")
            existing = self._read_existing(file_path)
            
            existing_urls = {t.get("source_url") for t in existing}
            for topic in valid_topics:
                if topic.get("source_url") not in existing_urls:
                    if "id" not in topic:
                        topic["id"] = len(existing) + 1
                    existing.append(topic)
                    stats["added"] += 1
            
            existing.sort(key=lambda x: x.get("hot_value", 0), reverse=True)
            
            self._write_json(file_path, existing)
            logger.info(f"热点资讯写入完成: 新增{stats['added']}条")
        
        return stats
    
    def write_opportunities(self, opportunities: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        写入机会信息数据
        
        Returns:
            {"total": int, "valid": int, "invalid": int, "added": int}
        """
        stats = {"total": len(opportunities), "valid": 0, "invalid": 0, "added": 0}
        
        valid_opps = []
        for opp in opportunities:
            is_valid, errors = self.validator.validate_opportunity(opp)
            if is_valid:
                opp["quality_score"] = self.validator.calculate_quality_score(opp, "opportunity")
                valid_opps.append(opp)
                stats["valid"] += 1
            else:
                stats["invalid"] += 1
                logger.warning(f"机会信息验证失败: {opp.get('title', 'Unknown')}, errors: {errors}")
        
        if valid_opps:
            file_path = os.path.join(self.mock_data_path, "opportunities", "opportunities.json")
            existing = self._read_existing(file_path)
            
            existing_urls = {o.get("source_url") for o in existing}
            for opp in valid_opps:
                if opp.get("source_url") not in existing_urls:
                    if "id" not in opp:
                        opp["id"] = len(existing) + 1
                    existing.append(opp)
                    stats["added"] += 1
            
            existing.sort(key=lambda x: x.get("quality_score", 0), reverse=True)
            
            self._write_json(file_path, existing)
            logger.info(f"机会信息写入完成: 新增{stats['added']}条")
        
        return stats
    
    def write_rss_articles(self, articles: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        写入RSS文章数据（转换为热点资讯格式）
        
        Returns:
            {"total": int, "valid": int, "invalid": int, "added": int}
        """
        stats = {"total": len(articles), "valid": 0, "invalid": 0, "added": 0}
        
        valid_articles = []
        for article in articles:
            is_valid, errors = self.validator.validate_rss_article(article)
            if is_valid:
                quality_score = self.validator.calculate_quality_score(article, "rss_article")
                article["quality_score"] = quality_score
                if self.validator.is_qualified(quality_score):
                    valid_articles.append(article)
                    stats["valid"] += 1
                else:
                    stats["invalid"] += 1
                    logger.debug(f"RSS文章质量分数过低: {article.get('title', 'Unknown')}, score: {quality_score}")
            else:
                stats["invalid"] += 1
                logger.warning(f"RSS文章验证失败: {article.get('title', 'Unknown')}, errors: {errors}")
        
        if valid_articles:
            hot_topics = []
            for article in valid_articles:
                hot_topic = {
                    "id": None,
                    "title": article.get("title"),
                    "summary": article.get("summary", ""),
                    "source": article.get("source_name"),
                    "source_url": article.get("source_url"),
                    "categories": [article.get("category", "其他")],
                    "tags": article.get("tags", []),
                    "published_at": article.get("publish_time"),
                    "hot_value": 0,
                    "quality_score": article.get("quality_score", 0),
                }
                hot_topics.append(hot_topic)
            
            file_path = os.path.join(self.mock_data_path, "hot-topics", "hot-topics.json")
            existing = self._read_existing(file_path)
            
            existing_urls = {t.get("source_url") for t in existing}
            new_id = len(existing) + 1
            for topic in hot_topics:
                if topic.get("source_url") not in existing_urls:
                    topic["id"] = new_id
                    existing.append(topic)
                    stats["added"] += 1
                    new_id += 1
            
            existing.sort(key=lambda x: x.get("quality_score", 0), reverse=True)
            
            self._write_json(file_path, existing)
            logger.info(f"RSS文章写入完成: 新增{stats['added']}条")
        
        return stats
    
    def write_learning_resources(self, resources: List[Dict[str, Any]]) -> Dict[str, int]:
        """写入学习资源数据"""
        stats = {"total": len(resources), "valid": 0, "invalid": 0, "added": 0}
        
        valid_resources = []
        for resource in resources:
            if resource.get("title") and resource.get("url"):
                valid_resources.append(resource)
                stats["valid"] += 1
            else:
                stats["invalid"] += 1
        
        if valid_resources:
            file_path = os.path.join(self.mock_data_path, "learning-resources", "learning-resources.json")
            existing = self._read_existing(file_path)
            
            existing_urls = {r.get("url") for r in existing}
            for resource in valid_resources:
                if resource.get("url") not in existing_urls:
                    if "id" not in resource:
                        resource["id"] = len(existing) + 1
                    existing.append(resource)
                    stats["added"] += 1
            
            self._write_json(file_path, existing)
            logger.info(f"学习资源写入完成: 新增{stats['added']}条")
        
        return stats
    
    def _read_existing(self, file_path: str) -> List[Dict[str, Any]]:
        """读取现有数据"""
        if os.path.exists(file_path):
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"读取文件失败: {file_path}, error: {e}")
                return []
        return []
    
    def _write_json(self, file_path: str, data: List[Dict[str, Any]]):
        """写入JSON文件"""
        try:
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            logger.error(f"写入文件失败: {file_path}, error: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """获取模拟数据统计"""
        stats = {}
        
        files = [
            ("hot_topics", "hot-topics/hot-topics.json"),
            ("opportunities", "opportunities/opportunities.json"),
            ("learning_resources", "learning-resources/learning-resources.json"),
        ]
        
        for name, path in files:
            file_path = os.path.join(self.mock_data_path, path)
            data = self._read_existing(file_path)
            stats[name] = {
                "count": len(data),
                "last_updated": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat() if os.path.exists(file_path) else None
            }
        
        return stats


mock_data_writer = MockDataWriter()
