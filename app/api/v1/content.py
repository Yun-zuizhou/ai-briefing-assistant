from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.api.v1.page_schemas import RelatedContentItem, UnifiedContentDetailResponse
from app.database import get_db
from app.models.article_processing_result import ArticleProcessingResult
from app.models.hot_topic import HotTopic
from app.models.opportunity import Opportunity
from app.models.rss_article import RSSArticle
from app.services.article_processing_result_store import (
    get_or_create_article_processing_result,
    get_or_create_article_processing_results,
)
from app.services.content_processing import (
    RelatedMatchInput,
    RelatedCandidate,
    collect_related_candidates,
    dedupe_related_candidates,
    normalize_text_values,
    shared_keyword_count,
)
from app.services.content_projection import (
    BaseContentProjection,
    build_content_detail_view,
    build_related_content_item,
    project_article_base,
    project_content_result_base,
    project_hot_topic_base,
    project_hot_topic_result_base,
    project_opportunity_base,
)
from app.services.content_result import (
    get_article_processing_result,
    get_hot_topic_processing_result,
    observe_article_processing_result,
    observe_hot_topic_processing_result,
)
from app.services.hot_topic_processing_result_store import (
    get_or_create_hot_topic_processing_result,
    get_or_create_hot_topic_processing_results,
)
from app.services.d1_article_processing_result_store import D1ArticleProcessingResultStore
from app.services.d1_client import D1Client
from app.services.d1_content_store import D1ContentStore
from app.services.d1_hot_topic_processing_result_store import D1HotTopicProcessingResultStore


router = APIRouter()


def _parse_content_ref(content_ref: str) -> tuple[str, int]:
    try:
        content_type, raw_id = content_ref.split(":", 1)
        return content_type, int(raw_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="content_ref 格式无效，应为 content_type:id")

def _build_related_item(base: BaseContentProjection, relation_reason: str) -> RelatedContentItem:
    return build_related_content_item(base, relation_reason=relation_reason)


def _find_related_items(
    db: Session,
    content_type: str,
    item_id: int,
    title: str,
    summary: str | None,
    category_labels: list[str],
    tags: list[str],
) -> list[RelatedContentItem]:
    seed_values = normalize_text_values(title, summary, category_labels, tags)
    related_candidates: list[RelatedCandidate] = []

    hot_topics = db.query(HotTopic).order_by(HotTopic.quality_score.desc(), HotTopic.hot_value.desc()).limit(12).all()
    hot_topic_results = get_or_create_hot_topic_processing_results(db, hot_topics)
    related_candidates.extend(
        collect_related_candidates(
            seed_values,
            (
                RelatedMatchInput(
                    candidate_values=normalize_text_values(topic.title, topic.summary, topic.categories or [], topic.tags or []),
                    quality_score=float((hot_topic_results[int(topic.id)].quality_score if int(topic.id) in hot_topic_results else topic.quality_score) or 0),
                    item=(
                        lambda result_row: (
                            observe_hot_topic_processing_result(result_row, source="content.related.local"),
                            _build_related_item(
                                project_hot_topic_result_base(result_row, topic),
                                "与你刚读内容的标签或分类相近",
                            ),
                        )[1]
                    )(hot_topic_results[int(topic.id)]),
                )
                for topic in hot_topics
                if not (content_type == "hot_topic" and topic.id == item_id)
            ),
        )
    )

    articles = db.query(RSSArticle).order_by(RSSArticle.quality_score.desc(), RSSArticle.publish_time.desc()).limit(12).all()
    article_results = get_or_create_article_processing_results(db, articles)
    related_candidates.extend(
        collect_related_candidates(
            seed_values,
            (
                RelatedMatchInput(
                    candidate_values=normalize_text_values(article.title, article.summary, article.category, article.tags or []),
                    quality_score=float(article.quality_score or 0),
                    item=(
                        lambda result_row: (
                            observe_article_processing_result(result_row, source="content.related.local"),
                            _build_related_item(
                                project_content_result_base(result_row, article),
                                "与当前内容主题接近，可作为补充阅读",
                            ),
                        )[1]
                    )(article_results[int(article.id)]),
                )
                for article in articles
                if not (content_type == "article" and article.id == item_id)
            ),
        )
    )

    opportunities = db.query(Opportunity).order_by(Opportunity.quality_score.desc(), Opportunity.published_at.desc()).limit(12).all()
    related_candidates.extend(
        collect_related_candidates(
            seed_values,
            (
                RelatedMatchInput(
                    candidate_values=normalize_text_values(opportunity.title, opportunity.summary, opportunity.category, opportunity.tags or []),
                    quality_score=float(opportunity.quality_score or 0),
                    item=_build_related_item(
                        project_opportunity_base(opportunity),
                        "与你刚读内容方向一致，可继续转化为行动",
                    ),
                )
                for opportunity in opportunities
                if not (content_type == "opportunity" and opportunity.id == item_id)
            ),
        )
    )

    return dedupe_related_candidates(related_candidates)


def _find_related_items_d1(
    store: D1ContentStore,
    hot_topic_result_store: D1HotTopicProcessingResultStore,
    content_type: str,
    item_id: int,
    title: str,
    summary: str | None,
    category_labels: list[str],
    tags: list[str],
) -> list[RelatedContentItem]:
    seed_values = normalize_text_values(title, summary, category_labels, tags)
    related_candidates: list[RelatedCandidate] = []

    hot_topics = store.list_hot_topics(limit=12)
    hot_topic_results = hot_topic_result_store.get_many_by_source_hot_topic_ids([
        int(topic.id)
        for topic in hot_topics
        if getattr(topic, "id", None) is not None
    ])
    related_candidates.extend(
        collect_related_candidates(
            seed_values,
            (
                RelatedMatchInput(
                    candidate_values=normalize_text_values(topic.title, topic.summary, topic.categories or [], topic.tags or []),
                    quality_score=float(((hot_topic_results.get(int(topic.id)) or get_hot_topic_processing_result(topic)).quality_score if getattr(topic, "id", None) is not None else topic.quality_score) or 0),
                    item=(
                        lambda result_row: (
                            observe_hot_topic_processing_result(result_row, source="content.related.d1"),
                            _build_related_item(
                                project_hot_topic_result_base(result_row, topic),
                                "与你刚读内容的标签或分类相近",
                            ),
                        )[1]
                    )(hot_topic_results.get(int(topic.id)) or get_hot_topic_processing_result(topic)),
                )
                for topic in hot_topics
                if not (content_type == "hot_topic" and topic.id == item_id)
            ),
        )
    )

    opportunities = store.list_opportunities(limit=12)
    related_candidates.extend(
        collect_related_candidates(
            seed_values,
            (
                RelatedMatchInput(
                    candidate_values=normalize_text_values(opportunity.title, opportunity.summary, opportunity.category, opportunity.tags or []),
                    quality_score=float(opportunity.quality_score or 0),
                    item=_build_related_item(
                        project_opportunity_base(opportunity),
                        "与你刚读内容方向一致，可继续转化为行动",
                    ),
                )
                for opportunity in opportunities
                if not (content_type == "opportunity" and opportunity.id == item_id)
            ),
        )
    )

    return dedupe_related_candidates(related_candidates)


def _find_related_items_d1_with_articles(
    store: D1ContentStore,
    result_store: D1ArticleProcessingResultStore,
    hot_topic_result_store: D1HotTopicProcessingResultStore,
    content_type: str,
    item_id: int,
    title: str,
    summary: str | None,
    category_labels: list[str],
    tags: list[str],
) -> list[RelatedContentItem]:
    seed_values = normalize_text_values(title, summary, category_labels, tags)
    related_candidates: list[RelatedCandidate] = []

    hot_topics = store.list_hot_topics(limit=12)
    hot_topic_results = hot_topic_result_store.get_many_by_source_hot_topic_ids([
        int(topic.id)
        for topic in hot_topics
        if getattr(topic, "id", None) is not None
    ])
    related_candidates.extend(
        collect_related_candidates(
            seed_values,
            (
                RelatedMatchInput(
                    candidate_values=normalize_text_values(topic.title, topic.summary, topic.categories or [], topic.tags or []),
                    quality_score=float(((hot_topic_results.get(int(topic.id)) or get_hot_topic_processing_result(topic)).quality_score if getattr(topic, "id", None) is not None else topic.quality_score) or 0),
                    item=(
                        lambda result_row: (
                            observe_hot_topic_processing_result(result_row, source="content.related.d1"),
                            _build_related_item(
                                project_hot_topic_result_base(result_row, topic),
                                "与你刚读内容的标签或分类相近",
                            ),
                        )[1]
                    )(hot_topic_results.get(int(topic.id)) or get_hot_topic_processing_result(topic)),
                )
                for topic in hot_topics
            ),
        )
    )

    articles = store.list_articles(limit=12)
    article_results = result_store.get_many_by_source_article_ids([
        int(article.id)
        for article in articles
        if getattr(article, "id", None) is not None
    ])
    related_candidates.extend(
        collect_related_candidates(
            seed_values,
            (
                RelatedMatchInput(
                    candidate_values=normalize_text_values(article.title, article.summary, article.category, article.tags or []),
                    quality_score=float(article.quality_score or 0),
                    item=(
                        lambda result_row: (
                            observe_article_processing_result(result_row, source="content.related.d1"),
                            _build_related_item(
                                project_content_result_base(result_row, article),
                                "与当前内容主题接近，可作为补充阅读",
                            ),
                        )[1]
                    )(article_results.get(int(article.id)) or get_article_processing_result(article)),
                )
                for article in articles
                if not (content_type == "article" and article.id == item_id)
            ),
        )
    )

    opportunities = store.list_opportunities(limit=12)
    related_candidates.extend(
        collect_related_candidates(
            seed_values,
            (
                RelatedMatchInput(
                    candidate_values=normalize_text_values(opportunity.title, opportunity.summary, opportunity.category, opportunity.tags or []),
                    quality_score=float(opportunity.quality_score or 0),
                    item=_build_related_item(
                        project_opportunity_base(opportunity),
                        "与你刚读内容方向一致，可继续转化为行动",
                    ),
                )
                for opportunity in opportunities
            ),
        )
    )

    return dedupe_related_candidates(related_candidates)


@router.get("/by-ref", response_model=UnifiedContentDetailResponse, summary="按统一引用获取内容详情")
async def get_content_by_ref(
    content_ref: str = Query(..., description="统一内容引用，格式为 content_type:id"),
    db: Session = Depends(get_db),
):
    content_type, item_id = _parse_content_ref(content_ref)

    if settings.D1_USE_CLOUD_AS_SOURCE and content_type in {"hot_topic", "opportunity", "article"}:
        d1_client = D1Client()
        store = D1ContentStore(d1_client)
        result_store = D1ArticleProcessingResultStore(d1_client)
        hot_topic_result_store = D1HotTopicProcessingResultStore(d1_client)

        if content_type == "hot_topic":
            topic = store.get_hot_topic(item_id)
            if not topic:
                raise HTTPException(status_code=404, detail="热点内容不存在")
            result_row = hot_topic_result_store.get_by_source_hot_topic_id(item_id) or get_hot_topic_processing_result(topic)
            observe_hot_topic_processing_result(result_row, source="content.detail.d1")
            base = project_hot_topic_result_base(result_row, topic)
            category_labels = base.category_labels or []
            tags = base.tags or []
            return build_content_detail_view(
                base,
                related_items=_find_related_items_d1(
                    store,
                    hot_topic_result_store,
                    "hot_topic",
                    base.id,
                    base.title,
                    base.summary,
                    category_labels,
                    tags,
                ),
            )

        if content_type == "opportunity":
            opportunity = store.get_opportunity(item_id)
            if not opportunity:
                raise HTTPException(status_code=404, detail="机会内容不存在")
            base = project_opportunity_base(opportunity)
            normalized_categories = base.category_labels or []
            tags = base.tags or []
            return build_content_detail_view(
                base,
                related_items=_find_related_items_d1(
                    store,
                    hot_topic_result_store,
                    "opportunity",
                    base.id,
                    base.title,
                    base.summary,
                    normalized_categories,
                    tags,
                ),
            )

        article = store.get_article(item_id)
        if not article:
            raise HTTPException(status_code=404, detail="文章内容不存在")
        processing_result = result_store.get_by_source_article_id(item_id) or get_article_processing_result(article)
        observe_article_processing_result(processing_result, source="content.detail.d1")
        base = project_content_result_base(processing_result, article)
        normalized_categories = base.category_labels or []
        tags = base.tags or []
        return build_content_detail_view(
            base,
            related_items=_find_related_items_d1_with_articles(
                store,
                result_store,
                hot_topic_result_store,
                "article",
                base.id,
                base.title,
                base.summary,
                normalized_categories,
                tags,
            ),
        )

    if content_type == "hot_topic":
        topic = db.query(HotTopic).filter(HotTopic.id == item_id).first()
        if not topic:
            raise HTTPException(status_code=404, detail="热点内容不存在")
        result_row = get_or_create_hot_topic_processing_result(db, topic)
        observe_hot_topic_processing_result(result_row, source="content.detail.local")
        base = project_hot_topic_result_base(result_row, topic)
        category_labels = base.category_labels or []
        tags = base.tags or []
        return build_content_detail_view(
            base,
            related_items=_find_related_items(db, "hot_topic", base.id, base.title, base.summary, category_labels, tags),
        )

    if content_type == "opportunity":
        opportunity = db.query(Opportunity).filter(Opportunity.id == item_id).first()
        if not opportunity:
            raise HTTPException(status_code=404, detail="机会内容不存在")
        base = project_opportunity_base(opportunity)
        normalized_categories = base.category_labels or []
        tags = base.tags or []
        return build_content_detail_view(
            base,
            related_items=_find_related_items(
                db,
                "opportunity",
                base.id,
                base.title,
                base.summary,
                normalized_categories,
                tags,
            ),
        )

    if content_type == "article":
        article = db.query(RSSArticle).filter(RSSArticle.id == item_id).first()
        if not article:
            raise HTTPException(status_code=404, detail="文章内容不存在")
        result_row = get_or_create_article_processing_result(db, article)
        observe_article_processing_result(result_row, source="content.detail.local")
        base = project_content_result_base(result_row, article)
        normalized_categories = base.category_labels or []
        tags = base.tags or []
        return build_content_detail_view(
            base,
            related_items=_find_related_items(
                db,
                "article",
                base.id,
                base.title,
                base.summary,
                normalized_categories,
                tags,
            ),
        )

    raise HTTPException(status_code=400, detail=f"暂不支持的 content_type: {content_type}")
