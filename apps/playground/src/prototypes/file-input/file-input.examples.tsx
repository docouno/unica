import { useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '@docouno/unica';
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
      <span className="file-demo-label">{title}</span>
      {children}
    </div>
  );
}
export function FileRoles(): ReactElement {
  return (
    <div className="file-demo-grid">
      {(['default', 'ghost'] as const).map((variant: FieldVariant) => (
        <div className="file-demo-stack" key={variant}>
          {sizes.map((size) => (
            <Sample key={size} title={`${variant} · ${size.toUpperCase()}`}>
              <FileInput size={size} variant={variant} label="Reference file" />
              <FileInput
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
export function FileInteraction(): ReactElement {
  return (
    <div className="file-demo-grid">
      <Sample title="Hover, hold, or Tab to compare roles">
        <FileInput label="Reference file" initialFileName="research-notes.pdf" />
        <FileInput variant="ghost" label="Inline reference" initialFileName="research-notes.pdf" />
      </Sample>
      <Sample title="Dragging">
        <FileInput
          label="Reference file"
          initialFileName="research-notes.pdf"
          previewState="dragging"
        />
        <FileInput
          variant="ghost"
          label="Inline reference"
          initialFileName="research-notes.pdf"
          previewState="dragging"
        />
      </Sample>
      <Sample title="Try the picker and Remove">
        <FileInput
          variant="ghost"
          label="Inline reference"
          initialFileName="clear-this-file.pdf"
          description="Use Choose file again to replace the current file."
        />
      </Sample>
    </div>
  );
}
export function FileFeedback(): ReactElement {
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
            label="Reference file"
            initialFileName="research-notes.pdf"
            status={entry.status}
            message={entry.message}
            loading={entry.loading}
          />
          <FileInput
            variant="ghost"
            size="s"
            label="Inline reference"
            initialFileName="reference.pdf"
            status={entry.status}
            message={entry.status !== 'neutral' ? entry.message : undefined}
            loading={entry.loading}
          />
        </Sample>
      ))}
    </div>
  );
}
export function FileAvailability(): ReactElement {
  return (
    <div className="file-demo-grid">
      <FileInput
        label="Reference file"
        initialFileName="research-notes.pdf"
        readOnly
        description="Read only. Attachments are locked after submission."
      />
      <FileInput
        label="Reference file"
        readOnly
        description="Read only. No attachment was provided."
      />
      <FileInput
        label="Reference file"
        initialFileName="research-notes.pdf"
        disabled
        description="Select a workspace to enable attachments."
      />
      <FileInput label="Reference file" disabled />
      <FileInput
        label="Verified reference"
        initialFileName="research-notes.pdf"
        readOnly
        loading
        status="success"
        message="Verified. You can read and copy the filename."
      />
      <FileInput
        label="Unavailable reference"
        initialFileName="research-notes.pdf"
        disabled
        status="danger"
        message="Changes are unavailable while this workspace is archived."
      />
    </div>
  );
}
export function FileOverflow(): ReactElement {
  return (
    <div className="file-demo-stack">
      <FileInput
        label="Supporting research, including the original source and the final approved revision"
        initialFileName="customer-research_findings_and_recommendations_for_the_next_release_v12_final.pdf"
        fileDetail="12.4 MB"
        description="When space is tight, the filename and removal action move below the picker."
      />
      <FileInput
        size="s"
        variant="ghost"
        label="Inline attachment"
        initialFileName="release-notes-without-any-breaks-abcdefghijklmnopqrstuvwxyz0123456789.md"
      />
      <div dir="rtl" className="file-demo-arabic">
        <FileInput label="ملف مرجعي" initialFileName="تقرير-البحث-2026.pdf" fileDetail="214 KB" />
      </div>
      <Sample title="Externally named picker">
        <FileInput aria-label="Optional supporting reference" />
      </Sample>
    </div>
  );
}
export function FileLive(): ReactElement {
  const [file, setFile] = useState<readonly File[]>([]);
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<FieldStatus>('neutral');
  function receive(files: readonly File[]): void {
    if (!files.length) {
      setFile([]);
      setStatus('neutral');
      setMessage('Reference removed. Choose another file.');
      return;
    }
    const next = files[0]!;
    if (!/\.(pdf|md)$/i.test(next.name) || next.size > 2000000 || files.length > 1) {
      setStatus('danger');
      setMessage('Choose one PDF or Markdown file up to 2 MB. Your previous file is kept.');
      return;
    }
    setFile([next]);
    setStatus('neutral');
    setMessage('Selected locally. Ready to submit with your form.');
  }
  return (
    <div className="file-demo-stack">
      <FileInput
        label="Supporting reference"
        required
        accept=".pdf,.md"
        description="PDF or Markdown · Up to 2 MB. Files stay in this browser."
        fileName={file[0]?.name ?? ''}
        fileDetail={file[0] ? formatFileSize(file[0].size) : ''}
        onFilesChange={receive}
        status={status}
        message={message}
      />
      <div className="file-demo-controls">
        <span className="file-demo-label">Local selection controls</span>
        <div className="file-demo-actions">
          <Button
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={() => receive([new File(['Notes'], 'research-notes.md')])}
          >
            Choose sample
          </Button>
          <Button
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={() => receive([new File([''], 'application.exe')])}
          >
            Try rejected file
          </Button>
        </div>
      </div>
      <p className="file-demo-note" role="status">
        {file.length ? `Current reference: ${file[0]!.name}` : 'No reference selected.'}
      </p>
    </div>
  );
}

export function DropSizes(): ReactElement {
  return (
    <div className="file-demo-stack">
      {sizes.map((size) => (
        <Sample
          key={size}
          title={`${size.toUpperCase()} · ${size === 's' ? 'Compact attachment slot' : size === 'm' ? 'Standard intake' : 'Primary intake'}`}
        >
          <Dropzone size={size} />
        </Sample>
      ))}
      <Sample title="Single image intake">
        <Dropzone
          size="s"
          description="PNG or JPEG · Up to 10 MB"
          browseLabel="choose an image"
          accept="image/png,image/jpeg"
          multiple={false}
        />
      </Sample>
    </div>
  );
}
export function DropInteraction(): ReactElement {
  return (
    <div className="file-demo-grid">
      {(['rest', 'hover', 'active', 'focus', 'dragging'] as const).map((previewState) => (
        <Sample
          key={previewState}
          title={previewState === 'focus' ? 'Keyboard focus' : previewState}
        >
          <Dropzone previewState={previewState} />
        </Sample>
      ))}
      <Sample title="Drag over a previous rejection">
        <Dropzone
          previewState="dragging"
          status="danger"
          message="previous-attempt.exe was not added. Choose Markdown or ZIP."
        />
      </Sample>
    </div>
  );
}
export function DropFeedback(): ReactElement {
  return (
    <div className="file-demo-stack">
      <Dropzone
        status="danger"
        message="recording.mov is 84 MB. Choose files up to 50 MB each. Your selected files are kept."
      />
      <Dropzone
        size="s"
        status="danger"
        message="Choose up to 3 files. This batch was not added; your 2 selected files are kept."
      />
      <Dropzone
        size="s"
        status="danger"
        message="1 file added. report.exe was not added: choose Markdown or ZIP."
      />
      <FileList aria-label="Previously selected files">
        <FileItem
          name="release-notes.md"
          fileSize="24 KB"
          detail="Selected locally"
          onRemove={noop}
        />
      </FileList>
      <p className="file-demo-note">
        Duplicates: “release-notes.md is already selected.” Folders: “Choose files, not folders.”
        Neither creates a failed upload row.
      </p>
    </div>
  );
}
export function DropAvailability(): ReactElement {
  return (
    <div className="file-demo-grid">
      <Dropzone
        readOnly
        title="Attachments are locked"
        description="You can still review the selected files."
      />
      <Dropzone
        disabled
        title="Attachments unavailable"
        description={null}
        message="Select a workspace to add files."
      />
      <Dropzone size="s" readOnly description="Selected files can still be reviewed." />
      <Dropzone
        size="s"
        disabled
        title="Attachments unavailable"
        description={null}
        message="Select a workspace to add files."
      />
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
export function FileRows(): ReactElement {
  return (
    <div className="file-demo-stack">
      <FileList aria-label="Pinned file lifecycle states">
        {rowCases.map((entry, index) => (
          <FileItem
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
export function RowSizes(): ReactElement {
  return (
    <div className="file-demo-stack">
      {sizes.map((size) => (
        <Sample title={size.toUpperCase()} key={size}>
          <FileList>
            <FileItem size={size} name="project-brief.pdf" fileSize="214 KB" onRemove={noop} />
            <FileItem
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
export function RowOverflow(): ReactElement {
  return (
    <div className="file-demo-stack">
      <FileList aria-label="Long names and availability">
        <FileItem
          name="customer-research_findings_and_recommendations_for_the_next_release_v12_final.pdf"
          fileSize="12.4 MB"
          detail="Connection lost while uploading. Your selected file is kept; try again when your connection is restored."
          status="danger"
          progress={42}
          onRetry={noop}
          onRemove={noop}
        />
        <FileItem
          name="migration-report.zip"
          fileSize="1.2 MB"
          status="success"
          detail="Uploaded and verified. All cross-references passed validation."
          onRemove={noop}
        />
        <FileItem name="project-brief.pdf" fileSize="214 KB" readOnly />
        <FileItem
          name="archived-brief.pdf"
          fileSize="214 KB"
          disabled
          status="danger"
          detail="Attachments unavailable"
          onRemove={noop}
        />
        <FileItem
          name="saved-reference.md"
          fileSize="24 KB"
          detail="Download attachment"
          href="data:text/markdown,Reference%20document"
        />
        <FileItem
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

interface LocalFile {
  readonly id: number;
  readonly file: File;
  readonly status: FileItemStatus;
  readonly progress?: number | null | undefined;
}
export function LiveQueue(): ReactElement {
  const [files, setFiles] = useState<readonly LocalFile[]>([]);
  const [message, setMessage] = useState('');
  const [rejected, setRejected] = useState(false);
  const [announcement, setAnnouncement] = useState('No files selected.');
  const nextId = useRef(0);
  const region = useRef<HTMLDivElement>(null);
  function receive(incoming: readonly File[]): void {
    if (!incoming.length) {
      return;
    }
    if (files.length + incoming.length > 3) {
      setRejected(true);
      setMessage(
        `Choose up to 3 files. This batch was not added; your ${files.length} selected files are kept.`,
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
    setRejected(errors.length > 0);
    setMessage(
      `${accepted.length} ${accepted.length === 1 ? 'file' : 'files'} added.${errors.length ? ` ${errors.join(' ')}` : ' Selected locally; nothing has been uploaded.'}`,
    );
    setAnnouncement(
      `${accepted.length} files added. ${files.length + accepted.length} files selected.`,
    );
  }
  function phase(status: FileItemStatus, progress?: number | null): void {
    setFiles(
      files.map((entry) => (entry.status === 'removing' ? entry : { ...entry, status, progress })),
    );
    setAnnouncement(
      status === 'success'
        ? 'Files uploaded and verified.'
        : status === 'danger'
          ? 'Upload failed. Retry is available beside each file.'
          : `Preview phase: ${status}.`,
    );
  }
  function finishRemoval(): void {
    const removedIndex = files.findIndex((entry) => entry.status === 'removing');
    setFiles(files.filter((entry) => entry.status !== 'removing'));
    setAnnouncement('Removed files.');
    requestAnimationFrame(() => {
      const actions = region.current?.querySelectorAll<HTMLButtonElement>(
        '.file-item-actions-proto button[aria-label^="Remove"]',
      );
      const target = actions?.[Math.min(removedIndex, actions.length - 1)];
      (target ?? region.current?.querySelector<HTMLInputElement>('input[type="file"]'))?.focus();
    });
  }
  return (
    <div ref={region} className="file-demo-stack">
      <Dropzone
        size="s"
        description="Markdown or ZIP · Up to 2 MB each · 3 files maximum"
        status={rejected ? 'danger' : 'neutral'}
        message={message}
        onFilesChange={receive}
      />
      <FileList aria-label="Selected files">
        {files.map((entry) => (
          <FileItem
            key={entry.id}
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
              setFiles(
                files.map((item) =>
                  item.id === entry.id ? { ...item, status: 'removing' } : item,
                ),
              );
              setAnnouncement(
                `Removing ${entry.file.name}. Confirm removal with the preview control.`,
              );
            }}
            onRetry={
              entry.status === 'danger'
                ? () => {
                    setFiles(
                      files.map((item) =>
                        item.id === entry.id ? { ...item, status: 'uploading', progress: 0 } : item,
                      ),
                    );
                    setAnnouncement(`Retrying ${entry.file.name}.`);
                  }
                : undefined
            }
          />
        ))}
      </FileList>
      <div className="file-demo-controls">
        <span className="file-demo-label">Preview controls · No network transfer</span>
        <div className="file-demo-actions">
          <Button
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={() =>
              receive([new File(['# Notes'], 'research-notes.md'), new File(['ZIP'], 'assets.zip')])
            }
          >
            Add sample files
          </Button>
          <Button
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={() =>
              receive([new File(['Notes'], 'project-brief.md'), new File([''], 'application.exe')])
            }
          >
            Try mixed batch
          </Button>
          <Button
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={() =>
              receive([
                new File(['a'], 'one.md'),
                new File(['b'], 'two.md'),
                new File(['c'], 'three.md'),
                new File(['d'], 'four.md'),
              ])
            }
          >
            Try count limit
          </Button>
        </div>
        <div className="file-demo-actions">
          {(
            [
              ['Start transfer', 'uploading', 0],
              ['Set 65%', 'uploading', 65],
              ['Finish transfer', 'uploading', 100],
              ['Verify', 'processing', undefined],
              ['Confirm success', 'success', undefined],
              ['Fail transfer', 'danger', 65],
            ] as const
          ).map(([title, status, progress]) => (
            <Button
              size="s"
              variant="ghost"
              tone="neutral"
              key={title}
              disabled={!files.some((entry) => entry.status !== 'removing')}
              onClick={() => phase(status, progress)}
            >
              {title}
            </Button>
          ))}
          <Button
            size="s"
            variant="ghost"
            tone="neutral"
            disabled={!files.some((entry) => entry.status === 'removing')}
            onClick={finishRemoval}
          >
            Confirm removal
          </Button>
        </div>
      </div>
      <p className="file-demo-note" role="status">
        {announcement}
      </p>
    </div>
  );
}
export function MultipleField(): ReactElement {
  const [files, setFiles] = useState<readonly File[]>([]);
  return (
    <div className="file-demo-stack">
      <FileInput
        multiple
        label="Supporting files"
        fileName={files.length ? `${files.length} files selected` : ''}
        fileDetail={
          files.length ? formatFileSize(files.reduce((sum, file) => sum + file.size, 0)) : ''
        }
        onFilesChange={(incoming) => setFiles([...files, ...incoming])}
        description="Add another selection at any time. Each file has its own removal action below."
      />
      <FileList>
        {files.map((file, index) => (
          <FileItem
            key={`${file.name}-${index}`}
            name={file.name}
            fileSize={formatFileSize(file.size)}
            detail="Selected locally"
            onRemove={() => setFiles(files.filter((_, itemIndex) => itemIndex !== index))}
          />
        ))}
      </FileList>
    </div>
  );
}
export function FileSurfaces({ compact = false }: { readonly compact?: boolean }): ReactElement {
  return (
    <div className="file-demo-grid">
      {(['base', 'overlay'] as const).map((surface) => (
        <div
          className="file-demo-surface-stage"
          data-surface="base"
          data-underlay={surface === 'overlay' || undefined}
          key={surface}
        >
          <div className="file-demo-surface" data-surface={surface} data-plate={surface}>
            <span className="file-demo-label">{surface} surface</span>
            {compact ? (
              <>
                <FileInput
                  label="Supporting reference"
                  initialFileName="research-notes.pdf"
                  fileDetail="214 KB"
                />
                <FileInput
                  variant="ghost"
                  size="s"
                  label="Inline reference"
                  initialFileName="project-brief.md"
                />
              </>
            ) : (
              <>
                <Dropzone size="s" />
                <FileList>
                  <FileItem
                    name="research-assets.zip"
                    fileSize="2.4 MB"
                    status="uploading"
                    progress={65}
                    onRemove={noop}
                  />
                  <FileItem
                    name="project-brief.pdf"
                    fileSize="214 KB"
                    status="success"
                    onRemove={noop}
                  />
                </FileList>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
