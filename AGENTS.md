# AGENTS.md — Contributor & Agent Guide

`@docouno/unica` is a role-based React 19+ design system — accessible components, layout primitives, semantic tokens, and multi-material themes in a pure-ESM TypeScript package (`isolatedDeclarations: true`).

The repository is managed with [`@docouno/devkit`](https://github.com/docouno/devkit) and contains the shared library (`packages/ui`) alongside an interactive Vite workbench (`apps/playground`).

## Environment & Commands

All toolchains run inside pinned Devkit containers on Linux x86_64 with Docker Engine, Docker Compose 5.0.0+, and GNU Make (see [`.devkit/runtime/GUIDE.md`](.devkit/runtime/GUIDE.md)). Never bypass containers with host Node toolchains, and never hand-edit managed files under `.devkit/`.

| Command | Purpose |
| --- | --- |
| `make setup` | Prepare accepted container images and workspace dependencies |
| `make check` | Run read-only formatting, lint, `isolatedDeclarations` typecheck, and gates |
| `make fix` | Apply deterministic formatting and lint autofixes |
| `make test` | Run unit and component test suites across registered components |
| `make build` | Build `packages/ui` and `apps/playground` |
| `make package` | Pack `@docouno/unica` and verify exports (`publint` + `attw`) |
| `make dev app=playground` | Start the Vite playground server for interactive inspection |
| `npx @docouno/devkit sync` | Synchronize workspace wiring after manifest or registration changes |

Scope commands during iteration with `package=ui` or `app=playground` (for example `make check package=ui` or `make test package=ui`). Checks and builds keep source, configuration, and lockfiles read-only. To modify dependencies with the accepted toolchain:

```sh
npx @docouno/devkit exec --component packages/ui --write --network bridge -- npm install <pkg>
make setup
make check
```

## Repository Structure

```text
unica/
├── packages/ui/       @docouno/unica source, CSS tokens, themes, and ESM exports
├── apps/playground/   Vite interactive workbench: family review views and live compositions across all 6 presets
├── designs/           pen.dev upfront visual prototypes (unica.lib.pen, assets, theme compositions & specimens)
└── docs/              core concepts (docs/concepts/) and component contracts (docs/components/)
```

Read [`docs/README.md`](docs/README.md) and [`designs/README.md`](designs/README.md) before modifying public props, tokens, or `.pen` files.

## Architectural Invariants

### 1. Role-based API, zero decorative `appearance` prop

Material physics belong to the active theme (`Soft`, `Frost`, `Pixel` in `Dark` and `Light`), never to per-component decorative switches such as `solid`, `soft`, `glass`, `lamp`, or `outline`:

- **Zero material variants (`0`):** status markers (`Badge`, `Tag`, `Chip`, `Indicator`), overlays (`Modal`, `Drawer`, `Popover`, `Tooltip`, `HoverCard`, `Menu`, `Toast`), choice cards (`CheckboxCard`, `RadioCard`, `SwitchCard`), and binary/range controls (`Checkbox`, `Radio`, `Switch`, `Slider`, `RangeSlider`, `SegmentedControl`, `Progress`).
- **Field & picker context:** `variant="default" | "ghost"` on inputs and pickers (`Input`, `Textarea`, `NumberInput`, `Select`, `Combobox`, `Autocomplete`, `DatePicker`, `DateRangePicker`, `TagsInput`, `FileInput`), plus automatic `[data-surface="overlay"]` adaptation inside floating surfaces (including `*Card` choices).
- **Card hierarchy:** `variant="default" | "subtle"` on `Card` (`CheckboxCard`, `RadioCard`, and `SwitchCard` expose zero decorative variants).
- **Button roles & tones:** `variant="primary" | "secondary" | "ghost"` crossed with `tone="accent" | "neutral" | "danger"`. Status hues (`info`, `success`, `warning`, `danger`) belong exclusively to passive markers and validation feedback.

```tsx
import type { JSX, Ref } from 'react';
import { Button, Card, Input } from '@docouno/unica';

export function InviteForm({ inputRef }: { inputRef?: Ref<HTMLInputElement> }): JSX.Element {
  return (
    <Card variant="default">
      <Input ref={inputRef} name="email" type="email" variant="default" required />
      <Button type="submit" variant="primary" tone="accent">Send invite</Button>
    </Card>
  );
}
```

### 2. React 19 native platform model

- Accept `ref` directly as a regular prop on every component; never wrap components in `React.forwardRef`.
- Annotate exported functions, props, and hooks explicitly so `isolatedDeclarations: true` emits deterministic `.d.ts` files without full-program inference.
- Render modal surfaces (`Modal`, `Drawer`) on native `<dialog>` via `showModal()` and non-modal anchored overlays/toasts on the native Popover API (`popover="auto" | "manual"`), avoiding `z-index` escalation wars.
- Guarantee native `<form>` participation: `FormData` submission, native `<form>` `reset` restoration, `disabled` / `readOnly` / `loading` invariants, and strict controlled vs uncontrolled authority.

### 3. Visual prototyping (`.pen`) vs canonical code (`packages/ui` & `apps/playground`)

- `.pen` files under `designs/` serve as upfront visual prototypes when introducing new component families, new compositions, or major visual explorations before writing code.
- Once a component ships in `packages/ui`, **the code, `apps/playground` (per-family review views and live React application compositions), and `docs/components/<family>.md` are the canonical source of truth**. Native browser optics (optical CTA glow, multi-layer CSS shadows, live `backdrop-filter`, subpixel borders, and motion) take precedence over static `.pen` approximations — do not back-port routine code polish into `.pen` files.
- When editing `.pen` prototypes, use `pen interactive` or desktop `pen.dev` exclusively (never raw JSON text edits) and bind visual properties to semantic tokens in [`designs/unica.lib.pen`](designs/unica.lib.pen) with zero raw `#hex` overrides.

## Definition of Done

Every change must satisfy all of the following before completion:

1. `make check`, `make test`, `make build`, and `make package` (`isolatedDeclarations`, `publint`, and `@arethetypeswrong/core` pure-ESM verification) pass cleanly with zero warnings.
2. Keyboard navigation, focus return, top-layer dismissal, native `<form>` submission/reset, `forced-colors`, and `prefers-reduced-motion` comply with [Overlays and Forms](docs/concepts/overlays-and-forms.md) and [Support and Accessibility](docs/concepts/support-and-accessibility.md).
3. Visual rendering and interactive states are verified in `apps/playground` across all 3 themes × Dark/Light (`soft-dark`, `soft-light`, `frost-dark`, `frost-light`, `pixel-dark`, `pixel-light`).
4. Public documentation (`README.md`, `AGENTS.md`, `docs/concepts/*`, `docs/components/*`) is updated in the same change whenever public APIs, tokens, or workflows evolve.
