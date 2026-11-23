# Component Anatomy and Conformance

`@docouno/unica` follows a uniform internal structure so every shipped family shares predictable entry points, strict TypeScript 6 `isolatedDeclarations` compatibility, deterministic CSS scoping, and automated conformance checks.

## Canonical Family Layout

Every library family lives under `packages/ui/src/components/<Family>/`:

| File | Required | Responsibility |
| --- | --- | --- |
| `index.ts` | Yes | Pure barrel (`export` / `export type`). Contains zero logic and zero CSS imports. `packages/ui/src/index.ts` imports every family strictly through `./components/<Family>/index.js`. |
| `<Name>.tsx` | Yes | Named `export function <Name>(...): ReactElement` (or `JSX.Element`) with a concise JSDoc summary. Imports the colocated family stylesheet directly. |
| `<family>.css` | Yes | Kebab-case stylesheet wrapped 100% inside `@layer unica.components`. |
| `types.ts` | When exporting types | Type-only module (`export type` / `export interface`, zero runtime values). Derives unions from `consts.ts` (or re-exports defaultable axes such as `IconSize` and `LinkSize` from `../../core/defaults.js`). |
| `consts.ts` | When curated axes exist | Leaf module importing only `../../consts.js` and `../../types.js` (zero React, DOM, or CSS imports). Uses literal `as const` objects without spreads. Never create an empty `consts.ts`. |

Optional family-internal files (`context.ts`, sub-components, or helpers) stay colocated in the same folder.

### Named Functions Instead of `displayName`

Never assign `<Name>.displayName = '<Name>'` on an exported component function. Under TypeScript 6 with `isolatedDeclarations: true`, mutating properties on an exported function triggers **`TS9023`**. Named `export function` declarations preserve their `.name` in React DevTools automatically.

## Master Axis Vocabularies (`src/consts.ts`)

`packages/ui/src/consts.ts` defines the **10 shared axes** used across multiple shipped families or package-wide layout contracts:

- **Shared component axes (8):** `SIZE`, `STATUS`, `MARK_STATUS`, `TEXT_COLOR`, `TYPOGRAPHY_STEP`, `TYPOGRAPHY_WEIGHT`, `TEXT_ALIGN`, `ORIENTATION` (Card, Divider, and Slider).
- **Package layout scales (2):** numeric `SPACING` (`[0, 2, 4, 8, 12, 16, 24, 32, 48, 64] as const` → `Spacing`) and `BREAKPOINT` (`mobile | tablet | desktop | wide`).

Single-family axes (`WIDTH` in `Indicator`, overlay placement axes in `core/overlay/positioning.ts`) stay local until a second shipped family consumes them.

String subsets are constrained against the master dictionaries using `ExactAxisSubset` from `packages/ui/src/types.ts`:

```ts
// packages/ui/src/components/Badge/consts.ts
export const BADGE_STATUS = {
  neutral: 'neutral',
  accent: 'accent',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
} as const;

// packages/ui/src/components/Badge/types.ts
export type BadgeStatus =
  ExactAxisSubset<typeof MARK_STATUS, typeof BADGE_STATUS>[keyof typeof BADGE_STATUS];
```

Runtime dictionaries in `consts.ts` remain internal. The public `react-server` entry (`src/server.ts`) exports strictly `THEME_PRESETS`, `defineGlyph`, `getUnicaRootProps`, and a 1:1 mirror of every exported TypeScript type in `src/index.ts`.

### `exactOptionalPropertyTypes` & `readonly`

Own optional input props on public `*Props` interfaces and type aliases use `readonly` and explicitly include `| undefined` so consumers compiling with `exactOptionalPropertyTypes: true` can forward optional values cleanly. Contravariant output contracts passed to third-party renderers — specifically `GlyphSvgProps` — intentionally omit `| undefined` so external SVG icon libraries remain assignable.

## DOM Attributes, Classes, Styles & Runtime Helpers

- **Owned `data-unica-*` attributes:** Component state attributes use `data-unica-<family>-<attr>` (plus shared `data-unica-mark-*`, `data-unica-type-*`, `data-unica-activity-*` and the five protocol attributes `data-theme`, `data-surface`, `data-text-scale`, `data-side`, `data-align`). Consumer `data-*` props forwarded through spread are never restricted.
- **Boolean flags (`dataFlag`):** Owned boolean attributes serialize strictly as `'' | undefined` via `dataFlag(condition)` from `core/cx.ts` — never `'true'`, `'false'`, `true`, or `false`.
- **Single-hyphen classes:** Component classes use `.unica-<family>` and `.unica-<family>-<part>` without BEM `__` or `--` modifiers. Documented shared utilities such as [Overlay Surface](concepts/themes-and-roles.md#overlay-surface-utility) and [Scrollbar](components/scrollbar.md) can be applied by consumers.
- **Private CSS variables:** Component-internal custom properties use the `--_*` prefix (for example `--_type-*`, `--_icon-frame`, `--_badge-*`, `--_progress-*`, `--_box-*`).
- **Core primitives:**
  - `core/cx.ts` — class joining (`cx`) and boolean attribute flags (`dataFlag`).
  - `core/mergeStyle.ts` — style merging with `defaults < consumer < owned` precedence.
  - `core/devWarning.ts` — deduplicated development-only `warnOnce(key, message)` for real contract defects (plus an internal, non-exported `resetDevWarnings()` for test isolation).
  - `core/passiveRoot.ts` — tag-parameterized passive attribute filtering (`Code`, `Blockquote`, `Progress`, `Divider`, `Skeleton`), preserving `contentEditable="inherit"` as an omitted attribute.
  - `core/useIsoLayoutEffect.ts` — isomorphic layout effect wrapper; raw `useLayoutEffect` is forbidden everywhere else in `packages/ui/src/`.

## Automated Conformance Gate

`packages/ui/test/conformance.test.ts` mechanically enforces these invariants using the TypeScript 6 compiler API, PostCSS, and Lightning CSS:

1. **Exports & `react-server` parity:** 1:1 exported types between `index.ts` and `server.ts`, exact `server.ts` runtime export list (`THEME_PRESETS`, `defineGlyph`, `getUnicaRootProps`), family barrel-only imports in `index.ts`, and explicit named exports for every axis in `UnicaComponentDefaults`.
2. **Anatomy v2 & type hygiene:** required family files, zero `.displayName =` assignments, JSDoc on exported components, `readonly` + `| undefined` on own optional input props, and positive/negative consumer compilation checks.
3. **Runtime & attribute hygiene:** zero raw `useLayoutEffect` outside `core/useIsoLayoutEffect.ts`, prefixed `data-unica-*` attributes, and `'' | undefined` boolean flag typing.
4. **CSS contract gate:** 100% `@layer unica.components` scoping across `src/{components,internal}/**/*.css`, zero `[data-theme]` or bare global selectors, zero raw color literals outside `forced-colors`, zero `!important` outside the documented `Skeleton` `[hidden]:not([hidden='until-found' i])` rule, `unica-` prefixes on `@keyframes` and `@container`, single-hyphen component classes, and complete `var(--*)` resolution against `styles.css`, colocated `--_*` declarations/injections, and the documented [integration hooks](concepts/themes-and-roles.md#token-tiers--custom-brand-theme-contract).

`apps/playground/src/unica.contract.test.tsx` complements this gate by blocking internal `.unica-*` classes, raw `#hex`, `[data-theme]`, and private component `--_*` variables across playground prototypes, specimens, and scenes (and blocking all `var(--_*)` reads in `scenes/`).
