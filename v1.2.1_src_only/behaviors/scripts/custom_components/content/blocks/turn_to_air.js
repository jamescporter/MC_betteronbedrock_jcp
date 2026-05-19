import { system } from "@minecraft/server";
/** @type { import("@minecraft/server").BlockCustomComponent } */
export const events = {
    beforeOnPlayerPlace: (data) => {
        const { block, permutationToPlace } = data;
        const above = block.above();
        if (!above.isAir) {
            data.cancel = true;
            return;
        };

        system.run(() => {
            above.setPermutation(
                permutationToPlace.withState("pog:double_plant", "top_bit")
            );
        });
    },
    onPlayerBreak: ({ block, brokenBlockPermutation }) => {
        const below = block.below();
        if (below.typeId == brokenBlockPermutation.type.id)
            below.setType("minecraft:air");
    },
};