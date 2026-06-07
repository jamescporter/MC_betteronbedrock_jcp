# Full pack v1.2.1 port audit

This audit extends the behaviour-only review to cover both active packs:

- `v1.2.1_src_only/behaviors` compared with `BOB_behaviors`.
- `v1.2.1_src_only/resources` compared with `BOB_resources`.

It is a static file/content audit. It confirms that remaining differences are either ported, intentionally retained current-branch changes, or reviewer-assumed structure work; it does not replace in-game smoke-testing.

## Overall result

| Pack | Source-only files | Same-path byte differences after this pass | Open porting decisions |
| --- | ---: | ---: | ---: |
| Behaviour pack | 2 | 100 | 0 |
| Resource pack | 0 | 35 | 0 |

The two behaviour source-only files are not open work: `entities/vanilla/shulker.json` was previously cherry-picked into the active Shulker behaviour, and `items/ingots/stardust/stardust_block.json` remains intentionally unported because the active Stardust Block is already represented as a block-backed item.

## Behaviour-pack recheck

The behaviour-pack audit remains complete. The remaining byte differences are already accounted for by existing decisions:

- Current-branch script adaptations preserve API compatibility, performance improvements, safety guards, and current subsystem rewrites instead of reverting to the v1.2.1 source scripts.
- Pale tall-plant files retain the current branch's double-plant/custom-component placement choices.
- Backpack entities and backpack scripts retain the safer current-main inventory/storage lifecycle while restoring the reviewed v1.2.1 component-group shape where needed.
- Boss, End, Nether, and complex-mob entity differences are documented retained or partial cherry-picks.
- Vanilla entity overrides are either exact v1.2.1 ports or documented partial cherry-picks, such as Bee retaining BOB custom flower compatibility.
- Stardust tool item files keep the branch's `minecraft:custom_components` wiring for `pog:tool_durability`, rather than the older inline component form.
- The behaviour manifest keeps the branch's script API dependency versions, as documented in the project README.
- `trading/goblin-trade-table.json` remains a deliberate economy retention.
- `worldgen/structures/cherry_village/cherry_village.json` keeps the branch-compatible object form for `max_distance_from_center`.
- The six `.mcstructure` files are treated as complete because Task N is assumed done by reviewer instruction.

No additional unlisted behaviour source-only files or same-path behaviour changes were found that need action.

## Resource-pack changes made in this pass

The resource recheck did find unlisted work, and it has now been addressed:

- Ported the v1.2.1 vanilla client-entity/render-controller set for Chicken, Cow, Drowned, Husk, Pig, Rabbit, and Zombie so the resource pack matches the already-reviewed vanilla behaviour override ports.
- Ported the v1.2.1 armour/wearable attachable updates for Amethyst, Stardust, Corstinite, Shulker, Voiding Boots, Schroom Hat, Adventure Hat, Ardent Mask, and Willager Hat, including baby-geometry support and actor-glint texture usage.
- Fixed thirteen Actions & Stuff compatibility attachables that still had invalid multi-line JSON strings by restoring the valid v1.2.1 one-line `parent_setup` expressions.
- Updated current-only Soul Fused and Netherite armour attachables to use the same baby-geometry pattern and correct per-slot hidden-layer variables.
- Ported the v1.2.1 `waystone.geo.json` pivot. The v1.2.1 Lich Plushie texture is a binary PNG and is intentionally **not** included in this PR because the PR workflow rejects binary diffs; copy it manually from `v1.2.1_src_only/resources/textures/blocks/trophies/lich_plushie.png` to `BOB_resources/textures/blocks/trophies/lich_plushie.png` after applying the text changes.
- Ported the English welcome message wording so it points players back to `/guidebook` if they lose the Guide Book.

## Resource-pack retained differences

After this pass, the resource pack has no source-only files. The remaining same-path differences are intentional, plus one formatting-only clean-up in `entity/vanilla/zombie.entity.json` where trailing whitespace was removed for `git diff --check`:

| File or group | Decision |
| --- | --- |
| `manifest.json` | Keep custom JCP pack name/description while retaining v1.2.1 version/dependency alignment. |
| `blocks.json` | Keep the current branch's extra `better_on_bedrock:leaf_pile` moss-carpet sound mapping. |
| `attachables/misc/nether_amulet_2_stone_green_yellow.json` | Keep the corrected `better_on_bedrock:nether_amulet_2_stone_green_yellow` identifier instead of the v1.2.1 typo `Bether_amulet_2_stone_green_yellow`. |
| `sounds/music_definitions.json` | Keep the current branch's fuller vanilla music-definition table and un-namespaced custom event keys that match the active sound-definition keys. |
| `sounds/sound_definitions.json` | Keep the current branch's additional `shelby` music entry. The rest of the sound-definition keys match the v1.2.1 source. |
| `splashes.json` | Keep the custom JCP splash set. |
| `texts/*.lang` | Keep intentional current localisation differences: custom pack naming, the WAWLA `Ready to Harvest` wording, and JCP description wording. English welcome text has now been updated to the v1.2.1 Guide Book wording while retaining the command-description key. |
| Current-only resource files | Keep the current-only Soul Fused/Netherite attachables, `sounds/music/shelby.ogg`, and `textures/gui/icons.png`; the armour attachables were updated in this pass for the same baby-geometry compatibility as the v1.2.1 armour files. |

No additional unlisted resource source-only files or same-path resource changes were found that need action.

## Validation status

Static validation completed after the resource ports:

- All JSON/JSONC files in `BOB_behaviors` and `BOB_resources` parse after comment stripping.
- All JavaScript files in `BOB_behaviors/scripts` pass `node --check`.
- `git diff --check` reports no whitespace errors.

Recommended in-game smoke-testing remains separate from the porting audit: vanilla baby/adult variants, armour/attachable rendering, enchanted overlays, Guide Book command/welcome flow, waystone model placement, manually copied Lich Plushie texture display, and the assumed Task N structures should be checked in a Bedrock world. Any future binary assets should likewise be copied or moved from known sources outside PRs that reject binary diffs, rather than generated.
