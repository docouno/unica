# Popover

Use Popover for a short explanation, immediate settings, or a compact form beside a trigger. It opens as a named non-modal dialog in the browser's top layer. The surrounding page remains interactive and scrollable. Use Menu for a list of commands and Modal for work that blocks the page.

```tsx
import {
  Button,
  Checkbox,
  Popover,
  PopoverBody,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@docouno/unica";
import "@docouno/unica/styles.css";
import { useState } from "react";

export function PageVisibility() {
  const [listed, setListed] = useState(true);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">Page visibility</Button>
      </PopoverTrigger>
      <PopoverContent size="s" side="bottom" align="start">
        <PopoverHeader>
          <PopoverTitle>Page visibility</PopoverTitle>
          <PopoverDescription>Changes apply immediately.</PopoverDescription>
          <PopoverClose aria-label="Close page visibility settings" />
        </PopoverHeader>
        <PopoverBody>
          <Checkbox
            checked={listed}
            onCheckedChange={setListed}
            label="Show this page in the directory"
          />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
```

## Parts and props

| Part                 | Props and DOM                                                                                                                                                                                                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Popover`            | Groups one panel and one or more triggers without adding a DOM node. `defaultOpen` starts uncontrolled state and defaults to `false`. Use `open` for controlled state and `onOpenChange(open)` for visibility requests and dismissals. `ref` resolves to the Content div.                          |
| `PopoverTrigger`     | A native `button` with `type="button"`. Use `asChild` with a single interactive element that forwards props and its DOM ref. Use `disabled` to prevent activation. The Trigger owns its dialog relationship and expanded state.                                                                    |
| `PopoverContent`     | A named `div` dialog with native `popover="auto"`. Accepts ordinary div props such as `id`, `className`, `style`, and ARIA naming and description. `size` is `s`, `m` (default), or `l`. `side` is `top`, `bottom` (default), `start`, or `end`. `align` is `start`, `center` (default), or `end`. |
| `PopoverHeader`      | A div for the title, optional description, and Close.                                                                                                                                                                                                                                              |
| `PopoverTitle`       | A heading of size `heading-s`. `as` selects `h1` through `h6` and defaults to `h3`.                                                                                                                                                                                                                |
| `PopoverDescription` | A paragraph with secondary body text for a brief explanation.                                                                                                                                                                                                                                      |
| `PopoverBody`        | A div for content, with native scrolling when available height is limited.                                                                                                                                                                                                                         |
| `PopoverFooter`      | A div for optional actions. It aligns them at the logical end and wraps them in source order.                                                                                                                                                                                                      |
| `PopoverClose`       | The icon button in the upper logical corner. The default `aria-label` is “Close popover.” Give it a localized or more specific label where appropriate.                                                                                                                                            |

All parts accept ordinary React 19 refs to their DOM elements. The matching `*Props` types and the `PopoverSize`, `PopoverSide`, and `PopoverAlign` types are exported at the package root.

Server rendering emits a closed panel. Hydration links the triggers to the panel's generated or supplied ID before applying the initial open state.

Use a visible title when the surface needs an orientation cue. The dialog uses `aria-labelledby` first, then `aria-label`, then its `PopoverTitle`. It combines an authored `aria-describedby` with the optional `PopoverDescription`. Keep interactive content and changing validation messages in the body. Include a visible Close even if you name the panel directly.

With an enabled `asChild` trigger, the child click handler runs before the Trigger's `onClick`. Calling `preventDefault()` in either handler cancels the toggle. Use a button for an action. An anchor with a real `href` can act as an editing source while preserving normal modifier and middle-click navigation.

A disabled Trigger suppresses activation handlers and forwards `disabled` to a composed React control. `Button`, `IconButton`, and `Link` support this composition. A disabled native anchor retains its link role, receives `aria-disabled`, and has no actionable `href`.

## Focus and dismissal

| Interaction                                                               | Result                                                                                                                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Enter on a trigger, Space on a button trigger, or mouse or pen activation | Opens the panel and focuses its first available content control. An informational panel receives focus itself.                                                                 |
| Touch or opening through state                                            | Focuses the panel. Tapping a field then starts editing.                                                                                                                        |
| Close or Escape                                                           | Closes the panel and restores focus to the source when focus belonged to the panel and the source is still available. Escape closes the topmost panel of a nested chain first. |
| Outside click                                                             | Dismisses the panel and lets the clicked target receive its normal action and focus.                                                                                           |
| Tab or Shift+Tab                                                          | Follows the normal tab order. The panel closes when focus leaves the panel and its triggers. Moving back to its trigger keeps it open.                                         |

Fields retain their keyboard and pointer focus styles when the panel moves focus to them on opening.

With several triggers, the activating trigger anchors the panel and is its focus return target. Opening through state uses the last available trigger, or the first available trigger in document order. Losing the active anchor closes the panel. When the source becomes unavailable, focus can return to another available trigger if focus would otherwise be lost.

In controlled mode, accept a trigger or Close request by updating `open`. A completed browser dismissal, an accepted Escape, a Tab exit, or anchor loss reports `false` once. A subsequent activation or a new `false`-to-`true` transition can reopen the panel. The callback reports requests and dismissals. Apply programmatic changes in the state that owns `open`.

## Placement and material

The panel starts on the requested side with an 8px gap to the anchor. It flips and shifts to fit, leaving 16px of clearance at the viewport edges plus any safe-area inset. Logical inline placement mirrors in RTL. The resolved placement is available on Content through `data-side` and `data-align`.

| Size | Width ceiling | Padding | Section gap |
| ---- | ------------- | ------- | ----------- |
| `s`  | 18rem         | 12px    | 8px         |
| `m`  | 22rem         | 16px    | 12px        |
| `l`  | 28rem         | 24px    | 16px        |

Body uses the [compact native scrollbar](scrollbar.md), with Header and Footer outside its scroll area. At very small heights the panel scrolls as a whole to keep every action reachable. Close has a 44px target on coarse pointers. Popover opens and closes immediately in every theme, including with reduced motion. In forced colors the panel uses system borders and focus colors.

Place Header, Body, and Footer directly inside Content so the panel can size its scrolling area. Put Close directly in Header or Content. When using Header, place the title directly in it so the heading reserves space for Close.

Content applies the theme's [overlay material](../concepts/themes-and-roles.md#overlay-surface-utility) and overlay context automatically.

## Forms

Use a form around Popover or inside Body. Fields and actions can also use the native `form` attribute because Content stays in its DOM position. The native Trigger and Close use `type="button"` so they can sit inside a form. While open, fields participate in `FormData`, validation, and reset. Closing unmounts those fields. Keep saved values above Content and derive a new draft from saved values when opening an editing session. Use a native submit button in `PopoverFooter`, with `form` if necessary, and let the application decide when to commit and close.

Open `/?item=popover` in the playground for settings, form, placement, and scrolling examples. The [Folio rich editor](../compositions/folio.md#explore-the-live-compositions) shows a form with two triggers.
