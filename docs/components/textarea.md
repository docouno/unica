# Textarea

`Textarea` is a native multiline plain-text editor for notes, descriptions, and logs. It fills the form column by default and adapts to Base and Overlay surfaces through the active Soft, Frost, or Pixel theme.

## Put it in a form

Use a visible label and connect help, feedback, and any counter through `aria-describedby`. Pass each ID once in reading order, starting with any existing external references. The form owns validation timing, announcements, and saving state.

```tsx
import { useId, useState } from 'react';
import { Textarea } from '@docouno/unica';

export function ReleaseNote({ saving }: { readonly saving: boolean }) {
  const id = useId();
  const [value, setValue] = useState('');
  const limit = 160;
  const over = value.length > limit;

  return (
    <form aria-busy={saving || undefined}>
      <label htmlFor={id}>
        Release note <span aria-hidden="true">*</span>
      </label>
      <Textarea
        id={id}
        name="note"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        aria-describedby={`${id}-help${over ? ` ${id}-feedback` : ''} ${id}-count`}
        status={over ? 'danger' : 'neutral'}
        required
        autosize
        maxRows={6}
      />
      <p id={`${id}-help`}>Summarize the change for readers. Aim for 160 UTF-16 units.</p>
      {over && <p id={`${id}-feedback`}>Remove {value.length - limit} units before saving.</p>}
      <p id={`${id}-count`}><bdi>{value.length} / {limit} units</bdi></p>
      <button type="submit" disabled={saving || over}>Save note</button>
    </form>
  );
}
```

A soft budget keeps the full draft, including pasted text. Exactly at the limit is valid. Add `maxLength` to let the browser enforce a hard UTF-16 limit. Applications can count graphemes, words, or bytes in an external counter. Keep that counter out of live regions and announce actionable validation at a deliberate boundary such as Check or Submit.

## Props

Import `Textarea` and `type TextareaProps` from `@docouno/unica`.

| Prop | Values and default |
| --- | --- |
| `variant` | `default` gives a framed form slot. `ghost` keeps a quiet baseline for editing in an already labeled context. |
| `size` | `s`, `m` (default), or `l`. A three-row field is 78, 86, or 106px at 100% text. |
| `status` | `neutral` (default), `info`, `success`, `warning`, or `danger`. Enabled danger supplies `aria-invalid="true"`. |
| `width` | `full` (default) or `auto`, which caps the framed control at 28rem within its container. |
| `rows` | Initial visible lines in manual or fixed mode. Defaults to 3. |
| `resize` | `vertical` (default) offers the native vertical handle. `none` gives a fixed height. |
| `autosize` | Defaults to `false`. When true, content sizing takes over from `rows` and `resize`. |
| `minRows`, `maxRows` | Autosize starts at `minRows` (default 3) and scrolls after `maxRows`. Omit `maxRows` for unbounded growth. |
| `value`, `defaultValue` | Optional string values for controlled and uncontrolled use, respectively. Choose one for the lifetime of an instance. Omit both to start empty. |
| `onChange`, `ref` | The React change event and React 19 ref both target the actual `HTMLTextAreaElement`. |
| Native attributes | `id`, `name`, `form`, `required`, `readOnly`, `disabled`, `wrap`, `cols`, length limits, accessible names and descriptions, `dir`, `className`, `style`, and native handlers reach the editor. |

Row counts round down to whole lines and have a minimum of one. Non-finite row counts use three, and a maximum below `minRows` is raised to `minRows`. On browsers without CSS `field-sizing: content`, autosize keeps the minimum height and scrolls. Height changes are immediate. Manual resizing preserves drag height during editing and validation. Switching from manual to fixed or autosize restores the current author-provided inline height, if any, and lets the new height policy take over.

## Keep log lines intact

Wrapped fields reserve a stable column for the first-line status icon. With `wrap="off"`, the native viewport can scroll horizontally and the composition puts the status icon beside the feedback below the field. Use `dir="ltr"` for LTR logs inside an RTL interface.

```tsx
import { useId } from 'react';
import { Textarea } from '@docouno/unica';

export function ExportLog({ log }: { readonly log: string }) {
  const id = useId();
  return (
    <>
      <label htmlFor={id}>Export log</label>
      <Textarea
        id={id}
        name="log"
        value={log}
        readOnly
        wrap="off"
        dir="ltr"
        rows={4}
        status="info"
        aria-describedby={`${id}-feedback`}
      />
      <p id={`${id}-feedback`}>
        <span aria-hidden="true">ⓘ </span> Export completed with two skipped entries.
      </p>
    </>
  );
}
```

## Editing, validation, and reset

- Label clicks, Tab, Enter, composition, selection, clipboard actions, and undo use the native editor. Escape leaves the text intact and is available to the enclosing page or overlay.
- Editable and read-only fields can receive focus. Keyboard focus uses a full contour, and forced colors use the system Highlight contour for both pointer and keyboard focus. The native disabled state, including disabled fieldsets, removes the field from Tab, validation, and submission, and suppresses status and resizing. The first legend follows native fieldset rules.
- A named editor contributes one native form entry. `required` and other constraints use browser validity. Application status supplies visual and ARIA feedback independently of native validity.
- `onChange` receives the current draft with LF line endings. For controlled use, adopt it in the event handler to preserve the native editing transaction. A rejected edit restores the last value from the owner. With `wrap="soft"` (default), visual wrapping leaves the submitted text intact. With `wrap="hard"` and `cols`, the browser may add line breaks during submission.
- During an active IME composition, the native preedit string stays visible and appears in `FormData`. The editor reconciles with the latest controlled value once the native composition ends.
- A completed native reset restores the mounted `defaultValue` or keeps the latest controlled `value`. Reset runs without a user change event. Reset any application-owned controlled state, feedback, and counters in the form's reset handler.

See [Feedback and Errors](../concepts/feedback-and-errors.md#strict-formfield-ownership--three-canonical-compositions) and [Overlays and Forms](../concepts/overlays-and-forms.md#native-form-participation).
