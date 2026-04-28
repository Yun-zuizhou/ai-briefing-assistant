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
from app.main import app
from app.services.content_result_observer import content_result_observer


def _find_hot_topic_ref(client: TestClient) -> str:
    today_response = client.get("/api/v1/dashboard/today", params={"user_id": 1})
    if today_response.status_code == 200:
        today_data = today_response.json()
        worth_knowing = today_data.get("worthKnowing") or []
        if worth_knowing:
            content_ref = worth_knowing[0].get("contentRef")
            if content_ref:
                return str(content_ref)

    list_response = client.get("/api/v1/hot-topics", params={"limit": 1})
    if list_response.status_code == 200:
        list_data = list_response.json()
        items = list_data.get("items") or []
        if items:
            topic_id = items[0].get("id")
            if topic_id is not None:
                return f"hot_topic:{topic_id}"

    raise RuntimeError("当前环境未找到可用的 hot_topic 样本，无法执行观测。")


def main() -> None:
    app_main.rss_scheduler.start = lambda: None
    app_main.rss_scheduler.stop = lambda: None

    content_result_observer.reset()

    with TestClient(app) as client:
        hot_topic_ref = _find_hot_topic_ref(client)
        responses = {
            "today": client.get("/api/v1/dashboard/today", params={"user_id": 1}),
            "content_hot_topic": client.get("/api/v1/content/by-ref", params={"content_ref": hot_topic_ref}),
        }
        for label, response in responses.items():
            if response.status_code != 200:
                raise RuntimeError(f"{label} failed: {response.status_code} {response.text}")

    snapshot = content_result_observer.snapshot()
    hot_topic_sources = {
        source: count
        for source, count in snapshot.by_source.items()
        if source.startswith("content.detail.")
        or source.startswith("content.related.")
        or source.startswith("today.")
    }
    hot_topic_versions = {
        version: count
        for version, count in snapshot.by_version.items()
        if version.startswith("hot-topic-")
    }
    print(json.dumps(
        {
            "hot_topic_ref": hot_topic_ref,
            "total_events": sum(hot_topic_sources.values()),
            "by_source": hot_topic_sources,
            "by_version": hot_topic_versions,
        },
        ensure_ascii=False,
        indent=2,
    ))


if __name__ == "__main__":
    main()
