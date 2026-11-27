import { useState } from 'react';
import { getDefaultView, getRootNodeSafe } from '../../core/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

interface TemporaryId {
  readonly value: string;
  readonly previous: string | null;
}

function restore(label: HTMLLabelElement, { value, previous }: TemporaryId): void {
  if (label.id === value) {
    if (previous === null) {
      label.removeAttribute('id');
    } else {
      label.setAttribute('id', previous);
    }
  }
}

/** Reference native labels so the browser can compute names from their markup. */
export function useNativeLabelIds(
  getTarget: () => HTMLInputElement | HTMLButtonElement | null,
  id: string | undefined,
  prefix: string,
): string | undefined {
  const [references, setReferences] = useState<string>();
  useIsoLayoutEffect(() => {
    const candidate = id && getTarget();
    if (!candidate) {
      return;
    }
    const target = candidate;
    const realm = getDefaultView(target.ownerDocument);
    const managed = new Map<HTMLLabelElement, TemporaryId>();
    let sequence = 0;
    let root: Node | undefined;
    const observer = realm ? new realm.MutationObserver(sync) : undefined;
    function sync(): void {
      const labels = new Set(target.labels ?? []);
      for (const [label, token] of managed) {
        if (!labels.has(label) || label.id !== token.value) {
          restore(label, token);
          managed.delete(label);
        }
      }
      const ids = Array.from(labels, (label) => {
        if (label.id === '') {
          const token = {
            value: `${prefix}-native-label-${++sequence}`,
            previous: label.getAttribute('id'),
          };
          managed.set(label, token);
          label.id = token.value;
        }
        return label.id;
      });
      setReferences(ids.length ? ids.join(' ') : undefined);

      const nextRoot = getRootNodeSafe(target);
      if (root !== nextRoot) {
        root = nextRoot;
        observer?.disconnect();
        observer?.observe(root, {
          attributes: true,
          attributeFilter: ['for', 'id'],
          childList: true,
          subtree: true,
        });
      }
    }
    sync();
    return () => {
      observer?.disconnect();
      for (const [label, token] of managed) {
        restore(label, token);
      }
    };
  }, [getTarget, id, prefix]);
  return id ? references : undefined;
}
