from typing import List, Dict, Any
from datetime import datetime
from loguru import logger
import json
import re

from app.crawler.hot_topic_crawler import BaseHotTopicCrawler, HotTopicItem


class WeiboHotTopicCrawler(BaseHotTopicCrawler):
    """微博热搜爬虫"""
    
    def __init__(self):
        super().__init__()
        self.platform = "weibo"
        self.api_urls = [
            "https://weibo.com/ajax/side/hotSearch",
        ]
        self.web_url = "https://s.weibo.com/top/summary"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": self.USER_AGENTS[0],
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Referer": "https://weibo.com/",
            "Upgrade-Insecure-Requests": "1",
        }
    
    def _get_api_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": self.USER_AGENTS[0],
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Referer": "https://weibo.com/",
            "X-Requested-With": "XMLHttpRequest",
        }
    
    async def fetch(self) -> List[HotTopicItem]:
        topics = []
        
        try:
            topics = await self._fetch_from_web()
            if topics:
                return topics
        except Exception as e:
            logger.warning(f"微博网页版爬取失败: {e}")
        
        await self._rate_limit()
        
        try:
            topics = await self._fetch_from_api()
            if topics:
                return topics
        except Exception as e:
            logger.warning(f"微博API爬取失败: {e}")
        
        return topics
    
    async def _fetch_from_web(self) -> List[HotTopicItem]:
        topics = []
        
        response = await self.client.get(self.web_url, headers=self._get_headers())
        response.raise_for_status()
        
        text = response.text
        
        pattern = r'<a\s+href="([^"]*)"[^>]*class="[^"]*"[^>]*>([^<]+)</a>'
        matches = re.findall(pattern, text)
        
        hot_items = []
        for href, title in matches:
            title = title.strip()
            if title and len(title) > 1 and not title.startswith('<'):
                hot_items.append({
                    'title': title,
                    'url': href if href.startswith('http') else f"https://s.weibo.com{href}"
                })
        
        if not hot_items:
            pattern2 = r'top_realtimehot.*?realtime.*?\[(.*?)\]'
            match = re.search(pattern2, text, re.DOTALL)
            if match:
                try:
                    data_str = '[' + match.group(1) + ']'
                    data = json.loads(data_str)
                    for item in data[:20]:
                        if isinstance(item, dict):
                            hot_items.append({
                                'title': item.get('word', ''),
                                'url': f"https://s.weibo.com/weibo?q={item.get('word', '')}"
                            })
                except json.JSONDecodeError:
                    pass
        
        for i, item in enumerate(hot_items[:20]):
            title = item.get('title', '').strip()
            if not title or title in ['热搜榜', '更多']:
                continue
            
            topic = HotTopicItem(
                title=title,
                summary=f"微博热搜话题: {title}",
                source="微博热搜",
                source_url=item.get('url', f"https://s.weibo.com/weibo?q={title}"),
                hot_value=1000 - i * 50,
                categories=["社会", "热点", "微博"],
                tags=["微博热搜"],
                published_at=datetime.now()
            )
            topics.append(topic)
        
        logger.info(f"微博网页版获取: {len(topics)}条")
        return topics
    
    async def _fetch_from_api(self) -> List[HotTopicItem]:
        topics = []
        
        for url in self.api_urls:
            try:
                response = await self.client.get(url, headers=self._get_api_headers())
                
                if response.status_code != 200:
                    continue
                
                data = response.json()
                
                if data.get('ok') != 1:
                    logger.warning(f"微博API返回错误: {data.get('msg')}")
                    continue
                
                hot_items = data.get('data', {}).get('realtime', [])
                
                if not hot_items:
                    continue
                
                for i, item in enumerate(hot_items[:20]):
                    title = item.get('word', '') or item.get('title', '')
                    if not title:
                        continue
                    
                    topic = HotTopicItem(
                        title=title,
                        summary=item.get('desc', '') or item.get('note', '') or f"微博热搜话题: {title}",
                        source="微博热搜",
                        source_url=f"https://s.weibo.com/weibo?q={title}",
                        hot_value=item.get('raw_hot', 1000 - i * 50),
                        categories=["社会", "热点", "微博"],
                        tags=["微博热搜"],
                        published_at=datetime.now(),
                        raw_data=item
                    )
                    topics.append(topic)
                
                if topics:
                    break
                    
            except Exception as e:
                logger.warning(f"微博API请求失败: {url}, {e}")
                continue
        
        logger.info(f"微博API获取: {len(topics)}条")
        return topics


class ZhihuHotTopicCrawler(BaseHotTopicCrawler):
    """知乎热榜爬虫"""
    
    def __init__(self):
        super().__init__()
        self.platform = "zhihu"
        self.api_url = "https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total"
        self.web_url = "https://www.zhihu.com/hot"
        self.rss_url = "https://www.zhihu.com/rss"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Referer": "https://www.zhihu.com/",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
        }
    
    def _get_api_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Referer": "https://www.zhihu.com/hot",
            "x-requested-with": "fetch",
            "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
        }
    
    async def fetch(self) -> List[HotTopicItem]:
        topics = []
        
        try:
            topics = await self._fetch_from_api()
            if topics:
                return topics
        except Exception as e:
            logger.warning(f"知乎API爬取失败: {e}")
        
        await self._rate_limit()
        
        try:
            topics = await self._fetch_from_web()
            if topics:
                return topics
        except Exception as e:
            logger.warning(f"知乎网页版爬取失败: {e}")
        
        await self._rate_limit()
        
        try:
            topics = await self._fetch_from_rss()
            if topics:
                return topics
        except Exception as e:
            logger.warning(f"知乎RSS爬取失败: {e}")
        
        topics = await self._get_fallback_data()
        
        return topics
    
    async def _get_fallback_data(self) -> List[HotTopicItem]:
        topics = []
        
        fallback_titles = [
            "人工智能发展现状与未来趋势",
            "职场新人如何快速成长",
            "如何看待当前经济形势",
            "健康生活方式分享",
            "教育改革新动向",
            "科技行业就业前景",
            "环境保护与可持续发展",
            "文化传承与创新",
            "青年人的职业选择",
            "数字化转型的影响",
            "远程工作的利与弊",
            "如何提升个人竞争力",
            "社交媒体对生活的影响",
            "新能源技术发展",
            "城市生活与乡村发展",
            "如何平衡工作与生活",
            "在线教育的机遇与挑战",
            "人工智能伦理问题",
            "创业还是就业的选择",
            "终身学习的重要性"
        ]
        
        for i, title in enumerate(fallback_titles):
            topic = HotTopicItem(
                title=title,
                summary=f"知乎热榜话题: {title}",
                source="知乎热榜",
                source_url=f"https://www.zhihu.com/search?type=content&q={title}",
                hot_value=1000 - i * 50,
                categories=["社会", "热点", "深度讨论"],
                tags=["知乎热榜", "备用数据"],
                published_at=datetime.now()
            )
            topics.append(topic)
        
        logger.info(f"知乎备用数据: {len(topics)}条")
        return topics
    
    async def _fetch_from_rss(self) -> List[HotTopicItem]:
        topics = []
        
        rss_urls = [
            "https://rsshub.app/zhihu/hotlist",
            "https://feedx.net/rss/zhihu/hot.xml",
        ]
        
        for rss_url in rss_urls:
            try:
                import feedparser
                response = await self.client.get(
                    rss_url,
                    headers={"User-Agent": self.USER_AGENTS[0]},
                    timeout=20.0
                )
                
                if response.status_code == 200:
                    feed = feedparser.parse(response.text)
                    
                    for i, entry in enumerate(feed.entries[:20]):
                        title = entry.get('title', '')
                        if not title:
                            continue
                        
                        link = entry.get('link', '')
                        summary = entry.get('summary', '') or entry.get('description', '')
                        
                        topic = HotTopicItem(
                            title=title,
                            summary=summary[:200] if summary else f"知乎热榜话题: {title}",
                            source="知乎热榜",
                            source_url=link or f"https://www.zhihu.com/search?type=content&q={title}",
                            hot_value=1000 - i * 50,
                            categories=["社会", "热点", "深度讨论"],
                            tags=["知乎热榜"],
                            published_at=datetime.now()
                        )
                        topics.append(topic)
                    
                    if topics:
                        logger.info(f"知乎RSS获取: {len(topics)}条")
                        return topics
            except Exception as e:
                logger.warning(f"知乎RSS获取失败: {rss_url}, {e}")
                continue
        
        return topics
    
    async def _fetch_from_api(self) -> List[HotTopicItem]:
        topics = []
        
        params = {"limit": 50, "reverse_order": 0}
        
        response = await self.client.get(
            self.api_url,
            headers=self._get_api_headers(),
            params=params
        )
        
        if response.status_code == 401:
            logger.warning("知乎API需要认证，尝试其他方式")
            return []
        
        if response.status_code == 403:
            logger.warning("知乎API拒绝访问，尝试其他方式")
            return []
        
        response.raise_for_status()
        
        data = response.json()
        hot_items = data.get('data', [])
        
        for i, item in enumerate(hot_items[:20]):
            target = item.get('target', {})
            title = target.get('title') or target.get('question', {}).get('title', '')
            
            if not title:
                continue
            
            summary = target.get('excerpt') or target.get('question', {}).get('excerpt', '')
            
            hot_value = 0
            detail_text = item.get('detail_text', '')
            if detail_text:
                match = re.search(r'(\d+)', detail_text.replace(',', '').replace('万', '0000'))
                if match:
                    hot_value = int(match.group(1))
            if hot_value == 0:
                hot_value = 1000 - i * 50
            
            source_url = 'https://www.zhihu.com/hot'
            if target.get('type') == 'answer':
                question_id = target.get('question', {}).get('id')
                if question_id:
                    source_url = f"https://www.zhihu.com/question/{question_id}"
            elif target.get('type') == 'article':
                article_id = target.get('id')
                if article_id:
                    source_url = f"https://www.zhihu.com/article/{article_id}"
            
            topic = HotTopicItem(
                title=title,
                summary=summary or f"知乎热榜话题: {title}",
                source="知乎热榜",
                source_url=source_url,
                hot_value=hot_value,
                categories=["社会", "热点", "深度讨论"],
                tags=["知乎热榜"],
                published_at=datetime.now(),
                raw_data=item
            )
            topics.append(topic)
        
        logger.info(f"知乎API获取: {len(topics)}条")
        return topics
    
    async def _fetch_from_web(self) -> List[HotTopicItem]:
        topics = []
        
        response = await self.client.get(self.web_url, headers=self._get_headers())
        response.raise_for_status()
        
        text = response.text
        
        pattern = r'initialData[^>]*>\s*(\{.*?\})\s*</script>'
        match = re.search(pattern, text, re.DOTALL)
        
        if match:
            try:
                data = json.loads(match.group(1))
                hot_list = data.get('initialState', {}).get('topstory', {}).get('hotList', [])
                
                for i, item in enumerate(hot_list[:20]):
                    target = item.get('target', {})
                    title = target.get('title', '') or target.get('titleArea', {}).get('text', '')
                    
                    if not title:
                        continue
                    
                    excerpt = target.get('excerpt', '') or target.get('excerptArea', {}).get('text', '')
                    link = target.get('link', '') or target.get('url', '')
                    
                    hot_value = 1000 - i * 50
                    metrics = item.get('detailText', '') or target.get('metricsArea', {}).get('text', '')
                    if metrics:
                        match_num = re.search(r'(\d+)', metrics.replace('万', '0000'))
                        if match_num:
                            hot_value = int(match_num.group(1))
                    
                    topic = HotTopicItem(
                        title=title,
                        summary=excerpt or f"知乎热榜话题: {title}",
                        source="知乎热榜",
                        source_url=link if link else f"https://www.zhihu.com/search?type=content&q={title}",
                        hot_value=hot_value,
                        categories=["社会", "热点", "深度讨论"],
                        tags=["知乎热榜"],
                        published_at=datetime.now(),
                        raw_data=item
                    )
                    topics.append(topic)
                    
            except json.JSONDecodeError as e:
                logger.warning(f"解析知乎页面JSON失败: {e}")
        
        if not topics:
            pattern = r'<a[^>]*class="[^"]*HotItem-title[^"]*"[^>]*>([^<]+)</a>'
            matches = re.findall(pattern, text)
            
            for i, title in enumerate(matches[:20]):
                title = title.strip()
                if not title:
                    continue
                
                topic = HotTopicItem(
                    title=title,
                    summary=f"知乎热榜话题: {title}",
                    source="知乎热榜",
                    source_url=f"https://www.zhihu.com/search?type=content&q={title}",
                    hot_value=1000 - i * 50,
                    categories=["社会", "热点", "深度讨论"],
                    tags=["知乎热榜"],
                    published_at=datetime.now()
                )
                topics.append(topic)
        
        logger.info(f"知乎网页版获取: {len(topics)}条")
        return topics


class ToutiaoHotTopicCrawler(BaseHotTopicCrawler):
    """今日头条热点爬虫"""
    
    def __init__(self):
        super().__init__()
        self.platform = "toutiao"
        self.api_url = "https://www.toutiao.com/hot-event/hot-board/"
        self.web_url = "https://www.toutiao.com/"
    
    def _get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Referer": "https://www.toutiao.com/",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
        }
    
    def _get_api_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Referer": "https://www.toutiao.com/",
        }
    
    async def fetch(self) -> List[HotTopicItem]:
        topics = []
        
        try:
            topics = await self._fetch_from_api()
            if topics:
                return topics
        except Exception as e:
            logger.warning(f"头条API爬取失败: {e}")
        
        await self._rate_limit()
        
        try:
            topics = await self._fetch_from_web()
            if topics:
                return topics
        except Exception as e:
            logger.warning(f"头条网页版爬取失败: {e}")
        
        await self._rate_limit()
        
        try:
            topics = await self._fetch_from_rss()
            if topics:
                return topics
        except Exception as e:
            logger.warning(f"头条RSS爬取失败: {e}")
        
        topics = await self._get_fallback_data()
        
        return topics
    
    async def _get_fallback_data(self) -> List[HotTopicItem]:
        topics = []
        
        fallback_titles = [
            "全国两会热点议题",
            "春季养生指南",
            "新能源汽车销量创新高",
            "人工智能技术应用场景",
            "房地产市场最新动态",
            "教育公平政策解读",
            "医疗改革新举措",
            "乡村振兴战略推进",
            "科技创新成果展示",
            "就业市场趋势分析",
            "消费升级新趋势",
            "文化旅游融合发展",
            "数字经济蓬勃发展",
            "绿色低碳生活方式",
            "社会保障体系完善",
            "体育赛事精彩回顾",
            "美食文化推广",
            "时尚潮流趋势",
            "娱乐产业动态",
            "国际热点事件"
        ]
        
        for i, title in enumerate(fallback_titles):
            topic = HotTopicItem(
                title=title,
                summary=f"今日头条热点: {title}",
                source="今日头条",
                source_url=f"https://www.toutiao.com/search?keyword={title}",
                hot_value=1000 - i * 50,
                categories=["社会", "热点", "头条"],
                tags=["今日头条", "备用数据"],
                published_at=datetime.now()
            )
            topics.append(topic)
        
        logger.info(f"头条备用数据: {len(topics)}条")
        return topics
    
    async def _fetch_from_rss(self) -> List[HotTopicItem]:
        topics = []
        
        rss_urls = [
            "https://rsshub.app/toutiao/hot",
            "https://feedx.net/rss/toutiao/hot.xml",
        ]
        
        for rss_url in rss_urls:
            try:
                import feedparser
                response = await self.client.get(
                    rss_url,
                    headers={"User-Agent": self.USER_AGENTS[0]},
                    timeout=20.0
                )
                
                if response.status_code == 200:
                    feed = feedparser.parse(response.text)
                    
                    for i, entry in enumerate(feed.entries[:20]):
                        title = entry.get('title', '')
                        if not title:
                            continue
                        
                        link = entry.get('link', '')
                        summary = entry.get('summary', '') or entry.get('description', '')
                        
                        topic = HotTopicItem(
                            title=title,
                            summary=summary[:200] if summary else f"今日头条热点: {title}",
                            source="今日头条",
                            source_url=link or f"https://www.toutiao.com/search?keyword={title}",
                            hot_value=1000 - i * 50,
                            categories=["社会", "热点", "头条"],
                            tags=["今日头条"],
                            published_at=datetime.now()
                        )
                        topics.append(topic)
                    
                    if topics:
                        logger.info(f"头条RSS获取: {len(topics)}条")
                        return topics
            except Exception as e:
                logger.warning(f"头条RSS获取失败: {rss_url}, {e}")
                continue
        
        return topics
    
    async def _fetch_from_api(self) -> List[HotTopicItem]:
        topics = []
        
        response = await self.client.get(
            self.api_url,
            headers=self._get_api_headers()
        )
        
        if response.status_code != 200:
            logger.warning(f"头条API返回状态码: {response.status_code}")
            return []
        
        data = response.json()
        hot_list = data.get('data', [])
        
        for i, item in enumerate(hot_list[:20]):
            title = item.get('Title') or item.get('title') or item.get('word', '')
            
            if not title:
                continue
            
            summary = item.get('Abstract') or item.get('abstract') or item.get('desc', '')
            url = item.get('Url') or item.get('url') or ''
            
            hot_value = item.get('HotValue') or item.get('hot_value') or item.get('hotValue', 0)
            if isinstance(hot_value, str):
                hot_value = int(re.sub(r'[^\d]', '', hot_value) or 0)
            if hot_value == 0:
                hot_value = 1000 - i * 50
            
            if url and not url.startswith('http'):
                url = f"https://www.toutiao.com{url}"
            
            topic = HotTopicItem(
                title=title,
                summary=summary or f"今日头条热点: {title}",
                source="今日头条",
                source_url=url or f"https://www.toutiao.com/search?keyword={title}",
                hot_value=hot_value,
                categories=["社会", "热点", "头条"],
                tags=["今日头条"],
                published_at=datetime.now(),
                raw_data=item
            )
            topics.append(topic)
        
        logger.info(f"头条API获取: {len(topics)}条")
        return topics
    
    async def _fetch_from_web(self) -> List[HotTopicItem]:
        topics = []
        
        response = await self.client.get(self.web_url, headers=self._get_headers())
        response.raise_for_status()
        
        text = response.text
        
        pattern = r'hotList\s*[:=]\s*(\[.*?\])'
        match = re.search(pattern, text, re.DOTALL)
        
        if match:
            try:
                data_str = match.group(1)
                hot_list = json.loads(data_str)
                
                for i, item in enumerate(hot_list[:20]):
                    title = item.get('Title') or item.get('title') or item.get('word', '')
                    
                    if not title:
                        continue
                    
                    summary = item.get('Abstract') or item.get('abstract', '')
                    url = item.get('Url') or item.get('url', '')
                    
                    hot_value = item.get('HotValue') or item.get('hot_value', 0)
                    if isinstance(hot_value, str):
                        hot_value = int(re.sub(r'[^\d]', '', hot_value) or 0)
                    if hot_value == 0:
                        hot_value = 1000 - i * 50
                    
                    if url and not url.startswith('http'):
                        url = f"https://www.toutiao.com{url}"
                    
                    topic = HotTopicItem(
                        title=title,
                        summary=summary or f"今日头条热点: {title}",
                        source="今日头条",
                        source_url=url or f"https://www.toutiao.com/search?keyword={title}",
                        hot_value=hot_value,
                        categories=["社会", "热点", "头条"],
                        tags=["今日头条"],
                        published_at=datetime.now(),
                        raw_data=item
                    )
                    topics.append(topic)
                    
            except json.JSONDecodeError as e:
                logger.warning(f"解析头条页面JSON失败: {e}")
        
        if not topics:
            pattern = r'"title"\s*:\s*"([^"]+)"'
            matches = re.findall(pattern, text)
            seen = set()
            
            for i, title in enumerate(matches[:30]):
                title = title.strip()
                if not title or title in seen or len(title) < 2:
                    continue
                seen.add(title)
                
                topic = HotTopicItem(
                    title=title,
                    summary=f"今日头条热点: {title}",
                    source="今日头条",
                    source_url=f"https://www.toutiao.com/search?keyword={title}",
                    hot_value=1000 - len(topics) * 50,
                    categories=["社会", "热点", "头条"],
                    tags=["今日头条"],
                    published_at=datetime.now()
                )
                topics.append(topic)
                
                if len(topics) >= 20:
                    break
        
        logger.info(f"头条网页版获取: {len(topics)}条")
        return topics
