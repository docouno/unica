# Spinner, Progress, and ProgressCircle design reference

This is an approved visual and interaction design reference. The prototype is local to the playground; its props and DOM are not the shipped package API. Open `?item=spinner` , `?item=progress`, or `?item=progress-circle` in the workbench.

## Purpose and boundaries

Spinner communicates activity whose duration is unknown. Progress communicates the measured fraction of one task or named phase; ProgressCircle adapts Spinner’s compact glyph to the same measurement. Unknown linear progress keeps its track and uses a full-width waiting pattern; unknown ProgressCircle uses Spinner’s motion in the same icon slot. All three are passive, never focusable controls. Cancel, pause, resume, and retry actions belong beside them in the task's UI.

Use Skeleton for known upcoming content geometry, Meter for resource occupancy, and Stepper for navigation through steps. None blocks the page. Button owns its own loading layout and interaction. Waiting has no success or error color; an operation's outcome replaces Spinner with surrounding text and an optional status glyph.

## Spinner

| Part   | Design                                                                                                                       |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Frame  | `inherit` = `1em` (default); S/M/L = 14/16/20px, the system icon slots                                                       |
| Ring   | SVG viewBox 24, center 12/12, radius 9.5; circular arc in Soft/Frost; eight square cells in Pixel                            |
| Stroke | 2.5 SVG units for inherit/S/M, 2.4 for L: approximately 1.46/1.67/2px at fixed sizes                                         |
| Track  | 14% of inherited stroke color                                                                                                |
| Arc    | 16–64% of the circumference in motion; 28% still frame; round caps, full color                                               |
| Tone   | `inherit` default; `neutral` → primary foreground; `muted` → muted foreground; `accent` → accent signal                      |
| Motion | 1600ms gathering/releasing arc over a 2400ms clockwise orbit; Pixel uses eight 120ms steps. RTL unchanged                    |
| Inline | Baseline offset −0.125em; in a multiline status, align to the first line, not the whole paragraph                            |
| Reveal | Default immediate. Optional nonnegative delay reserves the frame while hiding its paint; the 150ms example is a usage choice |

Soft/Frost use a changing arc length with a steady outer orbit: the arc grows from 16% to 64% and releases back to 16%, with dash offsets 0/−18/−100 and cubic-bezier(0.4, 0, 0.2, 1). There is no scale or brightness pulse. Frost adds no glow to this text-adjacent glyph.

Pixel keeps the frame stationary and advances a short tail through eight 4.5×4.5 SVG-unit squares around a 3×3 perimeter. The head advances clockwise every 120ms, with opacity steps 1 / 0.55 / 0.3 / 0.14. Squares never accumulate into a completed range. ProgressCircle uses this same perimeter for known amounts: its cells accumulate instead of chasing. Radio remains circular in every theme. Shape selection belongs to the theme recipe, not a decorative component prop.

Reduced motion freezes the 28% arc or an asymmetric square trail while retaining visible operation text. Reveal timing is independent of motion, so a delayed static indicator still appears. Frozen screenshots show the revealed still frame.

Spinner is decorative by default. A standalone `aria-label` exposes a named image without creating a live region. The owner supplies operation text and marks only the relevant region busy. Avoid duplicate announcements when the surrounding text already names the operation. Spinner itself has no hover, press, focus, disabled, error, or completed state.

The timing demo exposes idle → pending → saved/failed, a quick response that never reveals the ring, and retained icon-slot geometry. Text changes immediately. The result belongs to the surrounding status; Spinner simply disappears. Delays do not impose a minimum wait or postpone a completed result. A long wait requires informative application copy or recovery, never a faster animation.

## Progress

### Anatomy and geometry

An optional heading pairs an operation label at inline-start with an integer percentage or custom units at inline-end. The track sits 8px below it. Labels use caption-l typography; values use tabular numerals. Labels wrap without ellipsis and retain at least 16ch where available before custom units move onto their own line. Value text uses bidi isolation without changing the layout direction. A long custom value can move onto a separate line, aligns to inline-end, and wraps without overflowing. When both label and value are deliberately hidden (`showValue={false}` and no label), there is no heading or reserved gap.

S/M/L tracks are 4/8/12px, with M the default. The full range uses contextual `--control-bg` and a 1px inset `--control-border` contour. Measured fill has no inner border or minimum width. Its exact fractional width starts at logical inline-start; RTL reverses fill direction and tip orientation. Soft/Frost use the system capsule radius; Pixel uses 0px. A 1% value remains 1% even on a narrow track.

### Values and states

| State             | Visible result and meaning                                                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| 0                 | Empty full-range contour; no colored dot, fill lighting, or tip glow                                           |
| 0–100             | Exact proportional width; the integer label floors the percentage, stabilized against floating-point underflow |
| 99.6              | 99%, never a premature 100%                                                                                    |
| 100               | Full measured phase; retain the chosen status and stay visible                                                 |
| Unknown           | Full-width candy stripe, no visible amount, no measured endpoint or glow                                       |
| Paused            | Last measurement, neutral status and explicit adjacent pause text/glyph; no fabricated progress                |
| Interrupted       | Last measurement, danger status and adjacent explanatory copy/glyph; recovery outside the bar                  |
| Confirmed success | The task explicitly supplies success and result copy; reaching max alone does not imply it                     |

Finite values clamp to the valid range. `null`, nonfinite input, or invalid maximum display unknown work, not a fabricated zero. The phase study exposes preparation → measurement → transfer complete → verification → confirmed outcome, including pause and failure, through local controls. The owner explicitly supplies active work; passive stored measurements do not animate. Its slider supplies measurements; it does not simulate a network rate or promise elapsed time.

A shown value reserves a minimum 4ch numeric slot. Unknown work keeps that slot invisible (and excluded from accessibility), so the heading and track do not jump. A supplied custom value retains its layout footprint while unknown; callers should keep the same formatting across a phase change. Changes to the label itself can naturally reflow content. Track-only unknown usage remains track-only with `showValue={false}`.

Soft/Frost interpolate measured width for 180ms ease-out; Pixel updates immediately. Changes to unknown work, zero, or reduced motion are immediate. The numeric readout always describes current data. No automatic recoloring, disappearance, completion callback, or indeterminate-to-determinate fake fill is part of the design.

### Material and color

The six statuses are `accent` (default), `neutral`, `info`, `success`, `warning`, and `danger`. Status paint is accompanied by meaningful task labels or adjacent outcome copy, never a color-only explanation. Progress consumes semantic signal paint for legible thin graphics rather than borrowing action-button solids; neutral uses the quieter muted foreground.

Soft has a matte fill. Frost adds vertical light and a short trailing glow whose peak sits at the logical measured tip; light-theme glow is quieter. Tip strength rises gently through the first 5% so tiny values do not create a bright blob. The glow can spread above/below the track but cannot bleed before zero or beyond the full range. During explicitly active work, its opacity moves between 0.55 and 0.9 and its length between 78% and 100% over 2400ms ease-in-out. The measured edge never moves independently of the value. A passive stored fraction retains a static tip; pause, warning, error, and success quiet it. At 100% its outer opacity fades to zero over 600ms; an initially full range starts without a glow. No network speed is inferred from value deltas and no celebration delays the result. Pixel keeps flat fill and a structural range outline. Theme-specific physics come only from the theme producer's progress recipe, not selectors inside the prototype.

The unknown pattern is a continuous ribbon of equal-width diagonal bands, visibly striped even when frozen. Its base paint is the exact accent signal used by measured progress; the alternating band mixes 84% of that signal with 16% of the theme’s base control background in every preset. Only the contrast between bands is softened: unknown work retains the same active accent family and visual weight as measured work. Frost also shares the measured fill’s vertical light and inset shading, while Soft and Pixel remain flat. The pair resolves at the theme boundary and stays the same on floating surfaces; the underlying track retains its contextual recipe. The local recipe changes no global palette values and has no status-color variants. The 135° texture has a 24×24px tile (12px-wide bands along the track) and travels one horizontal period in 2200ms beneath the stationary material light, without a pulse or measured endpoint. Reduced motion keeps the texture and tip still and removes value/opacity transitions. Explicit pause also stops the waiting texture. Forced colors retains a system-color range contour, measured Highlight fill, an empty zero, and a distinct dashed unknown range.

### Accessible interaction

Progress has an operation name and current numeric value when known. A custom unit string also describes the value to assistive technology. Unknown work omits numeric ARIA values. The track is a passive progressbar; headings and adjacent controls remain outside it. Neither progress primitive adds a Tab stop or owns keyboard focus.

A live region belongs to the surrounding task and should announce meaningful phase changes or outcomes, not every percentage tick. The loading region can be marked busy without making unrelated page controls unavailable. The full reusable ARIA/ref/state contract and assistive-technology behavior are verified during library implementation; native semantics here support inspection of the design.

## ProgressCircle

ProgressCircle is Spinner adapted to a known amount: the same viewBox 24, center 12/12, radius 9.5, stroke, 14% track and `inherit`/S/M/L = 1em/14/16/20px frames. The default tone is inherited; neutral, muted and accent follow the identical Spinner recipe. It adds no larger display sizes, inner percentage, built-in label/value layout, six-status palette, center icon or embedded action. Ordinary text beside it supplies the file name, units, stage count, paused state or outcome. Isolate the whole label-and-units phrase with its own text direction when its language differs from the surrounding layout; the icon still follows the layout direction. This keeps uploads in chat and compact pipelines within the established icon vocabulary.

Soft/Frost fill a stationary rounded arc clockwise from twelve, including in RTL. Rounded ends retain Spinner’s appearance; at this icon scale they optically extend the arc, so the glyph communicates approximate extent while adjacent units and accessible values carry exact data. Zero hides the fill completely, 100 closes the ring, and neither boundary invents an outcome. Soft/Frost interpolate measured changes for 180ms ease-out; reduced motion changes immediately. Known progress never loops, rotates or pulses.

Pixel uses the exact same eight 4.5×4.5 cells as Spinner. Cells accumulate clockwise from the top, with a partially filled leading cell rather than rounding to 12.5% steps; no cells chase while a value is known. Pixel updates immediately. Zero shows only the track; 100 fills every cell. Shape selection remains theme-owned.

Finite data clamp to the range. `null`, nonfinite input or invalid max reuse Spinner’s animation with identical size and tone; no fabricated zero or numeric ARIA value appears. Switching unknown → known mounts the actual measured fraction immediately, without animating from a guessed value. Surrounding copy owns any numeric-slot reservation. Pause and interrupted work retain the last known amount and explanatory text; a muted tone is available. Reaching max completes only the named phase, without automatic recoloring or replacement.

The SVG is a named passive progressbar, with original value/max and optional custom `aria-valuetext`, no Tab stop and no live region. The owner supplies `aria-label`/`aria-labelledby`, or hides a redundant graphic from accessibility when the surrounding UI conveys the same information. Forced colors keeps a GrayText track and Highlight measured fill. Unknown motion obeys the same reduced-motion rule as Spinner.

The specimen compares Spinner and ProgressCircle directly at all icon sizes; shows empty/partial/full values, file and pipeline fragments, wrapping text, pause, controlled unknown/measured handoff and an overlay surface. The controls supply local values, not a network or upload workflow.

## Inspection and handoff

Spinner sections cover size, tone, motion/static comparison, timing and outcomes, multiline/field-slot placement, and a real floating surface. Progress sections cover weights, value boundaries, paired unknown/measured phases at each size, all statuses, labels and units, controlled phase transitions, and a floating surface. FileItem also consumes the shared small track-only Progress. Existing scenes consume these shared prototypes directly: collection coverage, document phase completion, editor autosave, connector indexing, and archive validation. They are contextual references, not additional component variants.

The field-slot Spinner study is a visual stand-in, not a functioning field. The overlay studies are in-flow floating-surface samples, not dismissal engines. Preview state controls are native controls or existing Button prototypes. No network, upload queue, focus trap, form integration, or global announcement manager is implemented here.

Button and Input currently retain their own loading glyphs and placement rules. This design establishes the standalone activity reference; unifying adjacent families must preserve their already established loading behavior and belongs to their library integration.

Before shipping, implement the family in the library, preserve these visual and interaction decisions, move its contract to public component documentation, switch all consumers to the package, and remove disposable prototype code.
