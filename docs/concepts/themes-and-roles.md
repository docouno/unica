# Themes and Roles

Unica separates **component roles** (declared in application JSX) from **material physics** (owned by the active theme). Applications express workflow hierarchy and intent; the theme determines whether that role renders as warm editorial matte paper, saturated color with soft light and frosted overlays, or sharp-corner terminal geometry.

## Flat Tokens & Reference Presets

Themes are flat semantic token dictionaries. Component styles define layout and state hooks, while six reference presets bind token values on `:root` or `[data-theme="<preset>"]`.

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
| **Soft** | `soft-dark`, `soft-light` | Warm matte graphite (`Dark`) and clean limestone paper (`Light`) surfaces, muted ochre and botanical accents, borderless pills and callouts, soft matte secondary plates, and 100% opaque floating overlays. |
| **Frost** | `frost-dark`, `frost-light` | Deep obsidian-sapphire (`Dark`) and crystalline alabaster (`Light`) neutrals, deep violet CTAs with a vertical contact edge and diffuse ambient light, quiet neutral and danger solids, `1px`-rimmed jewel badges, and `backdrop-filter` frosted glass exclusively on floating overlays. |
| **Pixel** | `pixel-dark`, `pixel-light` | Cozy twilight-plum (`Dark`) and soft cloud-paper (`Light`) surfaces, `0px` sharp corners (`--radius-factor: 0`), `JetBrains Mono` base typography, `1px` structural borders, `5×2px` integer corner registration ticks, coordinate grids, flat signal buttons, and crisp hue-shifted `{6px, 6px}` `blur: 0` block shadows on floating panels. |

`THEME_PRESETS` exposes the six presets and their display metadata, and `getUnicaRootProps` builds the matching `data-theme` attribute for server or client root containers. React Server Components can import `THEME_PRESETS`, `defineGlyph`, and `getUnicaRootProps` from the package root under the `react-server` condition. Use `UnicaProvider` inside a client boundary.

### Token Tiers & Custom Brand Theme Contract

Custom CSS properties in `packages/ui/src/styles.css` follow a strict three-tier ownership contract:

- **Tier 1 — Public semantic tokens (151):** Core palette (`--bg-*`, `--fg-*`, `--fg-on-*`, `--border-*`, `--accent-*`, `--neutral-*`, `--status-*`), contextual surfaces (`--control-*`, `--card-*`, `--choice-card-*`, `--scrim-bg`, `--surface-shadow`), typography (`--font-scale`, `--font-family-{base,mono}`, `--text-size-*`), geometry (`--radius-{factor,circular,xs,full}`, `--size-{s,m,l}-*`, `--surface-{s,m,l}-*`, `--space-{0,2,4,8,12,16,24,32,48,64}`, `--container-{s,m,l}`), focus (`--focus-ring-color`), and stacking (`--z-{content,sticky}`).
- **Tier 2 — Public contextual & integration hooks:** Contextual tokens `--code-context-{bg,fg,border}`, `--indicator-separator-color`, `--action-context-ink`, `--table-row-selected-bg`, and `--motif-canvas-grid`, plus runtime and override hooks (`--anchor-width`, `--overlay-available-height`, `--overlay-available-width`, `--badge-max-width`, `--chip-max-width`, `--tag-max-width`, `--tag-group-gap`, `--tag-field-radius`, `--element-radius`, `--kbd-bg`, `--kbd-border`, `--kbd-fg`, `--kbd-forced-fg`, `--kbd-shadow`).
- **Private theme & component recipes (`--_*`):** Internal mechanics for the six built-in presets (`--_btn-*`, `--_overlay-*`, `--_progress-*`, `--_switch-*`, `--_segmented-*`, etc.) and component-local style properties (`--_type-*`, `--_box-*`, `--_badge-*`, etc.).

**Custom brand themes:** Override **Tier 1 and Tier 2** tokens on `[data-theme]` or an enclosing DOM container to tailor brand accents, surfaces, typography, spacing, or container widths. Internal `--_*` recipes belong to the built-in preset engine and carry **no external stability guarantee** for third-party stylesheets.

In-flow Alert surfaces use status soft backgrounds and readable status ink without shadow or backdrop filtering. `--_alert-border-width` is 0px in Soft and 1px in Frost/Pixel. `--_alert-edge-width` is 0px in Soft/Frost and 2px in Pixel, setting the total logical leading-border width to the larger of the perimeter and edge recipes. The leading edge uses the semantic border color and mirrors in RTL. Status glyphs use the readable soft foreground rather than the general signal color; the latter is not calibrated for every tinted ground. An enclosing overlay owns all glass and elevation.

Primary accent buttons use `--_btn-primary-fill`, `--_btn-primary-fill-hover`, and `--_btn-primary-fill-active` for their background images. The matching `--_btn-primary-shadow`, `--_btn-primary-shadow-hover`, and `--_btn-primary-shadow-active` recipes set depth and ambient light; `--_btn-primary-press-transform` sets the press travel. Soft and Pixel buttons are flat: solid fills, no external depth, and no displacement. Soft responds with color; Pixel uses an immediate color/edge change. Frost primary buttons have a `2px` vertical contact edge and press travel; secondary buttons use a quieter `1px` contact edge and travel with a small diffuse shadow. Both collapse their external shadow on press. Ghost and selected controls remain stationary. Tone changes color, not press distance.

Neutral Ghost hover uses `--_btn-ghost-neutral-bg-hover`, a translucent 10% primary foreground layer over the containing surface. Press strengthens the layer. The same recipe provides visible feedback on Base and Overlay, including light presets where raised surfaces are close to the surrounding color.

Frost accent combines diagonal violet color stops, a colored lower edge, and diffuse light that brightens on hover and recedes on press. Its `--_btn-primary-backlight-color` supplies a localized light that follows a fine pointer outside the opaque face. `--_btn-primary-backlight-reach` enables approach response: `100px` in Frost and `0px` in Soft/Pixel, which also use a transparent light color. Proximity is measured from the nearest edge, including before hover; approach preserves the rest plate and fades with distance. The spot geometry controls the visibly lit area within that sampling range. Pointer light is absent during selection, loading, disabled and active states, on touch, in forced colors, and with reduced motion. Neutral and danger primary actions retain their solid colors and use `--_btn-primary-contact-shadow`. Secondary plates use the separate `--_btn-secondary-*` recipe, including state shadows and `--_btn-secondary-press-transform`. `--_btn-material-depth` controls selected inset depth, and `--_btn-state-duration` controls theme response timing. Corner geometry never determines material physics.

Button and IconButton use the library's shared document-scoped pointer sampler. The material response tracks the nearest visible edge so an overlapping surface suppresses light from a covered edge. The control's hit area and focus ring remain stationary during Frost press travel. Action, keyboard, form, and availability semantics stay the same across the themes. [Button and IconButton](../components/button.md)

Keyboard hints use the neutral `--_kbd-cap-bg` and `--_kbd-cap-border` tokens. Their `--_kbd-cap-shadow` recipe stays inside the keycap: a 1px lower edge in Soft, a 1px lower edge plus a top highlight in Frost, and a 2px lower step in Pixel. Keycaps do not add glass, external elevation, or their own press animation. Nested actions supply contextual foreground and contour over a transparent keycap face while retaining ownership of focus, motion, and availability.

Painted status surfaces can publish `--action-context-ink` for supporting actions. Secondary/ghost neutral Buttons and IconButtons automatically derive a local label, plate, contour, and availability palette; their neutral action meaning remains unchanged. Explicit accent/danger and primary neutral actions retain their own palettes. `--_btn-context-ink-strength` uses 80% context ink with primary ink; `--_btn-context-plate-tint`, `--_btn-context-hover-tint`, and `--_btn-context-active-tint` use 8/12/16% ink veils. `--_btn-context-border-tint` is 28% in Soft/Frost and 44% in Pixel. Existing theme physics remain authoritative. The nearest Card, theme, or Base/Overlay boundary clears the external action context; transparent content preserves it. Contextual action/link focus uses the enclosing ink. This is inheritance from a painted surface, not an additional status tone on an action.

Inline code uses `--_code-font-scale`: `0.9` in Soft/Frost to balance JetBrains Mono with Inter, and `1` in Pixel to preserve the surrounding monospace size. This typography recipe is independent of corner geometry. Its plate uses neutral/status soft colors, `--_pill-border-width`, and `--radius-xs`. `--_code-plate-tint` is an 8% ink step: explicit statuses mix their foreground into their soft background, while inherited Code reads the painted surface's ready-made `--code-context-bg/fg/border`. Card publishes a neutral ink veil; Alert publishes its status ink veil; `[data-surface="overlay"]` publishes neutral ink over the actual floating material. Transparent text/quotes preserve context, a Card establishes its own ink veil, and a theme/base boundary clears it. The neutral fallback matches explicit neutral. Code has no blur, shadow, or motion.

Block quotations use `--_blockquote-rail-width`, `--_blockquote-rail-style`, and `--_blockquote-rail-radius` for their logical leading edge: a rounded 3px solid rail in Soft, a straight 2px solid rail in Frost, and a straight 3px double rail in Pixel. The neutral rail uses `--border-strong`; semantic rails use their status signal. The quotation remains transparent in every status; only the rail and optional glyphs carry semantic color. Quote text and attribution retain neutral foregrounds, without another filled panel, shadows, or backdrop filtering in document flow.

In-flow disclosure uses a clear resting row and neutral pointer feedback across Base and Overlay. `--_disclosure-divider-color` supplies the single-pixel boundary between Accordion sections. Soft uses a subtle edge, Frost uses a translucent neutral edge, and Pixel uses the default structural edge. `--_disclosure-duration` sets the reveal and indicator duration to 180ms in Soft, 140ms in Frost, and immediate state changes in Pixel. Reduced motion also switches instantly. The surrounding surface owns glass and elevation, and the row stays stationary during a press.

The Stepper prototype uses `--_stepper-current-shadow` for a small static accent glow on the valid current marker in Frost, stronger in Dark than in Light. Soft and Pixel use a matte marker. The current marker edge and focus outline supply their own visibility in every material. The glow adds no elevation, motion, or backdrop filter. See the [Stepper design reference](../../apps/playground/src/prototypes/stepper/README.md).

The native scrollbar recipe has separate `--_scrollbar-thumb-opacity`, `--_scrollbar-thumb-hover-opacity`, and `--_scrollbar-thumb-active-opacity` values in each preset. Soft stays quiet, Frost gives the glass more space, and Pixel keeps a firmer indicator. Geometry follows `--radius-full` where the browser exposes native scrollbar parts. See [Native Scrollbars](scrollbars.md) for states, dimensions, and platform fallbacks.

Floating surfaces use `--_overlay-border` for their perimeter and `--_overlay-rim-mask` for the
highlight's extent. Frost uses a transparent perimeter and a soft highlight that follows the
upper corners, with a lighter translucent fill and popover shadow. Soft and Pixel keep fully
opaque fills and their existing edge and shadow treatments. Material choices are theme tokens;
the component specimen presents one current design per preset.

Full-height side drawers can use `--_overlay-rim-drawer-inline`. Frost places its highlight along the free vertical edge, which mirrors with the docked placement in RTL. The default rim supplies the treatment in the other presets.

Floating elevation is calibrated per family through `--_overlay-shadow-tooltip`,
`--_overlay-shadow-hover`, `--_overlay-shadow-popover`, `--_overlay-shadow-drawer` and
`--_overlay-shadow-modal`. A small passive preview needs a tighter shadow footprint than a
large panel. Dark Soft/Frost tooltips use compact contact and ambient shadows; Dark Pixel
uses a 3px hard tooltip offset while Light Pixel retains 4px. Frost HoverCard uses a short,
quiet shadow in both color schemes without changing the shared glass fill or blur. These
recipes belong to the theme, not to component material variants or theme-name selectors.
Drawer can use the theme's optional `--_overlay-shadow-drawer-right`,
`--_overlay-shadow-drawer-down` and `--_overlay-shadow-drawer-up` casts where the
attachment edge changes. Pixel defines these so the hard shadow extends into the
workspace. The diffuse presets reuse `--_overlay-shadow-drawer` on all four sides.

The floating surface owns its perimeter, glass highlight, corner marks and external shadow.
When space is limited, an inner reading area owns scrolling. Decorative material layers must
remain fixed to the surface rather than travel with its content. Pointer hit-area bridges
also stay outside the scroll owner so they cannot create phantom scrollbars.

## Structural Component Defaults

`UnicaProvider` is the single wrapper-less provider for Unica React configuration (`theme`, `overrides`, `portalContainer`, and `iconAdapter`) and renders its children directly without emitting DOM nodes. Pass either a preset string (`theme="frost-light"`) or a `ThemeConfig` object (`{ preset, defaults }`). Apply the matching CSS preset to your DOM container with `getUnicaRootProps({ theme })` (or `data-theme` directly in CSS-only usage). Omitting `theme` returns `{}` with no own `data-theme` key so spreading never clears an existing attribute.

```tsx
import '@docouno/unica/styles.css';
import { UnicaProvider, getUnicaRootProps, type ThemeConfig } from '@docouno/unica';
import type { ReactNode } from 'react';

const theme = { preset: 'frost-light', defaults: { Icon: { size: 'm' } } } satisfies ThemeConfig;

export function ThemedArea({ children }: { children: ReactNode }) {
  return (
    <UnicaProvider theme={theme} overrides={{ Icon: { size: 's' } }}>
      <main {...getUnicaRootProps({ theme })}>{children}</main>
    </UnicaProvider>
  );
}
```

For each configurable property the first defined value wins, in this order.

1. The instance prop.
2. An explicit prop contributed by the containing group.
3. The provider's effective `overrides`.
4. The active theme configuration's `defaults`.
5. The component's built-in default.

A nested provider inherits the parent's theme configuration unless it supplies a replacement (`theme="pixel-dark"` replaces `ThemeConfig` as a whole and resets theme defaults). Overrides inherit by family and property, with defined inner values winning. `portalContainer` and `iconAdapter` also inherit when omitted. Without a provider, React uses the built-in `soft-dark` configuration, `document.body` for portals, the `phosphor` icon adapter, and component defaults.

When nesting a different `[data-theme]` inside an outer theme, pass a local `portalContainer` inside that themed DOM subtree (`<UnicaProvider theme="pixel-dark" portalContainer={scopedHost}>`) so portaled surfaces inherit the nested CSS custom properties and `color-scheme` rather than falling back to `document.body`. See [Portal](../components/portal.md#nested-themes-and-portals).

`UnicaComponentDefaults` contains only properties declared configurable by each family. Standalone [Icon](../components/icon.md) resolves `size` (`inherit`, `s`, `m`, `l`) through these defaults. A slot glyph uses the size supplied by its owner or inherits the owner's text size. [Link](../components/link.md) resolves its `size` (`LinkSize`) through the same defaults, with `inherit` as its built-in value. Behavior, accessibility attributes, and content remain the responsibility of each component and its caller.

## CSS Layers

Import `@docouno/unica/styles.css` once at the application entry. The stylesheet declares the order `unica.base`, `unica.tokens`, `unica.components`, `unica.utilities`. These layers hold the base reset, theme and context tokens, colocated component rules, and shared utilities, respectively. For normal declarations a later layer wins over an earlier layer. Unlayered application styles can override library styles.

Production CSS builds lower vendor prefixes and nested rules for the Baseline browser floor (`Chrome/Edge 114+`, `Firefox 125+`, `Safari/iOS 17+`) while preserving `:dir()` selectors under `@supports selector(:dir(rtl))` instead of rewriting them into language heuristics. Shared mark-status tokens bind directly on `[data-unica-mark-status]` inside `@layer unica.tokens`.

### Overlay surface utility

`.unica-overlay-surface` paints the same theme material used by [Popover](../components/popover.md). It provides the fill, edge, radius, shadow, backdrop filter, and decorative highlight and corner marks. Apply it with `data-surface="overlay"` to switch descendant controls to the overlay context. The host supplies positioning, layout, and semantics. Use a positioned host so the utility's two decorative pseudo-elements follow its bounds.

```html
<div class="unica-overlay-surface release-summary" data-surface="overlay">
  This page is scheduled for publication.
</div>
```

```css
.release-summary {
  position: relative;
  padding: var(--surface-m-padding);
  --element-radius: var(--surface-m-radius);
}
```

The host's `--element-radius` defaults to `--surface-s-radius`. A local override also supplies the radius to descendants that consume the hook, such as Skeleton. The opaque surface token is the fallback when backdrop filtering is unavailable. Forced colors use a system canvas and border.

## Role-Based API Over Decorative `appearance`

Exposing low-level material switches (`solid`, `soft`, `glass`, `lamp`, `outline`) on components couples product code to a single visual style and breaks cross-theme portability. Unica replaces decorative `appearance` props with strict role contracts:

| Component Category | Public Variant Prop | Contract |
| --- | --- | --- |
| **Status markers** (`Badge`, `Tag`, `Chip`, `Indicator`) | *None (`0` variants)* | Themes own material treatment. [Indicator](../components/indicator.md) uses semantic solid fill and matching ink for counts, signal color for dots, and a surface-aware separator. |
| **Overlays** (`Modal`, `Drawer`, `Popover`, `Tooltip`, `HoverCard`, `Menu`, `Toast`) | *None (`0` variants)* | Floating panels automatically render as frosted glass in `Frost` and opaque elevated plates in `Soft` and `Pixel`. |
| **Binary, choice-card & continuous controls** (`Checkbox`, `Radio`, `Switch`, `CheckboxCard`, `RadioCard`, `SwitchCard`, `Slider`, `RangeSlider`, `SegmentedControl`, `Progress`) | *None (`0` variants)* | Track fills, `--choice-card-*` plates, thumb contrast, and edge rules follow theme tokens directly (with automatic `[data-surface="overlay"]` adaptation). |
| **Fields & pickers** (`Input`, `Textarea`, `NumberInput`, `Select`, `Combobox`, `Autocomplete`, `DatePicker`, `DateRangePicker`, `TagsInput`, `FileInput`) | `variant?: 'default' \| 'ghost'` | Selects framed field chrome (`default`) vs quiet inline/toolbar placement (`ghost`). Minimal field cues are defined by the component family; Ghost does not require every edge to be absent. |
| **Surface containers** (`Card`) | `variant?: 'default' \| 'subtle'` | Selects primary bounded surfaces (`default`) vs quiet secondary groupings (`subtle`), with automatic contextual material adaptation. |
| **Action triggers** (`Button`, `IconButton`) | `variant?: 'primary' \| 'secondary' \| 'ghost'` | Expresses action weight. Soft and Pixel use flat plates with color/edge feedback; Frost uses shallow vertical elevation on primary/secondary, with ambient light on primary accent. Ghost stays quiet and stationary. |

## Activity Material

Progress reuses the contextual `--control-bg` and `--control-border` track recipe. It uses semantic `--*-signal` paint for thin measured fills; action-button solids are not assumed to remain legible at these sizes. The theme supplies `--_progress-fill-light`, `--_progress-fill-shadow`, `--_progress-tip-opacity`, `--_progress-tip-light`, `--_progress-value-duration`, and `--_progress-tip-motion`. Unknown work uses `--_progress-wait-base` and `--_progress-wait-stripe`: the same full accent signal as measured progress plus an alternating 84% signal / 16% base control background mixture, forming a continuous candy stripe. The unknown state retains the active accent’s visual weight; the pattern supplies the distinction. The pair resolves at the theme boundary and remains stable on floating surfaces. This is a local waiting-material recipe, not a change to the semantic palette.

Soft keeps a matte capsule. Frost adds restrained vertical light and a short glow trailing the measured leading edge, with a quieter treatment on light surfaces. Pixel keeps a flat rectangle and immediate value changes. The tip is absent at zero and in the indeterminate phase; unknown work uses a full-width waiting texture with the same vertical light and inset shading as the measured fill, without a measured endpoint. The tip moves only when the owner explicitly marks work active; a stored fraction alone does not imply activity. A completed range fades the tip over 600ms without changing its status. Reduced motion removes travel while retaining the distinct waiting texture. Spinner uses a gathering/releasing arc in Soft/Frost and eight sequential square cells in Pixel, selected through `--_spinner-round-display` and `--_spinner-pixel-display`. Neither borrows button depth or glow. `ProgressCircle` shares Spinner’s geometry, icon sizes and foreground tones. Known values fill the arc or accumulate in the Pixel cells, including a partial leading cell; they have no looping animation.

### Tab selection

Tabs use primary ink and a single 2px accent rule. Horizontally the rule is inset from each selected button edge by half its used inline padding, and follows the width of the button as it stretches. Vertically it stays at logical inline-start. The enclosing toolbar or panel supplies any structural divider. Soft uses a warm ochre accent, Frost uses violet, and Pixel pairs berry with square ends and monospaced labels. The same treatment reads over the canvas and inherited Overlay surfaces.

In an overflowing horizontal list, `--_tabs-overflow-fade` sets the fade depth beside an available scroll chevron. Soft and Frost use 12px. Pixel sets it to 0px and sets `--_tabs-overflow-mask` to `none`, leaving a straight cut at the edge of the chevron's clear area. Forced colors and increased contrast use the same straight edge.

Selection and panel changes are immediate. `--_tabs-feedback-duration` applies to the neutral peer hover and held press only. Pixel uses 0ms and reduced motion removes interpolation in every preset. See the [Tabs design reference](../../apps/playground/src/prototypes/tabs/README.md).

## Contextual Surface Adaptation (`base` vs `overlay`)

Cards, controls, and choice cards (`RadioCard`, `CheckboxCard`, `SwitchCard`) adapt automatically when nested inside floating overlays without extra React props:

```css
[data-theme='frost-dark'] {
  --_base-control-bg: rgb(10 10 15 / 0.92);
  --_overlay-control-bg: rgb(255 255 255 / 0.039);
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

Card uses `--card-bg`, `--card-bg-subtle`, `--card-bg-hover`, `--card-border`, `--card-border-subtle`, `--card-border-hover`, and `--card-shadow`. Base maps to the ordinary surface/edge/shadow tokens. In Overlay, Frost uses translucent neutral fills and contours; Soft and Pixel retain their opaque surfaces. The floating panel owns blur and elevation, so every overlay card has no external shadow and never adds its own backdrop filter. Navigation hover uses the contextual hover fill/edge; held press uses the contextual subtle fill and hover edge. Text, controls, and the independent keyboard focus ring remain fully opaque. Theme and explicit Base boundaries reset the recipe; ordinary card nesting does not change context. See the [Card contract](../components/card.md) for composition and focus behavior.

`--control-border-focus` is the neutral active edge for fields, distinct from the resting and hover borders. Its six theme values remain readable on Base and Overlay. It changes the existing frame or baseline; `--focus-ring-color` remains the separate, stronger keyboard-navigation contour. Input consumes this recipe in both Default and Ghost; Ghost keeps a transparent fill throughout rest, hover, and focus. Other field families adopt the recipe as their own contracts are refined.

## Semantic Token Dictionary & Palette Rules

Components reference only semantic tokens — never raw palette steps or `#hex` literals:

- **Surfaces:** `--bg-shell`, `--bg-aside`, `--bg-canvas`, `--bg-surface`, `--bg-surface-subtle`, `--bg-surface-raised`, `--bg-overlay`, `--scrim-bg`
- **Foregrounds:** `--fg-primary`, `--fg-secondary`, `--fg-muted`, `--fg-subtle`, `--fg-disabled`, `--fg-on-accent`, `--fg-on-neutral`, `--fg-on-{info,success,warning,danger}`
- **Borders:** `--border-subtle`, `--border-default`, `--border-strong` (binary controls consume internal `--_binary-border` and `--_binary-border-hover`)
- **Controls & Choice Cards:** `--control-bg`, `--control-border`, `--control-border-hover`, `--control-border-focus`, `--choice-card-bg`, `--choice-card-bg-selected`, `--choice-card-border`, `--choice-card-border-selected`
- **Accent, Neutral & Statuses:** `--accent-{solid,solid-hover,solid-active,soft-bg,soft-fg,border,signal}`, `--neutral-{solid,solid-hover,solid-active,soft-bg,soft-fg,border,signal}`, and `--status-{info,success,warning,danger}-{solid,soft-bg,soft-fg,border,signal}`

### Strict Palette Boundaries

1. **`Button` tones are restricted to `tone?: 'accent' | 'neutral' | 'danger'`.** Action triggers initiate operations: primary brand CTAs (`accent`), standard workspace actions (`neutral`), or destructive confirmations (`danger`). Never introduce `success`, `warning`, or `info` button tones. Supporting neutral actions may inherit a painted status surface’s palette while retaining their neutral action meaning.
2. **Semantic statuses (`info | success | warning | danger`) belong to markers, feedback, editorial emphasis, and validation.** Passive status components (`Badge`, `Indicator`, `Blockquote`, `Code`, `Alert`, `Toast`, `Progress`) use `status` to report system state; `FormField` and framed fields use `FieldStatus` (`neutral | info | success | warning | danger`, reserving `info` and `success` for async verification outcomes), while binary/range controls use `ControlStatus` (`neutral | danger`) and `Switch` exposes zero `status` prop. See [Feedback and Errors](feedback-and-errors.md).
3. **Solid-fill ink uses `--fg-on-accent` and per-status on-solid tokens.** High-luminance pastel (`soft-dark`) and berry/cozy-pixel (`pixel-dark`) solids automatically pair with deep espresso/plum ink where white text would fail WCAG contrast.

```tsx
<Button variant="primary" tone="accent">Publish release</Button>
<Button variant="secondary" tone="neutral">Save draft</Button>
<Button variant="primary" tone="danger">Delete workspace</Button>

<Badge status="success">Verified</Badge>
<Alert status="warning" role="none">Rate limit approaching</Alert>
```

## Binary-control material feedback

Checkbox and Radio use the contextual control well, `--_binary-border`, and the accent/on-accent pair for selection. Their state feedback does not translate or scale the control. Radio remains circular in every preset.

Switch keeps a light `--_switch-thumb-bg` in both positions. Dedicated off/on track recipes preserve thumb separation; the light presets use a medium neutral off track so the thumb remains readable without a second outline. The track's essential outer edge uses the binary border when off and the accent signal when on. `--_switch-travel-duration` owns lateral thumb travel: 160ms in Soft, 140ms in Frost, and 0ms in Pixel. Reduced motion makes travel immediate. This material decision is independent of corner geometry; it is not derived from `--radius-factor`.

### Segmented selection

Segmented controls use a continuous `--_segmented-rail-bg` trough and a stationary, borderless selected plate with `--_segmented-thumb-bg`. Dark rails sit below the canvas in luminance. The exposed rail background forms the perimeter around the inset plates; neither the rail nor the selected plate adds a differently colored outline. Their selected plates sit near the secondary surface range, so a small filter does not compete with nearby actions. Light rails retain their warm or cool tint and near-white selection. The fill, inset geometry, and primary label carry the selected treatment together. Do not add a permanent focus-like contour to compensate for a quiet surface. All labels keep the same weight and geometry when selection changes.

`--_segmented-thumb-shadow` supplies only Frost's small contact shadow; Soft and Pixel have no shadow. No theme translates or scales a pressed segment. `--_segmented-state-duration` sets color feedback to 120ms in Soft, 140ms in Frost, and 0ms in Pixel; reduced motion removes interpolation. Selection moves atomically between cells, without a sliding plate. Hover and held press use low-opacity foreground veils over the existing material, with a smaller change on the selected cell.

These recipes remain stable on Base and Overlay surfaces. Floating parents own glass and elevation; an inset control does not add another blur. Disabled selection retains a quieter fill, read-only selection retains normal readability, and keyboard focus alone adds a separate 2px contour. Forced colors use a system Highlight/HighlightText selected plate. The 3px inset and concentric 4/5/7px inner radii remain independent of the material. A permanent 3px grid gap separates adjacent cells in both orientations, matching the outer inset: selected and hovered or pressed fills never merge. It increases intrinsic group width (or vertical height) by 3px per pair; full-width rows distribute the remaining space after gaps while preserving cell minimums. Geometry stays fixed during interaction. The 2px keyboard-focus outline leaves 1px of the gutter visible. Horizontal rails keep their 30/40/48px outer heights; plates are 24/34/42px high. Coarse pointers use a 48px rail with 42px plates and invisible input targets expanded by 1px on each side to retain at least 44px hit areas without overlapping adjacent targets. Small controls retain room for 120% text by omitting redundant vertical plate padding.

The default selected plate uses a subtle change in fill. Its contrast against the rail ranges from 1.17:1 to 1.62:1 in the six presets on both Base and Overlay, below the 3:1 threshold for a non-text state indicator. Text and keyboard focus have separate contrast measurements. See [SegmentedControl](../components/segmented-control.md) and the [accessibility contract](support-and-accessibility.md).

Overflowing rails consume the [compact native scrollbar recipe](scrollbars.md) on the rail itself: a 10px gutter with a 4px visible thumb on supported desktop engines, transparent track, and a thin native fallback. Only an overflowing rail reserves one extra pixel at its inline end to protect the outer focus edge from native scroll-extent rounding. Horizontal scrolling is a protective fallback for localized labels; an explicit vertical layout remains the preferred alternative when the row does not fit.

## Identity group geometry

`--_avatar-group-overlap-factor` selects the geometry of compact identity groups. Soft and Frost use `1`: frames overlap with a true transparent 2px cutout that exposes the current surface, including glass. Pixel uses `0`: complete square frames sit 2px apart, retaining all four borders. The factor controls grouping geometry only; Avatar and AvatarGroup have no press motion or status-color axis. The current design reference lives in `apps/playground/src/prototypes/avatar/README.md`.

## Slider material feedback

Slider and RangeSlider share an open recessed `--control-bg` / `--control-border` track. Their selected interval uses `--_slider-fill`: solid accent in Soft, Frost Light and Pixel, and the brighter accent signal in Frost Dark so the narrow fill remains legible on floating glass. The compact cap shares this fill and extends 3px beyond each side of the track. It has no separate highlight, contrasting rest outline, or shadow; Soft/Frost retain a small radius and Pixel stays square. Hover and active add a subtle inner edge without increasing the cap size. `--_slider-state-duration` is 120ms in Soft/Frost and 0ms in Pixel. The cap never scales or translates on press, and numeric travel is always immediate. These family-local material recipes do not change other continuous controls. See the [component contract](../components/slider.md) for states and interaction.

## Table rules and selection

Table uses a single layer of horizontal lines. The theme supplies internal `--_table-row-rule`
for body separators and public Tier 2 `--table-row-selected-bg` for the wash behind checked
rows. Soft and Frost refer to `--border-subtle` for body rules, while Pixel uses
`--border-default`. The header and totals use `--border-default` in all six
presets. An optional stripe mixes 3.5% primary foreground over the owning
surface. Selection replaces that stripe and pairs with the checked control.
The surface cascade assigns `--_table-sticky-header-bg` from the theme’s
`--_table-overlay-header-bg` on a floating surface. Soft and
Pixel use the opaque overlay paint. Frost uses a solid tone matched to its
glass panel, covering the scrolling content at the header seam.

See the [Table design reference](../../apps/playground/src/prototypes/table/README.md).
