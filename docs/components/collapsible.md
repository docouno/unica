# Collapsible

Use Collapsible for one in-flow section, such as diagnostics in an inspector or optional details in a form. Use [Accordion](accordion.md) for a group of section headings.

```tsx
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger, Input } from '@docouno/unica';

export function DeliveryDetails() {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger>Delivery details</CollapsibleTrigger>
      <CollapsibleContent>
        <Input aria-label="Reply-to address" name="replyTo" defaultValue="reviews@example.com" />
        <CollapsibleTrigger asChild>
          <Button variant="ghost">Close details</Button>
        </CollapsibleTrigger>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

| Part | Props and host |
| --- | --- |
| `Collapsible` | `open`, `defaultOpen` (false), `onOpenChange(open)`, `disabled` (false), `size` (`s`, `m`, `l`, default `m`), `contentId`, `lazyMount`, `unmountOnExit`. The ref points to its `div`. |
| `CollapsibleTrigger` | `disabled` (false), `asChild` (false), button attributes and a button ref. A default trigger includes a leading caret. Use one or more triggers. |
| `CollapsibleContent` | `padded` (true), div attributes and a div ref. Set `padded={false}` for full-width content. Use exactly one content part per root. |

Supply `open` to own the state. `onOpenChange` proposes the next state, and the committed prop determines what is shown. Use `defaultOpen` to initialize a locally managed instance. Changing the controlled prop directly updates the view without emitting another proposal.

## Buttons, keyboard, and focus

Every trigger is a native `type="button"` with `aria-expanded` and `aria-controls`. The panel ID is generated on the server and during hydration. Supply `contentId` on the root to use a document-unique ID of your own. The panel's ID, visibility, and inert state belong to the component. If you give the panel `role="region"`, label it with `aria-label` or `aria-labelledby`.

Enter and Space activate the focused trigger. Tab and Shift+Tab follow document order. Root and trigger `disabled` flags affect the button. Open content remains available. Native disabled fieldsets still apply to their descendants.

For `asChild`, supply one native `button` or one Unica `Button` that renders a button. The child supplies its label and styling. A loading Button keeps its loading behavior. Use a separate button for toggle state, navigation, and native invoker commands. The child's click handler runs first, then the trigger's click handler, then the disclosure request. `preventDefault()` cancels the remaining steps. Disclosure controls the button type, expansion attributes, availability, and native invoker bindings on the host.

When a panel closes with focus inside, focus returns to the most recently activated available external trigger, then the first available external trigger, then the root. A trigger inside the closing panel is excluded. Focus already outside the panel stays in place. The panel becomes inert as closing begins.

## Mounting, motion, and forms

| Policy | When the body mounts | After closing |
| --- | --- | --- |
| Default | Immediately | Body and draft stay mounted. |
| `lazyMount` | First open | Body and draft stay mounted after that visit. |
| `unmountOnExit` | Each open | Body unmounts when the closing transition ends. |

The panel node and ID are stable under every policy. Soft and Frost animate the in-flow height. Pixel and reduced motion settle immediately. The open panel keeps its natural height and allows focus outlines to extend beyond its edges. The surrounding surface supplies the material on Base and Overlay.

Mounted controls use native form rules, including in a closed panel. An enabled named input can appear in `FormData` and take part in constraint validation while hidden. A form reset restores native input defaults and leaves the disclosure state alone. To show and focus an invalid field, accept the open state from the form's validation handler and focus the field after the open commit.
