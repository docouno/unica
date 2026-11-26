import { createContext, use, useCallback, useMemo } from 'react';
import type { Context, Ref, RefCallback } from 'react';
import { mergeRefs } from '../../core/mergeRefs.js';

type LabelKind = 'title' | 'description';

interface AuthoredLabels {
  readonly labelledBy: string | undefined;
  readonly label: string | undefined;
  readonly describedBy: string | undefined;
}

export interface DialogLabels {
  readonly attach: (kind: LabelKind, node: HTMLElement, id: string) => () => void;
  readonly title: () => HTMLElement | undefined;
  readonly update: (dialog: HTMLDialogElement, authored: AuthoredLabels) => void;
}

export const DialogLabelContext: Context<DialogLabels | null> = createContext<DialogLabels | null>(
  null,
);

export function createDialogLabels(): DialogLabels {
  const titles = new Map<HTMLElement, string>();
  const descriptions = new Map<HTMLElement, string>();
  let dialog: HTMLDialogElement | undefined;
  let authored: AuthoredLabels | undefined;

  function sync(): void {
    if (!dialog || !authored) {
      return;
    }
    const labelledBy =
      authored.labelledBy ??
      (authored.label === undefined ? titles.values().next().value : undefined);
    const describedBy = authored.describedBy ?? descriptions.values().next().value;
    if (labelledBy === undefined) {
      dialog.removeAttribute('aria-labelledby');
    } else {
      dialog.setAttribute('aria-labelledby', labelledBy);
    }
    if (describedBy === undefined) {
      dialog.removeAttribute('aria-describedby');
    } else {
      dialog.setAttribute('aria-describedby', describedBy);
    }
  }

  return {
    attach(kind, node, id) {
      const entries = kind === 'title' ? titles : descriptions;
      entries.set(node, id);
      sync();
      return () => {
        entries.delete(node);
        sync();
      };
    },
    title: () => titles.keys().next().value,
    update(node, labels) {
      dialog = node;
      authored = labels;
      sync();
    },
  };
}

export function useDialogLabelRef<T extends HTMLElement>(
  kind: LabelKind,
  id: string,
  ref: Ref<T> | undefined,
): RefCallback<T> {
  const labels = use(DialogLabelContext);
  if (!labels) {
    throw new Error('A Modal or Drawer label must be used inside its Content.');
  }
  const attach = useCallback((node: T) => labels.attach(kind, node, id), [labels, kind, id]);
  return useMemo(() => mergeRefs(attach, ref), [attach, ref]);
}
