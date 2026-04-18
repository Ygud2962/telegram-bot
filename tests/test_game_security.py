import hashlib
import hmac
import json
import time
import urllib.parse
import unittest

from game_security import is_stale_sync_token, validate_webapp_init_data


def _sign_init_data(data: dict, bot_token: str) -> str:
    secret_key = hmac.new(
        b"WebAppData", bot_token.encode("utf-8"), hashlib.sha256
    ).digest()
    check = "\n".join(f"{k}={v}" for k, v in sorted(data.items()))
    signature = hmac.new(secret_key, check.encode("utf-8"), hashlib.sha256).hexdigest()
    payload = dict(data)
    payload["hash"] = signature
    return urllib.parse.urlencode(payload)


class GameSecurityTests(unittest.TestCase):
    def test_validate_webapp_init_data_ok(self):
        bot_token = "123456:TEST_TOKEN"
        now = int(time.time())
        raw_user = json.dumps({"id": 111, "first_name": "Test"}, separators=(",", ":"))
        data = {"auth_date": str(now), "query_id": "AAE", "user": raw_user}
        init_data = _sign_init_data(data, bot_token)

        ok, reason, uid = validate_webapp_init_data(
            init_data, bot_token, expected_user_id=111, max_age_sec=3600, now_ts=now
        )
        self.assertTrue(ok)
        self.assertEqual(reason, "ok")
        self.assertEqual(uid, 111)

    def test_validate_webapp_init_data_bad_hash(self):
        bot_token = "123456:TEST_TOKEN"
        now = int(time.time())
        raw_user = json.dumps({"id": 222}, separators=(",", ":"))
        data = {"auth_date": str(now), "query_id": "AAE", "user": raw_user}
        init_data = _sign_init_data(data, bot_token) + "ff"

        ok, reason, _ = validate_webapp_init_data(
            init_data, bot_token, expected_user_id=222, max_age_sec=3600, now_ts=now
        )
        self.assertFalse(ok)
        self.assertIn(reason, {"bad_hash", "bad_hash_format"})

    def test_validate_webapp_init_data_expired(self):
        bot_token = "123456:TEST_TOKEN"
        now = int(time.time())
        raw_user = json.dumps({"id": 333}, separators=(",", ":"))
        data = {"auth_date": str(now - 7200), "query_id": "AAE", "user": raw_user}
        init_data = _sign_init_data(data, bot_token)

        ok, reason, _ = validate_webapp_init_data(
            init_data, bot_token, expected_user_id=333, max_age_sec=60, now_ts=now
        )
        self.assertFalse(ok)
        self.assertEqual(reason, "expired")

    def test_validate_webapp_init_data_user_mismatch(self):
        bot_token = "123456:TEST_TOKEN"
        now = int(time.time())
        raw_user = json.dumps({"id": 444}, separators=(",", ":"))
        data = {"auth_date": str(now), "query_id": "AAE", "user": raw_user}
        init_data = _sign_init_data(data, bot_token)

        ok, reason, uid = validate_webapp_init_data(
            init_data, bot_token, expected_user_id=445, max_age_sec=3600, now_ts=now
        )
        self.assertFalse(ok)
        self.assertEqual(reason, "user_mismatch")
        self.assertEqual(uid, 444)

    def test_validate_webapp_init_data_duplicate_key(self):
        bot_token = "123456:TEST_TOKEN"
        now = int(time.time())
        raw_user = json.dumps({"id": 555}, separators=(",", ":"))
        data = {"auth_date": str(now), "query_id": "AAE", "user": raw_user}
        signed = _sign_init_data(data, bot_token)
        duplicated = signed + "&auth_date=" + str(now)
        ok, reason, _ = validate_webapp_init_data(
            duplicated, bot_token, expected_user_id=555, max_age_sec=3600, now_ts=now
        )
        self.assertFalse(ok)
        self.assertEqual(reason, "duplicate_key")

    def test_validate_webapp_init_data_future_auth_date(self):
        bot_token = "123456:TEST_TOKEN"
        now = int(time.time())
        raw_user = json.dumps({"id": 666}, separators=(",", ":"))
        data = {"auth_date": str(now + 120), "query_id": "AAE", "user": raw_user}
        init_data = _sign_init_data(data, bot_token)
        ok, reason, _ = validate_webapp_init_data(
            init_data, bot_token, expected_user_id=666, max_age_sec=3600, now_ts=now
        )
        self.assertFalse(ok)
        self.assertEqual(reason, "future_auth_date")

    def test_stale_sync_token(self):
        self.assertTrue(is_stale_sync_token(101, 202))
        self.assertFalse(is_stale_sync_token(0, 202))
        self.assertFalse(is_stale_sync_token(202, 202))


if __name__ == "__main__":
    unittest.main()
