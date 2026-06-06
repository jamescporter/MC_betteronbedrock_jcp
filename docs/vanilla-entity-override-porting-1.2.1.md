# Vanilla entity override port audit for BOB 1.2.1

This audit records the entity overrides checked while aligning the custom BOB branch with the updated 1.2.1 behaviour pack. The 1.2.1 source pack uses the same behaviour pack `min_engine_version` as this branch (`1.21.120`), so the updated entity definitions were treated as compatible with the current Bedrock engine target rather than blindly replacing them without a compatibility check.

## Compatibility re-check

Implementation status: **static validation complete; in-game validation still requested**.

- The branch behaviour manifest and the imported 1.2.1 behaviour source both target Bedrock `min_engine_version` `1.21.120`.
- The reviewed entity files parse as JSONC after comment stripping.
- `git diff --check` reports no whitespace errors.
- The current entity files now match the 1.2.1 source files exactly, except for the intentional bee additions that preserve BOB custom flower feed/breed support.
- All BOB custom flower and wild-carrot identifiers retained in bee interactions have matching BOB item/block definitions in this branch.
- Event/component-group reference checks did not identify any new missing group references introduced by the port. The remaining `collect_nectar` and `minecraft:ocelot_leashed` removals are inherited unchanged from the 1.2.1 source and old branch baselines.

## Per-file decisions

| Entity file | Override shape | Review notes | Decision |
| --- | --- | --- | --- |
| `entities/vanilla/bee.json` | Full vanilla override with BOB flower integration. | Ported the 1.2.1 bee baseline, including the newer vanilla flower item names, `wildflowers`, `cactus_flower`, growth pause/reset items, offspring mapping, spawn egg interaction, updated breeding syntax, updated navigation/AI/despawn behaviours, and current hive/pollination behaviour. Retained the BOB custom flowers in bee age-up and breeding lists so BOB flora still participates in bee breeding and growth interactions. | **Partially cherry-picked**: 1.2.1 baseline plus retained BOB custom flower compatibility. |
| `entities/vanilla/chicken.json` | Full vanilla override with BOB enchanted spawn hook. | Ported the 1.2.1 baseline, including spawn category, spawn egg interaction, offspring mapping, refreshed breeding/feed items, split pushable components, leash/balloon support, despawn behaviour, and retained BOB enchanted spawn property/event wiring. | **Ported**. |
| `entities/vanilla/cow.json` | Full vanilla override with BOB cow variants and enchanted spawn hook. | Ported the 1.2.1 baseline, including spawn category, spawn egg interaction, offspring mapping, refreshed breeding/feed items, split pushable components, leash/balloon support, despawn behaviour, and retained BOB cow type and enchanted event wiring. | **Ported**. |
| `entities/vanilla/husk.json` | Full hostile vanilla override with BOB enchanted spawn hook. | Extra review completed because this was the largest apparent diff. Ported the 1.2.1 baseline rather than cherry-picking small pieces because the change set is internally coupled: new adult/baby rider hierarchy, jockey passenger definitions, spawn category, spawned-event family additions, reinforced targeting/attack goals, updated transformation/conversion handling, equipment/loot hooks, despawn handling, inherited pushable configuration, and retained BOB enchanted spawn logic. | **Ported**. |
| `entities/vanilla/ocelot.json` | Full vanilla override. | Ported the 1.2.1 baseline, including spawn category, spawn egg interaction, offspring mapping, refreshed trust/breeding items, split pushable components, leash/balloon support, and despawn behaviour. No BOB-specific custom hooks were present in this override. | **Ported**. |
| `entities/vanilla/pig.json` | Full vanilla override with BOB enchanted spawn hook. | Ported the 1.2.1 baseline, including spawn category, spawn egg interaction, offspring mapping, refreshed breeding/feed/tempt items, rideable updates, split pushable components, leash/balloon support, despawn behaviour, and retained BOB enchanted spawn logic. | **Ported**. |
| `entities/vanilla/polar_bear.json` | Full vanilla override. | Ported the 1.2.1 baseline, including spawn category, spawn egg interaction, offspring mapping, baby collision scaling, leash/balloon support, split pushable components, and despawn behaviour. No active BOB event/property hooks were present in this override. | **Ported**. |
| `entities/vanilla/rabbit.json` | Full vanilla override with BOB enchanted spawn hook. | Ported the 1.2.1 baseline, including spawn category, spawn egg interaction, offspring mapping, refreshed breeding/feed/tempt items, updated jump/raid-garden behaviour, split pushable components, block climber, despawn behaviour, and retained BOB enchanted spawn logic. | **Ported**. |

## In-game testing requested

Please validate the following in a Bedrock 1.21.120-compatible world with this BOB branch loaded:

1. Natural spawning for bee, chicken, cow, husk, ocelot, pig, polar bear, and rabbit in their expected biomes and light conditions.
2. Manual spawn egg spawning for each reviewed entity.
3. Basic damage handling for each entity, including player damage, environmental damage, and any expected retaliation or panic behaviour.
4. Death drops and equipment/loot output, with extra attention to husk loot and chicken/cow/pig/rabbit food drops.
5. Breeding, growth, taming, trusting, tempting, and riding where relevant:
   - bee growth/breeding with vanilla flowers and BOB flowers;
   - chicken, cow, pig, and rabbit breeding/growth;
   - ocelot trust interactions;
   - pig riding with saddle/carrot-on-a-stick;
   - polar bear adult/baby aggression behaviour.
6. BOB system interactions, especially enchanted spawn events, cow variant selection, BOB custom flower interactions with bees, and any script systems that react to hit/death/entity-spawn events.
7. Husk-specific checks: natural desert spawning, spawn eggs, baby/adult variants, jockey/rider combinations, sun resistance, underwater zombification/conversion, targeting, melee attacks, death drops, and despawn behaviour.
