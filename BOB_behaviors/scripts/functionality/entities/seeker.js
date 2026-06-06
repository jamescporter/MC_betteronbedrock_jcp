import { EntityVariantComponent } from "@minecraft/server";
import { getClosestEntityFromViewDirection } from "../util";
import { applyKnockbackSafe, isEntityValid } from "./entity_helpers.js";

/** @param { import("@minecraft/server").Player } player */
export function seeker(player) {
    if (!isEntityValid(player))
        return;

    const entity = player.dimension.getEntities({
        type: "better_on_bedrock:seeker",
        location: player.location,
        maxDistance: 48,
        closest: 1
    })[0];

    if (!isEntityValid(entity))
        return;

    const variant = entity.getComponent(EntityVariantComponent.componentId)?.value;
    switch (variant) {
        case 2: {
            const entityFromView = getClosestEntityFromViewDirection(entity, 32);
            if (isEntityValid(entityFromView) && entityFromView.id === player.id)
                player.applyDamage(5);
            break;
        };
        case 5: {
            const entityFromView = getClosestEntityFromViewDirection(entity, 32);
            if (isEntityValid(entityFromView) && entityFromView.id === player.id) {
                player.addEffect("slowness", 100);
                player.addEffect("weakness", 220, { amplifier: 2 });
                player.applyDamage(12);
                applyKnockbackSafe(player, { x: 1, z: 0 }, 1);
            };
            break;
        };
    };
};