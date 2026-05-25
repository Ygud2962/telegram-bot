from __future__ import annotations

import json
import os
import re
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any
from urllib.parse import urlparse

from .content import load_content
from .repository import GameError, InMemoryGameRepository
from .security import validate_webapp_init_data


class JsonApiHandler(BaseHTTPRequestHandler):
    repo: InMemoryGameRepository

    server_version = "ZDNetBackend/0.1"

    def do_OPTIONS(self) -> None:
        self._send_json({"ok": True})

    def do_GET(self) -> None:
        try:
            path = urlparse(self.path).path
            if path == "/health":
                self._send_json({"ok": True, "service": "zdnet-backend"})
                return
            if path == "/api/content":
                self._require_auth()
                self._send_json(load_content())
                return
            if path == "/api/bootstrap":
                state = self._require_auth()
                self._send_json(self.repo.bootstrap(state))
                return
            if path == "/api/payments/history":
                state = self._require_auth()
                self._send_json(self.repo.payment_history(state))
                return
            self._send_json({"error": "not_found"}, status=HTTPStatus.NOT_FOUND)
        except GameError as exc:
            self._send_json({"error": exc.code}, status=exc.status)
        except Exception as exc:
            self._send_json(
                {"error": "internal_error", "detail": str(exc)},
                status=HTTPStatus.INTERNAL_SERVER_ERROR,
            )

    def do_POST(self) -> None:
        try:
            path = urlparse(self.path).path
            if path == "/api/auth/telegram":
                self._handle_auth()
                return

            state = self._require_auth()

            match = re.fullmatch(r"/api/threats/([^/]+)/start", path)
            if match:
                self._send_json(self.repo.start_attempt(state, match.group(1)))
                return

            match = re.fullmatch(r"/api/attempts/([^/]+)/finish", path)
            if match:
                self._send_json(self.repo.finish_attempt(state, match.group(1), self._read_json()))
                return

            if path == "/api/cache/open":
                body = self._read_json()
                self._send_json(self.repo.open_cache(state, int(body.get("count") or 1)))
                return

            if path == "/api/payments/invoice":
                body = self._read_json()
                self._send_json(self.repo.create_invoice(state, str(body.get("productId") or "")))
                return

            self._send_json({"error": "not_found"}, status=HTTPStatus.NOT_FOUND)
        except GameError as exc:
            self._send_json({"error": exc.code}, status=exc.status)
        except Exception as exc:
            self._send_json(
                {"error": "internal_error", "detail": str(exc)},
                status=HTTPStatus.INTERNAL_SERVER_ERROR,
            )

    def log_message(self, fmt: str, *args: Any) -> None:
        if os.environ.get("ZDNET_HTTP_LOG", "0") == "1":
            super().log_message(fmt, *args)

    def _handle_auth(self) -> None:
        body = self._read_json()
        dev_auth = os.environ.get("ZDNET_DEV_AUTH", "0") == "1"
        if dev_auth:
            telegram_id = int(body.get("devTelegramId") or 1001)
            nickname = str(body.get("devNickname") or f"rookie_{telegram_id}")
        else:
            bot_token = os.environ.get("BOT_TOKEN", "")
            ok, reason, telegram_id, user_obj = validate_webapp_init_data(
                str(body.get("initData") or ""),
                bot_token,
            )
            if not ok or telegram_id is None:
                self._send_json({"error": reason}, status=HTTPStatus.UNAUTHORIZED)
                return
            nickname = user_obj.get("username") or user_obj.get("first_name") or f"rookie_{telegram_id}"

        state = self.repo.get_or_create_player(telegram_id, nickname)
        token = self.repo.create_session(int(state.player["id"]))
        self._send_json(
            {
                "sessionToken": token,
                "player": state.player,
                "serverTime": self.repo.bootstrap(state)["serverTime"],
            }
        )

    def _require_auth(self):
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            raise GameError("missing_bearer_token", status=HTTPStatus.UNAUTHORIZED)
        token = auth.removeprefix("Bearer ").strip()
        return self.repo.get_by_session(token)

    def _read_json(self) -> dict[str, Any]:
        raw_len = int(self.headers.get("Content-Length") or 0)
        if raw_len <= 0:
            return {}
        if raw_len > 64_000:
            raise GameError("payload_too_large", status=HTTPStatus.REQUEST_ENTITY_TOO_LARGE)
        raw = self.rfile.read(raw_len)
        try:
            data = json.loads(raw.decode("utf-8"))
        except Exception:
            raise GameError("bad_json")
        if not isinstance(data, dict):
            raise GameError("bad_json")
        return data

    def _send_json(self, data: dict[str, Any], status: int | HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
        self.send_response(int(status))
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)


def create_server(host: str = "0.0.0.0", port: int = 8090) -> ThreadingHTTPServer:
    content = load_content()
    repo = InMemoryGameRepository(content)

    class Handler(JsonApiHandler):
        pass

    Handler.repo = repo
    return ThreadingHTTPServer((host, port), Handler)


def main() -> None:
    port = int(os.environ.get("ZDNET_PORT", "8090"))
    server = create_server(port=port)
    print(f"ZDNet backend listening on http://0.0.0.0:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()

