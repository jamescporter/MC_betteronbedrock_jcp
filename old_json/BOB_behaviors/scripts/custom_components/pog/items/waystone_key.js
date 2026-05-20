import { waystoneMenu } from "../blocks/waystone_behaviors.js";

/** @type { import("@minecraft/server").ItemCustomComponent } */
export const events = {
    onUse: ({ source }) => waystoneMenu(source),
};