# AGENTS.md — Contributor & Agent Guide

`@docouno/unica` is a role-based React 19+ design system — accessible components, layout primitives, semantic tokens, and multi-material themes in a pure-ESM TypeScript package (`isolatedDeclarations: true`).

The repository is managed with [`@docouno/devkit`](https://github.com/docouno/devkit) and contains the shared library (`packages/ui`) alongside a 6-preset interactive Vite workbench (`apps/playground`).

## Environment & Commands

All toolchains run inside pinned Devkit containers on Linux x86_64 with Docker Engine, Docker Compose 5.0.0+, and GNU Make (see [`.devkit/runtime/GUIDE.md`](.devkit/runtime/GUIDE.md)). Never bypass containers with host Node toolchains, and never hand-edit managed files under `.devkit/`.

| Command | Purpose |
| --- | --- |
| `make setup` | Prepare accepted container images and pnpm workspace dependencies |
| `make doctor` | Verify accepted images, receipts, disk space, and project invariants |
| `make sync [reconcile=1] [preview=1]` | Synchronize workspace projections and `pnpm-lock.yaml` after manual manifest or `.npmrc` edits |
| `make check` | Run read-only formatting, lint, `isolatedDeclarations` typecheck, and gates |
| `make fix` | Apply deterministic formatting and lint autofixes |
| `make test` | Run unit and component test suites across registered components |
| `make build` | Build `packages/ui` and `apps/playground` |
| `make package` | Pack `@docouno/unica` and verify exports (`publint` + `attw`) |
| `make dev app=playground` / `make up app=playground headless=1` | Start the interactive 6-preset Vite workbench (foreground or background) with sticky per-checkout host ports |
| `make info [json=1]` | Show checkout readiness, running services, and confirmed preview addresses (`make status` is a quiet alias) |
| `make down [cleanup=1]` | Stop services while preserving port leases; pass `cleanup=1` to release leases after verified container cleanup |
| `make visual` | Render deterministic `2x` PNG screenshots. See [capture parameters](docs/workbench.md#address-and-capture-a-view) for `item`, `tab`, `family`, `scheme`, `mode`, `slice`, `block`, `bounds`, and environment flags. |

Scope commands during iteration with `package=ui` or `app=playground` (for example `make check package=ui` or `make test package=ui`). Checks and builds keep source, configuration, and lockfiles read-only.

To add or update dependencies with the accepted pnpm toolchain (use `app=playground` for the playground, or omit the selector and pass `-w` for the root Node workspace):

```sh
make exec package=ui write=1 network=bridge command='pnpm add <pkg> --lockfile-only --ignore-scripts'
make setup
make check
```

After manual edits to `package.json` or `.npmrc` (including registry dependencies or registry routes), optionally preview with `make sync preview=1`, then run `make sync` followed by `make setup` (`make sync` runs offline JSON sync or online resolution when registry dependencies change). Use `make sync reconcile=1` only for a demonstrated peer or transitive lock conflict after inspecting the planned delta with `make sync reconcile=1 preview=1`, followed by `make setup`.

Development stands lease a sticky loopback port per checkout (retained across ordinary `make down` and released via `make down cleanup=1`), so multiple checkouts run side by side without collisions. Loopback URLs work out of the box; to publish reverse-proxied URLs, set `DEVKIT_PREVIEW_URL_TEMPLATE` (an HTTP/HTTPS template with `{port}`, `{service}`, `{branch}`/`{slug}`) in the process environment or a Git-ignored root `.env` file, and inspect confirmed addresses with `make info`. The Vite plugin (`@docouno/env/vite`) accepts the exact configured preview hosts automatically while preserving loopback access.

Worktrunk project hooks live in `.config/wt.toml` (`pre-start` reserves sticky ports, optional `post-start` starts the stand when `DEVKIT_WT_AUTOSTART=1`, and `pre-remove` verifies ownership and cleans up stand resources before worktree removal). In non-interactive or agent sessions, pass `--yes` (`wt switch --create --no-cd --yes <branch>`, `wt remove --foreground --yes <branch>`) or pre-approve hooks once via `wt config approvals add --yes`. For other worktree workflows, call `sh .devkit/runtime/devkit.sh cli stand reserve .` and `sh .devkit/runtime/devkit.sh cli stand remove .` directly.

## Repository Structure

```text
unica/
├── packages/ui/                 @docouno/unica source, CSS tokens, themes, and ESM exports
├── apps/playground/             6-preset Vite workbench
│   ├── src/workbench/           Portable workbench shell (zero @docouno/* imports)
│   ├── src/specimens/<family>/  Catalog declarations for prototypes and shipped components (*.spec.tsx)
│   ├── src/prototypes/<family>/ Upfront visual prototypes (*.proto.tsx, *.css)
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

These are library implementation obligations. During design, specify the intended experience and use enough native behavior to evaluate it; follow the [prototype boundary](docs/workbench.md#design-outcome-and-prototype-behavior).

- Accept `ref` directly as a regular prop on every component; never wrap components in `React.forwardRef`.
- Annotate exported functions, props, and hooks explicitly so `isolatedDeclarations: true` emits deterministic `.d.ts` files without full-program inference.
- Render modal surfaces (`Modal`, `Drawer`) on native `<dialog>` via `showModal()` and non-modal anchored overlays/toasts on the native Popover API (`popover="auto" | "manual"`), avoiding `z-index` escalation wars.
- Guarantee native `<form>` participation: `FormData` submission, native `<form>` `reset` restoration, `disabled` / `readOnly` / `loading` invariants, and strict controlled vs uncontrolled authority.

### 3. Workbench prototypes (`src/prototypes/`) vs canonical library (`packages/ui`)

- Prototype new visual families under `apps/playground/src/prototypes/<family>/` and register a `defineComponent` catalog entry with status `Proto` under `apps/playground/src/specimens/<family>/`. Compare all six presets using Family `All` and Scheme `Both` in the live workbench and `make visual`.
- The design deliverable is a detailed visual and interaction specification with a live reference. Prototype code serves inspection; its props and internal structure do not define the shipped contract. Implement enough behavior to evaluate design decisions honestly, and state which examples pin a state rather than implement its full mechanism. Deferred engineering must not leave agreed visual or interaction decisions to the library implementer.
- Follow the [Workbench workflow](docs/workbench.md) for Playground, Matrix, Cases, and Usage. Application compositions consume shared components in `src/scenes/` and register their dependencies for Usage links. Component specimens contain product-independent examples. Full accessibility, focus, and form integration belong to library implementation. Ordinary prototype tasks work within the catalog and prototype sources. Repair demonstrated material defects at the theme-token source and verify its consumers and documentation.
- Prototypes, specimens, and scenes consume semantic CSS custom properties with **zero `[data-theme]` selectors and zero raw `#hex` literals** (enforced by `unica.contract.test.tsx`). The portable `src/workbench/` shell uses only `--wb-*` tokens and has **zero `@docouno/*` or app-owned example imports**.
- Once a component ships, keep the specimen ID and switch its status to `UI`. Update the inspector schema to match the shipped API and switch specimen and scene imports to `@docouno/unica`. Remove temporary implementation and component styles under `src/prototypes/` and record the shipped contract in `docs/components/<family>.md`.

## Definition of Done

Apply completion criteria to the stage and the surfaces being changed:

1. **Repository health:** Code changes pass canonical `make check`, `make test`, and `make build` for affected components and dependencies with zero warnings. Changes affecting the library package also pass `make package package=ui` (`publint` and `@arethetypeswrong/core`). Documentation-only changes require consistency, link, and diff review; they do not require repeating unchanged runtime or package checks. Repeat passed checks when a change, failure, or unresolved concern justifies it.
2. **Design:** The agreed anatomy, states, relevant combinations, transitions, and intended accessible interaction are specified and inspectable in the live prototype. Evaluate visual quality and material coherence alongside measured readability, geometry, focus, motion, and availability feedback. Check all 6 presets, relevant Base/Overlay consumers, `360px`–`1440px`, `120%` text, and `RTL`. Probes should answer design questions; full production contract coverage is not a design completion requirement. Owner visual approval accepts the design.
3. **Library implementation:** The shipped component preserves the approved experience and proves its full public API, keyboard, focus return, top-layer dismissal, state, and native `<form>` submission/reset contracts, including `forced-colors` and `prefers-reduced-motion`, under [Overlays and Forms](docs/concepts/overlays-and-forms.md) and [Support and Accessibility](docs/concepts/support-and-accessibility.md).
4. **Current documentation:** Update affected public APIs, tokens, workflows, and design handoff in the same change. Distinguish intended behavior from prototype limitations and from verified library behavior.
