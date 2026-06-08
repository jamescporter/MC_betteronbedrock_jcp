# Client entity behaviour proposal notes

## Context

The previous client-entity audit implementation has been reverted. These notes keep the proposal in `dev/` for review before any behaviour-pack or resource-pack changes are reapplied.

The original audit target was custom `better_on_bedrock:*` client entities under `BOB_resources/entity`. The goal was to decide whether each retained client entity should have a matching behaviour entity under `BOB_behaviors/entities`, or whether it should be explicitly documented as a client-only helper.

## Proposed approach

1. Re-run a static identifier audit that extracts `better_on_bedrock:*` identifiers from `BOB_resources/entity` and `BOB_behaviors/entities`.
2. Split missing behaviour matches into three categories:
   - definitely needs a real behaviour port or restoration;
   - probably client-only helper, to document only;
   - uncertain, requiring source-of-truth review or gameplay decision.
3. For player-facing entities, prefer restoring/porting the original behaviour from a known source over creating new stub behaviours.
4. Only create minimal behaviour stubs when the project owner confirms that placeholder gameplay is acceptable.
5. Verify texture references independently; this can remain a static file-existence check because it does not require gameplay design decisions.
6. Update language keys and spawn eggs only after identifier decisions are final.

## Decisions and assumptions to review

| Area | Previous proposed decision | Why it was proposed | Review concern |
| --- | --- | --- | --- |
| Behaviour restoration strategy | Add minimal behaviour definitions for resource-only entities. | It satisfied identifier coverage quickly. | This may create incorrect gameplay. Prefer proper source restoration where possible. |
| Scope | Resolve every non-documented resource-only custom entity, not only the listed mobs. | The audit requirement said every `better_on_bedrock:*` client entity should be checked. | Some extra entities may be obsolete, test-only, or deliberately disabled. |
| Spawnability | Mark most new behaviour entities as spawnable and summonable. | Their client definitions had spawn-egg data or appeared player-facing. | This can expose test/internal mobs in normal gameplay. |
| Runtime identifiers | Use similar vanilla runtime identifiers such as piglin, ghast, vindicator, villager, or cow. | Vanilla runtimes can provide baseline compatibility. | Runtime identifiers influence Bedrock internals and may be mechanically wrong. |
| Hostile/passive classification | Classify mobs by name and visual intent. | Names such as `wraith` and `corrupted_villager` suggest hostile mobs; names such as `cured_villager` suggest passive mobs. | This is inference, not source-backed behaviour design. |
| Poggy | Add a lightweight boss stub with phase events and variant hooks. | Existing scripts and animation controllers reference `better_on_bedrock:poggy`. | A stub is not a real boss implementation and risks breaking encounter design. |
| Flender phase two | Rename the behaviour identifier from `better_on_bedrock:fire_places` to `better_on_bedrock:fire_place`. | The visible client entity and transformation target use `fire_place`. | Any hidden plural references would break; search coverage should be repeated before changing it. |
| Client-only helpers | Document `better_on_bedrock:2` and `better_on_bedrock:staff_projectile` as client-only helpers. | They appeared to be legacy visual/helper entities with behaviour-backed alternatives. | This should be confirmed against scripts, functions, items, and animation controllers. |
| Language keys | Add only missing English keys for `baby_ghast`, `wraith`, and `test_piglin`. | Other touched identifiers already had keys. | `test_piglin` may not deserve player-facing language if it remains test-only. |

## Necessity table

| Proposed change | Actually necessary now? | Recommended next action |
| --- | --- | --- |
| Revert the previous implementation commit | Yes | Done before creating these notes. |
| Move development notes and tooling into `dev/` | Yes | Done as repository organisation work. |
| Keep a review document for the client-entity proposal | Yes | Use this file as the review source before changing pack data again. |
| Static audit of custom client identifiers against behaviour identifiers | Yes | Keep and rerun as a non-invasive check. |
| Static texture-reference resolution check | Yes | Keep as a non-invasive check. |
| Add/restore behaviour for `piglin_trader` | Probably | Confirm intended trading/neutral behaviour or find the original behaviour before implementation. |
| Add/restore behaviour for `baby_ghast` | Probably | Confirm whether it is a real mob, projectile helper, or unused asset before implementation. |
| Add/restore behaviour for `wraith` | Probably | Confirm intended AI, spawn source, drops, and hostile behaviour before implementation. |
| Add/restore behaviour for `cassowary` | Probably | Confirm intended passive/hostile behaviour, drops, and spawning before implementation. |
| Add/restore behaviour for `chorus_crunch` | Probably | Confirm original End mob behaviour before implementation. |
| Add/restore behaviour for `corrupted_villager` | Probably | Confirm whether it should be an illager-style hostile, conversion stage, or scripted entity. |
| Add/restore behaviour for `cured_villager` | Probably | Confirm whether it should be a real villager, conversion reward, or visual-only state. |
| Add/restore behaviour for `test_piglin` | Unclear | Decide whether this is player-facing, test-only, or should be removed/documented. |
| Add behaviour for `cow` | Unclear | Determine whether this custom `better_on_bedrock:cow` is still used or should be replaced by vanilla/custom cow override logic. |
| Add behaviour for `geomancer` | Unclear | Resolve duplicate client identifiers first, then determine the correct boss/misc behaviour source. |
| Add behaviour for `hollow` | Unclear | Confirm whether this mob is intended for current gameplay or is a leftover asset. |
| Add behaviour for `illusioner` | Unclear | Confirm whether this should be restored as a full hostile mob or left disabled. |
| Add behaviour for `poggy` | Unclear/high risk | Do not add a stub; restore the real boss behaviour or leave documented pending review. |
| Change `fire_places` to `fire_place` | Likely, but verify first | Search scripts, functions, animations, loot, structures, and commands for both identifiers before changing. |
| Document `better_on_bedrock:2` as client-only | Probably | Confirm no runtime spawn/reference exists, then document. |
| Document `better_on_bedrock:staff_projectile` as client-only | Probably | Confirm current staff logic uses another behaviour-backed projectile, then document. |
| Add language keys for missing entities | Only after entity decisions | Add keys only for entities that remain player-facing and spawnable. |
| Add spawn eggs or expose spawnable flags | Only after entity decisions | Avoid exposing test/internal entities until confirmed. |

## Open questions

1. Do we have an authoritative source for the missing behaviours, such as an upstream release, old branch, or extracted `.mcaddon`?
2. Which of the missing client entities are genuinely player-facing mobs, and which are old test assets?
3. Should `test_piglin` be restored, documented as test-only, or removed from player-facing resource/language data?
4. Should `poggy` be restored as a full boss, renamed/replaced, or left disabled until the future `poggy` naming decision is made?
5. Are `better_on_bedrock:2` and `better_on_bedrock:staff_projectile` ever spawned by functions, scripts, items, animation controllers, structures, or commands?
6. Should missing behaviour entities be implemented only from source material, or are simple placeholder behaviours acceptable for any entities?
7. If placeholder behaviours are acceptable, what minimum gameplay contract should they satisfy: health, drops, families, spawn rules, sounds, trades, attacks, and despawn rules?
8. Which language files should receive new keys beyond `en_GB` and `en_US` when identifiers are finalised?

## Suggested next review workflow

1. Run the identifier audit and produce a fresh missing-match list.
2. For each missing identifier, search all scripts, functions, animation controllers, items, loot tables, structures, and language files.
3. Compare against any available upstream/source behaviour data.
4. Decide per entity: restore, implement placeholder, document client-only, remove client entity, or defer.
5. Apply changes in small PRs grouped by confidence:
   - documentation/static audit only;
   - obvious identifier mismatch fixes;
   - restored source-backed behaviours;
   - owner-approved placeholder behaviours.
