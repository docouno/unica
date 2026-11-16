# Indicator design reference

Indicator attaches one quiet signal to one host: a count for a known quantity, or a dot for binary activity. This is a design prototype, not an export of `@docouno/unica`. Inspect it at `?item=indicator`; the application rail consumes the same prototype.

## Scope and meaning

Use a corner count on notifications, inboxes and compact actions. Use a dot for new activity or presence beside a visible status label. Use inline Badge for a number in a text row, tab, clipped list or crowded toolbar. Indicator is not an action, a progress display, a tooltip, or an independent live region. It never adds a focus stop.

The six semantic roles are `neutral`, `accent`, `info`, `success`, `warning` and `danger`. Accent is the default for new activity; neutral suits ordinary quantities. Success can indicate availability, warning needs an actual caution, and danger is reserved for critical items. These are meaning choices, not a six-color presence taxonomy. Available and Away have a dot and visible text; Offline keeps its text and has no activity dot: a colored dot alone cannot communicate those distinctions.

No material variants, pulse, bounce, ripple, glow, scrolling digits, icon slot, free-form label, ribbon or built-in processing state. A loading host uses its own progress treatment. The marker does not turn into a spinner.

## Anatomy and geometry

A flow wrapper contains the unmodified host and a decorative, absolutely positioned marker. The wrapper occupies exactly the host's layout box; the marker's exterior overhang is not reserved in flow. Use a single element with a measurable box, without external margins. Avoid `display: contents` hosts. Keep clipping outside the wrapper under the consumer's control.

| Marker size | Count height / minimum width | Count type            | Dot size | Typical host                                       |
| ----------- | ---------------------------- | --------------------- | -------- | -------------------------------------------------- |
| S           | 16px                         | caption-l, weight 600 | 6px      | 30–36px controls, small glyphs and 32px avatars    |
| M (default) | 20px                         | body-s, weight 600    | 8px      | 40–48px controls and avatars                       |
| L           | 24px                         | body-m, weight 600    | 12px     | Large or prominent targets; inspect visual balance |

Counts have 4px horizontal padding, tabular numbers, no kerning, and a single line. One digit has a square minimum box; two or three characters grow symmetrically around the anchor. Height grows with the theme's line metric at 120% text, so digits keep their breathing room. Dots remain fixed-size. Soft and Frost use rounded capsules and dots; Pixel uses square corners and its calibrated monospace type. A marker has no additional elevation or press displacement.

`top-end` is the default corner. `top-start`, `bottom-start`, and `bottom-end` use logical inline direction. The marker's center lies on the selected host vertex. Circular overlap moves that anchor inward by `(1 − cos(45°)) / 2`, approximately 14.64466% on each axis. This inset is multiplied by the theme's radius factor because Avatar becomes square in Pixel. Use circular overlap for theme-shaped Avatar, not an arbitrary oval or a permanently circular control. Rectangular overlap follows the bounding box of ordinary controls, including their rounded corners.

The whole wrapper follows RTL, while the numeral fragment is explicitly LTR: `99+` never becomes `+99`. Full-width hosts stretch the wrapper; long host labels may wrap while the marker stays attached to the same corner. Marker size does not change the host's hit area.

## Surface and material

Counts consume the semantic `solid` fill and matching `fg-on` ink. Dots consume the semantic `signal` color: a small dot needs an independently legible signal, particularly in dark neutral and Frost accent/info cases. Do not brighten the counter fill just to match the dot. The neutral counter can stay quiet because its readable number carries the information.

The default separator is an external 2px band, using `--indicator-separator-color`, with `--bg-canvas` as the fallback. It does not change marker dimensions. Set the property at the owning surface: `--bg-shell` for the rail, `--bg-surface` for a card, or another explicit local surface color. `withBorder={false}` removes the band; use it only when the host and background already separate the marker clearly. A same-colored primary action usually needs the band.

On a translucent overlay, painting its rgba background again over the host produces a dirty mixed edge. The floating specimen therefore uses the **opaque RGB pigment of `--bg-overlay`** as its separator (`rgb(from var(--bg-overlay) r g b / 1)`), with the original overlay color as a browser fallback. This is an intentional solid edge, not a claim to reconstruct the blurred background pixel for pixel. It preserves glass on the panel and clean separation over an image or colored action. Custom translucent surfaces should choose their own opaque edge color. No DOM background sampling is intended.

## Data and visibility

| Input / change                                                  | Visible result                                                                                              |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Explicit dot                                                    | One static dot, without text                                                                                |
| Positive integer count                                          | The exact number up to the cap                                                                              |
| Above `max` (default 99)                                        | `99+`, or the selected cap followed by `+`                                                                  |
| Zero                                                            | No marker by default; `showZero` displays `0`                                                               |
| `null` / `undefined`                                            | No marker; never silently switches to dot                                                                   |
| Negative, fractional, non-finite or unsafe integer; invalid cap | No numeric marker; preserve the host                                                                        |
| `visible={false}`                                               | Remove only the marker                                                                                      |
| Hidden wrapper or directly hidden host                          | No orphan marker                                                                                            |
| Known count while action is disabled or busy                    | Preserve the information if still useful; the application decides whether to hide stale or unavailable data |
| Count, status or visibility update                              | Immediate replacement, no motion and no remount or displacement of the host                                 |

A cap is a compactness policy, not the true quantity. The accessible name keeps the actual number, including values above the cap. Prefer 9+ in very tight rails, 99+ for general controls. Large labels or verbose quantities belong in Badge or adjacent text. Dot and numeric input are conceptually exclusive; the temporary helper accepts both to make the corner toggle simple. Their exact public TypeScript representation and development diagnostics belong to library implementation.

The marker remains anchored to the host's layout frame while a material-specific button surface depresses. It does not inherit the host's glow, opacity or busy animation. A disabled host can retain a neutral known count; this is a consumer decision, not an inferred recoloring rule. Disabled controls still follow Button's unavailable behavior.

## Interaction, focus and space

The host keeps its own pointer, Enter/Space, link, focus and form semantics. The marker has `pointer-events: none` and `aria-hidden="true"`. Clicking within the host activates it, including beneath the overlapping marker. Clicking the overhang outside the host does not enlarge its activation area. The wrapper does not clone or replace the child when count changes.

Focus belongs to the host. The band and marker may locally interrupt its corner; the two opposite edges and substantial portions of the adjacent edges remain visible. This is the deliberately reviewed corner treatment, not a promise of three completely unobstructed edges. Large caps on tiny hosts are inappropriate. For very tight navigation, wrap the inner glyph instead of the entire hit target: the rail uses S / 9+ on its 18px glyph inside a 36px button. Its outer focus contour stays clearly recognizable; a capped count at 120% text can still locally interrupt the corner.

Reserve clearance for the largest anticipated marker, not just the initial count. At 100% text, an M `99+` is about 36px wide in the proportional themes, so its outward extension is about 18px plus the 2px separator. The specimen uses 24px between marked toolbar targets and nearby actions. At larger text scales or with a larger cap, measure again. Indicator never moves itself to avoid a viewport edge and never escapes a clipped ancestor. Use local padding or an inline Badge when space is insufficient.

The consumer owns a useful full accessible name or adjacent text. A visible notification action can be named “Notifications, 105 unread” while the decorative marker reads `99+`. Important updates may use an external polite status; continuous counts should not announce every refresh. The live demo's status region reports its explicitly triggered changes. Presence needs visible text or another non-color distinction, as demonstrated in the floating surface.

Forced colors use CanvasText fill, Canvas ink and an explicit Canvas separator; no shadow is required to preserve the shape. Since the marker has no animation, reduced motion preserves the same stable presentation. The host's reduced-motion policy remains its own.

## Live reference and handoff

- **Overview / Scale / Status / Surfaces:** static comparisons of the actual shared marker; status samples name the palette role rather than suggesting a product state.
- **Corners:** live dot/count toggle on all four corners and both host shapes.
- **Data:** live count updates, capping, clearing by activating the bell, show-zero, marker visibility and native host visibility. Neighboring action position and host focus are preserved during count changes.
- **Host states:** explicitly pinned Button rest/hover/press/focus/disabled/busy combinations, plus live keyboard targets below. Pins do not constitute a separate Indicator state API.
- **Overlay / Boundaries:** real material rendering, text equivalents for presence, full-width wrapping, explicit LTR/RTL comparisons, and an inline fallback when corners cannot fit.
- **Workspace overview and other existing Folio consumers:** the rail uses this Indicator in place of its former local count styling; full notification wording remains on the navigation button.

The design fixes appearance, placement, state priority, meaning, feedback and motion. Library implementation must preserve them while deciding exact props and proving React refs/events, native hidden/until-found behavior, host stability, forms, assistive technology and the supported browser matrix. The local preview is not a production guarantee for those mechanisms. Prototype Button, Avatar and Badge remain adjacent design dependencies.
