#!/usr/bin/env python3
"""Sync README version badges/table from bot.py defaults."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BOT_PY = ROOT / "bot.py"
README = ROOT / "README.md"


def extract_versions(bot_text: str) -> tuple[str, str]:
    bot_match = re.search(
        r"BOT_VERSION\s*=\s*os\.environ\.get\('BOT_VERSION',\s*'([^']+)'\)",
        bot_text,
    )
    game_match = re.search(
        r"GAME_VERSION\s*=\s*os\.environ\.get\('GAME_VERSION',\s*'([^']+)'\)",
        bot_text,
    )
    if not bot_match or not game_match:
        raise ValueError("Не удалось извлечь BOT_VERSION/GAME_VERSION из bot.py")
    return bot_match.group(1), game_match.group(1)


def build_autoversion_block(bot_version: str, game_version: str) -> str:
    return (
        "<!-- AUTOVERSION:START -->\n"
        f"[![Версия бота](https://img.shields.io/badge/🤖_ВЕРСИЯ-{bot_version}-2196F3?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ygud2962/telegram-bot)\n"
        f"[![Версия игры](https://img.shields.io/badge/🎮_ВЕРСИЯ-{game_version}-FF9800?style=for-the-badge&logo=html5&logoColor=white)](https://ygud2962.github.io/telegram-bot/)\n"
        "\n"
        "| Компонент | Версия |\n"
        "|---|---|\n"
        f"| 🤖 Bot | **{bot_version}** |\n"
        f"| 🎮 Game | **{game_version}** |\n"
        "<!-- AUTOVERSION:END -->"
    )


def sync_readme(readme_text: str, bot_version: str, game_version: str) -> str:
    block_pattern = r"<!-- AUTOVERSION:START -->.*?<!-- AUTOVERSION:END -->"
    auto_block = build_autoversion_block(bot_version, game_version)
    updated = re.sub(block_pattern, auto_block, readme_text, count=1, flags=re.S)

    updated = re.sub(
        r"(?m)^(\| `BOT_VERSION` \| .*по умолчанию `)([^`]+)(` \|)$",
        rf"\g<1>{bot_version}\g<3>",
        updated,
    )
    updated = re.sub(
        r"(?m)^(\| `GAME_VERSION` \| .*по умолчанию `)([^`]+)(` \|)$",
        rf"\g<1>{game_version}\g<3>",
        updated,
    )
    return updated


def main() -> int:
    try:
        bot_text = BOT_PY.read_text(encoding="utf-8")
        readme_text = README.read_text(encoding="utf-8")
        bot_version, game_version = extract_versions(bot_text)
        new_text = sync_readme(readme_text, bot_version, game_version)
        if new_text != readme_text:
            README.write_text(new_text, encoding="utf-8")
            print(f"README updated: bot={bot_version}, game={game_version}")
        else:
            print(f"README already up to date: bot={bot_version}, game={game_version}")
        return 0
    except Exception as exc:  # pragma: no cover
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
