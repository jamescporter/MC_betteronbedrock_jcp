# Release notes

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