import { useId, useState } from 'react';
import type { ComponentPropsWithRef, HTMLAttributes, ReactElement, ReactNode } from 'react';
import {
  ArrowClockwiseIcon,
  CheckCircleIcon,
  FileIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react';
import { FormField } from '../input/input.proto.js';
import './file-input.css';

export interface FileInputProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'value' | 'defaultValue'
> {
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly fileName?: string | undefined;
  readonly initialFileName?: string | undefined;
  readonly placeholder?: string | undefined;
  readonly onFilesChange?: ((files: readonly File[]) => void) | undefined;
}

// The file stays in the browser. Selecting it changes only the visual preview.
export function FileInput({
  label,
  description,
  fileName,
  initialFileName = '',
  placeholder = 'Choose a file…',
  onFilesChange,
  onChange,
  id,
  className = '',
  style,
  disabled,
  readOnly,
  hidden,
  ...props
}: FileInputProps): ReactElement {
  const [localName, setLocalName] = useState(initialFileName);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  return (
    <FormField label={label} description={description} htmlFor={inputId} hidden={hidden}>
      <span className={`file-input-proto ${className}`} style={style}>
        <FileIcon size="1em" aria-hidden="true" />
        <span className="file-input-name-proto">{fileName ?? (localName || placeholder)}</span>
        <span className="file-input-browse-proto">Browse</span>
        <input
          {...props}
          id={inputId}
          type="file"
          className="file-input-native-proto"
          disabled={disabled || readOnly}
          aria-label={label ? undefined : 'Choose a file'}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            setLocalName(files.map((file) => file.name).join(', '));
            onFilesChange?.(files);
            onChange?.(event);
          }}
        />
      </span>
    </FormField>
  );
}

export interface DropzoneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onChange'> {
  readonly title?: string | undefined;
  readonly description?: ReactNode;
  readonly disabled?: boolean | undefined;
  readonly accept?: string | undefined;
  readonly multiple?: boolean | undefined;
  readonly onFilesChange?: ((files: readonly File[]) => void) | undefined;
}

export function Dropzone({
  title = 'Drop Markdown or ZIP archives here',
  description = 'UTF-8 .md, .mdx, or .zip up to 50 MB per archive',
  disabled,
  accept = '.md,.mdx,.zip',
  multiple = true,
  onFilesChange,
  className = '',
  children,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: DropzoneProps): ReactElement {
  const [dragging, setDragging] = useState(false);
  const inputId = useId();
  return (
    <div
      {...props}
      className={`dropzone-proto ${className}`}
      data-dragging={dragging || undefined}
      data-disabled={disabled || undefined}
      onDragOver={(event) => {
        onDragOver?.(event);
        if (!disabled) {
          event.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(event) => {
        onDragLeave?.(event);
        setDragging(false);
      }}
      onDrop={(event) => {
        onDrop?.(event);
        event.preventDefault();
        setDragging(false);
        if (!disabled) {
          onFilesChange?.(Array.from(event.dataTransfer.files));
        }
      }}
    >
      <label className="dropzone-surface-proto" htmlFor={inputId}>
        <UploadSimpleIcon size="1.5em" aria-hidden="true" />
        <strong>{dragging ? 'Release to add these files' : title}</strong>
        <span className="dropzone-description-proto">{description}</span>
        <span className="dropzone-browse-proto">Browse files</span>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="file-input-native-proto"
          onChange={(event) => onFilesChange?.(Array.from(event.currentTarget.files ?? []))}
        />
      </label>
      {children}
    </div>
  );
}

export type FileListProps = HTMLAttributes<HTMLUListElement>;

export function FileList({ className = '', ...props }: FileListProps): ReactElement {
  return <ul {...props} className={`file-list-proto ${className}`} />;
}

export type FileItemStatus = 'neutral' | 'uploading' | 'processing' | 'success' | 'danger';

export interface FileItemProps extends HTMLAttributes<HTMLLIElement> {
  readonly name: string;
  readonly detail?: ReactNode;
  readonly status?: FileItemStatus | undefined;
  readonly progress?: number | undefined;
  readonly onRemove?: (() => void) | undefined;
  readonly onRetry?: (() => void) | undefined;
  readonly disabled?: boolean | undefined;
}

export function FileItem({
  name,
  detail,
  status = 'neutral',
  progress,
  onRemove,
  onRetry,
  disabled,
  className = '',
  children,
  ...props
}: FileItemProps): ReactElement {
  return (
    <li {...props} className={`file-item-proto ${className}`} data-status={status}>
      <span className="file-item-icon-proto" aria-hidden="true">
        {status === 'success' ? (
          <CheckCircleIcon size="1.2em" />
        ) : status === 'danger' ? (
          <WarningCircleIcon size="1.2em" />
        ) : (
          <FileIcon size="1.2em" />
        )}
      </span>
      <span className="file-item-body-proto">
        <span className="file-item-name-proto">{name}</span>
        {detail && <span className="file-item-detail-proto">{detail}</span>}
        {progress !== undefined && (
          <progress
            className="file-item-progress-proto"
            value={progress}
            max={100}
            aria-label={`Import progress for ${name}`}
          />
        )}
        {children}
      </span>
      {(onRetry || onRemove) && (
        <span className="file-item-actions-proto">
          {onRetry && (
            <button
              type="button"
              className="field-icon-button-proto"
              disabled={disabled}
              aria-label={`Retry ${name}`}
              onClick={onRetry}
            >
              <ArrowClockwiseIcon size="1em" />
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              className="field-icon-button-proto"
              disabled={disabled}
              aria-label={`Remove ${name}`}
              onClick={onRemove}
            >
              <XIcon size="1em" />
            </button>
          )}
        </span>
      )}
    </li>
  );
}
