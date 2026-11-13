# Unica Documentation

Normative architecture and engineering specifications for `@docouno/unica`. Read these core concept guides before designing, implementing, or reviewing components.

## Core Concepts

| Document | Scope |
| --- | --- |
| [Themes and Roles](concepts/themes-and-roles.md) | Flat CSS tokens and `ThemePreset` metadata, the three reference themes (`Soft`, `Frost`, `Pixel` in `Dark`/`Light`), role-based component props vs decorative `appearance` props, and strict semantic color rules. |
| [Geometry and Layout](concepts/geometry-and-layout.md) | Parametric `Control` vs `Surface` radius scales, `--radius-factor`, concentric inner-radius math ($R_{\text{inner}}$), `0px` degeneration in `Pixel` (preserving circular `Radio`), monotonic Z-elevation (`AppRail < Aside < Main Canvas < Card`), and unified `s / m / l` sizing. |
| [Overlays and Forms](concepts/overlays-and-forms.md) | Native browser top layer (`popover="auto" | "manual"`, `<dialog>` `showModal()`, toast host above active modals, positioning adapter) and native `<form>` participation (`FormData`, `reset`, `disabled`/`readOnly`/`loading`, controlled vs uncontrolled authority). |
| [Support and Accessibility](concepts/support-and-accessibility.md) | Two-tier browser support floor (`Guarantee` vs `Baseline`), React 19+ pure-ESM contract, WCAG contrast invariants, keyboard navigation, `forced-colors`, and `prefers-reduced-motion`. |

## Workbench & Component Contracts

- **Interactive workbench & compositions:** `apps/playground` hosts the 6-preset design workbench (`src/prototypes/` specimens and `src/scenes/` product compositions, starting with [Folio](compositions/folio.md)).
- **Prototype authoring:** [Workbench workflow](workbench.md) explains registration, sections, live previews, and deterministic screenshots.
- **Component contracts:** As each component family ships in `packages/ui`, its normative public API, keyboard/ARIA behavior, and token contract are recorded in `docs/components/<family>.md`.
- **Contributor workflow:** [`../AGENTS.md`](../AGENTS.md) defines workspace commands, Devkit rules, and Definition of Done gates.
