# Kbd and KbdGroup

`Kbd` identifies keyboard input in prose, actions, tooltips, menus, and shortcut references. Use `KbdGroup` to show simultaneous keys or sequential steps. Choose the platform and wording in the application.

```tsx
import { Kbd, KbdGroup } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function SearchInstructions() {
  return (
    <div data-theme="soft-light">
      <p>Dismiss with <Kbd>Esc</Kbd>.</p>
      <p>
        Open search with{' '}
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        .
      </p>
      <p lang="fr">
        Ouvrir la recherche avec <Kbd label="Commande plus K">⌘K</Kbd>.
      </p>
    </div>
  );
}
```

## Props and content

The package exports the types `KbdProps`, `KbdGroupProps`, and `KbdSize`.

| Component | Prop | Type and default | Behavior |
| --- | --- | --- | --- |
| Both | `size` | `KbdSize = 'inherit' \| 's' \| 'm' \| 'l'`. Defaults to `inherit`. | Inherits the surrounding typography or sets an explicit scale. A key with an explicit size overrides its group. |
| `Kbd` | `children` | `ReactNode` | Key name, glyph, or short input hint. Empty text and empty React children render no keycap. |
| `Kbd` | `label` | `string` | Replaces the spoken text. A blank label keeps the default reading. |
| `KbdGroup` | `children` | `ReactNode` | Keys or nested groups. Arrays and fragments compose at the same level. Pass absent steps as `null` or `false` in your JSX. |
| `KbdGroup` | `separator` | `string`. Defaults to `+`. | The visible and spoken separator between steps. A direct key or group with `hidden` set is skipped. An empty string keeps a compact visual gap and a spoken “plus”. |
| Both | `ref` | `Ref<HTMLElement>` on `Kbd`, `Ref<HTMLSpanElement>` on `KbdGroup` | React 19 refs point to the native `kbd` or group `span`. |

Both roots accept standard DOM attributes such as `id`, `className`, `style`, `hidden`, `lang`, `aria-hidden`, and `data-*`. Use `label` for the spoken content of the native `kbd`.

`Kbd` recognizes ⌘, ⇧, ⌥, ⌃, ↵, ↩, ⌫, ⇥, and the four arrow glyphs in a string. Those symbols use decorative SVGs and readable text equivalents. For example, `⌘K` reads “Command + K”. Plain key names stay available as native text. Supply `label` for a custom visual glyph or a localized reading of a symbol.

Use the default `+` for a chord and a separator such as `then` between sequential keys or nested chord groups. Keep alternatives as prose between independent groups. Use ordinary text such as “Not assigned” for an absent shortcut.

## Layout and material

With `inherit`, the surrounding line height sets the height and minimum width of a keycap. Give the surrounding text an explicit line height for predictable inline sizing. Explicit sizes use font size and line height pairs of 14/20, 16/24, and 18/28 CSS pixels at 100% text scale. Both metrics follow `--font-scale`. The inner face uses the theme’s monospace font at 90% of the smaller of the font size and the line height minus 4px.

A single letter or built-in glyph fits in a square cap. Longer names grow horizontally. A group stays together in wrapping layouts, and both roots isolate their left-to-right key order in RTL interfaces. Place a chord on a new line when space is tight. Provide a labeled, keyboard-scrollable region for reference content wider than the available space.

The active theme supplies the neutral cap, border, and inset edge on base and overlay surfaces. An action can provide its own color and contour through its styles. The keycap has no motion. Forced colors use system ink and outlines.

## Interaction and accessibility

The keycaps and group are passive. Focus, activation, disabled feedback, and loading belong to the surrounding action. The hint adds no Tab stops, event handlers, form values, or overlay behavior. Apply `aria-keyshortcuts` to the command when the application implements the shortcut. Use `aria-hidden` on a hint whose text is already conveyed by the command.

Both components support React DOM server rendering and hydration with the same props. In an application using React Server Components, import their runtime exports from a module marked `'use client'`. The `react-server` entry exposes their TypeScript types. [Support and Accessibility](../concepts/support-and-accessibility.md), [Themes and Roles](../concepts/themes-and-roles.md).
