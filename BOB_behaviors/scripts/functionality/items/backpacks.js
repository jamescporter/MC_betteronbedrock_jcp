import { world, system, EntityInventoryComponent, Dimension, ItemStack, ItemTypes, BlockPermutation, BlockInventoryComponent, MinecraftDimensionTypes, EquipmentSlot, EntityEquippableComponent } from "@minecraft/server";
const PLAYER_OPERATION_COOLDOWN_TICKS = 10
const SAVE_DEBOUNCE_TICKS = 4
const PORTAL_NEARBY_CACHE_TICKS = 1
const BACKPACK_FOLLOW_DISTANCE = 2
const BACKPACK_REPOSITION_THRESHOLD = 0.15
let globalTick = 0

const cachedPlayerState = new Map()
const activeBackpackTicks = new Map()
const pendingBackpackSaves = new Map()
const lastPlayerOperationTick = new Map()
const activeBackpackEntityIdsByPlayer = new Map()
const backpackInventoryState = new Map()
const portalNearbyCache = new Map()
const backpackOperationLocks = new Set()

function warnBackpack(message) {
    console.warn(`[BOB Backpacks] ${message}`)
}

system.runInterval(() => {
    globalTick++
}, 1)

function portalNearby(player) {
	const { x, y, z } = player.location;

	// Define the check area corners
	const corner1 = { x: x + 1, y: y + 1, z: z + 1 };
	const corner2 = { x: x - 1, y, z: z - 1 };

	// Iterate through individual block positions within the area
	for (let checkX = corner1.x; checkX >= corner2.x; checkX--) {
		for (let checkY = corner1.y; checkY >= corner2.y; checkY--) {
			for (let checkZ = corner1.z; checkZ >= corner2.z; checkZ--) {
				const location = { x: checkX, y: checkY, z: checkZ };
				const block = player.dimension.getBlock(location);

				if (
					block?.typeId === "minecraft:portal" ||
					block?.typeId === "minecraft:end_portal" ||
					block?.typeId === "better_on_bedrock:waystone"
				) return true;
			}
		}
	}

	return false;
};

function portalNearbyMemoized(player) {
    const cached = portalNearbyCache.get(player.id)
    if (cached && (globalTick - cached.tick) <= PORTAL_NEARBY_CACHE_TICKS) return cached.result
    const result = portalNearby(player)
    portalNearbyCache.set(player.id, { tick: globalTick, result })
    return result
}

function getBackpackFollowLocation(player) {
    const viewDir = player.getViewDirection()
    const headLoc = player.getHeadLocation()
    return {
        x: headLoc.x + (viewDir.x * BACKPACK_FOLLOW_DISTANCE),
        y: headLoc.y + (viewDir.y * BACKPACK_FOLLOW_DISTANCE),
        z: headLoc.z + (viewDir.z * BACKPACK_FOLLOW_DISTANCE)
    }
}

function distanceSquared(locationA, locationB) {
    const deltaX = locationA.x - locationB.x
    const deltaY = locationA.y - locationB.y
    const deltaZ = locationA.z - locationB.z
    return (deltaX * deltaX) + (deltaY * deltaY) + (deltaZ * deltaZ)
}

function safeHasTag(entity, tag) {
    if (!entity?.isValid()) return false

    try {
        return entity.hasTag(tag)
    } catch {
        return false
    }
}

//function loads structure with backpack entity

class structure_Manager {
    /**
     * @param {string} ID
     * @param {import("@minecraft/server").Vector3} location
     * @param {import("@minecraft/server").Vector3} location2
     * @param {import("@minecraft/server").Dimension} dimension
     * @param {{includeEntities: boolean, saveLocation: "disk" | "memory", includeBlocks: boolean}} structureOptions
     */
    static save(ID, location, location2, dimension, structureOptions) {
        return dimension.runCommand("structure save " + ID + " " + location.x + " " + location.y + " " + location.z + " " + location2.x + " " + location2.y + " " + location2.z + " " + structureOptions.includeEntities + " " + structureOptions.saveLocation + " " + structureOptions.includeBlocks)
    }
    /**
     * @param {string} ID
     * @param {import("@minecraft/server").Vector3} location
     * @param {import("@minecraft/server").Dimension} dimension
     */
    static load(ID, location, dimension) {
        return dimension.runCommand("structure load " + ID + " " + location.x + " " + location.y + " " + location.z)
    }
}

class block_Manager {
    /**
     * @param {import("@minecraft/server").Dimension} dimension
     * @param {import("@minecraft/server").Vector3} location
     * @param {string} blockID
     */
    static setBlock(dimension, location, blockID) {
        const block = dimension.getBlock(location)
        if (!block) return
        const normalizedID = blockID.includes(":") ? blockID : `minecraft:${blockID}`
        block.setPermutation(BlockPermutation.resolve(normalizedID))
    }
}

const backpackIDs = [
    "better_on_bedrock:backpack",
    "better_on_bedrock:backpack_medium",
    "better_on_bedrock:backpack_large"
]

const unallowedItems = backpackIDs.concat([
    "minecraft:undyed_shulker_box",
    "minecraft:white_shulker_box",
    "minecraft:orange_shulker_box",
    "minecraft:magenta_shulker_box",
    "minecraft:light_blue_shulker_box",
    "minecraft:yellow_shulker_box",
    "minecraft:lime_shulker_box",
    "minecraft:pink_shulker_box",
    "minecraft:gray_shulker_box",
    "minecraft:silver_shulker_box",
    "minecraft:cyan_shulker_box",
    "minecraft:purple_shulker_box",
    "minecraft:blue_shulker_box",
    "minecraft:brown_shulker_box",
    "minecraft:green_shulker_box",
    "minecraft:red_shulker_box",
    "minecraft:black_shulker_box"
])

const backpackData = {
    "better_on_bedrock:backpack": {
        count: 1,
        name: "Backpack"
    },
    "better_on_bedrock:backpack_medium": {
        count: 2,
        name: "Medium Backpack"
    },
    "better_on_bedrock:backpack_large": {
        count: 2,
        name: "Large Backpack"
    }
}
/**
 * @param {import("@minecraft/server").Entity} entity
 */
function saveBackpack(entity) {
    if (!entity?.isValid()) return false
    const dim = entity.dimension
    const entityLoc = entity.location
    const id = entity.getDynamicProperty("backpack_id")
    const data = backpackData[entity.typeId]
    if (id == undefined || !data) return false
    const maxCount = data.count
    const block = dim.getBlock({ x: entityLoc.x, y: 100, z: entityLoc.z })
    if (!block) return false
    const lastBlock = block.permutation
    let block2 = undefined
    let lastBlock2 = undefined
    if (maxCount > 1) {
        block2 = dim.getBlock({ x: entityLoc.x, y: 101, z: entityLoc.z })
        if (!block2) return false
        lastBlock2 = block2.permutation
        block2.setPermutation(BlockPermutation.resolve("barrel"))
    }
    block.setPermutation(BlockPermutation.resolve("barrel"))
    const entityInv = entity.getComponent(EntityInventoryComponent.componentId)
    const blockInv = block.getComponent(BlockInventoryComponent.componentId)
    if (!entityInv?.container || !blockInv?.container) return false
    if (block2 != undefined) {
        const blockInv2 = block2.getComponent(BlockInventoryComponent.componentId)
        if (!blockInv2?.container) return false
        transferInventory(entityInv.container, blockInv2.container, dim, entityLoc, 27, 0, entityInv.container.size)
        structure_Manager.save("backpack" + id + "_2", block2.location, block2.location, block2.dimension, { includeEntities: false, saveLocation: "disk", includeBlocks: true })
        emptyInventory(blockInv2)
        system.runTimeout(() => {
            block_Manager.setBlock(dim, block2.location, "air")
            block2.setPermutation(lastBlock2)
        }, 1)
    }
    transferInventory(entityInv.container, blockInv.container, dim, entityLoc, 0, 0, 27)
    structure_Manager.save("backpack" + id, block.location, block.location, block.dimension, { includeEntities: false, saveLocation: "disk", includeBlocks: true })
    emptyInventory(blockInv)
    system.runTimeout(() => {
        block_Manager.setBlock(dim, block.location, "air")
        block.setPermutation(lastBlock)
    }, 1)
    entity.remove()
    return true
}

function closeBackpackEntityWithoutSave(entity) {
    if (!entity?.isValid()) return
    const playerId = entity.getDynamicProperty("playerID")
    if (playerId != undefined) untrackActiveBackpackEntity(playerId, entity.id)
    const backpackId = entity.getDynamicProperty("backpack_id")

    // Never remove a backpack entity with items still inside it.
    // Direct removal can spill inventory entities into the world and create apparent duplication
    // against already-persisted structure data.
    const entityInv = entity.getComponent(EntityInventoryComponent.componentId)
    if (entityInv?.container) {
        const signature = getInventorySignature(entityInv.container)
        if (signature.includes(":")) {
            warnBackpack(`Safely closing backpack entity ${entity.id} for player ${playerId ?? "unknown"} (${backpackId ?? "unknown backpack id"}) with inventory contents.`)
        }
        emptyInventory(entityInv.container)
    }

    entity.remove()
}

function canRunPlayerOperation(playerId) {
    const lastTick = lastPlayerOperationTick.get(playerId)
    if (lastTick == undefined) return true
    return globalTick - lastTick >= PLAYER_OPERATION_COOLDOWN_TICKS
}

function markPlayerOperation(playerId) {
    lastPlayerOperationTick.set(playerId, globalTick)
}

function tryLockBackpackOperation(backpackId) {
    if (backpackId == undefined) return false
    if (backpackOperationLocks.has(backpackId)) return false
    backpackOperationLocks.add(backpackId)
    return true
}

function unlockBackpackOperation(backpackId) {
    if (backpackId == undefined) return
    backpackOperationLocks.delete(backpackId)
}

function queueSaveBackpack(entity, playerId, immediate = false, delayOverrideTicks = undefined) {
    if (!entity?.isValid()) return
    const resolvedPlayerId = playerId ?? entity.getDynamicProperty("playerID")
    if (resolvedPlayerId == undefined) return
    const key = entity.id
    const delay = delayOverrideTicks != undefined ? Math.max(1, delayOverrideTicks) : (immediate ? 0 : SAVE_DEBOUNCE_TICKS)
    const dueTick = globalTick + delay
    const existing = pendingBackpackSaves.get(key)
    if (existing != undefined) {
        if (dueTick < existing.dueTick) {
            system.clearRun(existing.runID)
            pendingBackpackSaves.delete(key)
        } else {
            return
        }
    }

    const runID = system.runTimeout(() => {
        const pending = pendingBackpackSaves.get(key)
        if (!pending || pending.runID != runID) return
        pendingBackpackSaves.delete(key)
        if (!entity.isValid()) return

        const lastTick = lastPlayerOperationTick.get(resolvedPlayerId)
        if (lastTick != undefined) {
            const ticksSinceLast = globalTick - lastTick
            if (ticksSinceLast < PLAYER_OPERATION_COOLDOWN_TICKS) {
                const remainingTicks = PLAYER_OPERATION_COOLDOWN_TICKS - ticksSinceLast
                queueSaveBackpack(entity, resolvedPlayerId, false, remainingTicks)
                return
            }
        }

        markPlayerOperation(resolvedPlayerId)
        const backpackId = entity.getDynamicProperty("backpack_id")
        if (!tryLockBackpackOperation(backpackId)) {
            queueSaveBackpack(entity, resolvedPlayerId, false, 1)
            return
        }
        try {
            const currentSignature = getBackpackSignature(entity)
            const previousSignature = backpackId != undefined ? backpackInventoryState.get(backpackId) : undefined
            if (backpackId != undefined && previousSignature == currentSignature) {
                // Unchanged backpacks still need a safe close path; direct removal can drop items.
                warnBackpack(`Closing unchanged backpack entity ${key} for player ${resolvedPlayerId} (${backpackId}).`)
                closeBackpackEntityWithoutSave(entity)
                return
            }

            const saved = saveBackpack(entity)
            if (saved) {
                if (backpackId != undefined) backpackInventoryState.set(backpackId, currentSignature)
                untrackActiveBackpackEntity(resolvedPlayerId, key)
            }
        } finally {
            unlockBackpackOperation(backpackId)
        }
    }, delay)

    pendingBackpackSaves.set(key, { runID, dueTick })
}

function buildPlayerStateKey(player, item, isPortalNearby) {
    const itemType = item?.typeId ?? "none"
    const backpackID = item?.getDynamicProperty("backpack_id") ?? "none"
    const dimensionID = player.dimension.id
    return `${itemType}|${backpackID}|${dimensionID}|${isPortalNearby}`
}

function clearBackpackTick(playerId) {
    const runID = activeBackpackTicks.get(playerId)
    if (runID != undefined) {
        system.clearRun(runID)
        activeBackpackTicks.delete(playerId)
    }
}

function getPlayerActiveBackpackIds(playerId) {
    let activeIds = activeBackpackEntityIdsByPlayer.get(playerId)
    if (activeIds == undefined) {
        activeIds = new Set()
        activeBackpackEntityIdsByPlayer.set(playerId, activeIds)
    }
    return activeIds
}

function trackActiveBackpackEntity(playerId, entityId) {
    getPlayerActiveBackpackIds(playerId).add(entityId)
}

function untrackActiveBackpackEntity(playerId, entityId) {
    const activeIds = activeBackpackEntityIdsByPlayer.get(playerId)
    if (activeIds == undefined) return
    activeIds.delete(entityId)
    if (activeIds.size < 1) activeBackpackEntityIdsByPlayer.delete(playerId)
}

function flushDuplicateBackpacks(playerId, backpackId) {
    if (playerId == undefined || backpackId == undefined) return
    let duplicateCount = 0
    for (const dim of dims) {
        const backpacks = dim.getEntities({ tags: [playerId, "backpack"] })
        for (const backpack of backpacks) {
            if (!backpack?.isValid()) continue
            if (backpack.getDynamicProperty("backpack_id") != backpackId) continue
            duplicateCount++
            queueSaveBackpack(backpack, playerId, true)
        }
    }
    if (duplicateCount > 1) {
        warnBackpack(`Detected ${duplicateCount} active backpack entities for player ${playerId} and backpack id ${backpackId}; queueing a forced save to collapse duplicates.`)
    }
}

function flushPlayerBackpacks(playerId, immediate = false) {
    const activeIds = activeBackpackEntityIdsByPlayer.get(playerId)
    if (activeIds && activeIds.size > 0) {
        const staleIds = []
        for (const entityId of activeIds) {
            const backpack = world.getEntity(entityId)
            if (backpack?.isValid()) {
                queueSaveBackpack(backpack, playerId, immediate)
            } else {
                staleIds.push(entityId)
            }
        }
        for (const staleId of staleIds) {
            activeIds.delete(staleId)
        }
        if (activeIds.size < 1) activeBackpackEntityIdsByPlayer.delete(playerId)
        return
    }

    for (const dim of dims) {
        const backpacks = dim.getEntities({ tags: [playerId, "backpack"] })
        for (const backpack of backpacks) {
            trackActiveBackpackEntity(playerId, backpack.id)
            queueSaveBackpack(backpack, playerId, immediate)
        }
    }
}

function getInventorySignature(container, startSlot = 0, maxSlot = container.size) {
    const signature = []
    for (let i = startSlot; i < maxSlot; i++) {
        const item = container.getItem(i)
        if (!item) {
            signature.push("_")
            continue
        }

        const lore = item.getLore?.() ?? []
        const durability = item.getComponent?.("minecraft:durability")
        const enchantable = item.getComponent?.("minecraft:enchantable")
        const enchantments = enchantable?.getEnchantments?.() ?? []
        const enchantmentSignature = []
        for (const enchantment of enchantments) {
            enchantmentSignature.push(`${enchantment.type.id}:${enchantment.level}`)
        }
        enchantmentSignature.sort()

        const dynamicPropertyIDs = item.getDynamicPropertyIds?.() ?? []
        dynamicPropertyIDs.sort()
        const dynamicPropertySignature = []
        for (const dynamicPropertyID of dynamicPropertyIDs) {
            dynamicPropertySignature.push([dynamicPropertyID, item.getDynamicProperty(dynamicPropertyID)])
        }

        signature.push([
            item.typeId,
            item.amount,
            item.data ?? 0,
            item.nameTag ?? "",
            item.lockMode ?? "",
            item.keepOnDeath ? 1 : 0,
            durability?.damage ?? -1,
            durability?.maxDurability ?? -1,
            lore.join("\n"),
            enchantmentSignature.join(","),
            JSON.stringify(dynamicPropertySignature)
        ].join(":"))
    }
    return signature.join("|")
}

function getBackpackSignature(entity) {
    const invComp = entity.getComponent(EntityInventoryComponent.componentId)
    const container = invComp.container
    return getInventorySignature(container)
}
/** 
* @param {string} entityTypeID
* @param {import("@minecraft/server").Player} player
* @param {import("@minecraft/server").ItemStack} item
*/
function loadBackpack(entityTypeID, player, item) {
    const dim = player.dimension
    const id = item.getDynamicProperty("backpack_id")
    const data = backpackData[entityTypeID]
    if (id == undefined || !data) return undefined
    const maxCount = data.count
    try {
        let block2 = undefined
        const block = dim.getBlock({ x: player.location.x, y: 100, z: player.location.z })
        if (!block) {
            warnBackpack(`Failed to load backpack ${id} for player ${player.id}: staging block at y=100 was unavailable.`)
            return undefined
        }
        if (maxCount > 1) block2 = dim.getBlock({ x: player.location.x, y: 101, z: player.location.z })
        const lastBlock = block.permutation
        let lastBlock2 = undefined
        if (maxCount > 1) {
            if (!block2) {
                warnBackpack(`Failed to load backpack ${id} for player ${player.id}: second staging block at y=101 was unavailable.`)
                return undefined
            }
            lastBlock2 = block2.permutation
            if (structure_Manager.load("backpack" + id + "_2", block2.location, dim).successCount < 1) {
                block2.setPermutation(BlockPermutation.resolve("barrel"))
                structure_Manager.save("backpack" + id + "_2", block2.location, block2.location, dim, { includeBlocks: true, includeEntities: false, saveLocation: "disk" })
            }
            structure_Manager.load("backpack" + id + "_2", block2.location, dim)
        }
        if (structure_Manager.load("backpack" + id, block.location, dim).successCount < 1) {
            block.setPermutation(BlockPermutation.resolve("barrel"))
            structure_Manager.save("backpack" + id, block.location, block.location, block.dimension, { includeBlocks: true, includeEntities: false, saveLocation: "disk" })
        }
        structure_Manager.load("backpack" + id, block.location, dim)
        const backPack = spawnEntityAnywhere(entityTypeID, getBackpackFollowLocation(player), dim)
        if (!backPack?.isValid()) return undefined
        const entityInv = backPack.getComponent(EntityInventoryComponent.componentId)
        if (!entityInv?.container) {
            warnBackpack(`Spawned backpack entity without inventory component for player ${player.id} (${id}); closing entity.`)
            closeBackpackEntityWithoutSave(backPack)
            return undefined
        }
        if (maxCount > 1) {
            const blockInv2 = block2.getComponent(BlockInventoryComponent.componentId)
            if (!blockInv2?.container) {
                warnBackpack(`Failed loading second backpack container for player ${player.id} (${id}); closing entity.`)
                closeBackpackEntityWithoutSave(backPack)
                return undefined
            }
            transferInventory(blockInv2.container, entityInv.container, dim, block2.location, 0, 27, entityInv.container.size)
            emptyInventory(blockInv2)
            system.runTimeout(() => {
                block_Manager.setBlock(dim, block2.location, "air")
                block2.setPermutation(lastBlock2)
            }, 1)
        }
        const blockInv = dim.getBlock(block.location)?.getComponent(BlockInventoryComponent.componentId)
        if (!blockInv?.container) {
            warnBackpack(`Failed loading primary backpack container for player ${player.id} (${id}); closing entity.`)
            closeBackpackEntityWithoutSave(backPack)
            return undefined
        }
        transferInventory(blockInv.container, entityInv.container, dim, block.location, 0, 0, 27)
        emptyInventory(blockInv)
        system.runTimeout(() => {
            block_Manager.setBlock(dim, block.location, "air")
            block.setPermutation(lastBlock)
        }, 1)
        backPack.setDynamicProperty("backpack_id", id)
        backPack.setDynamicProperty("playerID", player.id)
        backpackInventoryState.set(id, getBackpackSignature(backPack))
        backPack.nameTag = backpackData[backPack.typeId].name
        backPack.setDynamicProperty("playerID", player.id)
        return backPack
    } catch (error) {
        const failureReason = error instanceof Error ? `${error.name}: ${error.message}` : String(error)
        warnBackpack(`Failed to load backpack ${id} for player ${player.id}: ${failureReason}`)
        return undefined
    }
}

/**
 * @param {import("@minecraft/server").Container} container1
 * @param {import("@minecraft/server").Container} container2
 * @param {import("@minecraft/server").Dimension} dimension
 */
function transferInventory(container1, container2, dimension, fromInvLocation, FromInvStartingSlot, ToInvStartingSlot, maxSlot) {
    let targetSlot = ToInvStartingSlot
    const sourceEnd = Math.min(maxSlot, container1.size)

    for (let sourceSlot = FromInvStartingSlot; sourceSlot < sourceEnd; sourceSlot++) {
        if (targetSlot >= container2.size) break

        const item = container1.getItem(sourceSlot)
        if (item == undefined) {
            targetSlot++
            continue
        }

        if (!unallowedItems.includes(item.typeId)) {
            container2.setItem(targetSlot, item)
        } else {
            spawnItemAnywhere(item, fromInvLocation, dimension)
        }

        container1.setItem(sourceSlot, undefined)
        targetSlot++
    }
}

/**
 * @param {import("@minecraft/server").Container} container
 */
function emptyInventory(container) {
    for (let i = 0; i < container.size; i++) {
        if (container.getItem(i)) {
            container.setItem(i, undefined)
        }
    }
}

function spawnItemAnywhere(item, location, dimension) {
    const itemEntity = dimension.spawnItem(item, { x: location.x, y: 100, z: location.z })
    itemEntity.teleport(location)
    return itemEntity
}

/** 
 * @param {string} entityID
 * @param {import("@minecraft/server").Vector3} location
* @param {import("@minecraft/server").Dimension} dimension
*/
function spawnEntityAnywhere(entityID, location, dimension) {
    const entity = dimension.spawnEntity(entityID, { x: location.x, y: 100, z: location.z })
    entity.teleport(location)
    return entity
}

const dims = [
    world.getDimension(MinecraftDimensionTypes.overworld),
    world.getDimension(MinecraftDimensionTypes.nether),
    world.getDimension(MinecraftDimensionTypes.theEnd)
]

function generateRandomID(length) {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    let id = ""
    for (let i = 0; i < length; i++) try { id = id + characters[Math.floor(Math.random() * characters.length)] } catch { }
    return id
}

/**
* @param {import("@minecraft/server").Entity} entity
* @param {import("@minecraft/server").Player} player
*/
function startBackpackTick(entity, player, backpackTag) {
    clearBackpackTick(player.id)
    const runID = system.runInterval(() => {
        if (!player.isValid() || !entity.isValid()) {
            if (entity.isValid()) queueSaveBackpack(entity, player.id, true)
            clearBackpackTick(player.id)
            return
        }

        const equipment = player.getComponent(EntityEquippableComponent.componentId)
        const item = equipment.getEquipment(EquipmentSlot.Mainhand)
        const holdingCurrentBackpack = item && backpackIDs.includes(item.typeId) && safeHasTag(player, backpackTag)

        if (!holdingCurrentBackpack || portalNearbyMemoized(player)) {
            queueSaveBackpack(entity, player.id, true)
            clearBackpackTick(player.id)
            return
        }

        const targetLocation = getBackpackFollowLocation(player)
        if (distanceSquared(entity.location, targetLocation) > (BACKPACK_REPOSITION_THRESHOLD * BACKPACK_REPOSITION_THRESHOLD)) {
            entity.teleport(targetLocation)
        }
    }, 2)

    activeBackpackTicks.set(player.id, runID)
}
/**
 * @param {import("@minecraft/server").Player} player
 * @param {string} besidesTag
 */
function removeAllIDTags(player, besidesTag) {
    if (!player?.isValid()) return

    const allTags = player.getTags()
    for (const tag of allTags) {
        if (tag.startsWith("holdingbackpack.") && tag != besidesTag) player.removeTag(tag)
    }
}

system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        const equipment = player.getComponent(EntityEquippableComponent.componentId)
        const slot = equipment.getEquipmentSlot(EquipmentSlot.Mainhand)
        const item = slot.getItem()
        const nearPortal = portalNearbyMemoized(player)
        const stateKey = buildPlayerStateKey(player, item, nearPortal)
        if (cachedPlayerState.get(player.id) == stateKey) continue
        cachedPlayerState.set(player.id, stateKey)

        if (item) {
            if (backpackIDs.includes(item.typeId)) {
                if (nearPortal == false) {
                    player.removeTag("!holding")
                    let id = item.getDynamicProperty("backpack_id")
                    if (id == undefined) {
                        const random = generateRandomID(100)
                        item.setDynamicProperty("backpack_id", random)
                        slot.setItem(item)
                        id = random
                    }
                    const tag = "holdingbackpack." + id
                    if (!safeHasTag(player, tag)) {
                        flushPlayerBackpacks(player.id, true)
                        flushDuplicateBackpacks(player.id, id)
                        removeAllIDTags(player, tag)
                        player.addTag(tag)
                        if (!tryLockBackpackOperation(id)) {
                            cachedPlayerState.delete(player.id)
                            continue
                        }
                        if (!canRunPlayerOperation(player.id)) {
                            unlockBackpackOperation(id)
                            cachedPlayerState.delete(player.id)
                            continue
                        }
                        let backpack = undefined
                        try {
                            markPlayerOperation(player.id)
                            backpack = loadBackpack(item.typeId, player, item)
                        } finally {
                            unlockBackpackOperation(id)
                        }
                        const backpackValid = backpack?.isValid()
                        if (!backpackValid) {
                            warnBackpack(`Failed to initialise backpack entity for backpack ${id} and player ${player.id}: no valid entity returned.`)
                            continue
                        }
                        startBackpackTick(backpack, player, tag)
                        trackActiveBackpackEntity(player.id, backpack.id)
                        backpack.addTag(player.id)
                        backpack.addTag("backpack")
                    }
                } else {
                    clearBackpackTick(player.id)
                    if (!safeHasTag(player, "!holding")) {
                        removeAllIDTags(player, "")
                        flushPlayerBackpacks(player.id, true)
                        player.addTag("!holding")
                    }
                }
            } else {
                clearBackpackTick(player.id)
                if (!safeHasTag(player, "!holding")) {
                    removeAllIDTags(player, "")
                    flushPlayerBackpacks(player.id, true)
                    player.addTag("!holding")
                }
            }
        } else {
            clearBackpackTick(player.id)
            if (!safeHasTag(player, "!holding")) {
                removeAllIDTags(player, "")
                flushPlayerBackpacks(player.id, true)
                player.addTag("!holding")
            }
        }
    }
}, 5)
world.afterEvents.playerJoin.subscribe((data) => {
    const player = world.getEntity(data.playerId)
    if (player)
        removeAllIDTags(player, "")
    cachedPlayerState.delete(data.playerId)
    portalNearbyCache.delete(data.playerId)
    clearBackpackTick(data.playerId)
})

world.afterEvents.playerLeave.subscribe((data) => {
    clearBackpackTick(data.playerId)
    cachedPlayerState.delete(data.playerId)
    portalNearbyCache.delete(data.playerId)
    flushPlayerBackpacks(data.playerId, true)
    activeBackpackEntityIdsByPlayer.delete(data.playerId)
})

system.runInterval(() => {
    for (const dim of dims) {
        const backpacks = dim.getEntities({ tags: ["backpack"] })
        for (const backpack of backpacks) {
            const itemid = backpack.getDynamicProperty("backpack_id")
            const id = backpack.getDynamicProperty("playerID")
            if (id != undefined) trackActiveBackpackEntity(id, backpack.id)
            const playerEntity = id != undefined ? world.getEntity(id) : undefined
            if (id != undefined) {
                if (playerEntity == undefined || !safeHasTag(playerEntity, "holdingbackpack." + itemid)) {
                    if (itemid == undefined || backpackOperationLocks.has(itemid)) continue
                    queueSaveBackpack(backpack, id, true)
                }
            }
        }
    }
}, 20)
