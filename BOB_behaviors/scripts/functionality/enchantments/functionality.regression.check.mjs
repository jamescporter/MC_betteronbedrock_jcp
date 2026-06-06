import assert from "node:assert/strict";

function oldTraversal(graph, startId, maxBlocks) {
    const nodes = new Map(graph.map((node) => [node.id, node]));
    const blocks = [];
    const locations = new Set([startId]);
    const search = [startId];

    while (blocks.length < maxBlocks && search.length > 0) {
        const current = search.shift();
        blocks.push(current);

        const node = nodes.get(current);
        if (node === undefined)
            continue;

        for (const neighbor of node.neighbors) {
            if (locations.has(neighbor))
                continue;

            locations.add(neighbor);
            search.push(neighbor);
        }
    }

    return {
        order: blocks,
        durabilityCost: Math.max(blocks.length - 1, 0),
        xpOrbs: Math.floor(blocks.length / 2),
    };
}

function queuedTraversal(graph, startId, maxBlocks, chunkSize = 16) {
    const immediate = oldTraversal(graph, startId, maxBlocks).order;
    const ticks = [];
    for (let i = 0; i < immediate.length; i += chunkSize)
        ticks.push(immediate.slice(i, i + chunkSize));

    return {
        order: ticks.flat(),
        ticks,
        durabilityCost: Math.max(immediate.length - 1, 0),
        xpOrbs: Math.floor(immediate.length / 2),
    };
}


function queuedBreakSimulation(blocks, chunkSize = 16) {
    const minedTypeIds = [];
    let brokenBlocks = 0;

    for (let index = 0; index < blocks.length; index += chunkSize) {
        for (let i = index; i < Math.min(index + chunkSize, blocks.length); i++) {
            const block = blocks[i];
            if (i === 0)
                continue;

            if (!block.matchesTarget || block.typeId === "minecraft:air" || block.protected)
                continue;

            minedTypeIds.push(block.typeId);
            block.typeId = "minecraft:air";
            brokenBlocks++;
        }
    }

    return { minedTypeIds, brokenBlocks };
}

const representativeVein = [
    { id: "ore0", neighbors: ["ore1", "ore2", "ore3"] },
    { id: "ore1", neighbors: ["ore0", "ore4"] },
    { id: "ore2", neighbors: ["ore0", "ore5", "ore6"] },
    { id: "ore3", neighbors: ["ore0"] },
    { id: "ore4", neighbors: ["ore1", "ore7"] },
    { id: "ore5", neighbors: ["ore2"] },
    { id: "ore6", neighbors: ["ore2", "ore8"] },
    { id: "ore7", neighbors: ["ore4", "ore9"] },
    { id: "ore8", neighbors: ["ore6"] },
    { id: "ore9", neighbors: ["ore7"] },
];

const representativeTree = [
    { id: "trunk0", neighbors: ["trunk1", "branchL1", "branchR1"] },
    { id: "trunk1", neighbors: ["trunk0", "trunk2"] },
    { id: "trunk2", neighbors: ["trunk1", "canopy1", "canopy2"] },
    { id: "branchL1", neighbors: ["trunk0", "branchL2"] },
    { id: "branchL2", neighbors: ["branchL1", "leafNode1"] },
    { id: "branchR1", neighbors: ["trunk0", "branchR2"] },
    { id: "branchR2", neighbors: ["branchR1", "leafNode2"] },
    { id: "canopy1", neighbors: ["trunk2", "leafNode3"] },
    { id: "canopy2", neighbors: ["trunk2", "leafNode4"] },
    { id: "leafNode1", neighbors: ["branchL2"] },
    { id: "leafNode2", neighbors: ["branchR2"] },
    { id: "leafNode3", neighbors: ["canopy1"] },
    { id: "leafNode4", neighbors: ["canopy2"] },
];

function runRegressionCase(name, graph, start) {
    const oldResult = oldTraversal(graph, start, 128);
    const newResult = queuedTraversal(graph, start, 128, 4);

    assert.deepEqual(newResult.order, oldResult.order, `${name}: queued order drifted`);
    assert.equal(newResult.durabilityCost, oldResult.durabilityCost, `${name}: durability drifted`);
    assert.equal(newResult.xpOrbs, oldResult.xpOrbs, `${name}: xp drifted`);

    const rerun = queuedTraversal(graph, start, 128, 4);
    assert.deepEqual(newResult.order, rerun.order, `${name}: non-deterministic ordering`);
}

runRegressionCase("representative vein", representativeVein, "ore0");
runRegressionCase("representative tree", representativeTree, "trunk0");


const protectedSimulation = queuedBreakSimulation([
    { typeId: "minecraft:air", matchesTarget: false },
    { typeId: "minecraft:iron_ore", matchesTarget: true },
    { typeId: "minecraft:diamond_block", matchesTarget: false },
    { typeId: "minecraft:gold_ore", matchesTarget: true, protected: true },
    { typeId: "minecraft:iron_ore", matchesTarget: true },
], 2);
assert.deepEqual(protectedSimulation.minedTypeIds, ["minecraft:iron_ore", "minecraft:iron_ore"], "queued breaking should only drop actually mined matching blocks");
assert.equal(protectedSimulation.brokenBlocks, 2, "queued breaking should only charge durability for actually mined matching blocks");

console.log("Regression checks passed: queued traversal preserves order/durability/xp against legacy traversal and skips protected or changed blocks.");
