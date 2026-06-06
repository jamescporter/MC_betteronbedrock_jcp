import { system, world } from "@minecraft/server";

function isNight() {
    const time = world.getTimeOfDay();
    return time >= 13000 && time < 24000;
};

function refreshBlossom(block) {
    try {
        const isTopBit = block.permutation.getState("pog:double_plant") === "top_bit";
        if (isTopBit)
            return;

        const isOpen = block.permutation.getState("pog:is_open") == true;
        const other = block.above();
        if (isNight()) {
            if (!isOpen) {
                const { x, y, z } = block.location;
                block.dimension.spawnEntity("better_on_bedrock:tall_blossom", { x: x + 0.5, y, z: z + 0.5 });
            };

            if (other.typeId == block.typeId)
                other.setPermutation(other.permutation.withState("pog:is_open", true));

            block.setPermutation(block.permutation.withState("pog:is_open", true));
        }
        else {
            if (other.typeId == block.typeId)
                other.setPermutation(other.permutation.withState("pog:is_open", false));

            block.setPermutation(block.permutation.withState("pog:is_open", false));
        };
    }
    catch {};
}

function refreshPlacedBlossom(block) {
    const { dimension, typeId } = block;
    const location = { ...block.location };
    system.runTimeout(() => {
        const placedBlock = dimension.getBlock(location);
        if (!placedBlock || placedBlock.typeId != typeId)
            return;

        refreshBlossom(placedBlock);
    }, 1);
}

/** @type { import("@minecraft/server").BlockCustomComponent } */
export const events = {
    onTick: ({ block }) => {
        refreshBlossom(block);
    },
    onPlace: ({ block }) => {
        refreshPlacedBlossom(block);
    },
    onRandomTick: ({ block }) => {
        refreshBlossom(block);
    },
};
