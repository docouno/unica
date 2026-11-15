# Themes and Roles

Unica separates **component roles** (declared in application JSX) from **material physics** (owned by the active theme). Applications express workflow hierarchy and intent; the theme determines whether that role renders as warm editorial matte paper, saturated color with soft light and frosted overlays, or sharp-corner terminal geometry.

## Flat Tokens & Reference Presets

Themes are flat semantic token dictionaries rather than per-component style-prop matrices. One structural stylesheet defines component layout and state hooks, while six reference presets bind values on `:root` or `[data-theme="<preset>"]`:

```ts
export type ThemePreset =
  | 'soft-dark'
  | 'soft-light'
  | 'frost-dark'
  | 'frost-light'
  | 'pixel-dark'
  | 'pixel-light';

// Import ThemePreset, ThemePresetMeta, and THEME_PRESETS from @docouno/unica.
// Apply a preset with <div data-theme="frost-dark">...</div>.
```

| Family | Presets | Material & Surface Physics |
| --- | --- | --- |
| **Soft** | `soft-dark`, `soft-light` | Dusty slate (`Dark`) and warm cream-vellum (`Light`) matte surfaces, luminous pastel solids, borderless pills and callouts, soft matte secondary plates, and 100% opaque floating overlays. |
| **Frost** | `frost-dark`, `frost-light` | Obsidian (`Dark`) and crystalline alabaster (`Light`) neutrals, deep violet CTAs with a vertical contact edge and diffuse ambient light, quiet neutral and danger solids, `1px`-rimmed jewel badges, and `backdrop-filter` frosted glass exclusively on floating overlays. |
| **Pixel** | `pixel-dark`, `pixel-light` | Carbon-phosphor (`Dark`) and drafting-paper (`Light`) surfaces, `0px` sharp corners (`--radius-factor: 0`), `JetBrains Mono` base typography, `1px` structural borders, `8px` corner registration ticks, coordinate grids, flat signal buttons, and crisp `{6px, 6px}` `blur: 0` block shadows on floating panels. |

`THEME_PRESETS` exposes the six presets and their display metadata. Custom product themes override semantic `--*` variables on a DOM subtree without touching component CSS; there is no exported `ThemeConfig` object API.

Primary accent buttons use `--btn-primary-fill`, `--btn-primary-fill-hover`, and `--btn-primary-fill-active` for their background images. The matching `--btn-primary-shadow`, `--btn-primary-shadow-hover`, and `--btn-primary-shadow-active` recipes set depth and ambient light; `--btn-primary-press-transform` sets the press travel. Soft and Pixel buttons are flat: solid fills, no external depth, and no displacement. Soft responds with color; Pixel uses an immediate color/edge change. Frost primary buttons have a `2px` vertical contact edge and press travel; secondary buttons use a quieter `1px` contact edge and travel with a small diffuse shadow. Both collapse their external shadow on press. Ghost and selected controls remain stationary. Tone changes color, not press distance.

Frost accent combines diagonal violet color stops, a colored lower edge, and diffuse light that brightens on hover and recedes on press. Its `--btn-primary-backlight-color` supplies a localized light that follows a fine pointer outside the opaque face. `--btn-primary-backlight-reach` enables approach response: `100px` in Frost and `0px` in Soft/Pixel, which also use a transparent light color. Proximity is measured from the nearest edge, including before hover; approach preserves the rest plate and fades with distance. The spot geometry controls the visibly lit area within that sampling range. Pointer light is absent during selection, loading, disabled and active states, on touch, in forced colors, and with reduced motion. Neutral and danger primary actions retain their solid colors and use `--btn-primary-contact-shadow`. Secondary plates use the separate `--btn-secondary-*` recipe, including state shadows and `--btn-secondary-press-transform`. `--btn-material-depth` controls selected inset depth, and `--btn-state-duration` controls theme response timing. Corner geometry never determines material physics.

Material response can require shared input sampling as well as CSS. Keep input services separate from the material recipe: components retain the same action, keyboard, form, and availability semantics across themes. The live prototype demonstrates proximity with a family-local shared sampler; it does not export a provider or establish the future library service API.

Floating surfaces use `--overlay-border` for their perimeter and `--overlay-rim-mask` for the
highlight's extent. Frost uses a transparent perimeter and a soft highlight that follows the
upper corners, with a lighter translucent fill and popover shadow. Soft and Pixel keep fully
opaque fills and their existing edge and shadow treatments. Material choices are theme tokens;
the component specimen presents one current design per preset.

## Role-Based API Over Decorative `appearance`

Exposing low-level material switches (`solid`, `soft`, `glass`, `lamp`, `outline`) on components couples product code to a single visual style and breaks cross-theme portability. Unica replaces decorative `appearance` props with strict role contracts:

| Component Category | Public Variant Prop | Contract |
| --- | --- | --- |
| **Status markers** (`Badge`, `Tag`, `Chip`, `Indicator`) | *None (`0` variants)* | Material treatment (borderless pastel in `Soft`, `1px` jewel rim + glowing dot in `Frost`, `1px` sharp frame in `Pixel`) is 100% theme-owned. |
| **Overlays** (`Modal`, `Drawer`, `Popover`, `Tooltip`, `HoverCard`, `Menu`, `Toast`) | *None (`0` variants)* | Floating panels automatically render as frosted glass in `Frost` and opaque elevated plates in `Soft` and `Pixel`. |
| **Binary, choice-card & continuous controls** (`Checkbox`, `Radio`, `Switch`, `CheckboxCard`, `RadioCard`, `SwitchCard`, `Slider`, `RangeSlider`, `SegmentedControl`, `Progress`) | *None (`0` variants)* | Track fills, `--choice-card-*` plates, thumb contrast, and edge rules follow theme tokens directly (with automatic `[data-surface="overlay"]` adaptation). |
| **Fields & pickers** (`Input`, `Textarea`, `NumberInput`, `Select`, `Combobox`, `Autocomplete`, `DatePicker`, `DateRangePicker`, `TagsInput`, `FileInput`) | `variant?: 'default' \| 'ghost'` | Selects framed field chrome (`default`) vs quiet inline/toolbar placement (`ghost`). Minimal field cues are defined by the component family; Ghost does not require every edge to be absent. |
| **Surface containers** (`Card`) | `variant?: 'default' \| 'subtle'` | Selects primary bounded surfaces (`default`) vs quiet secondary groupings (`subtle`). |
| **Action triggers** (`Button`, `IconButton`) | `variant?: 'primary' \| 'secondary' \| 'ghost'` | Expresses action weight. Soft and Pixel use flat plates with color/edge feedback; Frost uses shallow vertical elevation on primary/secondary, with ambient light on primary accent. Ghost stays quiet and stationary. |

## Contextual Surface Adaptation (`base` vs `overlay`)

Controls and choice cards (`RadioCard`, `CheckboxCard`, `SwitchCard`) adapt automatically when nested inside floating overlays without extra React props:

```css
[data-theme='frost-dark'] {
  --_base-control-bg: #0c0f17;
  --_overlay-control-bg: rgb(255 255 255 / 0.05);
}

:root,
[data-theme],
[data-surface='base'] {
  --control-bg: var(--_base-control-bg);
}

[data-surface='overlay'] {
  --control-bg: var(--_overlay-control-bg);
}
```

- **Base context:** Recessed plates (`--control-bg`) and borders (`--control-border`) are calibrated against `--bg-canvas` and `--bg-surface`.
- **Overlay context (`[data-surface="overlay"]`):** Floating containers (`Modal`, `Drawer`, `Popover`, `HoverCard`, `DatePicker`) set `data-surface="overlay"`, switching nested controls to translucent glass veils in `Frost` and stepped opaque plates in `Soft` and `Pixel`.

`--control-border-focus` is the neutral active edge for fields, distinct from the resting and hover borders. Its six theme values remain readable on Base and Overlay. It changes the existing frame or baseline; `--focus-ring-color` remains the separate, stronger keyboard-navigation contour. Input consumes this recipe in both Default and Ghost; Ghost keeps a transparent fill throughout rest, hover, and focus. Other field families adopt the recipe as their own contracts are refined.

## Semantic Token Dictionary & Palette Rules

Components reference only semantic tokens — never raw palette steps or `#hex` literals:

- **Surfaces:** `--bg-shell`, `--bg-aside`, `--bg-canvas`, `--bg-surface`, `--bg-surface-subtle`, `--bg-surface-raised`, `--bg-overlay`, `--scrim-bg`
- **Foregrounds:** `--fg-primary`, `--fg-secondary`, `--fg-muted`, `--fg-subtle`, `--fg-disabled`, `--fg-on-accent`, `--fg-on-neutral`, `--fg-on-{info,success,warning,danger}`
- **Borders:** `--border-subtle`, `--border-default`, `--border-strong`, `--binary-border`, `--binary-border-hover`
- **Controls & Choice Cards:** `--control-bg`, `--control-border`, `--control-border-hover`, `--control-border-focus`, `--choice-card-bg`, `--choice-card-bg-selected`, `--choice-card-border`, `--choice-card-border-selected`
- **Accent, Neutral & Statuses:** `--accent-{solid,solid-hover,solid-active,soft-bg,soft-fg,border,signal}`, `--neutral-{solid,solid-hover,solid-active,soft-bg,soft-fg,border,signal}`, and `--status-{info,success,warning,danger}-{solid,soft-bg,soft-fg,border,signal}`

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
