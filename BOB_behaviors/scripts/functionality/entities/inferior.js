import { world, system } from "@minecraft/server";
import { getEntitiesNearPlayerCached } from "../../main.js";

const INFERIOR_SCAN_RADIUS = 18;
const INFERIOR_SCAN_EVERY_TICKS = 2;
const INFERIOR_ENGAGED_KEEPALIVE_TICKS = 40;

const playerContext = new Map();
let schedulerTick = 0;

function hashPlayerId(playerId) {
    let hash = 0;
    for (let i = 0; i < playerId.length; i++)
        hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;

    return hash;
}

function getContext(playerId) {
    let context = playerContext.get(playerId);
    if (!context) {
        const playerPhase = hashPlayerId(playerId);
        context = {
            nextScanTick: playerPhase % INFERIOR_SCAN_EVERY_TICKS,
            engagedUntilTick: 0
        };
        playerContext.set(playerId, context);
    }

    return context;
}

system.runInterval(() => {
    schedulerTick += INFERIOR_SCAN_EVERY_TICKS;

    const players = world.getAllPlayers();
    const activePlayerIds = new Set();

    for (const player of players) {
        if (!player?.isValid() || player.hasTag("bob:disable_combat_checks"))
            continue;

        activePlayerIds.add(player.id);
        const context = getContext(player.id);

        if (schedulerTick < context.nextScanTick && schedulerTick > context.engagedUntilTick)
            continue;

        context.nextScanTick = schedulerTick + INFERIOR_SCAN_EVERY_TICKS;

        const inferior = getEntitiesNearPlayerCached(player, {
            type: "better_on_bedrock:inferior",
            tags: ["bob:inferior_active"],
            maxDistance: INFERIOR_SCAN_RADIUS,
            closest: 1
        })[0];

        if (!inferior)
            continue;

        context.engagedUntilTick = schedulerTick + INFERIOR_ENGAGED_KEEPALIVE_TICKS;

        const dx = inferior.location.x - player.location.x;
        const dy = inferior.location.y - player.location.y;
        const dz = inferior.location.z - player.location.z;
        const distanceSquared = dx * dx + dy * dy + dz * dz;

        const isOnGroundState = inferior.getProperty("pog:is_on_ground");
        if (inferior.getVelocity().y >= 0.4 && isOnGroundState === 0)
            inferior.setProperty("pog:is_on_ground", 1);

        if (inferior.isOnGround && isOnGroundState === 1 && distanceSquared < 81) {
            inferior.setProperty("pog:is_on_ground", 0);
            player.applyDamage(5);
            player.applyKnockback(9, 0, 1, 1);
        }
    }

    for (const playerId of playerContext.keys()) {
        if (!activePlayerIds.has(playerId))
            playerContext.delete(playerId);
    }
}, INFERIOR_SCAN_EVERY_TICKS);
