import { world, system, ItemStack, EquipmentSlot, ItemDurabilityComponent, EntityEquippableComponent } from "@minecraft/server";

const MINE_QUEUE_CHUNK_SIZE = 16;
const mineQueue = [];
const reservedDurabilityByPlayer = new Map();
let isMineQueueScheduled = false;

function scheduleMineQueue() {
    if (isMineQueueScheduled)
        return;

    isMineQueueScheduled = true;
    system.run(processMineQueue);
};

function processMineQueue() {
    const current = mineQueue[0];
    if (current === undefined) {
        isMineQueueScheduled = false;
        return;
    };

    try {
        const end = Math.min(current.index + MINE_QUEUE_CHUNK_SIZE, current.blocks.length);
        for (let i = current.index; i < end; i++) {
            current.blocks[i].setType("minecraft:air");
        };

        current.index = end;
        if (current.index >= current.blocks.length) {
            try {
                current.onComplete();
            }
            catch (error) {
                console.warn("[enchantments] queued mine completion failed", error);
            }
            finally {
                mineQueue.shift();
            };
        };
    }
    catch (error) {
        console.warn("[enchantments] queued mine block set failed", error);
        try {
            current.onError?.(error);
        }
        catch (callbackError) {
            console.warn("[enchantments] queued mine error callback failed", callbackError);
        }
        finally {
            mineQueue.shift();
        };
    }

    if (mineQueue.length > 0) {
        system.run(processMineQueue);
    }
    else {
        isMineQueueScheduled = false;
    };
};

function queueVeinMine(blocks, onComplete, onError) {
    mineQueue.push({ blocks, onComplete, onError, index: 0 });
    scheduleMineQueue();
};

/**
 * @param { import("@minecraft/server").Block } block 
 * @returns { import("@minecraft/server").Block[] }
 */
function getMineShape(block) {
    const above = block.above();
    const below = block.below();

    const aNorth = above.north();
    const aSouth = above.south();
    const aEast = above.east();
    const aWest = above.west();
    
    const bNorth = below.north();
    const bSouth = below.south();
    const bEast = below.east();
    const bWest = below.west();
    return [
        above,
        aNorth.east(), aNorth, aNorth.west(),
        aSouth.east(), aSouth, aSouth.west(),
        aEast, aWest,
        
        below,
        bNorth.east(), bNorth, bNorth.west(),
        bSouth.east(), bSouth, bSouth.west(),
        bEast, bWest,
        
        block.north(), block.south(),
        block.east(), block.west(),
    ];
};

/**
 * @param { import("@minecraft/server").Block } block
 * @param { string } blockType
 * @returns { import("@minecraft/server").Block[] }
 */
export function searchForVein(start, blockType, matches = [], states = {}, maxBlocks, durability = Number.MIN_SAFE_INTEGER, maxDurability = Number.MAX_SAFE_INTEGER) {
    const blocks = [];
    const locations = [ start.location ];
    const search = [ start ];

    while (
        blocks.length < maxBlocks
        && search.length > 0
        && (durability !== undefined && durability + blocks.length <= maxDurability)
    ) {
        const currentSearch = search.shift();
        blocks.push(currentSearch);

        const shape = getMineShape(currentSearch);
        for (let i = 0; i < shape.length; i++) {
            const block = shape[i];
            const { x, y, z } = block.location;
            if (locations.find(
                (location) =>
                    x == location.x
                    && y == location.y
                    && z == location.z
            ) !== undefined)
                continue;

            if (
                block.matches(blockType, states)
                || block.matches(blockType.replace("lit_", ""), states)
            ) {
                locations.push({ x, y, z });
                search.push(block);
            }
            else if (matches.includes(block.typeId)) {
                locations.push({ x, y, z });
                search.push(block);
            };
        };
    };

    return blocks;
};

/** @param { import("@minecraft/server").Block[] } blocks */
export function veinMine(blocks) {
    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        block.setType("minecraft:air");
    };
};

/**
 * @param { boolean } isPickaxe
 * @param { import("@minecraft/server").Dimension } dimension
 * @param { string } drop
 * @param { any[] } drops
 * @param { import("@minecraft/server").Block } block
 * @param { import("@minecraft/server").Block[] } blocks
 * @param { number } brokenBlocks
 */
export function applyBlockDrops(
    blockDrops, blockType, drops, block,
    itemStack, blocks, brokenBlocks, shouldUseSilk
) {
    let drop = blockDrops?.drop;
    if (itemStack.getLore().includes("§r§7Ore Smelter I") && blockDrops?.smelted !== undefined) {
        drop = blockDrops.smelted;
        blockDrops.xp = true;
    };
    const isTreeCap = itemStack.getLore().includes("§r§7Tree Capitator I");

    const enchantable = itemStack.getComponent("enchantable");
    const hasFortune = enchantable.hasEnchantment("fortune");
    const hasSilktouch = enchantable.hasEnchantment("silk_touch");
    const fortuneLevel = hasFortune ? enchantable.getEnchantment("fortune").level : 0;
    if (drops.drop !== undefined && !isTreeCap) {
        const amount = Math.random() * ((drops.drop.max * (fortuneLevel + 1)) - drops.drop.min) + drops.drop.min;
        brokenBlocks = brokenBlocks * amount;
    };

    if (blockDrops.xp && !hasSilktouch) {
        for (let i = 0; i < blocks.length / 2; i++) {
            block.dimension.spawnEntity("minecraft:xp_orb", block.location);
        };
    };

    const items = [];
    if (hasSilktouch && shouldUseSilk)
        drop = null;
    
    function dropItems(itemType, amount) {
        const stackAmount = Math.floor(amount / 64);
        const blocksLeft = (amount / 64) - stackAmount;
        if (blocksLeft > 0) {
            items.push(new ItemStack(itemType, (64 * blocksLeft) ?? 1));
        };
    
        for (let i = 1; i <= stackAmount; i++)
            items.push(new ItemStack(itemType, 64));
    };

    if (blockDrops?.drops !== undefined) {
        for (let item of blockDrops.drops)
            dropItems(item, brokenBlocks);
    }
    else {
        if (drop == void 0) {
            const drops = {};
            for (const block of blocks) {
                if (!drops[block])
                    drops[block] = 0;
                
                drops[block]++;
            };
            
            for (const drop in drops) {
                dropItems(drop, drops[drop]);
            };
        }
        else {
            dropItems(drop, brokenBlocks);
        };
    };
    
    for (let i = 0; i < items.length; i++) {
        const itemStack = items[i];
        block.dimension.spawnItem(itemStack, block.location);
    };
};

function getPlayerDurabilityKey(player) {
    return player.id ?? player.name;
};

export function mine(block, blockType, player, itemStack, blocksArray, shouldUseSilk = true, queueLabel = "mine") {
    const drops = blocksArray.find(({ blocks }) =>
        blocks.find(({ name }) => name === blockType)
    );

    const blockDrops = drops?.blocks?.find(({ name }) => name === blockType);
    if (
        blockDrops === undefined
        || (blockDrops.mineable.length !== 0 && !itemStack.getTags().some((tag) => blockDrops.mineable.includes(tag)))
    ) return;

    const durability = itemStack.getComponent(ItemDurabilityComponent.componentId);
    const playerDurabilityKey = getPlayerDurabilityKey(player);
    const reservedDurability = reservedDurabilityByPlayer.get(playerDurabilityKey) ?? 0;
    const effectiveDamage = durability === undefined ? undefined : durability.damage + reservedDurability;
    const blocks = searchForVein(block, blockType, blockDrops.matches, blockDrops.states, 128, effectiveDamage, durability?.maxDurability);
    if (blocks.length === 0)
        return;

    const types = blocks.map((b) => b.typeId).filter((id) => id !== "minecraft:air");
    let brokenBlocks = blocks.length - 1;
    if (durability !== undefined && brokenBlocks > 0)
        reservedDurabilityByPlayer.set(playerDurabilityKey, reservedDurability + brokenBlocks);

    function releaseReservedDurability() {
        if (durability !== undefined && brokenBlocks > 0) {
            const queuedDurability = reservedDurabilityByPlayer.get(playerDurabilityKey) ?? 0;
            const remainingReserved = Math.max(queuedDurability - brokenBlocks, 0);
            if (remainingReserved > 0)
                reservedDurabilityByPlayer.set(playerDurabilityKey, remainingReserved);
            else
                reservedDurabilityByPlayer.delete(playerDurabilityKey);
        };
    }

    queueVeinMine(blocks, () => {
        try {
            const equippable = player.getComponent(EntityEquippableComponent.componentId);
            if (durability !== undefined) {
                if ((durability.damage + brokenBlocks) < durability.maxDurability) {
                    durability.damage += brokenBlocks;
                    equippable.setEquipment(EquipmentSlot.Mainhand, itemStack);
                } else {
                    equippable.setEquipment(EquipmentSlot.Mainhand);
                    world.playSound("random.break", player.location);
                };
            };

            applyBlockDrops(
                blockDrops, blockType, drops, block,
                itemStack, types, brokenBlocks, shouldUseSilk
            );
        }
        finally {
            releaseReservedDurability();
        }
    }, () => {
        releaseReservedDurability();
    });
};

/**
 * Deterministic simulator used by regression tests.
 * @param {{ id: string, neighbors: string[] }[]} graph
 * @param {string} startId
 * @param {number} maxBlocks
 * @param {number} chunkSize
 */
export function simulateQueuedTraversal(graph, startId, maxBlocks, chunkSize = MINE_QUEUE_CHUNK_SIZE) {
    const nodes = new Map(graph.map((node) => [node.id, node]));
    const visited = [];
    const queued = [ startId ];
    const known = new Set([ startId ]);

    while (queued.length > 0 && visited.length < maxBlocks) {
        const current = queued.shift();
        visited.push(current);

        const node = nodes.get(current);
        if (node === undefined)
            continue;

        for (const neighbor of node.neighbors) {
            if (known.has(neighbor))
                continue;

            known.add(neighbor);
            queued.push(neighbor);
        };
    };

    const ticks = [];
    for (let i = 0; i < visited.length; i += chunkSize)
        ticks.push(visited.slice(i, i + chunkSize));

    return {
        immediate: visited,
        ticks,
        queued: ticks.flat(),
        durabilityCost: Math.max(visited.length - 1, 0),
        xpOrbs: Math.floor(visited.length / 2),
    };
};
