import type {
  ClipboardEventHandler,
  DragEventHandler,
  FocusEventHandler,
  HTMLAttributes,
  ReactEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  ReactNode,
  Ref,
  RefObject,
} from 'react';
import type { ControlSize, FieldStatus, FieldVariant } from '../../core/forms/fieldAxes.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';

export type FileIntakeSource = 'picker' | 'drop' | 'paste';

export interface FileRejection {
  readonly code: 'too-many' | 'directory' | 'type' | 'too-large' | 'duplicate' | 'unreadable';
  readonly name: string | null;
  readonly file: File | null;
}

export interface FileIntakeResult {
  readonly source: FileIntakeSource;
  readonly accepted: readonly File[];
  readonly rejected: readonly FileRejection[];
}

export interface FileIntakeMessages {
  readonly chooseFile: string;
  readonly addFiles: string;
  readonly browse: string;
  readonly dropFile: string;
  readonly dropFiles: string;
  readonly releaseToAdd: string;
  readonly checking: string;
  readonly readOnly: string;
  readonly disabled: string;
  readonly required: string;
  readonly invitation: (multiple: boolean, browse: ReactNode) => ReactNode;
  readonly selection: (files: readonly File[], showSize: boolean) => string;
  readonly limits: (
    accept: string,
    maxSize: number | undefined,
    maxFiles: number | undefined,
  ) => string;
  readonly attempt: (
    result: FileIntakeResult,
    limits: { readonly accept: string; readonly maxSize?: number; readonly maxFiles?: number },
    committedCount: number,
  ) => string;
  readonly remove: (name: string) => string;
}

type IntakeRootProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'className' | 'style' | 'dir' | 'lang' | 'title' | 'hidden' | 'inert'
>;

interface IntakeProps<Target extends HTMLElement> extends IntakeRootProps {
  readonly [data: `data-${string}`]: DataAttributeValue;
  readonly id?: string | undefined;
  readonly name?: string | undefined;
  readonly form?: string | undefined;
  readonly capture?: boolean | 'user' | 'environment' | undefined;
  readonly accept?: string | undefined;
  readonly maxSize?: number | undefined;
  readonly maxFiles?: number | undefined;
  readonly multiple?: boolean | undefined;
  readonly allowPaste?: boolean | undefined;
  readonly value?: readonly File[] | undefined;
  readonly onValueChange?: ((files: readonly File[]) => void) | undefined;
  readonly onIntake?: ((result: FileIntakeResult) => void) | undefined;
  readonly size?: ControlSize | undefined;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly loading?: boolean | undefined;
  readonly required?: boolean | undefined;
  readonly announceIntake?: boolean | undefined;
  readonly messages?: Partial<FileIntakeMessages> | undefined;
  readonly ref?: Ref<HTMLInputElement> | undefined;
  readonly 'aria-label'?: string | undefined;
  readonly 'aria-labelledby'?: string | undefined;
  readonly 'aria-describedby'?: string | undefined;
  readonly tabIndex?: number | undefined;
  readonly autoFocus?: boolean | undefined;
  readonly onFocus?: FocusEventHandler<Target> | undefined;
  readonly onBlur?: FocusEventHandler<Target> | undefined;
  readonly onKeyDown?: KeyboardEventHandler<Target> | undefined;
  readonly onKeyUp?: KeyboardEventHandler<Target> | undefined;
  readonly onClick?: MouseEventHandler<Target> | undefined;
  readonly onPaste?: ClipboardEventHandler<Target> | undefined;
  readonly onDragEnter?: DragEventHandler<HTMLDivElement> | undefined;
  readonly onDragOver?: DragEventHandler<HTMLDivElement> | undefined;
  readonly onDragLeave?: DragEventHandler<HTMLDivElement> | undefined;
  readonly onDrop?: DragEventHandler<HTMLDivElement> | undefined;
  readonly onInvalid?: ReactEventHandler<HTMLInputElement> | undefined;
}

export interface FileInputProps extends IntakeProps<HTMLElement> {
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly clearable?: boolean | undefined;
  readonly showSize?: boolean | undefined;
}

export interface DropzoneProps extends IntakeProps<HTMLInputElement> {
  readonly status?: 'neutral' | 'danger' | undefined;
  readonly description?: ReactNode | undefined;
}

export type FileListItemState =
  | { readonly phase: 'selected' | 'queued' | 'success'; readonly label?: string | undefined }
  | {
      readonly phase: 'uploading' | 'verifying';
      readonly label?: string | undefined;
      readonly progress?: number | null | undefined;
    }
  | {
      readonly phase: 'paused' | 'failed';
      readonly reason: string;
      readonly progress?: number | null | undefined;
    };

export interface FileListMessages {
  readonly formatSize: (bytes: number) => string;
  readonly phase: (state: FileListItemState, name: string) => string;
  readonly removing: string;
  readonly remove: (name: string) => string;
  readonly retry: (name: string) => string;
  readonly retryAction: string;
  readonly progress: (
    name: string,
    phase: 'uploading' | 'verifying' | 'paused' | 'failed',
  ) => string;
  readonly removed: (names: readonly string[]) => string;
}

export interface FileListProps extends HTMLAttributes<HTMLUListElement> {
  readonly ref?: Ref<HTMLUListElement> | undefined;
  readonly size?: ControlSize | undefined;
  readonly emptyFocusRef?: RefObject<HTMLElement | null> | undefined;
  readonly messages?: Partial<FileListMessages> | undefined;
}

export interface FileListItemProps extends Omit<HTMLAttributes<HTMLLIElement>, 'children'> {
  readonly ref?: Ref<HTMLLIElement> | undefined;
  readonly name: string;
  readonly size?: ControlSize | undefined;
  readonly fileSize?: number | undefined;
  readonly state?: FileListItemState | undefined;
  readonly thumbnail?: File | string | undefined;
  readonly href?: string | undefined;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly removing?: boolean | undefined;
  readonly removeError?: string | undefined;
  readonly onRemove?: (() => void) | undefined;
  readonly onRetry?: (() => void) | undefined;
  readonly messages?: Partial<FileListMessages> | undefined;
}
