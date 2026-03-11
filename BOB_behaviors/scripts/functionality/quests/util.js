import { ItemStack } from "@minecraft/server";
import { getTranslation } from "../util.js";

export const getFormattedStatus = (status) => {
    switch (status) {
        case 1:
            return "§8%bob.gui.quests.status.unlocked§r";
        case 2:
            return "§6%bob.gui.quests.status.busy§r";
        case 3:
            return "§q%bob.gui.quests.status.completed§r";
        case 4:
            return "§q%bob.gui.quests.status.claimed§r";
        default: return "§c%bob.gui.quests.status.locked§r";
    };
};

export const randomIndex = (distribution) => distribution[Math.floor(Math.random() * distribution.length)];
export const randomItem = (array, distribution) => array[randomIndex(distribution)];
export const createDistribution = (weights) => {
    const distribution = [];
    const sum = weights.reduce((a, b) => a + b);
    const quant = 10 / sum;
  	for (let i = 0; i < weights.length; ++i) {
      	const limit = quant * weights[i];
      	for (let j = 0; j < limit; ++j) distribution.push(i);
    };
	
  	return distribution;
};

export function getRewards(questRewards = []) {
    const rewards = questRewards.map((r) => {
        switch (r.type) {
            case 0: {
                const name = getTranslation(r.name);

                return [
                    { text: "§8- §7" },
                    { text: r.amount + "x " },
                    { translate: name },
                    { text: "§r\n" }
                ];
            };
            case 1: return [
                { text: "§8- §7" },
                { text: r.amount + "x XP§r\n" }
            ];
        };
    }).flat();

    return rewards.length === 0 ? [{ text: "§8- §7%bob.gui.noRewards" }] : rewards;
    //return "§8- §7" + rewards.join("\n§8- §7");
};

export function giveRewards(player, rewards) {
    for (const reward of rewards) {
        switch (reward.type) {
            case 0: {
                const itemStack = new ItemStack(reward.name, reward.amount);
                player.dimension.spawnItem(itemStack, player.location);
                break;
            };
            case 1: {
                player.addExperience(reward.amount);
                break;
            };
        };
    };
};

const cloneJsonValue = (value) => JSON.parse(JSON.stringify(value));

/**
 * @param {import("@minecraft/server").Player} player
 * @param {string} key
 * @param {any[] | object} fallback
 * @param {{ initialize?: boolean, resetOnError?: boolean }} [options]
 */
export function readJsonProperty(player, key, fallback, options = {}) {
    const { initialize = true, resetOnError = true } = options;

    const getFallbackString = () => JSON.stringify(fallback);
    const getFallbackValue = () => cloneJsonValue(fallback);

    const raw = player.getDynamicProperty(key);
    if (raw == undefined) {
        if (initialize)
            player.setDynamicProperty(key, getFallbackString());

        return {
            value: getFallbackValue(),
            wasCorrupt: false,
            wasMissing: true,
        };
    };

    try {
        const parsed = JSON.parse(raw);
        const expectsArray = Array.isArray(fallback);
        const validType = expectsArray
            ? Array.isArray(parsed)
            : parsed !== null && typeof parsed === "object" && !Array.isArray(parsed);
        if (!validType)
            throw new Error("Dynamic property type mismatch");

        return {
            value: parsed,
            wasCorrupt: false,
            wasMissing: false,
        };
    }
    catch (error) {
        if (resetOnError)
            player.setDynamicProperty(key, getFallbackString());

        console.warn(`[quests] Failed to parse dynamic property '${key}': ${error}`);
        return {
            value: getFallbackValue(),
            wasCorrupt: true,
            wasMissing: false,
        };
    };
};
