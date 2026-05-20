import { world, system, TicksPerSecond, EquipmentSlot, EntityEquippableComponent, ItemDurabilityComponent } from "@minecraft/server";

const lastFillRegionByPlayer = new Map();

function landCheck(player) {
    const blockUnder = player.dimension.getBlockFromRay(player.location, { x: 0, y: -1, z: 0 })?.block;
    const block1 = player.dimension.getBlockFromRay({ x: player.location.x - 2, y: player.location.y, z: player.location.z - 2 }, ({ x: 0, y: -1, z: 0 }))?.block;
    const block2 = player.dimension.getBlockFromRay({ x: player.location.x + 2, y: player.location.y, z: player.location.z + 2 }, ({ x: 0, y: -1, z: 0 }))?.block;

    return (
        blockUnder !== undefined
        || block1 !== undefined
        || block2 !== undefined
    );
};

/** @param { import("@minecraft/server").Player } player */
export function voidBoots(player) {
    if (!player?.isValid())
        return;

    if (player?.dimension?.id !== "minecraft:the_end") {
        lastFillRegionByPlayer.delete(player.id);
        return;
    }

    const equipment = player.getComponent(EntityEquippableComponent.componentId);
    const boots = equipment.getEquipment(EquipmentSlot.Feet);
    if (boots?.typeId !== "better_on_bedrock:voiding_boots" || landCheck(player)) {
        lastFillRegionByPlayer.delete(player.id);
        return;
    }

    const { x, y, z } = player.location;
    const fillRegion = `${x - 1} ${y - 1} ${z - 1} ${x + 1} ${y - 1} ${z + 1}`;
    player.addEffect("slowness", TicksPerSecond * 3, { showParticles: false });

    if (lastFillRegionByPlayer.get(player.id) === fillRegion)
        return;

    lastFillRegionByPlayer.set(player.id, fillRegion);
    player.dimension.runCommandAsync(`fill ${fillRegion} better_on_bedrock:void_block [] replace air`);
};

system.runInterval(() => {
    system.runJob(function* () {
        const players = world.getAllPlayers();
        if (lastFillRegionByPlayer.size > 0) {
            const activePlayerIds = new Set();
            for (let i = 0; i < players.length; i++)
                activePlayerIds.add(players[i].id);

            for (const playerId of lastFillRegionByPlayer.keys()) {
                if (!activePlayerIds.has(playerId))
                    lastFillRegionByPlayer.delete(playerId);
            }
        }

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
