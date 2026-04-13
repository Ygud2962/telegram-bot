import hashlib
import hmac
import json
import time
import urllib.parse


def is_stale_sync_token(client_token: int, server_token: int) -> bool:
    """True when client writes with an outdated reset_token."""
    try:
        c = int(client_token or 0)
        s = int(server_token or 0)
    except Exception:
        return False
    return c > 0 and s > 0 and c != s


def validate_webapp_init_data(
    init_data_raw: str,
    bot_token: str,
    expected_user_id: int | None = None,
    max_age_sec: int = 86400,
    now_ts: int | None = None,
) -> tuple[bool, str, int | None]:
    """
    Validate Telegram WebApp initData signature and age.
    Returns: (ok, reason, user_id_from_init_data)
    """
    if not bot_token:
        return False, "missing_bot_token", None
    if not init_data_raw:
        return False, "missing_init_data", None

    try:
        pairs = urllib.parse.parse_qsl(
            init_data_raw, keep_blank_values=True, strict_parsing=False
        )
        data = dict(pairs)
    except Exception:
        return False, "bad_init_data_format", None

    recv_hash = data.pop("hash", None)
    if not recv_hash:
        return False, "missing_hash", None

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    secret_key = hmac.new(
        b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256
    ).digest()
    calc_hash = hmac.new(
        secret_key, data_check_string.encode("utf-8"), hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(calc_hash, recv_hash):
        return False, "bad_hash", None

    auth_date_raw = data.get("auth_date")
    try:
        auth_date = int(auth_date_raw or 0)
    except Exception:
        return False, "bad_auth_date", None
    if auth_date <= 0:
        return False, "missing_auth_date", None

    now = int(now_ts if now_ts is not None else time.time())
    if abs(now - auth_date) > int(max_age_sec):
        return False, "expired", None

    user_raw = data.get("user")
    if not user_raw:
        return False, "missing_user", None
    try:
        user_obj = json.loads(user_raw)
        auth_user_id = int(user_obj.get("id"))
    except Exception:
        return False, "bad_user_json", None

    if expected_user_id is not None and int(expected_user_id) != auth_user_id:
        return False, "user_mismatch", auth_user_id

    return True, "ok", auth_user_id
