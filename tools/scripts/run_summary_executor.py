from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


def _bootstrap_python_path() -> None:
    root_dir = Path(__file__).resolve().parents[2]
    candidates: list[str] = []
    for candidate in [root_dir, root_dir / ".pydeps_runtime", root_dir / ".pydeps"]:
        if candidate.exists():
            candidate_str = str(candidate)
            if candidate_str not in sys.path:
                candidates.append(candidate_str)
    sys.path[:0] = candidates


_bootstrap_python_path()

from app.config import settings
from app.services.ai_service import AIService
from app.services.d1_client import D1Client
from app.services.directed_digest import (
    extract_provider_text,
    fetch_url_excerpt,
    parse_model_json_payload,
)


def _json_dumps(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


def _json_loads(value: str | None) -> dict[str, Any]:
    if not value:
        return {}
    try:
        payload = json.loads(value)
    except json.JSONDecodeError:
        return {}
    return payload if isinstance(payload, dict) else {}


def _extract_token_usage(result: dict[str, Any]) -> int | None:
    usage = result.get("usage")
    if isinstance(usage, dict):
        for key in ("total_tokens", "totalTokenCount"):
            if usage.get(key) is not None:
                return int(usage[key])
        input_tokens = usage.get("input_tokens")
        output_tokens = usage.get("output_tokens")
        if input_tokens is not None or output_tokens is not None:
            return int(input_tokens or 0) + int(output_tokens or 0)
    return None


def _is_debug_fallback_enabled(args) -> bool:
    if getattr(args, "debug_fallback", False):
        return True
    return str(getattr(settings, "AI_DIGEST_DEBUG_FALLBACK", "") or "").strip().lower() in {"1", "true", "yes", "on"}


def _build_debug_summary_payload(source_payload: dict[str, Any], prompt_version: str) -> dict[str, Any]:
    title = str(source_payload.get("title") or "未命名条目").strip()
    summary = str(source_payload.get("summary") or "").strip()
    source_name = str(source_payload.get("source_name") or "未知来源").strip()
    url = str(source_payload.get("url") or "").strip()

    summary_title = f"调试摘要｜{title[:12]}".strip()
    summary_text = (
        f"当前为阶段十六本地调试生成结果：来自 {source_name} 的条目“{title}”"
        f"{'，原始摘要为：' + summary[:80] if summary else '，原始摘要不足，暂按标题与来源保留最小信息。'}"
    )

    key_points = [f"来源：{source_name}", f"标题：{title}"]
    if summary:
        key_points.append(f"原始摘要：{summary[:80]}")
    if url:
        key_points.append(f"原文：{url}")

    return {
        "summary_title": summary_title[:18],
        "summary_text": summary_text[:160],
        "key_points": key_points[:4],
        "impact_level": "medium",
        "impact_reason": "本条结果由 debug fallback 生成，仅用于阶段十六联调验证。",
        "tags": list(source_payload.get("raw_tags") or [])[:4],
        "risk_flags": ["debug_fallback"],
        "citations": [{"title": source_name or "原始来源", "url": url}] if url else [],
        "debug_meta": {
            "mode": "summary_debug_fallback",
            "prompt_version": prompt_version,
        },
    }


def _resolve_task_provider_config(client: D1Client, user_id: int) -> tuple[dict[str, str], str]:
    rows = client.query(
        """
        SELECT ai_provider, ai_api_key
        FROM user_settings
        WHERE user_id = ?
        LIMIT 1
        """,
        [user_id],
    )

    if rows:
        provider_name = str(rows[0].get("ai_provider") or "").strip().lower()
        if provider_name:
            return (
                settings.get_provider_config(
                    provider_name,
                    api_key_override=str(rows[0].get("ai_api_key") or "").strip(),
                ),
                "user",
            )

    return settings.get_active_provider_config(), "env"


def _list_summary_tasks(
    client: D1Client,
    *,
    profile_id: str | None,
    statuses: list[str],
    limit: int
) -> list[dict[str, Any]]:
    if not statuses:
        return []

    status_placeholders = ', '.join(['?'] * len(statuses))
    sql = f"""
        SELECT
            t.id,
            t.user_id,
            t.content_type,
            t.content_id,
            t.source_url,
            t.title,
            t.summary_kind,
            t.result_ref,
            r.profile_id,
            r.prompt_version,
            r.source_payload_json
        FROM summary_generation_tasks t
        INNER JOIN summary_generation_results r ON r.task_id = t.id
        WHERE t.status IN ({status_placeholders})
    """
    params: list[Any] = list(statuses)
    if profile_id:
        sql += " AND r.profile_id = ?"
        params.append(profile_id)
    sql += " ORDER BY datetime(t.requested_at) ASC, t.id ASC LIMIT ?"
    params.append(limit)
    return client.query(sql, params)


def _mark_task_running(client: D1Client, task_id: int) -> None:
    client.execute(
        """
        UPDATE summary_generation_tasks
        SET status = 'running', started_at = datetime('now'), updated_at = datetime('now'), error_message = NULL
        WHERE id = ?
        """,
        [task_id],
    )


def _mark_task_finished(client: D1Client, task_id: int, *, status: str, error_message: str | None = None) -> None:
    client.execute(
        """
        UPDATE summary_generation_tasks
        SET status = ?, finished_at = datetime('now'), updated_at = datetime('now'), error_message = ?
        WHERE id = ?
        """,
        [status, error_message, task_id],
    )


def _record_ai_processing_run(
    client: D1Client,
    *,
    task_type: str,
    content_type: str | None,
    content_id: int | None,
    status: str,
    tokens_used: int | None,
    error_message: str | None,
    result_ref: str | None,
) -> None:
    client.execute(
        """
        INSERT INTO ai_processing_runs (
            task_type, content_type, content_id, status, attempt, tokens_used, error_message, result_ref, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, datetime('now'), datetime('now'))
        """,
        [task_type, content_type, content_id, status, tokens_used, error_message, result_ref],
    )


def _update_summary_result(
    client: D1Client,
    *,
    task_id: int,
    provider_name: str,
    model_name: str,
    prompt_version: str,
    source_payload: dict[str, Any],
    model_payload: dict[str, Any],
    raw_response: dict[str, Any],
) -> None:
    citations = model_payload.get("citations")
    if not citations:
        citations = [{"title": source_payload.get("title") or "原始来源", "url": source_payload.get("url")}]

    consult_context = {
        "source_name": source_payload.get("source_name"),
        "title": source_payload.get("title"),
        "summary": source_payload.get("summary"),
        "url": source_payload.get("url"),
        "published_at": source_payload.get("published_at"),
        "score_breakdown": source_payload.get("score_breakdown"),
        "total_score": source_payload.get("total_score"),
        "key_points": model_payload.get("key_points", []),
    }

    client.execute(
        """
        UPDATE summary_generation_results
        SET provider_name = ?, model_name = ?, prompt_version = ?, source_payload_json = ?,
            summary_title = ?, summary_text = ?, key_points_json = ?, risk_flags_json = ?,
            consult_context_json = ?, citations_json = ?, raw_response_json = ?, updated_at = datetime('now')
        WHERE task_id = ?
        """,
        [
            provider_name,
            model_name,
            prompt_version,
            _json_dumps(source_payload),
            model_payload.get("summary_title"),
            model_payload.get("summary_text"),
            _json_dumps(model_payload.get("key_points", [])),
            _json_dumps(model_payload.get("risk_flags", [])),
            _json_dumps(consult_context),
            _json_dumps(citations),
            _json_dumps(raw_response),
            task_id,
        ],
    )


def _build_summary_messages(source_payload: dict[str, Any], content_excerpt: str, prompt_version: str) -> list[dict[str, str]]:
    return [
        {
            "role": "system",
            "content": (
                "你是“每日人工智能重点信息”整理助手。\n"
                "你只能依据提供材料输出结构化 JSON，不得编造事实。\n"
                "重点关注：模型发布、产品更新、API 变化、Agent、工程工具链、安全、价格、研究突破。\n"
                "若材料不足，请明确标注信息不足，但仍返回 JSON。"
            ),
        },
        {
            "role": "user",
            "content": (
                "请基于以下材料生成一条信息卡。\n\n"
                f"【prompt_version】\n{prompt_version}\n\n"
                f"【来源】\n{source_payload.get('source_name')}\n\n"
                f"【标题】\n{source_payload.get('title')}\n\n"
                f"【发布时间】\n{source_payload.get('published_at')}\n\n"
                f"【链接】\n{source_payload.get('url')}\n\n"
                f"【原始摘要】\n{source_payload.get('summary')}\n\n"
                f"【正文摘录】\n{content_excerpt or '无可用正文摘录，请基于标题与原始摘要谨慎总结。'}\n\n"
                "【输出格式】\n"
                "{\n"
                '  "summary_title": "不超过18字的摘要标题",\n'
                '  "summary_text": "80-140字的中文摘要，必须说明发生了什么、为什么值得关注",\n'
                '  "key_points": ["3-5条要点"],\n'
                '  "impact_level": "high | medium | low",\n'
                '  "impact_reason": "为什么是这个等级",\n'
                '  "tags": ["标签1", "标签2"],\n'
                '  "risk_flags": ["如果没有则返回空数组"],\n'
                '  "citations": [{"title": "引用标题", "url": "引用链接"}]\n'
                "}\n"
            ),
        },
    ]


async def _process_task(
    client: D1Client,
    ai_service: AIService,
    task: dict[str, Any],
    *,
    provider_config: dict[str, str],
) -> dict[str, Any]:
    task_id = int(task["id"])
    source_payload = _json_loads(task.get("source_payload_json"))
    prompt_version = str(task.get("prompt_version") or "ai-daily-v1")
    source_url = str(task.get("source_url") or source_payload.get("url") or "").strip()
    summary_fallback = str(source_payload.get("summary") or "").strip()

    _mark_task_running(client, task_id)
    try:
        excerpt = await fetch_url_excerpt(source_url, limit=5000) if source_url else ""
        if not excerpt:
            excerpt = summary_fallback

        ai_service.switch_provider(
            str(provider_config["provider"]),
            str(provider_config["api_key"]),
            str(provider_config["api_url"]),
            str(provider_config["model"]),
        )

        raw_response = await ai_service.chat(
            _build_summary_messages(source_payload, excerpt, prompt_version),
            max_tokens=900,
            temperature=0.2,
        )
        response_text = extract_provider_text(raw_response)
        model_payload = parse_model_json_payload(response_text)

        _update_summary_result(
            client,
            task_id=task_id,
            provider_name=str(provider_config["provider"]),
            model_name=str(provider_config["model"]),
            prompt_version=prompt_version,
            source_payload=source_payload,
            model_payload=model_payload,
            raw_response=raw_response,
        )
        _record_ai_processing_run(
            client,
            task_type="summary_generation",
            content_type=str(task.get("content_type") or "external_item"),
            content_id=task.get("content_id"),
            status="succeeded",
            tokens_used=_extract_token_usage(raw_response),
            error_message=None,
            result_ref=str(task.get("result_ref") or ""),
        )
        _mark_task_finished(client, task_id, status="succeeded")
        return {
            "task_id": task_id,
            "status": "succeeded",
            "result_ref": task.get("result_ref"),
            "summary_title": model_payload.get("summary_title"),
        }
    except Exception as error:
        _record_ai_processing_run(
            client,
            task_type="summary_generation",
            content_type=str(task.get("content_type") or "external_item"),
            content_id=task.get("content_id"),
            status="failed",
            tokens_used=None,
            error_message=str(error),
            result_ref=str(task.get("result_ref") or ""),
        )
        _mark_task_finished(client, task_id, status="failed", error_message=str(error))
        return {
            "task_id": task_id,
            "status": "failed",
            "result_ref": task.get("result_ref"),
            "error": str(error),
        }


async def _process_task_with_fallback(
    client: D1Client,
    ai_service: AIService,
    task: dict[str, Any],
    *,
    debug_fallback: bool,
) -> dict[str, Any]:
    provider_config, _source = _resolve_task_provider_config(client, int(task["user_id"]))
    provider_name = str(provider_config.get("provider") or "").strip()
    model_name = str(provider_config.get("model") or "").strip()
    api_key = str(provider_config.get("api_key") or "").strip()

    if provider_name == "local" or api_key:
        return await _process_task(
            client,
            ai_service,
            task,
            provider_config=provider_config,
        )

    if not debug_fallback:
        error_message = (
            f"当前任务 user_id={task['user_id']} 选择的 provider={provider_name} 未配置 API key，且未启用 debug fallback。"
        )
        _record_ai_processing_run(
            client,
            task_type="summary_generation",
            content_type=str(task.get("content_type") or "external_item"),
            content_id=task.get("content_id"),
            status="failed",
            tokens_used=0,
            error_message=error_message,
            result_ref=str(task.get("result_ref") or ""),
        )
        _mark_task_finished(client, int(task["id"]), status="failed", error_message=error_message)
        return {
            "task_id": int(task["id"]),
            "status": "failed",
            "result_ref": task.get("result_ref"),
            "error": error_message,
        }

    task_id = int(task["id"])
    source_payload = _json_loads(task.get("source_payload_json"))
    prompt_version = str(task.get("prompt_version") or "ai-daily-v1")

    _mark_task_running(client, task_id)
    try:
        model_payload = _build_debug_summary_payload(source_payload, prompt_version)
        raw_response = {
            "mode": "summary_debug_fallback",
            "task_id": task_id,
            "result_ref": task.get("result_ref"),
        }
        _update_summary_result(
            client,
            task_id=task_id,
            provider_name="debug-fallback",
            model_name="rule-based",
            prompt_version=prompt_version,
            source_payload=source_payload,
            model_payload=model_payload,
            raw_response=raw_response,
        )
        _record_ai_processing_run(
            client,
            task_type="summary_generation",
            content_type=str(task.get("content_type") or "external_item"),
            content_id=task.get("content_id"),
            status="succeeded",
            tokens_used=0,
            error_message=None,
            result_ref=str(task.get("result_ref") or ""),
        )
        _mark_task_finished(client, task_id, status="succeeded")
        return {
            "task_id": task_id,
            "status": "succeeded",
            "result_ref": task.get("result_ref"),
            "summary_title": model_payload.get("summary_title"),
            "mode": "debug-fallback",
        }
    except Exception as error:
        _record_ai_processing_run(
            client,
            task_type="summary_generation",
            content_type=str(task.get("content_type") or "external_item"),
            content_id=task.get("content_id"),
            status="failed",
            tokens_used=0,
            error_message=str(error),
            result_ref=str(task.get("result_ref") or ""),
        )
        _mark_task_finished(client, task_id, status="failed", error_message=str(error))
        return {
            "task_id": task_id,
            "status": "failed",
            "result_ref": task.get("result_ref"),
            "error": str(error),
            "mode": "debug-fallback",
        }


async def main() -> None:
    parser = argparse.ArgumentParser(description="Consume queued summary tasks and generate digest summaries.")
    parser.add_argument("--profile", default="ai-daily", help="Profile id to consume. Defaults to ai-daily.")
    parser.add_argument("--limit", type=int, default=5, help="Max queued tasks to consume.")
    parser.add_argument(
        "--include-failed",
        action="store_true",
        help="Include failed summary tasks in this execution batch so they can be retried after provider/config fixes.",
    )
    parser.add_argument(
        "--debug-fallback",
        action="store_true",
        help="Allow local debug fallback generation when the configured cloud provider key is missing. Results are explicitly marked as debug-fallback.",
    )
    args = parser.parse_args()

    client = D1Client()
    ai_service = AIService()
    debug_fallback = _is_debug_fallback_enabled(args)
    statuses = ['queued', 'failed'] if args.include_failed else ['queued']
    queued_tasks = _list_summary_tasks(client, profile_id=args.profile, statuses=statuses, limit=max(args.limit, 1))

    results: list[dict[str, Any]] = []
    for task in queued_tasks:
        results.append(
            await _process_task_with_fallback(
                client,
                ai_service,
                task,
                debug_fallback=debug_fallback,
            )
        )

    print(
        _json_dumps(
            {
                "success": True,
                "profile_id": args.profile,
                "debug_fallback": debug_fallback,
                "statuses": statuses,
                "processed": len(results),
                "items": results,
                "generated_at": datetime.now(UTC).isoformat(),
            }
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
