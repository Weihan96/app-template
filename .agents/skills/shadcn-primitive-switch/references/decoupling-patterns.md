# Decoupling Patterns

Use this checklist when `audit-components-ui.mjs` reports `deep`.

## Wrapper-first extraction

1. Keep `components/ui/<primitive>.tsx` near registry source shape.
2. Create wrapper files in product space (for example `components/app/<domain>/<primitive>-wrapper.tsx`).
3. Move brand-specific class logic and niche props to wrapper.
4. Keep wrapper prop surface stable for existing call sites.

## Behavior extraction

1. Remove data fetching, telemetry, or business side effects from primitive files.
2. Move side effects into feature hooks/components.
3. Pass plain props into primitive layer.

## Compatibility phase

1. Keep old wrapper exports temporarily.
2. Internally map to new primitive implementation.
3. Replace call sites in batches.
4. Remove compatibility wrappers only after full rollout.
