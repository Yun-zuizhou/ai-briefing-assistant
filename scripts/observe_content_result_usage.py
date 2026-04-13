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


def main() -> None:
    app_main.rss_scheduler.start = lambda: None
    app_main.rss_scheduler.stop = lambda: None

    content_result_observer.reset()

    with TestClient(app) as client:
        responses = {
            "content_article": client.get("/api/v1/content/by-ref", params={"content_ref": "article:1"}),
            "rss_articles": client.get("/api/v1/rss/articles", params={"limit": 5}),
        }
        for label, response in responses.items():
            if response.status_code != 200:
                raise RuntimeError(f"{label} failed: {response.status_code} {response.text}")

    db = SessionLocal()
    try:
        recommender = RSSRecommender(db)
        recommender.get_hot_articles(limit=3)
        recommender.get_articles_by_tags(tags=["AI", "写作"], limit=3)
    finally:
        db.close()

    snapshot = content_result_observer.snapshot()
    print(json.dumps(
        {
            "total_events": snapshot.total_events,
            "by_source": snapshot.by_source,
            "by_version": snapshot.by_version,
        },
        ensure_ascii=False,
        indent=2,
    ))


if __name__ == "__main__":
    main()
