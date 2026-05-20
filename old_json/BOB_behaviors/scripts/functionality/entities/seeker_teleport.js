import { world, system } from "@minecraft/server";
import { getEntitiesNearPlayerCached } from "../../main.js";

const SEEKER_SCAN_RADIUS = 48;
const LAUNCHER_SCAN_RADIUS = 8;
const DUMMY_SCAN_RADIUS = 10;

const SEEKER_TELEPORT_EVERY_TICKS = 120;
const LAUNCHER_CHECK_EVERY_TICKS = 10;
const DUMMY_FOLLOW_EVERY_TICKS = 4;
const ENCOUNTER_KEEPALIVE_TICKS = 80;

const playerContext = new Map();
let schedulerTick = 0;

function hashPlayerId(playerId) {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++)
        hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;

    return hash;
}

function getPlayerContext(playerId) {
    let context = playerContext.get(playerId);
    if (!context) {
        const playerPhase = hashPlayerId(playerId);
        context = {
            nextTeleportTick: playerPhase % SEEKER_TELEPORT_EVERY_TICKS,
            nextLauncherTick: playerPhase % LAUNCHER_CHECK_EVERY_TICKS,
            nextDummyTick: playerPhase % DUMMY_FOLLOW_EVERY_TICKS,
            encounterActiveUntil: 0
        };
        playerContext.set(playerId, context);
    }

    return context;
}

system.runInterval(() => {
    schedulerTick += 2;

    const players = world.getAllPlayers();
    const activePlayerIds = new Set();

    for (const player of players) {
        if (!player?.isValid() || player.hasTag("bob:disable_combat_checks"))
            continue;

        activePlayerIds.add(player.id);
        const context = getPlayerContext(player.id);

        const shouldCheckLauncher = schedulerTick >= context.nextLauncherTick;
        const shouldCheckDummy = schedulerTick >= context.nextDummyTick;
        const shouldCheckTeleport = schedulerTick >= context.nextTeleportTick;

        if (!shouldCheckLauncher && !shouldCheckDummy && !shouldCheckTeleport && schedulerTick > context.encounterActiveUntil)
            continue;

        if (shouldCheckLauncher) {
            context.nextLauncherTick = schedulerTick + LAUNCHER_CHECK_EVERY_TICKS;

            const launcher = getEntitiesNearPlayerCached(player, {
                type: "better_on_bedrock:seeker_launcher",
                tags: ["bob:seeker_launcher_active"],
                maxDistance: LAUNCHER_SCAN_RADIUS,
                closest: 1
            })[0];

            if (launcher) {
                context.encounterActiveUntil = schedulerTick + ENCOUNTER_KEEPALIVE_TICKS;

                const dx = launcher.location.x - player.location.x;
                const dy = launcher.location.y - player.location.y;
                const dz = launcher.location.z - player.location.z;
                const distanceSquared = dx * dx + dy * dy + dz * dz;

                if (distanceSquared <= 9)
                    player.applyKnockback(4, 0, 0, 1);
            }
        }

        if (shouldCheckDummy) {
            context.nextDummyTick = schedulerTick + DUMMY_FOLLOW_EVERY_TICKS;

            const dummy = getEntitiesNearPlayerCached(player, {
                type: "better_on_bedrock:player_dummy_seeker",
                tags: ["bob:seeker_dummy_active"],
                maxDistance: DUMMY_SCAN_RADIUS,
                closest: 1
            })[0];

            if (dummy) {
                context.encounterActiveUntil = schedulerTick + ENCOUNTER_KEEPALIVE_TICKS;
                const view = player.getViewDirection();
                dummy.teleport({
                    x: player.location.x - view.x,
                    y: player.location.y,
                    z: player.location.z - view.z
                });
            }
        }

        if (shouldCheckTeleport) {
            context.nextTeleportTick = schedulerTick + SEEKER_TELEPORT_EVERY_TICKS;

            const seeker = getEntitiesNearPlayerCached(player, {
                type: "better_on_bedrock:seeker",
                tags: ["bob:seeker_active"],
                maxDistance: SEEKER_SCAN_RADIUS,
                closest: 1
            })[0];

            if (seeker) {
                context.encounterActiveUntil = schedulerTick + ENCOUNTER_KEEPALIVE_TICKS;
                seeker.teleport({
                    x: seeker.location.x + 7,
                    y: seeker.location.y,
                    z: seeker.location.z + 7
                });
            }
        }
    }

    for (const playerId of playerContext.keys()) {
        if (!activePlayerIds.has(playerId))
            playerContext.delete(playerId);
    }
}, 2);
