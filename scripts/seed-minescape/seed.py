#!/usr/bin/env python3
"""
Seed the Minescape product into DocPilot's persisted CMS state.

Mutates `.docpilot-data/cms-state.json` to:

1. Promote the existing 'next-game' product entry to a real 'minescape' product
   (renaming id, polishing description, marking status 'published').
2. Update the existing Minescape Interface Description doc to reference the
   renamed product id.
3. Add a new comprehensive document:
       Minescape — Complete Player & Operator Guide
   with 15 sections under cms_custom_sections_v1.
4. Add a corresponding selected-product entry so the new product is the
   landing default for an admin who hasn't touched the workspace yet.

Idempotent: re-running the script overwrites the new doc's sections cleanly,
leaving any other CMS state untouched.

Usage:
    python3 scripts/seed-minescape/seed.py
"""

from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# Allow `from sections import SECTIONS` regardless of CWD.
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

from sections import SECTIONS, build_section_html, section_id  # noqa: E402

ROOT = SCRIPT_DIR.parent.parent
STATE_FILE = ROOT / ".docpilot-data" / "cms-state.json"

NEW_GAME_ID = "minescape"
NEW_DOC_ID = "doc-minescape-complete-guide"
EXISTING_PLACEHOLDER_ID = "next-game"

TODAY = datetime.now(timezone.utc).date().isoformat()


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def revision(key: str) -> str:
    return f"{key}:{int(time.time() * 1000)}:{os.urandom(3).hex()}"


def load_state():
    with STATE_FILE.open("r", encoding="utf-8") as fh:
        return json.load(fh)


def save_state(state):
    with STATE_FILE.open("w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=2, ensure_ascii=False)


def upsert_keyed(state, key, new_value, operation):
    previous = state["keys"].get(key)
    state["keys"][key] = {
        "value": new_value,
        "revision": revision(key),
        "previous_revision": previous.get("revision") if previous else None,
        "updated_at": now_iso(),
    }


def patch_games(games_value):
    """Rename 'next-game' → 'minescape' and promote it."""
    games_value = list(games_value)
    found = False
    for game in games_value:
        if game["id"] == EXISTING_PLACEHOLDER_ID or game["id"] == NEW_GAME_ID:
            game.update(
                {
                    "id": NEW_GAME_ID,
                    "name": "Minescape",
                    "studio": "Aviator Studio",
                    "status": "published",
                    "description": (
                        "Crash-and-hold mining game. Players stake a bet, configure a hidden minefield, "
                        "and reveal crates to grow a multiplier — cashing out before hitting a mine."
                    ),
                    "version": "1.0.0",
                    "updatedAt": TODAY,
                }
            )
            found = True
            break

    if not found:
        games_value.append(
            {
                "id": NEW_GAME_ID,
                "name": "Minescape",
                "studio": "Aviator Studio",
                "status": "published",
                "description": (
                    "Crash-and-hold mining game. Players stake a bet, configure a hidden minefield, "
                    "and reveal crates to grow a multiplier — cashing out before hitting a mine."
                ),
                "version": "1.0.0",
                "updatedAt": TODAY,
            }
        )

    return games_value


def build_doc_entry():
    return {
        "id": NEW_DOC_ID,
        "gameId": NEW_GAME_ID,
        "title": "Minescape — Complete Player & Operator Guide",
        "slug": "minescape-complete-guide",
        "type": "game",
        "description": (
            "End-to-end player-facing guide and internal operator reference for Minescape. "
            "Covers every screen, every control, every game state, both play modes, the menu, "
            "Provably Fair, worked sessions, glossary, and a verification checklist."
        ),
        "version": "1.0.0",
        "status": "review",
        "owner": "Product",
        "reviewer": "Docs",
        "audience": "Players, operators, support, QA, localisation",
        "taxonomy": "gameplay, ui, mines, autobet, player-guide, operator-reference",
        "navPlacement": "primary",
        "navOrder": 0,
        "templateId": "game-manual",
        "updatedAt": TODAY,
        "sections": len(SECTIONS),
    }


def build_section_entries():
    entries = []
    for index, section in enumerate(SECTIONS):
        sid = section_id(NEW_DOC_ID, index)
        entries.append(
            {
                "id": sid,
                "number": section["number"],
                "slug": section["slug"],
                "title": section["title"],
                "summary": section["summary"],
                "status": section["status"],
                "owner": section["owner"],
                "updatedAt": TODAY,
                "html": build_section_html(section, NEW_DOC_ID, index),
            }
        )
    return entries


def patch_docs(docs_value):
    """Add the new comprehensive guide and repoint the existing Interface Description."""
    docs_value = list(docs_value)

    # Repoint any existing Minescape Interface Description doc to the new gameId.
    for doc in docs_value:
        gid = doc.get("gameId")
        if gid in (EXISTING_PLACEHOLDER_ID, NEW_GAME_ID):
            doc["gameId"] = NEW_GAME_ID

    # Remove an earlier instance of the new doc (idempotent re-runs).
    docs_value = [doc for doc in docs_value if doc.get("id") != NEW_DOC_ID]

    docs_value.append(build_doc_entry())
    return docs_value


def patch_custom_sections(custom_value):
    custom_value = dict(custom_value or {})
    custom_value[NEW_DOC_ID] = build_section_entries()
    return custom_value


def main():
    if not STATE_FILE.exists():
        sys.stderr.write(
            f"DocPilot state file not found at {STATE_FILE}. Run the server once first to initialise it.\n"
        )
        sys.exit(1)

    state = load_state()
    keys = state.setdefault("keys", {})

    games_entry = keys.get("cms_games_v1")
    docs_entry = keys.get("cms_docs_v2")
    custom_entry = keys.get("cms_custom_sections_v1")

    games_value = games_entry["value"] if games_entry else []
    docs_value = docs_entry["value"] if docs_entry else []
    custom_value = custom_entry["value"] if custom_entry else {}

    upsert_keyed(state, "cms_games_v1", patch_games(games_value), "minescape_seed_games")
    upsert_keyed(state, "cms_docs_v2", patch_docs(docs_value), "minescape_seed_doc")
    upsert_keyed(state, "cms_custom_sections_v1", patch_custom_sections(custom_value), "minescape_seed_sections")
    upsert_keyed(state, "cms_selected_product_v1", NEW_GAME_ID, "minescape_seed_product_select")

    save_state(state)

    print(
        json.dumps(
            {
                "ok": True,
                "product_id": NEW_GAME_ID,
                "doc_id": NEW_DOC_ID,
                "doc_slug": "minescape-complete-guide",
                "sections_seeded": len(SECTIONS),
                "state_file": str(STATE_FILE),
                "view_url": f"/products/{NEW_GAME_ID}",
                "doc_url": "/docs/minescape-complete-guide",
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
