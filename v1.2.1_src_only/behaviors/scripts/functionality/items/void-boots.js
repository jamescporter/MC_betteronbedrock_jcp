import { world, system, TicksPerSecond, EquipmentSlot, EntityEquippableComponent, ItemDurabilityComponent } from "@minecraft/server";

function landCheck(player) {
    const { x, y, z } = player.location;
    const dim = player.dimension;

    const offsets = [
        { x: 0, z: 0 },
        { x: 1.5, z: 0 },
        { x: -1.5, z: 0 },
        { x: 0, z: 1.5 },
        { x: 0, z: -1.5 },
        { x: 1.5, z: 1.5 },
        { x: -1.5, z: -1.5 }
    ];

    for (const off of offsets) {
        const hit = dim.getBlockFromRay(
            { x: x + off.x, y, z: z + off.z },
            { x: 0, y: -1, z: 0 }
        );

        if (hit?.block)
            return true;
    };

    return false;
};

/** @param { import("@minecraft/server").Player } player */
export function voidBoots(player) {
    if (!player?.isValid)
        return;

    if (player?.dimension?.id !== "minecraft:the_end")
        return;

    const equipment = player.getComponent(EntityEquippableComponent.componentId);
    const boots = equipment.getEquipment(EquipmentSlot.Feet);
    if (boots?.typeId !== "better_on_bedrock:voiding_boots" || landCheck(player))
        return;

    const { x, y, z } = player.location;
    player.addEffect("slowness", TicksPerSecond * 3, { showParticles: false });
    try {
        player.runCommand(`fill ${x - 1} ${y - 1} ${z - 1} ${x + 1} ${y - 1} ${z + 1} better_on_bedrock:void_block [] replace air`);
    }
    catch {};
};

system.runInterval(() => {
    system.runJob(function* () {
        const players = world.getAllPlayers();
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            if (player.dimension.id !== "minecraft:the_end")
                continue;

            const equipment = player.getComponent(EntityEquippableComponent.componentId);
            const boots = equipment.getEquipment(EquipmentSlot.Feet);
            if (boots?.typeId !== "better_on_bedrock:voiding_boots" || landCheck(player) || player.location.y < 0)
                continue;

            const durability = boots.getComponent(ItemDurabilityComponent.componentId);
            durability.damage += 1;
            if (durability.damage >= durability.maxDurability) {
                yield equipment.setEquipment(EquipmentSlot.Feet, undefined);
                continue;
            };

            yield equipment.setEquipment(EquipmentSlot.Feet, boots);
        };
    }());
}, 30);