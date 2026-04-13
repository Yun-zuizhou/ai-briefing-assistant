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


def _assert_ok(response, label: str) -> None:
    if response.status_code != 200:
        raise RuntimeError(f"{label} failed: {response.status_code} {response.text}")


def _find_hot_topic_ref(client: TestClient) -> str:
    today_response = client.get("/api/v1/dashboard/today", params={"user_id": 1})
    _assert_ok(today_response, "today dashboard sample")
    today_data = today_response.json()
    worth_knowing = today_data.get("worthKnowing") or []
    if worth_knowing:
        content_ref = worth_knowing[0].get("contentRef")
        if content_ref:
            return str(content_ref)

    list_response = client.get("/api/v1/hot-topics", params={"limit": 1})
    _assert_ok(list_response, "hot topic list sample")
    list_data = list_response.json()
    items = list_data.get("items") or []
    if items:
        topic_id = items[0].get("id")
        if topic_id is not None:
            return f"hot_topic:{topic_id}"

    raise RuntimeError("当前环境未找到可用的 hot_topic 样本，无法执行热路径验证。")


def main() -> None:
    app_main.rss_scheduler.start = lambda: None
    app_main.rss_scheduler.stop = lambda: None

    content_result_observer.reset()

    with TestClient(app) as client:
        hot_topic_ref = _find_hot_topic_ref(client)
        for _ in range(3):
            _assert_ok(
                client.get("/api/v1/dashboard/today", params={"user_id": 1}),
                "today dashboard",
            )
        for _ in range(2):
            _assert_ok(
                client.get("/api/v1/content/by-ref", params={"content_ref": hot_topic_ref}),
                "hot topic detail",
            )

    snapshot = content_result_observer.snapshot()
    by_source = {
        source: count
        for source, count in snapshot.by_source.items()
        if source.startswith("content.detail.")
        or source.startswith("content.related.")
        or source.startswith("today.")
    }
    by_version = {
        version: count
        for version, count in snapshot.by_version.items()
        if version.startswith("hot-topic-")
    }
    total_events = sum(by_source.values())
    hot_path = max(by_source.items(), key=lambda item: item[1])[0] if by_source else None
    detail_hits = by_source.get("content.detail.d1", 0) + by_source.get("content.detail.local", 0)
    related_hits = by_source.get("content.related.d1", 0) + by_source.get("content.related.local", 0)
    today_recommended_hits = by_source.get("today.recommended", 0)
    today_worth_knowing_hits = by_source.get("today.worth_knowing", 0)

    ready_for_persistence_design = (
        total_events >= 20
        and max(related_hits, today_recommended_hits, today_worth_knowing_hits) > detail_hits
        and (today_recommended_hits + today_worth_knowing_hits) >= detail_hits
    )

    result = {
        "total_events": total_events,
        "hot_topic_ref": hot_topic_ref,
        "by_source": by_source,
        "by_version": by_version,
        "hot_path": hot_path,
        "detail_hits": detail_hits,
        "related_hits": related_hits,
        "today_recommended_hits": today_recommended_hits,
        "today_worth_knowing_hits": today_worth_knowing_hits,
        "ready_for_persistence_design": ready_for_persistence_design,
        "verdict": (
            "hot_topic 已形成稳定结果对象热路径，可为 hot_topic_processing_results 小设计做实现准备。"
            if ready_for_persistence_design
            else "hot_topic 仍主要共享原始事实与基础投影，暂不建议进入结果层实现准备。"
        ),
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
