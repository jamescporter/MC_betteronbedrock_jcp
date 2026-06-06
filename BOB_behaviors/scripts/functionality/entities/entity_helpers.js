/** @param { import("@minecraft/server").Entity | undefined } entity */
export function isEntityValid(entity) {
    if (!entity)
        return false;

    const isValid = entity.isValid;
    if (typeof isValid === "function")
        return isValid.call(entity);

    return isValid !== false;
}

/**
 * @param { import("@minecraft/server").Entity | undefined } entity
 * @param { import("@minecraft/server").VectorXZ } horizontal
 * @param { number } verticalStrength
 */
export function applyKnockbackSafe(entity, horizontal, verticalStrength) {
    if (!isEntityValid(entity))
        return;

    entity.applyKnockback(horizontal, verticalStrength);
}

/**
 * @param { import("@minecraft/server").Entity | undefined } entity
 * @param { import("@minecraft/server").Vector3 } location
 */
export function teleportSafe(entity, location) {
    if (!isEntityValid(entity))
        return;

    entity.teleport(location);
}
