# Design Prototypes (`pen.dev`)

Unica stores its upfront visual prototypes in this directory alongside the codebase. [`pen.dev`](https://www.pen.dev) is an internal authoring tool used when introducing new component families, exploring new application compositions, or prototyping major visual changes prior to code; applications consuming `@docouno/unica` never depend on `pen.dev` or `.pen` files.

Once a component is implemented in `packages/ui`, **the shipped React/CSS implementation, live `apps/playground` (per-family review views and live React application compositions), and `docs/components/<family>.md` are the canonical source of truth**. Native browser rendering — optical CTA glow, multi-layer CSS shadows, live `backdrop-filter`, subpixel borders, and motion — takes precedence over static `.pen` canvas approximations, and routine code refinements are not back-ported into `.pen` files.

## Source layout

```text
designs/
├── unica.lib.pen         shared tokens (all 6 presets) and reusable component masters
├── assets/               shaders (.glsl), scripts (.js), textures, illustrations, and licenses
├── compositions/         shared application composition notes (<scene>.md)
└── themes/               lightweight per-theme .pen canvases (Dark + Light per file)
    ├── soft/
    │   ├── compositions/ (<scene>.pen, starting with workspace-app.pen)
    │   └── components/   (<family>.pen prototypes added for new families)
    ├── frost/
    │   ├── compositions/ (<scene>.pen, starting with workspace-app.pen)
    │   └── components/   (<family>.pen prototypes added for new families)
    └── pixel/
        ├── compositions/ (<scene>.pen, starting with workspace-app.pen)
        └── components/   (<family>.pen prototypes added for new families)
```

Because `pen.dev` resolves `$variable` bindings lexically inside the document that owns each `reusable: true` component master (without cross-file CSS cascade), [`unica.lib.pen`](unica.lib.pen) keeps component masters and `unicaTheme` variable columns together in one library file, whereas `packages/ui` implements layered base tokens plus independent per-theme CSS overrides in code.

## Application compositions

Compositions under `designs/themes/{soft,frost,pixel}/compositions/<scene>.pen` form an open set of end-to-end product scenes. **Folio** (`workspace-app.pen`) is the initial baseline composition — sixty product frames (`10` scenes spanning authentication, workspace overview, collection filtering, editorial reading, rich editing, property drawers, member modals, extension catalogs, numeric preferences, and archive imports across `Dark` and `Light` in all `3` themes, `20` frames per file) — and additional `<scene>.pen` compositions can be added alongside it as new component patterns and scenarios are introduced:

| Composition | Per-theme canvases (`20` frames each) & overview | Scope |
| --- | --- | --- |
| **Folio** · 60 frames (`10 scenes × Dark & Light × 3 themes`) | [Soft](themes/soft/compositions/workspace-app.pen) · [Frost](themes/frost/compositions/workspace-app.pen) · [Pixel](themes/pixel/compositions/workspace-app.pen) · [Overview](compositions/workspace-app.md) | Evaluates theme-owned surface physics, warm editorial matte (`Soft`), tactile hardware keycaps and frosted glass (`Frost`), sharp `0px` technical geometry (`Pixel`), composable `AppShell` topologies, contextual `base` vs `overlay` controls, and dark/light polarity from a single AST. |

Every canvas imports [`unica.lib.pen`](unica.lib.pen) and switches material physics, corner radii, typography, and polarity strictly through `unicaTheme` (`soft-dark`, `soft-light`, `frost-dark`, `frost-light`, `pixel-dark`, `pixel-light`) and `surfaceContext` (`base`, `overlay`), with zero per-theme layout forks and zero raw `#hex` overrides. As components ship in `packages/ui`, live interactive application compositions are assembled directly in `apps/playground`.

## Component specimen lifecycle

- Keep one reusable master origin in [`unica.lib.pen`](unica.lib.pen). Importing compositions and specimens use connected instances (`ref`) rather than detached copies.
- When prototyping a new visual component family before implementation, author its per-theme visual canvases at `designs/themes/{soft,frost,pixel}/components/<family>.pen` (`Dark + Light` per file) and check its scale and rhythm inside the relevant `<scene>.pen` composition.
- Normative public component documentation lives exclusively at `docs/components/<family>.md` alongside the shipped code (do not create duplicate Markdown handoffs inside `designs/`).
- Static `.pen` frames validate initial layout proportions, hierarchy, and semantic token roles; native browser optics, keyboard behavior, top-layer stacking, form participation, and accessibility are implemented and verified in code against [Overlays and Forms](../docs/concepts/overlays-and-forms.md) and [Support and Accessibility](../docs/concepts/support-and-accessibility.md).

## Authoring discipline

- Edit `.pen` documents exclusively through `pen.dev` or `pen interactive` (`SetVariables`, `Update`, `Insert`, `Replace`, `save()`) — never via raw JSON text editing.
- Bind fills, strokes, radii, typography, and spacing to semantic tokens in [`unica.lib.pen`](unica.lib.pen) aligned with [Themes and Roles](../docs/concepts/themes-and-roles.md) and [Geometry and Layout](../docs/concepts/geometry-and-layout.md). Raw `#hex` literals belong only inside token definitions in `unica.lib.pen`.
- Keep relative asset paths (`assets/*.glsl`, `assets/*.js`, `assets/licenses/*`) intact so canvases open and render cleanly from any checkout.
- Keep temporary renders, layout probes, and working measurements outside `designs/` (never commit `.json` sidecars, PNG dumps, or file digests into `designs/`).
