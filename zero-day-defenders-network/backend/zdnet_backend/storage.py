from __future__ import annotations

import os
from typing import Any

from .repository import InMemoryGameRepository


def build_repository(content: dict[str, Any]):
    storage = os.environ.get("ZDNET_STORAGE", "memory").strip().lower()
    if storage in {"postgres", "postgresql", "pg"}:
        from .postgres_repository import PostgresGameRepository

        dsn = os.environ.get("ZDNET_DATABASE_URL") or os.environ.get("DATABASE_URL") or ""
        auto_migrate = os.environ.get("ZDNET_AUTO_MIGRATE", "1") != "0"
        return PostgresGameRepository(content, dsn, auto_migrate=auto_migrate)
    if storage != "memory":
        raise RuntimeError(f"Unsupported ZDNET_STORAGE={storage!r}")
    return InMemoryGameRepository(content)

