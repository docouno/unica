# Slider and RangeSlider

Use [`Slider`](#single-value) to select one number and [`RangeSlider`](#two-bounds) to select the lower and upper bounds of an interval. Both use a linear decimal scale. They support pointer, keyboard, and native range input, with separate callbacks for a proposed edit and a completed action.

Use [FormField](form-field.md) to label a single Slider through its native input or give a RangeSlider a shared heading and instructions.

```tsx
import "@docouno/unica/styles.css";
import { RangeSlider, Slider } from "@docouno/unica";
import type { RangeSliderValue, SliderMark } from "@docouno/unica";
```

## Single value

`Slider` exposes one native range input. Its `id`, `ref`, `name`, accessible name and descriptions, and focus and keyboard handlers belong to that input. The visual root receives `className`, `style`, `dir`, `lang`, `hidden`, `inert`, `title`, and consumer `data-*` attributes.

```tsx
<form>
  <label htmlFor="zoom">Reading zoom</label>
  <Slider
    id="zoom"
    name="zoom"
    min={80}
    max={140}
    step={5}
    defaultValue={100}
    formatValue={(number) => `${number}%`}
  />
  <button type="reset">Restore zoom</button>
</form>
```

The initial value is the middle reachable point when omitted. An exact tie rounds toward the larger value.

## Two bounds

`RangeSliderValue` is a readonly tuple `[lower, upper]`. The initial interval spans the whole reachable scale when omitted. The two inputs remain in lower, upper tab order across orientations, directions, and coincident values. Each thumb stops at the other thumb or the specified gap. The other thumb stays in place.

Supply two distinct nonempty `thumbLabels` and give the group an accessible name using `aria-labelledby` or `aria-label`. The root owns its `id`, `ref` (`HTMLDivElement`), group ARIA attributes, and bubbling focus and keyboard events. Use `inputRefs` for the two native nodes and `inputProps` for per-thumb `id`, `aria-describedby`, or `aria-details`. Shared descriptions are appended to thumb descriptions with duplicate ID references removed.

```tsx
<form id="filters">
  <button type="reset">Reset prices</button>
  <button type="submit">Apply filters</button>
</form>
<span id="price-label">Nightly price</span>
<p id="price-help">Both prices are inclusive.</p>
<RangeSlider
  aria-labelledby="price-label"
  aria-describedby="price-help"
  thumbLabels={['Minimum nightly price', 'Maximum nightly price']}
  names={['from', 'to']}
  form="filters"
  min={0}
  max={500}
  step={5}
  minStepsBetweenThumbs={2}
  defaultValue={[100, 350]}
  formatValue={(number) => `$${number}`}
/>
```

The form receives two numbers in lower, upper order. Using the same name twice yields two entries from `FormData.getAll(name)`. Omit `name` or `names` for an unnamed control.

## Props

| Prop                             | Default                 | Behavior                                                                                                                               |
| -------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `min`, `max`, `step`             | `0`, `100`, `1`         | Decimal bounds and a positive step.                                                                                                    |
| `value`, `defaultValue`          | See each control        | Controlled value or mount-time uncontrolled baseline. Accepts a number for Slider and a tuple for RangeSlider.                         |
| `onValueChange`, `onValueCommit` | Omitted                 | Receive the new number or a fresh tuple, in original units.                                                                            |
| `minStepsBetweenThumbs`          | `0`                     | RangeSlider only. Minimum gap as a count of steps.                                                                                     |
| `name` / `names`, `form`         | Omitted                 | Native form names and optional form ID for each input.                                                                                 |
| `size`                           | `'m'`                   | `SliderSize` is `'s' \| 'm' \| 'l'`.                                                                                                   |
| `orientation`                    | `'horizontal'`          | `SliderOrientation` is `'horizontal' \| 'vertical'`.                                                                                   |
| `status`                         | `'neutral'`             | `SliderStatus` is `'neutral' \| 'danger'`. On enabled controls, danger outlines the cap and sets `aria-invalid` on the input or group. |
| `disabled`, `readOnly`           | `false`                 | Disabled fields are omitted from focus and form data. Read-only fields can be focused and submitted.                                   |
| `showValue`                      | `true`                  | Show a local readout. With an external readout, pass `false`.                                                                          |
| `formatValue`                    | Canonical number string | `SliderValueFormatter` is `(value: number) => string`. Supplies visible text and `aria-valuetext` independently of `showValue`.        |
| `marks`                          | Omitted                 | A readonly list of `SliderMark` entries with a finite `value` and optional `label`. Marks can sit between steps.                       |

`SliderProps`, `RangeSliderProps`, and the supporting types are also available through the package's React Server Components type entry. The runtime controls belong in client components.

## Numeric scale

The last reachable point is `min + floor((max − min) / step) × step` in decimal arithmetic. For example, `min={0} max={1} step={0.3}` reaches `0.9`. The drawn endpoints, native bounds, end keys, and submitted values all use that point. A reference mark at `0.45` sits halfway along the scale. A rail click there selects `0.6`. A mark itself is decorative.

Finite values project to the nearest reachable point. Ties round up. When projecting a whole pair, fit the lower thumb first, then fit the upper thumb with the required gap. A change of domain or gap silently projects the value. An uncontrolled field keeps that projected value if the domain expands again. Both inputs stay mounted and submit even when the scale has only one reachable point.

The following numeric limits keep inputs on the same native step grid during submission, reset, and changes to thumb bounds.

- `min`, `max`, and `step` use finite normal numbers or zero, with at most 15 significant decimal digits. The step is positive and `min ≤ max`.
- The step and all reachable points with magnitude at least `1e-6` and below `1` are multiples of `1e-18`. Nonzero reachable points are normal numbers.
- On a scale with more than one point, both reachable endpoints have absolute integer coefficients at most `10^15` at the finer decimal precision of `min` and `step`. Zero as the minimum takes the step's precision.
- The gap is a safe nonnegative integer at most the number of steps. A pair must contain two finite numbers in ascending order, with equality allowed. Each mark must have a unique value within the reachable scale.

Unsupported domains, pairs, or marks throw `RangeError` on server and client. Examples of supported scales include `−0.3…0.3` with step `0.1`, `0…1e-8` with step `1e-9`, and `999999.98…1000000` with step `0.01`. The scale `0…1.8e-6` with step `3e-20` has an unsupported interior point. The scale `999999999999999…1000000000000010` with step `11` exceeds the endpoint coefficient limit.

Browsers may serialize a tiny number in exponential notation. Read the numeric form value with `Number()`. Accessibility APIs can expose a coarser numeric slot for very close or extreme points. The accessible value text carries the same formatted string as the visible readout.

## Input and events

| Input                | Behavior                                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rail press or tap    | Moves the nearest eligible thumb. An exact tie between separate thumbs selects the upper thumb.                                                            |
| Drag a cap           | Keeps the original grip offset. When the two values match, either separated cap can be grabbed. A drag from the shared point selects a thumb by direction. |
| Arrow Up / Down      | Increases / decreases by one step.                                                                                                                         |
| Arrow Right / Left   | Increases / decreases by one step. Horizontal RTL reverses these two keys. Vertical minimum stays at the bottom in either direction.                       |
| Home / End           | Moves the focused thumb to its current lower / upper limit.                                                                                                |
| Page Up / Down       | Moves by roughly a tenth of the scale, with a minimum of one step.                                                                                         |
| Tab / Shift+Tab      | Moves between native focus targets in DOM order.                                                                                                           |
| Escape during a drag | Cancels the gesture and restores or proposes its starting value.                                                                                           |

`onValueChange` receives each distinct projected edit. In an uncontrolled field the native values and bounds are updated before the callback. In a controlled field the form still holds the last committed prop when the callback starts. The owner can accept the proposal by updating `value` synchronously. Asynchronous prop updates apply independently.

`onValueCommit` receives the last accepted value at the end of a changed gesture. Each adjustment key completes one gesture, including key repeat. Native range input completes on change or on blur if it delivered only input events. A rejected proposal, a canceled gesture, a round trip to the original value, and a form reset emit no commit. The captured pointer owns adjustments until released. Losing focus during a drag ends the gesture, leaving its latest accepted value in place.

Reset restores the mount-time uncontrolled default projected into the current domain. For a controlled field it keeps the latest accepted prop. A canceled or synthetic reset preserves the accepted value. Native disabled fieldsets apply, including the first legend exception. Inert controls block interaction and named inputs remain eligible for form submission.

Provide validation text outside the control and link it with `aria-describedby`. `status="danger"` changes feedback and accessibility state. Use application validation to decide when a form can submit.

Both controls inherit the theme and the surrounding Base or Overlay surface. Numeric placement updates immediately. The cap's color transition respects reduced motion and the rail, cap, and focus ring use system colors in forced-colors mode. Use the horizontal or vertical scale with the same public props on either surface.
