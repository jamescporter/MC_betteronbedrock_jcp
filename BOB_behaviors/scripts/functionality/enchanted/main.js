import { Entity, Player } from "@minecraft/server";

/**
 * @param { Entity } damagingEntity 
 * @param { Entity } hitEntity
 */
export function applyEnchantments(damagingEntity, hitEntity) {
    if (!isEntityValid(hitEntity) || !isEntityValid(damagingEntity))
        return;

    const dimensionResult = safeRead(() => hitEntity.dimension);
    if (!dimensionResult.succeeded)
        return;

    const hitLocationResult = safeRead(() => hitEntity.location);
    if (!hitLocationResult.succeeded)
        return;

    const damagingLocationResult = safeRead(() => damagingEntity.location);
    if (!damagingLocationResult.succeeded)
        return;

    const hitEnchantmentResult = safeRead(() => ({
        type: hitEntity.getProperty("better_on_bedrock:enchantment_type"),
        level: hitEntity.getProperty("better_on_bedrock:enchantment_level") || 0
    }));
    if (!hitEnchantmentResult.succeeded)
        return;

    const damageEnchantmentResult = safeRead(() => ({
        type: damagingEntity.getProperty("better_on_bedrock:enchantment_type"),
        level: damagingEntity.getProperty("better_on_bedrock:enchantment_level") || 0
    }));
    if (!damageEnchantmentResult.succeeded)
        return;

    const dimension = dimensionResult.value;
    const hitLocation = hitLocationResult.value;
    const damagingLocation = damagingLocationResult.value;
    const hitEnchantmentType = hitEnchantmentResult.value.type;
    const hitEnchantmentLevel = hitEnchantmentResult.value.level;
    const damageEnchantmentType = damageEnchantmentResult.value.type;
    const damageEnchantmentLevel = damageEnchantmentResult.value.level;
    
    switch(hitEnchantmentType) {
        case "thorns": {
            const damageChance = [0, 3, 5, 10][hitEnchantmentLevel];
            if (Math.random() * 10 < damageChance) {
                if (!safeEntityOperation(damagingEntity, entity => {
                    entity.applyDamage(3);
                    entity.playSound("damage.thorns", { location: damagingLocation });
                })) return;
            };
            break;
        };
    };

    switch (damageEnchantmentType) {
        case "fire_aspect": {
            if (!safeEntityOperation(hitEntity, entity => entity.setOnFire(4)))
                return;
            break;
        };
        case "knockback": {
            const knockbackStrength = [0, 1, 3][damageEnchantmentLevel];
            if (!safeEntityOperation(hitEntity, entity => applyKnockback(entity, knockbackStrength)))
                return;
            break;
        };
        case "sharpness": {
            const sharpnessStrength = [0, 1, 3, 4, 5][damageEnchantmentLevel];
            if (!safeEntityOperation(hitEntity, entity => entity.applyDamage(sharpnessStrength + 2)))
                return;
            break;
        };
        case "mending": {
            if (Math.random() >= 0.8)
                return;

            if (!isEntityValid(damagingEntity) || !isEntityValid(hitEntity))
                return;

            if (!safeEntityOperation(hitEntity, entity => applyMending(damagingEntity, entity)))
                return;
            break;
        };
        case "oozing": {
            if (!isEntityValid(hitEntity))
                return;

            if (!safeDimensionOperation(hitEntity, (currentDimension, currentLocation) => {
                currentDimension.spawnEntity("minecraft:slime", currentLocation).triggerEvent("spawn_medium");
            }, dimension, hitLocation)) return;
            break;
        };
        case "infested": {
            if (!isEntityValid(hitEntity))
                return;

            if (!safeDimensionOperation(hitEntity, (currentDimension, currentLocation) => {
                currentDimension.spawnEntity("minecraft:silverfish", currentLocation);
            }, dimension, hitLocation)) return;
            break;
        };
    };
};

/**
 * @param { Entity | undefined } entity
 */
function isEntityValid(entity) {
    if (!entity)
        return false;

    try {
        if (typeof entity.isValid === "function")
            return entity.isValid();

        return entity.isValid !== false;
    } catch {
        return false;
    }
};

/**
 * @template T
 * @param { () => T } reader
 * @returns {{ succeeded: true, value: T } | { succeeded: false }}
 */
function safeRead(reader) {
    try {
        return { succeeded: true, value: reader() };
    } catch {
        return { succeeded: false };
    }
};

/**
 * @param { Entity } entity
 * @param { (entity: Entity) => void } operation
 */
function safeEntityOperation(entity, operation) {
    if (!isEntityValid(entity))
        return false;

    try {
        operation(entity);
        return true;
    } catch {
        return false;
    }
};

/**
 * @param { Entity } entity
 * @param { (dimension: import("@minecraft/server").Dimension, location: import("@minecraft/server").Vector3) => void } operation
 * @param { import("@minecraft/server").Dimension } fallbackDimension
 * @param { import("@minecraft/server").Vector3 } fallbackLocation
 */
function safeDimensionOperation(entity, operation, fallbackDimension, fallbackLocation) {
    if (!isEntityValid(entity))
        return false;

    const dimensionResult = safeRead(() => entity.dimension);
    if (!dimensionResult.succeeded)
        return false;

    const locationResult = safeRead(() => entity.location);
    if (!locationResult.succeeded)
        return false;

    try {
        operation(dimensionResult.value || fallbackDimension, locationResult.value || fallbackLocation);
        return true;
    } catch {
        return false;
    }
};

/**
 * @param { Entity } hitEntity
 * @param { number } knockbackStrength
 */
function applyKnockback(hitEntity, knockbackStrength) {
    const viewDirection = hitEntity.getViewDirection();
    const horizontalX = -viewDirection.z;
    const horizontalZ = 1;
    const horizontalLength = Math.hypot(horizontalX, horizontalZ) || 1;
    const horizontalVector = {
        x: (horizontalX / horizontalLength) * knockbackStrength,
        z: (horizontalZ / horizontalLength) * knockbackStrength
    };

    try {
        hitEntity.applyKnockback(horizontalVector, 0.4);
    } catch {
        hitEntity.applyKnockback(horizontalX / horizontalLength, horizontalZ / horizontalLength, knockbackStrength, 0.4);
    }
};

/**
 * @param { Entity } damagingEntity 
 * @param { Entity } hitEntity
 */
function applyMending(damagingEntity, hitEntity) {
    if (!(hitEntity instanceof Player))
        return;

    let xpEarned = hitEntity.xpEarnedAtCurrentLevel;
    if (xpEarned === 0)
        hitEntity.addLevels(-1);

    const totalXpNeeded = hitEntity.totalXpNeededForNextLevel;
    hitEntity.addExperience(
        hitEntity.xpEarnedAtCurrentLevel > 0 ? -7
        : totalXpNeeded - 7
    );

    const healthComponent = damagingEntity.getComponent("health");
    if (healthComponent !== void 0) {
        const value = Math.min(healthComponent.currentValue + 2, healthComponent.defaultValue);
        healthComponent.setCurrentValue(value);
    };
};
