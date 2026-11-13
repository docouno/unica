# Themes and Roles

Unica separates **component roles** (declared in application JSX) from **material physics** (owned by the active theme). Applications express workflow hierarchy and intent; the theme determines whether that role renders as warm editorial matte paper, tactile hardware keycaps with frosted glass, or sharp-corner terminal geometry.

## Flat `ThemeConfig` & Reference Presets

Themes are flat semantic token dictionaries rather than per-component style-prop matrices. One structural stylesheet defines component layout and state hooks, while six reference presets bind values on `:root` or `[data-theme="<preset>"]`:

```ts
export type ThemePreset =
  | 'soft-dark'
  | 'soft-light'
  | 'frost-dark'
  | 'frost-light'
  | 'pixel-dark'
  | 'pixel-light';

export interface ThemeConfig {
  readonly name: string;
  readonly colorScheme: 'dark' | 'light';
  readonly radiusFactor: 0 | 1;
  readonly fontFamilyBase: string;
  readonly tokens: Readonly<Record<`--${string}`, string>>;
}
```

| Family | Presets | Material & Surface Physics |
| --- | --- | --- |
| **Soft** | `soft-dark`, `soft-light` | Dusty slate (`Dark`) and warm cream-vellum (`Light`) matte surfaces, luminous pastel solids, borderless pills and callouts, soft matte secondary plates, and 100% opaque floating overlays. |
| **Frost** | `frost-dark`, `frost-light` | Obsidian (`Dark`) and crystalline alabaster (`Light`) neutrals, electric indigo-violet gradient CTAs with directional lamp sheen and `0 2px 0` keycap ledges, `1px`-rimmed jewel badges, and `backdrop-filter` frosted glass exclusively on floating overlays. |
| **Pixel** | `pixel-dark`, `pixel-light` | Carbon-phosphor (`Dark`) and drafting-paper (`Light`) surfaces, `0px` sharp corners (`--radius-factor: 0`), `JetBrains Mono` base typography, `1px` structural borders, `8px` corner registration ticks, coordinate grids, and crisp `{2px, 2px}` / `{6px, 6px}` `blur: 0` block shadows. |

Custom product themes satisfy `ThemeConfig` or override semantic `--*` variables on any DOM subtree without touching component CSS.

## Role-Based API Over Decorative `appearance`

Exposing low-level material switches (`solid`, `soft`, `glass`, `lamp`, `outline`) on components couples product code to a single visual style and breaks cross-theme portability. Unica replaces decorative `appearance` props with strict role contracts:

| Component Category | Public Variant Prop | Contract |
| --- | --- | --- |
| **Status markers** (`Badge`, `Tag`, `Chip`, `Indicator`) | *None (`0` variants)* | Material treatment (borderless pastel in `Soft`, `1px` jewel rim + glowing dot in `Frost`, `1px` sharp frame in `Pixel`) is 100% theme-owned. |
| **Overlays** (`Modal`, `Drawer`, `Popover`, `Tooltip`, `HoverCard`, `Menu`, `Toast`) | *None (`0` variants)* | Floating panels automatically render as frosted glass in `Frost` and opaque elevated plates in `Soft` and `Pixel`. |
| **Binary, choice-card & continuous controls** (`Checkbox`, `Radio`, `Switch`, `CheckboxCard`, `RadioCard`, `SwitchCard`, `Slider`, `RangeSlider`, `SegmentedControl`, `Progress`) | *None (`0` variants)* | Track fills, `--choice-card-*` plates, thumb contrast, and edge rules follow theme tokens directly (with automatic `[data-surface="overlay"]` adaptation). |
| **Fields & pickers** (`Input`, `Textarea`, `NumberInput`, `Select`, `Combobox`, `Autocomplete`, `DatePicker`, `DateRangePicker`, `TagsInput`, `FileInput`) | `variant?: 'default' \| 'ghost'` | Selects framed field chrome (`default`) vs borderless inline/toolbar placement (`ghost`). |
| **Surface containers** (`Card`) | `variant?: 'default' \| 'subtle'` | Selects primary bounded surfaces (`default`) vs quiet secondary groupings (`subtle`). |
| **Action triggers** (`Button`) | `variant?: 'primary' \| 'secondary' \| 'ghost'` | Expresses action weight; the active theme maps `primary` and `secondary` to matte plates, 3D keycaps, or offset block shadows. |

## Contextual Surface Adaptation (`base` vs `overlay`)

Controls and choice cards (`RadioCard`, `CheckboxCard`, `SwitchCard`) adapt automatically when nested inside floating overlays without extra React props:

```css
[data-theme='frost-dark'] {
  --control-bg: #0c0f17;
  --control-border: rgb(255 255 255 / 0.12);
}

[data-theme='frost-dark'] [data-surface='overlay'] {
  --control-bg: rgb(255 255 255 / 0.05);
  --control-border: rgb(255 255 255 / 0.16);
}
```

- **Base context:** Recessed plates (`--control-bg`) and borders (`--control-border`) are calibrated against `--bg-canvas` and `--bg-surface`.
- **Overlay context (`[data-surface="overlay"]`):** Floating containers (`Modal`, `Drawer`, `Popover`, `HoverCard`, `DatePicker`) set `data-surface="overlay"`, switching nested controls to translucent glass veils in `Frost` and stepped opaque plates in `Soft` and `Pixel`.

## Semantic Token Dictionary & Palette Rules

Components reference only semantic tokens — never raw palette steps or `#hex` literals:

- **Surfaces:** `--bg-shell`, `--bg-aside`, `--bg-canvas`, `--bg-surface`, `--bg-surface-subtle`, `--bg-surface-raised`, `--bg-overlay`
- **Foregrounds:** `--fg-primary`, `--fg-secondary`, `--fg-muted`, `--fg-subtle`, `--fg-disabled`, `--fg-on-accent`
- **Borders:** `--border-subtle`, `--border-default`, `--border-strong`
- **Controls & Choice Cards:** `--control-bg`, `--control-border`, `--control-border-hover`, `--choice-card-bg`, `--choice-card-bg-selected`, `--choice-card-border`, `--choice-card-border-selected`
- **Accent & Statuses:** `--accent-{solid,solid-hover,solid-active,soft-bg,soft-fg,border,signal}` and `--status-{info,success,warning,danger}-{solid,soft-bg,soft-fg,border,signal}`

### Strict Palette Boundaries

1. **`Button` tones are restricted to `tone?: 'accent' | 'neutral' | 'danger'`.** Action triggers initiate operations: primary brand CTAs (`accent`), standard workspace actions (`neutral`), or destructive confirmations (`danger`). Never introduce `success`, `warning`, or `info` buttons.
2. **Semantic statuses (`info | success | warning | danger`) belong to markers, feedback, and validation.** Passive status components (`Badge`, `Indicator`, `Alert`, `Toast`, `Progress`) use `status` to report system state; data-entry controls (`FormField`, `Input`, `Select`, `Textarea`) use `status="danger" | "warning"` for validation.
3. **Solid-fill ink uses `--fg-on-accent` and per-status on-solid tokens.** High-luminance pastel (`soft-dark`) and phosphor (`pixel-dark`) solids automatically pair with dark espresso/carbon ink where white text would fail WCAG contrast.

```tsx
<Button variant="primary" tone="accent">Publish release</Button>
<Button variant="secondary" tone="neutral">Save draft</Button>
<Button variant="primary" tone="danger">Delete workspace</Button>

<Badge status="success">Verified</Badge>
<Alert status="warning" title="Rate limit approaching" />
```
