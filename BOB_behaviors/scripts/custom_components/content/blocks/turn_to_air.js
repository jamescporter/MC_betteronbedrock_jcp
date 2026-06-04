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
    onPlayerDestroy: ({ block, destroyedBlockPermutation }) => {
        const destroyedHalf = destroyedBlockPermutation.getState("pog:double_plant");
        const otherHalf = destroyedHalf === "top_bit" ? block.below() : block.above();
        const expectedOtherHalf = destroyedHalf === "top_bit" ? "default" : "top_bit";

        if (
            otherHalf.typeId == destroyedBlockPermutation.type.id &&
            otherHalf.permutation.getState("pog:double_plant") === expectedOtherHalf
        )
            otherHalf.setType("minecraft:air");
    },
};
