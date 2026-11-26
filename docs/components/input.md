# Input

`Input` renders a single native HTML input for one line of text. Import `Input` and the types `InputProps`, `ControlSize`, `FieldVariant`, and `FieldStatus` from `@docouno/unica`. Load `@docouno/unica/styles.css` with your application styles.

Use [FormField](form-field.md) for labeled form layouts. It provides the control ID and shared description, and acts as the default for size, status, disabled, read-only, and required.

```tsx
import { Input } from '@docouno/unica';

export function ContactField() {
  return (
    <div>
      <label htmlFor="contact">Work email</label>
      <Input
        id="contact"
        name="email"
        type="email"
        autoComplete="email"
        aria-describedby="contact-hint"
        defaultValue=""
        required
        clearable
      />
      <p id="contact-hint">Use the address where you receive work mail.</p>
    </div>
  );
}
```

## Props

| Prop | Values and behavior |
| --- | --- |
| `type` | `text` (default), `search`, `email`, `url`, `tel`, or `password`. |
| `size` | `s`, `m` (default), or `l` for 30, 40, or 48 CSS pixels. |
| `variant` | `default` for a framed field or `ghost` for inline editing above a straight baseline. Both adapt to the surrounding material. |
| `status` | `neutral` (default), `info`, `success`, `warning`, or `danger`. An enabled danger field sets `aria-invalid="true"`. An explicit status does not set native validity. |
| `width` | `full` (default) fills the container. `auto` caps the width at 20rem. |
| `iconLeft`, `iconRight` | Decorative `GlyphSource` values at logical start and end. Validation and loading take priority over the trailing icon. |
| `prefix`, `suffix` | Decorative strings outside the editable value. Use the accessible label or description to communicate any meaningful unit or affix. |
| `clearable`, `clearLabel`, `onClear` | Opt into a Clear button, optionally translate its label (default `Clear value`), and observe an activation. The ordinary `onChange` runs with the empty candidate before `onClear`. |
| `loading` | Exposes `aria-busy` and a decorative Spinner. Editing and selection remain available. A visible Clear button stays in place and becomes unavailable. |
| `value`, `defaultValue`, `onChange` | Use a string `value` with a synchronous change handler for controlled editing. Use a string `defaultValue` for an initial uncontrolled value. An omitted initial value is empty. |
| `className`, `style`, `hidden`, `inert`, `dir` | Apply layout, visibility, or inertness to the whole control. `dir` also sets the native input's direction. |
| `ref` | The `HTMLInputElement`, including support for a React 19 callback-ref cleanup. |

Native text input attributes and events go to the input. These include `id`, `name`, `form`, `required`, `readOnly`, `disabled`, `autoComplete`, `inputMode`, `pattern`, `minLength`, `maxLength`, `multiple` for email, accessible naming and description attributes, and author-defined `data-*` attributes. Input owns `aria-invalid` and `aria-busy`. Provide a native label or accessible name for each control and connect instructions with `aria-describedby`.

Give editable Ghost fields a visible, descriptive `placeholder` whenever they can be empty. The hint identifies what belongs in the inline editing area before entry and after Clear. Keep an accessible name for the field throughout editing.

## Editing and forms

- The actual input supplies `FormData` and native constraint validation, including when the named input belongs to a separate form through `form="…"`. Use native attributes or `ref.current.setCustomValidity(message)` to block submission.
- Uncontrolled edits reach the form as they happen. A completed native reset restores the mount-time default. A controlled reset restores the latest committed prop. Reset leaves user edit callbacks silent. Each type applies the browser's own value normalization.
- The controlled `onChange` event exposes the native candidate. When the owner declines an edit, the input returns to its committed value after the edit. During IME composition, the native preedit text remains in the input and in `FormData`. When composition ends, the latest controlled prop takes effect.
- An enabled, nonempty, editable input can be cleared by pointer, Enter, or Space on its Clear button. Focus returns to the input. An owner can decline the proposed empty value. Search retains its native keyboard behavior.
- Read-only fields remain selectable, focusable, and submittable. Disabled controls, including those in a disabled fieldset, suppress validation and loading feedback and are excluded from submission. Inert fields are excluded from focus and pointer interaction and remain eligible for submission.
- Pointer focus shows the editing edge. Keyboard focus adds an outer outline, while keyboard focus on Clear is local to that button. The Spinner also works with reduced motion.

For a check that completes later, keep a polite status region mounted outside the busy input. Describe the field with that region and any persistent hint. Set the result only for the current candidate, and clear an earlier result on the next edit.

```tsx
import { Input, type FieldStatus } from '@docouno/unica';

export function AddressField({
  address,
  onAddressChange,
  checking,
  status,
  message,
}: {
  address: string;
  onAddressChange: (value: string) => void;
  checking: boolean;
  status: FieldStatus;
  message: string;
}) {
  return (
    <div>
      <label htmlFor="address">Workspace address</label>
      <Input
        id="address"
        name="address"
        prefix="@"
        value={address}
        onChange={(event) => onAddressChange(event.currentTarget.value)}
        aria-describedby="address-hint address-result"
        loading={checking}
        status={status}
        clearable
      />
      <p id="address-hint">Use lowercase letters, numbers, and hyphens.</p>
      <p id="address-result" role="status">{message}</p>
    </div>
  );
}
```

Input supports React DOM server rendering and hydration. In React Server Components, import its runtime from a client module. The server entry exposes the same TypeScript types.

See [Overlays and Forms](../concepts/overlays-and-forms.md#native-form-participation) and [Feedback and Errors](../concepts/feedback-and-errors.md).
