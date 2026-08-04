import { world, system, EntityInventoryComponent, DimensionTypes, BlockPermutation, BlockInventoryComponent, EquipmentSlot, EntityEquippableComponent } from "@minecraft/server";
import { hasBackpackRecoveryAccess } from "./backpack_recovery_sessions.js";

function warnBackpack(message) {
    console.warn(`[BOB Backpacks] ${message}`)
}

const BACKPACK_PLAYER_LOOP_INTERVAL_TICKS = 1

function locText(location) {
    try {
        if (location == undefined) return "missing-location"
        return `x=${Number(location.x).toFixed(2)},y=${Number(location.y).toFixed(2)},z=${Number(location.z).toFixed(2)}`
    } catch {
        return "invalid-location"
    }
}

function validText(entity) {
    try {
        if (entity == undefined) return "missing"
        if (typeof entity.isValid == "function") return String(entity.isValid())
        return String(entity.isValid)
    } catch {
        return "invalid-check-failed"
    }
}

function containerSummary(container) {
    try {
        if (container == undefined) return "missing-container"

        let occupied = 0
        let totalItems = 0
        const occupiedSlots = []

        for (let i = 0; i < container.size; i++) {
            let item = undefined
            try {
                item = container.getItem(i)
            } catch (e) {
                const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                return `size=${container.size},read-failed-slot=${i},error=${failureReason}`
            }

            if (item == undefined) continue

            occupied++
            totalItems += item.amount
            occupiedSlots.push(`${i}:${item.typeId}x${item.amount}`)
        }

        return `size=${container.size},occupied=${occupied},totalItems=${totalItems},slots=[${occupiedSlots.join(", ")}]`
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        return `container-summary-failed:${failureReason}`
    }
}

function getBlockSafely(dimension, location) {
    try {
        return dimension.getBlock(location)
    } catch {
        return undefined
    }
}

function portalNearby(player) {
    const { x, y, z } = player.location

    const corner1 = { x: x + 1, y: y + 1, z: z + 1 }
    const corner2 = { x: x - 1, y, z: z - 1 }

    for (let checkX = corner1.x; checkX >= corner2.x; checkX--) {
        for (let checkY = corner1.y; checkY >= corner2.y; checkY--) {
            for (let checkZ = corner1.z; checkZ >= corner2.z; checkZ--) {
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
        const block = getBlockSafely(dimension, location)
        if (!block) return false
        const normalizedID = blockID.includes(":") ? blockID : `minecraft:${blockID}`
        block.setPermutation(BlockPermutation.resolve(normalizedID))
        return true
    }
}

export const backpackIDs = [
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

const BACKPACK_ID_LENGTH = 100
const BACKPACK_STAGING_BASE_Y = 100
const BACKPACK_STAGING_SECOND_Y = 101
const reportedDuplicateBackpacks = new Set()

function getBackpackStructureId(id, part = "") {
    if (typeof id != "string" || id.length < 1) return undefined
    return `backpack${id}${part}`
}

function getCurrentStorageStructureId(id, part = "") {
    if (typeof id != "string" || id.length < 1) return undefined
    return `bob_bp_${id}${part}`
}

function getBackpackStructureCandidates(item, id, part = "") {
    const candidates = []
    const addCandidate = (candidate) => {
        if (candidate != undefined && !candidates.includes(candidate)) candidates.push(candidate)
    }

    addCandidate(getBackpackStructureId(id, part))

    const storageId = item.getDynamicProperty("backpack_storage_id")
    const legacyStorageId = item.getDynamicProperty("backpack_legacy_storage_id")
    for (const candidateId of [storageId, legacyStorageId, id]) {
        addCandidate(getCurrentStorageStructureId(candidateId, part))
    }

    return candidates
}

function runStructureSave(structureId, from, to, dimension, options, context) {
    try {
        const result = structure_Manager.save(structureId, from, to, dimension, options)

        if (result.successCount < 1) {
            warnBackpack(`Failed to save structure ${structureId} for ${context}; successCount=${result.successCount}.`)
            return false
        }

        return true
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        warnBackpack(`Exception saving structure ${structureId} for ${context}: ${failureReason}`)
        return false
    }
}

function runStructureLoad(structureId, location, dimension, context) {
    try {
        const result = structure_Manager.load(structureId, location, dimension)

        if (result.successCount < 1) return false
        return true
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        warnBackpack(`Exception loading structure ${structureId} for ${context}: ${failureReason}`)
        return false
    }
}

function loadFirstAvailableStructure(structureIds, location, dimension, context) {
    for (const structureId of structureIds) {
        if (runStructureLoad(structureId, location, dimension, context)) return structureId
    }

    return undefined
}

function removeBackpackEntityWithoutDrops(entity) {
    if (!entity?.isValid()) return

    const entityInv = entity.getComponent(EntityInventoryComponent.componentId)

    if (entityInv?.container) {
        emptyInventory(entityInv.container)
    }

    entity.remove()
}

function getMatchingBackpackEntities(playerId, backpackId) {
    if (typeof playerId != "string" || typeof backpackId != "string") return []

    const matches = []
    for (const dimension of dimensions) {
        const dim = world.getDimension(dimension.typeId)
        for (const entity of dim.getEntities({ families: ["backpack"] })) {
            if (
                entity?.isValid() &&
                backpackIDs.includes(entity.typeId) &&
                entity.getDynamicProperty("playerID") === playerId &&
                entity.getDynamicProperty("backpack_id") === backpackId
            ) matches.push(entity)
        }
    }

    return matches
}

function getBackpackEntities(dimension, playerId = undefined) {
    return dimension.getEntities({ families: ["backpack"] }).filter(entity => (
        backpackIDs.includes(entity.typeId) &&
        (playerId == undefined || entity.getDynamicProperty("playerID") === playerId)
    ))
}

function quarantineDuplicateBackpacks(playerId, backpackId, reason) {
    const matches = getMatchingBackpackEntities(playerId, backpackId)
    if (matches.length < 2) return false

    const key = `${playerId}:${backpackId}`
    const shouldReport = !reportedDuplicateBackpacks.has(key)
    let entityDetails = undefined

    if (shouldReport) {
        reportedDuplicateBackpacks.add(key)
        entityDetails = matches.map(entity => {
            const inventory = entity.getComponent(EntityInventoryComponent.componentId)?.container
            return `entityId=${entity.id},type=${entity.typeId},dimension=${entity.dimension.id},location=${locText(entity.location)},valid=${validText(entity)},quarantined=${entity.getDynamicProperty("backpack_quarantined") === true},inventory={${containerSummary(inventory)}},storedPlayerId=${entity.getDynamicProperty("playerID") ?? "missing"},storedBackpackId=${entity.getDynamicProperty("backpack_id") ?? "missing"}`
        })
    }

    for (const entity of matches) entity.setDynamicProperty("backpack_quarantined", true)

    const player = world.getEntity(playerId)
    const heldItem = player?.isValid() ? getHeldBackpackItem(player) : undefined
    const heldBackpackId = heldItem?.getDynamicProperty("backpack_id")
    const expectedTag = `holdingbackpack.${backpackId}`
    const hasExpectedTag = shouldReport && player?.isValid() ? player.hasTag(expectedTag) : false
    if (player?.isValid() && heldBackpackId === backpackId) player.addTag(expectedTag)

    if (shouldReport) {
        const playerDetails = `playerValid=${validText(player)},playerDimension=${player?.isValid() ? player.dimension.id : "missing"},heldType=${heldItem?.typeId ?? "none"},heldBackpackId=${heldBackpackId ?? "none"},expectedTag=${expectedTag},hasExpectedTag=${hasExpectedTag}`
        warnBackpack(`Duplicate active backpacks require recovery; reason=${reason}; playerId=${playerId},backpackId=${backpackId}; ${playerDetails}; matches=[${entityDetails.join("; ")}]. No duplicate was saved or removed.`)
    }

    return true
}

/**
 * @param {import("@minecraft/server").Entity} entity
 */
function saveBackpack(entity, reason = "unspecified") {
    if (!entity?.isValid()) return false
    if (entity.getDynamicProperty("backpack_quarantined") === true) return false

    const dim = entity.dimension
    const entityLoc = entity.location
    const id = entity.getDynamicProperty("backpack_id")
    const playerId = entity.getDynamicProperty("playerID")
    const data = backpackData[entity.typeId]
    if (typeof id != "string" || !data) return false

    const context = `backpack ${id}, player ${playerId ?? "unknown"}`
    if (quarantineDuplicateBackpacks(playerId, id, `save: ${reason}`)) return false

    const maxCount = data.count

    const block = getBlockSafely(dim, { x: entityLoc.x, y: BACKPACK_STAGING_BASE_Y, z: entityLoc.z })

    if (!block) {
        warnBackpack(`Primary staging block was unavailable while saving ${context}.`)
        return false
    }

    const lastBlock = block.permutation
    let block2 = undefined
    let lastBlock2 = undefined

    if (maxCount > 1) {
        block2 = getBlockSafely(dim, { x: entityLoc.x, y: BACKPACK_STAGING_SECOND_Y, z: entityLoc.z })

        if (!block2) {
            warnBackpack(`Secondary staging block was unavailable while saving ${context}.`)
            return false
        }

        lastBlock2 = block2.permutation
    }

    let baseChanged = false
    let secondChanged = false
    let saved = false

    try {
        if (block2 != undefined) {
            block2.setPermutation(BlockPermutation.resolve("minecraft:barrel"))
            secondChanged = true
        }

        block.setPermutation(BlockPermutation.resolve("minecraft:barrel"))
        baseChanged = true

        const entityInv = entity.getComponent(EntityInventoryComponent.componentId)
        const blockInv = block.getComponent(BlockInventoryComponent.componentId)


        if (!entityInv?.container || !blockInv?.container) {
            warnBackpack(`Inventory component was unavailable while saving ${context}.`)
            return false
        }

        if (block2 != undefined) {
            const blockInv2 = block2.getComponent(BlockInventoryComponent.componentId)

            if (!blockInv2?.container) {
                warnBackpack(`Secondary barrel inventory was unavailable while saving ${context}.`)
                return false
            }

            if (!transferInventory(entityInv.container, blockInv2.container, dim, entityLoc, 27, 0, entityInv.container.size)) {
                return false
            }


            if (!runStructureSave(getBackpackStructureId(id, "_2"), block2.location, block2.location, block2.dimension, { includeEntities: false, saveLocation: "disk", includeBlocks: true }, context)) {
                return false
            }

            clearBlockInventory(block2)
        }

        if (!transferInventory(entityInv.container, blockInv.container, dim, entityLoc, 0, 0, 27)) {
            return false
        }


        if (!runStructureSave(getBackpackStructureId(id), block.location, block.location, block.dimension, { includeEntities: false, saveLocation: "disk", includeBlocks: true }, context)) {
            return false
        }

        clearBlockInventory(block)

        emptyInventory(entityInv.container)

        saved = true
    } finally {
        if (secondChanged && lastBlock2 != undefined) {
            const inv2 = block2?.getComponent(BlockInventoryComponent.componentId)
			clearBlockInventory(block2)
			block_Manager.setBlock(dim, block2.location, "air")
			block2.setPermutation(lastBlock2)
        }

        if (baseChanged) {
            const inv1 = block?.getComponent(BlockInventoryComponent.componentId)
			clearBlockInventory(block)
			block_Manager.setBlock(dim, block.location, "air")
			block.setPermutation(lastBlock)
        }
    }

    if (!saved) {
        return false
    }

    entity.remove()
    return true
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
    if (typeof id != "string" || !data) return undefined

    const existing = getMatchingBackpackEntities(player.id, id)
    if (existing.length > 0) {
        if (existing.length > 1) {
            quarantineDuplicateBackpacks(player.id, id, "load")
            return existing[0]
        }

        if (existing[0].typeId !== entityTypeID) {
            existing[0].setDynamicProperty("backpack_quarantined", true)
            player.addTag(`holdingbackpack.${id}`)
            const key = `type:${player.id}:${id}`
            if (!reportedDuplicateBackpacks.has(key)) {
                reportedDuplicateBackpacks.add(key)
                warnBackpack(`Backpack type mismatch requires recovery; playerId=${player.id}, backpackId=${id}, entityId=${existing[0].id}, entityType=${existing[0].typeId}, itemType=${entityTypeID}.`)
            }
            return existing[0]
        }

        if (existing[0].dimension.id !== dim.id) {
            existing[0].setDynamicProperty("backpack_quarantined", true)
            player.addTag(`holdingbackpack.${id}`)
            const key = `dimension:${player.id}:${id}`
            if (!reportedDuplicateBackpacks.has(key)) {
                reportedDuplicateBackpacks.add(key)
                warnBackpack(`Backpack in another dimension requires recovery; playerId=${player.id}, backpackId=${id}, entityId=${existing[0].id}, entityDimension=${existing[0].dimension.id}, playerDimension=${dim.id}.`)
            }
            return existing[0]
        }

        return existing[0]
    }

    const context = `backpack ${id}, player ${player.id}`
    const maxCount = data.count
    let block2 = undefined


    const block = getBlockSafely(dim, { x: player.location.x, y: BACKPACK_STAGING_BASE_Y, z: player.location.z })

    if (!block) {
        warnBackpack(`Primary staging block was unavailable while loading ${context}.`)
        return undefined
    }

    if (maxCount > 1) {
        block2 = getBlockSafely(dim, { x: player.location.x, y: BACKPACK_STAGING_SECOND_Y, z: player.location.z })

        if (!block2) {
            warnBackpack(`Secondary staging block was unavailable while loading ${context}.`)
            return undefined
        }
    }

    const lastBlock = block.permutation
	let lastBlock2 = undefined
	let baseChanged = false
	let secondChanged = false
	let backPack = undefined
	let loaded = false
    const deferredSourceItems = []

    try {
        if (maxCount > 1) {
            lastBlock2 = block2.permutation
            const secondStructureCandidates = getBackpackStructureCandidates(item, id, "_2")

            let secondStructureId = loadFirstAvailableStructure(secondStructureCandidates, block2.location, dim, context)
            secondChanged = true

            if (secondStructureId == undefined) {
                secondStructureId = getBackpackStructureId(id, "_2")
                block2.setPermutation(BlockPermutation.resolve("minecraft:barrel"))

                if (!runStructureSave(secondStructureId, block2.location, block2.location, dim, { includeBlocks: true, includeEntities: false, saveLocation: "disk" }, context)) {
                    return undefined
                }
            }

            const blockInv2AfterLoad = block2.getComponent(BlockInventoryComponent.componentId)
        }

        const baseStructureCandidates = getBackpackStructureCandidates(item, id)

        let baseStructureId = loadFirstAvailableStructure(baseStructureCandidates, block.location, dim, context)
        baseChanged = true

        if (baseStructureId == undefined) {
            baseStructureId = getBackpackStructureId(id)
            block.setPermutation(BlockPermutation.resolve("minecraft:barrel"))

            if (!runStructureSave(baseStructureId, block.location, block.location, block.dimension, { includeBlocks: true, includeEntities: false, saveLocation: "disk" }, context)) {
                return undefined
            }
        }

        const blockInvAfterLoad = block.getComponent(BlockInventoryComponent.componentId)

        backPack = spawnEntityAnywhere(entityTypeID, getBackpackFollowLocation(player), dim)

        if (!backPack?.isValid()) {
            return undefined
        }

        const entityInv = backPack.getComponent(EntityInventoryComponent.componentId)

        if (!entityInv?.container) {
            warnBackpack(`Spawned backpack entity without inventory while loading ${context}.`)
            return undefined
        }

        if (maxCount > 1) {
            const blockInv2 = block2.getComponent(BlockInventoryComponent.componentId)

            if (!blockInv2?.container) {
                warnBackpack(`Secondary barrel inventory was unavailable while loading ${context}.`)
                return undefined
            }

            if (!transferInventory(blockInv2.container, entityInv.container, dim, block2.location, 0, 27, entityInv.container.size, deferredSourceItems)) {
                return undefined
            }

        }

        const blockInv = getBlockSafely(dim, block.location)?.getComponent(BlockInventoryComponent.componentId)

        if (!blockInv?.container) {
            warnBackpack(`Primary barrel inventory was unavailable while loading ${context}.`)
            return undefined
        }

        if (!transferInventory(blockInv.container, entityInv.container, dim, block.location, 0, 0, 27, deferredSourceItems)) {
            return undefined
        }


        for (const disallowedItem of deferredSourceItems) {
            spawnItemAnywhere(disallowedItem, player.location, dim)
        }

        backPack.setDynamicProperty("backpack_id", id)
        backPack.setDynamicProperty("playerID", player.id)
        backPack.nameTag = backpackData[backPack.typeId].name


		loaded = true
		return backPack
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        warnBackpack(`Failed to load ${context}: ${failureReason}`)

        return undefined
    } finally {
        if (!loaded && backPack?.isValid()) removeBackpackEntityWithoutDrops(backPack)

        if (loaded && secondChanged && block2 != undefined && lastBlock2 != undefined) {
            const inv2 = block2?.getComponent(BlockInventoryComponent.componentId)
			clearBlockInventory(block2)
			block_Manager.setBlock(dim, block2.location, "air")
			block2.setPermutation(lastBlock2)
        }

        if (loaded && baseChanged) {
            const inv1 = block?.getComponent(BlockInventoryComponent.componentId)
			clearBlockInventory(block)
			block_Manager.setBlock(dim, block.location, "air")
			block.setPermutation(lastBlock)
        }
    }
}

function getBackpackFollowLocation(player) {
    const viewDir = player.getViewDirection()
    const headLoc = player.getHeadLocation()
    return { x: headLoc.x + viewDir.x, y: headLoc.y + viewDir.y, z: headLoc.z + viewDir.z }
}

/**
 * @param {import("@minecraft/server").Container} container1
 * @param {import("@minecraft/server").Container} container2
 * @param {import("@minecraft/server").Dimension} dimension
 */
function transferInventory(container1, container2, dimension, fromInvLocation, FromInvStartingSlot, ToInvStartingSlot, maxSlot, deferredSourceItems = undefined) {

    let destinationOffset = 0
    const sourceEndSlot = Math.min(maxSlot, container1.size)

    for (let sourceSlot = FromInvStartingSlot; sourceSlot < sourceEndSlot; sourceSlot++) {
        const destinationSlot = ToInvStartingSlot + destinationOffset
        let item = undefined

        try {
            item = container1.getItem(sourceSlot)
        } catch (e) {
            const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
            warnBackpack(`Failed reading backpack source slot ${sourceSlot}: ${failureReason}`)
            return false
        }

        if (item != undefined) {
            const isDisallowed = unallowedItems.includes(item.typeId)
            const destinationSlotValid = destinationSlot < container2.size


            if (!isDisallowed && destinationSlotValid) {
                try {
                    container2.setItem(destinationSlot, item)
                } catch (e) {
                    const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                    warnBackpack(`Failed writing backpack destination slot ${destinationSlot}: ${failureReason}`)
                    return false
                }
            } else {
                if (deferredSourceItems) {
                    deferredSourceItems.push(item)
                    destinationOffset++
                    continue
                }

                spawnItemAnywhere(item, fromInvLocation, dimension)

                try {
                    container1.setItem(sourceSlot, undefined)
                } catch (e) {
                    const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                    warnBackpack(`Failed clearing disallowed backpack source slot ${sourceSlot}: ${failureReason}`)
                    return false
                }
            }
        }

        destinationOffset++
    }

    return true
}

/**
 * @param {import("@minecraft/server").Container} container
 */
function emptyInventory(container) {
    for (let i = 0; i < container.size; i++) {
        container.setItem(i, undefined)
    }
}

function clearBlockInventory(block) {
    const inv = block?.getComponent(BlockInventoryComponent.componentId)
    const container = inv?.container

    if (!container) {
        return false
    }

    emptyInventory(container)


    return true
}

function spawnItemAnywhere(item, location, dimension) {
    const itemEntity = dimension.spawnItem(item, { x: location.x, y: BACKPACK_STAGING_BASE_Y, z: location.z })
    itemEntity.teleport(location)
    return itemEntity
}

/**
 * @param {string} entityID
 * @param {import("@minecraft/server").Vector3} location
 * @param {import("@minecraft/server").Dimension} dimension
 */
function spawnEntityAnywhere(entityID, location, dimension) {
    const entity = dimension.spawnEntity(entityID, { x: location.x, y: BACKPACK_STAGING_BASE_Y, z: location.z })
    entity.teleport(location)
    return entity
}

export const backpackDimensions = DimensionTypes.getAll()
const dimensions = backpackDimensions

function generateRandomID(length) {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    let id = ""
    for (let i = 0; i < length; i++) id = id + characters[Math.floor(Math.random() * characters.length)]
    return id
}

/**
 * @param {import("@minecraft/server").Entity} entity
 * @param {import("@minecraft/server").Player} player
 */
function backpackTick(entity, player) {
    function tick() {
        if (!entity?.isValid()) return
        if (entity.getDynamicProperty("backpack_quarantined") === true) return

        if (player?.isValid()) {
            if (portalNearby(player) == false) {
                if (!entity?.isValid()) return
                entity.teleport(getBackpackFollowLocation(player))
                system.runTimeout(() => {
                    tick()
                }, 2)
            } else {
                if (!entity?.isValid()) return
                saveBackpack(entity, "portal-nearby")
            }
        } else {
            if (!entity?.isValid()) return
            saveBackpack(entity, "player-invalid")
        }
    }

    const entityValid = entity?.isValid() === true
    const playerValid = player?.isValid() === true
    const entityType = entityValid ? entity.typeId : "missing"
    const backpackId = entityValid ? entity.getDynamicProperty("backpack_id") ?? "missing" : "missing"
    const playerId = playerValid ? player.id : "missing"
    tick()
}

/**
 * @param {import("@minecraft/server").Player} player
 * @param {string} besidesTag
 */
function removeAllIDTags(player, besidesTag = "") {
    if (!player?.isValid()) return

    const allTags = player.getTags()

    for (const tag of allTags) {
        if (tag.startsWith("holdingbackpack.") && tag != besidesTag) {
            player.removeTag(tag)
        }
    }
}


function getHeldBackpackItem(player) {
    try {
        const equipment = player.getComponent(EntityEquippableComponent.componentId)
        const slot = equipment?.getEquipmentSlot(EquipmentSlot.Mainhand)
        const item = slot?.getItem()
        if (item && backpackIDs.includes(item.typeId)) return item
    } catch {}

    return undefined
}

function getHeldBackpackId(player) {
    const item = getHeldBackpackItem(player)
    const id = item?.getDynamicProperty("backpack_id")
    return typeof id == "string" && id.length > 0 ? id : undefined
}

function getActiveBackpackForPlayer(player, backpackId, entityTypeId) {
    if (!player?.isValid() || typeof backpackId != "string" || backpackId.length < 1) return undefined

    const backpacks = getBackpackEntities(player.dimension, player.id).filter(backpack => backpack.getDynamicProperty("backpack_id") === backpackId)

    if (backpacks.length > 1) {
        quarantineDuplicateBackpacks(player.id, backpackId, "active lookup")
        return backpacks[0]
    }

    for (const backpack of backpacks) {
        if (!backpack?.isValid()) continue
        if (backpack.typeId !== entityTypeId) {
            backpack.setDynamicProperty("backpack_quarantined", true)
            player.addTag(`holdingbackpack.${backpackId}`)
            const key = `type:${player.id}:${backpackId}`
            if (!reportedDuplicateBackpacks.has(key)) {
                reportedDuplicateBackpacks.add(key)
                warnBackpack(`Backpack type mismatch requires recovery; playerId=${player.id}, backpackId=${backpackId}, entityId=${backpack.id}, entityType=${backpack.typeId}, itemType=${entityTypeId}.`)
            }
        }
        return backpack
    }

    return undefined
}

function savePlayerBackpacks(player, reason = "unspecified") {
    const backpacks = getBackpackEntities(player.dimension, player.id)

    for (const backpack of backpacks) {
        saveBackpack(backpack, reason)
    }
}


world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const { player, target } = event

    if (!target || !backpackIDs.includes(target.typeId)) return

    const targetId = target.getDynamicProperty("backpack_id")
    const ownerId = target.getDynamicProperty("playerID")
    const heldBackpackId = getHeldBackpackId(player)
    const quarantined = target.getDynamicProperty("backpack_quarantined") === true
    const normalAccess = !quarantined && ownerId === player.id && typeof targetId == "string" && heldBackpackId === targetId
    const allowed = normalAccess || (quarantined && hasBackpackRecoveryAccess(target.id, player.id))

    if (!allowed) {
        event.cancel = true
    }
})

system.runInterval(() => {
    system.runJob(function* () {
        for (const player of world.getAllPlayers()) {
            try {
                const equipment = player.getComponent(EntityEquippableComponent.componentId)
                const slot = equipment.getEquipmentSlot(EquipmentSlot.Mainhand)
                const item = slot.getItem()

                if (item && backpackIDs.includes(item.typeId)) {

                    if (portalNearby(player) == false) {
                        player.removeTag("!holding")
                        let id = item.getDynamicProperty("backpack_id")

                        if (typeof id != "string" || id.length < 1) {
                            id = generateRandomID(BACKPACK_ID_LENGTH)
                            item.setDynamicProperty("backpack_id", id)
                            slot.setItem(item)
                        }

                        const tag = "holdingbackpack." + id
                        const activeBackpack = getActiveBackpackForPlayer(player, id, item.typeId)

                        if (!player.hasTag(tag) || activeBackpack == undefined) {
                            if (player.hasTag(tag)) {
                                player.removeTag(tag)
                            }

                            savePlayerBackpacks(player, "switching-to-backpack")
                            removeAllIDTags(player, tag)

                            const backpack = loadBackpack(item.typeId, player, item)

                            if (backpack?.isValid()) {
                                backpack.addTag(player.id)
                                backpack.addTag("backpack")
                                player.addTag(tag)
                                player.removeTag("!holding")
                                backpackTick(backpack, player)
                            } else {
                                player.removeTag(tag)
                                player.addTag("!holding")
                            }
                        }
                    } else if (!player.hasTag("!holding")) {
                        removeAllIDTags(player, "")
                        savePlayerBackpacks(player, "portal-nearby")
                        player.addTag("!holding")
                    }
                } else if (!player.hasTag("!holding")) {
                    removeAllIDTags(player, "")
                    savePlayerBackpacks(player, "not-holding-backpack")
                    player.addTag("!holding")
                }
            } catch (e) {
                const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                warnBackpack(`Backpack player loop failed for player ${player.id}: ${failureReason}`)
            }

            yield
        }
    }())
}, BACKPACK_PLAYER_LOOP_INTERVAL_TICKS)

world.afterEvents.playerJoin.subscribe((data) => {
    const player = world.getEntity(data.playerId)
    removeAllIDTags(player, "")
})

world.afterEvents.playerLeave.subscribe((data) => {

    for (const dimension of dimensions) {
        const dim = world.getDimension(dimension.typeId)
        const backpacks = getBackpackEntities(dim, data.playerId)


        for (const backpack of backpacks) {
            saveBackpack(backpack, "player-leave")
        }
    }
})

system.runInterval(() => {
    system.runJob(function* () {
        for (const dimension of dimensions) {
            const dim = world.getDimension(dimension.typeId)
            const backpacks = getBackpackEntities(dim)


            for (const backpack of backpacks) {
                const itemid = backpack.getDynamicProperty("backpack_id")
                const id = backpack.getDynamicProperty("playerID")


                if (id != undefined) {
                    const player = world.getEntity(id)
                    const playerHasTag = player != undefined && player.hasTag("holdingbackpack." + itemid)


                    if (player == undefined || !player.hasTag("holdingbackpack." + itemid)) {
                        saveBackpack(backpack, "watchdog-orphaned")
                    }
                }

                yield
            }
        }
    }())
}, 20)
