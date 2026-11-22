import { CloseGlyph, FileGlyph, fieldStatusGlyphs } from '../control-glyphs.js';
import { useId, useRef, useState } from 'react';
import type {
  ComponentPropsWithRef,
  DragEvent,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from 'react';
import { Icon, Progress, Spinner } from '@docouno/unica';
import { Button, IconButton } from '@docouno/unica';
import { FormField } from '../form-field/form-field.proto.js';
import { useControlFocus } from '../control-focus.js';
import type { ControlSize, FieldStatus, FieldVariant } from '@docouno/unica';
import { formatFileSize } from './file-input.utils.js';
import './file-input.css';

export type FilePreviewState = 'rest' | 'hover' | 'active' | 'focus' | 'dragging';
function isFileDrag(event: DragEvent): boolean {
  return Array.from(event.dataTransfer.types).includes('Files');
}

export interface FileInputProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'size' | 'value' | 'defaultValue'
> {
  readonly 'data-wb-subject'?: string | undefined;
  readonly size?: ControlSize;
  readonly variant?: FieldVariant;
  readonly status?: FieldStatus;
  readonly label?: ReactNode;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly fileName?: string | undefined;
  readonly initialFileName?: string;
  readonly fileDetail?: ReactNode;
  readonly browseLabel?: string;
  readonly placeholder?: string;
  readonly loading?: boolean | undefined;
  readonly clearable?: boolean;
  readonly onClear?: () => void;
  readonly onFilesChange?: ((files: readonly File[]) => void) | undefined;
  /** Pinned visual comparison, not actual focus or drag. */
  readonly previewState?: 'dragging';
}

// Local selection only. Native form projection and reusable state authority belong to the library.
export function FileInput({
  size = 'm',
  variant = 'default',
  status = 'neutral',
  label,
  description,
  message,
  fileName,
  initialFileName = '',
  fileDetail,
  browseLabel,
  placeholder = 'No file selected',
  loading = false,
  clearable = true,
  onClear,
  onFilesChange,
  onChange,
  id,
  className = '',
  style,
  disabled,
  readOnly,
  hidden,
  required,
  multiple,
  previewState,
  'data-wb-subject': subject,
  ...props
}: FileInputProps): ReactElement {
  const [localName, setLocalName] = useState(initialFileName);
  const [localDetail, setLocalDetail] = useState('');
  const [dragging, setDragging] = useState(false);
  const generatedId = useId();
  const focusScope = useControlFocus();
  const trigger = useRef<HTMLButtonElement>(null);
  const inputId = id ?? generatedId;
  const triggerId = readOnly ? inputId : `${inputId}-picker`;
  const currentName = fileName ?? localName;
  const effectiveStatus = disabled ? 'neutral' : status;
  const isRequired = required && !readOnly && !disabled;
  const busy = loading && !disabled && !readOnly;
  const blocked = disabled || readOnly || busy;
  const detail = fileDetail ?? localDetail;
  const activeDrop = !blocked && (dragging || previewState === 'dragging');
  const chooseLabel = browseLabel ?? (multiple ? 'Add files' : 'Choose file');
  const labelId = `${inputId}-label`;
  const actionId = `${inputId}-action`;
  const selectionId = `${inputId}-selection`;
  const fieldName =
    props['aria-labelledby'] ?? (label && !props['aria-label'] ? labelId : undefined);
  const describedBy =
    [
      props['aria-describedby'],
      isRequired && `${inputId}-required`,
      (currentName || readOnly) && selectionId,
      busy && `${inputId}-checking`,
      readOnly && `${inputId}-readonly`,
      description && `${triggerId}-description`,
      message && `${triggerId}-message`,
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  function receive(files: readonly File[]): void {
    if (blocked || !files.length) {
      return;
    }
    setLocalName(multiple ? `${files.length} files selected` : files[0]!.name);
    setLocalDetail(formatFileSize(files.reduce((sum, file) => sum + file.size, 0)));
    onFilesChange?.(files);
  }
  return (
    <FormField
      label={label && <span id={labelId}>{label}</span>}
      description={description}
      message={message ?? ''}
      status={effectiveStatus}
      required={isRequired}
      htmlFor={triggerId}
      descriptionId={description ? `${triggerId}-description` : undefined}
      messageId={message ? `${triggerId}-message` : undefined}
      hidden={hidden}
    >
      <span
        ref={focusScope}
        data-preview-focus-scope=""
        data-native-context-region=""
        data-wb-subject={subject}
        className={`file-input-proto ${className}`}
        style={style}
        data-size={size}
        data-readonly={readOnly || undefined}
        data-disabled={disabled || undefined}
        data-dragging={activeDrop || undefined}
        tabIndex={readOnly && !disabled ? 0 : undefined}
        role={readOnly ? 'group' : undefined}
        aria-labelledby={readOnly ? fieldName : undefined}
        aria-label={readOnly && !fieldName ? (props['aria-label'] ?? 'File attachment') : undefined}
        aria-describedby={readOnly ? describedBy : undefined}
        onDragOver={(event) => {
          if (isFileDrag(event)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = blocked ? 'none' : 'copy';
            if (!blocked) {
              setDragging(true);
            }
          }
        }}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          if (isFileDrag(event)) {
            event.preventDefault();
            setDragging(false);
            receive(Array.from(event.dataTransfer.files));
          }
        }}
      >
        {!readOnly && (
          <Button
            ref={trigger}
            id={triggerId}
            className="file-input-picker-proto"
            size={size}
            variant={variant === 'ghost' ? 'ghost' : 'secondary'}
            tone="neutral"
            disabled={disabled}
            loading={busy}
            aria-labelledby={fieldName ? `${actionId} ${fieldName}` : undefined}
            aria-label={
              fieldName ? undefined : [chooseLabel, props['aria-label']].filter(Boolean).join(' · ')
            }
            aria-describedby={describedBy}
            aria-invalid={effectiveStatus === 'danger' || undefined}
            onClick={() => focusScope.current?.querySelector('input')?.click()}
          >
            <span className="file-input-prompt-proto">
              <span id={actionId} className="file-input-action-proto">
                {chooseLabel}
              </span>
              {activeDrop && (
                <span aria-hidden="true">{multiple ? 'Drop files' : 'Drop file'}</span>
              )}
            </span>
          </Button>
        )}
        {(currentName || readOnly) && (
          <span className="file-input-selection-proto">
            <span id={selectionId} className="file-input-copy-proto">
              <bdi className="file-input-name-proto">{currentName || placeholder}</bdi>
              {currentName && detail && (
                <span className="file-input-detail-proto" dir="auto">
                  {detail}
                </span>
              )}
            </span>
            {!multiple && clearable && !readOnly && !disabled && (
              <IconButton
                className="file-input-clear-proto"
                icon={CloseGlyph}
                size="s"
                variant="ghost"
                aria-label={`Remove ${currentName}`}
                disabled={busy}
                onClick={() => {
                  setLocalName('');
                  setLocalDetail('');
                  onClear?.();
                  onFilesChange?.([]);
                  const native = focusScope.current?.querySelector('input');
                  if (native) {
                    native.value = '';
                  }
                  trigger.current?.focus();
                }}
              />
            )}
          </span>
        )}
        {busy && (
          <span id={`${inputId}-checking`} className="file-input-note-proto">
            Checking…
          </span>
        )}
        {readOnly && (
          <span id={`${inputId}-readonly`} className="file-input-note-proto">
            Read only
          </span>
        )}
        {isRequired && (
          <span id={`${inputId}-required`} hidden>
            Required
          </span>
        )}
        <input
          {...props}
          id={inputId}
          type="file"
          multiple={multiple}
          hidden
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled || readOnly}
          required={isRequired}
          onClick={(event) => {
            if (blocked) {
              event.preventDefault();
            }
            props.onClick?.(event);
          }}
          onChange={(event) => {
            receive(Array.from(event.currentTarget.files ?? []));
            onChange?.(event);
          }}
        />
      </span>
    </FormField>
  );
}

export interface DropzoneProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'onChange'> {
  readonly size?: ControlSize;
  readonly title?: string;
  readonly description?: ReactNode;
  readonly message?: ReactNode;
  readonly status?: 'neutral' | 'danger';
  readonly disabled?: boolean;
  readonly readOnly?: boolean;
  readonly accept?: string;
  readonly multiple?: boolean;
  readonly onFilesChange?: ((files: readonly File[]) => void) | undefined;
  readonly browseLabel?: string;
  readonly previewState?: FilePreviewState;
}

export function Dropzone({
  size = 'm',
  title,
  description = 'Markdown or ZIP · 50 MB max per file',
  message,
  status = 'neutral',
  disabled,
  readOnly,
  accept = '.md,.mdx,.zip',
  multiple = true,
  onFilesChange,
  browseLabel,
  className = '',
  children,
  previewState,
  onDragOver,
  onDragLeave,
  onDrop,
  ...props
}: DropzoneProps): ReactElement {
  const [dragging, setDragging] = useState(false);
  const inputId = useId();
  const active = !disabled && !readOnly && (dragging || previewState === 'dragging');
  const unavailable = disabled || readOnly;
  const pickerLabel = browseLabel ?? (multiple ? 'Browse files' : 'Browse for a file');
  const unavailableLabel =
    title ?? (disabled ? 'Attachments unavailable' : 'Attachments are locked');
  return (
    <div
      {...props}
      className={`dropzone-proto ${className}`}
      data-size={size}
      data-status={disabled ? 'neutral' : status}
      data-dragging={active || undefined}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-preview={previewState}
    >
      <div
        className="dropzone-surface-proto"
        onDragOver={(event) => {
          onDragOver?.(event);
          if (isFileDrag(event)) {
            event.preventDefault();
            event.dataTransfer.dropEffect = disabled || readOnly ? 'none' : 'copy';
            if (!disabled && !readOnly) {
              setDragging(true);
            }
          }
        }}
        onDragLeave={(event) => {
          onDragLeave?.(event);
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setDragging(false);
          }
        }}
        onDrop={(event) => {
          onDrop?.(event);
          if (isFileDrag(event)) {
            event.preventDefault();
            setDragging(false);
            if (!disabled && !readOnly) {
              onFilesChange?.(Array.from(event.dataTransfer.files));
            }
          }
        }}
      >
        <div className="dropzone-copy-proto">
          {unavailable ? (
            <span className="dropzone-unavailable-proto">{unavailableLabel}</span>
          ) : (
            <div className="dropzone-prompt-proto">
              <span className="dropzone-invitation-proto" aria-hidden="true">
                {multiple ? 'Drop files' : 'Drop a file'} or{' '}
                <span className="dropzone-browse-proto">{browseLabel ?? 'browse'}</span>
              </span>
              {active && <span className="dropzone-release-proto">Release to add</span>}
            </div>
          )}
          {description && (
            <div id={`${inputId}-description`} className="dropzone-description-proto">
              {description}
            </div>
          )}
        </div>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          aria-disabled={readOnly || undefined}
          aria-label={unavailable ? unavailableLabel : pickerLabel}
          aria-describedby={
            [description && `${inputId}-description`, message && `${inputId}-message`]
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-invalid={(status === 'danger' && !disabled) || undefined}
          className="dropzone-native-proto"
          onClick={(event) => {
            if (readOnly) {
              event.preventDefault();
            }
          }}
          onKeyDown={(event) => {
            if (readOnly && (event.key === 'Enter' || event.key === ' ')) {
              event.preventDefault();
            }
          }}
          onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            if (!readOnly && files.length) {
              onFilesChange?.(files);
            }
            event.currentTarget.value = '';
          }}
        />
      </div>
      {message && (
        <div id={`${inputId}-message`} className="dropzone-message-proto">
          <Icon
            className="dropzone-message-glyph"
            usage="slot"
            icon={
              status === 'danger' && !disabled ? fieldStatusGlyphs.danger : fieldStatusGlyphs.info
            }
          />
          <span>{message}</span>
        </div>
      )}
      {children}
    </div>
  );
}

export type FileListProps = HTMLAttributes<HTMLUListElement>;
export function FileList({ className = '', ...props }: FileListProps): ReactElement {
  return <ul {...props} className={`file-list-proto ${className}`} />;
}

export type FileItemStatus =
  'neutral' | 'uploading' | 'processing' | 'success' | 'danger' | 'removing' | 'paused';
export interface FileItemProps extends HTMLAttributes<HTMLLIElement> {
  readonly name: string;
  readonly detail?: ReactNode;
  readonly fileSize?: string;
  readonly size?: ControlSize;
  readonly status?: FileItemStatus | undefined;
  readonly progress?: number | null | undefined;
  readonly thumbnail?: string;
  readonly href?: string;
  readonly onRemove?: (() => void) | undefined;
  readonly onRetry?: (() => void) | undefined;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean;
}
const phaseLabels: Record<FileItemStatus, string> = {
  neutral: '',
  uploading: 'Uploading…',
  processing: 'Checking file…',
  success: 'Uploaded',
  danger: 'Upload failed. Try again.',
  removing: 'Removing…',
  paused: 'Upload paused',
};
export function FileItem({
  name,
  detail,
  fileSize,
  size = 'm',
  status = 'neutral',
  progress,
  thumbnail,
  href,
  onRemove,
  onRetry,
  disabled,
  readOnly,
  className = '',
  children,
  ...props
}: FileItemProps): ReactElement {
  const effectiveStatus = disabled ? 'neutral' : status;
  const removing = effectiveStatus === 'removing';
  const waiting =
    effectiveStatus === 'processing' ||
    removing ||
    (effectiveStatus === 'uploading' && (progress === null || progress === undefined));
  const measured = progress !== null && progress !== undefined;
  const caption =
    detail ??
    (readOnly && effectiveStatus === 'neutral' ? 'Read only' : phaseLabels[effectiveStatus]);
  const showTrack =
    !disabled && progress !== undefined && !removing && effectiveStatus !== 'success';
  return (
    <li
      {...props}
      className={`file-item-proto ${className}`}
      data-status={effectiveStatus}
      data-size={size}
      data-disabled={disabled || undefined}
      data-readonly={readOnly || undefined}
      data-thumbnail={Boolean(thumbnail) || undefined}
    >
      <span className="file-item-icon-proto" aria-hidden="true">
        {thumbnail ? (
          <img src={thumbnail} alt="" />
        ) : (
          <Icon usage="slot" icon={FileGlyph} size={size} />
        )}
      </span>
      <div className="file-item-body-proto">
        {href && !disabled ? (
          <a className="file-item-name-proto file-item-link-proto" href={href} download>
            <bdi>{name}</bdi>
          </a>
        ) : (
          <span className="file-item-name-proto">
            <bdi>{name}</bdi>
          </span>
        )}
        {(fileSize || caption || (measured && showTrack)) && (
          <div className="file-item-meta-proto">
            {fileSize && (
              <span className="file-item-size-proto" dir="auto">
                {fileSize}
              </span>
            )}
            {caption && (
              <span className="file-item-detail-proto">
                {!disabled &&
                  (waiting && !showTrack ? (
                    <Spinner />
                  ) : effectiveStatus === 'success' ? (
                    <Icon usage="slot" icon={fieldStatusGlyphs.success} color="success" />
                  ) : null)}
                <span dir="auto">{caption}</span>
              </span>
            )}
            {measured && showTrack && (
              <span className="file-item-percentage-proto" dir="ltr" aria-hidden="true">
                {Math.floor(Math.min(100, Math.max(0, progress)))}%
              </span>
            )}
          </div>
        )}
        {showTrack && (
          <Progress
            size="s"
            showValue={false}
            className="file-item-progress-proto"
            value={progress ?? null}
            active={effectiveStatus === 'uploading' || effectiveStatus === 'processing'}
            paused={effectiveStatus === 'paused'}
            status={
              effectiveStatus === 'danger'
                ? 'danger'
                : effectiveStatus === 'paused' || disabled
                  ? 'neutral'
                  : 'accent'
            }
            aria-label={`Progress for ${name}`}
          />
        )}
        {children}
      </div>
      {(onRetry || onRemove) && !readOnly && (
        <span className="file-item-actions-proto">
          {onRetry && effectiveStatus === 'danger' && (
            <Button
              className="file-item-retry-proto"
              size={size}
              variant="ghost"
              tone="neutral"
              aria-label={`Retry ${name}`}
              onClick={(event) => {
                const row = event.currentTarget.closest('li');
                onRetry();
                requestAnimationFrame(() =>
                  row?.querySelector<HTMLButtonElement>('button[aria-label^="Remove"]')?.focus(),
                );
              }}
            >
              Retry
            </Button>
          )}
          {onRemove && (
            <IconButton
              className="file-item-remove-proto"
              icon={CloseGlyph}
              size={size}
              variant="ghost"
              aria-label={`Remove ${name}`}
              disabled={disabled || removing}
              onClick={onRemove}
            />
          )}
        </span>
      )}
    </li>
  );
}
