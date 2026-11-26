# Tabs

Tabs switch between peer panels within one view. Name the list, then pair each trigger with a panel using the same unique, nonempty string value. Place the list and panels anywhere under the same `Tabs` root. Each trigger forms a direct cell in the `TabsList` strip. Use fragments or components that render the triggers without extra DOM elements. Use Grid or Flexbox to place the list and panels. For example, a vertical list can sit beside a panel on a wide screen and above it in a narrow layout.

```tsx
import { Tabs, TabsList, TabsPanel, TabsTrigger } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DocumentViews() {
  return (
    <Tabs defaultValue="draft">
      <TabsList aria-label="Document views">
        <TabsTrigger value="draft">Draft</TabsTrigger>
        <TabsTrigger value="history" count="99+" countLabel="104 revisions">
          History
        </TabsTrigger>
      </TabsList>
      <TabsPanel value="draft" tabIndex={-1}>
        <label>
          Title <input name="title" defaultValue="Release notes" />
        </label>
      </TabsPanel>
      <TabsPanel value="history">The last revision was saved today.</TabsPanel>
    </Tabs>
  );
}
```

## Props and slots

| Part | Prop | Behavior |
| --- | --- | --- |
| `Tabs` | `value`, `defaultValue` | External selection or initial local selection. Without an available initial value, an uncontrolled Tabs starts at the first enabled pair in DOM order. |
| `Tabs` | `onValueChange` | Receives a different, available key proposed by a user action. With `value`, the owner commits the change by updating that prop. |
| `Tabs` | `size` | `s`, `m`, or `l`. Default `m`. |
| `Tabs` | `orientation` | `horizontal` (default) or `vertical`. Determines the list axis, marker placement and navigation keys. |
| `Tabs` | `activationMode` | `automatic` (default) or `manual`. |
| `Tabs`, `TabsPanel` | `mountStrategy` | `eager` (root default), `lazy`, or `unmount`. A panel can override the root. |
| `TabsList` | `aria-label` or `aria-labelledby` | Required accessible name for the tablist. |
| `TabsList` | `distribution` | `Responsive<TabsDistribution>`, with `content` as the default. Applies to horizontal lists. |
| `TabsList` | `messages` | Optional `scrollBack` and `scrollForward` labels for the overflow buttons. Defaults to “Scroll tabs back” and “Scroll tabs forward”. |
| `TabsTrigger` | `value`, `children`, `disabled` | Pairing key, visible text label, and native button availability. Conditionally render both parts to remove a view. |
| `TabsTrigger` | `iconLeft` | Decorative leading `GlyphSource`. An icon-only trigger requires a meaningful `aria-label`, also shown in its tooltip. |
| `TabsTrigger` | `count`, `countLabel` | Passive badge with a number or display string, including zero. Give meaningful counts an accessible phrase, including the exact quantity for capped counts. Include it yourself when supplying a full name with `aria-labelledby` or `aria-label`. |
| `TabsPanel` | `value`, `children`, `tabIndex` | Pairing key, panel content, and sequential focus behavior. Defaults to `0`. Use `-1` when its first meaningful content is a focusable control. |

All four parts accept a React 19 `ref`. `TabsList` forwards its `ref`, ID, ARIA attributes and handlers to the scroll owner with `role="tablist"`. Its `className`, `style` and `dir` apply to the outer layout frame that includes the two overflow buttons. The library generates stable trigger and panel IDs from the root and the pairing key. Its `hidden`, `inert` and `aria-hidden` states also apply to the frame and its overflow buttons. Call `preventDefault()` in a trigger’s `onClick` to cancel activation, or in `onKeyDown` on the list or trigger to cancel keyboard navigation.

## Selection and keyboard

Tab enters via the selected available trigger and leaves the list in document order. With an unavailable controlled selection, the first available trigger is the entry point and all panels are hidden until the owner selects an available value. Each list has one sequential focus stop when it has an available trigger. The overflow buttons sit outside this sequence.

Left and Right move through horizontal tabs in reading order, including RTL. Up and Down move through vertical tabs. Arrows wrap and skip disabled triggers. Home and End reach the first and last available trigger. With automatic activation, navigation also requests selection. Use manual activation for expensive panels. Enter, Space or a click commits the focused tab in manual mode. Pressing the current tab leaves selection unchanged.

An uncontrolled group repairs a missing or disabled selection by taking the next surviving available tab in the previous order, then the previous one. A fully replaced set starts at its first available tab. When selection hides or removes a panel that held focus, Tabs recovers focus to an available trigger. Existing focus elsewhere stays where the owner placed it. In a temporarily disabled fieldset, native rules govern keyboard access while the selected panel stays visible.

## Panel lifecycle, SSR and forms

| Strategy | First render of panel content | When inactive |
| --- | --- | --- |
| `eager` | Immediately | Hidden and retained |
| `lazy` | At first selection | Hidden and retained after selection |
| `unmount` | While selected | Content removed |

Every pair keeps a stable `tabpanel` shell. Inactive panels use native `hidden` and are outside the tab order and the accessibility tree. For a visible panel in server-rendered HTML, pass an explicit `value` or `defaultValue` matching an available pair. Without an explicit value, the client selects an available pair after registering the committed DOM.

Trigger and overflow buttons use `type="button"`. Mounted native fields in hidden panels still participate in form submission, validation and reset. Form reset updates the fields while keeping the current tab selection. When an invalid field belongs to a hidden panel, open that panel before focusing the field. If panels manage different forms, place each form in its own panel.

## Distribution and overflow

Horizontal `content` cells use their natural width up to the label cap. `equal` cells share the available width and reserve room for the label, icon and count. Distribution resolves against the list's own width at 768, 1024 and 1440 CSS px. Omitted steps inherit the preceding value. Vertical triggers always fill their rail.

An overflowing horizontal strip can be browsed with a swipe, trackpad or chevrons while the selected panel stays open. Keyboard navigation reveals the target and its focus ring within the strip. A narrow strip clears its chevrons when the focused tab needs the full viewport. The controls return when the tab fits or focus leaves. Counts crossing an overflow edge disappear as a whole while their accessible wording stays available. Tabs show tooltips for truncated text and icon-only labels when available. Escape dismisses the tooltip and keeps focus on the tab.

Selection uses a 2px edge rule. Soft and Frost fade the strip beside each visible chevron. Pixel, increased contrast and forced colors use a straight edge. Reduced motion makes chevron steps and pointer feedback immediate. The surrounding layout owns the surface and any dividers.
