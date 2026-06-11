# Better on Bedrock Wiki

This wiki is a lightweight reference for the JCP-maintained Better on Bedrock fork. For release history and detailed compatibility notes, see `RELEASE_NOTES.md`. For unfinished or development-only areas, see `DEVELOPMENT_INDEX.md`.

## Guide Book and guide command

### What it is

The **Guide Book** is an in-game item (`better_on_bedrock:guide_book`) that introduces players to Better on Bedrock features and usage.

### Controls

- **Use** the Guide Book to open the full in-game guide menu.
- **Crouch + use** the Guide Book to open the credits.
- Place the book entity in-world to page through its model pages.

### How to obtain it

You can obtain the Guide Book in multiple ways:

- **Starter onboarding**: new survival players receive the onboarding items during the intro flow.
- **Configuration/reward paths**: certain scripted flows can grant it.
- **Custom command**: use `/better_on_bedrock:guidebook` when the custom command registry is available.
- **Fallback command**: use `/scriptevent better_on_bedrock:guidebook` if the custom command registry is not available in the running Bedrock version.

### Command details

| Command | Purpose | Permission | Cheats required | Result |
| --- | --- | --- | --- | --- |
| `/better_on_bedrock:guidebook` | Restore or obtain the Guide Book | `Any` | `false` | Gives one `better_on_bedrock:guide_book` to the executing player, dropping overflow at the player location if needed. |
| `/scriptevent better_on_bedrock:guidebook` | Fallback restore path | Command access | Depends on world command settings | Gives one `better_on_bedrock:guide_book` to the executing player, dropping overflow at the player location if needed. |

## Progression bosses, eyes, and rarity

The custom Eyes of Ender recipe uses one Ender Pearl plus five boss eyes and returns 16 Eyes of Ender. Boss-eye drops listed below are guaranteed by their boss loot tables unless otherwise noted.

| Eye | Boss/source | Where to find the boss | Rarity indicator |
| --- | --- | --- | --- |
| `better_on_bedrock:willager_eye` | Willager | Willager Arena structures in Overworld biomes tagged `plains`, `forest`, or `birch_forest`. | Random-spread structure set with `spacing: 76` chunks and `separation: 8`; roughly one placement candidate per 76×76 chunk grid, or about 1,216×1,216 blocks, before biome filtering. |
| `better_on_bedrock:flender_eye` | Flender | Flender Tower structures in Overworld biomes tagged `plains`, `forest`, or `birch_forest`. | Random-spread structure set with `spacing: 50` chunks and `separation: 4`; roughly one placement candidate per 50×50 chunk grid, or about 800×800 blocks, before biome filtering. |
| `better_on_bedrock:enchanter_eye` | Enchantaegis | Underground Enchantaegis dungeon structures in Overworld biomes tagged `plains`, `forest`, or `birch_forest`. | Random-spread structure set with `spacing: 124` chunks and `separation: 8`; roughly one placement candidate per 124×124 chunk grid, or about 1,984×1,984 blocks, before biome filtering. |
| `better_on_bedrock:samurai_eye` | Withered Samurai | Nether Blackstone Castle structures. The castle contains a command block that runs `function summon_samurai`, and that function summons the Withered Samurai at the function location. | Guaranteed boss-eye drop once defeated. |
| `better_on_bedrock:armored_pyroclast_eye` | Shielded Pyroclast/Inferior | Nether Inferior boss arena feature. | Feature rule has `scatter_chance` 1/22, approximately **4.55%** per placement attempt, in Nether biomes at y 32–80. |

## Nether Amulet

The Nether Amulet is a mode-switching trophy/tool. It has three active forms and every successful active use costs 1 durability.

### Controls and modes

- **Crouch + use** cycles the mode and plays a mode-switch sound.
- **Normal use/release** activates the currently selected mode.

| Mode item id | Mode | Effect |
| --- | --- | --- |
| `better_on_bedrock:nether_amulet_3_stone_yellow_red_green` | Inferno Shield mode | On release, launches `better_on_bedrock:inferno_shield` forward. |
| `better_on_bedrock:nether_amulet_full_purple_active` | Wither Skull mode | On use, fires `minecraft:wither_skull_dangerous` forward and starts a 3.5-second amulet attack cooldown. |
| `better_on_bedrock:nether_amulet_full_red_active` | Regeneration/fire burst mode | On release, grants Regeneration III for 30 seconds, deals 15 fire damage to non-player entities within 16 blocks, and spawns a heal particle. |

If the amulet seems to do nothing, check that it is not broken, that you are using the intended mode, and that you are not crouching while trying to trigger a normal attack.

## Ghost Necklace

The Ghost Necklace lets a player briefly become a ghost, but it requires a fuel item.

### How to craft and repair

- `better_on_bedrock:ghost_necklace_fragment` drops from Flender: 2 fragments are guaranteed per kill.
- Craft 4 Ghost Necklace Fragments into one `better_on_bedrock:fixed_ghost_necklace`.
- A `better_on_bedrock:broken_ghost_necklace` can be repaired into a fixed one with 4 gold ingots around the broken necklace.

### How to use

- Put a `better_on_bedrock:soul_star` in the off-hand.
- Use the Fixed Ghost Necklace.
- One Soul Star is consumed, the necklace takes 1 durability damage, and the player enters Spectator mode for 10 seconds.
- The effect also gives a short night-vision effect, then returns the player to Survival mode.
- It does not work in Hardcore worlds.
- When the necklace runs out of durability, it becomes a Broken Ghost Necklace.

### BOB component sources

- Ghost Necklace Fragment: guaranteed from Flender.
- Soul Star: appears in several vanilla-mob replacement loot tables, including Zombie, Skeleton, Cave Spider, Creeper, and Blaze loot.
- Broken Ghost Necklace: produced when a Fixed Ghost Necklace runs out of durability.

## Runes and staff progression

Runes are traded with the Lonely Wizard for staffs. Chest percentages below are entry-weight chances within the listed loot pool roll, not a guarantee that a whole chest contains the item.

| Rune | Main sources | Chance/rarity details |
| --- | --- | --- |
| `better_on_bedrock:rune` — Basic Rune | Guaranteed from Enchantaegis. Also in Abandoned Mineshaft, Desert Cabin, Desert Pyramid, Goblin House, Pillager Outpost, River Base, Shipwreck, Simple Dungeon, and Wizard House chest loot. | Examples: Desert Cabin 43.75% per pool roll; River Base 77.78% per pool roll; Wizard House 11.86% per pool roll; Abandoned Mineshaft 6.54% per pool roll. |
| `better_on_bedrock:ice_rune` — Ice Rune | Guaranteed from Iceologer. Also appears in many overworld chest pools and in Overworld Wizard House/Waystone Tower loot. | Usually the rarer companion to Basic Rune: Abandoned Mineshaft 0.93%, Desert Pyramid 0.42%, Pillager Outpost 1.72%, River Base 11.11%, Waystone Tower 20% per pool roll. |
| `better_on_bedrock:flame_rune` — Flame Rune | Nether Bridge loot and Overworld Wizard House loot. | Nether Bridge 9.20% per pool roll; Overworld Wizard House 20% per pool roll. |
| `better_on_bedrock:flender_rune` — Flender Rune | Guaranteed from Flender. | 100% boss drop. |

## Notable items and where to get them

### Bane Spike

You can get a `better_on_bedrock:bane_spike` in two ways:

- **Crafting**: Carnivorous Mandible + Fermented Spider Eye + Groohog Horn + Spider Eye + Stick.
- **End Trader**: one trade gives 4 Bane Spikes for 4 Copper Ingots + 4 Gold Nuggets.

BOB component sources:

- `better_on_bedrock:carnivorous_mandibile` drops from Flasp.
- `better_on_bedrock:horn` drops from Chorus Behemith.

### Blade of the Nether

`better_on_bedrock:blade_of_the_nether` drops from the Shielded Pyroclast/Inferior loot table. The table rolls 0–1 times for that pool, so it is an uncommon boss drop rather than a guaranteed drop.

### Resin Dagger

`better_on_bedrock:resin_dagger` is crafted from:

- `better_on_bedrock:resin_shard`
- `better_on_bedrock:stronger_string`
- Stick

BOB component sources:

- `better_on_bedrock:resin_shard` drops from Dustmite.
- `better_on_bedrock:stronger_string` is crafted from String and Deer Hide.

### Stone Dagger

The Stone Dagger is currently the item `better_on_bedrock:dagger`, displayed as **Stone Dagger**. It is crafted from Cobblestone, String, and a Stick, and is also used as a tool ingredient in raw patty/chop food recipes.

Future work: the Stone Dagger should get a fuller progression/design pass in the wiki once its intended survival role and loot placement are finalised.

## Stardust armour

Each Stardust armour piece now advertises the full-set bonus in its item description. The wiki details are:

- Full set required: `stardust_helmet`, `stardust_chestplate`, `stardust_leggings`, and `stardust_boots`.
- Full-set bonus: **Health Boost III** and **Resistance III**.
- The script refreshes both effects every second for 5 seconds, so the bonus stays active while the full set is worn.
- All four armour pieces are fire resistant.

## Plushies

The pack currently defines these plushie blocks and creative catalogue entries:

- `better_on_bedrock:willager_plushie`
- `better_on_bedrock:enchanter_plushie`
- `better_on_bedrock:lich_plushie`

Future work: add and document survival sources for the three plushies, such as boss loot, structure chest loot, trades, recipes, or quest rewards.

## Commands

| Command | Purpose | Permission | Cheats required | Result |
| --- | --- | --- | --- | --- |
| `/better_on_bedrock:guidebook` | Restore or obtain the Guide Book | `Any` | `false` | Gives one `better_on_bedrock:guide_book` to the executing player, dropping overflow at the player location if needed. |
| `/scriptevent better_on_bedrock:guidebook` | Fallback restore path | Command access | Depends on world command settings | Gives one `better_on_bedrock:guide_book` to the executing player, dropping overflow at the player location if needed. |

## Bosses and encounters

### Seeker boss

`better_on_bedrock:seeker` is reserved for the Seeker boss encounter. The old duplicate End-mob Seeker has been separated as the disabled `better_on_bedrock:end_seeker` placeholder so it cannot override the boss definition.

Useful related areas:

- boss behaviour: `BOB_behaviors/entities/bosses/seeker/`
- client resource: `BOB_resources/entity/boss/seeker.entity.json`
- arena/worldgen references: `BOB_behaviors/worldgen/`, `BOB_behaviors/features/`, and `BOB_behaviors/structures/` paths containing `seeker`

### Geomancer

`better_on_bedrock:geomancer` remains the real misc Geomancer client entity. The old boss-side duplicate has been isolated as `better_on_bedrock:geomancer_boss_placeholder` until a full boss encounter is designed.

See `DEVELOPMENT_INDEX.md` before changing Geomancer boss files so the placeholder does not become a second conflicting Geomancer identifier again.

## Known limitations and future work

- The fork is still under active review and should be treated as currently untested unless a specific build has been smoke-tested.
- Plushie survival acquisition is future work.
- Stone Dagger progression/source design is future work.
- `better_on_bedrock:end_seeker` is a disabled placeholder, not a finished End mob.
- `better_on_bedrock:geomancer_boss_placeholder` is a development placeholder, not a complete boss encounter.
- Installation/setup documentation should live outside this player-facing wiki.
- The full Scripting V2 migration remains deferred and should not be mixed into unrelated changes.

## Compatibility notes

The current branch keeps the existing `@minecraft/server` dependency while using compatibility work to preserve custom component registration on newer Bedrock builds. See `RELEASE_NOTES.md` for the full Bedrock compatibility notes.

## Development status

Use `DEVELOPMENT_INDEX.md` to track partially made, disabled, deferred, or review-only areas before adding new work. This helps keep unfinished features visible without letting placeholders conflict with real gameplay identifiers.
