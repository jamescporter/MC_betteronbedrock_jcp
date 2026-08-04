const recoverySessions = new Map()

export const getBackpackRecoverySession = entityId => recoverySessions.get(entityId)
export const setBackpackRecoverySession = (entityId, session) => recoverySessions.set(entityId, session)
export const clearBackpackRecoverySession = entityId => recoverySessions.delete(entityId)

export function clearPlayerBackpackRecoverySessions(playerId) {
    const cleared = []
    for (const [entityId, session] of recoverySessions) {
        if (session.playerId !== playerId) continue
        recoverySessions.delete(entityId)
        cleared.push([entityId, session])
    }
    return cleared
}

export const hasBackpackRecoveryAccess = (entityId, playerId) => recoverySessions.get(entityId)?.playerId === playerId
