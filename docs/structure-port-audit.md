# v1.2.1 structure port audit

This audit covers the final Bedrock `.mcstructure` files reviewed while aligning the custom BOB behaviours with v1.2.1. The structures were not approved from file size or binary differences alone: each current-main file and its v1.2.1 counterpart was parsed as Bedrock little-endian NBT, compared for dimensions, block palette and state coverage, entity payloads, block entities/containers, loot-table strings, command strings, jigsaw/template assumptions, and matching worldgen/template/processor JSON references. The same NBT comparison was run before and after copying to confirm the reviewed v1.2.1 payloads are now the active custom-branch payloads.

In-game placement was not available in this container because there is no Bedrock Dedicated Server or Minecraft Bedrock client/runtime present. The decisions below therefore rely on NBT inspection plus JSON reference checks; none of the files are blocked for lack of NBT evidence.

| Structure | Decision | Evidence |
| --- | --- | --- |
| `structures/overworld/battle_tower.mcstructure` | Ported from v1.2.1 | Dimensions and palette length remain `[23, 58, 23]` and `115`; block entity counts and loot references match, including 16 trial spawners, 12 vaults, 13 chests, battle-tower floor loot, and trial-chamber reward/key/consumable tables. The v1.2.1 entity payload removes 71 saved `minecraft:item` entities from the custom file and keeps the intended `better_on_bedrock:goblin_trader` entity. Worldgen references match `pog:overworld/battle_tower` and `better_on_bedrock:battle_tower`. |
| `structures/overworld/goblin_house.mcstructure` | Ported from v1.2.1 | Dimensions remain `[10, 8, 9]`; the command block still runs `function spawn_goblin`; containers remain barrel/chest/bed/furnace/campfire based, while v1.2.1 adds the candle palette entry and removes one extra chest block entity from the current file. The `pog:overworld/goblin_house` template pool, processor, and structure references match. |
| `structures/overworld/goblin_outpost.mcstructure` | Ported from v1.2.1 | Dimensions remain `[9, 14, 9]`; block entity counts stay aligned for jigsaw, item frame, furnace, chest, barrel, and beds. The v1.2.1 jigsaw now targets the matching `pog:goblin_outpost/decoration` pool used by the JSON instead of the stale `pog:overworld/goblin_outpost_decoration` pool string. |
| `structures/overworld/pillager_ship.mcstructure` | Ported from v1.2.1 | Dimensions, 142-entry palette, block entities, loot-table references, and entity count match. The only parsed NBT differences were four vault `state_updating_resumes_at` values present in the current file and absent in v1.2.1, so the v1.2.1 file was ported to remove volatile captured runtime state while retaining the same structure content and `pog:overworld/pillager_ship` references. |
| `structures/overworld/vindicator_house.mcstructure` | Ported from v1.2.1 | Dimensions remain `[17, 16, 14]`; two paintings and the vindicator-house loot table are retained. v1.2.1 removes an embedded `StructureBlock` block entity and replaces legacy/custom spruce log palette names with the current `better_on_bedrock:spruce_small_log` palette usage while preserving matching `pog:overworld/vindicator_house` references. |
| `structures/swamp_village/buildings/swamp_fishman.mcstructure` | Ported from v1.2.1 | Dimensions remain `[18, 16, 25]`; sign, bed, chest, barrel, beehive, and bookshelf counts remain stable. v1.2.1 adds the expected flower pot/music/crafting palette content and changes the jigsaw from stale `swamp_buildings`/`minecraft:empty` assumptions to the entrance connector `pog:building_entrance`, matching the swamp-village building-pool placement model. |

## Reference checks

The following JSON references were checked against both `BOB_behaviors` and `v1.2.1_src_only/behaviors` and matched byte-for-byte before the structure files were approved:

- `worldgen/template_pools/battle_tower.json`, `worldgen/processors/overworld/battle_tower.json`, and `worldgen/structures/overworld/battle_tower.json`.
- `worldgen/template_pools/goblin_house.json`, `worldgen/processors/overworld/goblin_house.json`, `worldgen/structures/overworld/goblin_house.json`, and the goblin-outpost main pool reference to the goblin-house processor.
- `worldgen/template_pools/goblin_outpost/main.json`, `worldgen/template_pools/goblin_outpost/decoration.json`, `worldgen/processors/overworld/goblin_outpost.json`, and `worldgen/structures/goblin_outpost/goblin_outpost.json`.
- `worldgen/template_pools/overworld/pillager_ship.json` and `worldgen/structures/overworld/pillager_ship.json`.
- `worldgen/template_pools/vindicator_house.json` and `worldgen/structures/overworld/vindicator_house.json`.
- `worldgen/template_pools/swamp_village/buildings/houses.json`.
