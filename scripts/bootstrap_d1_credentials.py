from __future__ import annotations

import argparse
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
ENV_FILE = ROOT / ".env"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.services.d1_client import resolve_d1_config


def load_env_lines(path: Path) -> list[str]:
    if not path.exists():
        return []
    return path.read_text(encoding="utf-8").splitlines()


def upsert_key(lines: list[str], key: str, value: str) -> list[str]:
    target = f"{key}="
    updated = False
    result: list[str] = []
    for line in lines:
        if line.startswith(target):
            result.append(f"{key}={value}")
            updated = True
        else:
            result.append(line)
    if not updated:
        result.append(f"{key}={value}")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Bootstrap stable D1 credentials into .env using local Cloudflare metadata."
    )
    parser.add_argument("--api-token", default="", help="Cloudflare API token to persist into .env")
    parser.add_argument(
        "--use-cloud-source",
        choices=("true", "false"),
        default="false",
        help="Whether to set D1_USE_CLOUD_AS_SOURCE in .env",
    )
    args = parser.parse_args()

    resolved = resolve_d1_config()
    token = args.api_token.strip() or resolved["api_token"]

    lines = load_env_lines(ENV_FILE)
    lines = upsert_key(lines, "D1_DATABASE_ID", resolved["database_id"])
    lines = upsert_key(lines, "D1_ACCOUNT_ID", resolved["account_id"])
    lines = upsert_key(lines, "D1_USE_CLOUD_AS_SOURCE", args.use_cloud_source)

    if token:
        lines = upsert_key(lines, "D1_API_TOKEN", token)

    ENV_FILE.write_text("\n".join(lines) + "\n", encoding="utf-8")

    print("Updated .env with stable D1 configuration:")
    print(f"  D1_DATABASE_ID={'set' if resolved['database_id'] else 'missing'}")
    print(f"  D1_ACCOUNT_ID={'set' if resolved['account_id'] else 'missing'}")
    print(f"  D1_API_TOKEN={'set' if token else 'missing'}")
    print(f"  D1_USE_CLOUD_AS_SOURCE={args.use_cloud_source}")


if __name__ == "__main__":
    main()
