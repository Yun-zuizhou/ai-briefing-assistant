# 画像生成 Skill

---

## 一、Skill概述

### 用途

生成具有"时代感"的用户画像描述，展示用户在时代中的位置与成长轨迹。

### 触发场景

| 场景 | 触发方式 |
|------|----------|
| 用户主动查看 | 点击"我的画像"Tab |
| 定期更新 | 每日/每周自动更新 |
| 数据变化时 | 用户完成关键行为后触发 |

### 输出格式

```
{
  "profile_text": "画像文字描述（200-300字）",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "radar_data": {
    "创作": 0.8,
    "学习": 0.7,
    "执行": 0.6,
    "创新": 0.5,
    "社交": 0.4,
    "规划": 0.7
  }
}
```

---

## 二、分析维度

### 1. 兴趣领域

**数据来源**：
- 热点点击记录
- 观点输出的话题
- 机会关注类型

**分析逻辑**：
```python
def analyze_interests(user_data):
    """分析用户兴趣领域"""
    tag_counter = Counter()
    
    # 统计热点点击
    for topic in user_data.clicked_topics:
        tag_counter.update(topic.categories)
    
    # 统计观点话题
    for opinion in user_data.opinions:
        tag_counter.update(opinion.categories)
    
    # 统计机会关注
    for opportunity in user_data.followed_opportunities:
        tag_counter.update(opportunity.categories)
    
    return tag_counter.most_common(5)
```

### 2. 立场倾向

**数据来源**：
- 观点立场选择
- 观点内容关键词

**立场分类**：

| 立场类型 | 关键词特征 |
|----------|------------|
| 理性乐观 | "平衡"、"机会"、"发展" |
| 谨慎观望 | "需要观察"、"有待验证" |
| 积极支持 | "支持"、"赞同"、"应该" |
| 批判思考 | "问题"、"挑战"、"风险" |

### 3. 行动风格

**数据来源**：
- 计划完成率
- 行动速度（加入计划到投递的时间）
- 放弃率

**风格分类**：

| 风格 | 指标 |
|------|------|
| 行动派 | 完成率>70%，行动速度<3天 |
| 思考者 | 观点多，行动较少 |
| 探索者 | 关注面广，完成率中等 |
| 观望者 | 关注多，行动少 |

### 4. 成长轨迹

**数据来源**：
- 观点演变记录
- 能力维度变化

**轨迹描述**：
```python
def describe_growth_trajectory(opinion_evolution):
    """描述成长轨迹"""
    changes = []
    
    for evolution in opinion_evolution:
        old_stance = evolution.old_stance
        new_stance = evolution.new_stance
        
        if old_stance != new_stance:
            changes.append({
                "topic": evolution.topic,
                "from": old_stance,
                "to": new_stance,
                "insight": "思考在深入" if is_deeper(new_stance) else "立场在调整"
            })
    
    return changes
```

### 5. 能力维度

**维度定义**：

| 维度 | 计算方式 | 数据来源 |
|------|----------|----------|
| 创作 | 写作相关行为 | 观点字数、征稿参与 |
| 学习 | 学习相关行为 | 学习类热点关注、笔记 |
| 执行 | 行动力 | 计划完成率、行动速度 |
| 创新 | 创新相关行为 | 创新类话题、比赛参与 |
| 社交 | 社交相关行为 | 分享、互动 |
| 规划 | 规划相关行为 | 计划数量、目标设定 |

---

## 三、Prompt模板

### 主Prompt

```
你是一位专业的用户画像分析师，擅长用温暖、有温度的语言描述用户特征。

## 任务
根据用户数据，生成一份具有"时代感"的用户画像描述。

## 用户数据
- 兴趣领域：{interests}
- 立场倾向：{stance_tendency}
- 行动风格：{action_style}
- 成长轨迹：{growth_trajectory}
- 能力维度：{radar_data}

## 输出要求
1. 使用第二人称（"你"）
2. 结合时代背景描述（"在2024年的时代图景中..."）
3. 引用具体观点或行为（"当AI监管成为焦点时，你选择了..."）
4. 提炼3个时代关键词
5. 字数控制在200-300字

## 输出格式
在{year}年的时代图景中，你是一位关注{interests}的{role}。

{stance_description}

{growth_description}

你的时代关键词：{keywords}
```

### 示例输出

```
在2024年的时代图景中，你是一位关注「AI变革」与「青年成长」议题的思考者。

当AI监管成为全球焦点时，你选择了"理性看待"的立场，认为"监管是必要的，但需要平衡创新空间"；当斜杠青年引发讨论时，你看到了"多元可能"，认为"多元发展更有安全感"。

从年初的"观望"到年末的"行动"，你的思考在成长。你开始将想法付诸实践，加入了3个成长计划，完成了2个。

你的时代关键词：独立思考、持续成长、拥抱变化
```

---

## 四、生成逻辑

### 完整流程

```python
class ProfileGenerator:
    """画像生成器"""
    
    def generate(self, user_id: int) -> dict:
        """生成用户画像"""
        
        # 1. 收集用户数据
        user_data = self.collect_user_data(user_id)
        
        # 2. 分析各维度
        interests = self.analyze_interests(user_data)
        stance = self.analyze_stance(user_data)
        action_style = self.analyze_action_style(user_data)
        growth = self.analyze_growth(user_data)
        radar = self.calculate_radar(user_data)
        
        # 3. 构建Prompt
        prompt = self.build_prompt(
            interests=interests,
            stance=stance,
            action_style=action_style,
            growth=growth,
            radar=radar
        )
        
        # 4. 调用LLM生成
        profile_text = self.llm_generate(prompt)
        
        # 5. 提取关键词
        keywords = self.extract_keywords(profile_text, interests, stance)
        
        return {
            "profile_text": profile_text,
            "keywords": keywords,
            "radar_data": radar
        }
    
    def collect_user_data(self, user_id: int) -> UserData:
        """收集用户数据"""
        return UserData(
            opinions=db.query(UserOpinion).filter_by(user_id=user_id).all(),
            plans=db.query(UserPlan).filter_by(user_id=user_id).all(),
            feedbacks=db.query(UserFeedback).filter_by(user_id=user_id).all(),
            clicked_topics=get_clicked_topics(user_id)
        )
```

---

## 五、更新策略

### 更新时机

| 时机 | 条件 | 更新幅度 |
|------|------|----------|
| 每日更新 | 有新数据产生 | 增量更新 |
| 每周更新 | 固定时间 | 全量更新 |
| 行为触发 | 完成关键行为 | 即时更新 |

### 关键行为定义

| 行为 | 权重 | 说明 |
|------|------|------|
| 发表观点 | 高 | 影响立场和兴趣 |
| 完成计划 | 高 | 影响行动风格 |
| 观点演变 | 中 | 影响成长轨迹 |
| 点击热点 | 低 | 影响兴趣领域 |

---

## 六、注意事项

### 1. 隐私保护

- 不暴露具体敏感信息
- 聚合数据而非原始数据
- 用户可关闭画像生成

### 2. 文案质量

- 避免空洞的赞美
- 基于数据说话
- 保持客观记录者语气

### 3. 冷启动处理

```python
def handle_cold_start(user_id: int) -> str:
    """冷启动用户画像"""
    return """你刚开始探索时代与自我的旅程。

每一次互动都在帮你更接近真实的自己。
继续前行吧，你的时代坐标正在形成中。"""
```

---

*版本：v1.0*
*最后更新：2024年*
