# Folio — Product Composition & Launch Theme Matrix

- **Live scene directory:** `apps/playground/src/scenes/` (`01`–`10`, rendered live across all `6` presets: `soft-dark`, `soft-light`, `frost-dark`, `frost-light`, `pixel-dark`, `pixel-light`)
- **Theme preset tokens:** [`../../packages/ui/src/styles.css`](../../packages/ui/src/styles.css) (`[data-theme="<preset>"]` and `[data-surface="overlay"]`)

## Purpose & Multi-Preset Architecture

**Folio** is the baseline product composition in Unica's open `apps/playground/src/scenes/<scene>.scene.tsx` set. It exercises Unica's role-based design architecture across three distinct launch theme families — editorial productivity, tactile hardware-grade SaaS, and sharp-corner developer tooling — from a single component API:

- **Theme-owned surface physics and geometry** (`0` decorative `appearance` props on components)
- **Contextual surface adaptation (`base` vs `[data-surface="overlay"]`)**
- **A flat semantic CSS custom property dictionary** (`0` `[data-theme]` selectors inside component stylesheets)

Every scene renders identically across all six presets from one JSX tree with zero per-theme layout forks and zero raw `#hex` color literals:

1. **`Soft` (`soft-dark`, `soft-light`):**
   - **Dark (`soft-dark`):** Dusty evening slate surfaces (`#151a1e < #1a2025 < #20272d < #273038`), warm cream-vellum ink (`#f7efe0` / `#e4d8c5`), luminous retro-pastel accents (terracotta coral `#e28365`, honey-marigold `#efc262`, pistachio-sage `#a8c284`, dusty petrol `#8ab2c2`) paired with dark espresso `--fg-on-accent` ink, soft matte secondary plates, borderless pastel badges/tags/chips/alerts (`--pill-border-width: 0px`), and 100% opaque warm-slate overlays.
   - **Light (`soft-light`):** Creamy vellum and biscuit-sand surfaces (`#eadbc5 < #f3e7d3 < #fbf2e1 < #fffcf5`), warm umber-charcoal ink (`#292421` / `#3d3733`), terracotta accent (`#b3583b` with `#fffaf2` cream ink), pistachio-sage and honey-gold status harmonies, soft biscuit secondary plates, borderless pastel pills, and opaque vellum overlays.
2. **`Frost` (`frost-dark`, `frost-light`):**
   - **Dark (`frost-dark`):** Deep obsidian-titanium neutrals (`#07090e < #0c0f17 < #111520 < #181d2b`), electric indigo-violet accent (`#5445e5`), volumetric primary CTAs (`--btn-primary-sheen` + `0 2px 0` tactile keycap ledge), paired `0 2px 0` secondary keycaps, `1px`-rimmed jewel badges/chips with glowing status dots (`--badge-dot-shadow`), and frosted glass (`--overlay-backdrop: blur(20px) saturate(165%)` + `--overlay-rim`) strictly on floating overlays.
   - **Light (`frost-light`):** Crystalline alabaster neutrals (`#e8ecf5 < #eff2f9 < #f6f8fc < #ffffff`), electric indigo-violet accent (`#4838d4`), volumetric primary CTAs, crisp `1px`-rimmed hardware secondary keycaps sharing the `0 2px 0` tactile ledge, and frosted glass floating overlays.
3. **`Pixel` (`pixel-dark`, `pixel-light`):**
   - **Dark (`pixel-dark`):** Carbon-phosphor terminal surfaces (`#090b0d < #0d1013 < #111519 < #161b20`), strict `0px` sharp corners (`--radius-factor: 0`) across chrome, cards, fields, buttons, badges, tags, chips, avatars, checkboxes, and rectangular switches while keeping `Radio` indicators circular (`--radius-circular: 50%`), `JetBrains Mono` as `--font-family-base` (`14/12/11` calibrated scale), high-contrast phosphor accents (cyan `#22c3dc`, emerald `#2ed16c`, amber `#f5ac27`, signal red `#f45864`), crisp `1px` structural borders, `--motif-corner-ticks` (`8px` corner registration brackets on cards and floating panels), `--motif-canvas-grid` (`24px` dot matrix), `2px 2px 0 0` block shadows on primary and secondary buttons, and `6px 6px 0 0` (`-6px 0 0 0` on right-docked `Drawer`) crisp drop shadows on 100% opaque overlays.
   - **Light (`pixel-light`):** Architectural drafting-paper surfaces (`#dde2e6 < #e7ebee < #f2f5f7 < #ffffff`), strict `0px` sharp corners, `JetBrains Mono` typography, deep drafting inks (petrol-cyan `#096c7c`, forest green `#14753c`, ochre-amber `#965500`, vermilion `#c21f2d`), corner registration brackets, coordinate grid backdrops, `2px 2px 0 0` button block shadows, and `6px 6px 0 0` crisp block shadows on opaque overlays.

## Semantic Token Dictionary

[`packages/ui/src/styles.css`](../../packages/ui/src/styles.css) defines one structural base token layer on `:root` plus six flat preset overrides (`[data-theme="soft-dark" | "soft-light" | "frost-dark" | "frost-light" | "pixel-dark" | "pixel-light"]`) and contextual `[data-surface="overlay"]` rules:

- **Surfaces:** `--bg-shell`, `--bg-aside`, `--bg-canvas`, `--bg-surface`, `--bg-surface-subtle`, `--bg-surface-raised`, `--bg-overlay`, `--scrim-bg`
- **Foregrounds:** `--fg-primary`, `--fg-secondary`, `--fg-muted`, `--fg-subtle`, `--fg-disabled`, `--fg-on-accent`, `--fg-on-neutral`, `--fg-on-{info,success,warning,danger}`
- **Borders:** `--border-subtle`, `--border-default`, `--border-strong`, `--binary-border`, `--binary-border-hover`
- **Contextual Controls & Choice Cards (`base` vs `[data-surface="overlay"]`):** `--control-bg`, `--control-border`, `--control-border-hover`, `--choice-card-bg`, `--choice-card-bg-selected`, `--choice-card-border`, `--choice-card-border-selected`
- **Accent, Neutral & Statuses:** `--accent-{solid,solid-hover,solid-active,soft-bg,soft-fg,border,signal}`, `--neutral-{solid,solid-hover,solid-active,soft-bg,soft-fg,border,signal}`, and `--status-{info,success,warning,danger}-{solid,soft-bg,soft-fg,border,signal}`
- **Calibrated Material Recipes:** `--btn-primary-{sheen,shadow,border-width}`, `--btn-secondary-{bg,bg-hover,border,border-width,shadow}`, `--button-s-padding-x`, `--size-s-control-font`, `--pill-border-width`, `--alert-border-width`, `--badge-dot-shadow`, `--switch-track-*`, `--segmented-{rail,thumb}-*`, `--chip-*`, `--kbd-cap-*`, `--table-row-selected-bg`, `--overlay-{backdrop,rim}`, `--overlay-shadow-{tooltip,popover,hover,drawer,modal}`, `--auth-stage-aura`
- **Theme-Switched Geometry, Typography & Motifs:** `--radius-xs`, `--size-{s,m,l}-radius`, `--surface-{s,m,l}-radius`, `--shell-stage-{outer,inner}-radius`, `--radius-full` (all resolving to `0px` in `pixel-*`), `--font-family-base` (`Inter` in `soft-*` / `frost-*`; `JetBrains Mono` in `pixel-*`), `--motif-canvas-grid`, and `--motif-corner-ticks`

## Component Role, Shell & Surface Rules

1. **Composable `AppShell` Chrome (`TopRail`, `LeftRail`, `Aside`, `Stage`, `Header`, `Subbar`):**
   - **L-Shaped (`TopRail + LeftRail` + concentric `Stage` corner, scenes `02`–`06`):** `TopRail` (`46px`) owns the `56px` top-left brand cell; `AppShell.Stage` binds its top-left corner to `--shell-stage-outer-radius` / `--shell-stage-inner-radius` (`14px` / `13px` in `Soft` and `Frost`; `0px` in `Pixel`).
   - **Classic (`LeftRail + Aside + Main`, scenes `07`, `08`):** `LeftRail` hosts the brand mark and `Stage` uses a straight `1px` inline-start seam.
   - **`Aside`-Only (`09`), `LeftRail`-Only (`10`), and Standalone (`01`):** Optional slots compose cleanly without per-screen layout wrappers.
2. **Role-Based Buttons (`Button`):** Public roles `variant="primary" | "secondary" | "ghost"` crossed with `tone="accent" | "neutral" | "danger"`. Semantic status hues (`info`, `success`, `warning`, `danger`) belong exclusively to passive status markers and feedback (`Badge`, `Alert`, `Toast`, `Indicator`).
3. **Contextual Surface Adaptation (`base` vs `[data-surface="overlay"]`):** On `base` surfaces, controls and `*Card` choices use structured recessed plates; inside `overlay` containers (`[data-surface="overlay"]`), `Frost` switches controls to translucent glass veils while `Soft` and `Pixel` apply stepped opaque overlay plates.
4. **Composition Cleanliness:** Avoid triple-nested `Card` containers and competing shadows inside floating overlays. `SegmentedControl` keeps consistent figure-ground polarity across Dark and Light presets, and continuous tracks align 1:1 across `Progress`, `Slider`, and `RangeSlider`.

## Product Scene Matrix (`01`–`10` × `6` Presets)

| Scene ID | Product Scene & `AppShell` Topology | Connected Families & Overlay Calibration |
| --- | --- | --- |
| `01-sign-in` | **Sign In & SSO** (`Standalone`) | Ambient auth stage (`--auth-stage-aura` in `Frost`; matte stage in `Soft`; `--motif-canvas-grid` coordinate matrix in `Pixel`), `Card`, `Title`, `Text`, `SegmentedControl`, SSO secondary `Button`s, labeled `Divider`, `FormField` + `Input`, `Link`, `Checkbox`, primary `Button`, `Badge` |
| `02-workspace-overview` | **Workspace Overview** (`L-Shaped: TopRail[search] + LeftRail + LeftAside + Main`) | Global search + `Kbd`, `LeftRail` with `Indicator` + anchored `Tooltip`, `TreeView`, `Breadcrumb`, `AvatarGroup`, 3-column summary `Card` grid, activity & pinned document cards, `SegmentedControl`, `info` `Alert`, bottom-right `Toast` |
| `03-document-collection` | **Document Collection & Date Filter** (`L-Shaped: TopRail[search] + LeftRail + LeftAside + Main + RightAside`) | Filter bar (`SegmentedControl`, `Select`, `Chip`s, `TagGroup`, `Link`), 2-up topology `Card` + `CardMedia`, directory `Table` + `Pagination`, `RightAside` (`Switch`, `DatePicker`, `Progress`, `DateRangePicker` + open calendar popover) |
| `04-document-reader` | **Document Reader & Overlays** (`L-Shaped: TopRail[tabs] + LeftRail + LeftAside + Main + RightAside`) | Open document tabs in `TopRail`, editorial runbook (`Badge`, `Title`, `warning` `Alert`, `List`, inline & fenced `Code`, `Table`, `Blockquote`), `RightAside` (`Tabs`, `Switch`, `Tag`, `Collapsible` + `ListItem`, `Progress`), anchored `Menu` and `HoverCard` |
| `05-rich-editor` | **Rich Editor & Slash Autocomplete** (`L-Shaped: TopRail[tabs] + LeftRail + LeftAside + Main[Header + Subbar]`) | Document tabs, `Breadcrumb` header with autosave `Spinner` & `AvatarGroup`, formatting `Subbar` (`Tabs`, `Icon` tools, `Kbd`), `760px` prose stage, anchored link `Popover` (`data-surface="overlay"`), and slash-command `Autocomplete` |
| `06-page-properties-drawer` | **Page Properties & Relations Drawer** (`L-Shaped` under `Drawer`) | Workspace under `--scrim-bg`, inline-end `520px` `Drawer` (`data-surface="overlay"`), contextual `RadioCard`s and `SwitchCard`, `DatePicker` + embedded `Calendar`, `Textarea`, and reviewer `Combobox` |
| `07-invite-access-modal` | **Invite & Access Modal** (`Classic: LeftRail + LeftAside + Main` under `Modal`) | Directory (`Card`s + `Table`) under `--scrim-bg`, centered `548px` `Modal` (`data-surface="overlay"`), contextual `TagsInput`, `danger` `FormField` + `Input`, 2-up `CheckboxCard`s, `Textarea`, role & expiry `Select`s, and open `Listbox` |
| `08-extensions-empty` | **Extensions & Empty Sandbox** (`Classic: LeftRail + LeftAside + Main`) | Search `Input` + `NavList`, spotlight connector `Card`s (`Icon`, `Tag`, `Badge`, `Button`), live-indexing row (`Spinner` + `Skeleton` + `SkeletonText`), and zero-state webhook `Card` hosting `Empty` |
| `09-user-preferences` | **User Preferences & Numeric Controls** (`Aside-Only: LeftAside + Main`) | `Aside` navigation + `820px` settings column: Appearance & Governance `Card`s (`SegmentedControl`, `Select`, `Radio` group, `Slider` + `NumberInput`, `RangeSlider` + `Switch`, `Accordion`), `Keyboard shortcuts` `Table` with `KbdGroup` + `Kbd`, and `StickyActionBar` |
| `10-workspace-admin` | **Workspace Admin & Batch Import** (`LeftRail-Only: LeftRail + Main`) | `LeftRail`-only shell + `840px` migration flow: 3-step `Stepper`, `Import Schema & Policy` `Card` (`FileInput` + `RadioCard`s), `Archive Upload & Validation` `Card` (compact `Dropzone`, `Progress`, `FileList` + `FileItem`s, action footer), and `ToastViewport` |
