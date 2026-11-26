# Chip and ChipGroup

Use Chip for an independent, compact choice such as Favorites. Use ChipGroup for a named facet or question that offers one choice or several. The active theme supplies the material. A leading check replaces the optional icon when selected. Text-only chips reserve the check's space so changing selection keeps their width and wrapping stable.

```tsx
import { Chip, ChipGroup } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function CollectionFilters() {
  return (
    <form>
      <Chip name="favorites" defaultChecked>Favorites only</Chip>
      <ChipGroup
        name="verification"
        label="Verification"
        defaultValue="all"
        items={[
          { value: 'all', label: 'All' },
          { value: 'verified', label: 'Verified' },
        ]}
      />
      <ChipGroup
        multiple
        name="format"
        label="Formats"
        defaultValue={['notes']}
        items={[
          { value: 'notes', label: 'Notes' },
          { value: 'guides', label: 'Guides' },
        ]}
      />
      <button type="submit">Apply</button>
      <button type="reset">Reset</button>
    </form>
  );
}
```

## API

| Component | Props | Behavior |
| --- | --- | --- |
| Chip | `children`, `textValue`, `iconLeft`, `size` | Supply a nonempty visible label. Noninteractive rich labels require a nonempty `textValue` equivalent to the visible text. The optional `GlyphSource` is decorative. Sizes are `s`, `m`, or `l` and default to `m`. |
| Chip | `checked`, `defaultChecked`, `onCheckedChange`, `onChange` | An independent native checkbox. Omit `checked` for an uncontrolled value. `onCheckedChange(next)` receives the proposed state. The subsequent React `onChange` sees the committed checkbox in `event.currentTarget`. |
| Chip | `ref`, `id`, `form`, `name`, `value`, `required`, `disabled` | The ref, native input attributes, ARIA attributes and input events address the checkbox. `className`, `style`, `hidden` and `data-*` apply to the visible root. |
| ChipGroup | `items`, `size` | Each item has a unique string `value`, a visible `label`, and optional `iconLeft` and `disabled`. Rich labels also require `textValue`. Item order is reading and submission order. The group sets a shared size. |
| ChipGroup | `label`, `aria-label`, `aria-labelledby`, `description`, `message`, `status` | Provide a visible legend through `label` or name the group through ARIA. Native accessible-name precedence applies. Description and message are appended to the supplied description ID list. `status="danger"` marks the available group invalid. Selections retain their ordinary materials. |
| ChipGroup | `multiple`, `value`, `defaultValue`, `onValueChange` | Single mode is the default. Its value is a string or `null`, starts unanswered by default and proposes a string. With `multiple`, the value is a readonly string array, starts empty by default and proposes an array. A new React key starts a new group when changing modes. |
| ChipGroup | `ref`, `form`, `name`, `required`, `disabled` | The ref addresses the native fieldset. All options share one native form owner. A group marked required needs one checked, enabled option whenever the group has enabled options. |

## Forms and keyboard

- A successful input contributes one entry when checked, enabled and named. A standalone Chip's default submitted value is `on`. An explicit empty string is a valid answer and submits an empty value. Multiple selections submit in option order, while the callback preserves selection order. Use distinct names for independent named radio groups in the same form and DOM root.
- Without a name, the group still supports selection, validation and reset. Use `form` on the group to associate every option with an external form. A removed key stays in the selection model and contributes again if the option returns while still selected.
- Native reset restores the uncontrolled mount-time default, including while the option list is empty. Controlled values follow the latest owner commit. Reset emits no change callbacks. A canceled activation or reset keeps the previous selection.
- Native capture listeners can observe the browser's preliminary checked state during a click. Direct change callbacks observe the committed selection.
- Disabled options keep their visible selection. They are excluded from keyboard navigation, submission and required validation. An ancestor disabled fieldset follows the native first-legend exception. For an immutable value that still needs submission, the application owns the submitted value.
- Single groups expose a radiogroup. Tab enters at the selected available option or the first available option. Space selects it. Arrows wrap and skip unavailable options. Left and Right follow the reading direction. Home and End select the first or last available option. Checkbox choices each have a native Tab stop and Space toggles the focused one.
- When a focused option disappears or becomes unavailable, focus moves to the next available option, then the previous one, then the group if it remains available. If the whole group disappears, the consumer owns the next focus target.
- Interactive validation focuses the first available option for a missing group answer. `checkValidity()` leaves focus in place. The application owns persistent error copy and may supply it through `message`.

## Long labels and results

`--chip-max-width` caps each chip. Set it on one chip or an ancestor to apply it throughout a group. Groups wrap whole chips. Clipped labels keep their full accessible name, unless the consumer supplies an explicit ARIA name. Hover or keyboard focus opens a Tooltip with the full visible label. Its text is useful for visual inspection and copying. Escape dismisses the hint before an enclosing overlay. Rich label content belongs to the same selection target.

Use short, distinguishable labels where possible. When touch users must choose between long names with a shared prefix, give them a way to read the complete labels before choosing. An alternate chooser can share the same controlled values and leave form submission to the primary group.

Result loading and failure belong beside the results. Keep the choices available, preserve their checks and give the user a way to retry. Apply only the latest result when requests complete out of order.
