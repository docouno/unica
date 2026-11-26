# NumberInput

`NumberInput` edits a numeric quantity in a native spinbutton, with persistent decrease and increase actions. Import `NumberInput`, `NumberInputProps`, `ControlSize`, `FieldVariant`, and `FieldStatus` from `@docouno/unica`. Load `@docouno/unica/styles.css` with your application styles. For text such as postal codes and identifiers with significant leading zeros, use [Input](input.md).

```tsx
import { NumberInput } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function SpendingLimit() {
  return (
    <form>
      <label htmlFor="limit">Spending limit in US dollars</label>
      <NumberInput
        id="limit"
        name="limit"
        min={0}
        suffix="USD"
        defaultValue=""
        aria-describedby="limit-hint"
      />
      <p id="limit-hint">Leave empty for no limit. Zero blocks all spending.</p>
      <button type="submit">Save limit</button>
    </form>
  );
}
```

## Props

| Prop | Values and behavior |
| --- | --- |
| `value`, `defaultValue` | A finite `number` or `''`. Set `value` for controlled editing. An undefined `value` lets the field own its value. `defaultValue` sets the initial and reset value in that mode. The default is empty. |
| `onValueChange` | `(value: number \| '') => void`. Receives proposals from complete numeric edits, clears and steps. An unfinished edit, unchanged number or prop update leaves the callback silent. |
| `min`, `max`, `step` | Optional finite bounds. `step` is a positive finite number or `'any'`. An omitted or invalid numeric step uses `1`. Inverted bounds make both actions unavailable. |
| `size` | `s`, `m` (default) or `l` for heights of 30, 40 or 48 CSS pixels. Use `l` for 44 × 46 px touch targets. |
| `variant` | `default` frames the field. `ghost` uses a quiet baseline for inline editing. Both adapt to the surrounding theme and overlay surface. |
| `width` | `full` (default) fills the slot. `auto` sizes to its amount, actions and feedback with an 8ch minimum basis for the amount group. The shell caps at its container. Long numbers remain horizontally editable and affixes can truncate. |
| `prefix`, `suffix` | Text decorations outside the numeric value. Include meaningful units in the label or accessible description. |
| `decrementLabel`, `incrementLabel` | Accessible names for the actions. The defaults are `Decrease value` and `Increase value`, including when a label is blank. |
| `status`, `loading` | Status is `neutral` (default), `info`, `success`, `warning` or `danger`. Danger sets `aria-invalid`. Loading shows a spinner and sets `aria-busy` while editing and stepping remain available. Both indicators can appear together. |
| `className`, `style`, `dir`, `hidden`, `inert` | Apply to the whole field. The actions follow the shell's direction. The editor stays left-to-right so signed values keep their reading order. |
| `ref` | The native `HTMLInputElement`, including React 19 callback-ref cleanup. |

Native props and events including `id`, `name`, `form`, `required`, `disabled`, `readOnly`, `placeholder`, `autoComplete`, `inputMode` (default `decimal`), `tabIndex`, accessible naming and description, and custom `data-*` belong to the editor. Use a native label or an accessible name and connect instructions with `aria-describedby`. The field owns its native spinbutton semantics, `aria-invalid` and `aria-busy`.

Within a single-control [FormField](form-field.md), NumberInput uses the field's `controlId` and inherits its size, status, disabled, read-only, and required defaults. Explicit editor props override those defaults. The native editor combines author descriptions with the field's instructions, feedback, and count. Its matching status glyph takes precedence over the message-row glyph after hydration. For a composite field, give each editor its own label and connect its local feedback.

## Typing, validation and stepping

- Typing, blur and Enter preserve the native draft. The browser applies `required`, bounds and step validation. A field from 0 to 50 keeps a typed 125, reports a range overflow and offers a single inward step to 50. Connect persistent validation text after blur, a check or attempted submission. Use `setCustomValidity` through the ref to add a constraint. Visual `status` alone leaves the form's validity unchanged.
- Each step moves to the first permitted point in its direction. For `min={0}` and `step={5}`, 12 steps down to 10 or up to 15. A `max={12}` leaves only the downward action. The browser's step base is `min` when supplied, otherwise the native value attribute, falling back to zero. For example, `defaultValue={2}` with `step={5}` and no `min` uses the grid through 2 and 7. In controlled mode an accepted prop also updates the value attribute. Give the field an explicit `min` to keep the origin fixed across edits.
- An empty field starts one step from zero within the reachable domain. At `min={0}`, a decrease fills in zero. When all permitted values have the same sign and the range excludes zero, either action starts at the permitted value closest to zero. With `step="any"`, the actions add or subtract one, preserving the fractional part up to the bound.
- Steps use decimal arithmetic, so a tenth added to 0.2 produces 0.3. A step is unavailable when its nearest mathematical result cannot round-trip as a finite JavaScript number or cannot satisfy the browser's number constraints. Typing stays native. The proposal uses `valueAsNumber`, and `FormData` retains the native string. For example, typing `9007199254740993` may submit that exact string while the JavaScript projection is `9007199254740992`.

## Events and forms

A named, enabled field submits its native string, even when owned by an external form through `form`. Optional empty values submit `''`. Zero submits `'0'`. A browser can also expose an unfinished sign or exponent as `''`. Check `input.validity.badInput` in `onInput` to distinguish it from a clear. Listen to `onInput` when the draft string or validity matters, including edits that leave the numeric value unchanged. React's `onChange`, when delivered for the same edit, runs before `onValueChange`.

An available button, arrow or repeat step writes its candidate and emits a bubbling native `input` followed by `change`. For uncontrolled editing, the candidate is already in the form when observers run. In controlled editing, update the prop to accept or replace the proposal. A declined proposal restores the latest committed value after the edit. Caret and draft spelling are preserved while the native edit projects to the accepted number. During IME, intermediate input remains under browser control and the numeric callback waits for completion.

A native reset immediately restores the uncontrolled mount default or the latest controlled value. Reset leaves edit callbacks silent. Disabled fields, including those disabled by a fieldset, are omitted from submission and suppress validation and loading visuals. Read-only fields remain selectable, focusable and submittable. An inert field remains eligible for submission while interactions are blocked.

When a script changes or moves the owning form during reset and inserts text synchronously through `document.execCommand()`, the browser can expose the same editor state for an applied or skipped reset. `FormData` retains the native draft. In this sequence, `onValueChange` can omit the edit or report the reset value.

## Keyboard and pointer

Tab visits the editor once. The named action buttons are also available to assistive activation. Up and Down step one point in their direction. Editing keys, modified shortcuts, Enter and Escape keep their browser or surrounding application behavior. Mouse activation keeps or returns focus to the editor. Touch and assistive activation leave focus where it was. Holding an action starts after 450 ms and repeats every 100 ms, with no extra step on release. Ordinary wheel scrolling stays with the surrounding content. On older Firefox versions that spin focused number fields, NumberInput routes unmodified line or page wheel input to the surrounding container and honors event cancellation. Modified wheel gestures use the browser's own behavior.

Keyboard focus shows a contour around the field. System colors preserve the outline and distinguish unavailable actions. The Spinner respects reduced motion. Keep any checking explanation in a linked status region outside the busy field.

NumberInput supports React DOM server rendering and hydration. In React Server Components, import its runtime from a client module. The server entry exposes the same TypeScript types.

See [Overlays and Forms](../concepts/overlays-and-forms.md#native-form-participation) and [Feedback and Errors](../concepts/feedback-and-errors.md).
