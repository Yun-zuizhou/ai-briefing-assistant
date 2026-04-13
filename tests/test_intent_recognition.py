"""
意图识别压测脚本。

说明：
1. 该文件保留在 `tests/` 目录作为历史测试资产参考。
2. 它依赖本地启动的接口服务，不适合作为默认 pytest 入口的一部分。
3. 如需执行，请直接运行文件中的 `main()` 或自行调用其中的辅助函数。
"""

__test__ = False

import json
import random
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

INTENT_TEMPLATES = {
    "add_interest": [
        "我想关注{topic}",
        "帮我关注{topic}",
        "想看{topic}的内容",
        "想了解{topic}",
        "订阅{topic}",
        "追踪{topic}的动态",
        "给我推{topic}",
        "关注一下{topic}",
        "想收到{topic}的推送",
        "帮我找{topic}的信息",
    ],
    "remove_interest": [
        "不想关注{topic}了",
        "取消关注{topic}",
        "不再看{topic}",
        "别给我推{topic}了",
        "停止推送{topic}",
        "移除{topic}的关注",
        "不要{topic}的信息了",
        "删除{topic}的订阅",
    ],
    "create_todo": [
        "明天提醒我{action}",
        "后天要{action}",
        "下周{action}",
        "这周{action}",
        "提醒我{action}",
        "准备{action}",
        "要完成{action}",
        "得{action}",
    ],
    "set_push_time": [
        "每天早上{time}发给我",
        "设置推送时间为{time}",
        "每天{time}给我发简报",
        "几点发简报？{time}",
        "改成{time}推送",
    ],
    "query_stats": [
        "这周我做了什么",
        "本周统计",
        "上周完成了什么",
        "这个月的数据",
        "最近有什么进展",
        "帮我看看统计",
        "我的进度怎么样",
    ],
    "greeting": [
        "你好",
        "嗨",
        "hi",
        "hello",
        "早上好",
        "晚上好",
        "哈喽",
        "嘿",
        "您好",
    ],
    "help": [
        "怎么用",
        "如何使用",
        "帮助",
        "help",
        "你能做什么",
        "有什么功能",
        "怎么操作",
        "使用方法",
    ],
    "record_thought": [
        "记下{thought}",
        "记录一下{thought}",
        "写下{thought}",
        "帮我记{thought}",
        "保存这个想法：{thought}",
    ],
    "fragmented_thought": [
        "突然想到{thought}",
        "有个想法：{thought}",
        "记一下{thought}",
        "灵感来了：{thought}",
        "冒出个想法{thought}",
    ],
    "unknown": [
        "测试一下",
        "今天天气不错",
        "随便说点什么",
        "哈哈哈",
        "嗯嗯",
        "好的",
        "知道了",
        "行吧",
        "可以",
        "没问题",
        "继续",
        "下一个",
        "换一个",
        "试试看",
        "有意思",
        "挺不错的",
        "还行吧",
        "一般般",
        "无聊",
        "不知道说什么",
        "随便",
        "你猜",
        "猜猜看",
        "好玩吗",
        "是真的吗",
        "为什么",
        "怎么样",
        "如何",
        "什么意思",
        "不太懂",
        "明白了",
    ],
}

TOPICS = [
    "AI", "人工智能", "大模型", "GPT", "机器学习", "深度学习",
    "远程工作", "在家办公", "副业", "自由职业",
    "技术开发", "编程", "前端", "后端", "全栈",
    "产品设计", "UI设计", "用户体验",
    "学术研究", "论文", "科研",
    "行业资讯", "新闻", "热点",
    "职业发展", "求职", "面试", "简历",
    "学习成长", "课程", "教程",
    "财经投资", "股票", "基金",
    "健康生活", "运动", "健身",
]

ACTIONS = [
    "投简历", "写报告", "交作业", "完成论文", "开会",
    "复习考试", "整理文档", "回复邮件", "预约面试",
    "提交方案", "写代码", "做项目", "学习新技能",
]

THOUGHTS = [
    "今天学到了很多", "这个观点很有意思", "发现了新方法",
    "思考了一下这个问题", "感悟到一些道理", "体会到成长",
    "认识到自己的不足", "深刻理解了这个概念",
]

TIMES = ["8点", "9点", "早上8点", "晚上9点", "中午12点", "下午3点"]


def generate_test_data(count: int = 10000) -> list:
    test_data = []
    intent_weights = {
        "add_interest": 15,
        "remove_interest": 8,
        "create_todo": 15,
        "set_push_time": 5,
        "query_stats": 8,
        "greeting": 10,
        "help": 8,
        "record_thought": 6,
        "fragmented_thought": 5,
        "unknown": 20,
    }
    
    intent_types = []
    for intent, weight in intent_weights.items():
        intent_types.extend([intent] * weight)
    
    for i in range(count):
        expected_intent = random.choice(intent_types)
        templates = INTENT_TEMPLATES[expected_intent]
        template = random.choice(templates)
        
        if "{topic}" in template:
            text = template.format(topic=random.choice(TOPICS))
        elif "{action}" in template:
            text = template.format(action=random.choice(ACTIONS))
        elif "{thought}" in template:
            text = template.format(thought=random.choice(THOUGHTS))
        elif "{time}" in template:
            text = template.format(time=random.choice(TIMES))
        else:
            text = template
        
        test_data.append({
            "id": i + 1,
            "text": text,
            "expected": expected_intent,
        })
    
    return test_data


def test_intent_single(text: str, api_url: str) -> dict:
    try:
        response = requests.post(
            f"{api_url}/v1/intent/recognize",
            json={"input": text},
            timeout=5,
        )
        if response.status_code == 200:
            return response.json()
        return {"type": "error", "confidence": 0}
    except Exception as e:
        return {"type": "error", "confidence": 0}


def run_tests(test_data: list, api_url: str = "http://localhost:5000/api") -> dict:
    results = {
        "total": len(test_data),
        "correct": 0,
        "wrong": 0,
        "errors": 0,
        "by_intent": {},
        "wrong_samples": [],
    }
    
    for intent in INTENT_TEMPLATES.keys():
        results["by_intent"][intent] = {
            "total": 0,
            "correct": 0,
            "wrong": 0,
        }
    
    print(f"开始测试 {len(test_data)} 条数据...")
    start_time = time.time()
    
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(test_intent_single, item["text"], api_url): item
            for item in test_data
        }
        
        completed = 0
        for future in as_completed(futures):
            item = futures[future]
            result = future.result()
            completed += 1
            
            expected = item["expected"]
            actual = result.get("type", "error")
            
            results["by_intent"][expected]["total"] += 1
            
            if actual == "error":
                results["errors"] += 1
            elif actual == expected:
                results["correct"] += 1
                results["by_intent"][expected]["correct"] += 1
            else:
                results["wrong"] += 1
                results["by_intent"][expected]["wrong"] += 1
                if len(results["wrong_samples"]) < 50:
                    results["wrong_samples"].append({
                        "text": item["text"],
                        "expected": expected,
                        "actual": actual,
                        "confidence": result.get("confidence", 0),
                    })
            
            if completed % 1000 == 0:
                elapsed = time.time() - start_time
                rate = completed / len(test_data) * 100
                print(f"进度: {completed}/{len(test_data)} ({rate:.1f}%) - 耗时: {elapsed:.1f}s")
    
    elapsed = time.time() - start_time
    results["elapsed_time"] = elapsed
    
    return results


def print_results(results: dict):
    print("\n" + "=" * 60)
    print("意图识别测试报告")
    print("=" * 60)
    
    total = results["total"]
    correct = results["correct"]
    wrong = results["wrong"]
    errors = results["errors"]
    
    accuracy = correct / total * 100 if total > 0 else 0
    
    print(f"\n总体统计:")
    print(f"  总测试数: {total}")
    print(f"  正确数: {correct}")
    print(f"  错误数: {wrong}")
    print(f"  错误(API): {errors}")
    print(f"  准确率: {accuracy:.2f}%")
    print(f"  耗时: {results['elapsed_time']:.2f}s")
    
    print(f"\n各意图类型统计:")
    print("-" * 60)
    print(f"{'意图类型':<20} {'总数':>8} {'正确':>8} {'错误':>8} {'准确率':>10}")
    print("-" * 60)
    
    sorted_intents = sorted(
        results["by_intent"].items(),
        key=lambda x: x[1]["total"],
        reverse=True
    )
    
    for intent, stats in sorted_intents:
        if stats["total"] > 0:
            acc = stats["correct"] / stats["total"] * 100
            print(f"{intent:<20} {stats['total']:>8} {stats['correct']:>8} {stats['wrong']:>8} {acc:>9.1f}%")
    
    if results["wrong_samples"]:
        print(f"\n错误样本 (前20条):")
        print("-" * 60)
        for i, sample in enumerate(results["wrong_samples"][:20], 1):
            print(f"{i}. 文本: {sample['text']}")
            print(f"   期望: {sample['expected']} -> 实际: {sample['actual']} (置信度: {sample['confidence']:.2f})")
            print()


def main():
    print("生成测试数据...")
    test_data = generate_test_data(10000)
    
    print(f"已生成 {len(test_data)} 条测试数据")
    print(f"数据分布:")
    intent_counts = {}
    for item in test_data:
        intent_counts[item["expected"]] = intent_counts.get(item["expected"], 0) + 1
    for intent, count in sorted(intent_counts.items(), key=lambda x: -x[1]):
        print(f"  {intent}: {count}")
    
    print("\n开始测试...")
    results = run_tests(test_data)
    
    print_results(results)
    
    with open("intent_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n详细结果已保存到 intent_test_results.json")


if __name__ == "__main__":
    main()
