import {
    system,

    Player,
    MolangVariableMap,
    ItemDurabilityComponent,
    EntityInventoryComponent,
    EntityProjectileComponent,

    GameMode,
    TicksPerSecond,
} from "@minecraft/server";

Player.prototype.aimingEntity = null;
Player.prototype.useSlots = undefined;
Player.prototype.staffUses = 0;
Player.prototype.isUsingStaff = false;
function getActiveStaffIntervals(player) {
    if (!(player.activeStaffIntervals instanceof Map))
        player.activeStaffIntervals = new Map();

    return player.activeStaffIntervals;
};

function getStaffUseSlots(player) {
    if (!Object.prototype.hasOwnProperty.call(player, "useSlots") || !Array.isArray(player.useSlots))
        player.useSlots = [];

    return player.useSlots;
};

function resetStaffState(player) {
    player.isUsingStaff = false;
    player.staffUses = 0;
    player.aimingEntity = null;
    getStaffUseSlots(player).length = 0;
};

function runManagedStaffInterval(player, key, callback) {
    const activeStaffIntervals = getActiveStaffIntervals(player);
    if (activeStaffIntervals.has(key))
        return;

    const run = system.runInterval(() => callback(run));
    activeStaffIntervals.set(key, run);
};

function clearManagedStaffInterval(player, key, run) {
    const activeStaffIntervals = getActiveStaffIntervals(player);
    const activeRun = activeStaffIntervals.get(key);
    if (activeRun !== run)
        return;

    system.clearRun(run);
    activeStaffIntervals.delete(key);
};

function clearAllStaffIntervals(player) {
    const activeStaffIntervals = getActiveStaffIntervals(player);
    for (const run of activeStaffIntervals.values())
        system.clearRun(run);

    activeStaffIntervals.clear();
};

/**
 * @param { import("@minecraft/server").Player } player
 * @param { string } particle
 * @param { function } effect
 * @param { function } shouldStop
 */
function staffEffect(player, key, particle, effect, shouldStop) {
    player.isUsingStaff = true;
            
    let ticks = 0;
    runManagedStaffInterval(player, key, (run) => {
        if (shouldStop()) {
            clearManagedStaffInterval(player, key, run);
            if (getActiveStaffIntervals(player).size === 0)
                resetStaffState(player);
            return;
        };

        system.runJob(function* () {
            const map = new MolangVariableMap();
            const headLocation = player.getHeadLocation();
            
            const rotation = player.getRotation();
            map.setFloat("rotation_x", rotation.x);
            map.setFloat("rotation_y", rotation.y);

            player.dimension.spawnParticle(particle, headLocation, map);
            yield;

            if (ticks % 20 == 0) {
                const viewDirection = player.getViewDirection();
                effect({ headLocation, viewDirection });
                player.staffUses++;
            };

            ticks++;
            yield;
        }());
    });
};

function staffSoundEffect(player, key, sound, shouldStop) {
    player.isUsingStaff = true;
            
    let ticks = 0;
    runManagedStaffInterval(player, key, (run) => {
        if (shouldStop()) {
            clearManagedStaffInterval(player, key, run);
            if (getActiveStaffIntervals(player).size === 0)
                resetStaffState(player);
            return;
        };

        system.runJob(function* () {
            if (ticks % 60 == 0) {
                player.dimension.playSound(sound, player.getHeadLocation());
                player.staffUses++;
            };

            ticks++;
            yield;
        }());
    });
};

/** @param { import("@minecraft/server").Player } player */
function getEntities(player, headLocation = player.getHeadLocation(), viewDirection = player.getViewDirection()) {
    const options = {
        maxDistance: 10,
    };

    const uniqueEntities = new Map();

    const addEntitiesFromRay = (direction) => {
        for (const { entity } of player.dimension.getEntitiesFromRay({
            x: headLocation.x + viewDirection.x,
            y: headLocation.y + viewDirection.y,
            z: headLocation.z + viewDirection.z,
        }, direction, options)) {
            uniqueEntities.set(entity.id, entity);
        };
    };

    addEntitiesFromRay({ x: viewDirection.x - 0.025, y: viewDirection.y, z: viewDirection.z + 0.025 });
    addEntitiesFromRay(viewDirection);
    addEntitiesFromRay({ x: viewDirection.x + 0.025, y: viewDirection.y, z: viewDirection.z - 0.025 });

    return [ ...uniqueEntities.values() ];
};

/**
 * @param { import("@minecraft/server").ItemStack } itemStack
 * @param { import("@minecraft/server").Player } player
 */
export function staffs(itemStack, player) {
    if (!player?.isValid() || !itemStack?.hasTag("better_on_bedrock:staff"))
        return;

    function shouldStop() {
        if (itemStack.hasComponent(ItemDurabilityComponent.componentId)) {
            const durability = itemStack.getComponent(ItemDurabilityComponent.componentId);
            if (!durability)
                return !player.isUsingStaff;

            if (durability.damage + player.staffUses >= durability.maxDurability) {
                player.sendMessage([
                    { text: "§c[!] §r" },
                    { translate: "bob.message.staffs.outOfMana" },
                ]);
            };

            return (
                !player.isUsingStaff
                || durability.damage + player.staffUses >= durability.maxDurability
            );
        };

        return !player.isUsingStaff;
    };

    const useSlots = getStaffUseSlots(player);
    if (!player.isSneaking && useSlots.length === 0)
        useSlots.push(player.selectedSlotIndex);

    switch (itemStack.typeId) {
        case "better_on_bedrock:staff": {
            if (player.isSneaking)
                return;

            staffEffect(player, "better_on_bedrock:staff:effect", "pog:staff_beam", ({ headLocation, viewDirection }) => {
                const entities = getEntities(player, headLocation, viewDirection);
                for (const entity of entities) {
                    entity.addEffect("levitation", 2.5 * TicksPerSecond, {
                        amplifier: 2,
                        showParticles: false
                    });
                };
            }, shouldStop);
            staffSoundEffect(player, "better_on_bedrock:staff:sound", "staff.basic.use", shouldStop);
            break;
        };
        case "better_on_bedrock:ice_staff": {
            if (getActiveStaffIntervals(player).has("better_on_bedrock:ice_staff:effect"))
                return;

            player.isUsingStaff = true;
            if (shouldStop())
                return;
            player.dimension.playSound("staff.ice.use", player.getHeadLocation());
        
            const entity = player.dimension.spawnEntity("better_on_bedrock:wand_iceologer_iceblock", {
                x: player.location.x,
                y: player.location.y + 3.5,
                z: player.location.z
            });
    
            const projectile = entity.getComponent(EntityProjectileComponent.componentId);
            if (projectile)
                projectile.owner = player;

            entity.addTag("staff_entity");
            entity.addTag(player.id);
            
            runManagedStaffInterval(player, "better_on_bedrock:ice_staff:effect", (run) => {
                if (shouldStop()) {
                    clearManagedStaffInterval(player, "better_on_bedrock:ice_staff:effect", run);
                    resetStaffState(player);
                    return;
                };

                const headLocation = player.getHeadLocation();
                const viewDirection = player.getViewDirection();
                const aimingEntity = player.dimension.getEntitiesFromRay({
                    x: headLocation.x + viewDirection.x,
                    y: headLocation.y + viewDirection.y,
                    z: headLocation.z + viewDirection.z,
                }, viewDirection, {
                    maxDistance: 15,
                    excludeTypes: [ "minecraft:item", entity.typeId ],
                })
                .map(({ entity }) => entity)[0];

                system.runJob(function* () {
                    try {
                        if (aimingEntity?.isValid()) {
                            player.aimingEntity = aimingEntity;
                            entity.teleport({
                                x: aimingEntity.location.x,
                                y: aimingEntity.location.y + 3.5,
                                z: aimingEntity.location.z
                            });
                        }
                        else {
                            player.aimingEntity = null;
                            entity.teleport({
                                x: player.location.x,
                                y: player.location.y + 3.5,
                                z: player.location.z
                            });
                        };
                    } catch {};
                    yield;
                }());
            });
            break;
        };
        case "better_on_bedrock:flender_staff": {
            player.isUsingStaff = true;
            if (shouldStop())
                return;
            player.dimension.playSound("staff.flender.use", player.getHeadLocation());
        
            const headLocation = player.getHeadLocation();
            const viewDirection = player.getViewDirection();
            const spawnLocation = {
                x: headLocation.x + viewDirection.x,
                y: headLocation.y + viewDirection.y,
                z: headLocation.z + viewDirection.z,
            };
            
            const entity = player.dimension.spawnEntity("better_on_bedrock:flender_fireball", spawnLocation);
            entity.applyImpulse({
                x: viewDirection.x * 1.4,
                y: viewDirection.y * 1.2,
                z: viewDirection.z * 1.4,
            });
            break;
        };
        case "better_on_bedrock:flame_staff": {
            if (player.isSneaking)
                return;
            player.dimension.playSound("staff.fire.use", player.getHeadLocation());
            
            staffEffect(player, "better_on_bedrock:flame_staff:effect", "pog:flame_beam", ({ headLocation, viewDirection }) => {
                const entities = getEntities(player, headLocation, viewDirection);

                for (const entity of entities) {
                    entity.setOnFire(2.5, true);
                };
            }, shouldStop);
            staffSoundEffect(player, "better_on_bedrock:flame_staff:sound", "staff.fire.breath", shouldStop);
            break;
        };
    };
};

/**
 * @param { import("@minecraft/server").ItemStack } itemStack
 * @param { import("@minecraft/server").Player } player
 */
function getStaffSlot(player) {
    return getStaffUseSlots(player)[0] ?? player.selectedSlotIndex;
};

function manaCheck(itemStack, player, sendMessage = false) {
    const slot = getStaffSlot(player);
    if (slot === void 0)
        return true;

    if (itemStack.hasComponent(ItemDurabilityComponent.componentId)) {
        const durability = itemStack.getComponent(ItemDurabilityComponent.componentId);
        if (!durability || durability.damage + 25 > durability.maxDurability) {
            if (sendMessage) {
                player.sendMessage([
                    { text: "§c[!] §r" },
                    { translate: "bob.message.staffs.notEnoughMana" },
                ]);
            };
            
            return true;
        };

        if (player.getGameMode() !== GameMode.creative)
            durability.damage += 25;

        const inventory = player.getComponent(EntityInventoryComponent.componentId)?.container;
        if (!inventory)
            return true;

        inventory.setItem(slot, itemStack);
        getStaffUseSlots(player).shift();
    };
};

/**
 * @param { import("@minecraft/server").ItemStack } itemStack
 * @param { import("@minecraft/server").Player } player
 */
export function useStaff(itemStack, player) {
    if (!player?.isValid() || !itemStack?.hasTag("better_on_bedrock:staff") || !player.isSneaking)
        return;

    const specialCooldowns = {
        "better_on_bedrock:staff": {
            cooldownItem: "better_on_bedrock:staff",
        },
        "better_on_bedrock:flame_staff": {
            cooldownItem: "better_on_bedrock:staff",
        },
    };

    function isSpecialOnCooldown(staffTypeId) {
        const cooldownData = specialCooldowns[staffTypeId];
        if (!cooldownData)
            return false;

        const cooldownSeconds = player.getItemCooldown(cooldownData.cooldownItem) / TicksPerSecond;
        return cooldownSeconds > 0;
    };

    if (isSpecialOnCooldown(itemStack.typeId))
        return;

    const headLocation = player.getHeadLocation();
    const viewDirection = player.getViewDirection();
    const spawnLocation = {
        x: headLocation.x + viewDirection.x,
        y: headLocation.y + viewDirection.y,
        z: headLocation.z + viewDirection.z,
    };

    switch (itemStack.typeId) {
        case "better_on_bedrock:staff": {
            if (manaCheck(itemStack, player, true))
                return;

            const entity = player.dimension.spawnEntity("minecraft:shulker_bullet", spawnLocation);
            entity.applyImpulse(viewDirection);

            player.dimension.playSound("mob.shulker.shoot", player.getHeadLocation());

            const projectile = entity.getComponent(EntityProjectileComponent.componentId);
            if (projectile)
                projectile.owner = player;
            break;
        };
        case "better_on_bedrock:flame_staff": {
            if (manaCheck(itemStack, player, true))
                return;

            const entity = player.dimension.spawnEntity("better_on_bedrock:fireballinit", spawnLocation);
            entity.applyImpulse(viewDirection);

            player.dimension.playSound("mob.ghast.fireball", player.getHeadLocation());
            break;
        };
        case "better_on_bedrock:ice_staff":
        case "better_on_bedrock:flender_staff":
        default: break;
    };
};

/**
 * @param { import("@minecraft/server").ItemStack } itemStack
 * @param { import("@minecraft/server").Player } player
 */
export function releaseStaffs(itemStack, player) {
    if (!player?.isValid() || !player.isUsingStaff)
        return;

    player.isUsingStaff = false;
    clearAllStaffIntervals(player);

    if (!itemStack?.hasTag("better_on_bedrock:staff")) {
        resetStaffState(player);
        return;
    }

    switch (itemStack.typeId) {
        case "better_on_bedrock:ice_staff": {
            if (manaCheck(itemStack, player)) {
                resetStaffState(player);
                return;
            }
            
            const viewDirection = player.getViewDirection();
            const hadAimingEntity = !!player.aimingEntity;
            resetStaffState(player);
            system.runTimeout(() => {
                if (!player.isValid() || hadAimingEntity)
                    return;

                const staffEntities = player.dimension.getEntities({ tags: [ "staff_entity", player.id ] });
                for (const entity of staffEntities) {
                    entity.applyImpulse({
                        x: viewDirection.x * 2,
                        y: viewDirection.y * 1.5,
                        z: viewDirection.z * 2,
                    });
                };
            }, 2);
            return;
        };
        case "better_on_bedrock:flender_staff": {
            manaCheck(itemStack, player);
            resetStaffState(player);
            return;
        };

        default: break;
    };

    const inventory = player.getComponent(EntityInventoryComponent.componentId)?.container;
    const slot = getStaffSlot(player);
    getStaffUseSlots(player).shift();
    if (!inventory || slot === void 0) {
        resetStaffState(player);
        return;
    }

    const lastItemStack = inventory.getItem(slot);
    if (
        lastItemStack?.hasTag("better_on_bedrock:staff")
        && itemStack.hasComponent(ItemDurabilityComponent.componentId)
    ) {
        const durability = itemStack.getComponent(ItemDurabilityComponent.componentId);

        if (player.getGameMode() !== GameMode.creative)
            durability.damage = Math.min(durability.damage + player.staffUses, durability.maxDurability);

        inventory.setItem(slot, itemStack);
    };
    resetStaffState(player);
};
