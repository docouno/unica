# Accordion

Use Accordion for related in-flow sections in settings, inspectors, or documentation. Use [Collapsible](collapsible.md) for one disclosure or for multiple triggers bound to one panel.

```tsx
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button } from '@docouno/unica';

export function Permissions({ copyPolicy }: { copyPolicy: () => void }) {
  return (
    <Accordion headingLevel={3} defaultValue={['access']} exclusive>
      <AccordionItem value="access">
        <AccordionTrigger>Who can open it</AccordionTrigger>
        <AccordionContent>Workspace members can open this preview.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="publish">
        <AccordionTrigger action={<Button variant="ghost" onClick={copyPolicy}>Copy policy</Button>}>
          Who can publish it
        </AccordionTrigger>
        <AccordionContent role="region">Only workspace owners can publish.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

| Part | Props and host |
| --- | --- |
| `Accordion` | Required `headingLevel` (2 through 6), `value`, `defaultValue` (empty), `onValueChange(value)`, `exclusive` (false), `dividers` (true), `size` (`s`, `m`, `l`, default `m`), `lazyMount`, `unmountOnExit`. The ref points to its `div`. |
| `AccordionItem` | Required unique `value` (string), `disabled` (false), and a div ref. Render items as direct group children, each with one trigger and one panel. |
| `AccordionTrigger` | Native button attributes and ref. `action` renders an independent command adjacent to the heading. The component owns the generated button ID and the disclosure bindings. |
| `AccordionContent` | `padded` (true), div attributes and a div ref. Set `padded={false}` for full-width content. The component owns the generated ID and visibility. |

Use `value` and `onValueChange` for controlled state, or `defaultValue` for initial local state. Both values are `readonly string[]`. Controlled props determine what is displayed, and changing them directly emits no change event. Independent expansion preserves key order and ignores duplicates. Exclusive expansion uses the first supplied key and allows the group to be fully closed. In independent mode, toggling other sections preserves keys for temporarily absent items. Give dynamic items stable React keys matching their values to preserve DOM identity and drafts through reordering.

## Headings and keyboard

A native heading wraps each button and supplies the appropriate level for the page. Its button has `type="button"`, `aria-expanded`, and `aria-controls`. Use `role="region"` selectively on a panel to name it from its heading button. An explicit `aria-label` or `aria-labelledby` takes precedence.

Enter and Space activate the focused heading button. Tab and Shift+Tab include the heading, its adjacent action, and the controls in an open panel in document order. Arrows, Home, and End retain their native behavior. Place commands such as Copy or Favorite in `action`. They remain available when a section is closed or its heading is disabled.

Closing removes the panel's controls from the tab sequence immediately. If focus was inside, it returns to the heading button or its item when the button is unavailable. When a heading opens and replaces a neighboring section in the same exclusive activation, the group keeps the activated heading visible and returns focus there if it was inside the closing panel. A delayed controlled update follows the ordinary focus rule for a programmatic closure.

## Layout, mounting, and forms

Items use theme-based row dimensions and feedback. Dividers sit between visible sections after any expanded body. The group aligns carets at the logical end of the rows. With an adjacent action, the group moves all carets to the logical start and aligns padded content with the labels. The surrounding surface supplies Base or Overlay material.

The [Collapsible mount policies and native form behavior](collapsible.md#mounting-motion-and-forms) apply to every section. A closed mounted panel preserves drafts and native form participation. `unmountOnExit` discards the body after closing. Removing a whole item also discards its body. Returning an item whose key is still selected mounts it open with fresh content.
