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

- **Performance and scalability:** per-tick and high-frequency scripts were refactored to reduce repeated work, improve caching, and lower runtime overhead.
- **Bug fixes and hardening:** Lots of defensive fixes addressung malformed data handling, null/unsafe state access, duplicate triggers, and cleanup edge cases.
- **Item/combat system stability:** backpacks, staffs, spear/trident logic, strip-block interactions, and related item systems were made more robust while preserving existing functionality.
- **Quest flow:** regular, bounty, and bought-quest paths were tightened with safer parsing/selection logic, better reconciliation, and duplicate-state normalisation.
- **Entity and ambience updates:** Seeker/Inferior and supporting end-mob logic were adjusted, alongside ambient and fog behaviour refinements for more consistent world state transitions.
- **Gameplay balancing and maintenance:** trader values received light balance tuning so he's not as OP.
- **Nether combat feel update:** Fire Wisps now have a ~33% larger custom hitbox and a slight scale increase, making them less frustrating to hit without changing their core behaviour.
