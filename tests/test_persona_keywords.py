from app.services.persona_keywords import build_growth_keywords, sanitize_growth_keywords


def test_sanitize_growth_keywords_filters_system_noise():
    values = ["AI", "写作", "D1验证20260407013950", "D1", "验证", "测试", "职场技能"]

    assert sanitize_growth_keywords(values) == ["AI", "写作", "职场技能"]


def test_build_growth_keywords_prefers_user_facing_profile_terms():
    keywords = build_growth_keywords(
        active_interests=["AI", "写作", "D1验证20260407013950", "职场技能", "远程工作"],
        note_tags=["D1", "验证", "开发", "测试", "纠偏", "日常"],
        note_contents=[
            "跟进 AI 写作训练营征稿",
            "记下：D1切换验证记录，这是云端验证输入。",
        ],
        favorite_titles=[
            "OpenAI发布GPT-5技术预览版",
            "远程运营专员（AI产品方向）",
            "Prompt Engineering完全指南",
        ],
    )

    assert keywords[:4] == ["AI", "写作", "职场技能", "远程工作"]
    assert "D1" not in keywords
    assert "验证" not in keywords
    assert "D1验证20260407013950" not in keywords
