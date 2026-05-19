import { world } from "@minecraft/server";

import endBlosson from "../../functionality/blocks/end_blosson";

world.afterEvents.itemStartUseOn.subscribe(
    ({ block, itemStack, blockFace }) => {
        endBlosson(block, itemStack, blockFace);
    },
);