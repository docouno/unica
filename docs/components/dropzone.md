# Dropzone, FileList, and FileListItem

Use Dropzone when a visible area can accept local files. A single native control covers the well. It accepts a file drop and opens the picker by click, Enter, or Space. The optional `allowPaste` prop accepts files pasted on the focused input. Text paste and drops elsewhere stay with their original targets.

```tsx
import { useRef, useState } from 'react';
import { Button, Dropzone, FileList, FileListItem, FormField } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ProjectFiles() {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<readonly File[]>([]);

  return (
    <form action="/project/attachments" method="post" encType="multipart/form-data">
      <FormField label="Project attachments">
        <Dropzone
          ref={input}
          name="attachments"
          accept=".md,.zip"
          maxSize={2_000_000}
          maxFiles={3}
          description="Attach the notes and supporting archives."
          value={files}
          onValueChange={setFiles}
        />
      </FormField>
      <FileList aria-label="Selected attachments" emptyFocusRef={input}>
        {files.map((file) => (
          <FileListItem
            key={JSON.stringify([file.name, file.size, file.type, file.lastModified])}
            name={file.name}
            fileSize={file.size}
            state={{ phase: 'selected' }}
            onRemove={() => setFiles((current) => current.filter((entry) => entry !== file))}
          />
        ))}
      </FileList>
      <Button type="submit">Send attachments</Button>
    </form>
  );
}
```

## Dropzone API

Dropzone uses the [FileInput admission, callback and native form contract](file-input.md). It defaults to multiple selection and accepts `status="neutral" | "danger"`. The well has one structural role with `s`, `m`, and `l` sizes. Its `description` holds additional guidance alongside automatically formatted admission limits. Both stay visible during file drag. The file input receives the ID, labeling, focus and keyboard events, form attributes, and public ref.

For a single replacement target, set `multiple={false}`. Place removal actions in a separate `FileList` and make the intake controlled. Use `FormField` for a visible field label, or name the input with `aria-label` or `aria-labelledby`. Unavailable states and feedback stay accessible through the well and its description.

## FileList

FileList renders a `ul`. Give it an accessible name and pass `FileListItem` children with stable keys. It can live alongside either intake component or on its own. `size` defaults to `m` and is inherited by its rows. `ref` points to the native list.

FileList keeps one polite region for meaningful changes to existing rows and confirmed removals. Initial rows and percentage updates are quiet. The intake announces the result of a selection attempt. Customize list and row copy with `messages?: Partial<FileListMessages>`.

Keep the list mounted across an empty collection to allow focus recovery. When the focused Retry disappears, focus goes to the same row's available Remove, then the next available Remove in the previous order, then earlier rows. Removing a focused row uses the same neighbor order. With no remaining target, the list tries `emptyFocusRef` and then its own programmatic focus target. If a parent removes the entire list, the parent owns the surviving focus destination. An asynchronous confirmation preserves any focus the user already moved elsewhere.

## FileListItem

A row renders a `li` with the filename and optional `fileSize` in bytes. Give a saved attachment an `href` to download it under its filename. Read-only rows permit download and hide mutation actions. Disabled rows suppress actions, phases and downloads. A row ref points to the native list item.

The optional `state: FileListItemState` is application-owned.

| Phase | Additional fields and behavior |
| --- | --- |
| `selected`, `queued`, `success` | Optional `label`. Success shows a mark when the application confirms the result. |
| `uploading`, `verifying` | Optional `label` and `progress` in percent. Omit progress or pass `null` for an unknown measurement. Zero remains a measured zero. At 100% transfer the row still awaits verification. |
| `paused`, `failed` | Supply a `reason`; `progress` can show the last measurement. Failed rows expose Retry when `onRetry` is supplied. |

A saved reference can omit `state` entirely. Only a file selected by intake becomes form data. The application owns progress, verification, retry and transport. Finite measurements are clamped to 0–100. The row derives indeterminate, paused and measured indicators from the supplied phase and measurement.

`onRemove` and `onRetry` request an application action. Set `removing` while confirmation is pending. The row stays in place with a single status indicator and blocks repeated actions. To report a rejected removal, clear `removing` and pass `removeError` alongside the existing phase. Confirm removal by taking the item out of the list. Each action has the filename in its accessible name.

Pass an image `File` to `thumbnail` to let the row create and release its preview URL. A string URL remains under the application's ownership. Broken previews fall back to the file glyph. The preview is decorative and the filename stays available to assistive technology.
