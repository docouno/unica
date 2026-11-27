import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Dropzone, FileList, FileListItem, Stack } from '@docouno/unica';
import type { FileListItemProps, FileListItemState } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { FileStudy } from '../file-input/file-input.examples.js';
import { fileFixture, fileGesture, fileKey, fileSizes } from '../file-input/file-fixtures.js';

const noop = (): void => {};
const rules = { accept: '.md,.zip', maxSize: 2_000_000, maxFiles: 3 };
const research = 'supporting-research.zip';
const longName =
  'customer-research_findings_and_recommendations_for_the_next_release_v12_final.pdf';
const lostConnection: FileListItemState = {
  phase: 'failed',
  reason: 'Connection lost. Try uploading again.',
  progress: 42,
};

export function SingleImageIntake({ ctx }: PreviewProps): ReactElement {
  return (
    <Dropzone
      {...ctx.subject}
      className="file-demo-arabic"
      size="s"
      aria-label="Choose an image"
      messages={{ browse: 'choose an image' }}
      accept="image/png,image/jpeg"
      maxSize={10_000_000}
      multiple={false}
    />
  );
}

export function DropInteraction({ ctx }: PreviewProps): ReactElement {
  const sample = useRef<HTMLInputElement>(null);
  useStoryAction(ctx, (action) => {
    const file = fileFixture(action === 'reject' ? 'previous-attempt.exe' : 'reference.md');
    fileGesture(
      sample.current,
      [file],
      action === 'drag' ? 'dragenter' : action === 'leave' ? 'dragleave' : 'drop',
    );
  });
  return (
    <div className="file-demo-grid">
      <FileStudy title="Pointer and keyboard">
        <Dropzone {...ctx.subject} aria-label="Try the picker" />
      </FileStudy>
      <FileStudy title="File drag with existing feedback">
        <Dropzone {...ctx.subject} {...rules} ref={sample} aria-label="Try a file drag" />
      </FileStudy>
    </div>
  );
}

export function DropFeedback({ ctx }: PreviewProps): ReactElement {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<readonly File[]>(() => [fileFixture('release-notes.md')]);
  useStoryAction(ctx, (action) => {
    switch (action) {
      case 'size':
        fileGesture(input.current, [fileFixture('recording.zip', '', rules.maxSize + 1)]);
        break;
      case 'count':
        fileGesture(
          input.current,
          ['one.md', 'two.md', 'three.md'].map((name) => fileFixture(name)),
        );
        break;
      case 'mixed':
        fileGesture(input.current, [fileFixture('project-brief.md'), fileFixture('report.exe')]);
        break;
      case 'duplicate':
        fileGesture(input.current, [fileFixture('release-notes.md')]);
        break;
      case 'folder':
        fileGesture(input.current, [], 'drop', 'drafts');
        break;
    }
  });
  return (
    <Stack gap={16}>
      <Dropzone
        {...ctx.subject}
        {...rules}
        ref={input}
        value={files}
        onValueChange={setFiles}
        aria-label="Try file admission"
      />
      <FileList aria-label="Selected files" emptyFocusRef={input}>
        {files.map((file) => (
          <FileListItem
            key={fileKey(file)}
            name={file.name}
            fileSize={file.size}
            state={{ phase: 'selected' }}
            onRemove={() => setFiles((current) => current.filter((entry) => entry !== file))}
          />
        ))}
      </FileList>
    </Stack>
  );
}

const referenceText = '# Saved reference\n\nThe archive contains the approved project brief.\n';
const savedReference = {
  name: 'saved-reference.md',
  href: `data:text/markdown;charset=utf-8,${encodeURIComponent(referenceText)}`,
  fileSize: new TextEncoder().encode(referenceText).length,
};

export function DropAvailability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-grid">
      {(['m', 's'] as const).map((size) => (
        <FileStudy title={size === 'm' ? 'Standard' : 'Compact'} key={size}>
          <Dropzone
            {...ctx.subject}
            size={size}
            readOnly
            aria-label="Attachments"
            messages={{ readOnly: 'Attachments are locked' }}
            description="You can still review the saved attachment."
          />
          <FileList aria-label="Saved attachment">
            <FileListItem {...savedReference} readOnly />
          </FileList>
          <Dropzone
            {...ctx.subject}
            size={size}
            disabled
            messages={{ disabled: 'Attachments unavailable' }}
            description="Select a workspace to add files."
          />
        </FileStudy>
      ))}
    </div>
  );
}

const lifecycle: readonly FileListItemProps[] = [
  { name: 'research-notes.pdf', state: { phase: 'selected' } },
  { name: 'project-brief.pdf', state: { phase: 'queued' } },
  { name: 'design-assets.zip', state: { phase: 'uploading', progress: 42 } },
  { name: 'reference-images.zip', state: { phase: 'uploading', progress: null } },
  { name: 'source-documents.zip', state: { phase: 'uploading', progress: 100 } },
  { name: 'project-assets.zip', state: { phase: 'verifying' } },
  {
    name: 'document-bundle.zip',
    state: { phase: 'verifying', progress: 72, label: 'Verifying documents' },
  },
  {
    name: 'session-recording.zip',
    state: { phase: 'paused', progress: 42, reason: 'Paused · Waiting for a connection' },
  },
  { name: 'approved-brief.pdf', state: { phase: 'success', label: 'Uploaded and verified' } },
  { name: research, state: lostConnection, onRetry: noop },
  { name: 'old-attachments.zip', removing: true },
  {
    name: 'protected-reference.pdf',
    state: { phase: 'failed', reason: 'This PDF is password-protected. Choose an unlocked copy.' },
  },
  {
    name: 'outdated-brief.pdf',
    removeError: 'Could not remove the file. It is still attached; try removing again.',
  },
];

export function FileRows({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-stack">
      <FileList aria-label="Pinned file lifecycle states">
        {lifecycle.map((entry) => (
          <FileListItem
            {...ctx.subject}
            key={entry.name}
            fileSize={2_400_000}
            onRemove={noop}
            {...entry}
          />
        ))}
      </FileList>
    </div>
  );
}

export function RowSizes({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-stack">
      {fileSizes.map((size) => (
        <FileStudy title={size.toUpperCase()} key={size}>
          <FileList size={size} aria-label={`Attachment rows, ${size.toUpperCase()}`}>
            <FileListItem
              {...ctx.subject}
              name="project-brief.pdf"
              fileSize={214_000}
              onRemove={noop}
            />
            <FileListItem
              {...ctx.subject}
              name="cover-image.png"
              fileSize={1_200_000}
              state={{ phase: 'uploading', progress: 65 }}
              thumbnail="/assets/empty-landscape.png"
              onRemove={noop}
            />
          </FileList>
        </FileStudy>
      ))}
    </div>
  );
}

export function RowOverflow({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-stack file-demo-arabic">
      <FileList aria-label="Long names and availability">
        <FileListItem
          {...ctx.subject}
          name={longName}
          fileSize={12_400_000}
          state={{
            phase: 'failed',
            progress: 42,
            reason:
              'Connection lost while uploading. Your selected file is kept; try again when your connection is restored.',
          }}
          onRetry={noop}
          onRemove={noop}
        />
        <FileListItem
          {...ctx.subject}
          name="migration-report.zip"
          fileSize={1_200_000}
          state={{
            phase: 'success',
            label: 'Uploaded and verified. All cross-references passed validation.',
          }}
          onRemove={noop}
        />
        <FileListItem {...ctx.subject} name="project-brief.pdf" fileSize={214_000} readOnly />
        <FileListItem
          {...ctx.subject}
          name="archived-brief.pdf"
          fileSize={214_000}
          disabled
          onRemove={noop}
        />
        <FileListItem {...ctx.subject} {...savedReference} />
        <FileListItem
          {...ctx.subject}
          name="تقرير-البحث-2026.pdf"
          dir="rtl"
          fileSize={214_000}
          state={{ phase: 'success', label: 'تم التحقق من الملف' }}
          onRemove={noop}
        />
      </FileList>
    </div>
  );
}

interface LocalFile {
  readonly id: number;
  readonly file: File;
  readonly state: FileListItemState;
  readonly removing?: boolean | undefined;
}

export function LiveQueue({ ctx }: PreviewProps): ReactElement {
  const [files, setFiles] = useState<readonly LocalFile[]>([]);
  const sequence = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  function setPhase(state: FileListItemState): void {
    setFiles((current) => current.map((item) => (item.removing ? item : { ...item, state })));
  }

  useStoryAction(ctx, (action) => {
    switch (action) {
      case 'samples':
        fileGesture(input.current, [fileFixture('research-notes.md'), fileFixture('assets.zip')]);
        break;
      case 'mixed':
        fileGesture(input.current, [
          fileFixture('project-brief.md'),
          fileFixture('application.exe'),
        ]);
        break;
      case 'limit':
        fileGesture(
          input.current,
          ['one.md', 'two.md', 'three.md', 'four.md'].map((name) => fileFixture(name)),
        );
        break;
      case 'start':
        setPhase({ phase: 'uploading', progress: 0 });
        break;
      case 'progress':
        setPhase({ phase: 'uploading', progress: 65 });
        break;
      case 'finish':
        setPhase({ phase: 'uploading', progress: 100 });
        break;
      case 'verify':
        setPhase({ phase: 'verifying' });
        break;
      case 'success':
        setPhase({ phase: 'success', label: 'Uploaded and verified' });
        break;
      case 'fail':
        setPhase(lostConnection);
        break;
      case 'remove':
        setFiles((current) => current.filter(({ removing }) => !removing));
        break;
    }
  });

  function editRow(id: number, patch: Partial<LocalFile>): void {
    setFiles((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  return (
    <div className="file-demo-stack file-demo-arabic">
      <Dropzone
        {...ctx.subject}
        {...rules}
        ref={input}
        size="s"
        aria-label="Add files to the queue"
        value={files.map((entry) => entry.file)}
        onValueChange={(next) => {
          const retained = new Map(files.map((entry) => [entry.file, entry]));
          setFiles(
            next.map(
              (file) =>
                retained.get(file) ?? {
                  id: sequence.current++,
                  file,
                  state: { phase: 'selected' },
                },
            ),
          );
        }}
      />
      <FileList aria-label="Selected files" emptyFocusRef={input}>
        {files.map(({ id, file, state, removing }) => (
          <FileListItem
            key={id}
            data-file-id={id}
            name={file.name}
            fileSize={file.size}
            state={state}
            removing={removing}
            onRemove={() => editRow(id, { removing: true })}
            onRetry={
              state.phase === 'failed'
                ? () => editRow(id, { state: { phase: 'uploading', progress: 0 } })
                : undefined
            }
          />
        ))}
      </FileList>
    </div>
  );
}

export function DropSurface({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface} sizing="border-box">
      <Dropzone {...ctx.subject} {...rules} size="s" />
      <FileList aria-label="Transfer examples">
        <FileListItem
          name="research-assets.zip"
          fileSize={2_400_000}
          state={{ phase: 'uploading', progress: 65 }}
          onRemove={noop}
        />
        <FileListItem
          name="project-brief.pdf"
          fileSize={214_000}
          state={{ phase: 'success' }}
          onRemove={noop}
        />
      </FileList>
    </ExampleSurface>
  );
}
