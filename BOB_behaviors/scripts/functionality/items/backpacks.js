import { world, system, EntityInventoryComponent, DimensionTypes, BlockPermutation, BlockInventoryComponent, EquipmentSlot, EntityEquippableComponent } from "@minecraft/server";

function warnBackpack(message) {
    console.warn(`[BOB Backpacks] ${message}`)
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

const BACKPACK_ID_LENGTH = 100
const BACKPACK_STAGING_BASE_Y = 100
const BACKPACK_STAGING_SECOND_Y = 101

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
    if (entityInv?.container) emptyInventory(entityInv.container)
    entity.remove()
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
    if (typeof id != "string" || !data) return false

    const context = `backpack ${id}, player ${entity.getDynamicProperty("playerID") ?? "unknown"}`
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

            if (!transferInventory(entityInv.container, blockInv2.container, dim, entityLoc, 27, 0, entityInv.container.size)) return false
            if (!runStructureSave(getBackpackStructureId(id, "_2"), block2.location, block2.location, block2.dimension, { includeEntities: false, saveLocation: "disk", includeBlocks: true }, context)) return false
            emptyInventory(blockInv2)
        }

        if (!transferInventory(entityInv.container, blockInv.container, dim, entityLoc, 0, 0, 27)) return false
        if (!runStructureSave(getBackpackStructureId(id), block.location, block.location, block.dimension, { includeEntities: false, saveLocation: "disk", includeBlocks: true }, context)) return false
        emptyInventory(blockInv)
        emptyInventory(entityInv.container)
        saved = true
    } finally {
        if (secondChanged && lastBlock2 != undefined) {
            block_Manager.setBlock(dim, block2.location, "air")
            block2.setPermutation(lastBlock2)
        }

        if (baseChanged) {
            block_Manager.setBlock(dim, block.location, "air")
            block.setPermutation(lastBlock)
        }
    }

    if (!saved) return false
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

    try {
        if (maxCount > 1) {
            lastBlock2 = block2.permutation
            const secondStructureCandidates = getBackpackStructureCandidates(item, id, "_2")
            let secondStructureId = loadFirstAvailableStructure(secondStructureCandidates, block2.location, dim, context)
            secondChanged = true
            if (secondStructureId == undefined) {
                secondStructureId = getBackpackStructureId(id, "_2")
                block2.setPermutation(BlockPermutation.resolve("minecraft:barrel"))
                if (!runStructureSave(secondStructureId, block2.location, block2.location, dim, { includeBlocks: true, includeEntities: false, saveLocation: "disk" }, context)) return undefined
            }
        }

        const baseStructureCandidates = getBackpackStructureCandidates(item, id)
        let baseStructureId = loadFirstAvailableStructure(baseStructureCandidates, block.location, dim, context)
        baseChanged = true
        if (baseStructureId == undefined) {
            baseStructureId = getBackpackStructureId(id)
            block.setPermutation(BlockPermutation.resolve("minecraft:barrel"))
            if (!runStructureSave(baseStructureId, block.location, block.location, block.dimension, { includeBlocks: true, includeEntities: false, saveLocation: "disk" }, context)) return undefined
        }

        backPack = spawnEntityAnywhere(entityTypeID, getBackpackFollowLocation(player), dim)
        if (!backPack?.isValid()) return undefined

        const entityInv = backPack.getComponent(EntityInventoryComponent.componentId)
        if (!entityInv?.container) {
            warnBackpack(`Spawned backpack entity without inventory while loading ${context}.`)
            removeBackpackEntityWithoutDrops(backPack)
            return undefined
        }

        if (maxCount > 1) {
            const blockInv2 = block2.getComponent(BlockInventoryComponent.componentId)
            if (!blockInv2?.container) {
                warnBackpack(`Secondary barrel inventory was unavailable while loading ${context}.`)
                removeBackpackEntityWithoutDrops(backPack)
                return undefined
            }
            if (!transferInventory(blockInv2.container, entityInv.container, dim, block2.location, 0, 27, entityInv.container.size)) {
                removeBackpackEntityWithoutDrops(backPack)
                return undefined
            }
            emptyInventory(blockInv2)
        }

        const blockInv = getBlockSafely(dim, block.location)?.getComponent(BlockInventoryComponent.componentId)
        if (!blockInv?.container) {
            warnBackpack(`Primary barrel inventory was unavailable while loading ${context}.`)
            removeBackpackEntityWithoutDrops(backPack)
            return undefined
        }

        if (!transferInventory(blockInv.container, entityInv.container, dim, block.location, 0, 0, 27)) {
            removeBackpackEntityWithoutDrops(backPack)
            return undefined
        }
        emptyInventory(blockInv)

        backPack.setDynamicProperty("backpack_id", id)
        backPack.setDynamicProperty("playerID", player.id)
        backPack.nameTag = backpackData[backPack.typeId].name
        return backPack
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        warnBackpack(`Failed to load ${context}: ${failureReason}`)
        if (backPack?.isValid()) removeBackpackEntityWithoutDrops(backPack)
        return undefined
    } finally {
        if (secondChanged && block2 != undefined && lastBlock2 != undefined) {
            block_Manager.setBlock(dim, block2.location, "air")
            block2.setPermutation(lastBlock2)
        }

        if (baseChanged) {
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
function transferInventory(container1, container2, dimension, fromInvLocation, FromInvStartingSlot, ToInvStartingSlot, maxSlot) {
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
            if (!unallowedItems.includes(item.typeId) && destinationSlot < container2.size) {
                try {
                    container2.setItem(destinationSlot, item)
                } catch (e) {
                    const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                    warnBackpack(`Failed writing backpack destination slot ${destinationSlot}: ${failureReason}`)
                    return false
                }
            } else {
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

const dimensions = DimensionTypes.getAll()

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
        if (player?.isValid() && entity?.isValid()) {
            if (portalNearby(player) == false) {
                entity.teleport(getBackpackFollowLocation(player))
                system.runTimeout(() => {
                    tick()
                }, 2)
            } else {
                saveBackpack(entity)
            }
        } else if (entity?.isValid()) {
            saveBackpack(entity)
        }
    }
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
        if (tag.startsWith("holdingbackpack.") && tag != besidesTag) player.removeTag(tag)
    }
}

function savePlayerBackpacks(player) {
    const backpacks = player.dimension.getEntities({ tags: [player.id, "backpack"] })
    for (const backpack of backpacks) {
        saveBackpack(backpack)
    }
}

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
                        if (!player.hasTag(tag)) {
                            savePlayerBackpacks(player)
                            removeAllIDTags(player, tag)
                            player.addTag(tag)
                            const backpack = loadBackpack(item.typeId, player, item)
                            if (backpack?.isValid()) {
                                backpackTick(backpack, player)
                                backpack.addTag(player.id)
                                backpack.addTag("backpack")
                            } else {
                                player.removeTag(tag)
                                player.addTag("!holding")
                            }
                        }
                    } else if (!player.hasTag("!holding")) {
                        removeAllIDTags(player, "")
                        savePlayerBackpacks(player)
                        player.addTag("!holding")
                    }
                } else if (!player.hasTag("!holding")) {
                    removeAllIDTags(player, "")
                    savePlayerBackpacks(player)
                    player.addTag("!holding")
                }
            } catch (e) {
                const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                warnBackpack(`Backpack player loop failed for player ${player.id}: ${failureReason}`)
            }

            yield
        }
    }())
}, 5)

world.afterEvents.playerJoin.subscribe((data) => {
    const player = world.getEntity(data.playerId)
    removeAllIDTags(player, "")
})

world.afterEvents.playerLeave.subscribe((data) => {
    for (const dimension of dimensions) {
        const dim = world.getDimension(dimension.typeId)
        const backpacks = dim.getEntities({ tags: [data.playerId, "backpack"] })
        for (const backpack of backpacks) saveBackpack(backpack)
    }
})

system.runInterval(() => {
    system.runJob(function* () {
        for (const dimension of dimensions) {
            const dim = world.getDimension(dimension.typeId)
            const backpacks = dim.getEntities({ tags: ["backpack"] })
            for (const backpack of backpacks) {
                const itemid = backpack.getDynamicProperty("backpack_id")
                const id = backpack.getDynamicProperty("playerID")
                if (id != undefined) {
                    const player = world.getEntity(id)
                    if (player == undefined || !player.hasTag("holdingbackpack." + itemid)) {
                        saveBackpack(backpack)
                    }
                }
                yield
            }
        }
    }())
}, 20)
