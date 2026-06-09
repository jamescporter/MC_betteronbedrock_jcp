import { system } from "@minecraft/server";

import GuideBookCommand, { giveGuideBook } from "./guidebook.js";

const GUIDEBOOK_SCRIPT_EVENT = "better_on_bedrock:guidebook";

export function registerCustomCommands(registry) {
    if (!registry?.registerCommand) {
        console.warn(`[BOB] Custom command registry unavailable; use /scriptevent ${GUIDEBOOK_SCRIPT_EVENT} as a guide book fallback.`);
        return;
    }

    registry.registerCommand(new GuideBookCommand, GuideBookCommand.execute);
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
