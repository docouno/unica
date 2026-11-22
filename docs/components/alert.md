# Alert

Use Alert for persistent feedback in a form, section or page. The message stays in the document flow and uses the active theme's status colors. The application chooses when it appears, when to remove it and how to handle any recovery actions.

```tsx
import { Alert, AlertActions, AlertClose, AlertDescription, AlertTitle } from '@docouno/unica';
import type {
  AlertActionsProps,
  AlertCloseProps,
  AlertDescriptionProps,
  AlertProps,
  AlertSize,
  AlertStatus,
  AlertTitleProps,
} from '@docouno/unica';
```

## Static content

Use `role="none"` for an editorial callout or any content that should read in document order, including after client navigation.

```tsx
<Alert role="none" status="warning" size="s">
  <AlertTitle as="h2">Check the replication lag</AlertTitle>
  <AlertDescription>Verify the standby is caught up before promoting it.</AlertDescription>
</Alert>
```

Use `role="region"` to expose a named landmark. Supply a non-empty `aria-label` or point `aria-labelledby` at a heading in the same document or shadow root. An available referenced name takes precedence. The region falls back to the label while the heading is unavailable. Without a name, the same container remains ordinary document content.

## Props and slots

| Part | DOM and `ref` | Props |
| --- | --- | --- |
| `Alert` | `div`, `HTMLDivElement` | `children` accepts bare text or rich content. `status` is `neutral` (default), `info`, `success`, `warning` or `danger`. `size` is `s`, `m` (default) or `l`. `role` optionally selects `alert`, `status`, `region` or `none`. `icon` accepts a `GlyphSource`, `false` or `null`. `close` accepts an `AlertClose` element, `false` or `null`. |
| `AlertTitle` | `div` by default, `HTMLDivElement`. With `as="h2"` through `"h6"`, the native heading and `HTMLHeadingElement`. | Optional visible title. Choose the heading level for its place on the page. |
| `AlertDescription` | `div`, `HTMLDivElement` | Optional message details, including paragraphs, links, inline code and short lists. |
| `AlertActions` | `div`, `HTMLDivElement` | Optional row of recovery controls after the message. The row wraps as needed. |
| `AlertClose` | Native `button`, `HTMLButtonElement` | Requires a non-empty localized `aria-label` and an `onClose` mouse-event handler. Supports `id`, `className`, `style` and `data-*`. Place it in `Alert.close`. |

The root accepts passive native attributes such as `id`, `className`, `hidden`, `lang`, `dir` and ARIA relationships. Alert owns its live semantics. Empty title, description and action slots take up no space. A neutral message has no entry glyph by default. A chromatic status supplies a decorative status glyph when the custom slot renders no SVG. Include the meaning of the message in visible text.

## Live feedback and dismissal

A new dynamic Alert announces the title and message through a local live region. Warning and danger default to assertive `alert`. Neutral, info and success default to polite `status`. Pass an explicit live role when the urgency of the result differs from its color. Action labels and the close button stay outside the live channel and remain available in the document.

The initial server-rendered message is readable in place. Mounting a client-side message, revealing it again or changing its urgency prepares a fresh announcement. Changes to the visible message text update the live region, and repeated identical text in the same showing is deduplicated. The transient copy clears after delivery time while the visible Alert stays in place. Use a fresh key when a distinct event needs to announce identical text again.

A hidden Alert waits for its own element and its enclosing surface to become visible. Set `hidden="until-found"` through the DOM to allow find in page or fragment navigation to reveal the callout in supporting browsers. See the [browser support policy](../concepts/support-and-accessibility.md).

Tab and Shift+Tab follow document order through links, recovery actions and then the close button. Enter, Space and a pointer click request dismissal through the same native button. The close button uses `type="button"` and respects a disabled fieldset. Closing leaves form values and reset behavior with the form. Escape and outside clicks leave the message open. If removal takes away the focused control, move focus to a suitable remaining control after the update. A mouse dismissal during input preserves the external field's focus.

```tsx
import { useLayoutEffect, useRef, useState } from 'react';
import { Alert, AlertClose, AlertDescription, AlertTitle } from '@docouno/unica';

export function ImportForm() {
  const [error, setError] = useState(false);
  const summary = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLInputElement>(null);
  const restore = useRef(false);

  useLayoutEffect(() => {
    if (!error && restore.current) {
      restore.current = false;
      const input = source.current;
      if (input && input.ownerDocument.activeElement === input.ownerDocument.body) {
        input.focus();
      }
    }
  }, [error]);

  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      setError(true);
    }}>
      <label>
        Mapping schema
        <input ref={source} name="schema" />
      </label>
      <button type="submit">Validate schema</button>
      {error && (
        <Alert
          ref={summary}
          status="danger"
          close={
            <AlertClose
              aria-label="Dismiss schema validation summary"
              onClose={() => {
                const node = summary.current;
                restore.current = Boolean(node?.contains(node.ownerDocument.activeElement));
                setError(false);
              }}
            />
          }
        >
          <AlertTitle as="h2">Check your mapping schema</AlertTitle>
          <AlertDescription>Enter the path to a YAML schema and try again.</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
```

## Contextual color

The theme supplies the Alert surface, border and ink. Inside it, `Link tone="inherit"`, inherited `Code` and supporting neutral actions pick up the local paint. Explicit link tones and code statuses keep their own colors. A nested Alert, Card or Base/Overlay boundary establishes its own context. When placed in a dialog or drawer, Alert stays in that surface's existing scroll and focus scope.
