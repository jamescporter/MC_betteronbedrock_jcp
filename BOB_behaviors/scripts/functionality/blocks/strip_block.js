import { BlockPermutation, ItemStack, EntityEquippableComponent, EquipmentSlot, system, world } from "@minecraft/server";

const STRIPPED_BLOCK_MAP = {
    "minecraft:acacia_log": "minecraft:stripped_acacia_log",
    "minecraft:birch_log": "minecraft:stripped_birch_log",
    "minecraft:cherry_log": "minecraft:stripped_cherry_log",
    "minecraft:dark_oak_log": "minecraft:stripped_dark_oak_log",
    "minecraft:jungle_log": "minecraft:stripped_jungle_log",
    "minecraft:mangrove_log": "minecraft:stripped_mangrove_log",
    "minecraft:oak_log": "minecraft:stripped_oak_log",
    "minecraft:pale_oak_log": "minecraft:stripped_pale_oak_log",
    "minecraft:spruce_log": "minecraft:stripped_spruce_log",
    "minecraft:crimson_stem": "minecraft:stripped_crimson_stem",
    "minecraft:warped_stem": "minecraft:stripped_warped_stem",
    "minecraft:acacia_wood": "minecraft:stripped_acacia_wood",
    "minecraft:birch_wood": "minecraft:stripped_birch_wood",
    "minecraft:cherry_wood": "minecraft:stripped_cherry_wood",
    "minecraft:dark_oak_wood": "minecraft:stripped_dark_oak_wood",
    "minecraft:jungle_wood": "minecraft:stripped_jungle_wood",
    "minecraft:mangrove_wood": "minecraft:stripped_mangrove_wood",
    "minecraft:oak_wood": "minecraft:stripped_oak_wood",
    "minecraft:pale_oak_wood": "minecraft:stripped_pale_oak_wood",
    "minecraft:spruce_wood": "minecraft:stripped_spruce_wood",
    "minecraft:crimson_hyphae": "minecraft:stripped_crimson_hyphae",
    "minecraft:warped_hyphae": "minecraft:stripped_warped_hyphae",
    "better_on_bedrock:shrublog": "better_on_bedrock:shrublog_stripped",
    "better_on_bedrock:vacant_wood": "better_on_bedrock:vacant_wood_stripped",
    "better_on_bedrock:chorus_log": "better_on_bedrock:chorus_log_stripped",
    "better_on_bedrock:chorus_wood": "better_on_bedrock:chorus_wood_stripped",
    "better_on_bedrock:voiding_log": "better_on_bedrock:voiding_log_stripped",
    "better_on_bedrock:voiding_wood": "better_on_bedrock:voiding_wood_stripped"
};

world.beforeEvents.playerInteractWithBlock.subscribe(ev => {
    const player = ev.player;
    const block = ev.block;

    const item = player.getComponent(EntityEquippableComponent.componentId).getEquipment(EquipmentSlot.Mainhand);
    const equipment = player?.getComponent("equippable");
    const durability = item?.getComponent("durability");
    const strippedBlock = block ? STRIPPED_BLOCK_MAP[block.typeId] : undefined;
    const blockFace = block?.permutation.getState("minecraft:block_face");

    if (block?.hasTag("better_on_bedrock:log")) {
        if (item?.hasTag("minecraft:is_axe")) {
            if (!strippedBlock) return;

            let strippedPermutation;
            try {
                strippedPermutation = BlockPermutation.resolve(strippedBlock, {
                    "minecraft:block_face": blockFace
                });
            } catch {
                return;
            }

            system.run(() => {
                block.setPermutation(strippedPermutation);
                player.playSound("fall.wood");

                if (durability) {
                    const newDamage = durability.damage + 1;

                    if (newDamage >= durability.maxDurability) {
                        player.playSound("random.break");
                        equipment.setEquipment("Mainhand", new ItemStack("minecraft:air", 1));
                    } else {
                        durability.damage = newDamage;
                        equipment.setEquipment("Mainhand", item);
                    }
                }
            });
        }
    }
});
