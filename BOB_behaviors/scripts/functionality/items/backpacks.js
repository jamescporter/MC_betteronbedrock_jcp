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
const failedAtomicSaveBackpackIds = new Set()

function warnBackpack(message) {
    console.warn(`[BOB Backpacks] ${message}`)
}

system.runInterval(() => {
    try {
        globalTick++
    } catch (error) {
        const errorDetails = error instanceof Error ? (error.stack ?? `${error.name}: ${error.message}`) : String(error)
        warnBackpack(`Operation "global tick increment" failed. Error: ${errorDetails}`)
    }
}, 1)

function getBlockSafely(dimension, location) {
    try {
        return dimension.getBlock(location)
    } catch (e) {
        return undefined
    }
}

function portalNearby(player) {
    const baseLocation = toBlockPos(player.location)

    const minX = baseLocation.x - 1
    const maxX = baseLocation.x + 1
    const minY = baseLocation.y
    const maxY = baseLocation.y + 1
    const minZ = baseLocation.z - 1
    const maxZ = baseLocation.z + 1

    for (let checkX = minX; checkX <= maxX; checkX++) {
        for (let checkY = minY; checkY <= maxY; checkY++) {
            for (let checkZ = minZ; checkZ <= maxZ; checkZ++) {
                const block = getBlockSafely(player.dimension, { x: checkX, y: checkY, z: checkZ })

                if (
                    block?.typeId === "minecraft:portal" ||
                    block?.typeId === "minecraft:end_portal" ||
                    block?.typeId === "better_on_bedrock:waystone"
                ) return true
            }
        }
    }

    return false
}

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
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        warnBackpack(`Failed checking tag "${tag}" on entity ${entity.id ?? "unknown"} (${entity.typeId ?? "unknown"}): ${failureReason}`)
        return false
    }
}

function toBlockPos(vec) {
    return {
        x: Math.floor(vec.x),
        y: Math.floor(vec.y),
        z: Math.floor(vec.z)
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
    /**
     * @param {string} ID
     * @param {import("@minecraft/server").Dimension} dimension
     */
    static delete(ID, dimension) {
        return dimension.runCommand("structure delete " + ID)
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
    const playerId = entity.getDynamicProperty("playerID") ?? "unknown"
    const baseStructureId = "backpack" + id
    const upperStructureId = "backpack" + id + "_2"
    const stagingBasePos = toBlockPos({ x: entityLoc.x, y: 100, z: entityLoc.z })
    const stagingUpperPos = toBlockPos({ x: entityLoc.x, y: 101, z: entityLoc.z })
    const backupSuffix = `${globalTick}_${Math.floor(Math.random() * 1000000)}`
    const baseBackupStructureId = `bob_bp_tmp_${backupSuffix}`
    const upperBackupStructureId = `bob_bp_tmp_${backupSuffix}_2`
    const block = dim.getBlock(stagingBasePos)
    if (!block) return false
    const originalBasePermutation = block.permutation

    let block2 = undefined
    let originalUpperPermutation = undefined
    if (maxCount > 1) {
        block2 = dim.getBlock(stagingUpperPos)
        if (!block2) return false
        originalUpperPermutation = block2.permutation
    }

    const logStructureFailure = (operation, structureId, position, successCount) => {
        warnBackpack(`Failed to ${operation} structure ${structureId} for backpack ${id}, player ${playerId}, dimension ${dim.id} at (${position.x}, ${position.y}, ${position.z}): successCount=${successCount}.`)
    }
    const tryLoadStructure = (structureId, position, loadDimension, logFailure = true) => {
        try {
            const result = structure_Manager.load(structureId, position, loadDimension)
            if (result.successCount < 1) {
                if (logFailure) logStructureFailure("load", structureId, position, result.successCount)
                return false
            }
            return true
        } catch (e) {
            if (logFailure) {
                const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                warnBackpack(`Exception loading structure ${structureId} for backpack ${id}, player ${playerId}, dimension ${dim.id} at (${position.x}, ${position.y}, ${position.z}): ${failureReason}`)
            }
            return false
        }
    }
    const trySaveStructure = (structureId, position, fromPos, toPos, saveDimension, options) => {
        try {
            const result = structure_Manager.save(structureId, fromPos, toPos, saveDimension, options)
            if (result.successCount < 1) {
                logStructureFailure("save", structureId, position, result.successCount)
                return false
            }
            return true
        } catch (e) {
            const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
            warnBackpack(`Exception saving structure ${structureId} for backpack ${id}, player ${playerId}, dimension ${dim.id} at (${position.x}, ${position.y}, ${position.z}): ${failureReason}`)
            return false
        }
    }
    const tryDeleteStructure = (structureId) => {
        try {
            const result = structure_Manager.delete(structureId, dim)
            return result.successCount >= 1
        } catch (e) {
            return false
        }
    }
    const rollbackSavedStructure = (structureId, backupStructureId, existedBefore, position) => {
        warnBackpack(`Rolling back failed atomic save for backpack ${id}, player ${playerId}: restoring prior structure ${structureId}.`)
        if (existedBefore) {
            if (!tryLoadStructure(backupStructureId, position, dim)) {
                warnBackpack(`Atomic save rollback failed for backpack ${id}: backup structure ${backupStructureId} could not be loaded; ${structureId} may have been partially saved.`)
                return false
            }
            if (!trySaveStructure(structureId, position, position, position, dim, { includeEntities: false, saveLocation: "disk", includeBlocks: true })) {
                warnBackpack(`Atomic save rollback failed for backpack ${id}: prior structure ${structureId} could not be restored from ${backupStructureId}.`)
                return false
            }
            return true
        }
        if (!tryDeleteStructure(structureId)) {
            warnBackpack(`Atomic save rollback warning for backpack ${id}: new partial structure ${structureId} could not be deleted after a failed save.`)
            return false
        }
        return true
    }

    let baseChanged = false
    let upperChanged = false
    let baseExistedBefore = false
    let upperExistedBefore = false
    let basePersistedThisAttempt = false
    let upperPersistedThisAttempt = false
    let saveSucceeded = false
    let entityContainerForRollback = undefined
    let entitySnapshotForRollback = undefined

    try {
        const entityInv = entity.getComponent(EntityInventoryComponent.componentId)
        if (!entityInv?.container) return false
        entityContainerForRollback = entityInv.container
        const entitySnapshot = snapshotInventory(entityInv.container)
        entitySnapshotForRollback = entitySnapshot
        const stagedInventory = stageBackpackInventory(entitySnapshot, maxCount)
        if (!stagedInventory) return false

        baseExistedBefore = tryLoadStructure(baseStructureId, stagingBasePos, dim, false)
        if (baseExistedBefore) baseChanged = true
        if (baseExistedBefore && !trySaveStructure(baseBackupStructureId, stagingBasePos, stagingBasePos, stagingBasePos, dim, { includeEntities: false, saveLocation: "disk", includeBlocks: true })) return false

        if (maxCount > 1) {
            upperExistedBefore = tryLoadStructure(upperStructureId, stagingUpperPos, dim, false)
            if (upperExistedBefore) upperChanged = true
            if (upperExistedBefore && !trySaveStructure(upperBackupStructureId, stagingUpperPos, stagingUpperPos, stagingUpperPos, dim, { includeEntities: false, saveLocation: "disk", includeBlocks: true })) return false
        }

        block.setPermutation(BlockPermutation.resolve("barrel"))
        baseChanged = true
        const blockInv = block.getComponent(BlockInventoryComponent.componentId)
        if (!blockInv?.container) return false
        emptyInventory(blockInv.container)
        if (!writeStagedItems(blockInv.container, stagedInventory.baseItems)) return false

        if (block2 != undefined) {
            block2.setPermutation(BlockPermutation.resolve("barrel"))
            upperChanged = true
            const blockInv2 = block2.getComponent(BlockInventoryComponent.componentId)
            if (!blockInv2?.container) return false
            emptyInventory(blockInv2.container)
            if (!writeStagedItems(blockInv2.container, stagedInventory.upperItems)) return false
        }

        if (!trySaveStructure(baseStructureId, stagingBasePos, stagingBasePos, stagingBasePos, block.dimension, { includeEntities: false, saveLocation: "disk", includeBlocks: true })) return false
        basePersistedThisAttempt = true
        if (block2 != undefined) {
            if (!trySaveStructure(upperStructureId, stagingUpperPos, stagingUpperPos, stagingUpperPos, block2.dimension, { includeEntities: false, saveLocation: "disk", includeBlocks: true })) return false
            upperPersistedThisAttempt = true
        }

        if (!restoreInventory(entityInv.container, stagedInventory.emptyEntityItems)) return false
        for (const droppedItem of stagedInventory.droppedItems) spawnItemAnywhere(droppedItem, entityLoc, dim)
        emptyInventory(blockInv.container)
        if (block2 != undefined) {
            const blockInv2 = block2.getComponent(BlockInventoryComponent.componentId)
            if (blockInv2?.container) emptyInventory(blockInv2.container)
        }
        saveSucceeded = true
        failedAtomicSaveBackpackIds.delete(id)
    } finally {
        if (!saveSucceeded) {
            failedAtomicSaveBackpackIds.add(id)
            warnBackpack(`Atomic save failed for backpack ${id}, player ${playerId}; restoring entity inventory and rolling back any persisted structure writes.`)
            if (entityContainerForRollback && entitySnapshotForRollback && !restoreInventory(entityContainerForRollback, entitySnapshotForRollback)) {
                warnBackpack(`Atomic save rollback failed for backpack ${id}: entity inventory could not be restored completely.`)
            }
            if (upperPersistedThisAttempt) rollbackSavedStructure(upperStructureId, upperBackupStructureId, upperExistedBefore, stagingUpperPos)
            if (basePersistedThisAttempt) rollbackSavedStructure(baseStructureId, baseBackupStructureId, baseExistedBefore, stagingBasePos)
        }

        if (upperChanged && originalUpperPermutation != undefined) {
            const stagingUpperBlock = dim.getBlock(stagingUpperPos)
            if (stagingUpperBlock) stagingUpperBlock.setPermutation(originalUpperPermutation)
        }

        if (baseChanged) {
            const stagingBaseBlock = dim.getBlock(stagingBasePos)
            if (stagingBaseBlock) stagingBaseBlock.setPermutation(originalBasePermutation)
        }

        tryDeleteStructure(baseBackupStructureId)
        if (maxCount > 1) tryDeleteStructure(upperBackupStructureId)
    }

    if (!saveSucceeded) return false
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
    const backpackIdForSaveQueue = entity.getDynamicProperty("backpack_id")
    const key = backpackIdForSaveQueue != undefined ? `backpack:${backpackIdForSaveQueue}` : `entity:${entity.id}`
    const entityId = entity.id
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
                warnBackpack(`Closing unchanged backpack entity ${entityId} for player ${resolvedPlayerId} (${backpackId}).`)
                closeBackpackEntityWithoutSave(entity)
                return
            }

            const saved = saveBackpack(entity)
            if (saved) {
                if (backpackId != undefined) backpackInventoryState.set(backpackId, currentSignature)
                untrackActiveBackpackEntity(resolvedPlayerId, entityId)
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
        const logStructureFailure = (operation, structureId, position, successCount) => {
            warnBackpack(`Failed to ${operation} structure ${structureId} for backpack ${id}, player ${player.id}, dimension ${dim.id} at (${position.x}, ${position.y}, ${position.z}): successCount=${successCount}.`)
        }
        const tryLoadStructure = (structureId, position, loadDimension) => {
            try {
                const result = structure_Manager.load(structureId, position, loadDimension)
                if (result.successCount < 1) {
                    logStructureFailure("load", structureId, position, result.successCount)
                    return undefined
                }
                return result
            } catch (e) {
                const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                warnBackpack(`Exception loading structure ${structureId} for backpack ${id}, player ${player.id}, dimension ${dim.id} at (${position.x}, ${position.y}, ${position.z}): ${failureReason}`)
                return undefined
            }
        }
        const trySaveStructure = (structureId, position, fromPos, toPos, saveDimension, options) => {
            try {
                const result = structure_Manager.save(structureId, fromPos, toPos, saveDimension, options)
                if (result.successCount < 1) {
                    logStructureFailure("save", structureId, position, result.successCount)
                    return undefined
                }
                return result
            } catch (e) {
                const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                warnBackpack(`Exception saving structure ${structureId} for backpack ${id}, player ${player.id}, dimension ${dim.id} at (${position.x}, ${position.y}, ${position.z}): ${failureReason}`)
                return undefined
            }
        }
        let block2 = undefined
        const stagingBasePos = toBlockPos({ x: player.location.x, y: 100, z: player.location.z })
        const stagingUpperPos = toBlockPos({ x: player.location.x, y: 101, z: player.location.z })
        const block = dim.getBlock(stagingBasePos)
        if (!block) {
            warnBackpack(`Failed to load backpack ${id} for player ${player.id}: staging block at y=100 was unavailable.`)
            return undefined
        }
        if (maxCount > 1) block2 = dim.getBlock(stagingUpperPos)
        const lastBlock = block.permutation
        let lastBlock2 = undefined
        const baseStructureId = "backpack" + id
        const upperStructureId = "backpack" + id + "_2"
        const initialBaseLoad = tryLoadStructure(baseStructureId, stagingBasePos, dim)
        let initialUpperLoad = undefined

        if (maxCount > 1) {
            if (!block2) {
                warnBackpack(`Failed to load backpack ${id} for player ${player.id}: second staging block at y=101 was unavailable.`)
                return undefined
            }
            lastBlock2 = block2.permutation
            initialUpperLoad = tryLoadStructure(upperStructureId, stagingUpperPos, dim)
        }

        const baseExists = initialBaseLoad != undefined
        const upperExists = maxCount > 1 ? initialUpperLoad != undefined : true
        if (!baseExists || !upperExists) {
            const canInitialiseEmptyStructures = !failedAtomicSaveBackpackIds.has(id) && !baseExists && (maxCount <= 1 || !upperExists)
            if (!canInitialiseEmptyStructures) {
                warnBackpack(`Refusing to initialise missing backpack structure(s) for backpack ${id}, player ${player.id}; an existing or failed atomic save state may be present.`)
                block.setPermutation(lastBlock)
                if (block2 && lastBlock2 != undefined) block2.setPermutation(lastBlock2)
                return undefined
            }

            block.setPermutation(BlockPermutation.resolve("barrel"))
            if (!trySaveStructure(baseStructureId, stagingBasePos, stagingBasePos, stagingBasePos, block.dimension, { includeBlocks: true, includeEntities: false, saveLocation: "disk" })) return undefined
            if (maxCount > 1) {
                block2.setPermutation(BlockPermutation.resolve("barrel"))
                if (!trySaveStructure(upperStructureId, stagingUpperPos, stagingUpperPos, stagingUpperPos, dim, { includeBlocks: true, includeEntities: false, saveLocation: "disk" })) {
                    warnBackpack(`Initial empty-structure save failed for backpack ${id}; deleting newly-created base structure to avoid a partial initialisation.`)
                    try { structure_Manager.delete(baseStructureId, dim) } catch (e) {}
                    failedAtomicSaveBackpackIds.add(id)
                    return undefined
                }
            }
        }

        if (!tryLoadStructure(baseStructureId, stagingBasePos, dim)) return undefined
        if (maxCount > 1 && !tryLoadStructure(upperStructureId, stagingUpperPos, dim)) return undefined
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
            if (!transferInventory(blockInv2.container, entityInv.container, dim, block2.location, 0, 27, entityInv.container.size)) {
                closeBackpackEntityWithoutSave(backPack)
                return undefined
            }
            emptyInventory(blockInv2)
            system.runTimeout(() => {
                block_Manager.setBlock(dim, stagingUpperPos, "air")
                block2.setPermutation(lastBlock2)
            }, 1)
        }
        const blockInv = dim.getBlock(stagingBasePos)?.getComponent(BlockInventoryComponent.componentId)
        if (!blockInv?.container) {
            warnBackpack(`Failed loading primary backpack container for player ${player.id} (${id}); closing entity.`)
            closeBackpackEntityWithoutSave(backPack)
            return undefined
        }
        if (!transferInventory(blockInv.container, entityInv.container, dim, block.location, 0, 0, 27)) {
            closeBackpackEntityWithoutSave(backPack)
            return undefined
        }
        emptyInventory(blockInv)
        system.runTimeout(() => {
            block_Manager.setBlock(dim, stagingBasePos, "air")
            block.setPermutation(lastBlock)
        }, 1)
        backPack.setDynamicProperty("backpack_id", id)
        backPack.setDynamicProperty("playerID", player.id)
        backpackInventoryState.set(id, getBackpackSignature(backPack))
        backPack.nameTag = backpackData[backPack.typeId].name
        backPack.setDynamicProperty("playerID", player.id)
        return backPack
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        warnBackpack(`Failed to load backpack ${id} for player ${player.id}: ${failureReason}`)
        return undefined
    }
}

function snapshotInventory(container) {
    const items = []
    for (let i = 0; i < container.size; i++) {
        try {
            items.push(container.getItem(i))
        } catch (e) {
            const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
            warnBackpack(`Failed snapshotting backpack inventory slot ${i}: ${failureReason}`)
            return undefined
        }
    }
    return items
}

function restoreInventory(container, items) {
    if (!items || container.size < items.length) return false
    for (let i = 0; i < items.length; i++) {
        try {
            container.setItem(i, items[i])
        } catch (e) {
            const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
            warnBackpack(`Failed restoring backpack inventory slot ${i}: ${failureReason}`)
            return false
        }
    }
    return true
}

function stageBackpackInventory(sourceItems, maxCount) {
    if (!sourceItems) return undefined
    const baseItems = new Array(27).fill(undefined)
    const upperItems = new Array(27).fill(undefined)
    const emptyEntityItems = new Array(sourceItems.length).fill(undefined)
    const droppedItems = []
    const persistedSlots = maxCount > 1 ? 54 : 27

    for (let sourceSlot = 0; sourceSlot < sourceItems.length; sourceSlot++) {
        const item = sourceItems[sourceSlot]
        if (!item) continue

        if (unallowedItems.includes(item.typeId) || sourceSlot >= persistedSlots) {
            if (!unallowedItems.includes(item.typeId)) {
                warnBackpack(`Backpack staged save slot ${sourceSlot} is outside persisted capacity ${persistedSlots}; dropping ${item.typeId} safely instead of deleting it.`)
            }
            droppedItems.push(item)
            continue
        }

        if (sourceSlot < 27) {
            baseItems[sourceSlot] = item
        } else {
            upperItems[sourceSlot - 27] = item
        }
    }

    return { baseItems, upperItems, emptyEntityItems, droppedItems }
}

function writeStagedItems(container, items) {
    for (let i = 0; i < items.length; i++) {
        try {
            container.setItem(i, items[i])
        } catch (e) {
            const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
            warnBackpack(`Failed writing staged backpack item to slot ${i}: ${failureReason}`)
            return false
        }
    }
    return true
}

/**
 * @param {import("@minecraft/server").Container} container1
 * @param {import("@minecraft/server").Container} container2
 * @param {import("@minecraft/server").Dimension} dimension
 */
function transferInventory(container1, container2, dimension, fromInvLocation, FromInvStartingSlot, ToInvStartingSlot, maxSlot) {
    let destOffset = 0
    const sourceEndSlot = Math.min(maxSlot, container1.size)

    for (let sourceSlot = FromInvStartingSlot; sourceSlot < sourceEndSlot; sourceSlot++) {
        const destinationSlot = ToInvStartingSlot + destOffset
        let item = undefined

        try {
            item = container1.getItem(sourceSlot)
        } catch (e) {
            const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
            warnBackpack(`Failed reading backpack transfer source slot ${sourceSlot}: ${failureReason}`)
            return false
        }

        if (item == undefined) {
            destOffset++
            continue
        }

        if (!unallowedItems.includes(item.typeId) && destinationSlot < container2.size) {
            try {
                container2.setItem(destinationSlot, item)
            } catch (e) {
                const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                warnBackpack(`Failed writing backpack transfer destination slot ${destinationSlot}: ${failureReason}`)
                return false
            }
        } else {
            if (!unallowedItems.includes(item.typeId)) {
                warnBackpack(`Backpack transfer destination slot ${destinationSlot} is outside container size ${container2.size}; dropping ${item.typeId} safely instead of deleting it.`)
            }
            spawnItemAnywhere(item, fromInvLocation, dimension)
        }

        try {
            container1.setItem(sourceSlot, undefined)
        } catch (e) {
            const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
            warnBackpack(`Failed clearing backpack transfer source slot ${sourceSlot}: ${failureReason}`)
            return false
        }
        destOffset++
    }

    return true
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
    for (let i = 0; i < length; i++) {
        id = id + characters[Math.floor(Math.random() * characters.length)]
    }
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

/**
 * @param {import("@minecraft/server").Player} player
 */
function transitionToNotHoldingBackpack(player) {
    clearBackpackTick(player.id)
    if (safeHasTag(player, "!holding")) return
    removeAllIDTags(player, "")
    flushPlayerBackpacks(player.id, true)
    player.addTag("!holding")
}

/**
 * @param {import("@minecraft/server").Player} player
 */
function transitionToPortalBlocked(player) {
    transitionToNotHoldingBackpack(player)
}

/**
 * @param {import("@minecraft/server").Player} player
 * @param {import("@minecraft/server").ItemStack} item
 * @param {import("@minecraft/server").ContainerSlot} slot
 */
function transitionToHoldingBackpack(player, item, slot) {
    player.removeTag("!holding")

    let id = item.getDynamicProperty("backpack_id")
    if (id == undefined) {
        const random = generateRandomID(100)
        item.setDynamicProperty("backpack_id", random)
        slot.setItem(item)
        id = random
    }

    const tag = "holdingbackpack." + id
    if (safeHasTag(player, tag)) return

    flushPlayerBackpacks(player.id, true)
    flushDuplicateBackpacks(player.id, id)
    removeAllIDTags(player, tag)
    player.addTag(tag)
    if (!canRunPlayerOperation(player.id)) {
        cachedPlayerState.delete(player.id)
        return
    }
    const canUseBackpackLock = typeof tryLockBackpackOperation == "function" && typeof unlockBackpackOperation == "function"
    if (canUseBackpackLock && !tryLockBackpackOperation(id)) {
        cachedPlayerState.delete(player.id)
        return
    }

    let backpack = undefined
    try {
        markPlayerOperation(player.id)
        backpack = loadBackpack(item.typeId, player, item)
    } finally {
        if (canUseBackpackLock) unlockBackpackOperation(id)
    }

    const backpackValid = backpack?.isValid()
    if (!backpackValid) {
        warnBackpack(`Failed to initialise backpack entity for backpack ${id} and player ${player.id}: no valid entity returned.`)
        return
    }
    startBackpackTick(backpack, player, tag)
    trackActiveBackpackEntity(player.id, backpack.id)
    backpack.addTag(player.id)
    backpack.addTag("backpack")
}

system.runInterval(() => {
    let playerId = undefined
    try {
        for (const player of world.getAllPlayers()) {
            playerId = player.id
            const equipment = player.getComponent(EntityEquippableComponent.componentId)
            const slot = equipment.getEquipmentSlot(EquipmentSlot.Mainhand)
            const item = slot.getItem()
            const nearPortal = portalNearbyMemoized(player)
            const stateKey = buildPlayerStateKey(player, item, nearPortal)
            if (cachedPlayerState.get(player.id) == stateKey) continue
            cachedPlayerState.set(player.id, stateKey)

            const isBackpackItem = item && backpackIDs.includes(item.typeId)
            if (isBackpackItem && nearPortal == false) {
                transitionToHoldingBackpack(player, item, slot)
            } else if (isBackpackItem && nearPortal) {
                transitionToPortalBlocked(player)
            } else {
                transitionToNotHoldingBackpack(player)
            }
        }
    } catch (error) {
        const errorDetails = error instanceof Error ? (error.stack ?? `${error.name}: ${error.message}`) : String(error)
        warnBackpack(`Operation "5-tick player backpack loop" failed. Player id: ${playerId ?? "unknown"}. Error: ${errorDetails}`)
    }
}, 5)
world.afterEvents.playerJoin.subscribe((data) => {
    try {
        const player = world.getEntity(data.playerId)
        if (player)
            removeAllIDTags(player, "")
        cachedPlayerState.delete(data.playerId)
        portalNearbyCache.delete(data.playerId)
        clearBackpackTick(data.playerId)
    } catch (error) {
        const errorDetails = error instanceof Error ? (error.stack ?? `${error.name}: ${error.message}`) : String(error)
        warnBackpack(`Operation "playerJoin backpack initialisation" failed. Player id: ${data.playerId ?? "unknown"}. Error: ${errorDetails}`)
    }
})

world.afterEvents.playerLeave.subscribe((data) => {
    try {
        clearBackpackTick(data.playerId)
        cachedPlayerState.delete(data.playerId)
        portalNearbyCache.delete(data.playerId)
        flushPlayerBackpacks(data.playerId, true)
        activeBackpackEntityIdsByPlayer.delete(data.playerId)
    } catch (error) {
        const errorDetails = error instanceof Error ? (error.stack ?? `${error.name}: ${error.message}`) : String(error)
        warnBackpack(`Operation "playerLeave backpack cleanup" failed. Player id: ${data.playerId ?? "unknown"}. Error: ${errorDetails}`)
    }
})

system.runInterval(() => {
    let playerId = undefined
    let backpackId = undefined
    try {
        for (const dim of dims) {
            const backpacks = dim.getEntities({ tags: ["backpack"] })
            for (const backpack of backpacks) {
                backpackId = backpack.getDynamicProperty("backpack_id")
                const id = backpack.getDynamicProperty("playerID")
                playerId = id
                if (id != undefined) trackActiveBackpackEntity(id, backpack.id)
                const playerEntity = id != undefined ? world.getEntity(id) : undefined
                if (id != undefined) {
                    if (playerEntity == undefined || !safeHasTag(playerEntity, "holdingbackpack." + backpackId)) {
                        if (backpackId == undefined || backpackOperationLocks.has(backpackId)) continue
                        queueSaveBackpack(backpack, id, true)
                    }
                }
            }
        }
    } catch (error) {
        const errorDetails = error instanceof Error ? (error.stack ?? `${error.name}: ${error.message}`) : String(error)
        warnBackpack(`Operation "20-tick backpack reconciliation loop" failed. Player id: ${playerId ?? "unknown"}. Backpack id: ${backpackId ?? "unknown"}. Error: ${errorDetails}`)
    }
}, 20)
