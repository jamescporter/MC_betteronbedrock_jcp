# Better on Bedrock Wiki

This wiki is a player-facing reference for Better on Bedrock gameplay. It avoids repository setup, porting notes, and placeholder implementation details so players can use it while playing.

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
| `better_on_bedrock:willager_eye` | Willager | Willager Arena structures in Overworld plains, forests, or birch forests. | Rare structure; roughly one placement candidate per 1,216×1,216 blocks before biome filtering. |
| `better_on_bedrock:flender_eye` | Flender | Flender Tower structures in Overworld plains, forests, or birch forests. | Rare structure; roughly one placement candidate per 800×800 blocks before biome filtering. |
| `better_on_bedrock:enchanter_eye` | Enchantaegis | Underground Enchantaegis dungeon structures in Overworld plains, forests, or birch forests. | Very rare structure; roughly one placement candidate per 1,984×1,984 blocks before biome filtering. |
| `better_on_bedrock:samurai_eye` | Withered Samurai | Nether Blackstone Castle structures. The castle contains a command block that runs `function summon_samurai`, and that function summons the Withered Samurai at the function location. | Guaranteed boss-eye drop once defeated. |
| `better_on_bedrock:armored_pyroclast_eye` | Shielded Pyroclast/Inferior | Nether Inferior boss arena. | Rare Nether arena feature; approximately 4.55% per placement attempt in Nether biomes at y 32–80. |

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

## New ores

Better on Bedrock adds five ore families. Ore generation is controlled by the pack's ore features and feature rules, so the y ranges below describe where each feature is placed when the matching dimension or biome tag is present.

| Ore | Icon | Where to find it | How it is found and mined | Main drop | Smelted form | What the smelted form is used for |
| --- | --- | --- | --- | --- | --- | --- |
| Aluminium Ore (`better_on_bedrock:alluminum_ore`) | ![Aluminium Ore](wiki_assets/ore_icons/alluminum_ore.png) | Overworld underground generation in Overworld-tagged biomes, y 0 to 78. | Generates in stone veins of up to 4 blocks, with 16 placement attempts per chunk. Mine it with a pickaxe; the block drops 1-2 Raw Aluminium. | `better_on_bedrock:raw_alluminum` | Aluminium Ingot (`better_on_bedrock:alluminum_ingot`) from smelting Raw Aluminium in a furnace or blast furnace. | Crafting the Forge Table and the Fishing Hook. |
| Tin Ore (`better_on_bedrock:tin_ore`) | ![Tin Ore](wiki_assets/ore_icons/tin_ore.png) | Overworld underground generation in Overworld-tagged biomes, y 0 to 78. | Generates in stone veins of up to 4 blocks, with 9 placement attempts per chunk. Mine it with a pickaxe; the block drops 1-2 Raw Tin. | `better_on_bedrock:raw_tin` | Tin Ingot (`better_on_bedrock:tin_ingot`) from smelting Raw Tin in a furnace or blast furnace. | Crafting the Enchant Bench and compressing into a Block of Tin, which can be crafted back into 9 Tin Ingots. |
| Stardust Ore (`better_on_bedrock:stardust_ore`) and Deepslate Stardust Ore (`better_on_bedrock:deepslate_stardust_ore`) | ![Stardust Ore](wiki_assets/ore_icons/stardust_ore.png) ![Deepslate Stardust Ore](wiki_assets/ore_icons/deepslate_stardust_ore.png) | Overworld underground generation in Overworld-tagged biomes, y -64 to 78. Stone becomes Stardust Ore; deepslate becomes Deepslate Stardust Ore. | Generates in veins of up to 4 blocks, with 4 placement attempts per chunk. It requires a diamond, netherite, or Stardust-tier pickaxe and drops 1-2 Stardust Nuggets. | `better_on_bedrock:stardust_nugget` | Stardust (`better_on_bedrock:stardust`) from smelting Stardust Nuggets in a furnace or blast furnace. Stardust can then be crafted with gold ingots and diamonds into Stardust Ingots. | Stardust Ingots make Stardust Upgrade Templates, Blocks of Stardust, the Stardust Spear, Stardust-tier tools and armour through smithing, and Enderite Ingots. |
| Corstinite Ore (`better_on_bedrock:corstinite_ore`) | ![Corstinite Ore](wiki_assets/ore_icons/corstinite_ore.png) | Nether underground generation in Nether-tagged biomes, y 0 to 150. | Generates in netherrack veins of up to 8 blocks, with 1 placement attempt per chunk. It requires a diamond, netherite, or Stardust-tier pickaxe and drops Corstinite Ingots directly. | `better_on_bedrock:corstinite_ingot` | No separate furnace step: the ore's useful processed form is the Corstinite Ingot dropped from the block. | Crafting Corstinite armour, Blocks of Corstinite, and Fiery Ingots. |
| Enderium Ore (`better_on_bedrock:ender_ore`) | ![Enderium Ore](wiki_assets/ore_icons/ender_ore.png) | The End in biomes tagged `the_end`, y 0 to 150. | Generates in end stone veins of up to 8 blocks, with 3 placement attempts per chunk. It drops Enderium when mined with a netherite or Stardust-tier pickaxe. | `better_on_bedrock:enderium` | Smelted Enderium (`better_on_bedrock:enderium_smelted`) from smelting Enderium in a furnace or blast furnace. | Crafting Enderite Ingots. Enderite Ingots are used for Enderite tools and the Void Totem; unsmelted Enderium is also part of the Void Totem recipe. |

### Quick ore-processing notes

- Aluminium and Tin follow the familiar raw-ore-to-ingot flow: mine the ore, smelt the raw item, then craft with the ingot.
- Stardust is a two-step progression material: smelt Stardust Nuggets into Stardust, then craft Stardust Ingots from Stardust, gold ingots, and diamonds.
- Corstinite currently skips furnace processing because its ore loot table drops Corstinite Ingots directly.
- Enderium must be smelted before it can become part of an Enderite Ingot, but unsmelted Enderium still has a direct Void Totem use.

## Stardust armour

Each Stardust armour piece advertises the full-set bonus in its item description:

- Full set required: Stardust Helmet, Stardust Chestplate, Stardust Leggings, and Stardust Boots.
- Full-set bonus: **Health Boost III** and **Resistance III**.
- The bonus stays active while the full set is worn.
- All four armour pieces are fire resistant.

## Plushies

The pack currently defines these plushie blocks and creative catalogue entries:

- Willager Plushie
- Enchanter Plushie
- Lich Plushie

Survival acquisition for these plushies still needs a clearer route.

## Item uses quick reference

This section lists where key items come from, exact crafts where useful, what they are for, and their main stats.

### Ores, metals, and progression materials

| Item | From / how to craft | Used for | Primary stats / notes |
| --- | --- | --- | --- |
| Raw Aluminium | Mine Aluminium Ore in the Overworld, y 0 to 78. | Smelt to Aluminium Ingot. | Ore drops 1-2 raw aluminium. |
| Aluminium Ingot | Smelt Raw Aluminium. | Forge Table: 7 Aluminium Ingots. Fishing Hook: 5 Aluminium Ingots. | Early utility metal; save it for stations/tools. |
| Raw Tin | Mine Tin Ore in the Overworld, y 0 to 78. | Smelt to Tin Ingot. | Ore drops 1-2 raw tin. |
| Tin Ingot | Smelt Raw Tin. | Enchant Bench: 2 Tin Ingots + 1 Book + 3 Planks. Block of Tin: 9 ingots; crafts back to 9 ingots. | Early progression metal. |
| Stardust Nugget | Mine Stardust Ore or Deepslate Stardust Ore, y -64 to 78. | Smelt to Stardust. | Needs diamond, netherite, or Stardust-tier pickaxe. Drops 1-2 nuggets. |
| Stardust | Smelt Stardust Nuggets. | Stardust Ingot: 5 Stardust + 2 Diamonds + 2 Gold Ingots makes 4 ingots. | Mid/late-game crafting dust. |
| Stardust Ingot | Craft from Stardust, diamonds, and gold. Also found rarely in vault-style loot. | Duplicate Stardust Upgrade Templates; craft Block of Stardust, Stardust Spear, and Enderite Ingot. | Used for Stardust gear progression. |
| Stardust Upgrade Template | Bastion loot; duplicate with 1 template + 1 Stardust Ingot + 7 Deepslate to make 2. | Smith diamond tools/armour into Stardust gear. Also repairs the broken music disc into Stellar Crystals. | Template item; keep the first one. |
| Corstinite Ingot | Mine Corstinite Ore in the Nether, y 0 to 150. | Corstinite armour, Block of Corstinite, Fiery Ingot. | Needs diamond, netherite, or Stardust-tier pickaxe; ore drops ingots directly. |
| Fiery Ingot | Craft with 1 Corstinite Ingot + 4 Smeared Pearls + 1 Quetzacaw Feather + 1 Blackstone Crumb. | Repairs Blade of the Nether and Nether Amulet forms. | No armour/tool stat by itself. |
| Enderium | Mine Enderium Ore in the End, y 0 to 150. | Smelt to Smelted Enderium; also used directly in Void Totem. | Needs netherite or Stardust-tier pickaxe. |
| Smelted Enderium | Smelt Enderium. | Enderite Ingot: 4 Smelted Enderium + 2 Stardust Ingots + 2 End Shards + 1 End Scroll. | End-game metal ingredient. |
| Enderite Ingot | Craft from Smelted Enderium, Stardust Ingots, End Shards, and End Scroll. Also appears in some End Trader/chest paths. | Sword: 2 ingots + Stick; Pickaxe/Axe: 3 ingots + 2 Sticks; also Void Totem. | Enderite tools: Sword 12 damage/2039 durability; Pickaxe 9 damage/2100 durability; Axe 12 damage/2100 durability. |

### Gear and utility crafts

| Item | From / how to craft | Used for | Primary stats / notes |
| --- | --- | --- | --- |
| Forge Table | Craft with 7 Aluminium Ingots. | Opens the Forger UI; forges an Iron Tool Head from 2 Iron Ingots. No current survival recipe spends the Tool Head. | Placeable station. |
| Enchant Bench | Craft with 2 Tin Ingots + 1 Book + 3 Planks. | Miner Bench: applies custom enchant books to valid tools for 6 levels. | Placeable station. |
| Fishing Hook | Craft with 5 Aluminium Ingots; also found in some Fisherman village chests. | Craft a vanilla Fishing Rod with 3 Sticks + String + Fishing Hook. | No combat stats. |
| Stardust Spear | Craft with 1 Stardust Ingot + 1 Flint + 1 Stick. | Throwable/melee spear. | 9 damage, 2531 durability. |
| Stardust tools | Smith diamond tools with Stardust Upgrade Template + Netherite Ingot. | Strong tool tier. | Sword 11 damage/3242 durability; Pickaxe 5/3561; Axe 9/2531; Shovel 5/2031; Hoe 6/750. |
| Stardust armour | Smith diamond armour with Stardust Upgrade Template + Netherite Ingot. | Strong armour set. | Helmet 5 protection/950 durability; Chestplate 9/950; Leggings 9/1222; Boots 9/1000. Full set gives Health Boost III and Resistance III. |
| Corstinite armour | Craft with Corstinite Ingots in normal armour shapes. | Nether armour tier. | Helmet 3 protection/407 durability; Chestplate 8/592; Leggings 6/555; Boots 3/481. |
| Shulker armour | Craft each piece with 1 Persisting Embodiment plus Shulker Shells: helmet 5 shells, chestplate 7, leggings 6, boots 4. | Pacifies Endermen and Shulkers. | Helmet 2 protection/180 durability; Chestplate 6/180; Leggings 3/180; Boots 3/180. |
| Void Totem | Craft with 2 Ender Pearls + Enderium + Soul Star + Netherite Ingot + Totem of Undying + Enderite Ingot + End Shard + Chorus Flitter. | Saves you from dying in the End void. | Stack size 1; keep in hand/off-hand. |
| Schroom Hat | Craft with Carnivorous Mandible + Combustible Scrap + Groohog Horn + 2 Schroom Samples + Persisting Embodiment + 2 String. | Wearable mushroom-themed helmet. | 5 protection, 1156 durability. |
| Bane Spike | Craft with Carnivorous Mandible + Fermented Spider Eye + Groohog Horn + Spider Eye + Stick; or trade 4 from End Trader for 4 Copper Ingots + 4 Gold Nuggets. | Poison weapon. | 10 damage, 1704 durability; poisons hit targets. |
| Resin Dagger | Craft with Resin Shard + Stronger String + Stick. | Fast early weapon. | 4 damage, 70 durability. |
| Stone Dagger | Craft with Cobblestone + String + Stick. | Early weapon and ingredient for raw patty/chop food recipes. | 4 damage, 70 durability. |

### Mob drops and special materials

| Item | From / how to craft | Used for | Primary stats / notes |
| --- | --- | --- | --- |
| Combustible Scrap | Dropped by Bacterio. | Schroom Hat ingredient. | No direct use; keep it for the hat recipe. |
| Schroom Sample | Schroom-related drops/loot. | Schroom Hat and Potion of Rage path. | Brew with Awkward Potion for Rage Potion. |
| Persisting Embodiment | Dropped by Chorus Golems. | Shulker armour and Schroom Hat; also calms Chorus Golems. | Key End armour ingredient. |
| Soul Star | Rare hostile mob drop, including creepers, blazes, cave spiders, skeletons, and zombies. | Fixed Ghost Necklace fuel; Soul Jar; Void Totem. | Consumed by Ghost Necklace use. |
| Soul Jar | Craft with 1 Soul Star + 8 Glass. | Soul-storage utility item. | Place/utility item. |
| Ghost Necklace Fragment | Guaranteed Flender boss drop: 2 fragments. | Craft 4 into a Fixed Ghost Necklace. | Collect two Flender kills worth for one necklace. |
| Fixed Ghost Necklace | Craft 4 Ghost Necklace Fragments; repair Broken Ghost Necklace with 4 Gold Ingots. | Use with Soul Star in off-hand to become a ghost. | Consumes 1 Soul Star; spectator effect lasts 10 seconds. |
| Carnivorous Mandible | Dropped by Flasp. | Bane Spike and Schroom Hat. | Combat/hat crafting ingredient. |
| Groohog Horn | Dropped by Chorus Behemith. | Bane Spike and Schroom Hat. | Combat/hat crafting ingredient. |
| Resin Shard | Dropped by Dustmite. | Resin Dagger and Resin Candy. | Weapon and food ingredient. |
| Deer Hide | Dropped by Deer. | Stronger String: 5 String + 4 Deer Hide makes 4. Used for Backpacks and Resin Dagger. | Can also craft leather/item frames. |

### Runes and staffs

Runes are mainly traded with the Lone Wizard for staffs. Staffs use durability as mana: hold use for the main attack, or crouch and use for the secondary attack.

| Item | From | Used for | Primary stats / notes |
| --- | --- | --- | --- |
| Basic Rune | Enchantaegis drop and structure loot. | Trade 3 for Basic Staff; also part of specialist staff trades. | Staff trade currency. |
| Ice Rune | Iceologer drop and structure loot. | Trade 2 Basic Runes + 1 Ice Rune for Ice Staff. | Staff trade currency. |
| Flame Rune | Nether Bridge and Wizard House loot. | Trade 2 Basic Runes + 1 Flame Rune for Flame Staff. | Staff trade currency. |
| Flender Rune | Guaranteed Flender drop. | Trade 3 Basic Runes + 1 Flender Rune for Flender Staff. | Staff trade currency. |

### Boss eyes

| Eye | From | Used for | Notes |
| --- | --- | --- | --- |
| Willager Eye | Willager. | Eye of Ender recipe. | Found through Willager Arena structures. |
| Flender Eye | Flender. | Eye of Ender recipe. | Found through Flender Tower structures. |
| Enchantaegis Eye | Enchantaegis. | Eye of Ender recipe. | Found in underground Enchantaegis dungeons. |
| Samurai Eye | Withered Samurai. | Eye of Ender recipe. | Found through Nether Blackstone Castle progression. |
| Shielded Pyroclast Eye | Shielded Pyroclast/Inferior. | Eye of Ender recipe. | Found through the Nether Inferior boss arena. |
| Ender Pearl | Vanilla Endermen/trades/loot. | Eye of Ender recipe with the five boss eyes. | Needed alongside all five boss eyes. |

### Food, farming, and utility notes

- New crops and foods are mainly for healing/saturation chains. Keep seeds, fruit, vegetables, dough, pies, sandwiches, stews, and cooked meats if you are building a food supply.
- Stone Dagger, raw meats, crops, and dough appear in several food chains, so check recipes before throwing them away.
- Save Aluminium and Tin early: they unlock Forge Table, Enchant Bench, and Fishing Hook.

## Additional items and crafting

### Amethyst gear

Amethyst gear is crafted with vanilla Amethyst Shards in normal tool/armour shapes.

| Item | Craft | Use | Primary stats |
| --- | --- | --- | --- |
| Amethyst Sword | 2 Amethyst Shards + Stick. | Early weapon. | 5 damage, 350 durability. |
| Amethyst Pickaxe | 3 Amethyst Shards + 2 Sticks. | Early pickaxe. | 3 damage, 350 durability. |
| Amethyst Axe | 3 Amethyst Shards + 2 Sticks. | Early axe/weapon. | 5 damage, 350 durability. |
| Amethyst Spear | Amethyst Shard + Flint + Stick. | Throwable/melee spear. | 6 damage, 125 durability. |
| Amethyst Armour | Amethyst Shards in normal armour shapes. | Early armour set. | Helmet 2 protection/100 durability; Chestplate 5/100; Leggings 3/100; Boots 3/100. |

### Better on Bedrock spears

These spears are Better on Bedrock weapons, not vanilla Minecraft items. Most use the head material + Flint + Stick. Wooden Spear uses Stick + Flint + Stick.

| Spear | Head material | Primary stats |
| --- | --- | --- |
| Wooden Spear | Stick. | 4 damage, 60 durability. |
| Stone Spear | Cobblestone. | 5 damage, 132 durability. |
| Iron Spear | Iron Ingot. | 6 damage, 251 durability. |
| Golden Spear | Gold Ingot. | 7 damage, 33 durability. |
| Amethyst Spear | Amethyst Shard. | 6 damage, 125 durability. |
| Diamond Spear | Diamond. | 8 damage, 1562 durability. |
| Stardust Spear | Stardust Ingot. | 9 damage, 2531 durability. |

### Backpacks and storage

| Item | From / craft | Use | Notes |
| --- | --- | --- | --- |
| Stronger String | 5 String + 4 Deer Hide makes 4. | Backpacks and Resin Dagger. | Deer Hide comes from Deer. |
| Regular Backpack | Chest + 2 Copper Ingots + 2 Deer Hide + 4 Stronger String. | Portable storage. | Smallest backpack tier. |
| Medium Backpack | Chest + 2 Diamonds + 2 Deer Hide + 4 Stronger String. | Portable storage. | Middle backpack tier. |
| Large Backpack | Chest + 2 Netherite Ingots + 2 Deer Hide + 4 Stronger String. | Portable storage. | Largest backpack tier. |
| Hanging Pot | 3 Sticks + Dirt + Flower Pot makes 4. | Decoration/plant display. | Hanging flower/berry pot variants use this base. |
| Guide Book | Dirt, or `/guidebook` command/fallback command. | Opens in-game guide. | Use for guide menu; crouch + use for credits. |
| Goal Tracker | Sugar Cane + 3 Paper + Ink Sac. | Player goal/help item. | Utility item. |
| Quest Scroll | Sugar Cane + Paper + 2 Ink Sacs. | Quest/bounty flow. | Utility item. |
| Pack Config | 4 Iron Nuggets + Iron Ingot. | Pack settings item. | Utility/admin item. |
| Waystone | 5 Iron Ingots + Ender Pearl + Ender Tear makes 2. | Fast-travel/waystone system. | Use with Waystone Marker/Key flow. |
| Overworld Waystone Key | 4 Gold Ingots + 4 Ender Tears + Ender Pearl. | Opens the Waystone menu. | Player utility item. |

### Potions and brewing

| Item | From / craft | Use | Primary stats / effects |
| --- | --- | --- | --- |
| Smeared Pearl | 3 Blackstone Crumbs + Ender Pearl. | Corrupt Potion, End Crystal, Ender Chest, Fiery Ingot. | Throwable pearl item. |
| Combined Elements | Quetzacaw Feather + Blaze Rod + Blackstone Crumb + Blaze Powder. | Resistance Potion reagent. | Brew with Corrupt Potion to make Resistance Potion. |
| Corrupt Potion | Brew Awkward Potion with Smeared Pearl. | Brewing step for Resistance Potion. | Drinkable, stack size 1. |
| Resistance Potion | Brew Corrupt Potion with Combined Elements. | Defensive potion. | Resistance for 1:00. |
| Rage Potion | Brew Awkward Potion with Schroom Sample. | Combat potion/food. | 12 nutrition; Speed II, Haste IV, Strength III, Absorption IV for 0:30; 16-second cooldown. |

### Food and cooking

| Item | From / craft | Use | Food stats |
| --- | --- | --- | --- |
| Dough | Milk Bucket + Sugar + Wheat; returns Bucket. | End Cookie, pies, Voidberry Pie. | Ingredient. |
| Baguette | 3 Bread. | Food. | 6 nutrition, 2 saturation. |
| Fried Egg | Smelt/cook Egg. | Egg Sandwich, Lava Salad. | 4 nutrition, 0.6 saturation. |
| Baked Onion | Smelt Onion. | Barley Stew. | 4 nutrition, 1.5 saturation. |
| Baked Eggplant | Smelt Eggplant. | Barley Stew. | 4 nutrition, 1.5 saturation. |
| Raw Beef Patty | Beef + Stone Dagger; dagger is returned. | Cook to Beef Patty. | 2 nutrition, 0.6 saturation. |
| Beef Patty | Cook Raw Beef Patty. | Burger and Beef Sandwich. | 8 nutrition, 0.8 saturation. |
| Raw Mutton Chops | Mutton + Stone Dagger; dagger is returned. | Cook to Cooked Mutton Chops. | 2 nutrition, 0.6 saturation. |
| Cooked Mutton Chops | Cook Raw Mutton Chops. | Food. | 5 nutrition, 1 saturation. |
| Raw/Cooked Deer Meat | Deer drop; cook raw meat. | Food. | Raw 3/0.6; cooked 6/0.6. |
| Beef Sandwich | 2 Bread + 2 Cabbage Leaves + Beef Patty. | Food. | 6 nutrition, 3 saturation. |
| Egg Sandwich | 2 Bread + 2 Cabbage Leaves + Fried Egg. | Food. | 6 nutrition, 0.5 saturation. |
| Burger | 2 Bread + Cabbage Leaf + Beef Patty + Onion. | Food. | 6 nutrition, 0.7 saturation. |
| Salad | Eggplant + Tomato + Cabbage Leaf + Bowl. | Food. | 8 nutrition, 11 saturation; returns Bowl. |
| Barley Stew | Barley Straw + Red Mushroom + Baked Onion + Sugar + Tomato + Baked Eggplant + Bowl. | Food. | 12 nutrition; returns Bowl. |
| Fungus Stew | Warped Fungus + Crimson Fungus + Porkchop + Bowl. | Food. | 6 nutrition, 1.5 saturation. |
| Ender Stew | End Shard + Ender Pearl + Carrot + Bowl. | Food. | 8 nutrition, 0.6 saturation. |
| Lava Salad | Fried Egg + Lava Bucket + Porkchop + Bowl. | Food. | 6 nutrition, 0.6 saturation. |
| Sweet Berry Pie | Sweet Berries + Sugar + Red Mushroom + Dough. | Food; can be sliced. | Whole pie 3/0.4; slice 2/0.6. |
| Grape Pie | Grape + Sugar + Red Mushroom + Dough. | Food; can be sliced. | Whole pie 8/0.6; slice 4/0.4. |
| Voidberry Pie | 2 Purple Dye + Sugar + 3 Dough + End Berry. | High-value food. | 14 nutrition, 0.6 saturation. |
| End Cookie | 3 Sugar + 3 Dough. | Food. | 5 nutrition, 0.6 saturation. |
| Enchanted Golden Carrot | Carrot + 8 Gold Blocks. | Expensive food. | 5 nutrition, 1.2 saturation. |
| Resin Candy | Resin Clump + Resin Shard + Sugar. | Food. | 6 nutrition, 0.6 saturation. |

### Nether, End, and boss materials

| Item | From / craft | Use | Notes |
| --- | --- | --- | --- |
| Blackstone Crumb | Crobber drop. | Smeared Pearl, Bubble Blower, Combined Elements, Fiery Ingot. | Keep for Nether crafts. |
| Quetzacaw Feather | Quetzacaw drop. | Combined Elements and Fiery Ingot. | Mob material. |
| Fragment of Soul | Fireorb drop. | The Ardent Crystal. | Boss/progression material. |
| Blazing Jewel | Boss loot table drop. | The Ardent Crystal. | Rare material. |
| The Ardent Crystal | 4 Fragment of Soul + 4 Blazing Jewels + Nether Star. | High-tier progression craft. | Keep for late boss/progression systems. |
| End Shard | Enderman drops and Soot Boss chest loot. | Enderite Ingot, Ender Stew, Void Totem. | Keep for End progression. |
| End Scroll | Voiding Plains ruined houses, Fungal Outpost pots, and Vacant Dusk houses. | Enderite Ingot. | Keep for Enderite. |
| Chorus Flitter | Smelt Popped Chorus Fruit. | Void Totem and End recipes. | Smeltable End ingredient. |
| Ender Tear | Enderman drops, Waystone Tower loot, ruined temple loot, and uncommon lootbags. | Waystone and Overworld Waystone Key. | Waystone material. |
| Smeared Pearl | 3 Blackstone Crumbs + Ender Pearl. | Fiery Ingot and brewing. | Also replaces Ender Pearl in some vanilla-style recipes. |
| Bubble Blower | 3 Blackstone Crumbs + 2 Sticks. | Utility/fun item. | No combat stats. |
| Nether Amulet | Empty Nether Amulet + Red, Yellow, and Green Nether Stones. | Mode-switching Nether tool. | 140 durability on active forms; repaired with Fiery Ingots. |

### Crops, plants, and decoration

| Item family | From / craft | Use | Notes |
| --- | --- | --- | --- |
| Barley, Cabbage, Eggplant, Tomato, Onion, Grape | Seeds/crops from world generation, loot, or farming. | Food chains above. | Keep seeds until you have a farm. |
| Blueberries, Peach, Orange, Coconut, End Berry, Wild Carrot | Forage/loot/farming depending on biome or structure. | Direct food and pie/cookie chains. | Useful travel food. |
| Chorus, Vacant, and Voiding wood sets | Their logs/wood craft planks, doors, trapdoors, sticks, bowls, chests, shields, beds, and charcoal variants. | Building and vanilla utility replacements. | Good if you settle in custom biomes. |
| Decorative stone sets | Andesite, basalt, calcite, diorite, dripstone, granite, malbite, mud, purpur, sandstone, soulsand. | Bricks, slabs, walls, cracked/chiselled/polished variants. | Mostly building blocks. |
| Flower and hanging pot variants | Crafted/collected flowers plus Hanging Pot. | Decoration. | Includes berry, glowberry, lilac, moss, rose, tulip, cornflower, and oxeye pots. |
| Pottery sherds | Structure/loot finds. | Decorative pottery. | Includes Forger, Piglin, Blank, and Party sherds. |
| Plushies | Creative/catalogue entries; survival route unclear. | Decoration. | Willager, Enchanter, and Lich Plushies. |

## Final add-on pass: extra items to know

### Custom enchant books

Use these books at the Enchant Bench/Miner Bench. Each application costs 6 levels and consumes the book.

| Book | Valid tool | What it does | Main sources |
| --- | --- | --- | --- |
| Vein Miner I | Pickaxes. | Mines connected ore veins. | Trial chests, End City treasure, Willager death crate, quest/lootbag paths. |
| Ore Smelter I | Pickaxes. | Auto-smelts supported ore drops while mining. | Custom enchant loot/quest paths. |
| Tree Capitator I | Axes. | Fells connected tree logs. | Custom enchant loot/quest paths. |
| Harvest Touch I | Hoes. | Harvests connected crops/plant blocks. | Custom enchant loot/quest paths. |
| Leafy Liberator I | Shears. | Clears connected leaves. | Custom enchant loot/quest paths. |

### Lootbags, rings, and throwables

| Item | From | Use | Notes |
| --- | --- | --- | --- |
| Common Lootbag | House/chest loot and reward paths. | Use to run the common lootbag reward function. | Consumed on use. |
| Uncommon Lootbag | Trader chests/outposts and reward paths. | Use to run the uncommon lootbag reward function. | 3-second lootbag cooldown. |
| Rare/Random Lootbag | Waystone towers, graves, pillager ships, battle tower vaults, quests, and reward paths. | Use to run the rare lootbag reward function. | Consumed on use. |
| Ring of Care | End/loot item. | Place on a basic End Podium to spawn End City treasure loot. | Consumed by the podium. |
| Ring of Hope | End/loot item. | Place on a basic End Podium to spawn Lava Shrine loot. | Consumed by the podium. |
| Ring of Hate | End/loot item. | Place on a basic End Podium to spawn Waystone Tower loot. | Consumed by the podium. |
| Toxic Ball | Dropped by Croaker. | Throw it as a poison projectile. | Projectile item. |

### Wearables and trophies

| Item | From | Use | Primary stats / notes |
| --- | --- | --- | --- |
| Voided Boots | End/void progression loot. | Lets you walk over the End void by placing temporary void blocks below you. | 4 protection, 64 durability; takes durability damage while bridging the void. |
| Adventurer Hat | Wearable/loot item. | Early helmet. | 2 protection, 100 durability. |
| Willager Hat | Willager drop/block loot and quest target. | Cosmetic/trophy helmet. | Wearable head item; no protection listed. |
| Helmet of The Lost Guardian | Trophy item. | Collectable/wearable trophy. | No combat stats listed. |
| Resin Candy Boots | Listed wearable item. | Resin-themed boots. | Stats/source were not found in the current behaviour recipes/items pass. |

### Biome plants and loose decoration

| Item family | Examples | Use | Notes |
| --- | --- | --- | --- |
| Small flowers and grasses | Anemone, Bellflower, Bluegrod, Clematis, Hydrangea, Iris, Lumen Flower, Tiny Sprout, Wildflower, Desert/Lush/Taller Grass. | Decoration and biome ambience. | Pick up/plant like decorative flora when available. |
| Tall and variant flowers | Tall Blossom, Tall Eyeblossom, Pink Lavender, Tall Pink Lavender, Flare, Gloomy, Lil, Lunar variants. | Decoration. | Mainly biome decoration. |
| End/Vacant plants | End Spore, Vacant Blossom Spore, Small Chorus Spore, Small Chorus Lilly Grass, Abyssal Grass, Tall Abyssal Grass, Tall Chorus Grass, Tentacled Vacant Grass, Vacant Vine. | Decoration and custom-biome plant life. | Mostly decorative/biome blocks unless used in a listed recipe. |
| Glowshroom and mushroom parts | Glowshroom Fur, Glowshroom Stem/Base, Mushroom Fruit Base/Body, Shroom Fruit, Shroom Plant, Fungal Shrub, Shrubflower, Vacant Shroom. | Decoration/biome materials. | Keep if building with fungal blocks. |
| Nether stones | Withered, Vitality, and Fire Nether Stones. | Fill the Nether Amulet recipe with the Empty Nether Amulet. | Needed for a complete Nether Amulet. |
| Pot and sherd variants | Hanging Sweet Berry/Glowberry/Lilac/Moss/Rose/Tulip/Cornflower/Oxeye Pots; Forger/Piglin/Blank/Party Sherds. | Decoration. | No combat or progression stats. |
| Quest scroll states | Bought Quest, Rolled Up Quest Scroll, Rolled Up Bounty Scroll, Opened Quest Scroll, Bounty Scroll. | Quest UI/progression items. | Keep active quest papers until the quest is done. |

## Future work and known gaps

The following items are intentionally listed here instead of the player guide above because they are setup, development, or unfinished-documentation tasks:

- Add a player-friendly installation/download guide outside this gameplay wiki.
- Add clearer survival acquisition routes for plushies.
- Give the Stone Dagger a fuller progression/design pass.
- Keep development-only placeholders and compatibility notes out of the player-facing guide.
- Track release history, porting notes, and development-only details outside this wiki.
