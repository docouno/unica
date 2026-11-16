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

Keyboard hints use the neutral `--kbd-cap-bg` and `--kbd-cap-border` tokens. Their `--kbd-cap-shadow` recipe stays inside the keycap: a 1px lower edge in Soft, a 1px lower edge plus a top highlight in Frost, and a 2px lower step in Pixel. Keycaps do not add glass, external elevation, or their own press animation. Nested actions supply contextual foreground and contour over a transparent keycap face while retaining ownership of focus, motion, and availability.

Inline code uses `--code-font-scale`: `0.9` in Soft/Frost to balance JetBrains Mono with Inter, and `1` in Pixel to preserve the surrounding monospace size. This typography recipe is independent of corner geometry. Its plate uses neutral/status soft colors, `--pill-border-width`, and `--radius-xs`. `--code-plate-tint` is an 8% ink step: explicit tones mix their foreground into their soft background, while inherited Code reads the painted surface's ready-made `--code-context-bg/fg/border`. Card publishes a neutral ink veil; Alert publishes its status ink veil; `[data-surface="overlay"]` publishes neutral ink over the actual floating material. Transparent text/quotes preserve context, an opaque Card resets it, and a theme/base boundary clears it. The neutral fallback matches explicit neutral. Code has no blur, shadow, or motion.

Block quotations use `--blockquote-rail-width`, `--blockquote-rail-style`, and `--blockquote-rail-radius` for their logical leading edge: a rounded 3px solid rail in Soft, a straight 2px solid rail in Frost, and a straight 3px double rail in Pixel. The neutral rail uses `--border-strong`; semantic rails use their status signal. The quotation remains transparent in every tone; only the rail and optional glyphs carry semantic color. Quote text and attribution retain neutral foregrounds, without another filled panel, shadows, or backdrop filtering in document flow.

The native scrollbar recipe has separate `--scrollbar-thumb-opacity`, `--scrollbar-thumb-hover-opacity`, and `--scrollbar-thumb-active-opacity` values in each preset. Soft stays quiet, Frost gives the glass more space, and Pixel keeps a firmer indicator. Geometry follows `--radius-full` where the browser exposes native scrollbar parts. See [Native Scrollbars](scrollbars.md) for states, dimensions, and platform fallbacks.

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

## Activity Material

Progress reuses the contextual `--control-bg` and `--control-border` track recipe. It uses semantic `--*-signal` paint for thin measured fills; action-button solids are not assumed to remain legible at these sizes. The theme supplies `--progress-fill-light`, `--progress-fill-shadow`, `--progress-tip-opacity`, `--progress-tip-light`, `--progress-value-duration`, and `--progress-tip-motion`. Unknown work uses `--progress-wait-base` and `--progress-wait-stripe`: the same full accent signal as measured progress plus an alternating 84% signal / 16% base control background mixture, forming a continuous candy stripe. The unknown state retains the active accent’s visual weight; the pattern supplies the distinction. The pair resolves at the theme boundary and remains stable on floating surfaces. This is a local waiting-material recipe, not a change to the semantic palette.

Soft keeps a matte capsule. Frost adds restrained vertical light and a short glow trailing the measured leading edge, with a quieter treatment on light surfaces. Pixel keeps a flat rectangle and immediate value changes. The tip is absent at zero and in the indeterminate phase; unknown work uses a full-width waiting texture with the same vertical light and inset shading as the measured fill, without a measured endpoint. The tip moves only when the owner explicitly marks work active; a stored fraction alone does not imply activity. A completed range fades the tip over 600ms without changing its status. Reduced motion removes travel while retaining the distinct waiting texture. Spinner uses a gathering/releasing arc in Soft/Frost and eight sequential square cells in Pixel, selected through `--spinner-round-display` and `--spinner-pixel-display`. Neither borrows button depth or glow. `ProgressCircle` shares Spinner’s geometry, icon sizes and foreground tones. Known values fill the arc or accumulate in the Pixel cells, including a partial leading cell; they have no looping animation.

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

## Binary-control material feedback

Checkbox and Radio use the contextual control well, `--binary-border`, and the accent/on-accent pair for selection. Their state feedback does not translate or scale the control. Radio remains circular in every preset.

Switch keeps a light `--switch-thumb-bg` in both positions. Dedicated off/on track recipes preserve thumb separation; the light presets use a medium neutral off track so the thumb remains readable without a second outline. The track's essential outer edge uses the binary border when off and the accent signal when on. `--switch-travel-duration` owns lateral thumb travel: 160ms in Soft, 140ms in Frost, and 0ms in Pixel. Reduced motion makes travel immediate. This material decision is independent of corner geometry; it is not derived from `--radius-factor`.

### Segmented selection

Segmented controls use a continuous `--segmented-rail-bg` trough and a stationary, borderless selected plate with `--segmented-thumb-bg`. Dark rails sit below the canvas in luminance. The exposed rail background forms the perimeter around the inset plates; neither the rail nor the selected plate adds a differently colored outline. Their selected plates sit near the secondary surface range, so a small filter does not compete with nearby actions. Light rails retain their warm or cool tint and near-white selection. The fill, inset geometry, and primary label carry the selected treatment together. Do not add a permanent focus-like contour to compensate for a quiet surface. All labels keep the same weight and geometry when selection changes.

`--segmented-thumb-shadow` supplies only Frost's small contact shadow; Soft and Pixel have no shadow. No theme translates or scales a pressed segment. `--segmented-state-duration` sets color feedback to 120ms in Soft, 140ms in Frost, and 0ms in Pixel; reduced motion removes interpolation. Selection moves atomically between cells, without a sliding plate. Hover and held press use low-opacity foreground veils over the existing material, with a smaller change on the selected cell.

These recipes remain stable on Base and Overlay surfaces. Floating parents own glass and elevation; an inset control does not add another blur. Disabled selection retains a quieter fill, read-only selection retains normal readability, and keyboard focus alone adds a separate 2px contour. Forced colors use a system Highlight/HighlightText selected plate. The 3px inset and concentric 4/5/7px inner radii remain independent of the material. A permanent 3px grid gap separates adjacent cells in both orientations, matching the outer inset: selected and hovered or pressed fills never merge. It increases intrinsic group width (or vertical height) by 3px per pair; full-width rows distribute the remaining space after gaps while preserving cell minimums. Geometry stays fixed during interaction. The 2px keyboard-focus outline leaves 1px of the gutter visible. Horizontal rails keep their 30/40/48px outer heights; plates are 24/34/42px high. Coarse pointers use a 48px rail with 42px plates and invisible input targets expanded by 1px on each side to retain at least 44px hit areas without overlapping adjacent targets. Small controls retain room for 120% text by omitting redundant vertical plate padding.

The subtle default fills are the approved visual design reference. This approval does not establish non-text state contrast conformance. Text and keyboard-focus contrast remain measurable separately. The default selected fill/rail pairs remain below 3:1; their assessment under the [accessibility contract](support-and-accessibility.md) remains an explicit production-implementation requirement. Do not treat removal of the border as an automatic conformance result or silently change the approved visual treatment to resolve it.

Overflowing rails consume the [compact native scrollbar recipe](scrollbars.md) on the rail itself: a 10px gutter with a 4px visible thumb on supported desktop engines, transparent track, and a thin native fallback. Only an overflowing rail reserves one extra pixel at its inline end to protect the outer focus edge from native scroll-extent rounding. Horizontal scrolling is a protective fallback for localized labels; an explicit vertical layout remains the preferred alternative when the row does not fit.

## Identity group geometry

`--avatar-group-overlap-factor` selects the geometry of compact identity groups. Soft and Frost use `1`: frames overlap with a true transparent 2px cutout that exposes the current surface, including glass. Pixel uses `0`: complete square frames sit 2px apart, retaining all four borders. The factor controls grouping geometry only; Avatar and AvatarGroup have no press motion or status-color axis. The current design reference lives in `apps/playground/src/prototypes/avatar/README.md`.
