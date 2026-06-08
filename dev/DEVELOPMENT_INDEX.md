# Development index

This index tracks partially made, disabled, deferred, or development-only parts of the Better on Bedrock JCP fork. It is intended to make future audits easier without treating every unfinished area as a release blocker.

## Status legend

- **Placeholder** — intentionally isolated and not part of normal gameplay yet.
- **Deferred** — known work that should be handled in a dedicated pass.
- **Known bug** — confirmed issue that needs investigation or a fix.
- **Review-only** — source/content exists elsewhere or was considered, but should not be ported without manual review.

## Development and deferred areas

| Feature/system | Identifier or path | Status | Why it is tracked | Next action | Notes/risk |
| --- | --- | --- | --- | --- | --- |
| End Seeker | `better_on_bedrock:end_seeker`; `BOB_behaviors/entities/end_mobs/end_seeker.behavior.json` | Placeholder | The former duplicate Seeker behaviour has been isolated so `better_on_bedrock:seeker` remains the boss identifier. | Decide whether a separate End mob is actually needed; if yes, add proper behaviour, client resource, language keys, spawn rules, and structure/loot references. | Currently disabled and instantly despawns when spawned. |
| Geomancer boss placeholder | `better_on_bedrock:geomancer_boss_placeholder`; `BOB_behaviors/entities/bosses/geomancer_boss_placeholder.behavior.json`; `BOB_resources/entity/boss/geomancer_boss_placeholder.entity.json` | Placeholder | The old boss-side Geomancer client entity conflicted with the real misc Geomancer resource identifier. | Decide whether the boss should become a full encounter; if yes, add complete behaviour, assets, loot, language keys, and spawn/structure routing. | Non-spawnable via spawn egg and uses placeholder-safe resources. |
| Scripting V2 migration | `BOB_behaviors/scripts/`; behaviour manifest script dependencies | Deferred | Current compatibility work preserves the existing script API dependency rather than upgrading the whole scripting surface. | Handle as a dedicated branch with in-game smoke tests. | May require wider changes around entity validity checks, custom commands, component registration, and early-execution behaviour. |
| Broad script rewrites | `BOB_behaviors/scripts/` | Deferred | Large script rewrites were intentionally not folded into the current low-risk v1.2.1 port. | Review system by system and keep changes small enough to test. | Higher risk of subtle gameplay regressions. |
| Broad entity rewrites | `BOB_behaviors/entities/`; `BOB_resources/entity/` | Deferred | Entity definitions have divergent local fixes and duplicated/stale history. | Audit by family/encounter and verify behaviour/resource pairing before porting or rewriting. | Requires in-game validation because static JSON checks cannot prove gameplay correctness. |
| Binary structure ports | `BOB_behaviors/structures/`; `v1.2.1_src_only` structure sources where present | Review-only | Binary structures were not blindly copied as part of the low-risk v1.2.1 update. | Compare intended structure changes manually before porting. | Binary diffs are hard to review and can hide placement/loot/spawner changes. |
| Goblin Trader economy | Goblin trader behaviour, loot, trade, and script paths | Deferred | Economy changes can affect progression balance and were left for a focused balancing pass. | Review trades, values, and progression impact together. | Balance changes should be tested in survival progression. |
| Enderman/Shulker source-only overrides | Source-only override paths from v1.2.1 review | Review-only | These were not ported because the current branch has divergent entity fixes/gameplay decisions. | Re-evaluate against current entity definitions before adding. | Blind ports could overwrite local compatibility or behaviour fixes. |
| Stardust Block item | Stardust block/item paths from the v1.2.1 review | Review-only | The item remains review-only due to branch divergence and gameplay decisions. | Confirm whether the item should exist in this fork, then add behaviour/resource/lang entries consistently. | Could create recipe, inventory, or block/item pairing issues if added partially. |
| Backpack duplication | Backpack entity/item/script paths | Known bug | README history notes that backpacks do not currently work properly and can duplicate items. | Reproduce in-game, identify the persistence/inventory path, then fix with regression checks. | Inventory duplication is high impact for survival balance. |
| Remaining `poggy` naming | Project-wide identifiers/text/assets using legacy naming | Deferred | The fork has not yet chosen a replacement namespace/name for all remaining references. | Rename only after a final namespace/name is decided. | Namespace changes require full reference sweeps across behaviour, resources, scripts, text, sounds, particles, and structures. |

## Maintenance checklist

When adding a new partially made feature, update this file with:

1. the feature name and identifier/path,
2. whether it is a placeholder, deferred, known bug, or review-only item,
3. why it is not complete yet,
4. the next concrete action needed,
5. any gameplay, compatibility, or review risks.
