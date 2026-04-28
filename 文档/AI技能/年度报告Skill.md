# 年度报告 Skill

---

## 一、Skill概述

### 用途

生成用户的年度"时代印记"报告，总结用户一年中的成长轨迹、观点演变、行动成果。

### 触发场景

| 场景 | 触发方式 |
|------|----------|
| 年末生成 | 12月自动生成 |
| 用户主动查看 | 点击"年度报告"入口 |
| 分享触发 | 用户分享时生成 |

### 输出格式

```
{
  "year": 2024,
  "title": "2024 · 我的时代印记",
  "stats": {
    "topics_viewed": 47,
    "opinions_posted": 23,
    "plans_completed": 8,
    "days_active": 156
  },
  "keywords": ["探索者", "记录者", "思考者"],
  "interests": ["AI变革", "青年成长", "职业探索"],
  "highlights": [
    {
      "type": "opinion_evolution",
      "topic": "AI监管",
      "from": "观望",
      "to": "理性支持"
    }
  ],
  "summary_text": "年度总结文字（500-800字）",
  "share_image": "分享图片URL"
}
```

---

## 二、报告结构

### 1. 数据统计

| 统计项 | 说明 | 数据来源 |
|--------|------|----------|
| 见证热点数 | 浏览/互动的热点数量 | 热点点击记录 |
| 发表观点数 | 发表的观点数量 | 观点记录 |
| 完成计划数 | 完成的计划数量 | 计划记录 |
| 活跃天数 | 使用APP的天数 | 登录记录 |

### 2. 年度关键词

**生成逻辑**：

```python
def generate_annual_keywords(user_data):
    """生成年度关键词"""
    keywords = []
    
    # 1. 基于行为特征
    if user_data.opinions_count > 20:
        keywords.append("思考者")
    if user_data.plans_completed > 5:
        keywords.append("行动派")
    if user_data.topics_diversity > 5:
        keywords.append("探索者")
    
    # 2. 基于立场特征
    if user_data.stance_diversity > 3:
        keywords.append("多元视角")
    
    # 3. 基于成长特征
    if user_data.has_opinion_evolution:
        keywords.append("持续成长")
    
    # 限制3个关键词
    return keywords[:3]
```

### 3. 关注领域

**统计用户最关注的领域**：

```python
def get_top_interests(user_data, top_n=3):
    """获取最关注的领域"""
    interest_counter = Counter()
    
    for topic in user_data.viewed_topics:
        interest_counter.update(topic.categories)
    
    for opinion in user_data.opinions:
        interest_counter.update(opinion.categories)
    
    return [tag for tag, _ in interest_counter.most_common(top_n)]
```

### 4. 年度亮点

**亮点类型**：

| 类型 | 说明 | 触发条件 |
|------|------|----------|
| 观点演变 | 对某话题立场发生变化 | 有观点演变记录 |
| 行动突破 | 完成重要计划 | 完成高匹配度计划 |
| 持续关注 | 长期关注某领域 | 同领域关注>10次 |
| 思考深入 | 发表深度观点 | 观点字数>100字 |

### 5. 年度总结

**文字描述**，包含：
- 开篇：时代背景引入
- 中段：具体行为和观点
- 结尾：成长总结和展望

---

## 三、Prompt模板

### 主Prompt

```
你是一位专业的年度报告撰写师，擅长用温暖、有洞察力的语言总结用户一年的成长。

## 任务
根据用户一年的数据，生成一份年度"时代印记"报告。

## 用户年度数据
- 年份：{year}
- 数据统计：{stats}
- 年度关键词：{keywords}
- 关注领域：{interests}
- 年度亮点：{highlights}
- 观点演变：{opinion_evolution}
- 计划完成情况：{plans}

## 输出要求
1. 使用第二人称（"你"）
2. 结合时代背景（"2024年，AI浪潮席卷全球..."）
3. 引用具体数据和行为
4. 展示成长和变化
5. 字数控制在500-800字
6. 分段清晰，每段一个主题

## 输出格式
### 开篇
{opening}

### 这一年，你见证了
{witness_section}

### 你的思考轨迹
{thinking_section}

### 你的行动足迹
{action_section}

### 年度关键词
{keywords_section}

### 结语
{closing}
```

### 示例输出

```
## 开篇

2024年，AI浪潮席卷全球，青年就业面临新挑战，远程办公成为常态。在这一年的时代洪流中，你留下了自己的思考印记。

## 这一年，你见证了

你见证了47个时代热点，发表了23条观点，在156天里记录了自己的思考。

你最关注的领域是：AI变革、青年成长、职业探索。

## 你的思考轨迹

当AI监管成为全球焦点时，你选择了"理性看待"的立场。从年初的"观望"到年末的"支持"，你对AI监管的思考在深入——"监管不是限制，而是引导"。

你对斜杠青年的讨论保持开放态度，认为"多元发展是时代的选择"。

## 你的行动足迹

这一年，你加入了12个成长计划，完成了8个。你投递了5份简历，参加了3次面试，最终获得了一份远程内容运营的兼职机会。

## 年度关键词

🔍 探索者 · 📝 记录者 · 💡 思考者

## 结语

2024年，你在时代中找到了自己的坐标。你用思考回应时代，用行动抓住机会。

2025年，继续前行吧。时代在变，你的成长也在继续。
```

---

## 四、生成逻辑

### 完整流程

```python
class AnnualReportGenerator:
    """年度报告生成器"""
    
    def generate(self, user_id: int, year: int) -> dict:
        """生成年度报告"""
        
        # 1. 收集年度数据
        year_data = self.collect_year_data(user_id, year)
        
        if not year_data.has_data:
            return self.empty_report(year)
        
        # 2. 计算统计数据
        stats = self.calculate_stats(year_data)
        
        # 3. 生成关键词
        keywords = self.generate_keywords(year_data)
        
        # 4. 提取关注领域
        interests = self.get_top_interests(year_data)
        
        # 5. 提取亮点
        highlights = self.extract_highlights(year_data)
        
        # 6. 构建Prompt
        prompt = self.build_prompt(
            year=year,
            stats=stats,
            keywords=keywords,
            interests=interests,
            highlights=highlights,
            year_data=year_data
        )
        
        # 7. 调用LLM生成
        summary_text = self.llm_generate(prompt)
        
        # 8. 生成分享图片
        share_image = self.generate_share_image(user_id, year, stats, keywords)
        
        return {
            "year": year,
            "title": f"{year} · 我的时代印记",
            "stats": stats,
            "keywords": keywords,
            "interests": interests,
            "highlights": highlights,
            "summary_text": summary_text,
            "share_image": share_image
        }
    
    def collect_year_data(self, user_id: int, year: int) -> YearData:
        """收集年度数据"""
        start_date = datetime(year, 1, 1)
        end_date = datetime(year, 12, 31)
        
        return YearData(
            opinions=db.query(UserOpinion)
                .filter(UserOpinion.user_id == user_id)
                .filter(UserOpinion.created_at.between(start_date, end_date))
                .all(),
            plans=db.query(UserPlan)
                .filter(UserPlan.user_id == user_id)
                .filter(UserPlan.added_at.between(start_date, end_date))
                .all(),
            # ... 其他数据
        )
```

---

## 五、分享功能

### 分享图片设计

```
┌─────────────────────────────────────┐
│                                     │
│     📖 2024 · 我的时代印记           │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  这一年，我见证了 47 个时代热点      │
│  发表了 23 条观点                    │
│  完成了 8 个计划                     │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  我的年度关键词：                    │
│                                     │
│  🔍 探索者 · 📝 记录者 · 💡 思考者    │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  时代与我                           │
│  记录你在时代中的每一次思考          │
│                                     │
└─────────────────────────────────────┘
```

### 分享渠道

| 渠道 | 格式 | 说明 |
|------|------|------|
| 微信好友 | 图片 | 生成分享图片 |
| 朋友圈 | 图片 | 生成分享图片 |
| 保存图片 | 图片 | 保存到本地 |

---

## 六、注意事项

### 1. 数据不足处理

```python
def empty_report(self, year: int) -> dict:
    """数据不足时的报告"""
    return {
        "year": year,
        "title": f"{year} · 我的时代印记",
        "stats": {},
        "keywords": [],
        "interests": [],
        "highlights": [],
        "summary_text": f"你在{year}年还没有开始记录。\n\n新的一年，开始记录你的时代印记吧！",
        "share_image": None
    }
```

### 2. 隐私保护

- 不展示敏感话题
- 聚合数据展示
- 用户可选择不生成

### 3. 生成时机

| 时机 | 条件 |
|------|------|
| 自动生成 | 12月25日起，有足够数据 |
| 手动生成 | 用户主动请求 |
| 更新生成 | 年末有新数据时 |

---

*版本：v1.0*
*最后更新：2024年*
