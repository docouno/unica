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
- Motion belongs to the family’s design and the active material. Native top-layer positioning does not require a shared slide or fade. The current [Popover design reference](../../apps/playground/src/prototypes/popover/README.md) uses immediate show/hide in every preset. Any future overlay transition must preserve focus and dismissal timing, respect `prefers-reduced-motion`, and fall back to immediate visibility when unsupported.

## Native `<form>` Participation

Every Unica data-entry control (`Input`, `Textarea`, `NumberInput`, `Checkbox`, `Radio`, `Switch`, `Select`, `Combobox`, `Autocomplete`, `DatePicker`, `DateRangePicker`, `Slider`, `RangeSlider`, `SegmentedControl`, `TagsInput`, `FileInput`, and `*Card` choices) behaves as a native `<form>` participant:

1. **`FormData` & constraint validation**
   Controls use a native `<input>`, `<textarea>`, or `<select>` with the applicable `name`, `form`, and constraint attributes. A composite keeps its visually hidden native control mounted when its popup closes or its visible options change. An empty single selection omits the name. Multiple selections produce repeated entries in committed order. A selected option that becomes unavailable still contributes its value until it is replaced.

   `checkValidity()` leaves focus in place. During interactive validation, the browser chooses the first invalid control in form order. When it focuses a visually hidden control, focus moves to that control's visible field or trigger.

2. **Deterministic `<form>` `reset`**
   A completed native reset of the current owning form restores the uncontrolled control's mount-time `defaultValue` or `defaultChecked`. Controlled controls retain the latest committed `value` or `checked`. A cancelled reset or a script-dispatched `reset` event preserves the committed value. Reset never emits a user change callback.

3. **Availability states (`disabled`, `readOnly`, `loading`)**
   - `disabled` excludes the control from tab order, activation, mutation, validation, and submission. A disabled fieldset also disables its descendants, with the native exception for its first legend.
   - `readOnly`: Preserves focusability, assistive reading, text selection, and `FormData` inclusion while blocking edits and picker mutations.
   - `loading`: Sets `aria-busy="true"`, suppresses duplicate submit or clear actions, and locks resting box dimensions so forms and toolbars never shift.

4. **Controlled vs uncontrolled authority**
   With `value` or `checked`, a change callback proposes a candidate. `FormData` read inside that callback contains the latest value committed by the caller. With `defaultValue` or `defaultChecked`, the control commits an accepted edit before invoking the callback, so the same read sees the new value. Switching modes on a mounted instance triggers a development warning.

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
