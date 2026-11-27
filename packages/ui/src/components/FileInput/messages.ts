import { createElement, Fragment } from 'react';
import type { FileIntakeMessages, FileListItemState, FileListMessages } from './types.js';

function isolated(name: string): string {
  return `\u2068${name}\u2069`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1000) {
    return `${bytes} B`;
  }
  const divisor = bytes < 1_000_000 ? 1000 : 1_000_000;
  const unit = divisor === 1000 ? 'KB' : 'MB';
  return `${(bytes / divisor).toFixed(1)} ${unit}`;
}

function fileCount(count: number): string {
  return `${count} ${count === 1 ? 'file' : 'files'}`;
}

export const intakeCopy: FileIntakeMessages = {
  chooseFile: 'Choose file',
  addFiles: 'Add files',
  browse: 'browse',
  dropFile: 'Drop a file',
  dropFiles: 'Drop files',
  releaseToAdd: 'Release to add',
  checking: 'Checking…',
  readOnly: 'Read only',
  disabled: 'File selection unavailable',
  required: 'Required',
  invitation: (multiple, browse) =>
    createElement(Fragment, null, multiple ? 'Drop files or ' : 'Drop a file or ', browse),
  selection: (files, showSize) => {
    if (files.length === 0) {
      return 'No file selected';
    }
    const size = showSize
      ? `, ${formatFileSize(files.reduce((sum, item) => sum + item.size, 0))}`
      : '';
    return `${fileCount(files.length)} selected${size}`;
  },
  limits: (accept, size, count) =>
    [
      accept && `Accepted: ${accept.split(',').join(', ')}`,
      size !== undefined && `Up to ${formatFileSize(size)} each`,
      count !== undefined && `${fileCount(count)} max`,
    ]
      .filter(Boolean)
      .join(' · '),
  attempt: ({ accepted, rejected }, { accept, maxSize, maxFiles }, committedCount) => {
    const messages: string[] = [];
    if (committedCount > 0) {
      messages.push(`Added ${fileCount(committedCount)}.`);
    } else {
      messages.push('Your selection is unchanged.');
    }
    if (rejected[0]?.code === 'too-many') {
      if (maxFiles === 0) {
        messages.push('This field accepts no files.');
      } else if (maxFiles === 1) {
        messages.push('Choose one file at a time.');
      } else if (maxFiles !== undefined) {
        messages.push(`Keep up to ${fileCount(maxFiles)} total.`);
      }
    } else {
      for (const item of rejected) {
        const name = item.name ? isolated(item.name) : 'This item';
        switch (item.code) {
          case 'directory':
            messages.push(`${name} is a folder. Choose individual files.`);
            break;
          case 'type':
            messages.push(
              `${name} has an unsupported format. Choose ${accept.split(',').join(', ')}.`,
            );
            break;
          case 'too-large':
            messages.push(
              `${name} exceeds ${formatFileSize(maxSize ?? 0)}. Choose a smaller file.`,
            );
            break;
          case 'duplicate':
            messages.push(`${name} is already selected. Choose a different file.`);
            break;
          case 'unreadable':
            messages.push(`${name} could not be read. Choose the file again.`);
            break;
        }
      }
    }
    if (committedCount > 0 && committedCount < accepted.length) {
      messages.push('The remaining files were left out of the selection.');
    }
    return messages.join(' ');
  },
  remove: (name) => `Remove ${isolated(name)}`,
};

export function measuredProgress(state: FileListItemState | undefined): number | null {
  const value = state && 'progress' in state ? state.progress : null;
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : null;
}

export const listCopy: FileListMessages = {
  formatSize: formatFileSize,
  phase: (state) => {
    if ('label' in state && state.label !== undefined) {
      return state.label;
    }
    switch (state.phase) {
      case 'selected':
        return 'Selected locally';
      case 'queued':
        return 'Waiting to upload';
      case 'uploading': {
        const measurement = measuredProgress(state);
        if (measurement === 100) {
          return 'Transfer complete · Awaiting verification';
        }
        return measurement === null ? 'Connecting…' : 'Uploading…';
      }
      case 'verifying':
        return 'Checking file…';
      case 'success':
        return 'Uploaded';
      case 'paused':
      case 'failed':
        return state.reason;
    }
  },
  removing: 'Removing…',
  remove: (name) => `Remove ${isolated(name)}`,
  retry: (name) => `Retry ${isolated(name)}`,
  retryAction: 'Retry',
  progress: (name, phase) =>
    `${phase === 'verifying' ? 'Verification' : 'Transfer'} progress for ${isolated(name)}`,
  removed: (names) => `${names.map(isolated).join(', ')} removed.`,
};

export function resolveMessages<T extends object>(defaults: T, custom: Partial<T> | undefined): T {
  const result = { ...defaults };
  if (custom) {
    for (const key of Object.keys(defaults) as (keyof T)[]) {
      const value = custom[key];
      if (value !== undefined) {
        result[key] = value;
      }
    }
  }
  return result;
}
