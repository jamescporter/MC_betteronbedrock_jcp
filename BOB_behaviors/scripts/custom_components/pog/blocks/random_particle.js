const DEBUG_PROFILE = false;
const PROFILE_LOG_INTERVAL = 1200;
const profile = {
    calls: 0,
    totalMs: 0,
};
const particleLocation = { x: 0, y: 0, z: 0 };

/** @type { import("@minecraft/server").BlockCustomComponent } */
export const events = {
    onTick: ({ block, dimension }) => {
        const start = DEBUG_PROFILE ? Date.now() : 0;
        const location = block.location;

        particleLocation.x = location.x + 0.5;
        particleLocation.y = location.y + 0.2;
        particleLocation.z = location.z + 0.5;

        dimension.spawnParticle("better_on_bedrock:paper_lantern_particle", particleLocation);

        if (DEBUG_PROFILE) {
            profile.calls++;
            profile.totalMs += Date.now() - start;
            if (profile.calls % PROFILE_LOG_INTERVAL === 0) {
                console.warn(`[random_particle] calls=${profile.calls} avgMs=${(profile.totalMs / profile.calls).toFixed(4)}`);
            }
        }
    },
};
