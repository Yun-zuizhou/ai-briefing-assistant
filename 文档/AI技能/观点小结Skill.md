# 观点小结 Skill

---

## 一、Skill概述

### 用途

归纳用户的观点轨迹，生成简洁的观点小结，展示用户的思考脉络。

### 触发场景

| 场景 | 触发方式 |
|------|----------|
| 查看观点记录页 | 自动展示在时间线下方 |
| 定期更新 | 每周生成一次 |
| 观点数量变化 | 新增5条以上观点时更新 |

### 输出格式

```
{
  "summary_text": "观点小结文字（100-150字）",
  "stance_summary": {
    "理性看待": 3,
    "支持": 2,
    "观望": 1
  },
  "topic_coverage": ["AI", "职业", "社会"]
}
```

---

## 二、分析维度

### 1. 立场分布

**统计用户各立场的占比**：

```python
def analyze_stance_distribution(opinions):
    """分析立场分布"""
    stance_counter = Counter()
    
    for opinion in opinions:
        stance_counter[opinion.stance] += 1
    
    total = sum(stance_counter.values())
    
    return {
        stance: count / total 
        for stance, count in stance_counter.items()
    }
```

### 2. 话题覆盖

**统计用户关注的话题领域**：

```python
def analyze_topic_coverage(opinions):
    """分析话题覆盖"""
    topics = set()
    
    for opinion in opinions:
        if opinion.topic:
            topics.add(opinion.topic)
        if opinion.categories:
            topics.update(opinion.categories)
    
    return list(topics)
```

### 3. 观点演变

**识别观点的变化趋势**：

```python
def detect_opinion_evolution(opinions):
    """检测观点演变"""
    evolutions = []
    
    # 按话题分组
    by_topic = group_by_topic(opinions)
    
    for topic, topic_opinions in by_topic.items():
        if len(topic_opinions) > 1:
            # 检测立场变化
            old_stance = topic_opinions[0].stance
            new_stance = topic_opinions[-1].stance
            
            if old_stance != new_stance:
                evolutions.append({
                    "topic": topic,
                    "from": old_stance,
                    "to": new_stance
                })
    
    return evolutions
```

### 4. 思考深度

**评估观点的深度**：

| 深度等级 | 特征 | 字数参考 |
|----------|------|----------|
| 浅层 | 仅选择立场，无内容 | 0字 |
| 中层 | 有简短观点 | 20-50字 |
| 深层 | 有详细论述 | 50字以上 |

---

## 三、Prompt模板

### 主Prompt

```
你是一位专业的观点分析师，擅长用简洁、有洞察力的语言总结用户的思考轨迹。

## 任务
根据用户的观点记录，生成一份观点小结。

## 用户观点数据
- 观点列表：{opinions}
- 立场分布：{stance_distribution}
- 话题覆盖：{topic_coverage}
- 观点演变：{evolutions}
- 时间范围：{time_range}

## 输出要求
1. 使用第二人称（"你"）
2. 总结立场倾向和思考特点
3. 如有观点演变，点出变化
4. 字数控制在100-150字
5. 保持客观记录者语气

## 输出格式
你对{topics}等话题保持了持续关注。

{stance_description}

{evolution_description}

{conclusion}
```

### 示例输出

```
你对AI监管、青年就业、远程办公等话题保持了持续关注。

在立场选择上，你倾向于"理性看待"，既看到机会也关注风险。你对科技议题保持开放态度，对社会议题则更加审慎。

从年初到年末，你对"AI监管"的立场从"观望"转向"支持"，显示出思考的深入。

你的思考特点是：不轻易下结论，善于在变化中寻找平衡。
```

---

## 四、生成逻辑

### 完整流程

```python
class OpinionSummarizer:
    """观点小结生成器"""
    
    def summarize(self, user_id: int, time_range: str = "all") -> dict:
        """生成观点小结"""
        
        # 1. 获取用户观点
        opinions = self.get_opinions(user_id, time_range)
        
        if not opinions:
            return self.empty_summary()
        
        # 2. 分析各维度
        stance_dist = self.analyze_stance_distribution(opinions)
        topics = self.analyze_topic_coverage(opinions)
        evolutions = self.detect_opinion_evolution(opinions)
        
        # 3. 构建Prompt
        prompt = self.build_prompt(
            opinions=opinions,
            stance_distribution=stance_dist,
            topic_coverage=topics,
            evolutions=evolutions,
            time_range=time_range
        )
        
        # 4. 调用LLM生成
        summary_text = self.llm_generate(prompt)
        
        return {
            "summary_text": summary_text,
            "stance_summary": stance_dist,
            "topic_coverage": topics
        }
    
    def empty_summary(self) -> dict:
        """空观点小结"""
        return {
            "summary_text": "你还没有发表观点。\n\n在热点详情页，点击"你怎么看"，开始记录你的思考。",
            "stance_summary": {},
            "topic_coverage": []
        }
```

---

## 五、更新策略

### 更新时机

| 时机 | 条件 | 更新方式 |
|------|------|----------|
| 新增观点 | 观点数+5 | 增量更新 |
| 定期更新 | 每周日 | 全量更新 |
| 观点演变 | 检测到立场变化 | 即时更新 |

### 缓存策略

```python
# 缓存时间：24小时
CACHE_TTL = 24 * 60 * 60

def get_or_generate_summary(user_id: int) -> dict:
    """获取或生成观点小结"""
    cache_key = f"opinion_summary:{user_id}"
    
    # 尝试从缓存获取
    cached = cache.get(cache_key)
    if cached:
        return cached
    
    # 生成新的小结
    summary = OpinionSummarizer().summarize(user_id)
    
    # 存入缓存
    cache.set(cache_key, summary, CACHE_TTL)
    
    return summary
```

---

## 六、注意事项

### 1. 观点数量不足

```python
def handle_insufficient_opinions(opinions):
    """处理观点数量不足"""
    if len(opinions) < 3:
        return {
            "summary_text": f"你已经发表了{len(opinions)}条观点。\n\n继续记录你的思考，我会帮你发现思考的脉络。",
            "stance_summary": {},
            "topic_coverage": []
        }
```

### 2. 敏感话题处理

- 过滤敏感话题关键词
- 不在小结中提及敏感内容
- 保持中立客观

### 3. 时间范围

| 时间范围 | 说明 |
|----------|------|
| week | 最近一周 |
| month | 最近一月 |
| year | 最近一年 |
| all | 全部时间 |

---

*版本：v1.0*
*最后更新：2024年*
