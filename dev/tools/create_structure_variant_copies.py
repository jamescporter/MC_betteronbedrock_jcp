#!/usr/bin/env python3
"""Create local .mcstructure copies used by unique template-pool variants.

The repository keeps these generated binary copies out of PRs. Run this script
from anywhere in the repo before packaging/testing the behaviour pack so the
JSON template-pool locations resolve to concrete .mcstructure files.
"""

from __future__ import annotations

import argparse
import filecmp
import shutil
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]

COPIES = [
    (
        "BOB_behaviors/structures/pillager_camp/pillager_camp.mcstructure",
        "BOB_behaviors/structures/pillager_camp/pillager_camp_grey.mcstructure",
    ),
    (
        "BOB_behaviors/structures/pillager_camp/pillager_camp.mcstructure",
        "BOB_behaviors/structures/pillager_camp/pillager_camp_blue.mcstructure",
    ),
    (
        "BOB_behaviors/structures/pillager_camp/pillager_camp.mcstructure",
        "BOB_behaviors/structures/pillager_camp/pillager_camp_red.mcstructure",
    ),
    (
        "BOB_behaviors/structures/pillager_camp/pillager_camp.mcstructure",
        "BOB_behaviors/structures/pillager_camp/pillager_camp_white.mcstructure",
    ),
    (
        "BOB_behaviors/structures/pillager_camp/pillager_camp.mcstructure",
        "BOB_behaviors/structures/pillager_camp/pillager_camp_empty.mcstructure",
    ),
    (
        "BOB_behaviors/structures/well_dungeon/traps/hallway_trap_01.mcstructure",
        "BOB_behaviors/structures/well_dungeon/traps/hallway_trap_01_empty.mcstructure",
    ),
    (
        "BOB_behaviors/structures/well_dungeon/traps/hallway_trap_02.mcstructure",
        "BOB_behaviors/structures/well_dungeon/traps/hallway_trap_02_empty.mcstructure",
    ),
    (
        "BOB_behaviors/structures/well_dungeon/traps/hallway_trap_03.mcstructure",
        "BOB_behaviors/structures/well_dungeon/traps/hallway_trap_03_empty.mcstructure",
    ),
    (
        "BOB_behaviors/structures/well_dungeon/traps/hallway_trap_04.mcstructure",
        "BOB_behaviors/structures/well_dungeon/traps/hallway_trap_04_empty.mcstructure",
    ),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="Only verify that each generated file exists and matches its source.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite existing generated files that differ from their source.",
    )
    return parser.parse_args()


def relative(path: Path) -> str:
    return str(path.relative_to(REPO_ROOT))


def verify_source(source: Path) -> None:
    if not source.is_file():
        raise FileNotFoundError(f"source structure is missing: {relative(source)}")


def check_copy(source: Path, destination: Path) -> bool:
    return destination.is_file() and filecmp.cmp(source, destination, shallow=False)


def create_copy(source: Path, destination: Path, force: bool) -> str:
    verify_source(source)
    if check_copy(source, destination):
        return f"ok: {relative(destination)}"
    if destination.exists() and not force:
        raise FileExistsError(
            f"destination differs; rerun with --force to overwrite: {relative(destination)}"
        )
    destination.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, destination)
    return f"created: {relative(destination)}"


def main() -> int:
    args = parse_args()
    failures: list[str] = []
    for source_name, destination_name in COPIES:
        source = REPO_ROOT / source_name
        destination = REPO_ROOT / destination_name
        verify_source(source)
        if args.check:
            if check_copy(source, destination):
                print(f"ok: {relative(destination)}")
            else:
                failures.append(relative(destination))
            continue
        print(create_copy(source, destination, args.force))
    if failures:
        print("missing or stale generated structures:")
        for failure in failures:
            print(f"- {failure}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
