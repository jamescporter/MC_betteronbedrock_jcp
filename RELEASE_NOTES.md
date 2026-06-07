# Release notes

## Sound reference fixes (2026-06-07)

- Corrected missing custom sound references for the enchanter, flender, quiet ambient hook, and withered samurai definitions.
- Fixed a `sound/entity/...` typo so the samurai idle definition now points at the existing `sounds/entity/...` asset path.

## Behaviour JSON revert (2026-05-20)

- Reverted `BOB_behaviors` JSON content to match `old_json/BOB_behaviors`.
- `BOB_resources` was intentionally left unchanged.
- Outcome: behaviour JSON is now in the requested state.
