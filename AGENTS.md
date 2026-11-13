# AGENTS.md — Contributor & Agent Guide

`@docouno/unica` is a role-based React 19+ design system — accessible components, layout primitives, semantic tokens, and multi-material themes in a pure-ESM TypeScript package (`isolatedDeclarations: true`).

The repository is managed with [`@docouno/devkit`](https://github.com/docouno/devkit) and contains the shared library (`packages/ui`) alongside a 6-preset interactive Vite workbench (`apps/playground`).

## Environment & Commands

All toolchains run inside pinned Devkit containers on Linux x86_64 with Docker Engine, Docker Compose 5.0.0+, and GNU Make (see [`.devkit/runtime/GUIDE.md`](.devkit/runtime/GUIDE.md)). Never bypass containers with host Node toolchains, and never hand-edit managed files under `.devkit/`.

| Command | Purpose |
| --- | --- |
| `make setup` | Prepare accepted container images and workspace dependencies |
| `make sync [reconcile=1] [preview=1]` | Synchronize workspace manifests and optionally reconcile lockfiles in-container |
| `make check` | Run read-only formatting, lint, `isolatedDeclarations` typecheck, and gates |
| `make fix` | Apply deterministic formatting and lint autofixes |
| `make test` | Run unit and component test suites across registered components |
| `make build` | Build `packages/ui` and `apps/playground` |
| `make package` | Pack `@docouno/unica` and verify exports (`publint` + `attw`) |
| `make dev app=playground` | Start the interactive 6-preset Vite workbench |
| `make visual` | Render deterministic `2x` PNG screenshots (`item=`, `mode=6up\|focus`, `theme=`, `surface=auto\|base\|overlay`, `section=`, `vp=`, `scale=`, `dir=`, `raw=0\|1`, `out=`) |

Scope commands during iteration with `package=ui` or `app=playground` (for example `make check package=ui` or `make test package=ui`). Checks and builds keep source, configuration, and lockfiles read-only. To modify dependencies with the accepted toolchain:

```sh
sh .devkit/runtime/devkit.sh cli exec --component packages/ui --write --network bridge -- npm install <pkg>
make sync reconcile=1
make setup
make check
```

## Repository Structure

```text
unica/
├── packages/ui/                 @docouno/unica source, CSS tokens, themes, and ESM exports
├── apps/playground/             6-preset Vite workbench
│   ├── src/workbench/           Portable workbench shell (zero @docouno/* imports)
│   ├── src/prototypes/<family>/ Component specimens (*.specimen.tsx) and upfront visual prototypes (*.proto.tsx, *.css)
│   └── src/scenes/              Live application compositions (*.scene.tsx)
└── docs/                        Core concepts, compositions (folio.md), and component contracts
```

Read [`docs/README.md`](docs/README.md) before modifying public props, tokens, or specimens.

Keep temporary renders, logs, probes, and scratch scripts in a task-specific subdirectory of the Git-ignored `.artifacts/` directory inside the current checkout. `make visual` writes to `.artifacts/visual/`. Do not commit task artifacts or store them outside the checkout.

## Architectural Invariants

### 1. Role-based API, zero decorative `appearance` prop

Material physics belong to the active theme (`Soft`, `Frost`, `Pixel` in `Dark` and `Light`), never to per-component decorative switches such as `solid`, `soft`, `glass`, `lamp`, or `outline`:

- **Zero material variants (`0`):** status markers (`Badge`, `Tag`, `Chip`, `Indicator`), overlays (`Modal`, `Drawer`, `Popover`, `Tooltip`, `HoverCard`, `Menu`, `Toast`), choice cards (`CheckboxCard`, `RadioCard`, `SwitchCard`), and binary/range controls (`Checkbox`, `Radio`, `Switch`, `Slider`, `RangeSlider`, `SegmentedControl`, `Progress`).
- **Field & picker context:** `variant="default" | "ghost"` on inputs and pickers (`Input`, `Textarea`, `NumberInput`, `Select`, `Combobox`, `Autocomplete`, `DatePicker`, `DateRangePicker`, `TagsInput`, `FileInput`), plus automatic `[data-surface="overlay"]` adaptation inside floating surfaces (including `*Card` choices).
- **Card hierarchy:** `variant="default" | "subtle"` on `Card` (`CheckboxCard`, `RadioCard`, and `SwitchCard` expose zero decorative variants).
- **Button roles & tones:** `variant="primary" | "secondary" | "ghost"` crossed with `tone="accent" | "neutral" | "danger"`. Status hues (`info`, `success`, `warning`, `danger`) belong exclusively to passive markers and validation feedback.

```tsx
// Target component API; see package exports for currently implemented families.
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

### 3. Workbench prototypes (`src/prototypes/`) vs canonical library (`packages/ui`)

- New visual component families are prototyped first in `apps/playground/src/prototypes/<family>/` (`<family>.proto.tsx`, `<family>.css`, and `<family>.specimen.tsx` auto-discovered via `import.meta.glob`) and verified across all 6 presets simultaneously using `make dev app=playground` and `make visual`.
- Follow [Workbench workflow](docs/workbench.md) for specimen sections and context vignettes. Component prototype tasks leave `packages/ui` and the portable `src/workbench/` shell unchanged; full accessibility, focus, and form integration belong to library implementation.
- Prototype and component stylesheets consume semantic CSS custom properties from `@docouno/unica/styles.css` with **zero `[data-theme]` selectors and zero raw `#hex` literals** (enforced by `unica.contract.test.tsx`), and `apps/playground/src/workbench/` maintains **zero `@docouno/*` imports** (enforced by ESLint).
- Once a component ships in `packages/ui`, its `<family>.specimen.tsx` and Scene imports switch from the local prototype to `@docouno/unica`, its temporary `<family>.proto.tsx` and prototype `<family>.css` are removed, and `packages/ui` + `docs/components/<family>.md` serve as the sole canonical source of truth.

## Definition of Done

Every change must satisfy all of the following before completion:

1. `make check`, `make test`, `make build`, and `make package` (`isolatedDeclarations`, `publint`, and `@arethetypeswrong/core` pure-ESM verification) pass cleanly with zero warnings.
2. Keyboard navigation, focus return, top-layer dismissal, native `<form>` submission/reset, `forced-colors`, and `prefers-reduced-motion` comply with [Overlays and Forms](docs/concepts/overlays-and-forms.md) and [Support and Accessibility](docs/concepts/support-and-accessibility.md).
3. Visual rendering and interactive states are verified in `apps/playground` (`6-up` matrix, `Focus`, `Overlay` surface, `360px`–`1440px`, `120%` text, `RTL`, and `make visual`) across all 6 presets (`soft-dark`, `soft-light`, `frost-dark`, `frost-light`, `pixel-dark`, `pixel-light`).
4. Public documentation (`README.md`, `AGENTS.md`, `docs/concepts/*`, `docs/compositions/*`, `docs/components/*`) is updated in the same change whenever public APIs, tokens, or workflows evolve.
