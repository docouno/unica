# Select

Use Select for a compact field that chooses one or more values from a finite catalog. Search is optional and lives inside the panel. Use Listbox when the choices should stay visible as the user works. [Listbox](listbox.md)

```tsx
import { Select, type ListboxItem } from '@docouno/unica';
import '@docouno/unica/styles.css';

const roles = [
  { value: 'viewer', label: 'Viewer', description: 'Read documents' },
  { value: 'editor', label: 'Editor', description: 'Edit and publish documents' },
] satisfies readonly ListboxItem[];

export function InviteRole() {
  return (
    <form>
      <label htmlFor="invite-role">Role</label>
      <Select id="invite-role" name="role" options={roles} placeholder="Choose a role" required />
      <button type="submit">Invite</button>
      <button type="reset">Reset</button>
    </form>
  );
}
```

## Parts and props

| Part or prop | Contract |
| --- | --- |
| `Select` | Owns the selection, trigger, and panel. Give the field a stable name with a native `label` associated by `id`, `aria-label`, or `aria-labelledby`. Use `aria-describedby` for help or error text. |
| `options` or compound parts | Use readonly `ListboxItem` and `ListboxSection` data for the default layout. For explicit parts, include one `SelectTrigger` followed by one `SelectContent`. Use root `options` with an empty Content, or put `SelectOption` and `SelectGroup` inside Content. |
| `SelectTrigger` | The native `button` with `type="button"` that shows the selection. Both root and trigger refs resolve to this button. The root supplies the field ID, naming, and state. Root `className` and `style` style the layout wrapper. Those props on `SelectTrigger` style the button. |
| `SelectContent` | The in-place native auto popover. Its ref resolves to a div. It owns the panel's role, generated IDs, visibility, and focus behavior. |
| `SelectOption`, `SelectGroup` | Use the same option and section data as Listbox. Options accept `value`, `label`, `description`, `iconLeft`, and `disabled`. Groups take a `label` and option children. Their refs resolve to rendered divs. |
| `multiple`, `value`, `defaultValue`, `onValueChange` | Single mode uses `string \| null` and defaults to `null`. Multiple mode uses `readonly string[]` and defaults to `[]`. `value` makes selection controlled. `defaultValue` sets the initial uncontrolled answer. The callback receives the proposed answer in the same shape, with each multiple key occurring once in selection order. Set a new React `key` when switching modes. |
| `open`, `defaultOpen`, `onOpenChange` | Control visibility or set the initial uncontrolled state. The default is closed. The callback reports visibility requests and completed dismissals. |
| `size`, `variant`, `width` | `s`, `m`, or `l` (default `m`). Use `default` framed chrome or `ghost` for inline fields. Use `full` parent width or `auto` content width up to the parent width. |
| `placeholder`, `iconLeft` | Empty trigger text and optional decorative leading glyph. `placeholder` overrides `messages.placeholder`. |
| `status` | Trigger feedback of `neutral` (default), `info`, `success`, `warning`, or `danger`. Use `danger` with associated error text. |
| `searchable`, `clearable` | Enable local query search or offer an explicit clear action for a nonempty single selection. Multiple selection includes a clear action whenever it has an answer. |
| `disabled`, `readOnly`, `loading` | Disable the whole field, permit browsing without edits, or signal pending data and prevent selection changes. All default to `false`. |
| `emptyState`, `errorState` | Supply content for a successful empty catalog or for a failed request. Error content can include a Retry button that calls application code. |
| `selectedLabels`, `messages` | Supply labels for saved keys absent from the catalog and override any subset of the English picker messages. |
| `name`, `form`, `required` | Form data key, optional form owner ID, and native required validation. |

```tsx
import { Select, SelectContent, SelectGroup, SelectOption, SelectTrigger } from '@docouno/unica';

<Select aria-label="Activity sources" multiple defaultValue={['comments']} searchable>
  <SelectTrigger />
  <SelectContent>
    <SelectGroup label="Workspace">
      <SelectOption value="comments" label="Comments" />
      <SelectOption value="mentions" label="Mentions" />
    </SelectGroup>
  </SelectContent>
</Select>
```

The main and compound parts compose shared DOM handlers. Calling `preventDefault()` on an activation event cancels the built-in action.

Filter the data or render option and group parts conditionally to change which choices appear.

## Search, selection, and dismissal

| Interaction | Result |
| --- | --- |
| Click, Enter, Space, Up, or Down on the trigger | Opens the panel. Entry starts on the first selected enabled option or the first enabled option. Keyboard and mouse opening focus search when available. Touch opening focuses the list so the screen keyboard waits for a tap on search. |
| Up, Down, Home, End, or label typeahead in a plain list | Browses enabled rows without changing the answer. Arrows stop at the ends. Typeahead matches label prefixes. |
| Search input | Filters labels, descriptions, and group names case-insensitively. Up and Down move the active row, Enter confirms it, and Space, Home, and End edit or navigate the query. The Enter that completes input composition leaves the selection and form alone. |
| Activate an option | Single confirms and closes. Multiple toggles one choice and keeps the panel open. |
| Clear search or selection | Clearing search restores unfiltered options and keeps focus in search. Clearing single selection closes the panel. Clearing multiple selections keeps the panel and query. |
| Escape | Closes the panel and returns focus to the available trigger. Inside a modal, Escape dismisses Select first. |
| Tab, Shift+Tab, or outside press | Moves through panel controls in DOM order. Tab past the panel moves forward past the trigger. Shift+Tab before the first control returns to the trigger. Outside press leaves focus and activation to its target. |

The query clears on dismissal. Applied selections remain committed. A native dismissal takes effect even if controlled `open` is still `true`. Accept the `false` notification in the owner to keep visibility state in sync. A subsequent activation or a new `false` to `true` transition can reopen the panel.

A plain popup exposes a named listbox. Panels with search, header controls, or recovery expose a named non-modal dialog. The trigger keeps its field name and exposes the full selected answer to assistive technology. The visible single-line summary shows names in selection order and adds `+N` for names that do not fit. When the first name alone is too long, it truncates while keeping the count and caret visible.

## Availability and messages

- An initial load shows a written status. During refresh, keep passing the last successful catalog so people can browse and filter while edits are locked.
- An error keeps the saved answer and query. Search stays disabled until recovery. With a Retry action, focus can move to Retry and return to the panel when the catalog is ready.
- A no-match result offers search recovery while keeping the saved choices. A successful catalog that omits a saved choice shows it under “Unavailable selection” with an option to remove it. The current or last known label takes precedence over `selectedLabels`. The localized unavailable label is the final fallback.
- Read-only lets people open and search the catalog while keeping the answer locked. Disabled takes precedence over loading and validation feedback.

Pass `messages` to localize fixed copy and generated text. `PickerMessages` includes string keys `placeholder`, `searchLabel`, `clearSearch`, `clearSelection`, `selectedValue`, `readOnly`, `loading`, `updating`, `empty`, `unavailableGroup`, `unavailableOption`, `removeUnavailable`, `unavailableDescription`, and `noMatchesHint`. The formatters `selectedCount(count)`, `noMatches(query)`, and `selectionAnnouncement(labels)` return strings.

## Placement and forms

The browser puts the in-place panel in its top layer, including inside `<dialog>`. The panel starts below the trigger at logical start, with an 8px gap and 16px viewport clearance. It is at least as wide as the trigger or 264px, within the available width. The panel can flip for space and keeps its side when filtering while there is room. Long lists scroll beneath their header and search. The active theme supplies the overlay material. Reduced motion retains a static activity glyph and forced colors retain the selection and focus cues.

Select follows the Listbox form contract. Its permanent native control submits committed keys, including while the panel is closed or filtered. A multiple answer submits repeated entries in selection order and native reset restores the default order. An empty answer omits entries, while a selected empty-string key is a real answer. Interactive validation delegates focus to the trigger. A completed reset closes the panel and clears the query while an external reset button can keep its focus. The search query never becomes a form value.

[Listbox form behavior](listbox.md#native-forms) · [Overlays and Forms](../concepts/overlays-and-forms.md) · [Support and Accessibility](../concepts/support-and-accessibility.md)
