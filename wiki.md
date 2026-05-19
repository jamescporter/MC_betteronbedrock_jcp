# Better on Bedrock Wiki

## Guide Book and `/guidebook` command

### What it is
The **Guide Book** is an in-game item (`better_on_bedrock:guide_book`) that introduces players to Better on Bedrock features and usage.

### What it does
- Places/spawns the guide-book entity experience when used (as defined by the add-on item/entity behaviour).
- Provides onboarding context so players can understand mechanics and progression expectations.
- Supports players who lose their original onboarding copy by allowing replacement via command.

### What it is for
The Guide Book is intended as the first-stop reference for:
- key gameplay systems in the add-on,
- progression hints,
- feature orientation for new players,
- a quick re-entry point when returning to an existing world.

### How to obtain it
You can obtain the Guide Book in multiple ways:
- **Starter onboarding**: players receive a copy on first movement/intro flow in survival gameplay.
- **Configuration/reward paths**: certain scripted flows can grant it.
- **Custom command**: use `/guidebook` (registered as `better_on_bedrock:guidebook`).

### `/guidebook` command details
- **Permission level**: `Any`
- **Cheats required**: `false`
- **Behaviour**: grants one `better_on_bedrock:guide_book` item to the executing player; if inventory is full, the remainder is dropped at the player location.

This makes the command survival-safe and suitable for restoring the book without enabling cheats.
