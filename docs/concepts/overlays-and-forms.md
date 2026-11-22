# Overlays and Forms

Unica delegates floating surfaces and form state directly to native HTML and DOM platform capabilities rather than re-creating synthetic focus traps, `z-index` registries, or shadow form state in JavaScript.

## Browser Top Layer Architecture

Normal document flow uses only two stacking tokens (`--z-content: 0` and `--z-sticky: 100` for sticky headers and rails). Every floating surface promotes into the browser's native **top layer**, escaping `overflow: hidden` and `transform` ancestors cleanly:

| Overlay Family | Native Carrier | Dismissal & Focus Contract |
| --- | --- | --- |
| `Modal`, `Drawer` | `<dialog>` via `showModal()` | Browser-enforced background `inert`, focus containment inside the active dialog, native `cancel` / `Escape` coordination, and shared document scroll lock. |
| `Popover`, `Menu`, `ContextMenu`, `Select`, `DatePicker`, `DateRangePicker` | `popover="auto"` (or `manual` when nested composite focus owns dismissal) | Native top-layer promotion, `Escape` and outside-press light dismissal, and deterministic focus restoration to the invoking trigger. |
| `Combobox`, `Autocomplete` | `popover="manual"` | Trigger retains primary focus with `aria-activedescendant` while the anchored panel floats in the top layer. |
| [`Tooltip`](../components/tooltip.md), [`HoverCard`](../components/hover-card.md) | `popover="manual"` | One visible preview per document. Hover and keyboard focus open it. Escape dismisses the current preview before its parent overlay. |
| `Toast` (`ToastViewport`) | `popover="manual"` | Persistent non-modal top-layer host; outside clicks on workspace content or modal scrims never dismiss active notifications. |

### Overlay coordination

Unica's internal runtime coordinates native admission and dismissal per document using a protocol-versioned registry on the `Document`. Bound auto triggers use the native `popoverTargetElement` binding (crossing Shadow DOM boundaries) and emit one controlled open or close request per activation after React click handlers have run. Components own `aria-expanded` declaratively from their open state. A native dismiss finalizes the panel even if the caller still holds its previous open value. An exit phase disconnects the native invoker, makes the departing carrier `inert`, and can be canceled if the caller reopens before exit finishes. The runtime reconciles native state after layout, modal mutations, and ancestor visibility changes (dismissing nested popovers when a parent `<dialog>` or popover closes) and returns focus when the departing surface owned it unless the caller opts out.

Nested `popover="auto"` chains should remain inside their parent popover's DOM subtree (in-place or via a nested `UnicaProvider` `portalContainer`) so native light-dismiss ancestry stays reliable across all Baseline and Guarantee browsers, including releases where `showPopover({ source })` is not yet supported. Tooltip and HoverCard render in place and preserve the native tab order of their source controls. Their previews leave focus where the user last placed it when they dismiss.

A single bubble-phase `keydown` listener on the document respects `event.defaultPrevented` from inner React widgets and DOM controls before routing `Escape`. Passive notification viewports are skipped, and foreign open top-layer surfaces are respected. Inside any active Unica modal, `Escape` closes a nested `auto` panel first so browser close-watcher grouping never dismisses the modal on the same keypress; the next `Escape` reaches the modal owner. Outside a modal, `auto` popovers delegate `Escape` to the browser, while `manual` layers and modals receive a close request. The event still reaches application listeners.

The document scroll lock is shared across physical Unica modals, compensates classic scrollbar gutter width to avoid horizontal layout shift when `scrollbar-gutter: stable` is absent, and leaves scrolling inside a dialog intact.

### Inertness & Foreign Modal Dialog Boundary

Unica's internal inertness checks cover every library-observable inert state: explicit `[inert]`, CSS `interactivity: inert` (including descendants with `interactivity: auto` under an inert ancestor), any stack of Unica modal dialogs (including reverse DOM order and Shadow DOM), and background elements behind light-DOM foreign `<dialog>` elements opened via `showModal()`.

Native user interaction and focus movement defer to the browser — internal focus helpers verify the actual outcome of native `focus()`, so active controls inside a topmost foreign `<dialog>` remain operable while lower blocked dialogs reject focus. Programmatic value proposals dispatched without a native user event against opaque mixed modal stacks (`Unica → foreign` or `foreign → Unica`) or against a foreign modal `<dialog>` nested inside an open `ShadowRoot` are an explicit platform boundary: the library does not expose a public registry for foreign `<dialog>` instances.

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
   Controls use a native `<input>`, `<textarea>`, or `<select>` with the applicable `name`, `form`, and constraint attributes. A composite keeps its visually hidden native control mounted when its popup closes or its visible options change. An empty single selection omits the name. Multiple selections produce repeated entries in committed order. A selected option that becomes unavailable still contributes its value until it is replaced.

   `checkValidity()` leaves focus in place. During interactive validation, the browser chooses the first invalid control in form order. When it focuses a visually hidden control, focus moves to that control's visible field or trigger (dismissing the browser's tooltip on the hidden carrier, so the field or application owns visible error copy).

2. **Deterministic `<form>` `reset`**
   A completed native reset of the current owning form restores the uncontrolled control's mount-time `defaultValue` or `defaultChecked`. Controlled controls retain the latest committed `value` or `checked`. A cancelled reset or a script-dispatched `reset` event preserves the committed value. Reset never emits a user change callback.

3. **Availability and pending work**
   - `disabled`: Excludes the control from tab order, activation, mutation, validation, and submission. A disabled fieldset also disables its descendants, with the native exception for its first legend.
   - `readOnly`: Preserves focusability, assistive reading, text selection, and `FormData` inclusion while blocking edits and picker mutations.
   - Components with a `loading` prop use `aria-busy="true"`, suppress duplicate actions where applicable, and keep their resting dimensions. For [Textarea](../components/textarea.md), the form or submit button owns saving state. The editor follows its own `readOnly` and `disabled` props.

4. **Controlled vs uncontrolled authority**
   With `defaultValue` or `defaultChecked`, the control commits an accepted edit before invoking the change callback, so `FormData` read inside that callback sees the new value. With `value` or `checked`, a change callback proposes a candidate: hidden and discrete carriers (`Select`, `Listbox`, `Checkbox`, `Radio`, `Switch`, `SegmentedControl`) keep `FormData` on the latest committed value during the callback, while live text editors (`Input`, `Textarea`, `NumberInput`, `Autocomplete`) preserve browser caret position, native undo history, and IME composition during input and restore the committed value right after commit if the proposal is rejected. During an active IME composition in [Input](../components/input.md) or [Textarea](../components/textarea.md), the native preedit string remains visible and is included in `FormData`. The editor resolves the edit against the latest controlled prop when the native composition finishes. Switching modes on a mounted instance triggers a development warning.

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
