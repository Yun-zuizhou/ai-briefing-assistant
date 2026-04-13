from types import SimpleNamespace

import pytest

pytest.importorskip("fastapi")

from app.services.content_processing import (
    RelatedMatchInput,
    RelatedCandidate,
    build_opportunity_ranking_score,
    build_topic_ranking_score,
    build_worth_acting_ranking_score,
    build_worth_knowing_ranking_score,
    collect_related_candidates,
    contains_interest,
    dedupe_related_candidates,
    match_interest_score,
    normalize_text_values,
    rank_interest_matches,
    shared_keyword_count,
)
from app.services.processing_common import (
    build_weighted_ranking_score,
    clamp_int,
    take_first,
)
from app.services.content_projection import (
    build_content_detail_view,
    build_report_attention_change,
    build_report_topic_trend,
    build_recommended_content_item,
    build_related_content_item,
    build_worth_acting_item,
    build_worth_knowing_item,
    project_article,
    project_article_base,
    project_content_result_base,
    project_hot_topic,
    project_hot_topic_base,
    project_opportunity,
    project_opportunity_base,
)
from app.services.content_result import build_article_processing_result
from app.services.content_result import build_hot_topic_processing_result
from app.services.content_result import get_article_processing_result
from app.services.content_result import get_hot_topic_processing_result
from app.services.content_result import project_article_result_payload
from app.services.content_result import observe_article_processing_result
from app.services.content_result import observe_hot_topic_processing_result
from app.services.content_result_observer import ContentResultObserver
from app.services.report_processing import (
    build_report_attention_change_payload,
    build_report_fallback_insights,
    build_report_trend_candidates,
    build_report_trend_insights,
    calculate_report_trend_metrics,
)


def test_base_projection_keeps_legacy_payload_shape():
    hot_topic = SimpleNamespace(
        id=1,
        title="AI 热点",
        summary="热点摘要",
        content="热点正文",
        source="新闻源",
        source_url="https://example.com/hot",
        author="作者",
        categories=["AI"],
        tags=["写作"],
        quality_score="8.5",
        published_at=None,
        hot_value=77,
    )
    opportunity = SimpleNamespace(
        id=2,
        title="投稿机会",
        summary="机会摘要",
        content="机会正文",
        source="机会站",
        source_url="https://example.com/opp",
        category="写作",
        tags=["AI"],
        quality_score=9,
        published_at=None,
        deadline=None,
        reward="500元",
    )
    article = SimpleNamespace(
        id=3,
        title="AI 写作方法",
        summary="文章摘要",
        content="文章正文",
        source_name="博客",
        source_url="https://example.com/article",
        author="作者A",
        category="写作",
        tags=["AI", "写作"],
        quality_score=8.8,
        publish_time=None,
    )

    assert project_hot_topic(hot_topic)["content_type"] == "hot_topic"
    assert project_hot_topic(hot_topic)["hot_score"] == 77
    assert project_opportunity(opportunity)["reward"] == "500元"
    assert project_article(article)["source_name"] == "博客"
    assert project_article(article)["category_labels"] == ["写作"]


def test_view_projection_builders_share_base_projection():
    hot_base = project_hot_topic_base(
        SimpleNamespace(
            id=1,
            title="AI 热点",
            summary="热点摘要",
            content="热点正文",
            source="新闻源",
            source_url="https://example.com/hot",
            author="作者",
            categories=["AI", "写作"],
            tags=["AI"],
            quality_score=8.5,
            published_at=None,
            hot_value=77,
        )
    )
    opportunity_base = project_opportunity_base(
        SimpleNamespace(
            id=2,
            title="投稿机会",
            summary=None,
            content="机会正文",
            source="机会站",
            source_url="https://example.com/opp",
            category="写作",
            tags=["AI"],
            quality_score=9,
            published_at=None,
            deadline=None,
            reward="500元",
        )
    )
    article_base = project_article_base(
        SimpleNamespace(
            id=3,
            title="AI 写作方法",
            summary="文章摘要",
            content="文章正文",
            source_name="博客",
            source_url="https://example.com/article",
            author="作者A",
            category="写作",
            tags=["AI", "写作"],
            quality_score=8.8,
            publish_time=None,
        )
    )

    recommended = build_recommended_content_item(hot_base, match_score=2, ranking_score=120.5)
    worth_knowing = build_worth_knowing_item(hot_base, relevance_reason="与你关注的 AI 直接相关", match_score=2, ranking_score=118.0)
    worth_acting = build_worth_acting_item(
        opportunity_base,
        action_type="apply",
        why_relevant="与你关注的 写作 方向一致",
        next_action_label="转成待办",
        match_score=1,
        ranking_score=96.0,
    )
    related = build_related_content_item(article_base, relation_reason="可作为补充阅读")
    detail = build_content_detail_view(article_base, related_items=[related])

    assert recommended.content_ref == "hot_topic:1"
    assert worth_knowing.category_labels == ["AI", "写作"]
    assert worth_acting.summary == "当前这条机会值得尽快转成待办进一步跟进。"
    assert related.content_ref == "article:3"
    assert detail.related_items[0].relation_reason == "可作为补充阅读"


def test_content_detail_view_builds_fallback_body_when_content_missing():
    opportunity_base = project_opportunity_base(
        SimpleNamespace(
            id=2,
            title="投稿机会",
            summary="适合关注 AI 写作的人投稿。",
            content=None,
            source="机会站",
            source_url="https://example.com/opp",
            category="写作",
            tags=["AI"],
            quality_score=9,
            published_at=None,
            deadline=None,
            reward="500元",
        )
    )

    detail = build_content_detail_view(opportunity_base, related_items=[])

    assert detail.content
    assert "投稿机会" in detail.content
    assert "机会站" in detail.content
    assert "500元" in detail.content


def test_report_view_projection_builders_keep_reports_shape():
    attention_change = build_report_attention_change(change=12, new_topics=["AI", "写作"])
    trend = build_report_topic_trend(
        trend_id="本周-1",
        icon="🧭",
        title="AI",
        current_heat=48,
        previous_heat=36,
        change=12,
        trend="up",
        hot_spot_title="AI 写作工具迎来新一轮升级",
        hot_spot_content_ref="hot_topic:1",
        discussion_count=3,
        user_participation=2,
        hot_spot_summary="该主题在本周内持续出现于你的记录与收藏中。",
        insights=["这周开始形成连续关注。"],
        attention_change=attention_change,
    )

    assert trend.id == "本周-1"
    assert trend.heat_data.current == 48
    assert trend.hot_spot.content_ref == "hot_topic:1"
    assert trend.user_attention_change.change == 12


def test_report_processing_helpers_keep_transition_logic_stable():
    candidates = build_report_trend_candidates([], ["AI", "写作", "AI"])
    metrics = calculate_report_trend_metrics(
        interest="AI",
        note_texts=["AI 写作流程", "别的主题"],
        favorite_titles=["AI 工具升级"],
        history_titles=["AI 写作工具迎来新一轮升级"],
        fallback_index=1,
    )
    change_value, new_topics = build_report_attention_change_payload(
        favorite_hits=metrics.favorite_hits,
        user_participation=metrics.user_participation,
        new_topics=["AI", "写作", "效率"],
    )
    insights = build_report_trend_insights(title="AI", period_label="本周")
    fallback_insights = build_report_fallback_insights()

    assert candidates == ["AI", "写作"]
    assert metrics.current_heat >= metrics.previous_heat
    assert metrics.trend == "up"
    assert change_value >= 6
    assert new_topics == ["AI", "写作"]
    assert "本周" in insights[0]
    assert len(fallback_insights) == 2


def test_content_processing_helpers_keep_today_and_related_logic_stable():
    topic = SimpleNamespace(title="AI 写作工具", summary="提升效率", categories=["AI"], tags=["写作"], quality_score=8.5, hot_value=90)
    opportunity = SimpleNamespace(title="AI 投稿", summary="写作征稿", category="写作", tags=["AI"], quality_score=9.0)
    ranked_topics = rank_interest_matches(
        [topic],
        interest="AI",
        values_getter=lambda item: [item.title, item.summary, *item.categories, *item.tags],
        ranking_getter=lambda item, match_score: build_topic_ranking_score(
            quality_score=float(item.quality_score),
            hot_value=float(item.hot_value),
            match_score=match_score,
        ),
    )
    ranked_opportunities = rank_interest_matches(
        [opportunity],
        interest="写作",
        values_getter=lambda item: [item.title, item.summary, item.category, *item.tags],
        ranking_getter=lambda item, match_score: build_opportunity_ranking_score(
            quality_score=float(item.quality_score),
            match_score=match_score,
        ),
    )
    worth_knowing_score = build_worth_knowing_ranking_score(quality_score=8.5, hot_value=90, match_score=2)
    worth_acting_score = build_worth_acting_ranking_score(quality_score=9.0, match_score=1)
    normalized = normalize_text_values("AI", ["写作", None], "  ")
    shared_count = shared_keyword_count(["AI", "写作"], ["AI", "工具"])
    deduped = dedupe_related_candidates(
        [
            RelatedCandidate(
                matched_count=2,
                quality_score=9.0,
                item=build_related_content_item(
                    project_article_base(
                        SimpleNamespace(
                            id=1,
                            title="AI 写作方法",
                            summary="摘要",
                            content="正文",
                            source_name="博客",
                            source_url="https://example.com/article",
                            author="作者A",
                            category="写作",
                            tags=["AI"],
                            quality_score=8.0,
                            publish_time=None,
                        )
                    ),
                    relation_reason="补充阅读",
                ),
            ),
            RelatedCandidate(
                matched_count=1,
                quality_score=7.0,
                item=build_related_content_item(
                    project_article_base(
                        SimpleNamespace(
                            id=1,
                            title="AI 写作方法",
                            summary="摘要",
                            content="正文",
                            source_name="博客",
                            source_url="https://example.com/article",
                            author="作者A",
                            category="写作",
                            tags=["AI"],
                            quality_score=8.0,
                            publish_time=None,
                        )
                    ),
                    relation_reason="补充阅读",
                ),
            ),
        ]
    )

    assert contains_interest(["AI 写作工具"], "AI") is True
    assert match_interest_score(["AI 写作工具", "效率"], ["AI", "写作"]) == 2
    assert ranked_topics[0].match_score == 1
    assert ranked_opportunities[0].ranking_score > 0
    assert worth_knowing_score > worth_acting_score
    assert normalized == ["AI", "写作"]
    assert shared_count == 1
    assert len(deduped) == 1


def test_collect_related_candidates_filters_unmatched_items():
    matched_item = build_related_content_item(
        project_article_base(
            SimpleNamespace(
                id=2,
                title="AI 写作方法",
                summary="摘要",
                content="正文",
                source_name="博客",
                source_url="https://example.com/article-2",
                author="作者B",
                category="写作",
                tags=["AI"],
                quality_score=8.3,
                publish_time=None,
            )
        ),
        relation_reason="补充阅读",
    )
    unmatched_item = build_related_content_item(
        project_article_base(
            SimpleNamespace(
                id=3,
                title="数据分析方法",
                summary="摘要",
                content="正文",
                source_name="博客",
                source_url="https://example.com/article-3",
                author="作者C",
                category="数据",
                tags=["分析"],
                quality_score=7.0,
                publish_time=None,
            )
        ),
        relation_reason="补充阅读",
    )

    candidates = collect_related_candidates(
        ["AI", "写作"],
        [
            RelatedMatchInput(candidate_values=["AI", "写作"], quality_score=8.3, item=matched_item),
            RelatedMatchInput(candidate_values=["数据", "分析"], quality_score=7.0, item=unmatched_item),
        ],
    )

    assert len(candidates) == 1
    assert candidates[0].item.content_ref == "article:2"


def test_processing_common_helpers_keep_shared_semantics_stable():
    assert clamp_int(120, lower=10, upper=100) == 100
    assert clamp_int(5, lower=10, upper=100) == 10
    assert take_first(["AI", "写作", "效率"], limit=2) == ["AI", "写作"]
    assert build_weighted_ranking_score(
        quality_score=8.5,
        match_score=2,
        match_weight=25,
        additive_score=90,
    ) == 225.0


def test_article_processing_result_can_feed_projection():
    article = SimpleNamespace(
        id=5,
        title="AI 写作方法",
        summary="文章摘要",
        content="文章正文",
        source_name="博客",
        source_url="https://example.com/article-5",
        author="作者A",
        category="写作",
        tags=["AI", "写作"],
        quality_score=8.8,
        publish_time=None,
    )

    result = build_article_processing_result(article)
    base = project_content_result_base(result, article)

    assert result.source_content_ref == "article:5"
    assert result.source_content_type == "article"
    assert base.content_ref == "article:5"
    assert base.title == "AI 写作方法"
    assert base.category_labels == ["写作"]


def test_article_processing_result_payload_matches_article_read_shape():
    article = SimpleNamespace(
        id=6,
        title="AI 工具观察",
        summary="文章摘要",
        content="文章正文",
        source_name="博客",
        source_url="https://example.com/article-6",
        author="作者B",
        category="AI",
        tags=["AI", "工具"],
        quality_score=8.2,
        publish_time=None,
    )

    payload = project_article_result_payload(build_article_processing_result(article), article)

    assert payload["id"] == 6
    assert payload["title"] == "AI 工具观察"
    assert payload["category"] == "AI"
    assert payload["tags"] == ["AI", "工具"]


def test_article_processing_result_cache_reuses_same_result():
    article = SimpleNamespace(
        id=8,
        title="AI 缓存测试",
        summary="摘要",
        content="正文",
        source_name="博客",
        source_url="https://example.com/article-8",
        author="作者D",
        category="AI",
        tags=["AI"],
        quality_score=8.0,
        publish_time=None,
    )

    first = get_article_processing_result(article)
    second = get_article_processing_result(article)

    assert first is second
    assert first.source_content_ref == "article:8"


def test_content_result_observer_can_record_cross_interface_usage():
    observer = ContentResultObserver()
    result = build_article_processing_result(
        SimpleNamespace(
            id=7,
            title="AI 观察",
            summary="摘要",
            content="正文",
            source_name="博客",
            source_url="https://example.com/article-7",
            author="作者C",
            category="AI",
            tags=["AI"],
            quality_score=7.9,
            publish_time=None,
        )
    )

    observer.record(source="content.detail.local", processing_version=result.processing_version)
    observer.record(source="rss.list", processing_version=result.processing_version)
    snapshot = observer.snapshot()

    assert snapshot.total_events == 2
    assert snapshot.by_source["content.detail.local"] == 1
    assert snapshot.by_source["rss.list"] == 1
    assert snapshot.by_version[result.processing_version] == 2


def test_hot_topic_processing_result_cache_and_observer_can_record_cross_interface_usage():
    observer = ContentResultObserver()
    topic = SimpleNamespace(
        id=9,
        title="AI 热点观察",
        summary="热点摘要",
        content="热点正文",
        source="新闻源",
        source_url="https://example.com/hot-topic-9",
        author="作者",
        categories=["AI"],
        tags=["写作"],
        quality_score=8.4,
        published_at=None,
        hot_value=88,
    )

    first = get_hot_topic_processing_result(topic)
    second = get_hot_topic_processing_result(topic)
    observe_hot_topic_processing_result(first, source="content.detail.local")
    observer.record(source="today.worth_knowing", processing_version=first.processing_version)
    snapshot = observer.snapshot()

    assert first is second
    assert build_hot_topic_processing_result(topic).source_content_ref == "hot_topic:9"
    assert first.source_content_type == "hot_topic"
    assert snapshot.total_events == 1
    assert snapshot.by_source["today.worth_knowing"] == 1
    assert snapshot.by_version[first.processing_version] == 1
