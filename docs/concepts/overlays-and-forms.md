# Overlays and Forms

Unica delegates floating surfaces and form state directly to native HTML and DOM platform capabilities rather than re-creating synthetic focus traps, `z-index` registries, or shadow form state in JavaScript.

## Browser Top Layer Architecture

Normal document flow uses only two stacking tokens (`--z-content: 0` and `--z-sticky: 100` for sticky headers and rails). Every floating surface promotes into the browser's native **top layer**, escaping `overflow: hidden` and `transform` ancestors cleanly:

| Overlay Family | Native Carrier | Dismissal & Focus Contract |
| --- | --- | --- |
| `Modal`, `Drawer` | `<dialog>` via `showModal()` | Browser-enforced background `inert`, focus containment inside the active dialog, native `cancel` / `Escape` coordination, and shared document scroll lock. |
| `Popover`, `Menu`, `ContextMenu`, `Select`, `DatePicker`, `DateRangePicker` | `popover="auto"` (or `manual` when nested composite focus owns dismissal) | Native top-layer promotion, `Escape` and outside-press light dismissal, and deterministic focus restoration to the invoking trigger. |
| `Combobox`, `Autocomplete`, `Tooltip`, `HoverCard` | `popover="manual"` | Trigger retains primary focus (`aria-activedescendant` or hover/focus intent) while the anchored panel floats in the top layer without stealing focus or collapsing auto-popover stacks. |
| `Toast` (`ToastViewport`) | `popover="manual"` | Persistent non-modal top-layer host; outside clicks on workspace content or modal scrims never dismiss active notifications. |

### Overlay coordination

Unica's internal runtime coordinates native admission and dismissal per document. Bound auto triggers use `popovertarget` and make one controlled open or close request per activation. A native dismiss collapses the trigger and finalizes the panel even if the caller still holds its previous open value. An exit phase collapses the trigger and makes the departing carrier inert. The runtime checks native state after layout and relevant DOM changes and returns focus when the departing surface owned it.

Escape normally follows the browser's auto-popover dismissal. Manual layers and modals receive a close request. A passive notification viewport is skipped. Inside a guarded modal, Escape closes a nested auto panel first and the next Escape reaches the modal's guard. The event still reaches application listeners.

If a modal would dismiss its invoking auto chain on entry, the runtime temporarily holds the chain open in manual mode while preserving the native layer order. The chain resumes after the modal barriers above it close. The document scroll lock is shared across physical Unica modals, and scrolling inside a dialog stays available.

### Keeping Toasts Interactive Above Active Modals

The native modal makes content outside its DOM subtree inert. A notification viewport can receive pointer and keyboard input by moving inside the active Unica dialog. Keep the queue, timer, and announcement state above the [Portal](../components/portal.md) so they survive the move.

A document-wide viewport follows the topmost active Unica modal. A scoped viewport follows it only if the dialog belongs to the viewport's DOM scope. While a modal in another scope is active, the local queue keeps its messages and defers its viewport until the scope becomes available. When no Unica modal is active, each viewport uses its ordinary portal host.

### Positioning Adapter & Discrete Transitions

Anchored panels pair native `popover` promotion with a lightweight positioning adapter:

- Computes collision-aware coordinates (`flip`, `shift`, logical `start` / `end` alignment across LTR and RTL) and writes `--anchor-width` and `--overlay-available-height` onto the floating element. The open panel follows anchor movement and changes to its reading direction.
- Sets `data-surface="overlay"` on the positioned container so nested controls automatically bind overlay tokens (see [Themes and Roles](themes-and-roles.md#contextual-surface-adaptation-base-vs-overlay)).
- Motion belongs to the family’s design and the active material. Native top-layer positioning does not require a shared slide or fade. The current [Popover design reference](../../apps/playground/src/prototypes/popover/README.md) uses immediate show/hide in every preset. Any future overlay transition must preserve focus and dismissal timing, respect `prefers-reduced-motion`, and fall back to immediate visibility when unsupported.

## Native `<form>` Participation

Every Unica data-entry control (`Input`, `Textarea`, `NumberInput`, `Checkbox`, `Radio`, `Switch`, `Select`, `Combobox`, `Autocomplete`, `DatePicker`, `DateRangePicker`, `Slider`, `RangeSlider`, `SegmentedControl`, `TagsInput`, `FileInput`, and `*Card` choices) behaves as a native `<form>` participant:

1. **`FormData` & constraint validation**
   Controls render a real native `<input>`, `<textarea>`, or `<select>` (or a synchronized hidden form association for composite multi-value widgets) carrying `name`, `value`, and HTML constraint attributes (`required`, `min`, `max`, `pattern`). `new FormData(form)` always reads the exact committed value.

2. **Deterministic `<form>` `reset`**
   Uncontrolled controls restore their current `defaultValue` / `defaultChecked` when their owning `<form>` fires `reset` — including composite pickers (`Select`, `TagsInput`, `DatePicker`, `Slider`). Controlled controls preserve the caller's `value` / `checked` prop authority across native resets.

3. **Availability states (`disabled`, `readOnly`, `loading`)**
   - `disabled`: Removes the control from tab order, pointer activation, value mutation, and `FormData` submission.
   - `readOnly`: Preserves focusability, assistive reading, text selection, and `FormData` inclusion while blocking edits and picker mutations.
   - `loading`: Sets `aria-busy="true"`, suppresses duplicate submit or clear actions, and locks resting box dimensions so forms and toolbars never shift.

4. **Controlled vs uncontrolled authority**
   Passing `value` / `checked` makes the caller authoritative on every render; interactions emit `onChange` proposals without mutating internal DOM state ahead of React commits. Omitting `value` / `checked` (`defaultValue` / `defaultChecked`) delegates state to the component and native DOM. Switching modes on a mounted instance triggers a development warning.

```tsx
<form
  onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    saveInvite({ email: String(data.get('email')), role: String(data.get('role')) });
  }}
>
  <Input name="email" type="email" defaultValue="" required />
  <Select name="role" defaultValue="editor" options={ROLE_OPTIONS} />
  <Button type="reset" variant="secondary" tone="neutral">Reset</Button>
  <Button type="submit" variant="primary" tone="accent">Invite</Button>
</form>
```
