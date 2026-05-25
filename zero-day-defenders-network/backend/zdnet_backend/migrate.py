from __future__ import annotations

import os

from .content import load_content
from .postgres_repository import PostgresGameRepository


def main() -> None:
    dsn = os.environ.get("ZDNET_DATABASE_URL") or os.environ.get("DATABASE_URL") or ""
    if not dsn:
        raise SystemExit("Set ZDNET_DATABASE_URL or DATABASE_URL before running migration.")
    repo = PostgresGameRepository(load_content(), dsn, auto_migrate=False)
    repo.migrate()
    print("zdnet PostgreSQL migration applied")


if __name__ == "__main__":
    main()

