const DEBUG_PROFILE = false;
const PROFILE_LOG_INTERVAL = 1200;
const profile = {
    calls: 0,
    activeTicks: 0,
    totalMs: 0,
};
const particleLocation = { x: 0, y: 0, z: 0 };

/** @type { import("@minecraft/server").BlockCustomComponent } */
export const events = {
    onTick: ({ block, dimension }) => {
        const start = DEBUG_PROFILE ? Date.now() : 0;
        const permutation = block.permutation;
        const isGlobal = permutation.getState("pog:activatedAsGlobal");
        const particle = isGlobal
            ? "pog:waystone_activate_global"
            : (permutation.getState("pog:activated") ? "pog:waystone_activate" : "");

        if (!particle) {
            if (DEBUG_PROFILE) {
                profile.calls++;
                profile.totalMs += Date.now() - start;
            }
            return;
        }

        const location = block.location;
        particleLocation.x = location.x + 0.5;
        particleLocation.y = location.y + 0.5;
        particleLocation.z = location.z + 0.5;

        dimension.spawnParticle(particle, particleLocation);
        dimension.playSound("block.waystone.ambient", location);

        if (DEBUG_PROFILE) {
            profile.calls++;
            profile.activeTicks++;
            profile.totalMs += Date.now() - start;
            if (profile.calls % PROFILE_LOG_INTERVAL === 0) {
                console.warn(`[waystoneemitter] calls=${profile.calls} active=${profile.activeTicks} avgMs=${(profile.totalMs / profile.calls).toFixed(4)}`);
            }
        }
    },
};
