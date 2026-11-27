import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import {
  composedContains,
  documentHasFocusSafe,
  getDeepActiveElement,
  getDocumentBody,
  getRootNodeSafe,
  isConnectedNode,
  isElementNode,
  matchesSafe,
} from '../../core/dom.js';
import {
  isExplicitBlurInProgress,
  isLiveFocusElement,
  observeFocusTransfer,
  recoverAfterFocusTransfer,
} from '../../core/focus-transfer.js';
import type { FocusTransfer } from '../../core/focus-transfer.js';
import { mergeRefs } from '../../core/mergeRefs.js';
import { focusElement } from '../../core/overlay/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { VisuallyHidden } from '../Layout/index.js';
import { FileListContext } from './list-context.js';
import type { FileRow } from './list-context.js';
import { listCopy, resolveMessages } from './messages.js';
import type { FileListProps } from './types.js';
import './file-input.css';

type Snapshot = ReadonlyMap<Element, FileRow>;

interface FocusedRow {
  readonly row: Element;
  readonly target: Element;
  readonly root: Node;
  departure?: FocusTransfer;
}

function orderedRows(list: HTMLUListElement, entries: Snapshot): Snapshot {
  const ordered = new Map<Element, FileRow>();
  for (const child of list.children) {
    const row = entries.get(child);
    if (row) {
      ordered.set(child, row);
    }
  }
  return ordered;
}

function retainsFocus(rows: Snapshot, origin: FocusedRow): boolean {
  return (
    rows.has(origin.row) &&
    composedContains(origin.row, origin.target) &&
    isLiveFocusElement(origin.target)
  );
}

function moveToRemove(row: FileRow | undefined, doc: Document): boolean {
  return !!row?.remove && !row.removing && focusElement(row.remove, doc);
}

function changedPhase(previous: FileRow, next: FileRow): string | undefined {
  if (next.removing && !previous.removing) {
    return next.detail;
  }
  if (next.removeError && next.removeError !== previous.removeError) {
    return next.removeError;
  }
  if (!next.removing && (previous.removing || next.phase !== previous.phase)) {
    return next.detail;
  }
  // App-owned failure/pause reasons may change without a phase transition.
  if ((next.phase === 'failed' || next.phase === 'paused') && previous.detail !== next.detail) {
    return next.detail;
  }
  return undefined;
}

/** Lay out attachment rows with shared announcements and recovery for removed actions. */
export function FileList({
  ref,
  size = 'm',
  emptyFocusRef,
  messages: customMessages,
  className,
  children,
  role = 'list',
  tabIndex = -1,
  onFocus,
  ...props
}: FileListProps): ReactElement {
  const root = useRef<HTMLUListElement>(null);
  const listRef = useMemo(() => mergeRefs(root, ref), [ref]);
  const entries = useRef(new Map<Element, FileRow>());
  const previous = useRef<Snapshot | null>(null);
  const focused = useRef<FocusedRow | null>(null);
  const queued = useRef(false);
  const [announcement, setAnnouncement] = useState({ turn: 0, text: '' });
  const messages = useMemo(() => resolveMessages(listCopy, customMessages), [customMessages]);
  const options = useRef({ emptyFocusRef, messages });

  const flush = useCallback((): void => {
    queued.current = false;
    const list = root.current;
    if (!list || !isConnectedNode(list)) {
      return;
    }
    const next = orderedRows(list, entries.current);
    const old = previous.current;
    previous.current = next;
    if (!old) {
      return;
    }

    const removed: string[] = [];
    const spoken: string[] = [];
    for (const [node, before] of old) {
      const after = next.get(node);
      if (!after) {
        removed.push(before.name);
      } else {
        const detail = changedPhase(before, after);
        if (detail) {
          spoken.push(`\u2068${after.name}\u2069. ${detail}`);
        }
      }
    }
    if (removed.length) {
      spoken.push(options.current.messages.removed(removed));
    }
    if (spoken.length) {
      setAnnouncement((current) => ({ turn: current.turn + 1, text: spoken.join(' ') }));
    }

    const origin = focused.current;
    if (!origin || retainsFocus(next, origin)) {
      return;
    }
    focused.current = null;
    recoverAfterFocusTransfer(origin.departure, (unavailable) => {
      if (focused.current || root.current !== list || !isConnectedNode(list)) {
        return;
      }
      const doc = list.ownerDocument;
      const active = getDeepActiveElement(doc, origin.root) ?? getDeepActiveElement(doc);
      if (
        !documentHasFocusSafe(doc) ||
        (active &&
          active !== origin.target &&
          active !== unavailable &&
          active !== getDocumentBody(doc) &&
          isLiveFocusElement(active))
      ) {
        return;
      }
      const current = orderedRows(list, entries.current);
      const order = [...old.keys()];
      const index = order.indexOf(origin.row);
      const neighbors = [...order.slice(index + 1), ...order.slice(0, index).reverse()];
      if (
        moveToRemove(current.get(origin.row), doc) ||
        neighbors.some((row) => moveToRemove(current.get(row), doc))
      ) {
        return;
      }
      const target = options.current.emptyFocusRef?.current;
      if (!target || matchesSafe(target, '[aria-disabled="true"]') || !focusElement(target, doc)) {
        focusElement(list, doc);
      }
    });
  }, []);

  const schedule = useCallback((): void => {
    if (!queued.current) {
      queued.current = true;
      queueMicrotask(flush);
    }
  }, [flush]);

  const update = useCallback(
    (row: HTMLLIElement, snapshot: FileRow | null): void => {
      const origin = focused.current;
      if (origin?.row === row && isExplicitBlurInProgress(origin.departure)) {
        focused.current = null;
      }
      if (snapshot) {
        entries.current.set(row, snapshot);
      } else {
        entries.current.delete(row);
      }
      schedule();
    },
    [schedule],
  );

  useIsoLayoutEffect(() => {
    options.current = { emptyFocusRef, messages };
    schedule();
  });

  useIsoLayoutEffect(() => {
    const list = root.current;
    if (!list) {
      return;
    }
    return observeFocusTransfer(list, (target, transfer) => {
      const origin = focused.current;
      if (!origin || !composedContains(target, origin.target)) {
        return false;
      }
      origin.departure = transfer;
      queueMicrotask(() => {
        if (
          focused.current === origin &&
          retainsFocus(entries.current, origin) &&
          getDeepActiveElement(list.ownerDocument, origin.root) !== origin.target
        ) {
          focused.current = null;
        }
      });
      return true;
    });
  }, []);

  const scope = useMemo(() => ({ size, messages, update }), [size, messages, update]);
  return (
    <FileListContext value={scope}>
      <ul
        {...props}
        ref={listRef}
        className={cx('unica-file-list', className)}
        role={role}
        tabIndex={tabIndex}
        onFocus={(event) => {
          onFocus?.(event);
          const list = event.currentTarget;
          const target: EventTarget = event.target;
          if (getDeepActiveElement(list.ownerDocument, getRootNodeSafe(list)) !== target) {
            return;
          }
          if (isElementNode(target)) {
            for (const row of entries.current.keys()) {
              if (composedContains(row, target)) {
                focused.current = { row, target, root: getRootNodeSafe(target) };
                return;
              }
            }
          }
          focused.current = null;
        }}
      >
        {children}
      </ul>
      <VisuallyHidden role="status" aria-atomic="true">
        <span key={announcement.turn}>{announcement.text}</span>
      </VisuallyHidden>
    </FileListContext>
  );
}
