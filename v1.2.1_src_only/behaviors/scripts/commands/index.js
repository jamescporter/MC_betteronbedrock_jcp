import { CustomCommandRegistry } from "@minecraft/server";
import GuideBookCommand from "./guidebook";

/** @param { CustomCommandRegistry } registry */
export function registerCustomCommands(registry) {
    registry.registerCommand(new GuideBookCommand, GuideBookCommand.execute);
};