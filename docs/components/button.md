# Button and IconButton

Use `Button` for commands with a visible label and `IconButton` for compact commands with one recognizable glyph and an accessible name. Both can style a real link when a destination needs button weight. Use Link for inline navigation. [Link](link.md)

```tsx
import { Button, IconButton } from '@docouno/unica';
import { TextBIcon } from '@phosphor-icons/react';
import '@docouno/unica/styles.css';

export function DocumentActions({
  bold,
  onBoldChange,
  onPublish,
}: {
  bold: boolean;
  onBoldChange: (pressed: boolean) => void;
  onPublish: () => void;
}) {
  return (
    <>
      <Button onClick={onPublish}>Publish document</Button>
      <Button asChild variant="secondary">
        <a href="/documents/preview">Preview document</a>
      </Button>
      <IconButton
        variant="ghost"
        icon={TextBIcon}
        aria-label="Bold"
        pressed={bold}
        onPressedChange={onBoldChange}
      />
    </>
  );
}
```

## Props

| Prop | Values and defaults |
| --- | --- |
| `variant` | `primary` for the main action, `secondary` for a visible alternative, or `ghost` for quiet tools and row actions. Defaults to `primary` on Button and `secondary` on IconButton. |
| `tone` | `accent` for forward or branded actions, `neutral` for ordinary actions, or `danger` for destructive actions. Omit it to use `accent` with `primary` and `neutral` with `secondary` or `ghost`. An explicit tone takes precedence. |
| `size` | `s`, `m` (default), or `l`. |
| `children` | Button's label. With `asChild`, use one anchor or router element and put Button's visible label inside that element. |
| `iconLeft`, `iconRight` | Button's optional decorative [glyph sources](icon.md) at logical start and end. |
| `width` | Button only. `auto` (default) fits the content. `full` fills the available inline width. |
| `icon` | IconButton's required decorative glyph. Its frame is centered in a square target. |
| `aria-label`, `aria-labelledby` | Supply a nonempty name or a reference to a naming element for IconButton. Button normally gets its name from the visible label. |
| `disabled`, `loading` | Both default to `false`. `disabled` takes precedence. |
| `pressed`, `defaultPressed`, `onPressedChange` | Native button only. Opt into toggle semantics with a controlled value, an uncontrolled initial value, or a `(pressed: boolean) => void` callback. |
| `asChild` | Defaults to `false` and renders a native button. Set `true` to compose an anchor. |
| `type` | Native button only. Defaults to `button`. Set `submit` or `reset` to use the corresponding form action. |
| `ref` | React 19 ref to the `HTMLButtonElement` or, with `asChild`, the `HTMLAnchorElement`. |

Both controls forward native attributes and events appropriate to their host. Set `loading`, `disabled`, and `pressed` to manage the corresponding accessibility states. Use `aria-expanded`, `aria-controls`, and `aria-haspopup` to describe a trigger's relationship to its panel. React children supply content.

## Forms, toggles, and triggers

Native submit and reset buttons support `form` for external form ownership. A submit button can carry `name` and `value` and use overrides such as `formAction`. The browser handles submission, constraint validation, and reset. `new FormData(form, submitter)` includes the named submitter's contribution. `new FormData(form)` reads fields without a submitter. Call `event.preventDefault()` to cancel an action's native default.

```tsx
import { Button } from '@docouno/unica';

export function InviteForm({
  inviting,
  invite,
}: {
  inviting: boolean;
  invite: (email: string) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        invite(String(new FormData(event.currentTarget).get('email')));
      }}
    >
      <label>
        Email
        <input name="email" type="email" required />
      </label>
      <Button type="reset" variant="secondary">Reset</Button>
      <Button type="submit" loading={inviting}>Invite</Button>
      <span role="status">{inviting ? 'Sending invitation…' : ''}</span>
    </form>
  );
}
```

Use a toggle for a persistent command such as Bold, Pin, or Mute. Keep its accessible name stable while `aria-pressed` communicates the state. A toggle without `pressed` starts from `defaultPressed` or `false`. An accepted click calls `onClick` first, then proposes the next pressed value unless the click was canceled. An uncontrolled toggle commits the proposal. A controlled toggle displays the supplied `pressed` value until its owner updates it. The pressed value is local to the action and stays independent of form data and reset.

An open-panel trigger uses `aria-expanded` to reflect the panel's state. The consuming overlay or application opens and closes the panel and manages focus on dismissal. A button can reference a native popover by ID with `popoverTarget`. On browsers that support Invoker Commands, `commandFor` names the target by ID and `command` specifies the action. Use `aria-current` on a link to identify the current destination.

## Button-shaped navigation

Pass exactly one element with `asChild`. A native child gets its address from `href`. A router child must render one anchor and forward DOM props, its ref, events, and children. Put the address, target, download, and relationship attributes on the child. An IconButton supplies the glyph and accessible name to the child anchor.

```tsx
import { useRef } from 'react';
import { Button } from '@docouno/unica';

export function WorkspaceLink() {
  const linkRef = useRef<HTMLAnchorElement>(null);

  return (
    <Button asChild ref={linkRef} variant="secondary">
      <a href="/workspace">Back to workspace</a>
    </Button>
  );
}
```

The child click handler runs first. `preventDefault()` there also skips Button's click handler. Both supplied refs point to the live anchor. A ready anchor preserves native link activation, including modifier clicks, middle click, and the link context menu. Tab and Shift+Tab visit the action. Enter follows a link, while Space retains native scrolling. Both Enter and Space activate an available native button.

## Availability and focus

- **Disabled.** A native button uses `disabled`. A disabled fieldset also disables descendant buttons except those in its first legend. A disabled link keeps its name and link role, drops its address, and leaves the tab order.
- **Loading.** The label and glyphs stay in layout and continue to name the action while a centered decorative Spinner shows activity. Neighboring actions keep their positions when loading changes, and the label can still reflow as space changes. An otherwise available action exposes `aria-busy` and `aria-disabled`, suppresses repeat activation, and stays focusable. Use nearby visible feedback or a status region to report progress and outcomes. [Spinner](spinner.md)
- **Pending navigation.** A loading link renders without an address. A router child is temporarily replaced with a native anchor. On either transition the focused action retains focus if it owned focus before the replacement. Moving focus elsewhere takes precedence.
- **Server rendering.** An initially loading submit, reset, or declarative button invoker starts with native `disabled` so it cannot perform its browser action before hydration. Once the handlers connect, an otherwise available loading control rejoins the tab order without moving focus.

Explicit or inherited disabled state takes precedence over loading and shows the original label or glyph. An unavailable action suppresses its activation callbacks, including custom context-menu handlers. The browser's context menu remains available. Use the normal package entry with React DOM SSR and hydration. In React Server Components, use both controls from a client module. The `react-server` entry exposes the types `ButtonProps`, `IconButtonProps`, `ButtonVariant`, `ButtonTone`, and `ButtonSize`.

## Layout and themes

| Size | Minimum Button height and IconButton side | Glyph and Spinner | Icon-to-label gap |
| --- | ---: | ---: | ---: |
| `s` | 30px | 14px | 6px |
| `m` | 40px | 16px | 8px |
| `l` | 48px | 20px | 10px |

The coarse-pointer minimum is 44×44px and participates in layout. Text scaling and wrapping can increase Button's height. Long labels can break without truncation. IconButton stays square. Logical slots follow the reading direction. Use a directional glyph when an arrow should mirror in RTL.

Soft and Pixel use flat plates. Frost gives primary and secondary actions a contact edge and moves the painted face down on press while the hit area and focus ring stay in place. Ghost and selected actions stay stationary. An available Frost primary accent can respond to a fine pointer approaching a visible edge before hover. The effect recedes at the pointer's last sampled position on departure. Selection, loading, disabling, holding the button down, occlusion, reduced motion, and forced colors suppress this light. The keyboard focus ring is independent of pointer light. Reduced motion uses a still Spinner. Forced colors mode uses system paint for edges, focus, open triggers, selection, and availability.

A painted surface can provide `--action-context-ink`. Neutral secondary and ghost actions inherit a local palette, including their disabled feedback. Primary actions and explicit accent and danger actions keep their own plate palette. Context ink can still inform focus. Theme, surface, and Card boundaries clear the surrounding action context. [Themes and roles](../concepts/themes-and-roles.md)

Open `/?item=button` in the playground to compare roles, sizes, and interactive cases, or follow the Usage view to consuming scenes. [Workbench and inspection](../workbench.md) · [Support and accessibility](../concepts/support-and-accessibility.md)
