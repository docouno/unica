# Divider — design reference

Status: approved design reference (2026-11-15). Open `/?item=divider` in the playground. This prototype establishes the experience; it is not a package export or the final TypeScript API.

## Purpose and scope

Divider is a static boundary between related content groups, action groups, or alternative methods. Prefer whitespace alone when it already makes grouping clear. A line reinforces hierarchy; it does not replace headings, section structure, or accessible group names.

There are three configurations: plain horizontal, plain vertical, and horizontal with a short text label. Labels support logical `start`, `center` (default), and `end` placement. A label is a connecting phrase such as “or continue with email”, not a heading or an action. Use ordinary sentence casing; do not force uppercase. No icons, badges, links, vertical labels, color tones, thickness options, dashed rules, material variants, or resizing affordances are part of this family. Menu and other compound components own their internal separators.

## Anatomy and geometry

| Part                          | Decision                                                                                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Horizontal rule               | Full available inline width, 1 CSS px thick, no intrinsic external margin or padding. Does not shrink away in a flex stack.                                      |
| Vertical rule                 | 1 CSS px wide, stretches to the block size of its flex/grid row. The host supplies a content-sized row or explicit height; there is no arbitrary default length. |
| Label                         | Theme `caption-l`, regular 400, `fg-muted`: 12px/16px in Soft and Frost; 11px/16px in Pixel.                                                                     |
| Line-to-label gap             | 12px on each occupied side, unchanged at 120% text.                                                                                                              |
| Center                        | Two equally flexible segments with a minimum length of 12px each. Text is centered.                                                                              |
| Start / end                   | Label flush with the corresponding inline edge; one flexible segment on the other side. Wrapped text aligns to the same logical edge.                            |
| Long text                     | Wraps, including unbroken strings; no ellipsis, clipping, or tooltip dependency. The line is vertically centered on the entire label block.                      |
| Empty / whitespace-only label | Falls back to a plain line, with no label gap or empty text row.                                                                                                 |

At 120% text the label and its line height scale through the typography tokens; the rule remains 1px. Horizontal layouts need room for the text, gaps, and line tails: the center configuration reserves 48px for both gaps and tails; start/end reserve 24px. Keep connecting copy short. For longer explanations use normal text adjacent to a plain separator.

The parent owns rhythm and inset. The reference uses 12px between a rule and adjacent compact content, including a 12px content gap and 16px container inset in the Card, and 24px around larger groups. These are composition choices, not size variants. Full-bleed and inset boundaries use the same component within differently padded parents. A vertical rule normally fills the row; for 30px toolbar actions the reference host adds 4px block margins, yielding a 22px optical line. Keep the separator with its adjacent action groups when wrapping so it never becomes an orphan on a new row. On a stacked mobile layout the host removes the upright separator or chooses a horizontal boundary explicitly.

RTL mirrors start/end and content order naturally. It does not rotate the component or reverse the label string. Center remains symmetric. An explicitly directed container sets the reading direction for its entire divider.

## Material and hierarchy

| Configuration                              | Rule color         |
| ------------------------------------------ | ------------------ |
| Plain horizontal on canvas / Card          | `--border-subtle`  |
| Labeled horizontal                         | `--border-default` |
| Vertical                                   | `--border-default` |
| Any rule inside `[data-surface="overlay"]` | `--border-default` |

A long plain boundary is deliberately quieter than a Card perimeter. Label segments balance the nearby text; short vertical lines need the stronger neutral edge to remain legible between controls. Overlay surfaces use the stronger edge because the subtle edge can merge with a raised dark surface. All rules stay thin: no glow, gradient, blur, bevel, shadow, or animated material. Frost's surrounding panel supplies the glass; Divider itself does not paint an opaque patch behind the label. Pixel keeps a square, crisp rule and its theme font. Soft uses its warm neutral palette. No component theme-name branches or new theme tokens are needed.

The line is supporting structure, not an interactive control boundary or the sole source of meaning. Do not increase it to text-like contrast merely to satisfy an unrelated control metric. Label readability, actual grouping, and material balance must be assessed together on real surfaces.

## States and accessible outcome

Divider has one resting appearance. Hover, pointer press, focus, disabled, read-only, loading, selection, and validation states do not apply. It never moves, receives Tab focus, shows a resize cursor, or consumes arrow keys. Adjacent controls keep their own focus and interaction feedback. There are no animations; reduced-motion preferences therefore need no alternate visual state. Native `hidden` removes the entire divider and its occupied space.

- A plain decorative boundary is hidden from assistive technology; it does not create repeated separator announcements between already structured sections.
- A plain semantic boundary is exposed as a static `separator` with the correct orientation. It has no range value and is not focusable. An accessible name may be supplied when the boundary needs identification.
- A labeled divider exposes its text once in normal reading order; only the line segments are decorative. Do not put the label inside a `separator` role or hide the whole labeled wrapper. It must not become a heading or a tab stop.
- Forced colors use `CanvasText` for the line borders and label. Geometry and reading order remain unchanged.

The prototype demonstrates these branches directly. A nonempty horizontal label takes precedence over `decorative`; vertical ignores unsupported label content. The library API must exclude unsupported combinations and interactive/content overrides rather than adopting these permissive prototype signatures.

## Review route and implementation boundary

| Section       | Inspect                                                                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `orientation` | Horizontal rhythm, vertical stretch in a text flex row and a two-column grid.                                          |
| `labels`      | Start/center/end, edge alignment, and a minimal “or” label.                                                            |
| `wrapping`    | All three label positions in equal bounded narrow samples, with sample names outside their shaded preview areas.       |
| `content`     | Unbroken copy and empty labels, separated from the alignment comparison.                                               |
| `surfaces`    | Matching canvas and Card content with the same divider configurations.                                                 |
| `overlay`     | A static Popover material plate over the workbench underlay; no opening or dismissal behavior is implied.              |
| `context`     | Working emphasis/list toggles beside a semantic separator; Tab skips the boundary. The toggles do not edit a document. |

Inspect all six themes at 360/768/1280/1440px, 120% text, and RTL. The existing `01-sign-in` scene consumes the labeled divider; `05-rich-editor` consumes vertical toolbar and horizontal prose dividers. These scenes remain the application references, separate from this component specimen.

Implementation must preserve these visual and accessibility outcomes while designing the final React 19 API, mutually exclusive props, runtime attribute policy, stable ref/DOM contract, and cross-browser/assistive-technology verification. Replace prototype imports and remove the temporary component CSS when the family ships; publish the actual API in `docs/components/divider.md`.
