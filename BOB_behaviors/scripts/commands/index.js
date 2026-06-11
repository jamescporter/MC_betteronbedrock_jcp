import { system } from "@minecraft/server";

import GuideBookCommand, { giveGuideBook } from "./guidebook.js";

const GUIDEBOOK_COMMAND_NAMES = ["guidebook", "better_on_bedrock:guidebook"];
const GUIDEBOOK_SCRIPT_EVENT = "better_on_bedrock:guidebook";

export function registerCustomCommands(registry) {
    if (!registry?.registerCommand) {
        console.warn(`[BOB] Custom command registry unavailable; use /scriptevent ${GUIDEBOOK_SCRIPT_EVENT} as a guide book fallback.`);
        return;
    }

    for (const commandName of GUIDEBOOK_COMMAND_NAMES) {
        try {
            registry.registerCommand(new GuideBookCommand(commandName), GuideBookCommand.execute);
        }
        catch (error) {
            console.warn(`[BOB] Could not register /${commandName}: ${error}`);
        }
    }
}

if (system.afterEvents?.scriptEventReceive?.subscribe) {
    system.afterEvents.scriptEventReceive.subscribe((data) => {
        if (data.id !== GUIDEBOOK_SCRIPT_EVENT)
            return;

        const player = data.sourceEntity;
        system.run(() => giveGuideBook(player));
    });
}
else {
    console.warn(`[BOB] Script event fallback unavailable for ${GUIDEBOOK_SCRIPT_EVENT}.`);
}
