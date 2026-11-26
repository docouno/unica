# Listbox

Use Listbox when people need to see the available choices while they work. It keeps a single or multiple selection in the page flow. Use Select for the same choices in a compact field. [Select](select.md)

```tsx
import { Listbox, type ListboxItem } from '@docouno/unica';
import '@docouno/unica/styles.css';

const columns = [
  { value: 'name', label: 'Name' },
  { value: 'owner', label: 'Owner', description: 'Person responsible for the document' },
  { value: 'updated', label: 'Last updated' },
] satisfies readonly ListboxItem[];

export function ExportColumns() {
  return (
    <form>
      <h2 id="export-columns">Export columns</h2>
      <Listbox
        aria-labelledby="export-columns"
        name="column"
        options={columns}
        multiple
        defaultValue={['name', 'updated']}
        required
      />
      <button type="submit">Export</button>
    </form>
  );
}
```

## Parts and props

| Part or prop | Contract |
| --- | --- |
| `Listbox` | A named `div[role="listbox"]`. Use `aria-label` or `aria-labelledby` for the question the list answers and `aria-describedby` for related instructions. The ref, class, style, and DOM events belong to this list. |
| `options` or `children` | Supply a readonly array of `ListboxItem` and `ListboxSection` entries, or compose `ListboxOption` and `ListboxGroup` directly. Fragments, arrays, and conditional children are supported. Use one source per instance. |
| `ListboxOption` | Takes a unique string `value`, string `label`, optional string `description`, optional `iconLeft` glyph, and `disabled`. The string label names the option. The description is exposed separately and the leading icon is decorative. |
| `ListboxGroup` | Takes a string `label` and its option children. Groups have one level. In data form, a `ListboxSection` has a `label` and readonly `options` of `ListboxItem` entries. |
| `multiple`, `value`, `defaultValue`, `onValueChange` | Single mode uses `string \| null` and defaults to `null`. Multiple mode uses `readonly string[]` and defaults to `[]`. `value` makes selection controlled. `defaultValue` sets the initial uncontrolled answer. The callback receives the proposed answer in the same shape, with each multiple key occurring once in selection order. Set a new React `key` when switching selection modes. |
| `size` | `s`, `m`, or `l`. Default `m`. The list is transparent and takes its material context from the surrounding surface. |
| `disabled`, `readOnly` | Disable selection and keyboard entry, or keep browsing while locking selection. Both default to `false`. |
| `emptyState` | Content shown outside the option list when the catalog has no rows. The default is “No options available”. |
| `selectedLabels` | Map of saved keys to labels for selections whose options may be absent, including on the first server render. |
| `messages` | Partial `PickerMessages` override. Listbox uses `empty`, `unavailableGroup`, `unavailableOption`, `removeUnavailable`, `unavailableDescription`, and `selectionAnnouncement(labels)`. |
| `name`, `form`, `required` | Form data key, optional form owner ID, and native required validation. |

Use stable keys for option values. If a catalog repeats a value, the first occurrence wins. Option and group refs point to the rendered HTML divs. Filter the data or render parts conditionally to change which choices appear.

```tsx
import { Listbox, ListboxGroup, ListboxOption } from '@docouno/unica';

<Listbox aria-label="Project role" defaultValue="editor">
  <ListboxGroup label="Project team">
    <ListboxOption value="editor" label="Editor" description="Edit project documents" />
    <ListboxOption value="viewer" label="Viewer" description="Read project documents" />
  </ListboxGroup>
</Listbox>
```

An application with its own list controller can render `ListboxOption` and `ListboxGroup` in a named `role="listbox"`. In this composition, provide the row's `selected` and `active` state, its `size`, and `reserveIconSpace` when rows should align with a shared leading icon column. The application owns navigation, focus, and selection.

## Keyboard and availability

- Tab enters the list in one step. Navigation starts on its first selected enabled row, or the first enabled row. With no enabled rows, focus stays on the list.
- Up, Down, Home, and End move the active row without committing a choice. Navigation skips disabled rows and stops at the ends. If the active row disappears or becomes disabled, navigation recovers to a nearby enabled row.
- Typing jumps by label prefix. Repeated letters cycle through matching rows. The typeahead buffer expires after 600ms.
- Enter, Space, and clicking commit the active choice. Multiple selection toggles one key at a time. Activating the current single choice keeps it selected without another callback.
- A selected disabled option keeps its check. A removed choice appears in an “Unavailable selection” group and can be activated to remove that one key. The label comes from the current catalog, the last known option label, `selectedLabels`, or the localized “Unavailable option” message, in that order. A read-only list retains the row and explains its availability.

Rows wrap long labels and descriptions. The check stays visible for selected rows, including in forced colors. Row minimum heights are 30, 40, and 48px, with a 44px minimum on coarse pointers.

## Native forms

- An empty single or multiple selection omits its entry. An explicitly selected empty-string key submits `''`. Use `FormData.getAll(name)` for multiple selections, which submit in selection order.
- Absent and individually disabled selected options still submit. The whole control is excluded from submission and validation when disabled, including by a disabled fieldset outside its first legend. Read-only retains the submitted answer and skips required validation.
- Interactive native validation moves focus to the list if the browser chooses it as the first invalid control. `checkValidity()` leaves focus in place.
- In uncontrolled mode, an accepted edit reaches `FormData` before the callback runs. In controlled mode, form data always reflects the value the owner has committed. Native reset restores the mount-time default, including order, or retains the controlled value. Reset and navigation leave the change callback count unchanged.

[Overlays and Forms](../concepts/overlays-and-forms.md) · [Support and Accessibility](../concepts/support-and-accessibility.md)
