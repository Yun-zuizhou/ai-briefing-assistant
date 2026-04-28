from __future__ import annotations

from pathlib import Path
import json
import sys


def _bootstrap_python_path() -> None:
    root_dir = Path(__file__).resolve().parent.parent
    candidates: list[str] = []
    for candidate in [root_dir, root_dir / ".pydeps_runtime", root_dir / ".pydeps"]:
        if candidate.exists():
            candidate_str = str(candidate)
            if candidate_str not in sys.path:
                candidates.append(candidate_str)
    sys.path[:0] = candidates


_bootstrap_python_path()

from fastapi.testclient import TestClient

import app.main as app_main
from app.database import SessionLocal
from app.main import app
from app.services.briefing.rss_recommender import RSSRecommender
from app.services.content_result_observer import content_result_observer


def _assert_ok(response, label: str) -> None:
    if response.status_code != 200:
        raise RuntimeError(f"{label} failed: {response.status_code} {response.text}")


def main() -> None:
    app_main.rss_scheduler.start = lambda: None
    app_main.rss_scheduler.stop = lambda: None

    content_result_observer.reset()

    with TestClient(app) as client:
        for _ in range(3):
            _assert_ok(
                client.get("/api/v1/content/by-ref", params={"content_ref": "article:1"}),
                "content article detail",
            )

        for _ in range(2):
            _assert_ok(
                client.get("/api/v1/rss/articles", params={"limit": 5}),
                "rss article list",
            )

    db = SessionLocal()
    try:
        recommender = RSSRecommender(db)
        for _ in range(2):
            recommender.get_hot_articles(limit=3)
        for _ in range(2):
            recommender.get_articles_by_tags(tags=["AI", "写作"], limit=3)
    finally:
        db.close()

    snapshot = content_result_observer.snapshot()
    by_source = snapshot.by_source
    hot_path = max(by_source.items(), key=lambda item: item[1])[0] if by_source else None
    detail_hits = by_source.get("content.detail.d1", 0) + by_source.get("content.detail.local", 0)
    related_hits = by_source.get("content.related.d1", 0) + by_source.get("content.related.local", 0)
    rss_hits = by_source.get("rss.list", 0)
    briefing_hits = by_source.get("briefing.hot", 0) + by_source.get("briefing.tags", 0)

    ready_for_design = (
        snapshot.total_events >= 20
        and related_hits >= detail_hits
        and rss_hits >= 5
    )

    result = {
        "total_events": snapshot.total_events,
        "by_source": by_source,
        "by_version": snapshot.by_version,
        "hot_path": hot_path,
        "detail_hits": detail_hits,
        "related_hits": related_hits,
        "rss_hits": rss_hits,
        "briefing_hits": briefing_hits,
        "ready_for_persistence_design": ready_for_design,
        "verdict": (
            "article 热路径复用已经成立，可为 article_processing_results 落库实现准备。"
            if ready_for_design
            else "article 热路径复用仍需继续观察，暂不建议进入落库实现准备。"
        ),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
