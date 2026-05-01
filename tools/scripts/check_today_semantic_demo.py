from __future__ import annotations

import json
import sqlite3
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
LOCAL_D1_ROOT = ROOT / "apps" / "edge-worker" / ".wrangler" / "state" / "v3" / "d1"
EXPECTED_INTERESTS = ["AI应用", "远程工作", "写作素材", "数据自动化"]
EXPECTED_TOPIC_IDS = [9101, 9102, 9103, 9104, 9105, 9106]
EXPECTED_OPPORTUNITY_IDS = [9201, 9202, 9203]
CONTENT_REF_TABLES = {
    "article": "articles",
    "hot_topic": "hot_topics",
    "opportunity": "opportunities",
}
STRICT_PAYLOAD_DATE = "2026-05-01"


class CheckFailure(RuntimeError):
    pass


def find_local_d1() -> Path:
    candidates = sorted(LOCAL_D1_ROOT.rglob("*.sqlite"))
    for db_path in candidates:
        connection = sqlite3.connect(db_path)
        try:
            row = connection.execute(
                "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'briefings'"
            ).fetchone()
            if row and int(row[0]) > 0:
                return db_path
        finally:
            connection.close()
    raise CheckFailure("No local D1 sqlite database with a briefings table was found.")


def fetch_all(connection: sqlite3.Connection, sql: str, params: tuple[object, ...] = ()) -> list[sqlite3.Row]:
    return list(connection.execute(sql, params).fetchall())


def assert_equal(actual: object, expected: object, message: str) -> None:
    if actual != expected:
        raise CheckFailure(f"{message}: expected {expected!r}, got {actual!r}")


def parse_content_ref(value: object, context: str) -> tuple[str, int]:
    if not isinstance(value, str):
        raise CheckFailure(f"{context} contentRef must be a string.")
    parts = value.strip().split(":")
    if len(parts) != 2:
        raise CheckFailure(f"{context} contentRef format must be type:id, got {value!r}.")
    ref_type, id_text = parts
    if ref_type not in CONTENT_REF_TABLES:
        raise CheckFailure(
            f"{context} contentRef type must be one of {', '.join(CONTENT_REF_TABLES)}, got {ref_type!r}."
        )
    if not id_text.isdigit() or int(id_text) <= 0:
        raise CheckFailure(f"{context} contentRef id must be a positive integer, got {value!r}.")
    return ref_type, int(id_text)


def content_ref_exists(connection: sqlite3.Connection, ref_type: str, ref_id: int) -> bool:
    table_name = CONTENT_REF_TABLES[ref_type]
    row = connection.execute(
        f"SELECT 1 FROM {table_name} WHERE id = ? LIMIT 1",
        (ref_id,),
    ).fetchone()
    return row is not None


def collect_payload_contract_issues(
    connection: sqlite3.Connection,
    row: sqlite3.Row,
    payload: dict[str, object],
) -> list[str]:
    issues: list[str] = []

    def validate_content_ref(value: object, context: str) -> str | None:
        try:
            ref_type, ref_id = parse_content_ref(value, context)
        except CheckFailure as error:
            issues.append(str(error))
            return None
        if not content_ref_exists(connection, ref_type, ref_id):
            issues.append(f"{context} contentRef {value!r} points to missing {ref_type} row.")
        return ref_type

    lead_item = payload.get("leadItem")
    if isinstance(lead_item, dict):
        lead_ref = lead_item.get("contentRef")
        lead_type = lead_item.get("itemType")
        if lead_ref:
            try:
                expected_type = validate_content_ref(lead_ref, "leadItem")
                if expected_type and lead_type != expected_type:
                    issues.append(
                        f"leadItem itemType {lead_type!r} must match contentRef type {expected_type!r}."
                    )
            except Exception as error:
                issues.append(str(error))
        elif lead_type not in (None, "briefing"):
            issues.append(f"leadItem without contentRef must be briefing, got {lead_type!r}.")

    ai_briefing = payload.get("aiBriefing")
    clusters = ai_briefing.get("topicClusters") if isinstance(ai_briefing, dict) else []
    if isinstance(clusters, list):
        for cluster_index, cluster in enumerate(clusters):
            if not isinstance(cluster, dict):
                continue
            refs = cluster.get("sourceRefs")
            if not isinstance(refs, list):
                continue
            for ref_index, ref in enumerate(refs):
                if isinstance(ref, dict) and ref.get("contentRef"):
                    validate_content_ref(
                        ref.get("contentRef"),
                        f"aiBriefing.topicClusters[{cluster_index}].sourceRefs[{ref_index}]",
                    )

    extension_slots = payload.get("extensionSlots")
    if isinstance(extension_slots, list):
        for slot_index, slot in enumerate(extension_slots):
            if isinstance(slot, dict) and slot.get("sourceContentRef"):
                validate_content_ref(slot.get("sourceContentRef"), f"extensionSlots[{slot_index}]")

    return [
        f"briefing id={row['id']} date={row['briefing_date']}: {issue}"
        for issue in issues
    ]


def check_ready_briefing_payload_contracts(connection: sqlite3.Connection) -> list[str]:
    warnings: list[str] = []
    strict_failures: list[str] = []
    rows = fetch_all(
        connection,
        """
          SELECT id, briefing_date, payload
          FROM briefings
          WHERE payload IS NOT NULL
            AND lower(status) = 'ready'
          ORDER BY briefing_date ASC, id ASC
        """,
    )

    for row in rows:
        try:
            payload = json.loads(str(row["payload"]))
        except json.JSONDecodeError as error:
            message = f"briefing id={row['id']} date={row['briefing_date']}: payload JSON is invalid: {error}"
            if str(row["briefing_date"]) >= STRICT_PAYLOAD_DATE:
                strict_failures.append(message)
            else:
                warnings.append(message)
            continue
        if not isinstance(payload, dict):
            continue
        issues = collect_payload_contract_issues(connection, row, payload)
        if str(row["briefing_date"]) >= STRICT_PAYLOAD_DATE:
            strict_failures.extend(issues)
        else:
            warnings.extend(issues)

    if strict_failures:
        raise CheckFailure("Ready briefing payload contract failed:\n- " + "\n- ".join(strict_failures))

    return warnings


def main() -> None:
    db_path = find_local_d1()
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    try:
        interests = [
            row["interest_name"]
            for row in fetch_all(
                connection,
                """
                  SELECT interest_name
                  FROM user_interests
                  WHERE user_id = 1 AND lower(status) = 'active'
                  ORDER BY id ASC
                """,
            )
        ]
        assert_equal(interests, EXPECTED_INTERESTS, "Active demo interests must match the semantic demo exactly")

        match_cases = " ".join(
            [
                "WHEN title LIKE ? OR COALESCE(summary, '') LIKE ? OR categories LIKE ? OR tags LIKE ? THEN 1"
                for _ in EXPECTED_INTERESTS
            ]
        )
        match_params = [
            pattern
            for interest in EXPECTED_INTERESTS
            for pattern in [f"%{interest}%", f"%{interest}%", f"%{interest}%", f"%{interest}%"]
        ]
        top_topic_ids = [
            int(row["id"])
            for row in fetch_all(
                connection,
                f"""
                  SELECT
                    id,
                    CASE {match_cases} ELSE 0 END AS match_score,
                    (
                      CASE {match_cases} ELSE 0 END * 1000
                      + quality_score * 100
                      + hot_value * 0.1
                    ) AS ranking_score
                  FROM hot_topics
                  ORDER BY match_score DESC, ranking_score DESC, datetime(published_at) DESC, id DESC
                  LIMIT 6
                """,
                tuple(match_params + match_params),
            )
        ]
        assert_equal(
            top_topic_ids,
            EXPECTED_TOPIC_IDS,
            "Today hot topic candidate ordering is not using the semantic demo topics first",
        )

        processed_count = fetch_all(
            connection,
            """
              SELECT COUNT(*) AS count
              FROM hot_topic_processing_results
              WHERE source_hot_topic_id IN (9101, 9102, 9103, 9104, 9105, 9106)
                AND processing_version = 'briefing-semantic-demo-v1'
                AND is_stale = 0
            """,
        )[0]["count"]
        assert_equal(int(processed_count), 6, "Demo topic processing result count mismatch")

        opportunity_ids = [
            int(row["id"])
            for row in fetch_all(
                connection,
                """
                  SELECT id
                  FROM opportunities
                  WHERE id IN (9201, 9202, 9203)
                    AND lower(status) = 'active'
                  ORDER BY quality_score DESC, deadline ASC
                """,
            )
        ]
        assert_equal(opportunity_ids, EXPECTED_OPPORTUNITY_IDS, "Demo opportunity ordering mismatch")

        briefing = fetch_all(
            connection,
            """
              SELECT title, summary_text, payload
              FROM briefings
              WHERE user_id = 1
                AND briefing_date = '2026-05-01'
                AND briefing_type = 'morning'
                AND lower(status) = 'ready'
              LIMIT 1
            """,
        )
        if not briefing:
            raise CheckFailure("Missing ready demo briefing for user_id=1 on 2026-05-01.")

        payload = json.loads(str(briefing[0]["payload"]))
        ai_briefing = payload.get("aiBriefing") or {}
        clusters = ai_briefing.get("topicClusters") or []
        if len(clusters) < 3:
            raise CheckFailure("Demo briefing payload must contain at least 3 AI topic clusters.")

        source_refs = {
            ref.get("contentRef")
            for cluster in clusters
            for ref in (cluster.get("sourceRefs") or [])
        }
        for expected_ref in ["hot_topic:9101", "hot_topic:9102", "hot_topic:9103", "hot_topic:9104"]:
            if expected_ref not in source_refs:
                raise CheckFailure(f"Missing demo AI source ref: {expected_ref}")

        lead_item = payload.get("leadItem") or {}
        assert_equal(lead_item.get("contentRef"), "hot_topic:9101", "Demo lead item contentRef mismatch")
        assert_equal(lead_item.get("itemType"), "hot_topic", "Demo lead item type must match contentRef")
        payload_warnings = check_ready_briefing_payload_contracts(connection)

        print("Today semantic demo check passed.")
        print(f"Local D1: {db_path.relative_to(ROOT)}")
        print(f"Active interests: {', '.join(interests)}")
        print(f"Semantic candidate topics: {', '.join(str(item) for item in top_topic_ids)}")
        print(f"Briefing title: {briefing[0]['title']}")
        if payload_warnings:
            print("Legacy briefing payload warnings:")
            for warning in payload_warnings:
                print(f"- {warning}")
    finally:
        connection.close()


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
