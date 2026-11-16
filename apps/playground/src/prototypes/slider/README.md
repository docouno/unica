# Slider & RangeSlider — design reference

Status: design approved on 2026-11-16. Open `/?item=slider`. These are reusable visual prototypes, not package exports or a final TypeScript API. The user-preferences scene consumes the same family. NumberInput remains a separate, adjacent prototype; the exact-entry example does not make it part of Slider.

## Purpose and boundaries

Slider adjusts one bounded numeric value when relative position matters: quality, volume, scale, spacing, or a threshold. RangeSlider selects a closed numeric interval with stable lower and upper bounds. Both use a linear scale and one uniform step. Use a separate numeric field for exact entry; use Radio or SegmentedControl for a few named choices. A negative domain is supported, but the fill still means minimum-to-value, not distance from zero.

The family has no decorative variants, tone palette, embedded text field, tooltip, loading animation, required/empty state, wheel adjustment, logarithmic scale, nonuniform mark snapping, draggable whole interval, third thumb, swapping, or neighbour pushing. Error belongs to validation feedback, not a red progress-like track. If a value is temporarily unavailable, the surrounding form owns loading/placeholder presentation rather than inventing an indeterminate slider value.

## Anatomy and geometry

A transparent root contains an optional heading (label and persistent value), an open interactive rail with one or two rectangular caps, optional explanatory marks, and optional supporting/error text. It paints no outer field box. The whole rail row accepts pointer input; the label, value, marks, and description do not alter values accidentally. A visible label identifies the field. An externally labelled slider can omit the heading, but must keep an accessible name and a visible readout elsewhere.

| Metric                         | S                   | M (default) | L         |
| ------------------------------ | ------------------- | ----------- | --------- |
| Horizontal cap, width × height | 4 × 10px            | 5 × 12px    | 6 × 14px  |
| Vertical cap, width × height   | 10 × 4px            | 12 × 5px    | 14 × 6px  |
| Rail thickness                 | 4px                 | 6px         | 8px       |
| Transverse interactive row     | 30px                | 40px        | 48px      |
| Coarse pointer row             | 44px                | 44px        | 48px      |
| Extreme centre inset           | 2px                 | 2.5px       | 3px       |
| Label                          | size-s-control-font | body-s      | body-m    |
| Value, marks and description   | caption-l           | caption-l   | caption-l |

The rail occupies the full available length. Cap centres map to `shortSide / 2 + (length - shortSide) × fraction`, so caps are flush with both endpoints. Fill and marks use exactly the same coordinates. Scalar fill runs from the minimum centre to the current centre; interval fill runs only between the two centres. At a coincident interval it has zero length. There are no arbitrary side gutters. Radius is 2px capped by the theme's radius token; Pixel resolves to 0px. The cap never scales, bounces, or moves along a false value coordinate on press.

The scale reserves a constant 6px before and after its hit row/marks for cap and focus clearance, including when close bounds separate. This reserve does not change during a gesture. The heading has a 16px minimum gap, baseline alignment, and natural wrapping. Long labels and values wrap instead of truncating or shrinking type. A scalar formatted value is direction-isolated; a lower–upper readout stays in numeric order in RTL. Range endpoints stay as separate unbroken formatted amounts where space permits. Labels, values and descriptions scale with 120% text; rail/cap dimensions do not. No value tooltip is needed to read the resting control, including on touch.

### Reference marks

Marks are explanatory, not selectable targets or extra snapping stops. A 1 × 4px external tick sits 6px after the horizontal hit row, clear of displaced caps and their focus contours; labels are 5px below ticks. Use short numeric/unit labels, usually two endpoints and a midpoint. Endpoint labels align inward and interior labels centre on their ticks. No dots interrupt the fill. On a horizontal scale at most 280px wide, secondary alternating interior labels disappear while their ticks remain; with three marks, the midpoint label disappears. Vertical scales retain their labels. In a more crowded application, supply fewer labelled landmarks rather than crowding a fine step grid with text. The current prototype expects short labels; arbitrary long mark-label collision resolution is a library implementation concern with this intended outcome: keep endpoints and a legible subset of interior labels, never overlap or ellipsize numeric values.

### Close and coincident bounds

Caps that approach within `shortSide + 6px` of each other separate across the rail. In horizontal orientation the lower cap sits above and the upper below; in vertical orientation lower sits toward inline-start and upper toward inline-end. The offset is `longSide / 2 + 2px`; 1px stems join the caps to their true rail coordinates. This keeps both controls visible without fabricating a wider numeric interval. The layout and hit-row size stay stable. Focus remains on the corresponding cap. This transition is immediate, including with reduced motion, to avoid a cap lagging behind a gesture.

At `[x, x]`, the readout remains `x — x`, and both inputs retain independent focus stops. A direct cap drag operates that cap. Starting from the shared point on the rail chooses the lower bound when moving toward minimum and the upper when moving toward maximum. At `[min, min]` only opening toward maximum can expand the interval; at `[max, max]` only opening toward minimum can expand it. Clicking elsewhere selects the nearer bound. An exact midpoint tie chooses the upper bound. A minimum separation constrains both ends without pushing the neighbour.

## Material and state feedback

The contextual `--control-bg` and `--control-border` create a quiet recessed track. `--slider-fill` colors both the selected interval and its compact caps; `--slider-state-duration` controls edge feedback. These recipes have no other consumers. At rest, caps have no contrasting outline, highlight, gradient, or shadow. They project only 3px beyond either side of the rail, marking a graspable boundary without becoming a second visual accent. Their small painted area does not reduce the interactive row.

- Soft uses a matte accent cap and fill, a small radius, and a 120ms edge response.
- Frost uses a flat cap continuous with the selected interval, with a 120ms edge response. Glass belongs to the containing overlay and contextual track. Dark uses the accent signal for both the thin selected segment and its caps, keeping them legible over the overlay trough; Light uses the solid accent. The cap has no separate luminous rim or raised face.
- Pixel uses a flat cap in the fill color, square geometry, and immediate edge feedback. A contrasting frame does not surround the small cap.

Hover is local to the nearer cap and accepts the whole hit row; the cursor is `grab`. Its 1px inner edge mixes the fill with 20% primary foreground; active uses 35%. The cap does not grow or gain a shadow. During drag the cursor becomes `grabbing`, and position/fill update immediately without easing. Pinned hover/active/focus examples are labelled in the section caption; they keep the visual state while accepting live input. These preview props are not proposed public API.

Keyboard focus is a 2px contour with a 2px offset around the specific cap. Pointer interaction suppresses that contour even after a previous keyboard interaction; the next keyboard action restores it. There is no whole-track focus rectangle. A lower and upper bound each keep their own focus location; no thumb swaps identity.

Read-only is neutral but fully legible, remains in the tab sequence, has a default cursor, and suppresses hover/drag changes. A policy description explains why adjustment is unavailable. Disabled removes active accent, uses a quiet outlined cap, preserves a readable value/label, suppresses interaction and tab stops, and uses `not-allowed`. The entire field is never faded with global opacity. Disabled takes visual priority over validation; read-only can still be focused. Error uses a danger edge plus an icon and explanatory text; the selected interval remains accent. Focus remains independently visible over an error edge. Both validation examples update with the values: export quality must reach 40%, and the interval must include 50. The interval example pins keyboard focus on its upper cap; its caption states this explicitly.

Forced colors use Canvas/ButtonText for the track/caps and Highlight for selection/focus, GrayText for disabled. Error meaning remains in text and its icon. Reduced motion removes color transitions; value position is always immediate. No glass effect is applied to the cap itself.

## Expected interaction and accessibility

- Clicking the rail updates the nearest thumb and can continue directly into dragging. Grabbing a cap preserves the initial offset along the value axis. Escape or pointer cancellation restores the gesture's starting value. Horizontal dragging permits vertical page scrolling; vertical dragging permits horizontal panning. Wheel scrolling never changes the value.
- Arrow keys move by one step. Horizontal Left/Right follow the screen in RTL; Up always increases and Down decreases. Vertical minimum stays at the bottom in either text direction. Home/End choose the current allowed bounds, including neighbour/minimum-distance constraints. PageUp/PageDown move by approximately one tenth of the range, snapped to whole steps.
- Tab visits the scalar cap, or lower then upper for an interval, in stable DOM order. Each native input has an accessible name, formatted value text, orientation, and associated help/error text. The group has its own label; labels for its two thumbs distinguish lower and upper. Visual readouts are not live regions; the focused native input reports the current value.
- A range always keeps `lower <= upper`; a configured minimum gap is also retained. It never swaps or pushes a neighbour. The live preview demonstrates bounds, uniform decimal steps, nonzero/negative minima, and opening a collapsed interval.
- The shipped implementation must preserve controlled authority and define precise live/commit event semantics: continuous preview while adjusting, one commit on gesture completion or completed keyboard action, no commit on cancellation, reset or prop updates. Native forms submit the scalar or both named bounds; reset restores the default atomically. Disabled omits values and read-only preserves them.

## Inspection and implementation boundary

The specimen sections are `sizes`, `range`, `interaction`, `availability`, `bounds`, `close-bounds`, `vertical`, `content`, `exact`, and `overlay`. The overlay is a static material study, not a working popover. The actual application fit is in `09-user-preferences`, which owns its outside interval readout and compact settings layout.

Native input focus, keyboard changes, pointer dragging, clamping, coincident-bound separation, Escape/cancellation, descriptions, and shared exact entry are live. Geometry is measured locally to show crowded caps honestly. Prototype components use a valid fixed numeric domain and a small illustrative step normalizer, not the planned comprehensive decimal-validation engine. Prototype props, native DOM placement, and callback internals are replaceable.

Full browser/assistive-technology certification, native form reset/submission contracts, controlled-refusal synchronization, robust changing-domain/availability cancellation, and final refs/events/types remain library work. These are engineering obligations, not permission to redesign the visual experience. Test touch assistive technology before shipping, alongside the native-input approach. Preserve the expected experience above and raise any new visual conflict explicitly.

Review all six presets, Base and actual Overlay plates, 360/768/1280/1440px, 120% text, RTL, keyboard focus, reduced motion and forced colors. Evaluate the actual rendered result alongside measured contrast. Relevant interaction references: [WAI-ARIA Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/), [Multi-thumb Slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/), and [React Aria Slider](https://react-aria.adobe.com/Slider).
