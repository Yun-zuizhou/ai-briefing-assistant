from __future__ import annotations

import argparse
import asyncio
import json
import sys
from datetime import UTC, datetime
from pathlib import Path


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
from app.services.d1_client import D1Client
from app.services.directed_digest import (
    build_collection_manifest,
    build_result_ref,
    collect_profile_candidates,
    load_collection_profile,
    score_profile_candidates,
    select_summary_candidates,
)
from app.services.interest_template_mapping import (
    DEFAULT_MAPPING_FILE,
    load_interest_template_mapping,
    resolve_templates_for_interests,
)


ROOT = Path(__file__).resolve().parents[2]
MANIFEST_DIR = ROOT / "var" / "tmp" / "directed-collection"


def _json_dumps(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


def _resolve_user_id(client: D1Client, *, user_email: str | None, user_id: int | None) -> int:
    if user_id is not None:
        return int(user_id)
    if user_email:
        row = client.query(
            "SELECT id FROM users WHERE lower(email) = lower(?) LIMIT 1",
            [user_email],
        )
        if row:
            return int(row[0]["id"])
        raise RuntimeError(f"未找到目标用户邮箱：{user_email}")
    raise RuntimeError("必须提供 user_id 或 user_email")


def _load_active_interest_names(client: D1Client, user_id: int) -> list[str]:
    rows = client.query(
        """
        SELECT interest_name
        FROM user_interests
        WHERE user_id = ? AND lower(status) = 'active'
        ORDER BY id ASC
        """,
        [user_id],
    )
    return [str(row.get("interest_name") or "").strip() for row in rows if str(row.get("interest_name") or "").strip()]


def _resolve_user_provider_config(client: D1Client, user_id: int) -> dict[str, str]:
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
            return settings.get_provider_config(
                provider_name,
                api_key_override=str(rows[0].get("ai_api_key") or "").strip(),
            )
    return settings.get_active_provider_config()


def _create_ingestion_run(client: D1Client, *, profile_id: str) -> int:
    result = client.execute(
        """
        INSERT INTO ingestion_runs (
            pipeline_name, status, started_at, created_at
        )
        VALUES (?, 'running', datetime('now'), datetime('now'))
        """,
        [f"directed_collection:{profile_id}"],
    )
    return int(result.get("meta", {}).get("last_row_id") or 0)


def _finish_ingestion_run(
    client: D1Client,
    run_id: int,
    *,
    status: str,
    stats: dict[str, object],
    error_message: str | None = None,
) -> None:
    client.execute(
        """
        UPDATE ingestion_runs
        SET status = ?, finished_at = datetime('now'), stats_json = ?, error_message = ?
        WHERE id = ?
        """,
        [status, _json_dumps(stats), error_message, run_id],
    )


def _find_existing_task_id(client: D1Client, result_ref: str) -> int | None:
    rows = client.query(
        """
        SELECT id, status
        FROM summary_generation_tasks
        WHERE result_ref = ?
        ORDER BY id DESC
        LIMIT 1
        """,
        [result_ref],
    )
    if not rows:
        return None
    return int(rows[0]["id"])


def _create_summary_task(
    client: D1Client,
    *,
    profile_id: str,
    prompt_version: str,
    user_id: int,
    provider_name: str,
    model_name: str,
    candidate_payload: dict[str, object],
) -> tuple[int | None, bool]:
    result_ref = str(candidate_payload["result_ref"])
    existing_id = _find_existing_task_id(client, result_ref)
    if existing_id is not None:
        return existing_id, False

    task_insert = client.execute(
        """
        INSERT INTO summary_generation_tasks (
            user_id, content_type, content_id, source_url, title, summary_kind,
            status, provider_name, model_name, result_ref, error_message, requested_at, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'queued', ?, ?, ?, NULL, datetime('now'), datetime('now'), datetime('now'))
        """,
        [
            user_id,
            "external_item",
            None,
            candidate_payload.get("url"),
            candidate_payload.get("title"),
            "daily_digest",
            provider_name,
            model_name,
            result_ref,
        ],
    )
    task_id = int(task_insert.get("meta", {}).get("last_row_id") or 0)

    client.execute(
        """
        INSERT INTO summary_generation_results (
            task_id, user_id, content_type, content_id, source_url, result_ref, profile_id,
            provider_name, model_name, prompt_version, source_payload_json, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """,
        [
            task_id,
            user_id,
            "external_item",
            None,
            candidate_payload.get("url"),
            result_ref,
            profile_id,
            provider_name,
            model_name,
            prompt_version,
            _json_dumps(candidate_payload),
        ],
    )

    return task_id, True


async def _run_profile_collection(
    client: D1Client,
    *,
    profile_name: str,
    user_id: int,
    provider_config: dict[str, str],
    mapping_context: dict[str, object] | None = None,
) -> dict[str, object]:
    profile = load_collection_profile(profile_name)
    run_id = _create_ingestion_run(client, profile_id=profile.profile_id)

    try:
        raw_candidates, errors = await collect_profile_candidates(profile, d1_client=client)
        scored_candidates = score_profile_candidates(profile, raw_candidates)
        summary_candidates = select_summary_candidates(profile, scored_candidates)

        MANIFEST_DIR.mkdir(parents=True, exist_ok=True)
        manifest = build_collection_manifest(profile, scored_candidates)
        manifest_path = MANIFEST_DIR / f"{profile.profile_id}.latest.json"
        manifest_path.write_text(_json_dumps(manifest) + "\n", encoding="utf-8")

        created_task_ids: list[int] = []
        skipped_existing = 0
        for candidate in summary_candidates:
            candidate_payload = {
                "candidate_id": candidate.candidate_id,
                "profile_id": profile.profile_id,
                "source_id": candidate.source_id,
                "source_name": candidate.source_name,
                "source_type": candidate.source_type,
                "title": candidate.title,
                "summary": candidate.summary,
                "url": candidate.url,
                "published_at": candidate.published_at,
                "raw_tags": candidate.raw_tags,
                "score_breakdown": candidate.score_breakdown,
                "total_score": candidate.total_score,
                "result_ref": build_result_ref(profile, candidate),
            }
            task_id, created = _create_summary_task(
                client,
                profile_id=profile.profile_id,
                prompt_version=profile.prompt_version,
                user_id=user_id,
                provider_name=str(provider_config["provider"]),
                model_name=str(provider_config["model"]),
                candidate_payload=candidate_payload,
            )
            if created and task_id:
                created_task_ids.append(task_id)
            else:
                skipped_existing += 1

        stats = {
            "profile_id": profile.profile_id,
            "total_sources": len([item for item in profile.sources if item.enabled]),
            "raw_candidates": len(raw_candidates),
            "scored_candidates": len(scored_candidates),
            "summary_candidates": len(summary_candidates),
            "created_tasks": len(created_task_ids),
            "skipped_existing_tasks": skipped_existing,
            "errors": errors,
            "manifest_path": str(manifest_path),
            "user_id": user_id,
            "provider_name": provider_config["provider"],
            "model_name": provider_config["model"],
            "mapping_context": mapping_context or {},
            "generated_at": datetime.now(UTC).isoformat(),
        }
        _finish_ingestion_run(client, run_id, status="done", stats=stats)
        return {
            "success": True,
            "run_id": run_id,
            "stats": stats,
        }
    except Exception as error:
        stats = {
            "profile_id": profile.profile_id,
            "mapping_context": mapping_context or {},
            "generated_at": datetime.now(UTC).isoformat(),
        }
        _finish_ingestion_run(client, run_id, status="failed", stats=stats, error_message=str(error))
        raise


def _resolve_profile_names(
    client: D1Client,
    *,
    explicit_profile: str | None,
    from_user_interests: bool,
    mapping_file: str | None,
    user_id: int,
    all_matched_templates: bool,
) -> tuple[list[str], dict[str, object]]:
    if not from_user_interests:
        profile_name = explicit_profile or "ai-daily"
        return [profile_name], {"mode": "explicit_profile", "profile": profile_name}

    interest_names = _load_active_interest_names(client, user_id)
    if not interest_names:
        raise RuntimeError("当前用户没有 active interest，无法从关注自动解析内部模板。")

    mapping = load_interest_template_mapping(mapping_file or DEFAULT_MAPPING_FILE)
    resolutions, unmatched_interests = resolve_templates_for_interests(interest_names, mapping)
    if not resolutions:
        raise RuntimeError("当前用户关注项尚未命中任何内部模板映射规则。")

    selected_resolutions = resolutions if all_matched_templates else resolutions[:1]
    profile_names = [item.template_id for item in selected_resolutions]
    return profile_names, {
        "mode": "from_user_interests",
        "interest_names": interest_names,
        "unmatched_interests": unmatched_interests,
        "selected_templates": [
            {
                "template_id": item.template_id,
                "score": item.score,
                "matched_interests": item.matched_interests,
                "matched_keywords": item.matched_keywords,
                "reasons": item.reasons,
            }
            for item in selected_resolutions
        ],
    }


async def main() -> None:
    parser = argparse.ArgumentParser(description="Run directed AI daily collection and create summary tasks.")
    parser.add_argument("--profile", default="ai-daily", help="Collection profile name or full path.")
    parser.add_argument("--user-email", default="test@example.com", help="Target user email for created summary tasks.")
    parser.add_argument("--user-id", type=int, default=None, help="Target user id. Overrides --user-email when provided.")
    parser.add_argument(
        "--from-user-interests",
        action="store_true",
        help="Resolve internal templates from the target user's active interests instead of forcing a single explicit profile.",
    )
    parser.add_argument(
        "--all-matched-templates",
        action="store_true",
        help="When --from-user-interests is enabled, run collection for all matched internal templates instead of only the top one.",
    )
    parser.add_argument(
        "--mapping-file",
        default="",
        help="Optional full path to an interest -> template mapping file. Defaults to tools/config/collection_profiles/interest_template_mapping.json",
    )
    args = parser.parse_args()

    client = D1Client()
    user_id = _resolve_user_id(client, user_email=args.user_email, user_id=args.user_id)
    provider_config = _resolve_user_provider_config(client, user_id)
    profile_names, resolution_context = _resolve_profile_names(
        client,
        explicit_profile=args.profile,
        from_user_interests=args.from_user_interests,
        mapping_file=args.mapping_file or None,
        user_id=user_id,
        all_matched_templates=args.all_matched_templates,
    )

    results: list[dict[str, object]] = []
    for profile_name in profile_names:
        mapping_context = {
            **resolution_context,
            "resolved_profile": profile_name,
        }
        result = await _run_profile_collection(
            client,
            profile_name=profile_name,
            user_id=user_id,
            provider_config=provider_config,
            mapping_context=mapping_context,
        )
        results.append(result)

    print(
        _json_dumps(
            {
                "success": True,
                "user_id": user_id,
                "profiles": profile_names,
                "resolution_context": resolution_context,
                "results": results,
            }
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
