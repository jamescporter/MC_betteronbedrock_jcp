# Better on Bedrock Wiki

This wiki is a lightweight reference for the JCP-maintained Better on Bedrock fork. For release history and detailed compatibility notes, see `RELEASE_NOTES.md`. For unfinished or development-only areas, see `DEVELOPMENT_INDEX.md`.

## Guide Book and guide command

### What it is

The **Guide Book** is an in-game item (`better_on_bedrock:guide_book`) that introduces Better on Bedrock features and menus.

### Controls

- **Use** the Guide Book to open the full in-game guide menu.
- **Crouch + use** the Guide Book to open the credits.
- Place the book entity in-world to page through its model pages.

### How to obtain it

You can obtain the Guide Book in multiple ways:

- **Starter onboarding**: new survival players receive the onboarding items during the intro flow.
- **Configuration/reward paths**: certain scripted flows can grant it.
- **Guide command**: use `/guidebook` when the custom command registry is available.
- **Namespaced guide command**: use `/better_on_bedrock:guidebook` if your world exposes the command by its add-on namespace.
- **Fallback command**: use `/scriptevent better_on_bedrock:guidebook` if custom commands are not available in the running Bedrock version.

### Command details

| Command | Purpose | Permission | Cheats required | Result |
| --- | --- | --- | --- | --- |
| `/guidebook` | Restore or obtain the Guide Book | Any player | No | Gives one Guide Book to the executing player, dropping overflow at the player location if needed. |
| `/better_on_bedrock:guidebook` | Namespaced restore path | Any player | No | Gives one Guide Book to the executing player, dropping overflow at the player location if needed. |
| `/scriptevent better_on_bedrock:guidebook` | Fallback restore path | Command access | Depends on world command settings | Gives one Guide Book to the executing player, dropping overflow at the player location if needed. |

## Progression bosses, eyes, and rarity

Progression to the End has changed. Instead of using the traditional vanilla route, players need five boss eyes and one Ender Pearl to craft Eyes of Ender. Boss-eye drops listed below are guaranteed by their boss loot tables unless otherwise noted.

| Eye | Boss/source | Where to look | Rarity indicator |
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
| `better_on_bedrock:nether_amulet_3_stone_yellow_red_green` | Inferno Shield mode | On release, launches an Inferno Shield forward. |
| `better_on_bedrock:nether_amulet_full_purple_active` | Wither Skull mode | On use, fires a dangerous Wither Skull forward and starts a 3.5-second amulet attack cooldown. |
| `better_on_bedrock:nether_amulet_full_red_active` | Regeneration/fire burst mode | On release, grants Regeneration III for 30 seconds, deals 15 fire damage to non-player entities within 16 blocks, and spawns a heal particle. |

If the amulet seems to do nothing, check that it is not broken, that you are using the intended mode, and that you are not crouching while trying to trigger a normal attack.

## Ghost Necklace

The Ghost Necklace lets a player briefly become a ghost, but it requires a fuel item.

### How to craft and repair

- Ghost Necklace Fragments drop from Flender: 2 fragments are guaranteed per kill.
- Craft 4 Ghost Necklace Fragments into one Fixed Ghost Necklace.
- A Broken Ghost Necklace can be repaired into a fixed one with 4 Gold Ingots around the broken necklace.

### How to use

- Put a Soul Star in the off-hand.
- Use the Fixed Ghost Necklace.
- One Soul Star is consumed on a successful activation.
- The effect lasts 10 seconds and temporarily sets the player to spectator mode.

## Runes

Runes are progression/crafting materials. Some drop from bosses, and others can be found in structure loot.

| Rune | Main sources | Chance/rarity details |
| --- | --- | --- |
| Basic Rune | Guaranteed from Enchantaegis. Also appears in several Overworld structure chests. | Structure-chest chances vary by structure. |
| Ice Rune | Guaranteed from Iceologer. Also appears in many Overworld chest pools and in Waystone Tower loot. | Usually rarer than Basic Rune in shared chest pools. |
| Flame Rune | Nether Bridge loot and Overworld Wizard House loot. | Uncommon chest loot. |
| Flender Rune | Guaranteed from Flender. | 100% boss drop. |

## Notable items and where to get them

### Bane Spike

You can get a Bane Spike in two ways:

- **Crafting**: Carnivorous Mandible + Fermented Spider Eye + Groohog Horn + Spider Eye + Stick.
- **End Trader**: one trade gives 4 Bane Spikes for 4 Copper Ingots + 4 Gold Nuggets.

Component sources:

- Carnivorous Mandible drops from Flasp.
- Groohog Horn drops from Chorus Behemith.

### Blade of the Nether

Blade of the Nether drops from the Shielded Pyroclast/Inferior loot table. It is an uncommon boss drop rather than a guaranteed drop.

### Resin Dagger

Resin Dagger is crafted from:

- Resin Shard
- Stronger String
- Stick

Component sources:

- Resin Shard drops from Dustmite.
- Stronger String is crafted from String and Deer Hide.

### Stone Dagger

The Stone Dagger is crafted from Cobblestone, String, and a Stick. It is also used as a tool ingredient in raw patty/chop food recipes.

## Stardust armour

Each Stardust armour piece advertises the full-set bonus in its item description:

- Full set required: Stardust Helmet, Stardust Chestplate, Stardust Leggings, and Stardust Boots.
- Full-set bonus: **Health Boost III** and **Resistance III**.
- The bonus stays active while the full set is worn.
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

Survival acquisition for these plushies still needs a clearer route.

## Future work and known gaps

The following items are intentionally listed here instead of the player guide above because they are setup, development, or unfinished-documentation tasks:

- Add a player-friendly installation/download guide outside this gameplay wiki.
- Add clearer survival acquisition routes for plushies.
- Give the Stone Dagger a fuller progression/design pass.
- Keep development-only placeholders and compatibility notes out of the player-facing guide.
- Track release history, porting notes, and development-only details outside this wiki.
