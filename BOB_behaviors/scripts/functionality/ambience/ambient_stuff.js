import { world, system, GameMode } from "@minecraft/server";

const AMBIENT_UPDATE_DISTANCE_SQUARED = 9;

const playerAmbientState = new Map();
const ENTITY_ID_TAG_PATTERN = /^[0-9a-fA-F-]{36}$/;

system.runInterval(() => {
    const players = world.getAllPlayers();
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (!player.hasTag("pog:ambientSounds"))
            continue;

        switch (player.dimension.id) {
            case "minecraft:the_end": {
                player.playSound("ambient.random.end");
                break;
            }
        }
    }
}, Math.random() * (880 - 480) + 480);

system.runInterval(() => {
    const players = world.getAllPlayers();
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        if (
            !player.hasTag("pog:ambientSounds")
            || !player.matches({ gameMode: GameMode.survival })
        ) continue;

        switch (player.dimension.id) {
            case "minecraft:overworld": {
                player.playSound("confused_and_deeds_and_prelude");
                break;
            }
        }
    }
}, 20 * 320);

function removeAmbienceTags(entity) {
    entity.removeTag("night");
    entity.removeTag("swamps");
    entity.removeTag("swamp");
    entity.removeTag("taigas");
    entity.removeTag("taiga");
    entity.removeTag("jungles");
    entity.removeTag("jungle");
    entity.removeTag("plain");
    entity.removeTag("plains");
    entity.removeTag("forest");
    entity.removeTag("forests");
    entity.removeTag("birch");
    entity.removeTag("birchs");
    entity.removeTag("cherrygrove");
    entity.removeTag("cherrygroves");
    entity.removeTag("ocean");
    entity.removeTag("oceans");
    entity.removeTag("cold");
    entity.removeTag("colds");
    entity.removeTag("desert");
    entity.removeTag("deserts");
}

function getState(player) {
    if (!playerAmbientState.has(player.id)) {
        playerAmbientState.set(player.id, {
            lastDimensionId: "",
            lastPosition: undefined,
            lastMusicState: "",
            ambienceEntityId: undefined,
            forceUpdate: true
        });
    }

    return playerAmbientState.get(player.id);
}

function clearState(playerId) {
    playerAmbientState.delete(playerId);
}

function getEntityById(entityId) {
    if (!entityId)
        return undefined;

    try {
        return world.getEntity(entityId);
    } catch {
        return undefined;
    }
}

function removeTrackedAmbience(player) {
    const state = playerAmbientState.get(player.id);
    if (!state)
        return;

    const entity = getEntityById(state.ambienceEntityId);
    if (entity)
        system.run(() => entity.remove());

    state.ambienceEntityId = undefined;
}

function hasValidPlayerOwnerTag(entity) {
    const tags = entity.getTags();
    for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        if (!ENTITY_ID_TAG_PATTERN.test(tag))
            continue;

        try {
            const owner = world.getEntity(tag);
            if (owner && owner.typeId === "minecraft:player")
                return true;
        } catch {
        }
    }

    return false;
}

function cleanupDuplicateAmbienceEntities(player, keepEntityId) {
    const ambienceEntities = player.dimension.getEntities({
        type: "better_on_bedrock:ambiententity",
        location: player.location,
        maxDistance: 6
    });

    for (let j = 0; j < ambienceEntities.length; j++) {
        const entity = ambienceEntities[j];
        if (!hasValidPlayerOwnerTag(entity)) {
            entity.remove();
            continue;
        }

        if (!entity.getTags().includes(player.id))
            continue;

        if (entity.id === keepEntityId)
            continue;

        entity.remove();
    }
}

function ensurePlayerAmbienceEntity(player, state) {
    let entity = getEntityById(state.ambienceEntityId);

    if (!entity || entity.dimension.id !== player.dimension.id) {
        const ambienceEntities = player.dimension.getEntities({
            type: "better_on_bedrock:ambiententity",
            location: player.location,
            maxDistance: 8
        });

        for (let j = 0; j < ambienceEntities.length; j++) {
            const candidate = ambienceEntities[j];
            if (!candidate.getTags().includes(player.id))
                continue;

            entity = candidate;
            break;
        }

        if (!entity) {
            if (!player.isValid())
                return undefined;

            try {
                entity = player.dimension.spawnEntity("better_on_bedrock:ambiententity", player.location);
                entity.addTag(player.id);
            } catch {
                return undefined;
            }
        }

        state.ambienceEntityId = entity.id;
    }

    cleanupDuplicateAmbienceEntities(player, entity.id);

    return entity;
}

function getMusicStateAndApply(player, playerAmbienceEntity) {
    if (player.location.y <= 60) {
        player.removeTag("night");
        return "underground";
    }

    if (world.getTimeOfDay() >= 12500 && world.getTimeOfDay() <= 23500)
        return "night";

    if (!playerAmbienceEntity)
        return "none";

    if (playerAmbienceEntity.hasTag("plains"))
        return "plain";
    if (playerAmbienceEntity.hasTag("forests"))
        return "forest";
    if (playerAmbienceEntity.hasTag("birchs"))
        return "birch";
    if (playerAmbienceEntity.hasTag("oceans"))
        return "ocean";
    if (playerAmbienceEntity.hasTag("cherrygroves"))
        return "cherrygrove";
    if (playerAmbienceEntity.hasTag("deserts"))
        return "desert";
    if (playerAmbienceEntity.hasTag("taigas"))
        return "taiga";
    if (playerAmbienceEntity.hasTag("swamps"))
        return "swamp";
    if (playerAmbienceEntity.hasTag("jungles"))
        return "jungle";
    if (playerAmbienceEntity.hasTag("colds"))
        return "cold";

    return "none";
}

function applyMusicTransition(player, playerAmbienceEntity, musicState) {
    if (musicState === "underground") {
        if (playerAmbienceEntity)
            playerAmbienceEntity.triggerEvent("despawn");
        return;
    }

    if (musicState === "night") {
        if (playerAmbienceEntity)
            playerAmbienceEntity.triggerEvent("despawn");

        player.addTag("night");
        player.playMusic("ambient.night", {
            loop: true,
            fade: 1.2,
            volume: 0.1
        });
        return;
    }

    if (player.hasTag("night"))
        player.removeTag("night");

    if (musicState === "none")
        return;

    if (!playerAmbienceEntity)
        return;

    removeAmbienceTags(playerAmbienceEntity);
    playerAmbienceEntity.addTag(musicState);

    switch (musicState) {
        case "plain":
            player.playMusic("ambient.plains", { loop: true, fade: 1.2, volume: 0.4 });
            break;
        case "forest":
            player.playMusic("ambient.bird", { loop: true, fade: 1.2, volume: 0.15 });
            break;
        case "birch":
            player.playMusic("ambient.birch_bird", { loop: true, fade: 1.2, volume: 0.3 });
            break;
        case "ocean":
            player.playMusic("ambient.ocean", { loop: true, fade: 1.2, volume: 1.2 });
            break;
        case "cherrygrove":
            player.playMusic("ambient.cherry", { loop: true, fade: 1.2, volume: 0.7 });
            break;
        case "desert":
            player.playMusic("ambient.desert", { loop: true, fade: 1.2, volume: 0.6 });
            break;
        case "taiga":
        case "swamp":
        case "jungle":
            player.playMusic("ambient.taiga_bird", { loop: true, fade: 1.2, volume: 0.07 });
            break;
        case "cold":
            player.playMusic("ambient.snow", { loop: true, fade: 1.2, volume: 0.3 });
            break;
    }
}

function shouldUpdateForMovement(state, player) {
    if (state.forceUpdate)
        return true;

    if (state.lastDimensionId !== player.dimension.id)
        return true;

    if (!state.lastPosition)
        return true;

    const dx = player.location.x - state.lastPosition.x;
    const dy = player.location.y - state.lastPosition.y;
    const dz = player.location.z - state.lastPosition.z;

    return (dx * dx + dy * dy + dz * dz) >= AMBIENT_UPDATE_DISTANCE_SQUARED;
}

function updatePlayerTrackingState(state, player, musicState) {
    state.lastDimensionId = player.dimension.id;
    state.lastPosition = {
        x: player.location.x,
        y: player.location.y,
        z: player.location.z
    };
    state.lastMusicState = musicState;
    state.forceUpdate = false;
}

world.beforeEvents.playerLeave.subscribe(({ playerId }) => {
    clearState(playerId);
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    const state = getState(player);
    state.forceUpdate = true;
    if (!initialSpawn)
        removeTrackedAmbience(player);
});

world.afterEvents.playerDimensionChange.subscribe(({ player, toDimension }) => {
    const state = getState(player);
    state.forceUpdate = true;

    if (!player.hasTag("pog:ambientSounds"))
        return;

    if (toDimension.id === "minecraft:the_end" || toDimension.id === "minecraft:nether") {
        player.stopMusic();
        removeTrackedAmbience(player);
    }
});

export function ambience(player) {
    const state = getState(player);

    if (!player.hasTag("pog:ambientSounds")) {
        removeTrackedAmbience(player);
        removeAmbienceTags(player);
        state.lastMusicState = "";
        state.forceUpdate = true;
        return;
    }

    if (!shouldUpdateForMovement(state, player))
        return;

    let playerAmbienceEntity;

    switch (player.dimension.id) {
        case "minecraft:the_end":
        case "minecraft:nether": {
            if (!player.hasTag("overworld"))
                player.addTag("overworld");

            removeTrackedAmbience(player);
            updatePlayerTrackingState(state, player, "other_dimension");
            return;
        }
        case "minecraft:overworld": {
            playerAmbienceEntity = ensurePlayerAmbienceEntity(player, state);

            if (playerAmbienceEntity) {
                const head = player.getHeadLocation();
                const view = player.getViewDirection();

                playerAmbienceEntity.teleport({
                    x: head.x - view.x * 0.5,
                    y: head.y - view.y * 0.5,
                    z: head.z - view.z * 0.5
                });
            }

            const musicState = getMusicStateAndApply(player, playerAmbienceEntity);
            if (musicState !== state.lastMusicState)
                applyMusicTransition(player, playerAmbienceEntity, musicState);

            updatePlayerTrackingState(state, player, musicState);
            return;
        }
    }
}
