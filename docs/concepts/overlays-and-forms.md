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

Unica's internal runtime coordinates native admission and dismissal per document using a protocol-versioned registry on the `Document`. Bound auto triggers use the native `popoverTargetElement` binding (crossing Shadow DOM boundaries) and emit one controlled open or close request per activation after React click handlers have run. Components own `aria-expanded` declaratively from their open state. A native dismiss finalizes the panel even if the caller still holds its previous open value. An exit phase disconnects the native invoker, makes the departing carrier `inert`, and can be canceled if the caller reopens before exit finishes. The runtime reconciles native state after layout, modal mutations, and ancestor visibility changes (dismissing nested popovers when a parent `<dialog>` or popover closes) and returns focus when the departing surface owned it unless the caller opts out.

Nested `popover="auto"` chains should remain inside their parent popover's DOM subtree (in-place or via a nested `PortalProvider`) so native light-dismiss ancestry stays reliable across all Baseline and Guarantee browsers, including releases where `showPopover({ source })` is not yet supported.

A single bubble-phase `keydown` listener on the document respects `event.defaultPrevented` from inner React widgets and DOM controls before routing `Escape`. Passive notification viewports are skipped, and foreign open top-layer surfaces are respected. Inside any active Unica modal, `Escape` closes a nested `auto` panel first so browser close-watcher grouping never dismisses the modal on the same keypress; the next `Escape` reaches the modal owner. Outside a modal, `auto` popovers delegate `Escape` to the browser, while `manual` layers and modals receive a close request. The event still reaches application listeners.

The document scroll lock is shared across physical Unica modals, compensates classic scrollbar gutter width to avoid horizontal layout shift when `scrollbar-gutter: stable` is absent, and leaves scrolling inside a dialog intact.

### Keeping Toasts Interactive Above Active Modals

The native modal makes content outside its DOM subtree inert. A notification viewport can receive pointer and keyboard input by moving inside the active Unica dialog. Keep the queue, timer, and announcement state above the [Portal](../components/portal.md) so they survive the move.

A document-wide viewport follows the topmost active Unica modal. A scoped viewport follows it only if the dialog belongs to the viewport's DOM scope. While a modal in another scope is active, the local queue keeps its messages and defers its viewport until the scope becomes available. When no Unica modal is active, each viewport uses its ordinary portal host.

### Positioning Adapter & Discrete Transitions

Anchored panels pair native `popover` promotion with a lightweight positioning adapter:

- Computes collision-aware coordinates (`flip`, `shift`, configurable viewport `padding`, and logical `start` / `end` alignment across LTR and RTL), writes `--anchor-width`, `--overlay-available-height`, and `--overlay-available-width` during layout sizing so constrained panels measure in one pass, and publishes logical `data-side` / `data-align` attributes onto the floating element. The open panel follows anchor movement and changes to ancestor `dir` attributes.
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
