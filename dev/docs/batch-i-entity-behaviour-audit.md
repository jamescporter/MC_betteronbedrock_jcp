# Batch I entity behaviour 1.2.1 audit

## Scope and script cross-check

Reviewed the requested Batch I entity behaviours against `v1.2.1_src_only/behaviors` and the current branch versions under `BOB_behaviors`. The review covered event names, component groups, timers, projectiles, target selectors, loot declarations, death events, helper cleanup, and script-triggered hooks.

Relevant script dependencies under `scripts/functionality/entities/` were cross-checked before choosing ports:

- `inferior.js` depends on `better_on_bedrock:inferior`, the `bob:inferior_active` spawn tag, and the `pog:is_on_ground` property for the landing shockwave.
- `seeker_teleport.js` depends on `better_on_bedrock:seeker`, `better_on_bedrock:seeker_launcher`, `better_on_bedrock:player_dummy_seeker`, and the active tags `bob:seeker_active`, `bob:seeker_launcher_active`, and `bob:seeker_dummy_active`.
- `seeker.js` reads `better_on_bedrock:seeker` variants for beam damage, debuffs, and knockback.
- `soot_eye.js` reads `better_on_bedrock:soot_eye`, `better_on_bedrock:soot_eye_beam`, and `better_on_bedrock:soot_yeet`; it relies on the current branch's corrected separate beam lookup and guarded knockback.
- `entity_helpers.js` remains the current branch compatibility layer for guarded entity validity, teleport, and knockback calls used by these scripts.

## Per-file decisions

| Entity file | Decision | Audit notes |
| --- | --- | --- |
| `entities/bosses/inferior/inferior.behavior.json` | Partially cherry-picked | Kept the current branch `bob:inferior_active` spawn tag because the cached Inferior script scan uses it as a performance and safety guard. Also corrected stale component-group removals so melee switching and flame-beam randomisation remove the existing ranged/flame/aura groups rather than missing names. Timers, projectile references, target selectors, loot, and death behaviour otherwise remain aligned with the reviewed 1.2.1 behaviour. |
| `entities/bosses/player_dummy_seeker.behavior.json` | Retained | Kept the `bob:seeker_dummy_active` spawn tag because seeker dummy following in `seeker_teleport.js` is tag-filtered. No 1.2.1 gameplay fix outweighed that script contract. |
| `entities/bosses/seeker/seeker.behavior.json` | Retained as canonical boss | Kept the `bob:seeker_active` spawn tag for the boss script filtering. The randomised boss component groups and variant-driven beam script hooks were checked together with the launcher and dummy behaviours. |
| `entities/bosses/seeker/seeker_launcher.behavior.json` | Retained | Kept the `bob:seeker_launcher_active` spawn tag while retaining the 1.2.1 launch particles and despawn timer. The misspelt internal `despawm` event and `stugg` component-group names are intentionally unchanged because the timer references match. |
| `entities/bosses/willager/willager_clone.behavior.json` | Partially cherry-picked | Ported the 1.2.1 clone scale and fixed the previously empty spell summon entity to the valid Bedrock `minecraft:silverfish` identifier. Retained current-main target expansion for players, golems, wandering traders, and adult villagers because it is a branch gameplay priority rather than a 1.2.1 bug fix. |
| `entities/end_mobs/end_seeker.behavior.json` | Placeholder | Renamed away from `better_on_bedrock:seeker` to `better_on_bedrock:end_seeker`, disabled normal spawning/summoning, and made it instantly despawn if loaded. This keeps the file as a future End-mob placeholder without interfering with the canonical Seeker boss. |
| `entities/end_mobs/soot_collector.behavior.json` | Retained | Kept current branch summon scoping, bounded rider selection, death cleanup for Soot helpers, and slower timers. The 1.2.1 unbounded `@e[type=better_on_bedrock:soot_collector]` command forms and removed cleanup were not ported because current-main scoping is safer in multi-entity encounters. |
| `entities/nether_mobs/bassalt_crobber.behavior.json` | Retained | Retained current target priorities, incomplete-path melee behaviour, and navigation damage-block avoidance. These preserve current-main targeting/performance/safety behaviour; the 1.2.1 priority reshuffle did not fix a clear bug. |
| `entities/nether_mobs/fire_wisp.behavior.json` | Retained | Kept the current-main custom Fire Wisp scale and `1.06` by `1.06` custom hit-test box by request. The 1.2.1 smaller hitbox/scale change is not ported; events, component groups, target selectors, loot, and death behaviour remain unchanged. |
| `entities/nether_mobs/piglin.json` | Retained | Retained the current branch anger broadcast targets for both `piglin` and `piglin_brute`. The 1.2.1 source removes `piglin_brute` while commenting that both should be broadcast to, so the current branch is the safer and more internally consistent behaviour. |

## Gameplay testing status

Static review and JSON/JSONC validation are complete. Mark the following as **blocked on gameplay testing** before considering the Batch I entity set fully verified in-world:

1. Seeker boss encounter: launcher knockback, dummy tracking, boss teleports, all randomised attack component groups, projectile cleanup, and death/despawn cleanup.
2. End Seeker placeholder: replace the disabled `better_on_bedrock:end_seeker` stub with real End-mob behaviour, resources, language keys, and spawn references only if future design requires it.
3. Soot Collector: eye/beam/yeet helper spawning, rider attachment, helper cleanup on death, and script-applied damage/knockback.
4. Inferior: active tag filtering, ranged/melee mode switching, fire aura particle event, and landing shockwave damage.
5. Willager clone: visual scale, spell summon behaviour with `minecraft:silverfish`, and retained non-player target selection.
6. Bassalt Crobber, Fire Wisp, and Piglin: targeting, melee/ranged feel, hitbox feel, death drops, and anger broadcasts.
