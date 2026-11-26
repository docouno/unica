import { findNavigable, recoverRovingKey } from '../../core/collections/navigation.js';
import type { CollectionItem } from '../../core/collections/navigation.js';
import { warnOnce } from '../../core/devWarning.js';
import { matchesSafe } from '../../core/dom.js';

export const listSelector = '.unica-tabs-list';
export const triggerSelector = '.unica-tabs-trigger';

export interface TabItem extends CollectionItem {
  readonly node: HTMLButtonElement;
  readonly selectable: boolean;
}

interface Snapshot {
  readonly items: readonly TabItem[];
  readonly previous: readonly TabItem[];
}

interface Collection {
  readonly read: () => Snapshot | null;
  readonly subscribe: (notify: () => void) => () => void;
  readonly publish: () => void;
  readonly attachList: (node: HTMLDivElement) => () => void;
  readonly attachPanel: (node: HTMLDivElement, key: string) => () => void;
  readonly attachTrigger: (node: HTMLButtonElement, key: string) => () => void;
}

export function createTabCollection(): Collection {
  let list: HTMLDivElement | null = null;
  let snapshot: Snapshot | null = null;
  let queued = false;
  const panels = new Map<HTMLDivElement, string>();
  const triggers = new Map<HTMLButtonElement, string>();
  const listeners = new Set<() => void>();

  function publish(): void {
    const panelKeys = new Set<string>();
    for (const key of panels.values()) {
      if (panelKeys.has(key)) {
        warnOnce('Tabs.duplicatePanel', 'Tabs requires exactly one panel per value.');
      }
      panelKeys.add(key);
    }

    const items: TabItem[] = [];
    const keys = new Set<string>();
    for (const node of list?.querySelectorAll<HTMLButtonElement>(triggerSelector) ?? []) {
      const key = triggers.get(node);
      if (key === undefined || node.closest(listSelector) !== list) {
        continue;
      }
      if (!key || keys.has(key)) {
        warnOnce('Tabs.triggerValue', 'Tabs requires unique, nonempty trigger values.');
        continue;
      }
      keys.add(key);
      const selectable = panelKeys.has(key) && !node.disabled;
      items.push({
        key,
        label: '',
        node,
        selectable,
        navigable: selectable && !matchesSafe(node, ':disabled'),
      });
    }
    if (list && (panelKeys.size !== keys.size || [...keys].some((key) => !panelKeys.has(key)))) {
      warnOnce('Tabs.pair', 'Use matching values for every TabsTrigger and TabsPanel.');
    }

    if (
      snapshot &&
      items.length === snapshot.items.length &&
      items.every(({ key, node, selectable, navigable }, index) => {
        const before = snapshot?.items[index];
        return (
          before?.key === key &&
          before.node === node &&
          before.selectable === selectable &&
          before.navigable === navigable
        );
      })
    ) {
      return;
    }
    snapshot = { items, previous: snapshot?.items ?? [] };
    for (const notify of listeners) {
      notify();
    }
  }

  function schedule(): void {
    if (queued) {
      return;
    }
    queued = true;
    queueMicrotask(() => {
      queued = false;
      publish();
    });
  }

  function attach<Node extends HTMLElement>(
    map: Map<Node, string>,
    node: Node,
    key: string,
  ): () => void {
    map.set(node, key);
    schedule();
    return () => {
      map.delete(node);
      schedule();
    };
  }

  return {
    read: () => snapshot,
    subscribe: (notify) => {
      listeners.add(notify);
      return () => {
        listeners.delete(notify);
      };
    },
    publish,
    attachList: (node) => {
      list = node;
      schedule();
      return () => {
        if (list === node) {
          list = null;
          schedule();
        }
      };
    },
    attachPanel: (node, key) => attach(panels, node, key),
    attachTrigger: (node, key) => attach(triggers, node, key),
  };
}

export function resolveTabSelection(
  snapshot: Snapshot | null,
  value: string | null,
  controlled: boolean,
): string | null {
  if (!snapshot || snapshot.items.some((item) => item.key === value && item.selectable)) {
    return value;
  }
  if (controlled) {
    return null;
  }

  const available = snapshot.items
    .filter(({ selectable }) => selectable)
    .map(({ key, label }) => ({ key, label }));
  const previousKeys = new Set(snapshot.previous.map(({ key }) => key));
  if (value !== null) {
    const neighbor = recoverRovingKey(
      available.filter(({ key }) => previousKeys.has(key)),
      snapshot.previous,
      value,
    );
    if (neighbor !== null) {
      return neighbor;
    }
  }
  return available[0]?.key ?? null;
}

export function getEntryItem(
  items: readonly TabItem[],
  selected: string | null,
): TabItem | undefined {
  return findNavigable(items, selected) ?? items.find(({ navigable }) => navigable);
}
