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

### Keeping Toasts Interactive Above Active Modals

Calling `dialog.showModal()` promotes the `<dialog>` into the top layer and marks every DOM node outside that active `<dialog>` subtree `inert`. Merely re-opening a `popover="manual"` host in `document.body` paints it above `::backdrop`, but the browser still blocks pointer hit-testing and keyboard focus on it because it sits outside the modal `<dialog>` tree.

To keep action buttons (`Undo`, `Retry`, `Dismiss`) genuinely clickable and focusable while a modal is open, `ToastProvider` holds queue, timer, and live-region state above React portals while `ToastViewport` (`popover="manual"`) portals into the topmost active Unica `<dialog>` (`Modal` or `Drawer`), falling back to `document.body` when no modal is open:

```ts
export function resolveToastPortalHost(
  activeModals: readonly HTMLDialogElement[],
): HTMLElement {
  const topModal = activeModals.at(-1);
  return topModal && topModal.isConnected ? topModal : document.body;
}
```

Whenever a modal opens or closes (`dialog.close()`), `ToastViewport` re-mounts into the current host and re-enters the top layer via `showPopover()` without resetting notification timers or re-announcing existing messages.

### Positioning Adapter & Discrete Transitions

Anchored panels pair native `popover` promotion with a lightweight positioning adapter:

- Computes collision-aware coordinates (`flip`, `shift`, logical `start` / `end` alignment across LTR and RTL) and writes `--anchor-width` and `--overlay-available-height` onto the floating element.
- Sets `data-surface="overlay"` on every floating container so nested controls automatically bind overlay tokens (see [Themes and Roles](themes-and-roles.md#contextual-surface-adaptation-base-vs-overlay)).
- Animates entry and exit with `@starting-style` and `transition-behavior: allow-discrete` at the guaranteed browser tier, falling back cleanly to instant show/hide:

```css
@supports (transition-behavior: allow-discrete) {
  .popoverPanel {
    transition: opacity 140ms ease, transform 140ms ease,
      overlay 140ms allow-discrete, display 140ms allow-discrete;
  }
  @starting-style {
    .popoverPanel:popover-open {
      opacity: 0;
      transform: translateY(4px);
    }
  }
}
```

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
