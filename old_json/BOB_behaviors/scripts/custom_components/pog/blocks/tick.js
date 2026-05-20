const DEBUG_PROFILE = false;
const PROFILE_LOG_INTERVAL = 1200;
const profile = {
    calls: 0,
    handled: 0,
    totalMs: 0,
};

/** @type { import("@minecraft/server").BlockCustomComponent } */
export const events = {
    onTick: ({ block, dimension }) => {
        const start = DEBUG_PROFILE ? Date.now() : 0;
        const location = block.location;
        let handled = false;

        switch (block.typeId) {
            case "better_on_bedrock:void_block":
                block.setType("air");
                handled = true;
                break;
            case "better_on_bedrock:voided_bush":
                dimension.spawnParticle("pog:leaves", location);
                handled = true;
                break;
            case "better_on_bedrock:soul_jar_block":
                dimension.spawnParticle("pog:soul_jar", location);
                dimension.playSound("bloom.sculk_catalyst", location);
                handled = true;
                break;
        }

        if (DEBUG_PROFILE) {
            profile.calls++;
            if (handled) {
                profile.handled++;
            }
            profile.totalMs += Date.now() - start;
            if (profile.calls % PROFILE_LOG_INTERVAL === 0) {
                console.warn(`[tick] calls=${profile.calls} handled=${profile.handled} avgMs=${(profile.totalMs / profile.calls).toFixed(4)}`);
            }
        }
    },
};
