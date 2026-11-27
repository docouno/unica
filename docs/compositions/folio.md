# Folio — Product Composition & Launch Theme Matrix

- **Live scene directory:** `apps/playground/src/scenes/` (`01`–`10`, rendered live across all `6` presets: `soft-dark`, `soft-light`, `frost-dark`, `frost-light`, `pixel-dark`, `pixel-light`)
- **Theme preset tokens:** [`../../packages/ui/src/styles.css`](../../packages/ui/src/styles.css) (`[data-theme="<preset>"]` and `[data-surface="overlay"]`)

## Purpose & Multi-Preset Architecture

**Folio** is an example application composition in Unica's open `apps/playground/src/scenes/<scene>.scene.tsx` set. It exercises Unica's role-based design architecture across three distinct launch theme families — editorial productivity, tactile hardware-grade SaaS, and sharp-corner developer tooling — from a single component API:

- **Theme-owned surface physics and geometry** (`0` decorative `appearance` props on components)
- **Contextual surface adaptation (`base` vs `[data-surface="overlay"]`)**
- **A flat semantic CSS custom property dictionary** (`0` `[data-theme]` selectors inside component stylesheets)

Every scene uses one JSX structure across all six presets, with theme-owned typography and geometry, zero per-theme layout forks, and zero raw `#hex` color literals:

1. **`Soft` (`soft-dark`, `soft-light`):**
   - **Dark (`soft-dark`):** Warm matte graphite surfaces (`#100f0e < #161514 < #1c1b1a < #272524`), warm parchment ink (`#f1eeec` / `#d0ccc9`), muted pastel accents (warm ochre `#de9055`, honey-gold `#e3c368`, sage `#8cbf91`, dusty slate-blue `#7db0d1`, rose `#e07281`) paired with deep espresso `--fg-on-accent` ink, soft matte secondary plates, borderless pastel badges/tags/chips/alerts (`--_pill-border-width: 0px`), and 100% opaque warm-graphite overlays.
   - **Light (`soft-light`):** Clean limestone and paper-sand surfaces (`#e8e3da < #f0ece4 < #f7f4ee < #fdfcfa`), warm umber-charcoal ink (`#221f1c` / `#3d3832`), burnt ochre accent (`#a8531d` with `#fffaf5` cream ink), balanced botanical status harmonies, soft matte secondary plates, borderless pastel pills, and opaque paper overlays.
2. **`Frost` (`frost-dark`, `frost-light`):**
   - **Dark (`frost-dark`):** Deep obsidian-sapphire neutrals (`#060609 < #0a0b0f < #0f1015 < #181920`), electric indigo-violet accent (`#5445e5`), deep violet primary CTAs (`--_btn-primary-fill` with diagonal chromatic volume and diffuse ambient light), quiet secondary plates with soft contact shadows, `1px`-rimmed jewel badges/chips with glowing status dots (`--_badge-dot-shadow`), and frosted glass (`--_overlay-backdrop: blur(20px) saturate(125.4%)` + `--_overlay-rim`) strictly on floating overlays.
   - **Light (`frost-light`):** Crystalline alabaster neutrals (`#e8ecf5 < #eff2f9 < #f6f8fc < #ffffff`), electric indigo-violet accent (`#4838d4`), deep violet primary CTAs with diagonal color volume and restrained ambient light, quiet `1px`-bordered secondary plates with soft contact shadows, and frosted glass floating overlays.
3. **`Pixel` (`pixel-dark`, `pixel-light`):**
   - **Dark (`pixel-dark`):** Cozy twilight-plum surfaces (`#0b090e < #110f14 < #17141b < #211e27`), strict `0px` sharp corners (`--radius-factor: 0`) across chrome, cards, fields, buttons, badges, tags, chips, avatars, checkboxes, and rectangular switches while keeping `Radio` indicators circular (`--radius-circular: 50%`), `JetBrains Mono` as `--font-family-base` (`14/12/11` calibrated scale), cozy pixel-art accents (berry sakura `#e887a3`, mint `#80cc9c`, sky `#7bc0eb`, warm gold `#f2c868`, tomato red `#eb6f5e`), crisp `1px` structural borders, `--_motif-corner-ticks` (`5px × 2px` integer corner registration brackets on cards and floating panels), `--motif-canvas-grid` (`24px` dot matrix), flat primary and secondary buttons with discrete color/edge feedback and no press displacement, and hue-shifted `6px 6px 0 0` (`3px 3px 0 0` on tooltips, `-6px 0 0 0` on right-docked `Drawer`) crisp drop shadows on 100% opaque overlays.
   - **Light (`pixel-light`):** Soft lavender-cloud drafting surfaces (`#e6e1ea < #efeaf2 < #f6f3f8 < #fffefd`), strict `0px` sharp corners, `JetBrains Mono` typography, crisp pixel inks (berry `#b33f64`, meadow green `#32754e`, cobalt `#296a9e`, ochre `#91630e`, tomato `#bf3a2c`), integer corner registration brackets, coordinate grid backdrops, flat buttons with discrete color/edge feedback and no press displacement, and `6px 6px 0 0` (`4px 4px 0 0` on tooltips) crisp block shadows on opaque overlays.

Folio consumes shared components. Its screens are independent integration examples, not a checklist to reproduce inside each component specimen. Additional applications and compositions follow the same dependency direction.

## Explore the Live Compositions

Run `make dev app=playground` and select a Folio scene from **Scenes**. You can also follow a consuming scene link in a component's **Usage** view. Open `/?item=05-rich-editor&family=frost&scheme=light&vp=1440` to see the editor at its desktop reference width.

| Scene | Useful interactions |
| --- | --- |
| `01-sign-in` | Switch sign-in mode, edit credentials, and toggle device trust. |
| `02-workspace-overview` | Filter activity and dismiss the indexing notification. |
| `03-document-collection` | Filter by modification period or verification cutoff. Remove a date filter, page through results, and switch between list and card layouts. |
| `04-document-reader` | Open document actions, switch inspector sections, and inspect the owner card. |
| `05-rich-editor` | Toggle formatting, edit a document reference, and select a slash-command block. |
| `06-page-properties-drawer` | Edit the next verification date and save properties. Reopen the drawer to inspect the saved value, or cancel to discard a new edit. |
| `07-invite-access-modal` | Add or remove invitation addresses, select capabilities, and choose a role. |
| `08-extensions-empty` | Filter connectors to see the no-results message. Create and remove a webhook sandbox to inspect how the card replaces the empty message and transfers focus. |
| `09-user-preferences` | Adjust local preferences, numeric values, and save or discard changes. |
| `10-workspace-admin` | Inspect staged archives, choose local files, and try validation feedback. |

These are visual compositions with local state. Authentication, publishing, invitations, uploads, and integrations do not contact external services.

The editor's document reference opens a [Popover](../components/popover.md) from either the toolbar or the reference in the prose. Apply saves the reference details, Cancel discards the draft, and Unlink removes the reference. Preview and unlinked text display as plain text. The panel starts closed and anchors to whichever source opens it.

The invitation stays centered at narrow widths. The properties panel docks to inline end on wide screens, with square corners and the full available height. At 600px or less, it becomes a bottom sheet and keeps the same mounted form. [Modal](../components/modal.md) · [Drawer](../components/drawer.md)

Scenes import shipped families such as [Text](../components/text.md) and [Title](../components/title.md) from `@docouno/unica` and use local prototypes for families still in design. The `folio/` helpers own product content and layout, the shell owns rail and aside structure, and the theme owns materials. The [AppShell design reference](../../apps/playground/src/prototypes/app-shell/README.md) covers the frame, navigation, document strip, inspector rows and save bar. In wide scenes, the workspace header controls Navigation. The Inspector button appears in the panel header while open and in the workspace header after collapse, with a vertical Divider before it. The button stays at the same position in both states. Bounded canvases and aside bodies use compact native scrollbars. In narrow scenes, Navigation and Inspector open from their respective logical edges. The rail-only administration scene keeps its destinations in Navigation when the rail cannot fit.

Use `make visual item=02-workspace-overview` for a six-preset capture or `make visual item=07-invite-access-modal family=pixel scheme=light vp=360 scale=120 dir=rtl` for a single-theme stress capture. See [Workbench Workflow](../workbench.md) for the complete controls and screenshot options.

## Semantic Token Dictionary

[`packages/ui/src/styles.css`](../../packages/ui/src/styles.css) defines one structural base token layer on `:root` plus six flat preset overrides (`[data-theme="soft-dark" | "soft-light" | "frost-dark" | "frost-light" | "pixel-dark" | "pixel-light"]`) and contextual `[data-surface="overlay"]` rules:

- **Surfaces:** `--bg-shell`, `--bg-aside`, `--bg-canvas`, `--bg-surface`, `--bg-surface-subtle`, `--bg-surface-raised`, `--bg-overlay`, `--scrim-bg`
- **Foregrounds:** `--fg-primary`, `--fg-secondary`, `--fg-muted`, `--fg-subtle`, `--fg-disabled`, `--fg-on-accent`, `--fg-on-neutral`, `--fg-on-{info,success,warning,danger}`
- **Borders:** `--border-subtle`, `--border-default`, `--border-strong` (plus internal `--_binary-border` / `--_binary-border-hover`)
- **Contextual Controls & Choice Cards (`base` vs `[data-surface="overlay"]`):** `--control-bg`, `--control-border`, `--control-border-hover`, `--choice-card-bg`, `--choice-card-bg-selected`, `--choice-card-border`, `--choice-card-border-selected`
- **Accent, Neutral & Statuses:** `--accent-{solid,solid-hover,solid-active,soft-bg,soft-fg,border,signal}`, `--neutral-{solid,solid-hover,solid-active,soft-bg,soft-fg,border,signal}`, and `--status-{info,success,warning,danger}-{solid,soft-bg,soft-fg,border,signal}`
- **Public Tier 2 & App-Level Hooks:** `--table-row-selected-bg` (sticky row selection), `--motif-canvas-grid`, `--action-context-ink`, `--code-context-{bg,fg,border}`, `--indicator-separator-color`, and app-level `--folio-auth-stage-aura` (defined in `apps/playground/src/unica.workbench.css` for the Folio sign-in backdrop)
- **Internal Preset Material Recipes (`--_*`):** `--_btn-*`, `--_pill-border-width`, `--_alert-border-width`, `--_badge-dot-shadow`, `--_switch-*`, `--_slider-*`, `--_segmented-*`, `--_chip-*`, `--_kbd-cap-*`, `--_overlay-*`, `--_shell-stage-{outer,inner}-radius`, `--_motif-corner-ticks`
- **Theme-Switched Geometry & Typography:** `--radius-xs`, `--size-{s,m,l}-radius`, `--size-s-control-font`, `--surface-{s,m,l}-radius`, `--radius-full` (all resolving to `0px` in `pixel-*`), and `--font-family-base` (`Inter` in `soft-*` / `frost-*`; `JetBrains Mono` in `pixel-*`)

## Component Role, Shell & Surface Rules

1. **Composable `AppShell` Chrome (`TopRail`, `LeftRail`, `Aside`, `Stage`, `Header`, `Subbar`):**
   - **L-Shaped (`TopRail + LeftRail` + concentric `Stage` corner, scenes `02`–`06`):** `TopRail` (`46px`) owns the `56px` top-left brand cell; `AppShell.Stage` binds its top-left corner to `--_shell-stage-outer-radius` / `--_shell-stage-inner-radius` (`14px` / `13px` in `Soft` and `Frost`, `0px` in `Pixel`). The corner stays rounded in Soft and Frost when Navigation is hidden.
   - **Classic (`LeftRail + Aside + Main`, scenes `07`, `08`):** `LeftRail` hosts the brand mark and `Stage` uses a straight `1px` inline-start seam.
   - **`Aside`-Only (`09`), `LeftRail`-Only (`10`), and Standalone (`01`):** Optional slots compose cleanly without per-screen layout wrappers.
2. **Role-based actions.** Button and IconButton cross `variant="primary" | "secondary" | "ghost"` with `tone="accent" | "neutral" | "danger"`. Passive markers such as Badge, Alert, Toast, and Indicator communicate status. [Button and IconButton](../components/button.md)
3. **Contextual Surface Adaptation (`base` vs `[data-surface="overlay"]`):** On `base` surfaces, controls and `*Card` choices use structured recessed plates; inside `overlay` containers (`[data-surface="overlay"]`), `Frost` switches controls to translucent glass veils while `Soft` and `Pixel` apply stepped opaque overlay plates.
4. **Composition Cleanliness:** Avoid triple-nested `Card` containers and competing shadows inside floating overlays. `SegmentedControl` keeps consistent figure-ground polarity across Dark and Light presets, and continuous controls share recessed track polarity. `Slider` and `RangeSlider` share identical geometry and use a dedicated thin-track fill recipe for contrast on floating surfaces.

## Product Scene Matrix (`01`–`10` × `6` Presets)

The properties and invitation scenes use a native dialog in each artboard's own document. Their frames account for the Workbench toolbar and artboard heading when fitting vertically. This keeps the dialog actions and notification receipts within reach in the preview.

| Scene ID | Product Scene & `AppShell` Topology | Connected Families & Overlay Calibration |
| --- | --- | --- |
| `01-sign-in` | **Sign In & SSO** (`Standalone`) | Ambient auth stage (`--folio-auth-stage-aura` in `Frost`; matte stage in `Soft`; `--motif-canvas-grid` coordinate matrix in `Pixel`), `Card`, `Title`, `Text`, `SegmentedControl`, SSO secondary `Button`s, labeled `Divider`, `FormField` + `Input`, `Link`, `Checkbox`, primary `Button`, `Badge` |
| `02-workspace-overview` | **Workspace Overview** (`L-Shaped: TopRail[search] + LeftRail + LeftAside + Main`) | Global search using S `Input`, `LeftRail` with `Indicator`, preferences `Tooltip` with a `Kbd` shortcut, `TreeView`, `Breadcrumb`, `AvatarGroup`, 3-column summary `Card` grid, recent activity `List` with diff and time metadata, pinned document card, `SegmentedControl`, `info` `Alert`, bottom-right [Toast](../components/toast.md) |
| `03-document-collection` | **Document Collection & Date Filter** (`L-Shaped: TopRail[search] + LeftRail + LeftAside + Main + RightAside`) | Filter bar (`ChipGroup`, `Select`, [TagGroup](../components/tag.md#taggroup), `Link`), layout `SegmentedControl`, 2-up topology `Card` + `CardMedia`, directory `Table` + [Pagination](../components/pagination.md), `RightAside` (`Switch`, verification cutoff `DatePicker`, `Progress`, last-modified `DateRangePicker`) |
| `04-document-reader` | **Document Reader & Overlays** (`L-Shaped: TopRail[tabs] + LeftRail + LeftAside + Main + RightAside`) | Open document tabs in `TopRail`, editorial runbook (`Badge`, `Title`, `warning` `Alert`, `List`, inline [Code](../components/code.md) and a fenced listing, `Table`, [Blockquote](../components/blockquote.md)), `RightAside` (`Tabs`, `Switch`, `Badge`, [Collapsible](../components/collapsible.md) + `ListItem`, `Progress`, in-flow revision commands), anchored [Menu](../components/menu.md) and `HoverCard` |
| `05-rich-editor` | **Rich Editor & Slash Autocomplete** (`L-Shaped: TopRail[tabs] + LeftRail + LeftAside + Main[Header + Subbar]`) | Document tabs, `Breadcrumb` header with autosave `Spinner` & `AvatarGroup`, formatting `Subbar` (`Tabs`, `Icon` tools, `Kbd`), `760px` prose stage, anchored link [Popover](../components/popover.md), and slash-command example with an in-flow [Listbox](../components/listbox.md) |
| `06-page-properties-drawer` | **Page Properties & Relations Drawer** (`L-Shaped` under `Drawer`) | Workspace under `--scrim-bg`, `520px`-wide `Drawer` at inline end or docked to the bottom on narrow screens (`data-surface="overlay"`), contextual `RadioCard`s and `CheckboxCard`, verification `DatePicker` with an anchored calendar, `Textarea`, reviewer `Combobox`, and a scoped [Toast](../components/toast.md) confirmation |
| `07-invite-access-modal` | **Invite & Access Modal** (`Classic: LeftRail + LeftAside + Main` under `Modal`) | Directory (`Card`s + `Table`) under `--scrim-bg`, centered `548px` `Modal` (`data-surface="overlay"`), `TagsInput` with removable [Tag](../components/tag.md) recipients, `danger` `FormField` + `Input`, 2-up `CheckboxCard`s, `Textarea`, role and expiry fields with [Select](../components/select.md), and a scoped [Toast](../components/toast.md) receipt |
| `08-extensions-empty` | **Extensions & Empty Sandbox** (`Classic: LeftRail + LeftAside + Main`) | Search `Input` + `NavList`, spotlight connector `Card`s (`Icon`, `Badge`, `Button`), installed connector `List` with independent Manage actions and an indexing row (`Spinner` + `Badge`), and zero-state webhook `Card` hosting [Empty](../components/empty.md) |
| `09-user-preferences` | **User Preferences & Numeric Controls** (`Aside-Only: LeftAside + Main`) | `Aside` navigation + `820px` settings column: Appearance & Governance `Card`s (`SegmentedControl`, `Select`, `Radio` group, `Slider` + `NumberInput`, `RangeSlider` + `Switch`, [Accordion](../components/accordion.md)), `Keyboard shortcuts` `Table` with `KbdGroup` + `Kbd`, and `StickyActionBar` |
| `10-workspace-admin` | **Workspace Admin & Batch Import** (`LeftRail-Only: LeftRail + Main`) | `LeftRail`-only shell + `840px` migration flow: 3-step `Stepper`, `Import Schema & Policy` `Card` (`FileInput` + `RadioCard`s), `Archive Upload & Validation` `Card` (M `Dropzone`, `Progress`, `FileList` + `FileItem`s, action footer), and a scoped [Toast queue](../components/toast.md) |
