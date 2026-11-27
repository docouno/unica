import { createRef } from 'react';
import { Dropzone, FileInput, FileList, FileListItem } from '../src/index.js';
import type {
  DropzoneProps,
  FileInputProps,
  FileIntakeMessages,
  FileIntakeResult,
  FileIntakeSource,
  FileListItemProps,
  FileListItemState,
  FileListMessages,
  FileListProps,
  FileRejection,
} from '../src/server.js';

declare const files: readonly File[];
declare const state: FileListItemState;
declare const messages: Partial<FileIntakeMessages>;
declare const rowCopy: Partial<FileListMessages>;
declare const size: FileInputProps['maxSize'];

const inputRef = createRef<HTMLInputElement>();
const listRef = createRef<HTMLUListElement>();
const rowRef = createRef<HTMLLIElement>();

function result({ source, accepted, rejected }: FileIntakeResult): void {
  const intake: FileIntakeSource = source;
  const first: FileRejection | undefined = rejected[0];
  void [intake, accepted, first?.file, first?.code];
}

export const compact = <FileInput ref={inputRef} maxSize={size} value={files} onIntake={result} />;
export const drop = (
  <Dropzone
    ref={inputRef}
    {...({ description: <em>Guide</em> } satisfies DropzoneProps)}
    messages={messages}
  />
);
export const list = (
  <FileList
    {...({ ref: listRef, emptyFocusRef: inputRef } satisfies FileListProps)}
    messages={rowCopy}
  >
    <FileListItem {...({ name: 'brief.md', ref: rowRef, state } satisfies FileListItemProps)} />
  </FileList>
);

// @ts-expect-error File selection contains actual File objects.
export const stringValue = <FileInput value="brief.md" />;
// @ts-expect-error Native form baseline starts empty.
export const defaultFiles = <FileInput defaultValue={files} />;
// @ts-expect-error Native change is not a second proposal API.
export const change = <FileInput onChange={() => {}} />;
// @ts-expect-error Dropzone only supports neutral and danger feedback.
export const dropStatus = <Dropzone status="success" />;
// @ts-expect-error The well has a single structural role.
export const dropVariant = <Dropzone variant="ghost" />;
// @ts-expect-error Public ref points to the real file input.
export const wrongRef = <FileInput ref={listRef} />;
// @ts-expect-error Failure includes a reason.
export const failed = <FileListItem name="brief.md" state={{ phase: 'failed' }} />;
// @ts-expect-error Queued does not have a measurement.
export const queued = <FileListItem name="brief.md" state={{ phase: 'queued', progress: 10 }} />;
// @ts-expect-error File sizes are numeric byte counts.
export const sizeLabel = <FileListItem name="brief.md" fileSize="1 KB" />;
