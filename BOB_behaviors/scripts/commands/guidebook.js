import {
    system,
    Player,
    ItemStack,
    EntityInventoryComponent,
} from "@minecraft/server";

const COMMAND_PERMISSION_ANY = 0;
const CUSTOM_COMMAND_SUCCESS = 0;
const CUSTOM_COMMAND_FAILURE = 1;

export function giveGuideBook(player) {
    if (!player?.isValid())
        return false;

    const inventory = player.getComponent(EntityInventoryComponent.componentId)?.container;
    if (!inventory)
        return false;

    const itemStack = new ItemStack("better_on_bedrock:guide_book", 1);
    const overflow = inventory.addItem(itemStack);
    if (overflow)
        player.dimension.spawnItem(overflow, player.location);

    return true;
}

export default class GuideBookCommand {
    name = "better_on_bedrock:guidebook";
    description = "command.better_on_bedrock.common.guidebook.description";
    permissionLevel = COMMAND_PERMISSION_ANY;
    cheatsRequired = false;

    static execute(origin) {
        if (!(origin.sourceEntity instanceof Player)) {
            return {
                status: CUSTOM_COMMAND_FAILURE,
                message: "commands.generic.noTargetMatch",
            };
        }

        system.run(() => giveGuideBook(origin.sourceEntity));

        return { status: CUSTOM_COMMAND_SUCCESS };
    }
}
