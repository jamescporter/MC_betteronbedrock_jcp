import { world, system, Player, TicksPerSecond } from "@minecraft/server";

import { tiers, secret } from "./regular/main.js";
import { giveRewards } from "./util.js";

world.afterEvents.playerSpawn.subscribe(
    ({ player }) => {
        if (player.getDynamicProperty("tiersCompleted") == undefined) {
            player.setDynamicProperty("tiersCompleted", 0)
        };
    },
);

export function loopQuests(player, object) {
    const localContext = {
        tierStates: new Map(),
        secretState: undefined,
    };

    return loopQuestsWithContext(player, object, localContext, true);
};

export function loopQuestsWithContext(player, object, context, shouldFlush = false) {
    for (let i = 0; i < tiers.length; i++) {
        const tier = tiers[i];
        const state = getTierState(player, context, tier.property);
        if (!state)
            continue;

        const savedQuests = state.value;
        for (let j = 0; j < tier.quests.length; j++) {
            const quest = tier.quests[j];
            const savedQuest = savedQuests.find((q) => q[0] == j);
            if (savedQuest == undefined || quest.unlock == undefined)
                continue;

            if (savedQuest[1] !== 2 || !quest.unlock.check(object))
                continue;

            savedQuest[1] = 3; // Completed
            const nextQuest = savedQuests.find((q) => q[0] == j + 1);
            if (nextQuest !== undefined)
                nextQuest[1] = 1; // Unlocked
            state.dirty = true;
            
            if (quest.unlock.title !== undefined)
                player.sendMessage(quest.unlock.title);
            if (quest.unlock.sound !== undefined)
                player.playSound(quest.unlock.sound);
            player.sendMessage([
                { text: "§a[!] " },
                { translate: "bob.message.questComplete" },
                { text: " §r§8- §r" },
                {
                    translate: "bob.message.quests.completeQuest",
                    with: [ quest.name ]
                },
            ]);

            if (j == tier.quests.length - 1) {
                if (tier.rewards !== undefined)
                    giveRewards(player, tier.rewards);
                if (tier.title !== undefined)
                    player.sendMessage(tier.title);
                
                player.sendMessage([
                    { text: "§a[!] §r" },
                    {
                        translate: "bob.message.quests.tierUnlocked",
                        with: [ tier.name ],
                    },
                ]);

                const tiersCompleted = player.getDynamicProperty("tiersCompleted") || 0;
                player.setDynamicProperty("tiersCompleted", tiersCompleted + 1);
            };
        };
    };

    if (shouldFlush)
        flushQuestLoopContext(player, context);
};

export function loopSecretQuests(player, object) {
    const localContext = {
        tierStates: new Map(),
        secretState: undefined,
    };

    return loopSecretQuestsWithContext(player, object, localContext, true);
};

export function loopSecretQuestsWithContext(player, object, context, shouldFlush = false) {
    const secretState = getSecretState(player, context);
    const savedQuests = secretState.value;
    for (let j = 0; j < secret.quests.length; j++) {
        const quest = secret.quests[j];
        const savedQuest = savedQuests.find((q) => q[0] == j);
        if (savedQuest == undefined) {
            savedQuests.push([j, 0]);
            secretState.dirty = true;
            continue;
        };

        if (quest.display == undefined)
            continue;

        if (savedQuest[1] == 0 && quest.display?.(object)) {
            player.sendMessage("bob.toast;quests.secret");
            player.playSound("normal_quest");

            savedQuest[1] = 1; // Unlocked
            secretState.dirty = true;
        };

        if (savedQuest[1] !== 2 || !quest.unlock.check(object))
            continue;

        savedQuest[1] = 3; // Completed
        secretState.dirty = true;
        
        if (quest.unlock.title !== undefined)
            player.sendMessage(quest.unlock.title);
        if (quest.unlock.sound !== undefined)
            player.playSound(quest.unlock.sound);
        player.sendMessage([
            { text: "§a[!] " },
            { translate: "bob.message.questComplete" },
            { text: " §r§8- §r" },
            {
                translate: "bob.message.quests.completeQuest",
                with: [ quest.name ]
            },
        ]);

        if (j == secret.quests.length - 1 && secret.rewards !== undefined)
            giveRewards(player, secret.rewards);
    };

    if (shouldFlush)
        flushQuestLoopContext(player, context);
};

export function flushQuestLoopContext(player, context) {
    for (const [property, state] of context.tierStates.entries()) {
        if (!state.dirty)
            continue;

        player.setDynamicProperty(property, JSON.stringify(state.value));
        state.dirty = false;
    };

    if (context.secretState?.dirty) {
        player.setDynamicProperty(secret.property, JSON.stringify(context.secretState.value));
        context.secretState.dirty = false;
    };
};

function getTierState(player, context, property) {
    if (context.tierStates.has(property))
        return context.tierStates.get(property);

    const rawProperty = player.getDynamicProperty(property);
    if (!rawProperty)
        return undefined;

    const state = {
        value: JSON.parse(rawProperty),
        dirty: false,
    };
    context.tierStates.set(property, state);
    return state;
};

function getSecretState(player, context) {
    if (context.secretState)
        return context.secretState;

    context.secretState = {
        value: JSON.parse(player.getDynamicProperty(secret.property) || "[]"),
        dirty: false,
    };
    return context.secretState;
};

const ticks = (player) => {
    const inventory = player.getComponent("inventory").container;
    for (let slot = 0; slot < inventory.size; slot++) {
        const itemStack = inventory.getItem(slot);
        if (!itemStack)
            continue;

        loopQuests(player, itemStack);
        loopSecretQuests(player, itemStack);
        continue;

        /*if (
            item?.typeId == "better_on_bedrock:coconut"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eBreak open on stone"]);
            inventory.setItem(slot, item);
        };

        if (
            item?.typeId == "better_on_bedrock:fixed_ghost_necklace"
            && !item.getLore().length
        ) {
            item.setLore(["§r§cRequires souls in your offhand\nto work."]);
            inventory.setItem(slot, item);
        };
        if (
            item?.typeId == "better_on_bedrock:ghost_necklace_fragment"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eCombine 4 to make a Ghost Necklace"]);
            inventory.setItem(slot, item);
        };
        if (
            item?.typeId == "better_on_bedrock:stardust_nugget"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eSmelt in a furnace/blast furnace"]);
            inventory.setItem(slot, item);
        };
        if (
            item?.typeId == "better_on_bedrock:amethyst_helmet"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eFull set grants knockback to attacking mob"]);
            inventory.setItem(slot, item);
        };

        if (
            item?.typeId == "better_on_bedrock:amethyst_chestplate"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eFull set grants knockback to attacking mob"]);
            inventory.setItem(slot, item);
        };
        if (
            item?.typeId == "better_on_bedrock:amethyst_leggings"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eFull set grants knockback to attacking mob"]);
            inventory.setItem(slot, item);
        };
        if (
            item?.typeId == "better_on_bedrock:amethyst_boots"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eFull set grants knockback to attacking mob"]);
            inventory.setItem(slot, item);
        };


        if (
            item?.typeId == "better_on_bedrock:stardust_helmet"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eFull set grants health boost III"]);
            inventory.setItem(slot, item);
        };

        if (
            item?.typeId == "better_on_bedrock:stardust_chestplate"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eFull set grants health boost III"]);
            inventory.setItem(slot, item);
        };
        if (
            item?.typeId == "better_on_bedrock:stardust_leggings"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eFull set grants health boost III"]);
            inventory.setItem(slot, item);
        };
        if (
            item?.typeId == "better_on_bedrock:stardust_boots"
            && !item.getLore().length
        ) {
            item.setLore(["§r§eFull set grants health boost III"]);
            inventory.setItem(slot, item);
        };*/
    };
};

world.afterEvents.entityDie.subscribe(
    ({ deadEntity, damageSource: { damagingEntity } }) => {
        if (!(damagingEntity instanceof Player))
            return;

        loopQuests(damagingEntity, deadEntity);
    },
);
