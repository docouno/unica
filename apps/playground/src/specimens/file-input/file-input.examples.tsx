import { useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { FileInput, FileList, FileListItem, FormField, Text } from '@docouno/unica';
import type { FileInputProps, FieldStatus } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { fileFixture, fileGesture, fileKey, fileSizes } from './file-fixtures.js';
import './file-input.examples.css';

export function FileStudy({
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

function CompactField({
  label,
  description,
  message,
  sample,
  bytes,
  ...props
}: FileInputProps & {
  readonly label: string;
  readonly description?: string | undefined;
  readonly message?: string | undefined;
  readonly sample?: string | undefined;
  readonly bytes?: number | undefined;
}): ReactElement {
  const [value, setValue] = useState(() => (sample ? [fileFixture(sample, '', bytes)] : []));
  return (
    <FormField
      label={label}
      target={props.readOnly ? 'group' : 'control'}
      description={description}
      message={message && <bdi>{message}</bdi>}
      status={props.status}
      disabled={props.disabled}
      required={props.required}
    >
      <FileInput {...props} value={value} onValueChange={(files) => setValue([...files])} />
    </FormField>
  );
}

export function FileRoles({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-grid">
      {(['default', 'ghost'] as const).map((variant) => (
        <div className="file-demo-stack" key={variant}>
          {fileSizes.map((size) => (
            <FileStudy key={size} title={`${variant} · ${size.toUpperCase()}`}>
              <CompactField {...ctx.subject} size={size} variant={variant} label="Reference file" />
              <CompactField
                {...ctx.subject}
                size={size}
                variant={variant}
                label="Selected reference"
                sample="research-notes.pdf"
              />
            </FileStudy>
          ))}
        </div>
      ))}
    </div>
  );
}

export function FileInteraction({ ctx }: PreviewProps): ReactElement {
  const normal = useRef<HTMLInputElement>(null);
  const inline = useRef<HTMLInputElement>(null);
  useStoryAction(ctx, (action) => {
    const sample = fileFixture('research-notes.pdf', 'application/pdf');
    const event = action === 'drag' ? 'dragenter' : 'dragleave';
    fileGesture(normal.current, [sample], event);
    fileGesture(inline.current, [sample], event);
  });
  return (
    <div className="file-demo-grid">
      <FileStudy title="Hover, hold, or Tab to compare roles">
        <CompactField {...ctx.subject} label="Reference file" sample="research-notes.pdf" />
        <CompactField
          {...ctx.subject}
          variant="ghost"
          label="Inline reference"
          sample="research-notes.pdf"
        />
      </FileStudy>
      <FileStudy title="Drag across the two roles">
        <CompactField
          {...ctx.subject}
          ref={normal}
          label="Reference file"
          sample="research-notes.pdf"
        />
        <CompactField
          {...ctx.subject}
          ref={inline}
          variant="ghost"
          label="Inline reference"
          sample="research-notes.pdf"
        />
      </FileStudy>
      <FileStudy title="Replace or remove a selection">
        <CompactField
          {...ctx.subject}
          variant="ghost"
          label="Inline reference"
          sample="clear-this-file.pdf"
        />
      </FileStudy>
    </div>
  );
}

export function FileFeedback({ ctx }: PreviewProps): ReactElement {
  const cases: readonly { status: FieldStatus; message: string; loading?: boolean }[] = [
    { status: 'neutral', message: 'Selected locally. Ready for submission.' },
    { status: 'info', message: 'This file will be included with your submission.' },
    { status: 'success', message: 'File format verified.' },
    { status: 'warning', message: 'This version is older than the attached reference.' },
    { status: 'danger', message: 'Choose a PDF smaller than 10 MB.' },
    { status: 'neutral', message: '', loading: true },
  ];
  return (
    <div className="file-demo-grid">
      {cases.map(({ status, message, loading }) => (
        <FileStudy title={loading ? 'Checking' : status} key={loading ? 'checking' : status}>
          <CompactField
            {...ctx.subject}
            label="Reference file"
            sample="research-notes.pdf"
            status={status}
            message={message}
            loading={loading}
          />
          <CompactField
            {...ctx.subject}
            variant="ghost"
            size="s"
            label="Inline reference"
            sample="reference.pdf"
            status={status}
            message={status === 'neutral' ? undefined : message}
            loading={loading}
          />
        </FileStudy>
      ))}
    </div>
  );
}

export function FileAvailability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-grid">
      <CompactField
        {...ctx.subject}
        label="Reference file"
        sample="research-notes.pdf"
        readOnly
        description="Attachments are locked after submission."
      />
      <CompactField {...ctx.subject} label="Reference file" readOnly />
      <CompactField
        {...ctx.subject}
        label="Reference file"
        sample="research-notes.pdf"
        disabled
        description="Select a workspace to enable attachments."
      />
      <CompactField {...ctx.subject} label="Reference file" disabled />
      <CompactField
        {...ctx.subject}
        label="Verified reference"
        sample="research-notes.pdf"
        readOnly
        loading
        status="success"
        message="Verified. You can read and copy the filename."
      />
      <CompactField
        {...ctx.subject}
        label="Unavailable reference"
        sample="research-notes.pdf"
        disabled
        status="danger"
        description="Changes are unavailable while this workspace is archived."
      />
    </div>
  );
}

export function FileOverflow({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="file-demo-stack file-demo-arabic">
      <CompactField
        {...ctx.subject}
        label="Supporting research, including the original source and the final approved revision"
        sample="customer-research_findings_and_recommendations_for_the_next_release_v12_final.pdf"
        bytes={12_400_000}
        showSize
        description="When space is tight, the filename and removal action move below the picker."
      />
      <CompactField
        {...ctx.subject}
        variant="ghost"
        size="s"
        label="Inline attachment"
        sample="release-notes-without-any-breaks-abcdefghijklmnopqrstuvwxyz0123456789.md"
      />
      <div dir="rtl">
        <CompactField
          {...ctx.subject}
          label="ملف مرجعي"
          sample="تقرير-البحث-2026.pdf"
          bytes={214_000}
          showSize
        />
      </div>
      <FileStudy title="Externally named picker">
        <FileInput {...ctx.subject} aria-label="Optional supporting reference" />
      </FileStudy>
    </div>
  );
}

export function FileLive({ ctx }: PreviewProps): ReactElement {
  const input = useRef<HTMLInputElement>(null);
  useStoryAction(ctx, (action) => {
    const file =
      action === 'sample' ? fileFixture('research-notes.md') : fileFixture('application.exe');
    fileGesture(input.current, [file]);
  });
  return (
    <div className="file-demo-field file-demo-arabic">
      <FormField label="Supporting reference" description="Files stay in this browser." required>
        <FileInput {...ctx.subject} ref={input} accept=".pdf,.md" maxSize={2_000_000} showSize />
      </FormField>
    </div>
  );
}

export function MultipleField({ ctx }: PreviewProps): ReactElement {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<readonly File[]>([]);
  return (
    <div className="file-demo-stack file-demo-arabic">
      <FormField
        label="Supporting files"
        description="Add another selection at any time. Remove files individually below."
      >
        <FileInput
          {...ctx.subject}
          ref={input}
          multiple
          showSize
          value={files}
          onValueChange={setFiles}
        />
      </FormField>
      <FileList aria-label="Supporting files" emptyFocusRef={input}>
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
    </div>
  );
}

export function FileSurfaces({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface} sizing="border-box">
      <CompactField
        {...ctx.subject}
        label="Supporting reference"
        sample="research-notes.pdf"
        bytes={214_000}
        showSize
      />
      <CompactField
        {...ctx.subject}
        variant="ghost"
        size="s"
        label="Inline reference"
        sample="project-brief.md"
      />
    </ExampleSurface>
  );
}
