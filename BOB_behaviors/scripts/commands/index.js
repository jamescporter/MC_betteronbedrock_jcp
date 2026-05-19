import { CustomCommandRegistry } from "@minecraft/server";
import GuideBookCommand from "./guidebook.js";

/** @param { CustomCommandRegistry } registry */
export function registerCustomCommands(registry) {
    registry.registerCommand(new GuideBookCommand, GuideBookCommand.execute);
};