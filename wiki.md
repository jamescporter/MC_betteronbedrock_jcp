# Better on Bedrock Wiki

This wiki is a lightweight reference for the JCP-maintained Better on Bedrock fork. For release history and detailed compatibility notes, see `RELEASE_NOTES.md`. For unfinished or development-only areas, see `DEVELOPMENT_INDEX.md`.

## Installation and pack enabling

Better on Bedrock needs both packs enabled in the same world:

- `BOB_behaviors/` — behaviour pack folder
- `BOB_resources/` — resource pack folder

From the current manifests, the add-on version is `1.2.1-0.9` and the minimum Bedrock engine version is `1.21.120`.

Manual setup summary:

1. Copy `BOB_behaviors` into the Minecraft Bedrock behaviour packs folder.
2. Copy `BOB_resources` into the Minecraft Bedrock resource packs folder.
3. Enable **Better on Bedrock - Behavior Pack** and **Better on Bedrock - Resource Pack** in the target world.
4. Enter the world and verify that custom items/entities load as expected.

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

## Commands

| Command | Purpose | Permission | Cheats required | Result |
| --- | --- | --- | --- | --- |
| `/guidebook` | Restore or obtain the Guide Book | `Any` | `false` | Gives one `better_on_bedrock:guide_book` to the executing player, dropping overflow at the player location if needed. |

## Bosses and encounters

### Seeker boss

`better_on_bedrock:seeker` is reserved for the Seeker boss encounter. The old duplicate End-mob Seeker has been separated as the disabled `better_on_bedrock:end_seeker` placeholder so it cannot override the boss definition.

Useful related areas:

- boss behaviour: `BOB_behaviors/entities/bosses/seeker/`
- client resource: `BOB_resources/entity/boss/seeker.entity.json`
- arena/worldgen references: `BOB_behaviors/worldgen/`, `BOB_behaviors/features/`, and `BOB_behaviors/structures/` paths containing `seeker`

### Geomancer

`better_on_bedrock:geomancer` remains the real misc Geomancer client entity. The old boss-side duplicate has been isolated as `better_on_bedrock:geomancer_boss_placeholder` until a full boss encounter is designed.

See `DEVELOPMENT_INDEX.md` before changing Geomancer boss files so the placeholder does not become a second conflicting Geomancer identifier again.

## Known limitations

- The fork is still under active review and should be treated as currently untested unless a specific build has been smoke-tested.
- Backpacks are known to have a duplication-related bug and need a focused investigation.
- `better_on_bedrock:end_seeker` is a disabled placeholder, not a finished End mob.
- `better_on_bedrock:geomancer_boss_placeholder` is a development placeholder, not a complete boss encounter.
- The full Scripting V2 migration remains deferred and should not be mixed into unrelated changes.

## Compatibility notes

The current branch keeps the existing `@minecraft/server` dependency while using compatibility work to preserve custom component registration on newer Bedrock builds. See `RELEASE_NOTES.md` for the full Bedrock `1.26.21.1` compatibility notes.

## Development status

Use `DEVELOPMENT_INDEX.md` to track partially made, disabled, deferred, or review-only areas before adding new work. This helps keep unfinished features visible without letting placeholders conflict with real gameplay identifiers.
