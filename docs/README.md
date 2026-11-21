# Unica Documentation

Normative architecture and engineering specifications for `@docouno/unica`. Read these core concept guides before designing, implementing, or reviewing components.

During design, use these constraints to define appearance and the intended accessible experience. The [Workbench workflow](workbench.md#design-outcome-and-prototype-behavior) separates that design result from the complete library API and interaction mechanisms implemented in the next stage. Native behavior may support the preview without making it a production component.

## Core Concepts

| Document | Scope |
| --- | --- |
| [Themes and Roles](concepts/themes-and-roles.md) | Flat CSS tokens and `ThemePreset` metadata, the three reference themes (`Soft`, `Frost`, `Pixel` in `Dark`/`Light`), role-based component props vs decorative `appearance` props, and strict semantic color rules. |
| [Geometry and Layout](concepts/geometry-and-layout.md) | Parametric `Control` vs `Surface` radius scales, `--radius-factor`, concentric inner-radius math ($R_{\text{inner}}$), `0px` degeneration in `Pixel` (preserving circular `Radio`), monotonic Z-elevation (`AppRail < Aside < Main Canvas < Card`), and unified `s / m / l` sizing. |
| [Native Scrollbars](concepts/scrollbars.md) | Shipped native scrollbar utilities for ordinary surfaces and overlays, including system fallbacks. |
| [Overlays and Forms](concepts/overlays-and-forms.md) | Native browser top layer (`popover="auto" | "manual"`, `<dialog>` `showModal()`, toast host above active modals, positioning adapter) and native `<form>` participation (`FormData`, `reset`, `disabled`/`readOnly`/`loading`, controlled vs uncontrolled authority). |
| [Support and Accessibility](concepts/support-and-accessibility.md) | Two-tier browser support floor (`Guarantee` vs `Baseline`), React 19 pure-ESM contract, WCAG contrast invariants, keyboard navigation, `forced-colors`, and `prefers-reduced-motion`. |

## Workbench & Component Contracts

- **Interactive workbench & compositions:** `apps/playground` hosts the component inspector. Catalog entries live in `src/specimens/`. Visual prototypes live in `src/prototypes/` and compositions such as [Folio](compositions/folio.md) in `src/scenes/`.
- **Specimen authoring:** [Workbench workflow](workbench.md) explains the component schema, live inspection, scene links, and deterministic screenshots.
- **Browser contracts:** [Browser tests](browser-tests.md) explains offline Chromium runs and how to add scenarios for native browser behavior.
- **Component contracts:** [Blockquote](components/blockquote.md) and [Code](components/code.md) cover quotations and inline literals. [Divider](components/divider.md) covers static boundaries and connecting phrases. [Icon](components/icon.md) covers SVG sources, adapters, sizing, and accessibility. [Kbd and KbdGroup](components/kbd.md) cover keyboard hints and accessible chord notation. [Portal](components/portal.md) covers host resolution, SSR, and hydration. [Spinner](components/spinner.md) covers local activity and reveal timing. [Progress and ProgressCircle](components/progress.md) cover measurement, waiting phases, and accessible labels.
- **Contributor workflow:** [`../AGENTS.md`](../AGENTS.md) defines workspace commands, Devkit rules, and Definition of Done gates.
