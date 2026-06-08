# Better on Bedrock (Modified)

This repository contains a **modified version** of the original **Better on Bedrock** add-on for Minecraft Bedrock Edition. It is based on **version 1.2.0** with selected **v1.2.1** behaviour/resource updates ported forward for this JCP-maintained fork.

## Original project

**Copyright © 2024-present Poggy MIT License.**

- Official site: https://poggy.org/
- CurseForge page: https://www.curseforge.com/minecraft-bedrock/addons/better-on-bedrock
- Modder: maintained/modified by *James C. Porter*.

## Repository structure

- `BOB_behaviors/` — Behaviour Pack
- `BOB_resources/` — Resource Pack
- `RELEASE_NOTES.md` — release history and compatibility notes for this fork
- `wiki.md` — player/developer-facing wiki notes
- `DEVELOPMENT_INDEX.md` — index of partial, disabled, deferred, or development-only areas

Both packs are required for proper gameplay.

## Version and compatibility

From the manifests in this repo:

- Add-on version: `1.2.1-0.9`
- Minimum Bedrock engine version: `1.21.120`

See `RELEASE_NOTES.md` for detailed compatibility notes, including the Bedrock `1.26.21.1` compatibility work.

## Installation (manual)

1. Download or clone this repository.
2. Copy both folders into your Minecraft Bedrock development packs directory:
   - `BOB_behaviors` → behaviour packs folder
   - `BOB_resources` → resource packs folder
3. Open/create a world in Minecraft Bedrock.
4. Enable both packs in that world:
   - Behaviour Packs: **Better on Bedrock - Behavior Pack**
   - Resource Packs: **Better on Bedrock - Resource Pack**
5. Enter the world.

## Current fork focus

This fork mainly focuses on reliability, compatibility, and performance while keeping gameplay changes reviewable. Current work includes:

- porting selected low-risk v1.2.1 behaviour/resource updates,
- keeping custom scripts/components working on newer Bedrock builds without an unplanned full Scripting V2 migration,
- reducing duplicate identifiers and stale entity/resource definitions,
- documenting unfinished or deferred areas so future work is easier to audit.

## Documentation

- For release history, see `RELEASE_NOTES.md`.
- For gameplay/wiki notes, see `wiki.md`.
- For partially made, disabled, or development-only areas, see `DEVELOPMENT_INDEX.md`.

## Notes

- This repo is a custom/modified distribution and differs from the upstream release.
- Please keep attribution to the original author when redistributing forks or edits.
- The fork is still under active review and should be treated as currently untested unless a specific build has been smoke-tested.

## Future changes

- Rename all remaining references to `poggy` to a replacement identifier/name once the new naming is decided.
