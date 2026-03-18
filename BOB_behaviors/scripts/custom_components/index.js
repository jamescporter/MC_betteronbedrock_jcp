import { BlockComponentRegistry, ItemComponentRegistry } from "@minecraft/server";

// Items
import { events as compost } from "./pog/items/compostable.js";
import { events as foodEffects } from "./pog/items/food_effects.js";
import { events as ghostNecklace } from "./pog/items/ghost_necklace.js";
import { events as toolDurability } from "./pog/items/tool_durability.js";
import { events as waystoneKey } from "./pog/items/waystone_key.js";

/** @param { ItemComponentRegistry } registry */
function registerItemComponents(registry) {
    registry.registerCustomComponent("pog:compostable", compost);
    registry.registerCustomComponent("pog:food_effects", foodEffects);
    registry.registerCustomComponent("pog:ghost_necklace", ghostNecklace);
    registry.registerCustomComponent("pog:tool_durability", toolDurability);
    registry.registerCustomComponent("pog:waystone_key", waystoneKey);
};



// Blocks
import { events as turnToAir } from "./content/blocks/turn_to_air.js";
import { events as onInteract } from "./kai/blocks/on_interact.js";
import { events as onPlayerDestroy } from "./kai/blocks/on_player_destroy.js";
import { events as customDoor } from "./pog/blocks/custom_door.js";
import { events as trapdoor } from "./pog/blocks/trapdoor.js";
import { events as dummyChest } from "./pog/blocks/dummy_chest.js";
import { events_chair as eventChair } from "./pog/blocks/dummy_chest.js";
import { events as enchantUi } from "./pog/blocks/enchant_ui.js";
import { events as forger } from "./pog/blocks/forger.js";
import { events as int } from "./pog/blocks/int.js";
import { events as interactPlaceholder } from "./pog/blocks/interact_placeholder.js";
import { events as leaves } from "./pog/blocks/leaves.js";
import { events as placed } from "./pog/blocks/placed.js";
import { events as randomParticle } from "./pog/blocks/random_particle.js";
import { events as tick } from "./pog/blocks/tick.js";
import { events as openBlossom } from "./pog/blocks/open_blossom.js";
import { events as openPumpkin } from "./pog/blocks/open_pumpkin.js";
import { events as openSporeBlossom } from "./pog/blocks/open_spore_blossom.js";
import { events as resinLamp } from "./pog/blocks/resin_lamp.js";
import { events as ticking } from "./pog/blocks/ticking.js";
import { events as waystoneBehaviors } from "./pog/blocks/waystone_behaviors.js";
import { events as waystoneemitter } from "./pog/blocks/waystoneemitter.js";
import { events as coverOpaque } from "./pog/blocks/cover_opaque.js";

import SmallLogsComponent from "./pog/blocks/small_logs.js";

/** @param { BlockComponentRegistry } registry */
function registerBlockComponents(registry) {
    registry.registerCustomComponent("content:turn_to_air", turnToAir);
    registry.registerCustomComponent("kai:on_interact", onInteract);
    registry.registerCustomComponent("kai:on_player_destroy", onPlayerDestroy);
    registry.registerCustomComponent("pog:custom_door", customDoor);
    registry.registerCustomComponent("pog:trapdoor", trapdoor);
    registry.registerCustomComponent("pog:dummy_chest", dummyChest);
    //registry.registerCustomComponent("pog:spawn_entity", eventChair);
    registry.registerCustomComponent("pog:enchant_ui", enchantUi);
    registry.registerCustomComponent("pog:forger", forger);
    registry.registerCustomComponent("pog:int", int);
    registry.registerCustomComponent("pog:interact_placeholder", interactPlaceholder);
    registry.registerCustomComponent("pog:leaves", leaves);
    registry.registerCustomComponent("pog:placed", placed);
    registry.registerCustomComponent("pog:random_particle", randomParticle);
    registry.registerCustomComponent("pog:tick", tick);
    registry.registerCustomComponent("pog:ticking", ticking);
    registry.registerCustomComponent("pog:open_blossom", openBlossom);
    registry.registerCustomComponent("pog:open_sporeBlossom", openSporeBlossom);
    registry.registerCustomComponent("pog:open_pumkin", openPumpkin);
    registry.registerCustomComponent("pog:resin_lamp", resinLamp);
    registry.registerCustomComponent("pog:waystone_behaviors", waystoneBehaviors);
    registry.registerCustomComponent("pog:waystoneemitter", waystoneemitter);
    registry.registerCustomComponent("pog:cover_opaque", coverOpaque);
    
    registry.registerCustomComponent(SmallLogsComponent.componentId, new SmallLogsComponent);
};

export {
    registerItemComponents,
    registerBlockComponents,
};