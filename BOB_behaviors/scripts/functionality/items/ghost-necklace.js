import { EntityInventoryComponent, ItemDurabilityComponent, ItemStack } from "@minecraft/server";

/** @param { import("@minecraft/server").Player } player */
export function ghostNecklace(player) {
    if (!player?.isValid())
        return false;

    const inventory = player.getComponent(EntityInventoryComponent.componentId)?.container;
    if (!inventory)
        return false;

    let hasFixedGhostNecklace = false;
    for (let i = 0; i < inventory.size; i++) {
        const itemStack = inventory.getItem(i);
        if (itemStack?.typeId !== "better_on_bedrock:fixed_ghost_necklace")
            continue;

        hasFixedGhostNecklace = true;
        const durability = itemStack.getComponent(ItemDurabilityComponent.componentId);
        if (durability.damage == 10) {
            inventory.setItem(i, new ItemStack("better_on_bedrock:broken_ghost_necklace"));
            hasFixedGhostNecklace = false;
        };
    };

    return hasFixedGhostNecklace;
};
