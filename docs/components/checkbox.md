# Checkbox

Use `Checkbox` for an independent selection, a consent flag, or an aggregate selection such as “Select all.” Use `CheckboxGroup` to label related options, manage their selected keys, or require a minimum selection.

```tsx
import { Checkbox, CheckboxGroup } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ExportForm() {
  return (
    <form>
      <CheckboxGroup
        aria-label="Export contents"
        name="contents"
        defaultValue={['documents']}
        required
      >
        <Checkbox label="Documents" value="documents" />
        <Checkbox label="Comments" value="comments" />
        <Checkbox label="Revision history" value="history" />
      </CheckboxGroup>
      <button type="reset">Reset</button>
      <button type="submit">Export</button>
    </form>
  );
}
```

## Checkbox

| Prop | Contract |
| --- | --- |
| `label`, `description` | Optional React nodes for the visible option name and persistent help. Supply a linked external label or an ARIA name when omitting `label`. The description appends its ID to `aria-describedby`. |
| `checked`, `defaultChecked` | Controlled or initially checked state. Defaults to unchecked. A group-managed option derives its state from the group's selected keys. |
| `indeterminate` | Displays and exposes a mixed state. Defaults to false. The native `checked` state determines submission independently. |
| `onCheckedChange(next)` | Receives the proposed boolean on user activation. `onChange` receives the React event after checkedness has been reconciled. In a controlled field, the event's input can still contain the previous committed value. |
| `size` | `s`, `m`, or `l`. The item size wins over the group size and then defaults to `m`. |
| `status` | `neutral` or `danger`. The item status wins over the group status and then defaults to `neutral`. Enabled danger controls expose `aria-invalid`. |
| `disabled`, `readOnly` | Each combines with its counterpart on the group. Read-only keeps focus, value, and validation while blocking edits. Disabled also follows native fieldset rules. |
| `id`, `name`, `form`, `value`, `required`, `ref` | These props, ARIA attributes, and input events target the actual `HTMLInputElement`. A checked, enabled, named Checkbox submits `value`, which defaults to `"on"`. The empty string is a value. Item-level `required` requires that Checkbox to be checked. |
| `className`, `style`, `hidden` | Apply to the visible label row. |

Space or clicking the indicator or its label proposes a toggle. A canceled activation preserves the current value and callback count. The direct change callbacks run after the browser confirms the activation. Use `onClick` to cancel or control propagation of the click. Enter retains native form behavior. Tab moves to each available Checkbox. For “Select all,” compute checked and mixed state from the editable items and update those items in `onCheckedChange`. Keep read-only and disabled selections under their existing owners.

## CheckboxGroup

| Prop | Contract |
| --- | --- |
| `children`, `ref`, native div attributes | The root is a div with `role="group"`. Give it a name with `aria-label` or `aria-labelledby`; use `aria-describedby` to reference shared help or errors. |
| `value`, `defaultValue`, `onValueChange(next)` | Supplying any of these gives the group ownership of the selected string keys. Without an initial selection it starts empty. Give each item a unique string `value`. A newly selected key appends to `next`. A deselection removes that key. |
| `size`, `status`, `disabled`, `readOnly` | Provide the item defaults and availability rules described above. An available group with `status="danger"` exposes `aria-invalid`. |
| `orientation` | `vertical` (default) or `horizontal`. Each available item remains a separate Tab stop. |
| `name`, `form` | Supply a common form name or associate the group with an external form ID. See [binary group form ownership](../concepts/overlays-and-forms.md#binary-group-form-ownership). |
| `required`, `requiredMessage` | Require at least one enabled, checked member, even when that member has no `name` or is read-only. Customize the native validation text with `requiredMessage`. Each item's own `required` still applies. |

An empty required group puts the group error on an eligible input and prefers a visible option for interactive validation. Application-set custom validity takes precedence on its input. The minimum still applies when the application replaces or clears a custom error. Explain the minimum in the group label or help, and render shared error copy once in the application. A group with no eligible inputs allows the form to proceed. The [forms guide](../concepts/overlays-and-forms.md#binary-group-form-ownership) describes when native validity reflects a group update.

`FormData.getAll(name)` follows input order in the document. The group callback follows selection order, so choosing the second item before the first produces the second key first in the callback and the first item first in `FormData`. Reset restores the mount-time uncontrolled selection or the latest controlled commit without a change callback.

## CheckboxIndicator

Use `CheckboxIndicator` as decorative chrome in a composition that already owns its native input. Its `size` defaults to `m` and `checked`, `indeterminate`, and `disabled` default to false. It renders an aria-hidden span and accepts a React 19 `Ref<HTMLSpanElement>`. Pass the option's current state to keep its checkmark or mixed dash in sync. The indicator follows the current theme and Base or Overlay surface. Pixel uses square corners, and forced colors preserve the frame and selection mark.

The package exports `CheckboxProps`, `CheckboxGroupProps`, and `CheckboxIndicatorProps` as types.
