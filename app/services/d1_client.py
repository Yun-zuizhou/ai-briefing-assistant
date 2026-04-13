from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any

try:
    import tomllib
except ModuleNotFoundError:  # pragma: no cover
    tomllib = None

import httpx

from app.config import settings


class D1ClientError(RuntimeError):
    pass


ROOT = Path(__file__).resolve().parents[2]
WRANGLER_TOML = ROOT / "wrangler.toml"
WRANGLER_ACCOUNT_CACHE = ROOT / ".wrangler" / "cache" / "wrangler-account.json"


def _read_wrangler_database_id() -> str:
    if not WRANGLER_TOML.exists() or tomllib is None:
        return ""
    try:
        data = tomllib.loads(WRANGLER_TOML.read_text(encoding="utf-8"))
    except Exception:
        return ""

    databases = data.get("d1_databases")
    if isinstance(databases, list):
        for item in databases:
            if isinstance(item, dict):
                value = str(item.get("database_id") or "").strip()
                if value:
                    return value
    return ""


def _read_wrangler_account_id() -> str:
    if not WRANGLER_ACCOUNT_CACHE.exists():
        return ""
    try:
        payload = json.loads(WRANGLER_ACCOUNT_CACHE.read_text(encoding="utf-8"))
    except Exception:
        return ""
    account = payload.get("account")
    if not isinstance(account, dict):
        return ""
    return str(account.get("id") or "").strip()


def resolve_d1_config() -> dict[str, str]:
    account_id = (
        str(settings.D1_ACCOUNT_ID or "").strip()
        or _read_wrangler_account_id()
    )
    database_id = (
        str(settings.D1_DATABASE_ID or "").strip()
        or _read_wrangler_database_id()
    )
    api_token = (
        str(settings.D1_API_TOKEN or "").strip()
        or str(getattr(settings, "CLOUDFLARE_API_TOKEN", "") or "").strip()
    )
    return {
        "account_id": account_id,
        "database_id": database_id,
        "api_token": api_token,
    }


class D1Client:
    def __init__(self) -> None:
        resolved = resolve_d1_config()
        missing = [
            name
            for name, value in (
                ("D1_ACCOUNT_ID", resolved["account_id"]),
                ("D1_DATABASE_ID", resolved["database_id"]),
                ("D1_API_TOKEN", resolved["api_token"]),
            )
            if not value
        ]
        if missing:
            raise D1ClientError(f"D1 配置缺失：{', '.join(missing)}")

        self.base_url = (
            f"https://api.cloudflare.com/client/v4/accounts/{resolved['account_id']}"
            f"/d1/database/{resolved['database_id']}"
        )
        self.headers = {
            "Authorization": f"Bearer {resolved['api_token']}",
            "Content-Type": "application/json",
        }
        self.timeout = 8.0
        self.max_attempts = 1
        self._client = httpx.Client(timeout=self.timeout)

    def _unwrap(self, payload: dict[str, Any]) -> dict[str, Any]:
        if payload.get("success") is False:
            raise D1ClientError(str(payload.get("errors") or "D1 请求失败"))

        result = payload.get("result")
        if isinstance(result, list):
            if not result:
                return {"results": [], "meta": {}}
            result = result[0]
        if not isinstance(result, dict):
            raise D1ClientError("D1 返回格式无效")
        if result.get("success") is False:
            raise D1ClientError(str(result.get("error") or result.get("errors") or "D1 SQL 执行失败"))
        return result

    def query(self, sql: str, params: list[Any] | None = None) -> list[dict[str, Any]]:
        payload = {"sql": sql, "params": params or []}
        result = self._post_query(payload)
        rows = result.get("results") or []
        return rows if isinstance(rows, list) else []

    def execute(self, sql: str, params: list[Any] | None = None) -> dict[str, Any]:
        payload = {"sql": sql, "params": params or []}
        return self._post_query(payload)

    def _post_query(self, payload: dict[str, Any]) -> dict[str, Any]:
        last_error: Exception | None = None
        for attempt in range(1, self.max_attempts + 1):
            try:
                response = self._client.post(f"{self.base_url}/query", headers=self.headers, json=payload)
                try:
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    raise D1ClientError(f"D1 HTTP错误: {response.status_code} {response.text}") from exc
                return self._unwrap(response.json())
            except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.ConnectError) as exc:
                last_error = exc
                if attempt >= self.max_attempts:
                    break
                time.sleep(0.8 * attempt)
        raise D1ClientError(f"D1 网络请求失败，已重试 {self.max_attempts} 次: {last_error}")
