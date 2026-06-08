#!/usr/bin/env python3
"""Apply text-defined jigsaw target_pool fixes to Bedrock .mcstructure NBT files.

The repository avoids committing binary .mcstructure edits.  Keep the desired
changes in dev/tools/structure_jigsaw_patches.json and run this tool in an export
workspace to produce patched binary structures for Bedrock testing/release.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import struct
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

TAG_END = 0
TAG_BYTE = 1
TAG_SHORT = 2
TAG_INT = 3
TAG_LONG = 4
TAG_FLOAT = 5
TAG_DOUBLE = 6
TAG_BYTE_ARRAY = 7
TAG_STRING = 8
TAG_LIST = 9
TAG_COMPOUND = 10
TAG_INT_ARRAY = 11
TAG_LONG_ARRAY = 12


@dataclass
class Tag:
    tag_type: int
    value: Any
    elem_type: int | None = None


class Reader:
    def __init__(self, data: bytes) -> None:
        self.data = data
        self.offset = 0

    def take(self, size: int) -> bytes:
        chunk = self.data[self.offset : self.offset + size]
        if len(chunk) != size:
            raise ValueError("Unexpected end of NBT data")
        self.offset += size
        return chunk

    def u8(self) -> int:
        return self.take(1)[0]

    def i16(self) -> int:
        return struct.unpack("<h", self.take(2))[0]

    def u16(self) -> int:
        return struct.unpack("<H", self.take(2))[0]

    def i32(self) -> int:
        return struct.unpack("<i", self.take(4))[0]

    def string(self) -> str:
        size = self.u16()
        return self.take(size).decode("utf-8")


def read_payload(reader: Reader, tag_type: int) -> Tag:
    if tag_type == TAG_BYTE:
        return Tag(tag_type, struct.unpack("<b", reader.take(1))[0])
    if tag_type == TAG_SHORT:
        return Tag(tag_type, reader.i16())
    if tag_type == TAG_INT:
        return Tag(tag_type, reader.i32())
    if tag_type == TAG_LONG:
        return Tag(tag_type, struct.unpack("<q", reader.take(8))[0])
    if tag_type == TAG_FLOAT:
        return Tag(tag_type, struct.unpack("<f", reader.take(4))[0])
    if tag_type == TAG_DOUBLE:
        return Tag(tag_type, struct.unpack("<d", reader.take(8))[0])
    if tag_type == TAG_BYTE_ARRAY:
        size = reader.i32()
        return Tag(tag_type, reader.take(size))
    if tag_type == TAG_STRING:
        return Tag(tag_type, reader.string())
    if tag_type == TAG_LIST:
        elem_type = reader.u8()
        size = reader.i32()
        return Tag(tag_type, [read_payload(reader, elem_type) for _ in range(size)], elem_type)
    if tag_type == TAG_COMPOUND:
        items: list[tuple[str, Tag]] = []
        while True:
            child_type = reader.u8()
            if child_type == TAG_END:
                break
            items.append((reader.string(), read_payload(reader, child_type)))
        return Tag(tag_type, items)
    if tag_type == TAG_INT_ARRAY:
        size = reader.i32()
        return Tag(tag_type, [reader.i32() for _ in range(size)])
    if tag_type == TAG_LONG_ARRAY:
        size = reader.i32()
        return Tag(tag_type, [struct.unpack("<q", reader.take(8))[0] for _ in range(size)])
    raise ValueError(f"Unsupported NBT tag type: {tag_type}")


def read_nbt(path: Path) -> tuple[str, Tag]:
    reader = Reader(path.read_bytes())
    root_type = reader.u8()
    root_name = reader.string()
    root = read_payload(reader, root_type)
    if reader.offset != len(reader.data):
        raise ValueError(f"Trailing data in {path}: read {reader.offset} of {len(reader.data)} bytes")
    return root_name, root


def pack_string(value: str) -> bytes:
    raw = value.encode("utf-8")
    return struct.pack("<H", len(raw)) + raw


def write_payload(tag: Tag) -> bytes:
    tag_type = tag.tag_type
    if tag_type == TAG_BYTE:
        return struct.pack("<b", tag.value)
    if tag_type == TAG_SHORT:
        return struct.pack("<h", tag.value)
    if tag_type == TAG_INT:
        return struct.pack("<i", tag.value)
    if tag_type == TAG_LONG:
        return struct.pack("<q", tag.value)
    if tag_type == TAG_FLOAT:
        return struct.pack("<f", tag.value)
    if tag_type == TAG_DOUBLE:
        return struct.pack("<d", tag.value)
    if tag_type == TAG_BYTE_ARRAY:
        return struct.pack("<i", len(tag.value)) + tag.value
    if tag_type == TAG_STRING:
        return pack_string(tag.value)
    if tag_type == TAG_LIST:
        return bytes([tag.elem_type or TAG_END]) + struct.pack("<i", len(tag.value)) + b"".join(
            write_payload(child) for child in tag.value
        )
    if tag_type == TAG_COMPOUND:
        payload = bytearray()
        for name, child in tag.value:
            payload.append(child.tag_type)
            payload.extend(pack_string(name))
            payload.extend(write_payload(child))
        payload.append(TAG_END)
        return bytes(payload)
    if tag_type == TAG_INT_ARRAY:
        return struct.pack("<i", len(tag.value)) + b"".join(struct.pack("<i", item) for item in tag.value)
    if tag_type == TAG_LONG_ARRAY:
        return struct.pack("<i", len(tag.value)) + b"".join(struct.pack("<q", item) for item in tag.value)
    raise ValueError(f"Unsupported NBT tag type: {tag_type}")


def write_nbt(path: Path, root_name: str, root: Tag) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(bytes([root.tag_type]) + pack_string(root_name) + write_payload(root))


def compound_get(compound: Tag, key: str) -> Tag | None:
    if compound.tag_type != TAG_COMPOUND:
        return None
    for name, child in compound.value:
        if name == key:
            return child
    return None


def scalar_value(compound: Tag, key: str) -> Any:
    child = compound_get(compound, key)
    return None if child is None else child.value


def iter_compounds(tag: Tag) -> Iterable[Tag]:
    if tag.tag_type == TAG_COMPOUND:
        yield tag
        for _, child in tag.value:
            yield from iter_compounds(child)
    elif tag.tag_type == TAG_LIST:
        for child in tag.value:
            yield from iter_compounds(child)


def matches(compound: Tag, criteria: dict[str, Any]) -> bool:
    return all(scalar_value(compound, key) == expected for key, expected in criteria.items())


def set_string(compound: Tag, key: str, value: str) -> None:
    child = compound_get(compound, key)
    if child is None:
        compound.value.append((key, Tag(TAG_STRING, value)))
        return
    if child.tag_type != TAG_STRING:
        raise ValueError(f"Cannot set non-string field {key!r}")
    child.value = value


def load_pool_identifiers(root: Path) -> set[str]:
    identifiers: set[str] = set()
    pattern = re.compile(r'"identifier"\s*:\s*"([^"]+)"')
    for pool in (root / "BOB_behaviors/worldgen/template_pools").rglob("*.json"):
        match = pattern.search(pool.read_text(encoding="utf-8"))
        if match:
            identifiers.add(match.group(1))
    identifiers.add("minecraft:empty")
    return identifiers


def apply_patches_for_structure(root: Path, structure: str, patches: list[dict[str, Any]], output_root: Path | None) -> Path:
    source = root / structure
    root_name, nbt = read_nbt(source)
    for patch in patches:
        found = [compound for compound in iter_compounds(nbt) if scalar_value(compound, "id") == "JigsawBlock" and matches(compound, patch["jigsaw"])]
        if len(found) != 1:
            raise ValueError(f"Expected one matching jigsaw in {source}, found {len(found)} for {patch['jigsaw']}")
        for key, value in patch["set"].items():
            set_string(found[0], key, value)
    target = source if output_root is None else output_root / structure
    if output_root is not None and target != source:
        target.parent.mkdir(parents=True, exist_ok=True)
    write_nbt(target, root_name, nbt)
    return target


def scan_blank_target_pools(path: Path) -> list[dict[str, Any]]:
    _, nbt = read_nbt(path)
    blanks = []
    for compound in iter_compounds(nbt):
        if scalar_value(compound, "id") == "JigsawBlock" and scalar_value(compound, "target_pool") == "":
            blanks.append({key: scalar_value(compound, key) for key in ("name", "target", "target_pool", "x", "y", "z")})
    return blanks


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Repository root")
    parser.add_argument("--patches", type=Path, default=Path("dev/tools/structure_jigsaw_patches.json"))
    parser.add_argument("--output-root", type=Path, help="Write patched structures under this root instead of editing in place")
    parser.add_argument("--in-place", action="store_true", help="Edit the binary .mcstructure files in place")
    parser.add_argument("--check", action="store_true", help="Validate patched output has no blank target_pool values in the patched structures")
    args = parser.parse_args()

    root = args.root.resolve()
    patch_file = args.patches if args.patches.is_absolute() else root / args.patches
    patches = json.loads(patch_file.read_text(encoding="utf-8"))["patches"]

    if args.output_root and args.in_place:
        parser.error("Use either --output-root or --in-place, not both")
    if not args.output_root and not args.in_place:
        parser.error("Choose --output-root for text-only PR workflows or --in-place for release/export workspaces")

    pool_ids = load_pool_identifiers(root)
    missing = sorted({patch["set"].get("target_pool") for patch in patches if patch["set"].get("target_pool") not in pool_ids})
    if missing:
        raise SystemExit(f"Patch file references missing template pool identifier(s): {', '.join(missing)}")

    output_root = None if args.in_place else args.output_root.resolve()
    written = []
    if output_root is not None and output_root.exists():
        shutil.rmtree(output_root)
    patches_by_structure: dict[str, list[dict[str, Any]]] = {}
    for patch in patches:
        patches_by_structure.setdefault(patch["structure"], []).append(patch)
    for structure, structure_patches in patches_by_structure.items():
        target = apply_patches_for_structure(root, structure, structure_patches, output_root)
        written.append(target)
        print(f"patched {structure} ({len(structure_patches)} jigsaw change(s)) -> {target}")

    if args.check:
        failed = False
        for target in sorted(set(written)):
            blanks = scan_blank_target_pools(target)
            if blanks:
                failed = True
                print(f"blank target_pool remains in {target}: {blanks}", file=sys.stderr)
        if failed:
            return 1
        print("check passed: patched structures have no blank jigsaw target_pool values")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
