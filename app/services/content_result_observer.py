from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from threading import Lock


@dataclass(frozen=True)
class ContentResultObservationSnapshot:
    total_events: int
    by_source: dict[str, int]
    by_version: dict[str, int]


class ContentResultObserver:
    def __init__(self) -> None:
        self._lock = Lock()
        self._by_source: Counter[str] = Counter()
        self._by_version: Counter[str] = Counter()

    def record(self, *, source: str, processing_version: str) -> None:
        with self._lock:
            self._by_source[source] += 1
            self._by_version[processing_version] += 1

    def snapshot(self) -> ContentResultObservationSnapshot:
        with self._lock:
            by_source = dict(self._by_source)
            by_version = dict(self._by_version)
        return ContentResultObservationSnapshot(
            total_events=sum(by_source.values()),
            by_source=by_source,
            by_version=by_version,
        )

    def reset(self) -> None:
        with self._lock:
            self._by_source.clear()
            self._by_version.clear()


content_result_observer = ContentResultObserver()
