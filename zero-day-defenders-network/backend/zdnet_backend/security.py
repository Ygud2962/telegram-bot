from __future__ import annotations

import hashlib
import hmac
import json
import re
import secrets
import time
import urllib.parse


MAX_INIT_DATA_LEN = 8192
MAX_USER_JSON_LEN = 4096
MAX_ALLOWED_FUTURE_SKEW_SEC = 30


def create_session_token() -> str:
    return secrets.token_urlsafe(32)


def validate_webapp_init_data(
    init_data_raw: str,
    bot_token: str,
    expected_user_id: int | None = None,
    max_age_sec: int = 86400,
    now_ts: int | None = None,
) -> tuple[bool, str, int | None, dict]:
    if not bot_token:
        return False, "missing_bot_token", None, {}
    if not init_data_raw:
        return False, "missing_init_data", None, {}
    if len(init_data_raw) > MAX_INIT_DATA_LEN:
        return False, "init_data_too_large", None, {}

    try:
        pairs = urllib.parse.parse_qsl(
            init_data_raw, keep_blank_values=True, strict_parsing=False
        )
    except Exception:
        return False, "bad_init_data_format", None, {}
    if not pairs:
        return False, "empty_init_data", None, {}

    data: dict[str, str] = {}
    for key, value in pairs:
        if key in data:
            return False, "duplicate_key", None, {}
        data[key] = value

    recv_hash = data.pop("hash", None)
    if not recv_hash:
        return False, "missing_hash", None, {}
    if not re.fullmatch(r"[0-9a-f]{64}", recv_hash):
        return False, "bad_hash_format", None, {}

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret_key = hmac.new(
        b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256
    ).digest()
    calc_hash = hmac.new(
        secret_key, data_check_string.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(calc_hash, recv_hash):
        return False, "bad_hash", None, {}

    try:
        auth_date = int(data.get("auth_date") or 0)
    except Exception:
        return False, "bad_auth_date", None, {}
    if auth_date <= 0:
        return False, "missing_auth_date", None, {}

    now = int(now_ts if now_ts is not None else time.time())
    if auth_date > now + MAX_ALLOWED_FUTURE_SKEW_SEC:
        return False, "future_auth_date", None, {}
    if now - auth_date > max(1, int(max_age_sec)):
        return False, "expired", None, {}

    user_raw = data.get("user")
    if not user_raw:
        return False, "missing_user", None, {}
    if len(user_raw) > MAX_USER_JSON_LEN:
        return False, "user_json_too_large", None, {}
    try:
        user_obj = json.loads(user_raw)
        auth_user_id = int(user_obj.get("id"))
    except Exception:
        return False, "bad_user_json", None, {}
    if auth_user_id <= 0:
        return False, "bad_user_id", None, {}

    if expected_user_id is not None:
        try:
            expected_uid = int(expected_user_id)
        except Exception:
            return False, "bad_expected_user_id", auth_user_id, user_obj
        if expected_uid <= 0:
            return False, "bad_expected_user_id", auth_user_id, user_obj
        if expected_uid != auth_user_id:
            return False, "user_mismatch", auth_user_id, user_obj

    return True, "ok", auth_user_id, user_obj

