from typing import Dict, Any, List, Optional
from datetime import datetime
import re
from loguru import logger


class DataValidator:
    """数据验证服务 - 确保只有合格的数据才写入模拟数据集"""
    
    MIN_TITLE_LENGTH = 5
    MAX_TITLE_LENGTH = 500
    MIN_SUMMARY_LENGTH = 10
    MAX_SUMMARY_LENGTH = 1000
    MIN_CONTENT_LENGTH = 20
    
    QUALITY_THRESHOLD = 0.3
    
    RELIABLE_SOURCES = [
        "arxiv", "openai", "google", "微软", "美团", "字节跳动",
        "阮一峰", "量子位", "infoq", "36氪", "少数派", "虎嗅"
    ]
    
    @staticmethod
    def validate_hot_topic(data: Dict[str, Any]) -> tuple[bool, List[str]]:
        """验证热点资讯数据"""
        errors = []
        
        if not data.get("title"):
            errors.append("标题不能为空")
        elif len(data["title"]) < DataValidator.MIN_TITLE_LENGTH:
            errors.append(f"标题长度不能少于{DataValidator.MIN_TITLE_LENGTH}个字符")
        elif len(data["title"]) > DataValidator.MAX_TITLE_LENGTH:
            errors.append(f"标题长度不能超过{DataValidator.MAX_TITLE_LENGTH}个字符")
        
        if not data.get("source"):
            errors.append("来源不能为空")
        
        if not data.get("source_url"):
            errors.append("来源URL不能为空")
        elif not DataValidator._is_valid_url(data["source_url"]):
            errors.append("来源URL格式不正确")
        
        is_valid = len(errors) == 0
        if not is_valid:
            logger.warning(f"热点资讯验证失败: {errors}")
        
        return is_valid, errors
    
    @staticmethod
    def validate_opportunity(data: Dict[str, Any]) -> tuple[bool, List[str]]:
        """验证机会信息数据"""
        errors = []
        
        if not data.get("title"):
            errors.append("标题不能为空")
        elif len(data["title"]) < DataValidator.MIN_TITLE_LENGTH:
            errors.append(f"标题长度不能少于{DataValidator.MIN_TITLE_LENGTH}个字符")
        
        if not data.get("type"):
            errors.append("机会类型不能为空")
        
        if not data.get("source"):
            errors.append("来源不能为空")
        
        if not data.get("source_url"):
            errors.append("来源URL不能为空")
        elif not DataValidator._is_valid_url(data["source_url"]):
            errors.append("来源URL格式不正确")
        
        deadline = data.get("deadline")
        if deadline:
            try:
                if isinstance(deadline, str):
                    dt = datetime.fromisoformat(deadline.replace("Z", "+00:00"))
                    if dt < datetime.now():
                        errors.append("截止日期已过期")
            except Exception:
                pass
        
        is_valid = len(errors) == 0
        if not is_valid:
            logger.warning(f"机会信息验证失败: {errors}")
        
        return is_valid, errors
    
    @staticmethod
    def validate_rss_article(data: Dict[str, Any]) -> tuple[bool, List[str]]:
        """验证RSS文章数据"""
        errors = []
        
        if not data.get("title"):
            errors.append("标题不能为空")
        elif len(data["title"]) < DataValidator.MIN_TITLE_LENGTH:
            errors.append(f"标题长度不能少于{DataValidator.MIN_TITLE_LENGTH}个字符")
        
        if not data.get("source_url"):
            errors.append("来源URL不能为空")
        elif not DataValidator._is_valid_url(data["source_url"]):
            errors.append("来源URL格式不正确")
        
        if not data.get("source_name"):
            errors.append("来源名称不能为空")
        
        is_valid = len(errors) == 0
        if not is_valid:
            logger.warning(f"RSS文章验证失败: {errors}")
        
        return is_valid, errors
    
    @staticmethod
    def validate_todo(data: Dict[str, Any]) -> tuple[bool, List[str]]:
        """验证待办事项数据"""
        errors = []
        
        if not data.get("content"):
            errors.append("待办内容不能为空")
        elif len(data["content"]) < 2:
            errors.append("待办内容过短")
        elif len(data["content"]) > 500:
            errors.append("待办内容过长")
        
        if not data.get("user_id"):
            errors.append("用户ID不能为空")
        
        is_valid = len(errors) == 0
        if not is_valid:
            logger.warning(f"待办事项验证失败: {errors}")
        
        return is_valid, errors
    
    @staticmethod
    def validate_user(data: Dict[str, Any]) -> tuple[bool, List[str]]:
        """验证用户数据"""
        errors = []
        
        if not data.get("username"):
            errors.append("用户名不能为空")
        elif len(data["username"]) < 3:
            errors.append("用户名长度不能少于3个字符")
        elif len(data["username"]) > 50:
            errors.append("用户名长度不能超过50个字符")
        elif not re.match(r'^[a-zA-Z0-9_\u4e00-\u9fa5]+$', data["username"]):
            errors.append("用户名只能包含字母、数字、下划线和中文")
        
        if not data.get("email"):
            errors.append("邮箱不能为空")
        elif not DataValidator._is_valid_email(data["email"]):
            errors.append("邮箱格式不正确")
        
        if data.get("password"):
            if len(data["password"]) < 6:
                errors.append("密码长度不能少于6个字符")
        
        is_valid = len(errors) == 0
        if not is_valid:
            logger.warning(f"用户数据验证失败: {errors}")
        
        return is_valid, errors
    
    @staticmethod
    def _is_valid_url(url: str) -> bool:
        """验证URL格式"""
        if not url:
            return False
        url_pattern = re.compile(
            r'^https?://'
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'
            r'localhost|'
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'
            r'(?::\d+)?'
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        return bool(url_pattern.match(url))
    
    @staticmethod
    def _is_valid_email(email: str) -> bool:
        """验证邮箱格式"""
        if not email:
            return False
        email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        return bool(email_pattern.match(email))
    
    @staticmethod
    def _is_reliable_source(source_name: str) -> bool:
        """检查是否为可靠来源"""
        if not source_name:
            return False
        source_lower = source_name.lower()
        return any(rs.lower() in source_lower for rs in DataValidator.RELIABLE_SOURCES)
    
    @staticmethod
    def calculate_quality_score(data: Dict[str, Any], data_type: str) -> float:
        """
        计算数据质量评分
        
        Returns:
            质量评分 (0-1)
        """
        score = 0.0
        
        if data_type == "hot_topic":
            title = data.get("title", "")
            if title:
                score += 0.15
                if len(title) > 20:
                    score += 0.05
            
            summary = data.get("summary", "")
            if summary:
                score += 0.1
                if len(summary) > 30:
                    score += 0.1
                if len(summary) > 100:
                    score += 0.05
            
            if data.get("categories"):
                score += 0.1
            
            source = data.get("source", "")
            if source:
                score += 0.1
                if DataValidator._is_reliable_source(source):
                    score += 0.1
            
            if data.get("published_at"):
                score += 0.1
            
            if data.get("hot_comments"):
                score += 0.05
            
            if data.get("guide_questions"):
                score += 0.05
                
        elif data_type == "opportunity":
            title = data.get("title", "")
            if title:
                score += 0.15
                if len(title) > 15:
                    score += 0.05
            
            content = data.get("content", "")
            if content:
                score += 0.1
                if len(content) > 100:
                    score += 0.1
            
            if data.get("deadline"):
                score += 0.1
            
            if data.get("reward"):
                score += 0.1
            
            if data.get("requirements"):
                score += 0.1
            
            if data.get("tags"):
                score += 0.05
            
            source = data.get("source", "")
            if source:
                score += 0.1
                if DataValidator._is_reliable_source(source):
                    score += 0.05
                
        elif data_type == "rss_article":
            title = data.get("title", "")
            if title:
                score += 0.15
                if len(title) > 20:
                    score += 0.05
            
            summary = data.get("summary", "")
            if summary:
                score += 0.1
                if len(summary) > 30:
                    score += 0.1
                if len(summary) > 100:
                    score += 0.05
            
            content = data.get("content", "")
            if content:
                score += 0.05
                if len(content) > 200:
                    score += 0.05
            
            if data.get("author"):
                score += 0.05
            
            if data.get("tags"):
                score += 0.05
            
            if data.get("publish_time"):
                score += 0.1
            
            source_name = data.get("source_name", "")
            if source_name:
                score += 0.1
                if DataValidator._is_reliable_source(source_name):
                    score += 0.1
            
            category = data.get("category", "")
            if category == "academic":
                score += 0.1
        
        return round(min(score, 1.0), 2)
    
    @staticmethod
    def is_qualified(score: float) -> bool:
        """判断数据是否合格"""
        return score >= DataValidator.QUALITY_THRESHOLD
