from __future__ import annotations

from datetime import UTC, date, datetime, timedelta


_LOCAL_TZ = datetime.now().astimezone().tzinfo or UTC


def parse_activity_date(value: str | datetime | None, *, assume_utc: bool) -> date | None:
    if value is None:
        return None

    if isinstance(value, datetime):
        dt = value
    else:
        text = str(value).strip()
        if not text:
            return None
        normalized = text.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(normalized)
        except ValueError:
            try:
                dt = datetime.fromisoformat(normalized.replace(" ", "T"))
            except ValueError:
                return None

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC if assume_utc else _LOCAL_TZ)
    return dt.astimezone(_LOCAL_TZ).date()


def calc_streak_from_timestamps(values: list[str | datetime | None], *, assume_utc: bool) -> int:
    available = {
        parsed
        for parsed in (
            parse_activity_date(value, assume_utc=assume_utc)
            for value in values
        )
        if parsed is not None
    }
    if not available:
        return 0

    streak = 0
    current = datetime.now(_LOCAL_TZ).date()
    while current in available:
        streak += 1
        current -= timedelta(days=1)
    return streak


def is_checked_in_today(values: list[str | datetime | None], *, assume_utc: bool) -> bool:
    today = datetime.now(_LOCAL_TZ).date()
    return any(
        parse_activity_date(value, assume_utc=assume_utc) == today
        for value in values
    )
