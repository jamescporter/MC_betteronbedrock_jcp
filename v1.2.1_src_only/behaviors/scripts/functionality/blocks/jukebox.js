import { Direction, world } from "@minecraft/server";

world.afterEvents.playerInteractWithBlock.subscribe(event => {
    const block = event.block
    const player = event.player
    const blockLoc = event.block.location

    if (block.typeId == 'minecraft:jukebox') {
        player.dimension.runCommand(`stopsound @a balloon.pop`)
        player.dimension.runCommand(`stopsound @a camera.take_picture`)
        player.dimension.runCommand(`stopsound @a sparkler.use`)
        player.dimension.runCommand(`stopsound @a elemconstruct`)
    }
})
world.afterEvents.playerBreakBlock.subscribe(event => {
    const block = event.block
    const player = event.player
    const blockLoc = event.block.location

    if (event.brokenBlockPermutation.type.id == 'minecraft:jukebox') {
        player.dimension.runCommand(`stopsound @a balloon.pop`)
        player.dimension.runCommand(`stopsound @a camera.take_picture`)
        player.dimension.runCommand(`stopsound @a sparkler.use`)
        player.dimension.runCommand(`stopsound @a elemconstruct`)
    }
})