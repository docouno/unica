import { createContext } from 'react';
import type { Context } from 'react';
import type { ControlSize } from '../../core/forms/fieldAxes.js';
import type { FileListItemState, FileListMessages } from './types.js';

export interface FileRow {
  readonly name: string;
  readonly phase: FileListItemState['phase'] | undefined;
  readonly detail: string;
  readonly removing: boolean;
  readonly removeError: string | undefined;
  readonly remove: HTMLButtonElement | null;
}

interface FileListScope {
  readonly size: ControlSize;
  readonly messages: FileListMessages;
  readonly update: (row: HTMLLIElement, snapshot: FileRow | null) => void;
}

export const FileListContext: Context<FileListScope | null> = createContext<FileListScope | null>(
  null,
);
