# FileInput

FileInput is a compact native file picker for forms and inline editing. It accepts ordinary files from the picker and from a local drop. Set `allowPaste` to also accept files pasted directly on the focused picker. [Dropzone and FileList](dropzone.md) cover larger drop targets and attachment rows.

```tsx
import { Button, FileInput, FormField } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function EvidenceForm() {
  return (
    <form action="/evidence" method="post" encType="multipart/form-data">
      <FormField label="Supporting evidence" description="Include the signed report." required>
        <FileInput name="evidence" accept=".pdf,application/pdf" maxSize={2_000_000} showSize />
      </FormField>
      <Button type="submit">Submit evidence</Button>
    </form>
  );
}
```

## API

| Props | Behavior |
| --- | --- |
| `value?: readonly File[]`, `onValueChange?(files)` | Provide `value`, including `[]`, for controlled selection. With no value prop the field starts empty and updates locally. The callback receives the complete next selection. |
| `onIntake?(result: FileIntakeResult)` | Reports the picker, drop or paste attempt. The result has `source`, `accepted`, and `rejected`. `accepted` contains the new files that passed admission in that attempt. |
| `multiple`, `maxFiles` | FileInput is single by default. An accepted single file replaces the previous one. Multiple selections append in input order. The single-file limit is at most one, even with a larger `maxFiles`. Zero blocks new files. |
| `accept`, `maxSize` | Comma-separated extensions, exact MIME types, and the `image/*`, `audio/*`, and `video/*` wildcards. `maxSize` is the inclusive byte limit per file. FileInput shows effective restrictions before admission. |
| `size`, `variant`, `status` | `s \| m \| l` density, `default \| ghost` structural role, and field validation status. Defaults are `m`, `default`, and `neutral`. |
| `showSize`, `clearable` | Show the selected byte total in formatted units. The single-file Remove action is available by default. Use a controlled value with [FileListItem](dropzone.md#filelistitem) for individual removal in multiple selection. |
| `allowPaste`, `announceIntake`, `messages` | Paste is opt-in. The polite intake summary is enabled by default. Turn it off when the application announces the same result. The correction stays visible and associated with the field. `Partial<FileIntakeMessages>` can replace labels and the selection, limits, attempt and Remove formatters. |
| `disabled`, `readOnly`, `loading`, `required` | Disabled wins over read-only and loading. Read-only retains data and available keyboard inspection. Loading preserves focus and the current value. A required field uses native validity. |
| `id`, `aria-label`, `aria-labelledby`, `aria-describedby` | Apply to the accessible control. Use `FormField`, an external label with a matching ID, or ARIA attributes. In a `FormField`, set its `controlId` for a custom ID. |
| `name`, `form`, `capture`, `ref` | Apply to the native `input[type=file]`. The React 19 ref exposes that input. Calling `.focus()` delegates to the visible target. |
| Focus, click, keyboard and paste handlers | Apply to the accessible target. Drag handlers are local to the component. `onInvalid` observes the native input. `className`, `style` and data attributes apply to the root. |

For a compact read-only inspector, use `<FormField target="group">`. The value stays in the tab sequence with its label and description. The enabled Choose or Add button opens the system picker with Enter or Space. Clear returns focus to the trigger. Loading keeps the pending control in place. A disabled field receives no keyboard focus, including when a containing fieldset disables it. The first legend keeps its usual HTML exception.

## Admission and feedback

Admission uses the same rules for all three sources. It counts raw incoming file entries before per-file checks. If the resulting selection would exceed `maxFiles`, the entire incoming batch is rejected. Otherwise valid files are accepted in order and invalid neighbors get their own reason. A rejection includes `code`, `name`, and `file`. Both `name` and `file` can be null when the entry supplies neither. The codes are `too-many`, `directory`, `unreadable`, `type`, `too-large`, and `duplicate`. Folder entries stay at the top level.

Duplicate identity compares the name, size, MIME type and last modification time. Canceling, an empty picker result and equivalently reselecting the current single file leave the value and feedback unchanged. The rules apply to new files. Existing files stay in the selection after a rule change. Switching from multiple to single keeps the first committed file without delivering a callback. Applications should verify uploaded content and limits on the server.

A changed selection is written locally or restored to the current controlled value before `onValueChange` runs. Then `onIntake` runs once for the attempt, including full rejection and controlled veto. A parent can commit a subset or leave its value unchanged. The intake summary counts accepted files the owner actually committed by the end of that React update. A later update changes the selection without replaying the attempt. External `FormField` messages and local rejection details have independent ownership. Local rejection preserves the validity of a retained file.

## Native form lifecycle

The named input is the form carrier. The hidden chooser holds in-flight candidates separately, so the committed files remain available to `FormData` before acceptance. Accepted files are serialized in order as repeated entries with the same name. A named, enabled field with an empty selection contributes the HTML empty-file entry (`name === ''`, `size === 0`). An actual zero-byte file with a name is a selection. Omit `name` to keep the input out of the payload. Read-only and loading fields retain their form entries. Read-only omits `required`.

Selection opens after hydration and synchronization of the native input. During server rendering and the first client commit, the carrier is disabled and contributes neither entries nor validity constraints. A form that must require attachments before its first submit can tie the submit action to client readiness.

A real reset of the carrier's owner clears local selection and transient feedback. Controlled fields restore their latest committed files quietly. With a React `form` prop or a move of the whole component, restoration is available when `form.reset()` returns. After a reset-button click, read after the browser finishes the activation and delivers native reactions. If code changes only the carrier's `form` attribute through its ref, native ownership changes immediately and the component reconciles after the DOM mutation is observed. A canceled or synthetic reset leaves the selection and feedback intact. These timing paths are covered by the Chromium browser suite.

See [Overlays and Forms](../concepts/overlays-and-forms.md) for the shared form contract and [Browser Tests](../browser-tests.md) for running the suite.
