# 智能提醒 Skill

---

## 一、Skill概述

### 用途

生成情感化、个性化的智能提醒文案，陪伴用户完成计划和行动。

### 触发场景

| 场景 | 触发条件 | 提醒类型 |
|------|----------|----------|
| 行动提醒 | 加入计划后N天未行动 | action |
| 截止提醒 | 距截止日期3天/1天 | deadline |
| 跟进提醒 | 投递后N天无回复 | follow_up |
| 放弃建议 | 长期无进展 | abandon_suggest |
| 成功庆祝 | 用户标记完成 | celebrate |

### 输出格式

```
{
  "reminder_type": "action",
  "content": "提醒文案（20-50字）",
  "actions": [
    {"label": "已投递", "value": "submitted"},
    {"label": "正在准备", "value": "preparing"},
    {"label": "需要帮助", "value": "need_help"},
    {"label": "放弃", "value": "abandon"}
  ]
}
```

---

## 二、提醒类型设计

### 1. 行动提醒

**触发条件**：加入计划后3天/7天/14天未行动

**文案风格**：鼓励、引导

**Prompt模板**：

```
你是一位温暖的成长伙伴，擅长用鼓励的语言提醒用户行动。

## 任务
生成一条行动提醒文案。

## 上下文
- 计划名称：{plan_name}
- 加入时间：{added_at}
- 未行动天数：{inactive_days}
- 用户画像：{user_profile}

## 输出要求
1. 使用第二人称（"你"）
2. 语气温暖、不催促
3. 提供行动建议
4. 字数控制在20-50字

## 示例
"远程内容运营兼职已经在你的计划里待了3天啦～今天要不要开始准备简历？"
```

**示例输出**：

| 天数 | 文案 |
|------|------|
| 3天 | "远程内容运营兼职已经在你的计划里待了3天啦～今天要不要开始准备简历？" |
| 7天 | "这个机会已经等了你一周了，要不要今天迈出第一步？" |
| 14天 | "时间在走，机会也在走。现在开始，还不晚。" |

### 2. 截止提醒

**触发条件**：距截止日期3天/1天/当天

**文案风格**：紧迫但不焦虑

**Prompt模板**：

```
你是一位温暖的成长伙伴，擅长用适当的紧迫感提醒用户截止日期。

## 任务
生成一条截止提醒文案。

## 上下文
- 计划名称：{plan_name}
- 截止日期：{deadline}
- 剩余天数：{days_left}
- 当前状态：{current_status}

## 输出要求
1. 使用第二人称（"你"）
2. 紧迫但不制造焦虑
3. 提供行动建议
4. 字数控制在20-50字

## 示例
"远程内容运营兼职还有3天截止，记得预留投递时间哦！"
```

**示例输出**：

| 剩余时间 | 文案 |
|----------|------|
| 3天 | "远程内容运营兼职还有3天截止，记得预留投递时间哦！" |
| 1天 | "明天就是截止日期了，今天投递还来得及！" |
| 当天 | "今天是最后一天，抓住这个机会吧！" |

### 3. 跟进提醒

**触发条件**：投递后7天/14天无回复

**文案风格**：关心、建议

**Prompt模板**：

```
你是一位温暖的成长伙伴，擅长关心用户的进展。

## 任务
生成一条跟进提醒文案。

## 上下文
- 计划名称：{plan_name}
- 投递时间：{submitted_at}
- 等待天数：{waiting_days}
- 用户画像：{user_profile}

## 输出要求
1. 使用第二人称（"你"）
2. 语气关心、不施压
3. 提供建议选项
4. 字数控制在20-50字

## 示例
"简历通过了吗？要不要跟进一下，或者看看其他机会？"
```

**示例输出**：

| 等待天数 | 文案 |
|----------|------|
| 7天 | "简历通过了吗？要不要发个邮件跟进一下？" |
| 14天 | "等了两周了，也许可以看看其他机会？" |

### 4. 放弃建议

**触发条件**：长期无进展（>21天）

**文案风格**：理解、释怀

**Prompt模板**：

```
你是一位温暖的成长伙伴，擅长用理解的语言帮助用户释怀。

## 任务
生成一条放弃建议文案。

## 上下文
- 计划名称：{plan_name}
- 加入时间：{added_at}
- 无进展天数：{inactive_days}
- 用户画像：{user_profile}

## 输出要求
1. 使用第二人称（"你"）
2. 语气理解、不评判
3. 强调"放弃也是一种努力"
4. 字数控制在30-60字

## 示例
"这个机会已经在计划里待了很久。没关系的，放弃也是一种努力。有时候放下一个机会，是为了抓住更适合的。"
```

**示例输出**：

| 情况 | 文案 |
|------|------|
| 长期未行动 | "这个机会已经在计划里待了3周了。没关系的，放弃也是一种努力。有时候放下，是为了抓住更适合的。" |
| 投递无回复 | "等了很久没有回复，也许这不是最适合的机会。放下它，看看别的吧。" |

### 5. 成功庆祝

**触发条件**：用户标记计划完成

**文案风格**：庆祝、肯定

**Prompt模板**：

```
你是一位温暖的成长伙伴，擅长用庆祝的语言肯定用户的成就。

## 任务
生成一条成功庆祝文案。

## 上下文
- 计划名称：{plan_name}
- 完成时间：{completed_at}
- 用户画像：{user_profile}

## 输出要求
1. 使用第二人称（"你"）
2. 语气庆祝、肯定
3. 强调努力的价值
4. 字数控制在20-40字

## 示例
"太棒了！你的努力有了回报，这是你成长的见证！"
```

**示例输出**：

| 情况 | 文案 |
|------|------|
| 完成计划 | "太棒了！你的努力有了回报，这是你成长的见证！" |
| 获得offer | "恭喜你！这个机会属于你了，继续加油！" |

---

## 三、生成逻辑

### 完整流程

```python
class ReminderGenerator:
    """智能提醒生成器"""
    
    def generate(self, plan_id: int, reminder_type: str) -> dict:
        """生成智能提醒"""
        
        # 1. 获取计划信息
        plan = self.get_plan(plan_id)
        
        # 2. 获取用户画像
        user_profile = self.get_user_profile(plan.user_id)
        
        # 3. 根据类型选择Prompt
        prompt = self.build_prompt(
            reminder_type=reminder_type,
            plan=plan,
            user_profile=user_profile
        )
        
        # 4. 调用LLM生成
        content = self.llm_generate(prompt)
        
        # 5. 生成操作按钮
        actions = self.generate_actions(reminder_type)
        
        return {
            "reminder_type": reminder_type,
            "content": content,
            "actions": actions
        }
    
    def generate_actions(self, reminder_type: str) -> list:
        """生成操作按钮"""
        action_map = {
            "action": [
                {"label": "已投递", "value": "submitted"},
                {"label": "正在准备", "value": "preparing"},
                {"label": "需要帮助", "value": "need_help"},
                {"label": "放弃", "value": "abandon"}
            ],
            "deadline": [
                {"label": "已投递", "value": "submitted"},
                {"label": "稍后提醒", "value": "snooze"},
                {"label": "放弃", "value": "abandon"}
            ],
            "follow_up": [
                {"label": "已收到回复", "value": "replied"},
                {"label": "继续等待", "value": "wait"},
                {"label": "看看别的", "value": "browse"}
            ],
            "abandon_suggest": [
                {"label": "移出计划", "value": "abandon"},
                {"label": "再坚持一下", "value": "persist"},
                {"label": "聊聊为什么", "value": "chat"}
            ],
            "celebrate": [
                {"label": "分享喜悦", "value": "share"},
                {"label": "继续加油", "value": "continue"}
            ]
        }
        
        return action_map.get(reminder_type, [])
```

---

## 四、提醒策略

### 提醒频率

| 提醒类型 | 频率 | 时间点 |
|----------|------|--------|
| 行动提醒 | 最多3次 | 第3天、第7天、第14天 |
| 截止提醒 | 最多3次 | 前3天、前1天、当天 |
| 跟进提醒 | 最多2次 | 第7天、第14天 |
| 放弃建议 | 最多1次 | 第21天 |

### 提醒时间

| 时段 | 时间 | 适用类型 |
|------|------|----------|
| 早间 | 8:00-9:00 | 行动提醒、截止提醒 |
| 午间 | 12:00-13:00 | 跟进提醒 |
| 晚间 | 20:00-21:00 | 放弃建议、成功庆祝 |

### 用户偏好

```python
def get_user_reminder_preference(user_id: int) -> dict:
    """获取用户提醒偏好"""
    return {
        "enabled": True,  # 是否开启提醒
        "morning_time": "08:00",
        "evening_time": "20:00",
        "max_per_day": 3,  # 每天最多提醒次数
        "quiet_hours": ["22:00-08:00"]  # 免打扰时段
    }
```

---

## 五、注意事项

### 1. 避免过度打扰

- 每天最多3条提醒
- 免打扰时段不发送
- 用户可关闭提醒

### 2. 语气把控

| 类型 | 语气 | 避免 |
|------|------|------|
| 行动提醒 | 温暖鼓励 | 催促、指责 |
| 截止提醒 | 适度紧迫 | 制造焦虑 |
| 跟进提醒 | 关心建议 | 施压 |
| 放弃建议 | 理解释怀 | 评判、否定 |
| 成功庆祝 | 肯定庆祝 | 过度夸张 |

### 3. 个性化

- 根据用户画像调整语气
- 根据用户行为调整频率
- 根据用户反馈优化内容

---

## 六、数据记录

### 提醒记录

```python
class ReminderLog(Base):
    """提醒记录"""
    __tablename__ = "reminder_logs"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan_id = Column(Integer, ForeignKey("user_plans.id"))
    
    reminder_type = Column(String(50))
    content = Column(Text)
    
    sent_at = Column(DateTime)
    is_read = Column(Boolean, default=False)
    user_action = Column(String(50), nullable=True)  # 用户对提醒的操作
    
    created_at = Column(DateTime, default=datetime.utcnow)
```

### 效果分析

| 指标 | 说明 |
|------|------|
| 打开率 | 用户查看提醒的比例 |
| 行动率 | 用户采取行动的比例 |
| 放弃率 | 用户放弃计划的比例 |
| 反馈率 | 用户反馈提醒质量的比例 |

---

*版本：v1.0*
*最后更新：2024年*
