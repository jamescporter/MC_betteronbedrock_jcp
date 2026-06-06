import { EntityVariantComponent } from "@minecraft/server";
import { getClosestEntityFromViewDirection } from "../util";
import { applyKnockbackSafe, isEntityValid } from "./entity_helpers.js";

/** @param { import("@minecraft/server").Player } player */
export function sootEye(player) {
    if (!isEntityValid(player))
        return;

    const eye = player.dimension.getEntities({
        type: "better_on_bedrock:soot_eye",
        location: player.location,
        maxDistance: 48,
        closest: 1
    })[0];

    if (isEntityValid(eye)) {
        const entityFromView = getClosestEntityFromViewDirection(eye, 32);
        const variant = eye.getComponent(EntityVariantComponent.componentId)?.value;
        if (isEntityValid(entityFromView) && entityFromView.id === player.id && variant == 1) {
            entityFromView.applyDamage(9);
        };
    };

    const eyeBeam = player.dimension.getEntities({
        type: "better_on_bedrock:soot_eye_beam",
        location: player.location,
        maxDistance: 48,
        closest: 1
    })[0];

    if (isEntityValid(eyeBeam)) {
        const entityFromView = getClosestEntityFromViewDirection(eyeBeam, 32);
        const variant = eyeBeam.getComponent(EntityVariantComponent.componentId)?.value;
        if (isEntityValid(entityFromView) && entityFromView.id === player.id && variant == 1) {
            entityFromView.applyDamage(5);
            entityFromView.setOnFire(2);
        };
    };

    const sootYeet = player.dimension.getEntities({
        type: "better_on_bedrock:soot_yeet",
        location: player.location,
        maxDistance: 4,
        closest: 1
    })[0];

    if (isEntityValid(sootYeet)) {
        const dx = sootYeet.location.x - player.location.x;
        const dy = sootYeet.location.y - player.location.y;
        const dz = sootYeet.location.z - player.location.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (sootYeet.getComponent(EntityVariantComponent.componentId)?.value == 1 && distance <= 2) {
            applyKnockbackSafe(player, { x: 0, z: 0 }, 1.4);
            sootYeet.dimension.spawnParticle("pog:soot_yee_player", sootYeet.location);
        };
    };
};