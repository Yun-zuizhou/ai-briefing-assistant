import re
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter()


class IntentRequest(BaseModel):
    input: str
    current_interests: Optional[list] = []


class IntentResponse(BaseModel):
    type: str
    entities: dict
    confidence: float
    matchedBy: str


INTEREST_KEYWORDS = {
    "AI": ["AI", "人工智能", "大模型", "GPT", "机器学习", "深度学习", "ChatGPT", "LLM", "智能", "神经网络"],
    "远程工作": ["远程", "在家办公", "线上工作", "兼职", "副业", "自由职业", "居家办公", "远程办公"],
    "技术开发": ["开发", "编程", "代码", "前端", "后端", "全栈", "程序员", "软件", "APP", "网站"],
    "产品设计": ["产品", "设计", "UI", "UX", "交互", "用户体验", "原型", "界面"],
    "学术研究": ["学术", "研究", "论文", "文献", "科研", "期刊", "发表", "学位"],
    "行业资讯": ["行业", "资讯", "新闻", "动态", "趋势", "热点", "时事"],
    "职业发展": ["求职", "面试", "简历", "职业", "晋升", "跳槽", "offer", "招聘"],
    "学习成长": ["学习", "课程", "教程", "培训", "技能", "提升", "成长"],
    "财经投资": ["理财", "投资", "股票", "基金", "财经", "金融", "赚钱"],
    "健康生活": ["健康", "养生", "运动", "健身", "饮食", "睡眠", "心理"],
}

REMOVE_INTEREST_PATTERNS = [
    r"不想[再]?关注",
    r"取消关注",
    r"删除关注",
    r"移除关注",
    r"不再看",
    r"不想看",
    r"别[再]?推",
    r"取消订阅",
    r"退订",
    r"不再关注",
    r"不关注",
    r"取消追踪",
    r"停止推送",
    r"别给我推",
    r"不要推",
    r"删除.*订阅",
    r"取消.*订阅",
    r"不要.*信息[了]?",
    r"不需要.*信息[了]?",
    r"不想要.*信息",
    r"移除",
    r"删掉",
]

ADD_INTEREST_PATTERNS = [
    r"想关注",
    r"帮我关注",
    r"想看",
    r"想了解",
    r"想找",
    r"订阅",
    r"追踪",
    r"收集",
    r"推送",
    r"关注一下",
    r"关注",
    r"想收到",
    r"帮我找",
    r"给我推",
    r"想追踪",
]

NEGATIVE_PREFIXES = ["不", "没", "别", "取消", "删除", "移除", "停止"]
NEGATIVE_HINT_PATTERNS = [
    r"不想",
    r"不再",
    r"不要",
    r"别给我",
    r"别再",
    r"取消",
    r"删除",
    r"移除",
    r"停止",
]

TIME_PATTERNS = {
    "morning": r"早上?|早晨|上午|8点|9点|10点",
    "noon": r"中午|12点|13点",
    "afternoon": r"下午|14点|15点|16点|17点|18点",
    "evening": r"晚上|19点|20点|21点|22点",
}

GREETING_PATTERNS = [r"你好|嗨|hi|hello|早上好|晚上好|哈喽|嘿|您好"]

HELP_PATTERNS = [r"怎么用|如何使用|帮助|help|功能|能做什么|怎么操作|使用方法"]

TODO_TIME_PATTERNS = [
    {"pattern": r"明天", "label": "明天"},
    {"pattern": r"后天", "label": "后天"},
    {"pattern": r"下周[一二三四五六日]?", "label": "下周"},
    {"pattern": r"这周[一二三四五六日]", "label": "本周"},
    {"pattern": r"周[一二三四五六日]", "label": "本周"},
    {"pattern": r"(\d{1,2})[号日]", "label": "本月"},
    {"pattern": r"月底", "label": "月底"},
    {"pattern": r"下个月", "label": "下月"},
]

TODO_ACTION_PATTERNS = [
    r"提醒我",
    r"要做",
    r"得做",
    r"准备",
    r"投",
    r"写",
    r"完成",
    r"提交",
    r"复习",
    r"学习",
    r"整理",
    r"处理",
    r"联系",
    r"回复",
    r"发送",
    r"预约",
    r"交",
    r"要完成",
]

TODO_KEYWORDS = ["简历", "报告", "作业", "论文", "项目", "会议", "面试", "考试", "文档", "方案", "邮件", "代码"]

FRAGMENTED_THOUGHT_KEYWORDS = [
    "突然想到", "忽然想到", "有个想法", "记一下", "记个",
    "碎碎念", "随便说说", "灵感来了", "冒出个想法", "想到一个点子"
]


def levenshtein_distance(str1: str, str2: str) -> int:
    m = len(str1)
    n = len(str2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if str1[i - 1] == str2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1)

    return dp[m][n]


def similarity_score(str1: str, str2: str) -> float:
    max_len = max(len(str1), len(str2))
    if max_len == 0:
        return 1.0
    return 1 - levenshtein_distance(str1, str2) / max_len


def extract_time(text: str) -> Optional[str]:
    time_match = re.search(r"(\d{1,2})[点时:：](\d{0,2})?", text)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0
        if 0 <= hour <= 23 and 0 <= minute <= 59:
            return f"{hour:02d}:{minute:02d}"

    if re.search(TIME_PATTERNS["morning"], text):
        return "08:00"
    if re.search(TIME_PATTERNS["noon"], text):
        return "12:00"
    if re.search(TIME_PATTERNS["afternoon"], text):
        return "14:00"
    if re.search(TIME_PATTERNS["evening"], text):
        return "21:00"

    return None


def extract_interests(text: str) -> list:
    found = []
    for interest, keywords in INTEREST_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text:
                found.append(interest)
                break
    return list(set(found))


def has_fragmented_keyword(text: str) -> bool:
    for kw in FRAGMENTED_THOUGHT_KEYWORDS:
        if kw in text:
            return True
    return False


def extract_todo_content(text: str) -> Optional[dict]:
    deadline = "待定"
    
    for item in TODO_TIME_PATTERNS:
        match = re.search(item["pattern"], text)
        if match:
            deadline = match.group(0)
            break

    for pattern in TODO_ACTION_PATTERNS:
        match = re.search(pattern, text)
        if match:
            after_match = text[match.end():].strip()
            content = re.sub(r"[，。！？]", "", after_match)[:20].strip()
            if len(content) >= 2:
                return {"content": content, "deadline": deadline}

    for keyword in TODO_KEYWORDS:
        if keyword in text:
            keyword_index = text.index(keyword)
            content_start = 0

            for pattern in TODO_ACTION_PATTERNS:
                match = re.search(pattern, text)
                if match and match.start() < keyword_index:
                    content_start = match.end()
                    break

            content = re.sub(r"[，。！？]", "", text[content_start:]).strip()[:20]
            if len(content) >= 2:
                return {"content": content, "deadline": deadline}

    remind_match = re.search(r"提醒[我]?[^\s，。！？]{2,15}", text)
    if remind_match:
        content = re.sub(r"提醒[我]?", "", remind_match.group(0)).strip()
        if len(content) >= 2:
            return {"content": content, "deadline": deadline}

    return None


def extract_thought_content(text: str) -> Optional[str]:
    if has_fragmented_keyword(text):
        return None
    
    explicit_thought_patterns = [
        r"记录.*想法",
        r"记下",
        r"写下",
        r"我想记录",
        r"帮我记",
        r"保存.*想法",
        r"存下",
    ]
    
    for pattern in explicit_thought_patterns:
        if re.search(pattern, text):
            return text[:100] + "..." if len(text) > 100 else text
    
    thought_indicators = [
        r"觉得.*[很有意思|重要|值得]",
        r"感觉.*[很有意思|重要|值得]",
        r"发现.*[很有意思|重要|值得]",
        r"学到.*[很多|新东西]",
        r"思考.*[问题|这件事]",
        r"感悟[到是]",
        r"体会到",
        r"认识到",
        r"深刻.*理解",
    ]
    
    for pattern in thought_indicators:
        if re.search(pattern, text):
            return text[:100] + "..." if len(text) > 100 else text

    return None


def extract_fragmented_thought(text: str) -> Optional[dict]:
    explicit_fragmented_patterns = [
        r"突然想到",
        r"忽然想到",
        r"有个想法",
        r"记一下",
        r"记个",
        r"碎碎念",
        r"随便说说",
        r"灵感来了",
        r"冒出个想法",
        r"想到一个点子",
    ]
    
    for pattern in explicit_fragmented_patterns:
        if re.search(pattern, text):
            tags = []
            if re.search(r"AI|人工智能|大模型|GPT|机器学习", text):
                tags.append("AI")
            if re.search(r"工作|上班|公司|职场", text):
                tags.append("工作")
            if re.search(r"学习|读书|研究|课程", text):
                tags.append("学习")
            if re.search(r"生活|日常|周末|假期", text):
                tags.append("生活")
            if re.search(r"思考|感悟|想法|体会", text):
                tags.append("思考")

            return {"content": text, "tags": tags if tags else ["日常"]}

    return None


def has_negative_prefix(text: str) -> bool:
    normalized = text.strip()
    if any(normalized.startswith(prefix) for prefix in NEGATIVE_PREFIXES):
        return True
    return any(re.search(pattern, normalized) for pattern in NEGATIVE_HINT_PATTERNS)


def check_remove_interest(text: str) -> Optional[dict]:
    for pattern in REMOVE_INTEREST_PATTERNS:
        if re.search(pattern, text):
            interests = extract_interests(text)
            confidence = 0.9 if interests else 0.6
            return {
                "type": "remove_interest",
                "entities": {"interests": interests},
                "confidence": confidence,
                "matchedBy": "pattern",
            }
    return None


def check_add_interest(text: str) -> Optional[dict]:
    if has_negative_prefix(text):
        return None

    for pattern in ADD_INTEREST_PATTERNS:
        if re.search(pattern, text):
            interests = extract_interests(text)
            if interests:
                return {
                    "type": "add_interest",
                    "entities": {"interests": interests},
                    "confidence": 0.85,
                    "matchedBy": "pattern",
                }
    return None


def check_multi_intent(text: str) -> Optional[dict]:
    has_remove = False
    has_add = False
    remove_interests = []
    add_interests = []

    for pattern in REMOVE_INTEREST_PATTERNS:
        if re.search(pattern, text):
            has_remove = True
            remove_interests = extract_interests(text)
            break

    parts = re.split(r"，|,|但是|不过", text)
    if len(parts) > 1:
        for part in parts:
            trimmed_part = part.strip()
            if not has_negative_prefix(trimmed_part):
                for pattern in ADD_INTEREST_PATTERNS:
                    if re.search(pattern, trimmed_part):
                        has_add = True
                        add_interests = extract_interests(trimmed_part)
                        break

    if has_remove and has_add and remove_interests and add_interests:
        return {
            "type": "multi_intent",
            "entities": {
                "intents": ["remove_interest", "add_interest"],
                "removeInterests": remove_interests,
                "addInterests": add_interests,
            },
            "confidence": 0.85,
            "matchedBy": "pattern",
        }

    return None


def check_create_todo(text: str) -> Optional[dict]:
    has_time_pattern = any(re.search(p["pattern"], text) for p in TODO_TIME_PATTERNS)
    has_action_pattern = any(re.search(p, text) for p in TODO_ACTION_PATTERNS)
    has_keyword = any(kw in text for kw in TODO_KEYWORDS)
    
    if has_time_pattern and (has_action_pattern or has_keyword):
        todo = extract_todo_content(text)
        if todo:
            return {
                "type": "create_todo",
                "entities": todo,
                "confidence": 0.92,
                "matchedBy": "pattern",
            }
    
    if has_action_pattern:
        todo = extract_todo_content(text)
        if todo:
            return {
                "type": "create_todo",
                "entities": todo,
                "confidence": 0.85,
                "matchedBy": "pattern",
            }
    
    return None


def parse_intent(text: str, current_interests: list = None) -> dict:
    if current_interests is None:
        current_interests = []

    normalized_text = text.lower().strip()
    original_text = text.strip()

    for pattern in GREETING_PATTERNS:
        if re.search(pattern, normalized_text):
            return {
                "type": "greeting",
                "entities": {},
                "confidence": 0.95,
                "matchedBy": "exact",
            }

    for pattern in HELP_PATTERNS:
        if re.search(pattern, normalized_text):
            return {
                "type": "help",
                "entities": {},
                "confidence": 0.95,
                "matchedBy": "exact",
            }

    multi_intent = check_multi_intent(original_text)
    if multi_intent:
        return multi_intent

    remove_intent = check_remove_interest(original_text)
    if remove_intent and remove_intent["confidence"] >= 0.8:
        return remove_intent

    add_intent = check_add_interest(original_text)
    if add_intent:
        return add_intent

    if re.search(r"每天|推送时间|几点|什么时候", text) and re.search(r"推送|发|送|收到", text):
        time = extract_time(text)
        return {
            "type": "set_push_time",
            "entities": {"time": time or "08:00"},
            "confidence": 0.92 if time else 0.75,
            "matchedBy": "pattern",
        }

    if re.search(r"这周|本周|上周|最近|统计|进度|数据|这个月|本月", text):
        if not re.search(r"完成|交|做|写|整理|准备|提醒", text):
            period = "recent"
            if re.search(r"这周|本周", text):
                period = "week"
            elif re.search(r"上周", text):
                period = "lastWeek"
            elif re.search(r"这个月|本月", text):
                period = "month"

            return {
                "type": "query_stats",
                "entities": {"period": period},
                "confidence": 0.88,
                "matchedBy": "pattern",
            }

    todo_intent = check_create_todo(original_text)
    if todo_intent:
        return todo_intent

    if re.search(r"简报|内容|推送|消息", text) and re.search(
        r"太多|太少|调整|改|设置|减少|增加", text
    ):
        return {
            "type": "adjust_settings",
            "entities": {},
            "confidence": 0.85,
            "matchedBy": "pattern",
        }

    fragmented = extract_fragmented_thought(text)
    if fragmented:
        return {
            "type": "fragmented_thought",
            "entities": {"content": fragmented["content"], "tags": fragmented["tags"]},
            "confidence": 0.82,
            "matchedBy": "pattern",
        }

    thought = extract_thought_content(text)
    if thought:
        return {
            "type": "record_thought",
            "entities": {"content": thought},
            "confidence": 0.78,
            "matchedBy": "pattern",
        }

    if remove_intent:
        return remove_intent

    for interest, keywords in INTEREST_KEYWORDS.items():
        for keyword in keywords:
            if keyword.lower() in normalized_text:
                similarity = similarity_score(normalized_text, keyword.lower())
                if similarity > 0.5:
                    return {
                        "type": "add_interest",
                        "entities": {"interests": [interest]},
                        "confidence": 0.65,
                        "matchedBy": "fuzzy",
                    }

    return {
        "type": "unknown",
        "entities": {},
        "confidence": 0.3,
        "matchedBy": "exact",
    }


@router.post("/recognize", response_model=IntentResponse)
async def recognize_intent(request: IntentRequest):
    result = parse_intent(request.input, request.current_interests)
    return IntentResponse(**result)
