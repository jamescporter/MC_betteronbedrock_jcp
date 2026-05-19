# Better on Bedrock (Modified) - Based on v1.2.0

This repository contains a **modified version** of the original **Better on Bedrock** add-on for Minecraft Bedrock Edition, based on **version 1.2.0**.

## Original project
**Copyright © 2024-present Poggy MIT License.**
- Official site: https://poggy.org/
- CurseForge page: https://www.curseforge.com/minecraft-bedrock/addons/better-on-bedrock
- Modder: maintained/modified by *James C. Porter*.

### Repository structure
- `BOB_behaviors/` — Behavior Pack
- `BOB_resources/` — Resource Pack

Both packs are required for proper gameplay.

### Version and compatibility
From the manifests in this repo:
- Add-on version: `1.2.0-0.9`
- Minimum Bedrock engine version: `1.21.110`

### Installation (manual)
1. Download or clone this repository.
2. Copy both folders into your Minecraft Bedrock development packs directory:
   - `BOB_behaviors` → behavior packs folder
   - `BOB_resources` → resource packs folder
3. Open/create a world in Minecraft Bedrock.
4. Enable both packs in that world:
   - Behavior Packs: **Better on Bedrock - Behavior Pack**
   - Resource Packs: **Better on Bedrock - Resource Pack**
5. Enter the world.


### Notes
- This repo is a custom/modified distribution and does differ from the upstream release.
- Please keep attribution to the original author when redistributing forks or edits.
- This has basically been vibe-coded as an experiment. I've been going over codex changes with multiple iterations to catch introduced bugs/hallucinations and cross-checking.
- Currently untested.

## Overview of changes in this mod:

This fork mainly focuses on reliability and performance.


V1.2.1-JCP
- **WAWLA growth accuracy fix:** Crop growth stage is now clamped to the configured max before calculating the displayed growth percentage, preventing out-of-range values from producing incorrect percentages.
- **WAWLA harvestability display fix:** Fully grown crops are now treated as harvestable in the WAWLA display branch even when other farmability heuristics do not flag them.
- **WAWLA farmable tag fallback:** The `better_on_bedrock:is_farmable` block tag is now honoured as a fallback harvestability signal.
- **WAWLA wording update:** The user-facing `bob.gui.wawla.canHarvest` text now reads **“Ready to Harvest”** (key wiring kept stable).
- **Guidebook command ported from v1.2.1 source:** Added runtime custom command registration for `/guidebook` via `customCommandRegistry` during world initialisation.
- **Survival-safe command behaviour:** `/guidebook` is available at permission level `Any` with `cheatsRequired = false`, and grants one `better_on_bedrock:guide_book` to the executing player (dropping overflow at player location if inventory is full).
- **Command localisation:** Added `command.better_on_bedrock.common.guidebook.description` in active English language files so command help/description resolves correctly.
- **Guide Book purpose:** The Guide Book is the in-game onboarding/reference item for Better on Bedrock systems, intended to help players understand mechanics, progression, and general add-on usage.
- **Repo wiki started:** Added an initial single-page wiki (`wiki.md`) containing the first Guide Book entry (description, purpose, behaviour, and obtainment routes).

V1.2.0-JCP
- **Performance and scalability:** per-tick and high-frequency scripts were refactored to reduce repeated work, improve caching, and lower runtime overhead.
- **Bug fixes and hardening:** Lots of defensive fixes addressung malformed data handling, null/unsafe state access, duplicate triggers, and cleanup edge cases.
- **Item/combat system stability:** backpacks, staffs, spear/trident logic, strip-block interactions, and related item systems were made more robust while preserving existing functionality.
- **Quest flow:** regular, bounty, and bought-quest paths were tightened with safer parsing/selection logic, better reconciliation, and duplicate-state normalisation.
- **Entity and ambience updates:** Seeker/Inferior and supporting end-mob logic were adjusted, alongside ambient and fog behaviour refinements for more consistent world state transitions.
- **Goblin Trader balance:** trader values received light balance tuning so he's not as OP.
- **Fire Wisps size:** Fire Wisps now have a ~33% larger custom hitbox and a slight scale increase, making them less frustrating to hit without changing their core behaviour.
- **Bassalt Crobbers:** Bassalt Crobbers now prioritise targeting and attack goals above idle wandering to improve combat responsiveness. Updated delayed attack path requirements (`require_complete_path: false`) and added conservative Nether navigation flags (`can_path_over_water: false`, `avoid_damage_blocks: true`) while keeping existing water avoidance and attack timing/damage unchanged.
- **JSON validity hotfix (Piglin behaviour):** Fixed an invalid inline comment in `BOB_behaviors/entities/nether_mobs/piglin.json` that broke JSON parsing, and completed `broadcast_targets` with both `"piglin"` and `"piglin_brute"` as originally intended.

**Bugs:**
- Currently the back packs don't work properly and duplicate items
