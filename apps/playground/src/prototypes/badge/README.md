# Badge design reference

This is the approved visual and interaction design reference. It is not exported by `@docouno/unica`. The specimen is available at `?item=badge`; its native `as` stand-ins and preview pins are not a proposed public TypeScript API.

## Purpose and composition

Badge names an object's status, category, version, or inline count. It is secondary to the object title and primary actions. Use sentence case, medium weight, and short factual labels. Six semantic statuses share one material: `neutral` (default), `accent`, `info`, `success`, `warning`, and `danger`. Color supports visible words; it never supplies the only meaning.

The three anatomies are text only, an optional leading dot with text, and a leading icon with text. The dot is explicitly opt-in in every theme. The prototype prioritizes an icon if both leading inputs are supplied; the supported design has one leading cue. There is no trailing action, icon-only badge, selected state, dismiss control, or decorative material variant. Use Tag for removal, Chip for selection, Indicator for an attached corner marker, and Alert for explanatory feedback.

## Geometry

| Size        | Minimum height | Type / line height at 100% | Inline padding | Gap | Icon | Dot |
| ----------- | -------------- | -------------------------- | -------------- | --- | ---- | --- |
| S           | 20px           | caption-l / 16px           | 7px            | 4px | 14px | 5px |
| M (default) | 24px           | body-s / 20px              | 9px            | 5px | 16px | 6px |
| L           | 28px           | body-m / 24px              | 11px           | 6px | 20px | 7px |

Type uses the active theme's calibrated font size: Inter in Soft/Frost and the smaller JetBrains Mono scale in Pixel. Two pixels of block breathing room surround the line box; a theme border occupies this space instead of increasing the height. At enlarged text scales, the badge grows with its line box instead of clipping the text. S is intended for running body text, table rows, and compact metadata; M fits standalone metadata and small headings; L supports prominent statuses. Existing dense scene consumers explicitly request S.

The root exports the label baseline; the dot and icon center independently. The label has an outer baseline carrier and an inner ellipsis box. The inline specimen checks plain, dot, and glyph badges beside real Text and a badge beside Title. Do not substitute centered flex rows for these inline checks.

Counts use tabular numerals, a square minimum equal to the effective badge height, centered text, and 5px inline padding. `0` is visible. Formatting, grouping, threshold values such as `99+`, and hiding zero belong to the application. The prototype recognizes numbers and simple digit strings with an optional `+`; localized formatting and exact production composition are implementation concerns. A count needs its surrounding noun, or the complete accessible name of its owning control, such as “Notifications, 4 unread”. Do not rely on an accessible name attached to a generic span. Empty content renders nothing; an absent status should be an explicit word such as “Unknown”, never an empty colored capsule.

## Material and state

- **Soft:** opaque matte pastel capsule, no border and no dot halo.
- **Frost:** opaque in-flow colored plate, a delicate 1px rim, and a small signal-colored halo on the dot. No backdrop blur or elevation on the badge itself, including inside overlays.
- **Pixel:** 1px rectangular frame, square signal dot, monospace type, no halo. Label geometry and interaction remain consistent.

The label and icon use the legible `soft-fg` ink; the decorative dot uses `signal`. Keeping fine icon strokes in the label ink is intentional: the text and glyph remain coherent without an overly bright or muddy symbol. Status frames are supporting boundaries, not a target for blanket 3:1 contrast. The shared palette is unchanged. The opaque plate works on Base and actual Overlay consumers.

Static badges have no hover, press, focus, loading, or disabled treatment. They are text and can be selected. A busy object can say “Checking” with a stationary clock glyph; a spinner is not intrinsic to Badge. Status changes replace text, glyph, and color immediately in every theme, with no pulse, scale, roll, or crossfade. This also handles reduced motion. The owner can reserve layout space for status changes; Badge does not guess every future label width.

## Inspectable metadata

A badge may be a native link to the represented version/category or a button that reveals details about the displayed status. This is not a primary action or a selectable filter. Both kinds have a persistent 1px underline under their label, offset by 2px, so they are distinguishable from passive metadata without hover. Native links retain normal activation, context menu, and modifier behavior. An anchor without a destination is passive.

Hover blends 8% of the label ink into the plate; press blends 11%. Both are immediate and stationary. Keyboard focus adds a 2px focus-token outline at 2px offset. Focus can coexist with hover or press; it must remain visible and unclipped. Only actionable native roots receive feedback. An unavailable button uses a neutral plate, muted disabled ink, no halo or pointer reaction, and is skipped by Tab. Disabled is a control state, not a way to fade factual statuses. Parent `inert` supplies availability when an entire region is inactive.

The specimen includes explicitly pinned states plus a working native version link and details button. Enter follows the link; Enter or Space toggles the details. The button keeps focus, exposes expanded state, and closes its inline details on a second activation. This is a demonstration of the marker's trigger, not a prescribed overlay engine. A production popover must follow its own focus and dismissal contract.

Compact inline links rely on their reading context. For a standalone touch action, use an enclosing link/button with at least a 44×44px target and keep the nested Badge passive; do not make a 20px capsule an isolated touch target or overlay invisible hit areas onto neighboring content.

## Overflow, direction, and accessibility

Badges are single-line and do not surrender their width to neighboring flex items. Short factual statuses stay complete; groups wrap between badges. Consumers constrain genuinely long metadata explicitly rather than silently truncating an essential status. `--badge-max-width` demonstrates an optional CSS width cap; only the inner text ellipsizes. Leading cues retain their shape. Do not constrain a badge below the space for its padding, cue, gap, and a useful label fragment. The specimen includes 148px and 72px examples and a wrapping group. Prefer a short, unambiguous status over truncating essential information. If a category must truncate, show its full meaning nearby or in the object's detail view. There is no automatic tooltip or hover-only recovery.

Inline-start cues follow the container direction; the label determines its own text direction so a version or English label stays readable inside an RTL interface. Groups wrap between badges; individual labels do not wrap or break. Localized labels, including long unbroken words, follow the same rule. The full untruncated text remains in the accessible tree. Dot and icon are decorative and excluded from the accessible name. Do not add repetitive spoken “success” or “warning” prefixes. Badges do not announce updates by default; the owning workflow may supply one polite atomic result region, demonstrated in Changing status.

Forced colors retain a system border, Canvas/CanvasText for passive content, LinkText for active metadata, GrayText for disabled buttons, and Highlight for focus. The meaningful label survives without hue, halo, or background tint.

## Prototype boundary and review

The six sections cover meaning/anatomy, size/count geometry, inline placement, overflow, active states, and manual lifecycle changes. Base and overlay placement are evaluated in existing scene consumers, including the document reader and its floating author card, and the document collection. The five button-state samples are visual pins, not simulated real focus. The lifecycle buttons drive local state; they do not perform a network operation. The prototype has native semantics sufficient to evaluate the experience, but does not prove the future package's polymorphic types, ref composition, validation diagnostics, or full browser-support contract.

The implementation stage must preserve these visual and user outcomes while choosing the exact React API and internals. Replace the prototype with package imports, preserve the specimen, and document the shipped API under `docs/components/badge.md`.

Industry references: [Radix Badge](https://www.radix-ui.com/themes/docs/components/badge) demonstrates a span-based marker with element composition; [GOV.UK Tag](https://design-system.service.gov.uk/components/tag/) explains the discoverability risk of mixing passive and interactive status tags. Unica's persistent underline addresses that distinction for its intentionally narrow inspectable-metadata use case.
