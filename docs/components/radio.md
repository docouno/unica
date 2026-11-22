# Radio

Use `RadioGroup` and `Radio` for a single answer from a visible set of choices. Each option uses an actual `<input type="radio">` with a stable focus target and native form submission.

```tsx
import { Radio, RadioGroup } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ReviewMode() {
  return (
    <form>
      <RadioGroup aria-label="Review mode" name="reviewMode" defaultValue="review" required>
        <Radio label="Review before publishing" value="review" />
        <Radio label="Publish immediately" value="publish" />
        <Radio label="Use the workspace default" value="" />
      </RadioGroup>
      <button type="submit">Save</button>
    </form>
  );
}
```

## Radio

| Prop | Contract |
| --- | --- |
| `label`, `description` | Optional React nodes for the option name and persistent help. External labels and explicit ARIA names also work. The description appends its ID to `aria-describedby`. |
| `value` | Give each grouped option a unique string. The empty string is a valid chosen answer. A standalone Radio defaults to the native value `"on"`. |
| `size`, `status` | The item wins over the group. Size is `s`, `m` (default), or `l`. Status is `neutral` (default) or `danger`. Enabled danger controls expose `aria-invalid`. |
| `disabled` | Makes the option unavailable and excludes it from submission. A selected option retains its visual mark when disabled. |
| `checked`, `defaultChecked` | Control or initialize a standalone Radio. In a `RadioGroup`, the group owns checkedness. |
| `id`, `name`, `form`, `required`, `ref` | These props, ARIA attributes, and input events target the actual `HTMLInputElement`. Standalone radios with the same nonempty name, DOM root, and form owner form a native group. |
| `className`, `style`, `hidden` | Apply to the visible label row. |

Use the group's `onValueChange` for a proposed answer. A Radio's native React `onChange` runs on the activated option after the committed state is reconciled. In a controlled Radio, `event.currentTarget.checked` can represent the preceding commit. A change that unchecks a peer has no second change event.

## RadioGroup

| Prop | Contract |
| --- | --- |
| `children`, `ref`, native div attributes | The root is a div with `role="radiogroup"`. Give it a name with `aria-label` or `aria-labelledby` and attach shared help or feedback with `aria-describedby`. |
| `value`, `defaultValue`, `onValueChange(next)` | Set the current or initial selected key, and observe the proposed key. The default is `null` for no answer. An unknown or unmounted key has no submitted entry. |
| `name`, `form` | The group owns a common name and form association. An omitted or empty name generates a stable per-instance native name, including the submitted key. Set an explicit nonempty name for a predictable payload key. Independent groups in a form need distinct names. |
| `size`, `status` | Supply defaults for the options. An available group with `status="danger"` exposes `aria-invalid`. |
| `orientation` | `vertical` (default) or `horizontal`. Layout can wrap and navigation follows the options' document order. |
| `disabled`, `readOnly` | Disabled makes the entire group unavailable. Read-only keeps the available focus entry and committed answer while blocking selection. The group exposes its availability and read-only state to assistive technology. |
| `required` | Exposes `aria-required` on the group and requires an enabled selected answer when available options exist. A selected disabled option is excluded from submission and the group needs an available replacement. A chosen `value=""` satisfies the constraint. |

Tab enters at the selected available option, or at an available option when the selection is missing or disabled. Entering and leaving the group preserves the answer. Arrow keys wrap, moving focus and proposing the corresponding value. Up and Down follow document order. Left and Right follow native radio direction behavior. Home and End move to the first and last available options and propose their values. Space selects the focused option. Enter retains native form behavior. Read-only prevents selection gestures.

In a controlled group, the form reflects the previous committed answer until the application updates `value`. An uncontrolled group commits the answer before its callback. A completed native reset restores the initial answer or preserves the latest controlled commit, without a change callback. For form association and validation timing see [Overlays and Forms](../concepts/overlays-and-forms.md#binary-group-form-ownership).

## RadioIndicator

`RadioIndicator` is the decorative dot and frame for a composition that supplies its own labeled input. Pass `size` (`m` by default), `checked`, and `disabled` from that input's current state. Its aria-hidden span takes `Ref<HTMLSpanElement>`. It reads the active theme and Base or Overlay surface, stays circular in Pixel, and preserves the selection dot in forced colors.

The package exports `RadioProps`, `RadioGroupProps`, and `RadioIndicatorProps` as types.
