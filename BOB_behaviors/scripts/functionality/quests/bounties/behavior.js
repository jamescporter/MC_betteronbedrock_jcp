import { world, Player, EntityMarkVariantComponent } from "@minecraft/server";
import { bounties, defaultBounties } from "./bounties.js";
import { readJsonProperty } from "../util.js";

world.afterEvents.entityDie.subscribe(
    ({ deadEntity, damageSource: { damagingEntity } }) => {
        if (!(damagingEntity instanceof Player))
            return;

        if (
            deadEntity.typeId == "minecraft:enderman"
            && deadEntity.getComponent(EntityMarkVariantComponent.componentId)?.value == 1
        )
            return;
        
        const bountyEntity = bounties.find((bounty) =>
            bounty.entity == deadEntity.typeId
            || bounty.entities?.includes(deadEntity.typeId)
        );
        
        if (bountyEntity !== undefined) {
            const savedBountiesState = readJsonProperty(damagingEntity, "bounties", defaultBounties);
            if (savedBountiesState.wasCorrupt)
                return;

            const savedBounties = savedBountiesState.value;
            const savedBounty = savedBounties.find((q) => q[0] == bountyEntity.id);
            if (!savedBounty)
                return;
            
            if (savedBounty[2] == 1) {
                savedBounty[1]++;
                let amount = bountyEntity.amount;
                if (savedBounty[1] >= amount) {
                    damagingEntity.playSound("bob.bounty.complete", damagingEntity.location);
                    damagingEntity.sendMessage([
                        { text: "§a[!] §r" },
                        { translate: "bob.message.bounty.complete" },
                    ]);
                    damagingEntity.sendMessage("bob.toast;bounty.complete");

                    savedBounty[1] = 0; // Set progress to 0
                    savedBounty[2] = 2; // Completed
                    const nextBounty = bounties.find((bounty) => bounty.id == bountyEntity.id + 1);
                    const nextSavedBounty = nextBounty !== undefined
                        ? savedBounties.find((q) => q[0] == nextBounty.id)
                        : undefined;
                    if (nextSavedBounty !== undefined) {
                        nextSavedBounty[2] = 0; // Open
                    }
                    else {
                        damagingEntity.sendMessage([
                            { text: "§a[!] §r" },
                            { translate: "bob.message.bounty.completedAll" },
                        ]);
                    };
                };

                damagingEntity.setDynamicProperty("bounties", JSON.stringify(savedBounties));
            };
        };
    },
);