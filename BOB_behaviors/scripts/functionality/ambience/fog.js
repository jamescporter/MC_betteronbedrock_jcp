import { world, system, MinecraftDimensionTypes } from "@minecraft/server";

const END_UPDATE_DISTANCE_SQUARED = 9;

const END_BIOME_BY_BLOCK = {
    "better_on_bedrock:shrub_nylium": {
        fog: "pog:vacant_dusk",
        music: "ambient.vacant"
    },
    "better_on_bedrock:void_grass": {
        fog: "pog:voiding_plains",
        music: "ambient.voiding_plains"
    },
    "better_on_bedrock:shroom_nylium": {
        fog: "pog:fungal_grove",
        music: "ambient.fungal_grove"
    },
    "better_on_bedrock:fall_nylium": {
        fog: "pog:voided_abyssal",
        music: "ambient.voided_abyss"
    },
    "better_on_bedrock:chorus_grass": {
        fog: "pog:chorus_forest",
        music: "ambient.chorus_forest"
    },
    "minecraft:end_stone": {
        fog: "",
        music: "ambient.end_wastes"
    }
};

const playerEndState = new Map();
const theEnd = world.getDimension(MinecraftDimensionTypes.theEnd);

function getState(player) {
    if (!playerEndState.has(player.id)) {
        playerEndState.set(player.id, {
            dimensionId: "",
            position: undefined,
            biomeKey: "",
            fogKey: "",
            musicKey: "",
            forceUpdate: true
        });
    }

    return playerEndState.get(player.id);
}

function clearState(playerId) {
    playerEndState.delete(playerId);
}

function shouldProcess(player, state) {
    if (state.forceUpdate)
        return true;

    if (state.dimensionId !== player.dimension.id)
        return true;

    if (!state.position)
        return true;

    const dx = player.location.x - state.position.x;
    const dy = player.location.y - state.position.y;
    const dz = player.location.z - state.position.z;

    return (dx * dx + dy * dy + dz * dz) >= END_UPDATE_DISTANCE_SQUARED;
}

function cachePositionAndDimension(player, state) {
    state.dimensionId = player.dimension.id;
    if (!state.position)
        state.position = { x: 0, y: 0, z: 0 };

    state.position.x = player.location.x;
    state.position.y = player.location.y;
    state.position.z = player.location.z;
    state.forceUpdate = false;
}

function removeFogIfActive(player, state, force = false) {
    if (!state.fogKey && !force)
        return;

    if (state.fogKey || force)
        player.runCommand("fog @s remove bob:end_fog");

    state.fogKey = "";
}

function applyEndBiomeTransition(player, state, biomeState) {
    const nextFog = biomeState?.fog ?? "";
    const nextMusic = biomeState?.music ?? "";

    if (state.fogKey !== nextFog) {
        if (state.fogKey)
            player.runCommand("fog @s remove bob:end_fog");

        if (nextFog)
            player.runCommand(`fog @s push ${nextFog} bob:end_fog`);

        state.fogKey = nextFog;
    }

    if (state.musicKey !== nextMusic) {
        if (nextMusic)
            player.playMusic(nextMusic, { volume: 1, fade: 1, loop: true });

        state.musicKey = nextMusic;
    }
}

function getBiomeFromFloor(player) {
    const floorBlock = theEnd.getBlockFromRay(
        { x: player.location.x, y: player.location.y + 1, z: player.location.z },
        { x: 0, y: -1, z: 0 }
    )?.block;

    if (!floorBlock)
        return "";

    return floorBlock.typeId;
}

function processPlayerEndFog(player) {
    const state = getState(player);
    if (!shouldProcess(player, state))
        return;

    if (player.dimension.id !== "minecraft:the_end" || !player.hasTag("endFog")) {
        removeFogIfActive(player, state, state.forceUpdate);
        state.biomeKey = "";
        state.musicKey = "";
        cachePositionAndDimension(player, state);
        return;
    }

    const biomeKey = getBiomeFromFloor(player);
    if (biomeKey === state.biomeKey && !state.forceUpdate) {
        cachePositionAndDimension(player, state);
        return;
    }

    applyEndBiomeTransition(player, state, END_BIOME_BY_BLOCK[biomeKey]);
    state.biomeKey = biomeKey;
    cachePositionAndDimension(player, state);
}

world.beforeEvents.playerLeave.subscribe(({ playerId }) => {
    clearState(playerId);
});

world.afterEvents.playerSpawn.subscribe(({ player }) => {
    getState(player).forceUpdate = true;
});

world.afterEvents.playerDimensionChange.subscribe(({ player }) => {
    const state = getState(player);
    state.forceUpdate = true;

    if (player.dimension.id !== "minecraft:the_end") {
        removeFogIfActive(player, state, true);
        state.biomeKey = "";
        state.musicKey = "";
    }
});

system.runInterval(() => {
    system.runJob(function* () {
        for (const player of theEnd.getPlayers({ tags: ["endFog"] }))
            processPlayerEndFog(player);

        const players = world.getAllPlayers();
        const activePlayersById = new Map(players.map((player) => [player.id, player]));

        for (const [playerId] of playerEndState) {
            const player = activePlayersById.get(playerId);
            if (!player) {
                playerEndState.delete(playerId);
                continue;
            }

            if (player.dimension.id !== "minecraft:the_end" || !player.hasTag("endFog"))
                processPlayerEndFog(player);
        }
    }());
}, 30);
