# SegmentedControl

Use `SegmentedControl` to choose one setting from a small group of short, peer options. Common examples include a view mode, a time range, or a compact form answer. Give the group the name of the setting and each option the name of its value.

```tsx
import { SegmentedControl, type SegmentedControlOption } from '@docouno/unica';

const formats = [
  { value: 'summary', label: 'Summary' },
  { value: 'table', label: 'Table' },
  { value: 'chart', label: 'Chart' },
] satisfies readonly SegmentedControlOption[];

export function ReportFormat() {
  return (
    <form>
      <SegmentedControl
        aria-label="Report format"
        name="format"
        items={formats}
        defaultValue={null}
        required
      />
      <button type="submit">Save</button>
      <button type="reset">Reset</button>
    </form>
  );
}
```

| Prop | Contract |
| --- | --- |
| `items` | Readonly array of options with unique string `value` keys and short string `label`s. An option can have a leading `iconLeft` glyph or be `disabled`. `iconOnly: true` requires a glyph and uses the label as its accessible name. Available icon-only options show that label as a tooltip on hover and keyboard focus. |
| `aria-label`, `aria-labelledby` | Supply an accessible group name. Use `aria-describedby` to associate help or error text. |
| `value`, `defaultValue` | Controlled and initial uncontrolled values of type `string \| null`. Omitting both starts at the first available option, or at no selection when all options are unavailable. |
| `onValueChange` | Receives the string selected by the user. Repeated activation of the selected option and native reset leave the callback count unchanged. |
| `size` | `s`, `m`, or `l`. Default `m`. |
| `orientation`, `width` | `horizontal` or `vertical`, and `auto` or `full`. Defaults are `horizontal` and `auto`. |
| `name`, `form`, `required` | Form data key, optional form owner ID, and native required validation. |
| `disabled`, `readOnly` | Disable the entire group, or preserve focus and the submitted value while locking edits. |
| `status` | `neutral` or `danger`. Use `danger` with associated error text. |
| `ref` and HTML props | The ref points to the root `HTMLDivElement`. Ordinary root attributes and events include `id`, `className`, `style`, `dir`, and `onKeyDown`. |

## Keyboard and layout

Tab and Shift+Tab visit one radio in each direction. The selected available radio is the entry point. With an empty selection or an unavailable selected radio, entry falls on the first available option without changing the value.

Arrow keys move focus and select, skipping unavailable options and wrapping at the ends. Left and Right follow the rendered reading direction. Up and Down follow the option order. Home and End move to and select the first or last available option. Space selects the focused radio. A controlled owner can keep the selected value while focus moves.

The active theme supplies the rail and plate material. Options keep their labels on one line. Use short labels, allow a wider slot, or choose a vertical layout when space is limited. A narrow rail can scroll independently to reveal the focused or selected option.

## Native forms

- `null` leaves the form entry absent. A matching `''` option is a real selection and submits an empty string. An unknown key has no selection until its option appears.
- An accepted value survives temporary removal or individual disabling of its option. If the option returns, its selected plate returns. Use a distinct `name` for each independent group in the same form.
- A group without a public name can validate and reset without adding a form-data entry. A disabled group is excluded from validation and submission, including under a disabled fieldset outside its first legend. A read-only group keeps its value and skips required validation.
- The group submits its committed value through one native form control. Its radios share the form owner for native reset.
- An uncontrolled change writes the new native value before calling `onValueChange`. A controlled change proposes a value and keeps submitting the last committed value until the owner updates `value`.
- Use `onValueChange` to observe choices. A radio click settles after its handlers, so a canceled click cannot change the submitted value.
- Native reset restores the mount-time default for uncontrolled groups. Controlled groups keep the accepted value.

See [Overlays and Forms](../concepts/overlays-and-forms.md) and [Support and Accessibility](../concepts/support-and-accessibility.md).
