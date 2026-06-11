import { world, system, EntityInventoryComponent, DimensionTypes, BlockPermutation, BlockInventoryComponent, EquipmentSlot, EntityEquippableComponent } from "@minecraft/server";

function warnBackpack(message) {
    console.warn(`[BOB Backpacks] ${message}`)
}

const BACKPACK_DIAGNOSTICS = true
const BACKPACK_DIAG_DUMP_SLOTS = true
const BACKPACK_DIAG_MAX_SLOT_LINES = 100

let backpackDiagSeq = 0

function diagBackpack(message) {
    if (BACKPACK_DIAGNOSTICS) console.warn(`[BOB Backpacks:DIAG] ${message}`)
}

function nextBackpackDiagOp(prefix, id) {
    backpackDiagSeq++
    const shortId = typeof id == "string" ? id.slice(0, 12) : "no-id"
    return `${prefix}-${backpackDiagSeq}-${shortId}`
}

function locText(location) {
    try {
        if (location == undefined) return "missing-location"
        return `x=${Number(location.x).toFixed(2)},y=${Number(location.y).toFixed(2)},z=${Number(location.z).toFixed(2)}`
    } catch {
        return "invalid-location"
    }
}

function itemText(item) {
    try {
        if (item == undefined) return "empty"
        return `${item.typeId}x${item.amount}`
    } catch {
        return "invalid-item"
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
        const types = new Map()

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
            types.set(item.typeId, (types.get(item.typeId) ?? 0) + item.amount)
        }

        const typeText = [...types.entries()].map(([typeId, amount]) => `${typeId}x${amount}`).join(", ")
        return `size=${container.size},occupied=${occupied},totalItems=${totalItems},types=[${typeText}]`
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        return `container-summary-failed:${failureReason}`
    }
}

function dumpContainerSlots(label, container, opId) {
    if (!BACKPACK_DIAGNOSTICS || !BACKPACK_DIAG_DUMP_SLOTS) return

    try {
        if (container == undefined) {
            diagBackpack(`${opId} ${label}: missing container`)
            return
        }

        let printed = 0

        for (let i = 0; i < container.size; i++) {
            let item = undefined

            try {
                item = container.getItem(i)
            } catch (e) {
                const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                diagBackpack(`${opId} ${label}: slot=${i}, read failed: ${failureReason}`)
                return
            }

            if (item == undefined) continue

            diagBackpack(`${opId} ${label}: slot=${i}, item=${itemText(item)}`)
            printed++

            if (printed >= BACKPACK_DIAG_MAX_SLOT_LINES) {
                diagBackpack(`${opId} ${label}: slot dump stopped after ${printed} occupied slots`)
                return
            }
        }

        if (printed < 1) diagBackpack(`${opId} ${label}: no occupied slots`)
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        diagBackpack(`${opId} ${label}: dump failed: ${failureReason}`)
    }
}

function blockText(block) {
    try {
        if (block == undefined) return "missing-block"
        return `${block.typeId}@${locText(block.location)}`
    } catch {
        return "invalid-block"
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
        diagBackpack(`structure save begin: id=${structureId}, from=${locText(from)}, to=${locText(to)}, options=${JSON.stringify(options)}, context=${context}`)
        const result = structure_Manager.save(structureId, from, to, dimension, options)
        diagBackpack(`structure save end: id=${structureId}, successCount=${result.successCount}, context=${context}`)

        if (result.successCount < 1) {
            warnBackpack(`Failed to save structure ${structureId} for ${context}; successCount=${result.successCount}.`)
            return false
        }

        return true
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        warnBackpack(`Exception saving structure ${structureId} for ${context}: ${failureReason}`)
        diagBackpack(`structure save exception: id=${structureId}, context=${context}, error=${failureReason}`)
        return false
    }
}

function runStructureLoad(structureId, location, dimension, context) {
    try {
        diagBackpack(`structure load begin: id=${structureId}, location=${locText(location)}, context=${context}`)
        const result = structure_Manager.load(structureId, location, dimension)
        diagBackpack(`structure load end: id=${structureId}, successCount=${result.successCount}, context=${context}`)

        if (result.successCount < 1) return false
        return true
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        warnBackpack(`Exception loading structure ${structureId} for ${context}: ${failureReason}`)
        diagBackpack(`structure load exception: id=${structureId}, context=${context}, error=${failureReason}`)
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
    diagBackpack(`removeBackpackEntityWithoutDrops: entity=${entity.typeId}, valid=${validText(entity)}, invBeforeClear=${containerSummary(entityInv?.container)}`)

    if (entityInv?.container) {
        dumpContainerSlots("removeBackpackEntityWithoutDrops before clear", entityInv.container, "remove")
        emptyInventory(entityInv.container)
        diagBackpack(`removeBackpackEntityWithoutDrops: invAfterClear=${containerSummary(entityInv.container)}`)
    }

    entity.remove()
    diagBackpack(`removeBackpackEntityWithoutDrops: entity removed`)
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
    const opId = nextBackpackDiagOp("save", id)
    const maxCount = data.count

    diagBackpack(`${opId} saveBackpack begin: type=${entity.typeId}, id=${id}, playerID=${entity.getDynamicProperty("playerID") ?? "unknown"}, loc=${locText(entityLoc)}, valid=${validText(entity)}, maxCount=${maxCount}`)

    const entityInvAtStart = entity.getComponent(EntityInventoryComponent.componentId)
    diagBackpack(`${opId} entity inventory at save start: ${containerSummary(entityInvAtStart?.container)}`)
    dumpContainerSlots("entity inventory at save start", entityInvAtStart?.container, opId)

    const block = getBlockSafely(dim, { x: entityLoc.x, y: BACKPACK_STAGING_BASE_Y, z: entityLoc.z })
    diagBackpack(`${opId} primary staging block before save: ${blockText(block)}`)

    if (!block) {
        warnBackpack(`Primary staging block was unavailable while saving ${context}.`)
        diagBackpack(`${opId} saveBackpack abort: missing primary staging block`)
        return false
    }

    const lastBlock = block.permutation
    let block2 = undefined
    let lastBlock2 = undefined

    if (maxCount > 1) {
        block2 = getBlockSafely(dim, { x: entityLoc.x, y: BACKPACK_STAGING_SECOND_Y, z: entityLoc.z })
        diagBackpack(`${opId} secondary staging block before save: ${blockText(block2)}`)

        if (!block2) {
            warnBackpack(`Secondary staging block was unavailable while saving ${context}.`)
            diagBackpack(`${opId} saveBackpack abort: missing secondary staging block`)
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
            diagBackpack(`${opId} secondary staging block set to barrel: ${blockText(block2)}`)
        }

        block.setPermutation(BlockPermutation.resolve("minecraft:barrel"))
        baseChanged = true
        diagBackpack(`${opId} primary staging block set to barrel: ${blockText(block)}`)

        const entityInv = entity.getComponent(EntityInventoryComponent.componentId)
        const blockInv = block.getComponent(BlockInventoryComponent.componentId)

        diagBackpack(`${opId} entity inventory before save transfer: ${containerSummary(entityInv?.container)}`)
        diagBackpack(`${opId} primary barrel inventory before save transfer: ${containerSummary(blockInv?.container)}`)

        if (!entityInv?.container || !blockInv?.container) {
            warnBackpack(`Inventory component was unavailable while saving ${context}.`)
            diagBackpack(`${opId} saveBackpack abort: missing entity or primary barrel inventory`)
            return false
        }

        if (block2 != undefined) {
            const blockInv2 = block2.getComponent(BlockInventoryComponent.componentId)
            diagBackpack(`${opId} secondary barrel inventory before save transfer: ${containerSummary(blockInv2?.container)}`)

            if (!blockInv2?.container) {
                warnBackpack(`Secondary barrel inventory was unavailable while saving ${context}.`)
                diagBackpack(`${opId} saveBackpack abort: missing secondary barrel inventory`)
                return false
            }

            diagBackpack(`${opId} secondary transfer begin: entity -> barrel_2`)
            if (!transferInventory(entityInv.container, blockInv2.container, dim, entityLoc, 27, 0, entityInv.container.size)) {
                diagBackpack(`${opId} secondary transfer FAILED`)
                return false
            }

            diagBackpack(`${opId} secondary barrel after transfer: ${containerSummary(blockInv2.container)}`)
            dumpContainerSlots("secondary barrel after transfer", blockInv2.container, opId)

            if (!runStructureSave(getBackpackStructureId(id, "_2"), block2.location, block2.location, block2.dimension, { includeEntities: false, saveLocation: "disk", includeBlocks: true }, context)) {
                diagBackpack(`${opId} secondary structure save FAILED`)
                return false
            }

            diagBackpack(`${opId} secondary barrel before emptyInventory: ${containerSummary(blockInv2.container)}`)
            clearBlockInventory(block2, "save secondary barrel", opId)
            diagBackpack(`${opId} secondary barrel after emptyInventory: ${containerSummary(blockInv2.container)}`)
        }

        diagBackpack(`${opId} primary transfer begin: entity -> barrel`)
        if (!transferInventory(entityInv.container, blockInv.container, dim, entityLoc, 0, 0, 27)) {
            diagBackpack(`${opId} primary transfer FAILED`)
            return false
        }

        diagBackpack(`${opId} primary barrel after transfer: ${containerSummary(blockInv.container)}`)
        dumpContainerSlots("primary barrel after transfer", blockInv.container, opId)

        if (!runStructureSave(getBackpackStructureId(id), block.location, block.location, block.dimension, { includeEntities: false, saveLocation: "disk", includeBlocks: true }, context)) {
            diagBackpack(`${opId} primary structure save FAILED`)
            return false
        }

        diagBackpack(`${opId} primary barrel before emptyInventory: ${containerSummary(blockInv.container)}`)
        clearBlockInventory(block, "save primary barrel", opId)
        diagBackpack(`${opId} primary barrel after emptyInventory: ${containerSummary(blockInv.container)}`)

        diagBackpack(`${opId} entity inventory before final emptyInventory: ${containerSummary(entityInv.container)}`)
        emptyInventory(entityInv.container)
        diagBackpack(`${opId} entity inventory after final emptyInventory: ${containerSummary(entityInv.container)}`)

        saved = true
        diagBackpack(`${opId} saveBackpack marked saved=true`)
    } finally {
        if (secondChanged && lastBlock2 != undefined) {
            const inv2 = block2?.getComponent(BlockInventoryComponent.componentId)
			diagBackpack(`${opId} FINALLY secondary before restore: block=${blockText(block2)}, inv=${containerSummary(inv2?.container)}, saved=${saved}`)
			dumpContainerSlots("FINALLY secondary before restore", inv2?.container, opId)
			clearBlockInventory(block2, "FINALLY secondary safety clear", opId)
			block_Manager.setBlock(dim, block2.location, "air")
			block2.setPermutation(lastBlock2)
        }

        if (baseChanged) {
            const inv1 = block?.getComponent(BlockInventoryComponent.componentId)
			diagBackpack(`${opId} FINALLY primary before restore: block=${blockText(block)}, inv=${containerSummary(inv1?.container)}, saved=${saved}`)
			dumpContainerSlots("FINALLY primary before restore", inv1?.container, opId)
			clearBlockInventory(block, "FINALLY primary safety clear", opId)
			block_Manager.setBlock(dim, block.location, "air")
			block.setPermutation(lastBlock)
        }
    }

    if (!saved) {
        diagBackpack(`${opId} saveBackpack end: saved=false, entityValid=${validText(entity)}`)
        return false
    }

    diagBackpack(`${opId} saveBackpack removing entity after successful save`)
    entity.remove()
    diagBackpack(`${opId} saveBackpack end: saved=true`)
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
    const opId = nextBackpackDiagOp("load", id)
    const maxCount = data.count
    let block2 = undefined

    diagBackpack(`${opId} loadBackpack begin: entityTypeID=${entityTypeID}, itemType=${item.typeId}, id=${id}, player=${player.id}, playerLoc=${locText(player.location)}, maxCount=${maxCount}`)

    const block = getBlockSafely(dim, { x: player.location.x, y: BACKPACK_STAGING_BASE_Y, z: player.location.z })
    diagBackpack(`${opId} primary staging block before load: ${blockText(block)}`)

    if (!block) {
        warnBackpack(`Primary staging block was unavailable while loading ${context}.`)
        diagBackpack(`${opId} loadBackpack abort: missing primary staging block`)
        return undefined
    }

    if (maxCount > 1) {
        block2 = getBlockSafely(dim, { x: player.location.x, y: BACKPACK_STAGING_SECOND_Y, z: player.location.z })
        diagBackpack(`${opId} secondary staging block before load: ${blockText(block2)}`)

        if (!block2) {
            warnBackpack(`Secondary staging block was unavailable while loading ${context}.`)
            diagBackpack(`${opId} loadBackpack abort: missing secondary staging block`)
            return undefined
        }
    }

    const lastBlock = block.permutation
	let lastBlock2 = undefined
	let baseChanged = false
	let secondChanged = false
	let backPack = undefined
	let loaded = false

    try {
        if (maxCount > 1) {
            lastBlock2 = block2.permutation
            const secondStructureCandidates = getBackpackStructureCandidates(item, id, "_2")
            diagBackpack(`${opId} secondary structure candidates: ${JSON.stringify(secondStructureCandidates)}`)

            let secondStructureId = loadFirstAvailableStructure(secondStructureCandidates, block2.location, dim, context)
            secondChanged = true
            diagBackpack(`${opId} secondary loaded structure id: ${secondStructureId ?? "none"}`)

            if (secondStructureId == undefined) {
                secondStructureId = getBackpackStructureId(id, "_2")
                block2.setPermutation(BlockPermutation.resolve("minecraft:barrel"))
                diagBackpack(`${opId} secondary fallback: created empty barrel and saving new structure id=${secondStructureId}`)

                if (!runStructureSave(secondStructureId, block2.location, block2.location, dim, { includeBlocks: true, includeEntities: false, saveLocation: "disk" }, context)) {
                    diagBackpack(`${opId} secondary fallback structure save FAILED`)
                    return undefined
                }
            }

            const blockInv2AfterLoad = block2.getComponent(BlockInventoryComponent.componentId)
            diagBackpack(`${opId} secondary barrel after structure load/fallback: ${containerSummary(blockInv2AfterLoad?.container)}`)
            dumpContainerSlots("secondary barrel after structure load/fallback", blockInv2AfterLoad?.container, opId)
        }

        const baseStructureCandidates = getBackpackStructureCandidates(item, id)
        diagBackpack(`${opId} primary structure candidates: ${JSON.stringify(baseStructureCandidates)}`)

        let baseStructureId = loadFirstAvailableStructure(baseStructureCandidates, block.location, dim, context)
        baseChanged = true
        diagBackpack(`${opId} primary loaded structure id: ${baseStructureId ?? "none"}`)

        if (baseStructureId == undefined) {
            baseStructureId = getBackpackStructureId(id)
            block.setPermutation(BlockPermutation.resolve("minecraft:barrel"))
            diagBackpack(`${opId} primary fallback: created empty barrel and saving new structure id=${baseStructureId}`)

            if (!runStructureSave(baseStructureId, block.location, block.location, block.dimension, { includeBlocks: true, includeEntities: false, saveLocation: "disk" }, context)) {
                diagBackpack(`${opId} primary fallback structure save FAILED`)
                return undefined
            }
        }

        const blockInvAfterLoad = block.getComponent(BlockInventoryComponent.componentId)
        diagBackpack(`${opId} primary barrel after structure load/fallback: ${containerSummary(blockInvAfterLoad?.container)}`)
        dumpContainerSlots("primary barrel after structure load/fallback", blockInvAfterLoad?.container, opId)

        backPack = spawnEntityAnywhere(entityTypeID, getBackpackFollowLocation(player), dim)
        diagBackpack(`${opId} spawned backpack entity: valid=${validText(backPack)}, type=${backPack?.typeId}, loc=${locText(backPack?.location)}`)

        if (!backPack?.isValid()) {
            diagBackpack(`${opId} loadBackpack FAILED: spawned backpack invalid`)
            return undefined
        }

        const entityInv = backPack.getComponent(EntityInventoryComponent.componentId)
        diagBackpack(`${opId} spawned backpack inventory before load transfer: ${containerSummary(entityInv?.container)}`)

        if (!entityInv?.container) {
            warnBackpack(`Spawned backpack entity without inventory while loading ${context}.`)
            diagBackpack(`${opId} loadBackpack FAILED: spawned backpack entity missing inventory`)
            removeBackpackEntityWithoutDrops(backPack)
            return undefined
        }

        if (maxCount > 1) {
            const blockInv2 = block2.getComponent(BlockInventoryComponent.componentId)
            diagBackpack(`${opId} secondary barrel before load transfer: ${containerSummary(blockInv2?.container)}`)
            dumpContainerSlots("secondary barrel before load transfer", blockInv2?.container, opId)

            if (!blockInv2?.container) {
                warnBackpack(`Secondary barrel inventory was unavailable while loading ${context}.`)
                diagBackpack(`${opId} loadBackpack FAILED: missing secondary barrel inventory`)
                removeBackpackEntityWithoutDrops(backPack)
                return undefined
            }

            diagBackpack(`${opId} secondary transfer begin: barrel_2 -> entity`)
            if (!transferInventory(blockInv2.container, entityInv.container, dim, block2.location, 0, 27, entityInv.container.size)) {
                diagBackpack(`${opId} secondary transfer FAILED`)
                removeBackpackEntityWithoutDrops(backPack)
                return undefined
            }

            diagBackpack(`${opId} spawned backpack inventory after secondary transfer: ${containerSummary(entityInv.container)}`)
            diagBackpack(`${opId} secondary barrel before emptyInventory: ${containerSummary(blockInv2.container)}`)
            clearBlockInventory(block2, "load secondary barrel", opId)
            diagBackpack(`${opId} secondary barrel after emptyInventory: ${containerSummary(blockInv2.container)}`)
        }

        const blockInv = getBlockSafely(dim, block.location)?.getComponent(BlockInventoryComponent.componentId)
        diagBackpack(`${opId} primary barrel before load transfer: ${containerSummary(blockInv?.container)}`)
        dumpContainerSlots("primary barrel before load transfer", blockInv?.container, opId)

        if (!blockInv?.container) {
            warnBackpack(`Primary barrel inventory was unavailable while loading ${context}.`)
            diagBackpack(`${opId} loadBackpack FAILED: missing primary barrel inventory`)
            removeBackpackEntityWithoutDrops(backPack)
            return undefined
        }

        diagBackpack(`${opId} primary transfer begin: barrel -> entity`)
        if (!transferInventory(blockInv.container, entityInv.container, dim, block.location, 0, 0, 27)) {
            diagBackpack(`${opId} primary transfer FAILED`)
            removeBackpackEntityWithoutDrops(backPack)
            return undefined
        }

        diagBackpack(`${opId} spawned backpack inventory after primary transfer: ${containerSummary(entityInv.container)}`)
        diagBackpack(`${opId} primary barrel before emptyInventory: ${containerSummary(blockInv.container)}`)
        clearBlockInventory(block, "load primary barrel", opId)
        diagBackpack(`${opId} primary barrel after emptyInventory: ${containerSummary(blockInv.container)}`)

        backPack.setDynamicProperty("backpack_id", id)
        backPack.setDynamicProperty("playerID", player.id)
        backPack.nameTag = backpackData[backPack.typeId].name

        diagBackpack(`${opId} loadBackpack end: success, final entity inventory=${containerSummary(entityInv.container)}`)
		dumpContainerSlots("final loaded backpack entity inventory", entityInv.container, opId)

		loaded = true
		return backPack
    } catch (e) {
        const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
        warnBackpack(`Failed to load ${context}: ${failureReason}`)
        diagBackpack(`${opId} loadBackpack catch: ${failureReason}`)

        if (backPack?.isValid()) removeBackpackEntityWithoutDrops(backPack)
        return undefined
    } finally {
        if (secondChanged && block2 != undefined && lastBlock2 != undefined) {
            const inv2 = block2?.getComponent(BlockInventoryComponent.componentId)
			diagBackpack(`${opId} FINALLY secondary before restore: block=${blockText(block2)}, inv=${containerSummary(inv2?.container)}, loaded=${loaded}`)
			dumpContainerSlots("FINALLY secondary before restore", inv2?.container, opId)
			clearBlockInventory(block2, "FINALLY secondary safety clear", opId)
			block_Manager.setBlock(dim, block2.location, "air")
			block2.setPermutation(lastBlock2)
        }

        if (baseChanged) {
            const inv1 = block?.getComponent(BlockInventoryComponent.componentId)
			diagBackpack(`${opId} FINALLY primary before restore: block=${blockText(block)}, inv=${containerSummary(inv1?.container)}, loaded=${loaded}`)
			dumpContainerSlots("FINALLY primary before restore", inv1?.container, opId)
			clearBlockInventory(block, "FINALLY primary safety clear", opId)
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
    const transferOp = nextBackpackDiagOp("transfer", "inventory")
    diagBackpack(`${transferOp} begin: fromStart=${FromInvStartingSlot}, toStart=${ToInvStartingSlot}, maxSlot=${maxSlot}, source=${containerSummary(container1)}, destination=${containerSummary(container2)}, fromLoc=${locText(fromInvLocation)}`)

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
            diagBackpack(`${transferOp} FAILED reading sourceSlot=${sourceSlot}: ${failureReason}`)
            return false
        }

        if (item != undefined) {
            const isDisallowed = unallowedItems.includes(item.typeId)
            const destinationSlotValid = destinationSlot < container2.size

            diagBackpack(`${transferOp} sourceSlot=${sourceSlot}, destinationSlot=${destinationSlot}, item=${itemText(item)}, disallowed=${isDisallowed}, destinationSlotValid=${destinationSlotValid}, destinationSize=${container2.size}`)

            if (!isDisallowed && destinationSlotValid) {
                try {
                    container2.setItem(destinationSlot, item)
                    diagBackpack(`${transferOp} copied item to destinationSlot=${destinationSlot}: ${itemText(item)}`)
                } catch (e) {
                    const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                    warnBackpack(`Failed writing backpack destination slot ${destinationSlot}: ${failureReason}`)
                    diagBackpack(`${transferOp} FAILED writing destinationSlot=${destinationSlot}: ${failureReason}`)
                    return false
                }
            } else {
                diagBackpack(`${transferOp} SPAWNING ITEM: sourceSlot=${sourceSlot}, destinationSlot=${destinationSlot}, destinationSize=${container2.size}, item=${itemText(item)}, reason=${isDisallowed ? "disallowed" : "destination-slot-invalid"}`)
                spawnItemAnywhere(item, fromInvLocation, dimension)

                try {
                    container1.setItem(sourceSlot, undefined)
                    diagBackpack(`${transferOp} cleared sourceSlot=${sourceSlot} after spawn`)
                } catch (e) {
                    const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                    warnBackpack(`Failed clearing disallowed backpack source slot ${sourceSlot}: ${failureReason}`)
                    diagBackpack(`${transferOp} FAILED clearing sourceSlot=${sourceSlot} after spawn: ${failureReason}`)
                    return false
                }
            }
        }

        destinationOffset++
    }

    diagBackpack(`${transferOp} end: source=${containerSummary(container1)}, destination=${containerSummary(container2)}`)
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

function clearBlockInventory(block, label, opId) {
    const inv = block?.getComponent(BlockInventoryComponent.componentId)
    const container = inv?.container

    diagBackpack(`${opId} clearBlockInventory ${label} before: block=${blockText(block)}, inv=${containerSummary(container)}`)

    if (!container) {
        diagBackpack(`${opId} clearBlockInventory ${label} failed: missing container`)
        return false
    }

    emptyInventory(container)

    const invAfter = block?.getComponent(BlockInventoryComponent.componentId)
    diagBackpack(`${opId} clearBlockInventory ${label} after: block=${blockText(block)}, inv=${containerSummary(invAfter?.container)}`)
    dumpContainerSlots(`clearBlockInventory ${label} after`, invAfter?.container, opId)

    return true
}

function spawnItemAnywhere(item, location, dimension) {
    diagBackpack(`spawnItemAnywhere begin: item=${itemText(item)}, stagingLoc=x=${Number(location.x).toFixed(2)},y=${BACKPACK_STAGING_BASE_Y},z=${Number(location.z).toFixed(2)}, finalLoc=${locText(location)}`)
    const itemEntity = dimension.spawnItem(item, { x: location.x, y: BACKPACK_STAGING_BASE_Y, z: location.z })
    itemEntity.teleport(location)
    diagBackpack(`spawnItemAnywhere end: item=${itemText(item)}, entityValid=${validText(itemEntity)}, finalLoc=${locText(location)}`)
    return itemEntity
}

/**
 * @param {string} entityID
 * @param {import("@minecraft/server").Vector3} location
 * @param {import("@minecraft/server").Dimension} dimension
 */
function spawnEntityAnywhere(entityID, location, dimension) {
    diagBackpack(`spawnEntityAnywhere begin: entityID=${entityID}, stagingLoc=x=${Number(location.x).toFixed(2)},y=${BACKPACK_STAGING_BASE_Y},z=${Number(location.z).toFixed(2)}, finalLoc=${locText(location)}`)
    const entity = dimension.spawnEntity(entityID, { x: location.x, y: BACKPACK_STAGING_BASE_Y, z: location.z })
    entity.teleport(location)
    diagBackpack(`spawnEntityAnywhere end: entityID=${entityID}, entityValid=${validText(entity)}, finalLoc=${locText(location)}`)
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
                diagBackpack(`backpackTick: portal nearby, saving backpack type=${entity.typeId}, id=${entity.getDynamicProperty("backpack_id") ?? "missing"}, player=${player.id}`)
                saveBackpack(entity)
            }
        } else if (entity?.isValid()) {
            diagBackpack(`backpackTick: player invalid/missing, saving backpack type=${entity.typeId}, id=${entity.getDynamicProperty("backpack_id") ?? "missing"}`)
            saveBackpack(entity)
        }
    }

    diagBackpack(`backpackTick start: entity=${entity?.typeId}, entityValid=${validText(entity)}, id=${entity?.getDynamicProperty("backpack_id") ?? "missing"}, player=${player?.id ?? "missing"}, playerValid=${validText(player)}`)
    tick()
}

/**
 * @param {import("@minecraft/server").Player} player
 * @param {string} besidesTag
 */
function removeAllIDTags(player, besidesTag = "") {
    if (!player?.isValid()) return

    const allTags = player.getTags()
    const removed = []

    for (const tag of allTags) {
        if (tag.startsWith("holdingbackpack.") && tag != besidesTag) {
            player.removeTag(tag)
            removed.push(tag)
        }
    }

    if (removed.length > 0) diagBackpack(`removeAllIDTags: player=${player.id}, besidesTag=${besidesTag}, removed=${JSON.stringify(removed)}`)
}


function getActiveBackpackForPlayer(player, backpackId) {
    if (!player?.isValid() || typeof backpackId != "string" || backpackId.length < 1) return undefined

    const backpacks = player.dimension.getEntities({ tags: [player.id, "backpack"] })

    for (const backpack of backpacks) {
        if (backpack?.isValid() && backpack.getDynamicProperty("backpack_id") === backpackId) return backpack
    }

    return undefined
}

function playerHasActiveBackpack(player, backpackId) {
    return getActiveBackpackForPlayer(player, backpackId) != undefined
}

function savePlayerBackpacks(player) {
    const backpacks = player.dimension.getEntities({ tags: [player.id, "backpack"] })
    diagBackpack(`savePlayerBackpacks: player=${player.id}, found=${backpacks.length}`)

    for (const backpack of backpacks) {
        diagBackpack(`savePlayerBackpacks: saving entity type=${backpack.typeId}, id=${backpack.getDynamicProperty("backpack_id") ?? "missing"}, valid=${validText(backpack)}, loc=${locText(backpack.location)}`)
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
                    //diagBackpack(`player loop: player=${player.id}, holding=${item.typeId}, backpack_id=${item.getDynamicProperty("backpack_id") ?? "missing"}, tags=${JSON.stringify(player.getTags().filter(tag => tag.startsWith("holdingbackpack.") || tag == "!holding"))}`)

                    if (portalNearby(player) == false) {
                        player.removeTag("!holding")
                        let id = item.getDynamicProperty("backpack_id")

                        if (typeof id != "string" || id.length < 1) {
                            id = generateRandomID(BACKPACK_ID_LENGTH)
                            item.setDynamicProperty("backpack_id", id)
                            slot.setItem(item)
                            diagBackpack(`player loop: assigned new backpack_id=${id} to held item type=${item.typeId}, player=${player.id}`)
                        }

                        const tag = "holdingbackpack." + id

                        if (!player.hasTag(tag) || !playerHasActiveBackpack(player, id)) {
                            if (player.hasTag(tag)) {
                                diagBackpack(`player loop: stale backpack tag detected; reloading active backpack. player=${player.id}, tag=${tag}`)
                                player.removeTag(tag)
                            }

                            diagBackpack(`player loop: switching/loading backpack. player=${player.id}, newTag=${tag}`)
                            savePlayerBackpacks(player)
                            removeAllIDTags(player, tag)

                            const backpack = loadBackpack(item.typeId, player, item)

                            if (backpack?.isValid()) {
                                diagBackpack(`player loop: loadBackpack succeeded. player=${player.id}, id=${id}, entity=${backpack.typeId}, entityValid=${validText(backpack)}`)
                                backpack.addTag(player.id)
                                backpack.addTag("backpack")
                                player.addTag(tag)
                                player.removeTag("!holding")
                                backpackTick(backpack, player)
                                diagBackpack(`player loop: added backpack tags. player=${player.id}, entityID=${id}`)
                            } else {
                                diagBackpack(`player loop: loadBackpack FAILED. player=${player.id}, id=${id}`)
                                player.removeTag(tag)
                                player.addTag("!holding")
                            }
                        }
                    } else if (!player.hasTag("!holding")) {
                        diagBackpack(`player loop: portal nearby while holding backpack. player=${player.id}`)
                        removeAllIDTags(player, "")
                        savePlayerBackpacks(player)
                        player.addTag("!holding")
                    }
                } else if (!player.hasTag("!holding")) {
                    //diagBackpack(`player loop: player no longer holding backpack. player=${player.id}, held=${item?.typeId ?? "empty"}`)
                    removeAllIDTags(player, "")
                    savePlayerBackpacks(player)
                    player.addTag("!holding")
                }
            } catch (e) {
                const failureReason = e instanceof Error ? `${e.name}: ${e.message}` : String(e)
                warnBackpack(`Backpack player loop failed for player ${player.id}: ${failureReason}`)
                diagBackpack(`player loop exception: player=${player.id}, error=${failureReason}`)
            }

            yield
        }
    }())
}, 5)

world.afterEvents.playerJoin.subscribe((data) => {
    const player = world.getEntity(data.playerId)
    diagBackpack(`playerJoin: playerId=${data.playerId}, playerValid=${validText(player)}`)
    removeAllIDTags(player, "")
})

world.afterEvents.playerLeave.subscribe((data) => {
    diagBackpack(`playerLeave: playerId=${data.playerId}`)

    for (const dimension of dimensions) {
        const dim = world.getDimension(dimension.typeId)
        const backpacks = dim.getEntities({ tags: [data.playerId, "backpack"] })

        diagBackpack(`playerLeave: dimension=${dimension.typeId}, backpacksFound=${backpacks.length}`)

        for (const backpack of backpacks) {
            diagBackpack(`playerLeave: saving backpack type=${backpack.typeId}, id=${backpack.getDynamicProperty("backpack_id") ?? "missing"}, loc=${locText(backpack.location)}`)
            saveBackpack(backpack)
        }
    }
})

system.runInterval(() => {
    system.runJob(function* () {
        for (const dimension of dimensions) {
            const dim = world.getDimension(dimension.typeId)
            const backpacks = dim.getEntities({ tags: ["backpack"] })

            //if (backpacks.length > 0) diagBackpack(`watchdog loop: dimension=${dimension.typeId}, backpackEntities=${backpacks.length}`)

            for (const backpack of backpacks) {
                const itemid = backpack.getDynamicProperty("backpack_id")
                const id = backpack.getDynamicProperty("playerID")

                //diagBackpack(`watchdog loop: backpack type=${backpack.typeId}, backpack_id=${itemid ?? "missing"}, playerID=${id ?? "missing"}, valid=${validText(backpack)}, loc=${locText(backpack.location)}`)

                if (id != undefined) {
                    const player = world.getEntity(id)
                    const playerHasTag = player != undefined && player.hasTag("holdingbackpack." + itemid)

                    //diagBackpack(`watchdog loop: playerValid=${validText(player)}, expectedTag=holdingbackpack.${itemid}, playerHasTag=${playerHasTag}`)

                    if (player == undefined || !player.hasTag("holdingbackpack." + itemid)) {
                        diagBackpack(`watchdog loop: saving orphan/mismatched backpack id=${itemid ?? "missing"}`)
                        saveBackpack(backpack)
                    }
                }

                yield
            }
        }
    }())
}, 20)