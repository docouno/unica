# Switch

Use `Switch` for a named setting that changes immediately, such as enabling reminders. Use [Checkbox](checkbox.md) to collect an answer for a later form submission. A Switch is a native checkbox input with `role="switch"` and a track that shows the current setting.

```tsx
import { useId, useState } from 'react';
import { Switch } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function Reminders({ save }: { save: (enabled: boolean) => Promise<void> }) {
  const feedbackId = useId();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  async function update(next: boolean) {
    setFeedback('');
    setLoading(true);
    try {
      await save(next);
      setEnabled(next);
      setFeedback('Reminder setting saved.');
    } catch {
      setFeedback('Could not save reminders. Toggle again to retry.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Switch
        label="Review reminders"
        name="reminders"
        checked={enabled}
        loading={loading}
        onCheckedChange={(next) => void update(next)}
        aria-describedby={feedbackId}
      />
      <span id={feedbackId} role="status">
        {feedback}
      </span>
    </>
  );
}
```

## Switch

| Prop | Contract |
| --- | --- |
| `label`, `description` | Optional React nodes for the setting name and persistent help. A linked external label or ARIA name also works. Keep the name stable in both positions. |
| `checked`, `defaultChecked` | Controlled or initially on state. Defaults to off. A group-managed option derives its state from the group's selected keys. |
| `onCheckedChange(next)` | Receives the proposed boolean. Native React `onChange` receives the event after checkedness is reconciled, so a controlled input can still expose the previous commit. |
| `loading` | Shows a pending mark in the thumb, sets `aria-busy` and `aria-disabled` on the available input, and blocks new toggles. Focus and the committed value stay on the same input. Disabled takes precedence. |
| `thumbIcon` | A decorative React node inside the thumb. The pending mark replaces it while loading. A disabled Switch hides both. |
| `size` | `s`, `m`, or `l`. The item wins over the group and then defaults to `m`. |
| `disabled`, `readOnly` | Each combines with its counterpart on the group. Read-only blocks edits while retaining focus and form participation. Disabled also follows native fieldset rules. |
| `id`, `name`, `form`, `value`, `required`, `ref` | These props, ARIA attributes, and input events target the actual `HTMLInputElement`. A checked, enabled, named Switch submits `value` (default `"on"`). The empty string is a value. |
| `className`, `style`, `hidden` | Apply to the visible label row. |

Clicking the indicator or its label, pressing Space, or pressing Enter proposes a toggle. Enter is handled once per press and keeps the form from submitting on that key. Each available Switch has its own Tab stop.

For pessimistic saving as shown above, set `loading` when the request starts. Keep `checked` at the last accepted value and update it when the operation succeeds. Pending UI preserves the same polarity, input focus, and `FormData` entry. The app provides persistence, retry, and a single accessible result message. A completed native form reset restores the uncontrolled mount-time default or preserves the latest controlled commit.

## SwitchGroup

| Prop | Contract |
| --- | --- |
| `children`, `ref`, native div attributes | The root is a div with `role="group"`. Give it a name with `aria-label` or `aria-labelledby`. |
| `value`, `defaultValue`, `onValueChange(next)` | Supply any of these to own the selected string keys. Give each group-managed switch a unique string `value`. An initially unselected group starts empty. The callback appends new keys and removes deselected keys. |
| `name`, `form` | Set shared field naming or form association. See [binary group form ownership](../concepts/overlays-and-forms.md#binary-group-form-ownership). |
| `size`, `disabled`, `readOnly` | Provide the defaults and availability rules described above. |
| `orientation` | `vertical` (default) or `horizontal`, with independent Tab stops. |

## SwitchIndicator

`SwitchIndicator` is an aria-hidden span for a composition that owns the labeled input. It accepts `Ref<HTMLSpanElement>` and takes `size` (default `m`), `checked`, `disabled`, `loading`, and `thumbIcon`. Pass these from the setting's current state. The indicator adapts to the active theme and Base or Overlay surface. The thumb moves from logical start to logical end for an on value. Pixel and reduced motion make travel immediate. Reduced motion keeps a static pending mark, and forced colors preserve the track and thumb position.

The package exports `SwitchProps`, `SwitchGroupProps`, and `SwitchIndicatorProps` as types.
