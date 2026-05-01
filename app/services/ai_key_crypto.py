from __future__ import annotations

import base64
import hashlib
import json
from typing import Any

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings


AI_API_KEY_ENCRYPTION_VERSION = "aes-gcm-v1"


def _normalize_secret(secret: str | None) -> str:
    return str(secret or "").strip()


def decrypt_ai_api_key(encrypted_value: str, secret: str | None = None) -> str | None:
    normalized_value = str(encrypted_value or "").strip()
    if not normalized_value:
        return None

    normalized_secret = _normalize_secret(secret if secret is not None else settings.AI_KEY_ENCRYPTION_SECRET)
    if not normalized_secret:
        return None

    payload: dict[str, Any] = json.loads(normalized_value)
    if payload.get("v") != AI_API_KEY_ENCRYPTION_VERSION:
        raise ValueError("AI API Key 加密载荷版本不受支持。")

    iv = base64.b64decode(str(payload.get("iv") or ""))
    data = base64.b64decode(str(payload.get("data") or ""))
    key = hashlib.sha256(normalized_secret.encode("utf-8")).digest()
    decrypted = AESGCM(key).decrypt(iv, data, None)
    return decrypted.decode("utf-8")


def resolve_stored_ai_api_key(row: dict[str, Any], secret: str | None = None) -> str:
    encrypted_value = str(row.get("ai_api_key_encrypted") or "").strip()
    if encrypted_value:
        decrypted = decrypt_ai_api_key(encrypted_value, secret)
        if decrypted:
            return decrypted

    return str(row.get("ai_api_key") or "").strip()
