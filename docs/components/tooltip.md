# Tooltip

Tooltip shows a short text hint for a button, link, or other existing control. Keep the accessible name on the control. Use `describe` for supplemental information users should hear when they focus it.

```tsx
import { Kbd, KbdGroup, Tooltip, TooltipProvider } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DocumentActions() {
  return (
    <TooltipProvider>
      <Tooltip
        label="Copy link"
        shortcut={
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>C</Kbd>
          </KbdGroup>
        }
      >
        <button type="button" aria-label="Copy link">
          <span aria-hidden="true">↗</span>
        </button>
      </Tooltip>
      <Tooltip label="Keep the inspector visible while browsing." describe>
        <button type="button">Pin inspector</button>
      </Tooltip>
    </TooltipProvider>
  );
}
```

## Props

| Prop | Values and defaults |
| --- | --- |
| `children` | One existing React element that forwards DOM props and ref to its trigger. The child keeps its own name, ref, and activation. |
| `label` | Plain hint text. An empty or whitespace-only label leaves the original control alone. |
| `describe` | Defaults to `false`. When true, adds the hint text to the trigger's accessible description. |
| `shortcut` | A string rendered with [Kbd](kbd.md), or a passive `Kbd` or `KbdGroup` element. The chord wraps as one unit and keeps LTR order. |
| `disabled` | Defaults to `false`. Suppresses the tooltip's visual behavior. Control availability is set on the child. |
| `side` | `top` (default), `bottom`, `start`, or `end`. Inline sides follow the anchor's direction. |
| `align` | `start`, `center` (default), or `end`. |
| `collisionPadding` | Minimum space between panel and viewport edges, in CSS pixels. Defaults to 16. Safe areas can add to the minimum on a side. |
| `open`, `defaultOpen` | Controlled and initial uncontrolled visibility. Defaults closed. |
| `onOpenChange` | Receives a proposed open state and [change details](#open-state-and-events). |
| `ref` | React 19 ref to the tooltip's `HTMLSpanElement`. Attach a ref to the child to reach the trigger. |

The panel accepts presentation props such as `id`, `className`, `style`, `data-*`, and pointer handlers. Tooltip owns its native popover, role, accessibility, and focus attributes. `TooltipProps`, `TooltipProviderProps`, and `HoverPreviewChangeDetails` are exported types.

### Existing external anchor

Use `anchor` and a controlled `open` to attach a tooltip to an element already managed by a composite widget. This form omits `children`, `describe`, and `defaultOpen`. The widget owns when to open, dismissal requests it needs to honor, and the anchor's accessible description. An optional `avoid` element asks placement to prefer a position outside that element if space allows.

```tsx
<Tooltip
  anchor={dayButton}
  avoid={calendarPanel}
  open={showReason}
  label="This day is outside the booking window."
  side="end"
  align="start"
  onOpenChange={setShowReason}
/>
```

## Interaction

Mouse hover and hover-capable pen input open after 600 ms. Keyboard focus opens immediately. The trigger and panel keep the hint open while the pointer crosses the gap or selects its text. Leaving both areas schedules a close after 150 ms when focus and selection no longer hold it. Escape dismisses the tooltip while the trigger keeps its focus. Tab continues through the surrounding document. Click and touch retain the trigger's normal action, including native form behavior.

Tooltip suppresses visual hints on unavailable controls, including disabled buttons and inert regions. Supply any essential help as visible text accessible directly from the control. The visual panel stays outside the accessibility tree. With `describe`, a stable description is available before hydration and while the panel is closed. Author-provided description IDs are preserved. A supplied `aria-description` or descriptive `title` can supply fallback text if no author description ID resolves after hydration. To make an author-supplied description available before hydration, point to an existing ID.

`TooltipProvider` groups hover timing for its descendants without adding a DOM node. `delay` sets the cold hover delay in milliseconds and defaults to 600. Each family has its own 300 ms warm interval after a visible preview closes. Moving to another trigger in the same family and group opens immediately during that interval or while its preview is still visible. Without a provider, the document is the group. The provider applies to both Tooltip and [HoverCard](hover-card.md). Numeric delay and collision padding are clamped at zero and use their defaults when the supplied value is nonfinite.

## Open state and events

The browser's top layer shows at most one Tooltip or HoverCard preview from Unica per document. A newly visible preview replaces the previous one. The panel follows its anchor, shifts or flips near viewport edges, and closes if the anchor becomes unavailable. The current logical placement is reflected in `data-side` and `data-align`.

`HoverPreviewChangeDetails.reason` is `hover`, `focus`, `leave`, `tab`, `escape`, `activation`, `outside-press`, `replacement`, `unavailable`, or `native`. `originalEvent` carries the initiating DOM event when available. For `outside-press` the callback receives the original pointer event synchronously.

Use `open` to accept or decline requested changes. When replacement, native layer loss, or anchor unavailability removes the physical panel, an old `open={true}` does not reopen it. Pass a new false-to-true change, or supply a new external anchor.

The panel inherits theme material. It appears and disappears immediately, including with reduced motion. Forced-colors mode uses system ink, fill, and border.

[HoverCard](hover-card.md) · [Overlays and forms](../concepts/overlays-and-forms.md) · [Workbench](../workbench.md)
