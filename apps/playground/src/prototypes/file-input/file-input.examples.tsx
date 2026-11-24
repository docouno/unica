import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Stack, Text } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import { ExampleSurface } from '../../specimens/shared/example-surface.js';
import { Dropzone, FileInput, FileItem, FileList } from './file-input.proto.js';
import type { FileItemStatus } from './file-input.proto.js';
import type { ControlSize, FieldStatus, FieldVariant } from '@docouno/unica';
import { formatFileSize } from './file-input.utils.js';
import './file-input.examples.css';

const sizes: readonly ControlSize[] = ['s', 'm', 'l'];
const noop = (): void => {};
function Sample({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="file-demo-sample">
      <Text as="span" size="caption-l" weight="medium" color="muted">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </div>
  );
}
export function FileRoles({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-grid">
      {(['default', 'ghost'] as const).map((variant: FieldVariant) => (
        <div className="file-demo-stack" key={variant}>
          {sizes.map((size) => (
            <Sample key={size} title={`${variant} · ${size.toUpperCase()}`}>
              <FileInput {...ctx.subject} size={size} variant={variant} label="Reference file" />
              <FileInput
                {...ctx.subject}
                size={size}
                variant={variant}
                label="Selected reference"
                initialFileName="research-notes.pdf"
              />
            </Sample>
          ))}
        </div>
      ))}
    </div>
  );
}
export function FileInteraction({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-grid">
      <Sample title="Hover, hold, or Tab to compare roles">
        <FileInput {...ctx.subject} label="Reference file" initialFileName="research-notes.pdf" />
        <FileInput
          {...ctx.subject}
          variant="ghost"
          label="Inline reference"
          initialFileName="research-notes.pdf"
        />
      </Sample>
      <Sample title="Dragging">
        <FileInput
          {...ctx.subject}
          label="Reference file"
          initialFileName="research-notes.pdf"
          previewState="dragging"
        />
        <FileInput
          {...ctx.subject}
          variant="ghost"
          label="Inline reference"
          initialFileName="research-notes.pdf"
          previewState="dragging"
        />
      </Sample>
      <Sample title="Try the picker and Remove">
        <FileInput
          {...ctx.subject}
          variant="ghost"
          label="Inline reference"
          initialFileName="clear-this-file.pdf"
          description={<bdi>Use Choose file again to replace the current file.</bdi>}
        />
      </Sample>
    </div>
  );
}
export function FileFeedback({ ctx }: PreviewProps): ReactElement {
  const cases: readonly { status: FieldStatus; message: string; loading?: boolean }[] = [
    { status: 'neutral', message: 'Selected locally. Nothing has been uploaded.' },
    { status: 'info', message: 'This file will be included with your submission.' },
    { status: 'success', message: 'File format verified.' },
    { status: 'warning', message: 'This version is older than the attached reference.' },
    { status: 'danger', message: 'Choose a PDF smaller than 10 MB. Your previous file is kept.' },
    { status: 'neutral', message: '', loading: true },
  ];
  return (
    <div className="file-demo-grid">
      {cases.map((entry, index) => (
        <Sample title={entry.loading ? 'Checking' : entry.status} key={index}>
          <FileInput
            {...ctx.subject}
            label="Reference file"
            initialFileName="research-notes.pdf"
            status={entry.status}
            message={entry.message && <bdi>{entry.message}</bdi>}
            loading={entry.loading}
          />
          <FileInput
            {...ctx.subject}
            variant="ghost"
            size="s"
            label="Inline reference"
            initialFileName="reference.pdf"
            status={entry.status}
            message={entry.status !== 'neutral' ? <bdi>{entry.message}</bdi> : undefined}
            loading={entry.loading}
          />
        </Sample>
      ))}
    </div>
  );
}
export function FileAvailability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-grid">
      <FileInput
        {...ctx.subject}
        label="Reference file"
        initialFileName="research-notes.pdf"
        readOnly
        description={<bdi>Read only. Attachments are locked after submission.</bdi>}
      />
      <FileInput
        {...ctx.subject}
        label="Reference file"
        readOnly
        description={<bdi>Read only. No attachment was provided.</bdi>}
      />
      <FileInput
        {...ctx.subject}
        label="Reference file"
        initialFileName="research-notes.pdf"
        disabled
        description={<bdi>Select a workspace to enable attachments.</bdi>}
      />
      <FileInput {...ctx.subject} label="Reference file" disabled />
      <FileInput
        {...ctx.subject}
        label="Verified reference"
        initialFileName="research-notes.pdf"
        readOnly
        loading
        status="success"
        message={<bdi>Verified. You can read and copy the filename.</bdi>}
      />
      <FileInput
        {...ctx.subject}
        label="Unavailable reference"
        initialFileName="research-notes.pdf"
        disabled
        status="danger"
        message={<bdi>Changes are unavailable while this workspace is archived.</bdi>}
      />
    </div>
  );
}
export function FileOverflow({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-stack">
      <FileInput
        {...ctx.subject}
        label="Supporting research, including the original source and the final approved revision"
        initialFileName="customer-research_findings_and_recommendations_for_the_next_release_v12_final.pdf"
        fileDetail="12.4 MB"
        description={
          <bdi>When space is tight, the filename and removal action move below the picker.</bdi>
        }
      />
      <FileInput
        {...ctx.subject}
        size="s"
        variant="ghost"
        label="Inline attachment"
        initialFileName="release-notes-without-any-breaks-abcdefghijklmnopqrstuvwxyz0123456789.md"
      />
      <div dir="rtl" className="file-demo-arabic">
        <FileInput
          {...ctx.subject}
          label="ملف مرجعي"
          initialFileName="تقرير-البحث-2026.pdf"
          fileDetail="214 KB"
        />
      </div>
      <Sample title="Externally named picker">
        <FileInput {...ctx.subject} aria-label="Optional supporting reference" />
      </Sample>
    </div>
  );
}
export function FileLive({ ctx }: PreviewProps): ReactElement {
  const [selected, setSelected] = useState<File | null>(null);
  const [feedback, setFeedback] = useState({
    text: 'No reference selected.',
    rejected: false,
    revision: 0,
  });
  function announce(text: string, rejected = false): void {
    setFeedback((previous) => ({ text, rejected, revision: previous.revision + 1 }));
  }
  function receive(files: readonly File[]): void {
    const next = files[0];
    if (!next) {
      setSelected(null);
      announce('Reference removed. Choose another file.');
    } else if (files.length !== 1 || !/\.(pdf|md)$/i.test(next.name) || next.size > 2000000) {
      announce(
        'Choose one PDF or Markdown file up to 2 MB.' +
          (selected ? ` Current reference: ${selected.name}.` : ' No reference selected.'),
        true,
      );
    } else {
      setSelected(next);
      announce(`Selected ${next.name} locally.`);
    }
  }
  useStoryAction(ctx, (action) => {
    if (action === 'sample') {
      receive([new File(['Notes'], 'research-notes.md')]);
    } else if (action === 'reject') {
      receive([new File([''], 'application.exe')]);
    }
  });
  return (
    <div className="file-demo-field file-demo-arabic">
      <FileInput
        {...ctx.subject}
        label="Supporting reference"
        required
        accept=".pdf,.md"
        description={<bdi>PDF or Markdown · Up to 2 MB. Files stay in this browser.</bdi>}
        fileName={selected?.name ?? ''}
        fileDetail={selected ? formatFileSize(selected.size) : ''}
        onFilesChange={receive}
        status={feedback.rejected ? 'danger' : 'neutral'}
        message={
          <span role="status">
            <bdi dir="ltr" key={feedback.revision}>
              {feedback.text}
            </bdi>
          </span>
        }
      />
    </div>
  );
}

export function SingleImageIntake({ ctx }: PreviewProps): ReactElement {
  const [feedback, setFeedback] = useState({
    text: 'No image selected.',
    rejected: false,
    revision: 0,
  });
  return (
    <Dropzone
      {...ctx.subject}
      className="file-demo-arabic"
      size="s"
      browseLabel="choose an image"
      accept="image/png,image/jpeg"
      multiple={false}
      description={<bdi>PNG or JPEG · Up to 10 MB</bdi>}
      status={feedback.rejected ? 'danger' : 'neutral'}
      message={
        <span role="status">
          <bdi dir="ltr" key={feedback.revision}>
            {feedback.text}
          </bdi>
        </span>
      }
      onFilesChange={(files) => {
        if (!files.length) {
          return;
        }
        const file = files[0];
        const allowed =
          files.length === 1 &&
          file &&
          ['image/png', 'image/jpeg'].includes(file.type) &&
          file.size <= 10000000;
        setFeedback((previous) => ({
          text: allowed ? `Selected ${file.name}.` : 'Choose one PNG or JPEG up to 10 MB.',
          rejected: !allowed,
          revision: previous.revision + 1,
        }));
      }}
    />
  );
}

export function DropInteraction({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-grid">
      {(['rest', 'hover', 'active', 'focus', 'dragging'] as const).map((previewState) => (
        <Sample
          key={previewState}
          title={previewState === 'focus' ? 'Keyboard focus' : previewState}
        >
          <Dropzone {...ctx.subject} previewState={previewState} />
        </Sample>
      ))}
      <Sample title="Drag over a previous rejection">
        <Dropzone
          {...ctx.subject}
          previewState="dragging"
          status="danger"
          message={<bdi>previous-attempt.exe was not added. Choose Markdown or ZIP.</bdi>}
        />
      </Sample>
    </div>
  );
}

export function DropFeedback({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16}>
      <Dropzone
        {...ctx.subject}
        status="danger"
        message={<bdi>recording.mov is 84 MB. Choose files up to 50 MB each.</bdi>}
      />
      <Dropzone
        {...ctx.subject}
        size="s"
        status="danger"
        description={<bdi>Markdown or ZIP · 3 files maximum</bdi>}
        message={<bdi>This batch would exceed the 3-file limit. Your selected files are kept.</bdi>}
      />
      <Dropzone
        {...ctx.subject}
        size="s"
        status="danger"
        message={<bdi>1 file added. report.exe was not added. Choose Markdown or ZIP.</bdi>}
      />
      <FileList aria-label="Selected file">
        <FileItem name="release-notes.md" fileSize="24 KB" detail="Selected locally" readOnly />
      </FileList>
      <Dropzone
        {...ctx.subject}
        size="s"
        status="danger"
        message={<bdi>release-notes.md is already selected.</bdi>}
      />
      <Dropzone
        {...ctx.subject}
        size="s"
        status="danger"
        message={<bdi>Choose individual files from the folder.</bdi>}
      />
    </Stack>
  );
}

const referenceText = '# Saved reference\n\nThe archive contains the approved project brief.\n';
const savedReference = {
  name: 'saved-reference.md',
  href: `data:text/markdown;charset=utf-8,${encodeURIComponent(referenceText)}`,
  fileSize: formatFileSize(new TextEncoder().encode(referenceText).length),
};

export function DropAvailability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-grid">
      {(['m', 's'] as const).map((size) => (
        <Sample title={size === 'm' ? 'Standard' : 'Compact'} key={size}>
          <Dropzone
            {...ctx.subject}
            size={size}
            readOnly
            title="Attachments are locked"
            description={<bdi>You can still review the saved attachment.</bdi>}
          />
          <FileList aria-label="Saved attachment">
            <FileItem {...savedReference} readOnly />
          </FileList>
          <Dropzone
            {...ctx.subject}
            size={size}
            disabled
            title="Attachments unavailable"
            description={null}
            message={<bdi>Select a workspace to add files.</bdi>}
          />
        </Sample>
      ))}
    </div>
  );
}

const rowCases: readonly {
  status: FileItemStatus;
  detail: string;
  progress?: number | null;
  name: string;
}[] = [
  { status: 'neutral', name: 'research-notes.pdf', detail: 'Selected locally' },
  { status: 'neutral', name: 'project-brief.pdf', detail: 'Waiting to upload' },
  { status: 'uploading', name: 'design-assets.zip', detail: 'Uploading', progress: 42 },
  { status: 'uploading', name: 'reference-images.zip', detail: 'Connecting…', progress: null },
  {
    status: 'uploading',
    name: 'source-documents.zip',
    detail: 'Transfer complete · Awaiting verification',
    progress: 100,
  },
  { status: 'processing', name: 'project-assets.zip', detail: 'Checking file…' },
  {
    status: 'processing',
    name: 'document-bundle.zip',
    detail: 'Verifying documents',
    progress: 72,
  },
  {
    status: 'paused',
    name: 'session-recording.zip',
    detail: 'Paused · Waiting for a connection',
    progress: 42,
  },
  { status: 'success', name: 'approved-brief.pdf', detail: 'Uploaded and verified' },
  {
    status: 'danger',
    name: 'supporting-research.zip',
    detail: 'Connection lost. Try uploading again.',
    progress: 42,
  },
  { status: 'removing', name: 'old-attachments.zip', detail: 'Removing file…' },
  {
    status: 'danger',
    name: 'protected-reference.pdf',
    detail: 'This PDF is password-protected. Choose an unlocked copy.',
  },
  {
    status: 'danger',
    name: 'outdated-brief.pdf',
    detail: 'Could not remove the file. It is still attached; try removing again.',
  },
];
export function FileRows({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-stack">
      <FileList aria-label="Pinned file lifecycle states">
        {rowCases.map((entry, index) => (
          <FileItem
            {...ctx.subject}
            key={index}
            name={entry.name}
            fileSize="2.4 MB"
            detail={entry.detail}
            status={entry.status}
            progress={entry.progress}
            onRemove={noop}
            onRetry={entry.name === 'supporting-research.zip' ? noop : undefined}
          />
        ))}
      </FileList>
    </div>
  );
}
export function RowSizes({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-stack">
      {sizes.map((size) => (
        <Sample title={size.toUpperCase()} key={size}>
          <FileList>
            <FileItem
              {...ctx.subject}
              size={size}
              name="project-brief.pdf"
              fileSize="214 KB"
              onRemove={noop}
            />
            <FileItem
              {...ctx.subject}
              size={size}
              name="cover-image.png"
              fileSize="1.2 MB"
              detail="Uploading"
              status="uploading"
              progress={65}
              thumbnail="/assets/empty-landscape.png"
              onRemove={noop}
            />
          </FileList>
        </Sample>
      ))}
    </div>
  );
}
export function RowOverflow({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-stack">
      <FileList aria-label="Long names and availability">
        <FileItem
          {...ctx.subject}
          name="customer-research_findings_and_recommendations_for_the_next_release_v12_final.pdf"
          fileSize="12.4 MB"
          detail="Connection lost while uploading. Your selected file is kept; try again when your connection is restored."
          status="danger"
          progress={42}
          onRetry={noop}
          onRemove={noop}
        />
        <FileItem
          {...ctx.subject}
          name="migration-report.zip"
          fileSize="1.2 MB"
          status="success"
          detail="Uploaded and verified. All cross-references passed validation."
          onRemove={noop}
        />
        <FileItem {...ctx.subject} name="project-brief.pdf" fileSize="214 KB" readOnly />
        <FileItem
          {...ctx.subject}
          name="archived-brief.pdf"
          fileSize="214 KB"
          disabled
          status="danger"
          detail="Attachments unavailable"
          onRemove={noop}
        />
        <FileItem {...ctx.subject} {...savedReference} detail="Download attachment" />
        <FileItem
          {...ctx.subject}
          name="تقرير-البحث-2026.pdf"
          className="file-demo-arabic"
          dir="rtl"
          fileSize="214 KB"
          status="success"
          detail="تم التحقق من الملف"
          onRemove={noop}
        />
      </FileList>
    </div>
  );
}

function fileCount(count: number): string {
  return `${count} ${count === 1 ? 'file' : 'files'}`;
}
interface LocalFile {
  readonly id: number;
  readonly file: File;
  readonly status: FileItemStatus;
  readonly progress?: number | null | undefined;
}
export function LiveQueue({ ctx }: PreviewProps): ReactElement {
  const [files, setFiles] = useState<readonly LocalFile[]>([]);
  const [feedback, setFeedback] = useState({
    text: 'No files selected.',
    rejected: false,
    revision: 0,
  });
  function announce(text: string, rejected = false): void {
    setFeedback((previous) => ({ text, rejected, revision: previous.revision + 1 }));
  }
  const nextId = useRef(0);
  const region = useRef<HTMLDivElement>(null);
  const focusAfterRemoval = useRef<number | 'picker' | null>(null);
  useLayoutEffect(() => {
    const id = focusAfterRemoval.current;
    focusAfterRemoval.current = null;
    if (id === null || document.activeElement !== document.body) {
      return;
    }
    const selector =
      id === 'picker'
        ? 'input[type="file"]'
        : `[data-file-id="${id}"] button[aria-label^="Remove"]`;
    region.current?.querySelector<HTMLElement>(selector)?.focus();
  }, [files]);
  function receive(incoming: readonly File[]): void {
    if (!incoming.length) {
      return;
    }
    if (files.length + incoming.length > 3) {
      announce(
        `Choose up to 3 files. This batch was not added. Selection kept: ${fileCount(files.length)}.`,
        true,
      );
      return;
    }
    const accepted: LocalFile[] = [];
    const errors: string[] = [];
    for (const file of incoming) {
      if (!/\.(md|zip)$/i.test(file.name)) {
        errors.push(`${file.name}: choose Markdown or ZIP.`);
      } else if (file.size > 2000000) {
        errors.push(`${file.name}: larger than 2 MB.`);
      } else if (
        files.some((entry) => entry.file.name === file.name && entry.file.size === file.size) ||
        accepted.some((entry) => entry.file.name === file.name && entry.file.size === file.size)
      ) {
        errors.push(`${file.name} is already selected.`);
      } else {
        accepted.push({ id: nextId.current++, file, status: 'neutral' });
      }
    }
    setFiles([...files, ...accepted]);
    const result = `${fileCount(accepted.length)} added. ${fileCount(files.length + accepted.length)} selected.`;
    announce([result, ...errors].join(' '), errors.length > 0);
  }
  function phase(status: FileItemStatus, progress?: number | null): void {
    if (
      !files.some(
        (entry) =>
          entry.status !== 'removing' && (entry.status !== status || entry.progress !== progress),
      )
    ) {
      return;
    }
    setFiles(
      files.map((entry) => (entry.status === 'removing' ? entry : { ...entry, status, progress })),
    );
    announce(
      status === 'success'
        ? 'Files uploaded and verified.'
        : status === 'danger'
          ? 'Upload failed. Retry is available beside each file.'
          : status === 'processing'
            ? 'Verifying files.'
            : progress === 100
              ? 'Transfer complete. Awaiting verification.'
              : 'Transfer in progress.',
    );
  }
  function finishRemoval(): void {
    const remaining = files.filter((entry) => entry.status !== 'removing');
    if (remaining.length === files.length) {
      return;
    }
    const active = document.activeElement?.closest<HTMLElement>('[data-file-id]');
    const index =
      active && region.current?.contains(active)
        ? files.findIndex(
            (entry) => entry.status === 'removing' && String(entry.id) === active.dataset.fileId,
          )
        : -1;
    if (index >= 0) {
      const next =
        files.slice(index + 1).find((entry) => entry.status !== 'removing') ?? remaining.at(-1);
      focusAfterRemoval.current = next?.id ?? 'picker';
    }
    setFiles(remaining);
    announce(`Removed ${fileCount(files.length - remaining.length)}.`);
  }

  useStoryAction(ctx, (action) => {
    switch (action) {
      case 'samples':
        receive([new File(['# Notes'], 'research-notes.md'), new File(['ZIP'], 'assets.zip')]);
        break;
      case 'mixed':
        receive([new File(['Notes'], 'project-brief.md'), new File([''], 'application.exe')]);
        break;
      case 'limit':
        receive(['one.md', 'two.md', 'three.md', 'four.md'].map((name) => new File([name], name)));
        break;
      case 'start':
        phase('uploading', 0);
        break;
      case 'progress':
        phase('uploading', 65);
        break;
      case 'finish':
        phase('uploading', 100);
        break;
      case 'verify':
        phase('processing');
        break;
      case 'success':
        phase('success');
        break;
      case 'fail':
        phase('danger', 65);
        break;
      case 'remove':
        finishRemoval();
        break;
    }
  });
  return (
    <div ref={region} className="file-demo-stack file-demo-arabic">
      <Dropzone
        {...ctx.subject}
        size="s"
        accept=".md,.zip"
        description={<bdi>Markdown or ZIP · Up to 2 MB each · 3 files maximum</bdi>}
        status={feedback.rejected ? 'danger' : 'neutral'}
        message={
          <span role="status">
            <bdi dir="ltr" key={feedback.revision}>
              {feedback.text}
            </bdi>
          </span>
        }
        onFilesChange={receive}
      />
      <FileList aria-label="Selected files">
        {files.map((entry) => (
          <FileItem
            key={entry.id}
            data-file-id={entry.id}
            tabIndex={-1}
            name={entry.file.name}
            fileSize={formatFileSize(entry.file.size)}
            status={entry.status}
            progress={entry.progress}
            detail={
              entry.status === 'uploading' && entry.progress === 100
                ? 'Transfer complete · Awaiting verification'
                : undefined
            }
            onRemove={() => {
              const row = region.current?.querySelector<HTMLElement>(
                `[data-file-id="${entry.id}"]`,
              );
              if (row?.contains(document.activeElement)) {
                row.focus();
              }
              setFiles(
                files.map((item) =>
                  item.id === entry.id ? { ...item, status: 'removing' } : item,
                ),
              );
              announce(`Removing ${entry.file.name}.`);
            }}
            onRetry={
              entry.status === 'danger'
                ? () => {
                    setFiles(
                      files.map((item) =>
                        item.id === entry.id ? { ...item, status: 'uploading', progress: 0 } : item,
                      ),
                    );
                    announce(`Retrying ${entry.file.name}.`);
                  }
                : undefined
            }
          />
        ))}
      </FileList>
    </div>
  );
}
export function MultipleField({ ctx }: PreviewProps): ReactElement {
  const [files, setFiles] = useState<readonly { id: number; file: File }[]>([]);
  const [notice, setNotice] = useState('');
  const sequence = useRef(0);
  const list = useRef<HTMLDivElement>(null);
  const nextFocus = useRef<number | 'picker' | null>(null);
  useLayoutEffect(() => {
    const id = nextFocus.current;
    nextFocus.current = null;
    if (id !== null && document.activeElement === document.body) {
      list.current
        ?.querySelector<HTMLElement>(
          id === 'picker' ? '.file-input-picker-proto' : `[data-reference-id="${id}"] button`,
        )
        ?.focus();
    }
  }, [files]);
  return (
    <div ref={list} className="file-demo-stack file-demo-arabic">
      <FileInput
        {...ctx.subject}
        multiple
        label="Supporting files"
        fileName={files.length ? `${fileCount(files.length)} selected` : ''}
        fileDetail={
          files.length ? formatFileSize(files.reduce((sum, entry) => sum + entry.file.size, 0)) : ''
        }
        onFilesChange={(incoming) => {
          if (!incoming.length) {
            return;
          }
          const entries = incoming.map((file) => ({ id: sequence.current++, file }));
          setFiles((current) => [...current, ...entries]);
          setNotice(
            `${fileCount(entries.length)} added. ${fileCount(files.length + entries.length)} selected.`,
          );
        }}
        message={
          <span role="status">
            <bdi dir="ltr">{notice}</bdi>
          </span>
        }
        description={<bdi>Add another selection at any time. Remove files individually below.</bdi>}
      />
      <FileList aria-label="Supporting files">
        {files.map(({ file, id }, index) => (
          <FileItem
            key={id}
            data-reference-id={id}
            name={file.name}
            fileSize={formatFileSize(file.size)}
            detail="Selected locally"
            onRemove={() => {
              if (
                list.current
                  ?.querySelector(`[data-reference-id="${id}"]`)
                  ?.contains(document.activeElement)
              ) {
                nextFocus.current = (files[index + 1] ?? files[index - 1])?.id ?? 'picker';
              }
              setFiles((current) => current.filter((entry) => entry.id !== id));
              setNotice(`Removed ${file.name}. ${fileCount(files.length - 1)} selected.`);
            }}
          />
        ))}
      </FileList>
    </div>
  );
}
export function DropSurface({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface} sizing="border-box">
      <Dropzone {...ctx.subject} size="s" />
      <FileList aria-label="Transfer examples">
        <FileItem
          name="research-assets.zip"
          fileSize="2.4 MB"
          status="uploading"
          progress={65}
          onRemove={noop}
        />
        <FileItem name="project-brief.pdf" fileSize="214 KB" status="success" onRemove={noop} />
      </FileList>
    </ExampleSurface>
  );
}
export function FileSurfaces({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface} sizing="border-box">
      <FileInput
        {...ctx.subject}
        label="Supporting reference"
        initialFileName="research-notes.pdf"
        fileDetail="214 KB"
      />
      <FileInput
        {...ctx.subject}
        variant="ghost"
        size="s"
        label="Inline reference"
        initialFileName="project-brief.md"
      />
    </ExampleSurface>
  );
}
