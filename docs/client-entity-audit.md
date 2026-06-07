# Client entity behaviour audit

## Scope

Reviewed custom `better_on_bedrock:*` client entities under `BOB_resources/entity` against behaviour entity identifiers under `BOB_behaviors/entities`.

## Behaviour coverage

All retained custom client entity identifiers now have a matching behaviour entity, except the intentionally retained client-only helpers listed below.

| Client-only identifier | Resource file | Reason retained without behaviour |
| --- | --- | --- |
| `better_on_bedrock:2` | `BOB_resources/entity/boss/2.entity.json` | Legacy ice-block visual helper for the Frostaeris/Iceologer asset set. The active behaviour-backed ice-block helpers are `better_on_bedrock:iceologer_iceblock_fall`, `better_on_bedrock:iceologer_iceblock`, `better_on_bedrock:ice_block_fall`, and `better_on_bedrock:wand_iceologer_iceblock`. |
| `better_on_bedrock:staff_projectile` | `BOB_resources/entity/staffs/staff_projectile.entity.json` | Legacy staff projectile visual helper kept for resource-pack compatibility. The behaviour-backed staff projectile currently used by the pack is `better_on_bedrock:flame_fireball`. |

## Restored behaviour identifiers

Added behaviour-side definitions for the previously resource-only player-facing or summonable entities `piglin_trader`, `baby_ghast`, `cassowary`, `chorus_crunch`, `corrupted_villager`, `cured_villager`, `test_piglin`, `wraith`, `hollow`, `illusioner`, `cow`, `geomancer`, and `poggy`.

Corrected the Flender phase-two behaviour identifier from `better_on_bedrock:fire_places` to `better_on_bedrock:fire_place` so it matches both the client entity and the existing transform target.

## Texture reference check

Every `textures/...` value found in retained custom client entities under `BOB_resources/entity` resolves to an existing texture file under `BOB_resources/textures` when checked with `.png`, `.tga`, `.jpg`, and `.jpeg` extensions.
