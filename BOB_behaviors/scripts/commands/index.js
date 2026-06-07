import GuideBookCommand from "./guidebook.js";

export function registerCustomCommands(registry) {
    if (!registry?.registerCommand)
        return;

    registry.registerCommand(new GuideBookCommand, GuideBookCommand.execute);
}