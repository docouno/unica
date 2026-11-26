# Menu

Use a Menu for commands, links, and immediate settings attached to a visible button. Use [ContextMenu](context-menu.md) to offer the same commands from a context gesture on an object.

```tsx
import {
  Button, Menu, MenuCheckboxItem, MenuContent, MenuGroup, MenuItem, MenuLabel,
  MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger, MenuTrigger,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DocumentActions({ onRename, onExport }: {
  onRename: () => void;
  onExport: () => void;
}) {
  return (
    <Menu size="s">
      <MenuTrigger asChild><Button>Document actions</Button></MenuTrigger>
      <MenuContent align="end">
        <MenuItem onClick={onRename}>Rename</MenuItem>
        <MenuItem href="/documents/current">Open document</MenuItem>
        <MenuSub>
          <MenuSubTrigger>Export as</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem onClick={onExport}>PDF</MenuItem>
          </MenuSubContent>
        </MenuSub>
        <MenuSeparator />
        <MenuGroup>
          <MenuLabel>View</MenuLabel>
          <MenuCheckboxItem defaultChecked>Preview</MenuCheckboxItem>
        </MenuGroup>
      </MenuContent>
    </Menu>
  );
}
```

## Parts and props

| Part | Props and behavior | Ref |
| --- | --- | --- |
| `Menu` | Compose one trigger and one content panel. `size` is `s \| m \| l` (default `m`). `open`, `defaultOpen` (default `false`), and `onOpenChange(next)` control visibility. | Trigger button |
| `MenuTrigger` | Renders a native button. `asChild` composes one real button such as Button or IconButton. Give an icon-only button an accessible name. | Button |
| `MenuContent` | Native `popover="auto"` with `role="menu"`. `align` is `start \| end` (default `start`). Supply `aria-labelledby` or `aria-label` to name the panel independently of the button. | Panel div |
| `MenuItem` | String children, `description`, decorative `icon`, `shortcut`, `disabled`, `tone="neutral" \| "danger"`. Use `onClick` for a command or `href` for a link. Link rows support native `target`, `rel`, and `download`. | Button or anchor, according to `href` |
| `MenuCheckboxItem` | String children, `description`, `icon`, `disabled`. `checked`, `defaultChecked` (default `false`), and `onCheckedChange(next)` control the mark. Activation keeps the menu open. | Button |
| `MenuRadioGroup` | Name the group with MenuLabel or ARIA. `value` and `defaultValue` accept a string or `null`. `null` is no selection, and `""` is a valid key. Use `onValueChange(value)` to handle changes. | Group div |
| `MenuRadioItem` | Required unique string `value` within its group, string children, `description`, `icon`, `disabled`. Activation requests dismissal. | Button |
| `MenuGroup`, `MenuLabel`, `MenuSeparator` | Group related actions, display the group heading, or add a horizontal separator. | Respective div |
| `MenuSub` | Pair one MenuSubTrigger with its MenuSubContent. | Branch button |
| `MenuSubTrigger` | String children, `description`, `icon`, `disabled`. | Branch button |
| `MenuSubContent` | Nested commands. Set `backLabel` to localize the inline Back action. | Nested panel div |

The trigger's live accessible name supplies a fallback panel name. A menu item's string label drives typeahead. A row description is announced separately. Add `aria-keyshortcuts` only for shortcuts that the application implements. The visual `shortcut` renders a passive keycap.

A command invokes its synchronous `onClick` before requesting dismissal. Call `preventDefault()` to cancel the component's activation effects. Links retain native navigation, including middle and modified clicks. Disabled rows remain reachable by arrow keys and typeahead and ignore activation.

## Keyboard, focus, and layout

- Enter, Space, and Down Arrow on the trigger open at the first item. Up Arrow opens at the last. Pointer activation starts at the panel.
- Up and Down Arrow wrap through the current level. Home and End go to its edges. Typing searches item labels.
- Enter and Space activate an item. The forward arrow opens a branch and the reverse arrow returns to its parent. The arrows reverse direction in RTL.
- A branch opens alongside the current panel when it fits. A narrow viewport or coarse primary pointer uses an inline level with Back above the scrollable list. Inline levels keep the current panel width.
- Escape closes one level and returns to its branch button, or closes the root and returns to its caller. Tab and Shift+Tab leave the entire menu and continue from the caller. Outside press leaves focus at the pressed destination. An action that transfers focus to another control or dialog keeps that focus.

With controlled visibility, a command or a repeated trigger activation proposes closure and waits for the new `open` value. Escape, Tab, native light dismissal and a lost anchor complete the dismissal and report it once. Open again with a new activation or a false-to-true transition.

## Forms and surfaces

Menu buttons use `type="button"`. Checkbox and radio menu rows manage immediate settings and keep their values while mounted, including between openings and across inline and cascading layouts. They contribute no form entries and do not participate in form reset. Use [Checkbox](checkbox.md) or [Radio](radio.md) for form fields.

The active preset supplies the material. Menu panels use the overlay surface and an independent compact scrollbar. Adjacent item rows have a `--space-2` (2px) gap, including in submenus. A menu can open inside a native modal when its trigger and content belong to that modal.
