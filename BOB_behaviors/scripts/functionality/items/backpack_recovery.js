import { EntityInventoryComponent, system, world } from "@minecraft/server"
import { backpackDimensions, backpackIDs } from "./backpacks.js"
import { clearBackpackRecoverySession, clearPlayerBackpackRecoverySessions, getBackpackRecoverySession, setBackpackRecoverySession } from "./backpack_recovery_sessions.js"

const RECOVERY_EVENT = "better_on_bedrock:backpack_recovery"
const ADMIN_TAG = "bob_backpack_admin"
const reply = (player, message) => player.sendMessage(`[Backpack recovery] ${message}`)
const failureText = error => error instanceof Error ? error.message : String(error)

function isValid(entity) {
    try {
        return entity != undefined && (typeof entity.isValid == "function" ? entity.isValid() : entity.isValid)
    } catch {
        return false
    }
}

function getOnlinePlayer(name) {
    const wanted = name.trim().toLocaleLowerCase()
    return world.getAllPlayers().find(player => player.name.toLocaleLowerCase() === wanted)
}

function getBackpack(entityId) {
    const entity = world.getEntity(entityId)
    return isValid(entity) && backpackIDs.includes(entity.typeId) ? entity : undefined
}

const getContainer = entity => entity.getComponent(EntityInventoryComponent.componentId)?.container
const dimensionId = entity => entity.dimension.id ?? entity.dimension.typeId
const locationText = location => `${location.x.toFixed(2)},${location.y.toFixed(2)},${location.z.toFixed(2)}`

function inventoryTotals(entity) {
    const container = getContainer(entity)
    if (!container) return { error: "inventory unavailable" }
    let occupied = 0
    let total = 0
    try {
        for (let slot = 0; slot < container.size; slot++) {
            const item = container.getItem(slot)
            if (!item) continue
            occupied++
            total += item.amount
        }
    } catch (error) {
        return { error: `inventory read failed: ${failureText(error)}` }
    }
    return { occupied, total }
}

function summary(entity) {
    const totals = inventoryTotals(entity)
    const inventory = totals.error ?? `occupied=${totals.occupied}, items=${totals.total}`
    return `entity=${entity.id}, backpack=${String(entity.getDynamicProperty("backpack_id"))}, owner=${String(entity.getDynamicProperty("playerID"))}, type=${entity.typeId}, dimension=${dimensionId(entity)}, location=${locationText(entity.location)}, ${inventory}, quarantined=${entity.getDynamicProperty("backpack_quarantined") === true}`
}

function* scanJob(admin, ownerId) {
    let count = 0
    for (const dimensionType of backpackDimensions) {
        const dimension = world.getDimension(dimensionType.typeId)
        for (const entity of dimension.getEntities({ families: ["backpack"] })) {
            if (!isValid(entity) || !backpackIDs.includes(entity.typeId)) continue
            if (ownerId != undefined && entity.getDynamicProperty("playerID") !== ownerId) continue
            reply(admin, summary(entity))
            count++
            yield
        }
    }
    reply(admin, `Scan complete: ${count} entit${count === 1 ? "y" : "ies"}.`)
}

function inspect(admin, entityId) {
    const entity = getBackpack(entityId)
    if (!entity) return reply(admin, "Entity not found or is not a backpack.")
    const container = getContainer(entity)
    if (!container) return reply(admin, "Inventory unavailable; nothing was changed.")
    reply(admin, summary(entity))
    try {
        for (let slot = 0; slot < container.size; slot++) {
            const item = container.getItem(slot)
            reply(admin, `slot=${slot}: ${item ? `${item.typeId} x${item.amount}` : "empty"}`)
        }
    } catch (error) {
        reply(admin, `Inventory read failed: ${failureText(error)}. Nothing was changed.`)
    }
}

function open(admin, entityId, playerName) {
    const entity = getBackpack(entityId)
    if (!entity) return reply(admin, "Entity not found or is not a backpack.")
    if (entity.getDynamicProperty("backpack_quarantined") !== true) return reply(admin, "Entity is not quarantined; nothing was changed.")
    const player = getOnlinePlayer(playerName)
    if (!player) return reply(admin, "Target player is not online.")
    if (getBackpackRecoverySession(entityId)) return reply(admin, "That entity already has a recovery session.")
    entity.setDynamicProperty("backpack_quarantined", true)
    setBackpackRecoverySession(entityId, { playerId: player.id, dimensionId: dimensionId(entity), location: { ...entity.location } })
    try {
        entity.teleport({ x: player.location.x + 1, y: player.location.y, z: player.location.z + 1 }, { dimension: player.dimension })
        reply(admin, `Opened ${entityId} for ${player.name}; it remains quarantined.`)
    } catch (error) {
        clearBackpackRecoverySession(entityId)
        reply(admin, `Open failed: ${failureText(error)}. The entity remains quarantined.`)
    }
}

function returnEntity(entityId, session) {
    const entity = getBackpack(entityId)
    if (!entity) return false
    entity.setDynamicProperty("backpack_quarantined", true)
    try {
        entity.teleport(session.location, { dimension: world.getDimension(session.dimensionId) })
        return true
    } catch {
        return false
    }
}

function cancel(admin, entityId) {
    const session = getBackpackRecoverySession(entityId)
    if (!session) return reply(admin, "No active session for that entity.")
    clearBackpackRecoverySession(entityId)
    const returned = returnEntity(entityId, session)
    reply(admin, `Session cancelled; entity left quarantined${returned ? " and returned" : ""}.`)
}

function finish(admin, entityId) {
    if (!getBackpackRecoverySession(entityId)) return reply(admin, "No active session for that entity.")
    const entity = getBackpack(entityId)
    if (!entity) return reply(admin, "Entity is unavailable; the session remains active.")
    const container = getContainer(entity)
    if (!container) return reply(admin, "Inventory is unreadable; entity not removed.")
    try {
        for (let slot = 0; slot < container.size; slot++) {
            if (container.getItem(slot)) return reply(admin, `Refused: slot ${slot} is occupied.`)
        }
    } catch (error) {
        return reply(admin, `Inventory is unreadable: ${failureText(error)}. Entity not removed.`)
    }
    try {
        entity.remove()
        clearBackpackRecoverySession(entityId)
        reply(admin, `Removed confirmed-empty entity ${entityId}.`)
    } catch (error) {
        reply(admin, `Removal failed: ${failureText(error)}. The session remains active.`)
    }
}

function handleCommand(admin, message) {
    const input = (message ?? "").trim()
    const space = input.indexOf(" ")
    const command = (space < 0 ? input : input.slice(0, space)).toLocaleLowerCase()
    const argumentsText = space < 0 ? "" : input.slice(space + 1).trim()
    if (command === "scan-all" && !argumentsText) return system.runJob(scanJob(admin))
    if (command === "scan" && argumentsText) {
        const player = getOnlinePlayer(argumentsText)
        if (!player) return reply(admin, "Named player is not online.")
        return system.runJob(scanJob(admin, player.id))
    }
    if (command === "inspect" && argumentsText) return inspect(admin, argumentsText)
    if (command === "cancel" && argumentsText) return cancel(admin, argumentsText)
    if (command === "finish" && argumentsText) return finish(admin, argumentsText)
    if (command === "open" && argumentsText) {
        const separator = argumentsText.indexOf(" ")
        if (separator > 0) return open(admin, argumentsText.slice(0, separator), argumentsText.slice(separator + 1))
    }
    reply(admin, "Usage: scan <player>, scan-all, inspect <entity-id>, open <entity-id> <player>, cancel <entity-id>, or finish <entity-id>.")
}

system.afterEvents.scriptEventReceive.subscribe(event => {
    if (event.id !== RECOVERY_EVENT) return
    const admin = event.sourceEntity
    if (!isValid(admin) || admin.typeId !== "minecraft:player" || !admin.hasTag(ADMIN_TAG)) return
    system.run(() => handleCommand(admin, event.message))
})

world.afterEvents.playerLeave.subscribe(event => {
    for (const [entityId, session] of clearPlayerBackpackRecoverySessions(event.playerId)) returnEntity(entityId, session)
})
