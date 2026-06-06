import { world } from "@minecraft/server";

const CUSTOM_RECORD_SOUNDS = [
    "balloon.pop",
    "camera.take_picture",
    "sparkler.use",
    "elemconstruct"
];

function stopCustomRecordSounds(dimension) {
    for (const sound of CUSTOM_RECORD_SOUNDS)
        dimension.runCommandAsync(`stopsound @a ${sound}`);
}

world.afterEvents.playerInteractWithBlock.subscribe(({ block, player }) => {
    if (block.typeId === "minecraft:jukebox")
        stopCustomRecordSounds(player.dimension);
});

world.afterEvents.playerBreakBlock.subscribe(({ brokenBlockPermutation, player }) => {
    if (brokenBlockPermutation.type.id === "minecraft:jukebox")
        stopCustomRecordSounds(player.dimension);
});
