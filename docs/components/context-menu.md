# ContextMenu

Offer an object's commands from a visible action button, secondary click, the context-menu key, Shift+F10, or an opt-in touch hold. Share the same [Menu parts](menu.md) across those entry points.

```tsx
import {
  Button, ContextMenu, ContextMenuTrigger, MenuContent, MenuItem, MenuTrigger,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

export function FileRow({ name, onRename }: {
  name: string;
  onRename: () => void;
}) {
  return (
    <ContextMenu size="s">
      <ContextMenuTrigger>
        <tr>
          <th scope="row">{name}</th>
          <td>
            <MenuTrigger asChild>
              <Button aria-label={`Actions for ${name}`}>Actions</Button>
            </MenuTrigger>
            <MenuContent align="end">
              <MenuItem onClick={onRename}>Rename</MenuItem>
            </MenuContent>
          </td>
        </tr>
      </ContextMenuTrigger>
    </ContextMenu>
  );
}
```

`ContextMenu` accepts the same `size`, `open`, `defaultOpen`, `onOpenChange`, and button `ref` as Menu. `ContextMenuTrigger` requires one element that accepts props and a ref. It preserves the tag, role and tab order of that element. Its ref points to the object element. Keep a visible `MenuTrigger` for each object and use the object's existing focusable elements as keyboard entry points.

| Prop | Effect |
| --- | --- |
| `longPress` | Defaults to false. Enables a 500 ms touch hold on a discrete target. Movement beyond 10 CSS pixels, scrolling, cancellation, and early release cancel it. The release of a completed hold leaves the menu open. |
| `shouldOpen(invocation)` | Governs context gestures. Without a policy, gestures that have a native context keep it. The visible button is always independent of this policy. |
| `onInvoke(invocation)` | Receives each accepted invocation before focus moves, including a new anchor for an open menu. The snapshot has `kind` (`button`, `pointer`, `keyboard`, or `touch`), `source` (an Element), `selection` (text), and `native` (whether the gesture normally gets the browser context). |

Links, fields, editable regions, images, native media controls, and selected text keep their browser context by default. A selection that intersects the object contributes its original browser selection text, including whitespace and line breaks. Use `data-native-context-region` on an editor's wrapper to reserve context actions over its padding and decorations as well. A policy can allow a custom menu for a specific selection. Shift+secondary click preserves the browser route. Within nested objects, the closest applicable trigger decides the gesture.

A pointer invocation opens near the pointer. A keyboard invocation anchors to the focused element. A visible button anchors its own opening and can move an open point-anchored menu to the button. The object exposes `data-unica-context-menu-anchor="point"` or `"element"` while open. Scrolling outside a point-anchored menu dismisses it. Escape and local commands return focus to the available caller or the visible button. Context gestures preserve object selection and leave form state under application control.
