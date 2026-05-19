import {
    system,
    Player,
    ItemStack,

    EntityInventoryComponent,
    CommandPermissionLevel,
    CustomCommandStatus,
} from "@minecraft/server";

export default class GuideBookCommand {
    name = "better_on_bedrock:guidebook";
    description = `command.better_on_bedrock.common.guidebook.description`;
    permissionLevel = CommandPermissionLevel.Any;
	cheatsRequired = false;

    static execute(origin) {
        if (!(origin.sourceEntity instanceof Player)) {
            return {
                status: CustomCommandStatus.Failure,
                message: "commands.generic.noTargetMatch",
            };
        };

        system.run(() => {
            if (!origin.sourceEntity.isValid)
                return;

            const inventory = origin.sourceEntity.getComponent(EntityInventoryComponent.componentId);
        
            const itemStack = new ItemStack("better_on_bedrock:guide_book");
            itemStack.amount = 1;

            const newItemStack = inventory.container.addItem(itemStack);
            if (newItemStack !== void 0) {
                origin.sourceEntity.dimension.spawnItem(newItemStack, origin.sourceEntity.location);
            };
        });
        
        return { status: CustomCommandStatus.Success };
    };
};