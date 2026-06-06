import { EntityEquippableComponent, EquipmentSlot, TicksPerSecond } from "@minecraft/server";

function consumeEquippedTotem(equipment, slot) {
    const stack = equipment.getEquipment(slot);
    if (stack?.typeId !== "better_on_bedrock:void_totem")
        return false;

    if (stack.amount > 1) {
        stack.amount--;
        equipment.setEquipment(slot, stack);
    }
    else {
        equipment.setEquipment(slot, undefined);
    }

    return true;
};

/** @param { import("@minecraft/server").Player } player */
export function voidTotem(player) {
    if (!player?.isValid())
        return;
    
    if (player.location.y > 4 || player.dimension.id !== "minecraft:the_end")
        return;

    const equipment = player.getComponent(EntityEquippableComponent.componentId);
    if (!equipment)
        return;

    const mainhand = equipment.getEquipment(EquipmentSlot.Mainhand);
    const offhand = equipment.getEquipment(EquipmentSlot.Offhand);
    const totemSlot = mainhand?.typeId === "better_on_bedrock:void_totem"
        ? EquipmentSlot.Mainhand
        : offhand?.typeId === "better_on_bedrock:void_totem"
            ? EquipmentSlot.Offhand
            : undefined;
    if (totemSlot === undefined)
        return;

    player.applyKnockback(0, 0, 0, 7.3);
    player.addEffect("slow_falling", TicksPerSecond * 50);
    player.addEffect("nausea", TicksPerSecond * 9);
    player.addEffect("blindness", TicksPerSecond * 4);
    player.dimension.playSound("random.totem", player.location);
    player.dimension.spawnParticle("minecraft:totem_particle", player.location);
    consumeEquippedTotem(equipment, totemSlot);
};
