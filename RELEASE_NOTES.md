# Release notes

## v1.2.1-JCP

### Ported v1.2.1 updates

- **Direct v1.2.1 behaviour ports:** Copied the low-risk 1.2.1 behaviour data updates into the main BOB pack, including the guidebook recipe, crop/farmable tags, the local pedestal selector, the void-block tick interval, and small orange-tree/goblin/well-dungeon worldgen template tweaks.
- **Manifest/version alignment:** Updated behaviour and resource manifests to version `1.2.1` and aligned their pack dependency versions while keeping the current branch's script API dependencies.
- **Fire-resistant material items:** Added fire resistance to Stardust/Corstinite material items so they match the intent of the existing fire-resistant armour/tool tier.
- **Stardust/Corstinite item schema alignment:** Ported v1.2.1 item format/menu-group metadata for armour and Stardust tools while preserving the current branch's custom tool durability component wiring.
- **Hit-event safety guards:** Adapted the 1.2.1 invalid-entity guards for the current branch's `isValid()` API style in entity hit/hurt event handling.
- **Still deferred:** Broad script rewrites, entity rewrites, binary structures, goblin-trader economy changes, the Enderman/Shulker source-only overrides, and the Stardust Block item remain review-only because the current branch has divergent fixes or gameplay decisions.

### Gameplay, command, and UI fixes

- **WAWLA growth accuracy fix:** Crop growth stage is now clamped to the configured max before calculating the displayed growth percentage, preventing out-of-range values from producing incorrect percentages.
- **WAWLA harvestability display fix:** Fully grown crops are now treated as harvestable in the WAWLA display branch even when other farmability heuristics do not flag them.
- **WAWLA farmable tag fallback:** The `better_on_bedrock:is_farmable` block tag is now honoured as a fallback harvestability signal.
- **WAWLA wording update:** The user-facing `bob.gui.wawla.canHarvest` text now reads **“Ready to Harvest”** (key wiring kept stable).
- **Guidebook command ported from v1.2.1 source:** Added runtime custom command registration for `/guidebook` via `customCommandRegistry` during world initialisation.
- **Survival-safe command behaviour:** `/guidebook` is available at permission level `Any` with `cheatsRequired = false`, and grants one `better_on_bedrock:guide_book` to the executing player (dropping overflow at player location if inventory is full).
- **Command localisation:** Added `command.better_on_bedrock.common.guidebook.description` in active English language files so command help/description resolves correctly.
- **Guide Book purpose:** The Guide Book is the in-game onboarding/reference item for Better on Bedrock systems, intended to help players understand mechanics, progression, and general add-on usage.

### Entity/resource duplicate clean-up

- **End Seeker placeholder isolated:** The old End-mobs Seeker duplicate is now a disabled `better_on_bedrock:end_seeker` placeholder, keeping `better_on_bedrock:seeker` reserved for the boss encounter.
- **Geomancer boss placeholder isolated:** Renamed the boss-side Geomancer placeholder to `better_on_bedrock:geomancer_boss_placeholder`, backed it with a non-spawnable behaviour stub, and pointed its client resource at defined placeholder-safe assets so it cannot override the real misc Geomancer client entity.
- **Poison ball canonical behaviour:** Kept `BOB_behaviors/entities/projectiles/poison_ball.behavior.json` as the canonical poison ball projectile behaviour and removed the duplicate end-mobs behaviour file.

### Documentation and audit notes

- **Repo wiki started:** Added an initial single-page wiki (`wiki.md`) containing the first Guide Book entry (description, purpose, behaviour, and obtainment routes).
- **Development index added:** Added `DEVELOPMENT_INDEX.md` to track partially made, disabled, deferred, and development-only areas of the fork.
- **README tidied:** Reduced README changelog detail, moved release-note content into this file, and linked the wiki/development index from the project overview.
- **Resin Candy boots note (non-applicable):** Verified across both JCP pack paths and `v1.2.1_src_only` source paths that no wearable/attachable **Resin Candy boots** item exists (only `better_on_bedrock:resin_candy` food plus non-wearable Resin items such as shard/dagger), so the related 1.2.1 texture-binding release note is non-applicable to this fork.

## Bedrock 1.26.21.1 compatibility fix

BOB now registers custom block/item components through a startup compatibility bridge. The bridge first uses `system.beforeEvents.startup` when available, and falls back to `world.beforeEvents.worldInitialize` on the currently pinned script API. This avoids forcing a full Scripting V2 migration while preserving custom component registration on newer Bedrock Dedicated Server builds.

The behaviour pack intentionally keeps the existing `@minecraft/server` dependency for now. A future Scripting V2 migration should be handled as a separate branch because it may require broader script changes, especially around entity validity checks, custom commands, and early-execution behaviour.

### Fixed

- Fixed BOB script startup on Bedrock Dedicated Server 1.26.21.1 by adding a compatibility bridge for custom component registration.
- Restored registration of `pog:*`, `kai:*`, and `content:*` custom components without upgrading the manifest script API dependency.
- Prevented the downstream component-not-registered warning cascade caused by startup registration failing before custom block/item components were registered.

### Deferred

- Full Scripting V2 migration remains deferred. The current bridge preserves compatibility without requiring immediate broad changes to script API usage.

## Sound reference fixes (2026-06-07)

- Corrected missing custom sound references for the enchanter, flender, quiet ambient hook, and withered samurai definitions.
- Fixed a `sound/entity/...` typo so the samurai idle definition now points at the existing `sounds/entity/...` asset path.

## Behaviour JSON revert (2026-05-20)

- Reverted `BOB_behaviors` JSON content to match `old_json/BOB_behaviors`.
- `BOB_resources` was intentionally left unchanged.
- Outcome: behaviour JSON is now in the requested state.

### Fixed

- Fixed Stardust axe, hoe, pickaxe, shovel, and sword item parsing on Bedrock 1.26.21.1 by replacing deprecated `minecraft:custom_components` item syntax with flattened `pog:tool_durability` component entries.
- Fixed BOB script startup failure caused by unavailable `CommandPermissionLevel` export in `@minecraft/server`.
- Restored BOB custom component registration during startup, resolving downstream `pog:* component was not registered` warnings caused by the Guide Book command import failure.

### Deferred

- Full Scripting V2 migration remains deferred. Do not upgrade the manifest `@minecraft/server` dependency as a drive-by fix; handle it later as a dedicated pass with in-game smoke tests.

## v1.2.0-JCP

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
