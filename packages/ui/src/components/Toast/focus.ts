import {
  composedContains,
  getDeepActiveElement,
  getRootNodeSafe,
  getShadowHostSafe,
  isInertElement,
} from '../../core/dom.js';
import { getToastActiveElement } from './host.js';
import { isVisibleReadingControl, revealReadingControl, rowSelector } from './reading.js';

const dockSelector = '.unica-toast-dock button';
const actionSelector = '.unica-toast-action';
const dismissSelector = '.unica-toast-dismiss';

interface FocusedControl {
  readonly element: HTMLElement;
  readonly tree: Node;
  readonly row?: string | undefined;
  readonly part: 'action' | 'dismiss' | 'toggle' | 'clear' | 'list';
  readonly following: readonly string[];
}

export interface ToastFocus {
  origin: Element | null;
  current: FocusedControl | null;
  restoring: boolean;
}

function rowId(node: HTMLElement): string | undefined {
  return node.dataset.unicaToastItem;
}

export function recordToastFocus(
  memory: ToastFocus,
  root: HTMLElement,
  element: HTMLElement,
  previous: EventTarget | null,
): void {
  const related = previous as Element | null;
  if (
    related?.nodeType === 1 &&
    related !== root.ownerDocument.body &&
    !composedContains(root, related) &&
    (!memory.origin || !composedContains(related, memory.origin))
  ) {
    memory.origin = related;
  }
  const row = element.closest<HTMLElement>(rowSelector);
  let part: FocusedControl['part'];
  if (row) {
    part = element.closest(actionSelector) ? 'action' : 'dismiss';
  } else if (element.matches('.unica-toast-stack-toggle')) {
    part = 'toggle';
  } else if (element.matches('.unica-toast-dismiss-all')) {
    part = 'clear';
  } else {
    part = 'list';
  }
  const rows = Array.from(root.querySelectorAll<HTMLElement>(rowSelector));
  const index = row ? rows.indexOf(row) : -1;
  const following = [...rows.slice(index + 1), ...rows.slice(0, Math.max(0, index)).reverse()]
    .map(rowId)
    .filter((id): id is string => id !== undefined);
  memory.current = {
    element,
    tree: getRootNodeSafe(root),
    row: row ? rowId(row) : undefined,
    part,
    following,
  };
}

function focusTarget(target: Element | null, document: Document): boolean {
  const view = document.defaultView;
  if (
    !view ||
    !(target instanceof view.HTMLElement) ||
    target.ownerDocument !== document ||
    !target.isConnected ||
    target.matches(':disabled') ||
    isInertElement(target)
  ) {
    return false;
  }
  target.focus({ preventScroll: true });
  return getDeepActiveElement(document, getRootNodeSafe(target)) === target;
}

export function restoreToastFocus(
  memory: ToastFocus,
  root: HTMLElement | null,
  empty: boolean,
  fallback: HTMLElement | null,
): void {
  const current = memory.current;
  if (!current || (!root && !empty)) {
    return;
  }
  const document = root?.ownerDocument ?? current.element.ownerDocument;
  if (!document.hasFocus()) {
    memory.current = null;
    return;
  }
  const active = root
    ? getToastActiveElement(root)
    : (getDeepActiveElement(document, current.tree) ?? getDeepActiveElement(document));
  const lostInsideShadow =
    !current.element.isConnected && active === getShadowHostSafe(current.tree);
  if (active === current.element && root?.contains(active) && !active.matches(':disabled')) {
    recordToastFocus(memory, root, current.element, null);
    return;
  }
  if (
    active &&
    !lostInsideShadow &&
    active !== document.body &&
    active !== document.documentElement &&
    active !== current.element
  ) {
    memory.current = null;
    return;
  }
  const candidates: (Element | null)[] = [];
  if (root) {
    const rows = Array.from(root.querySelectorAll<HTMLElement>(rowSelector));
    const matching = rows.find((row) => rowId(row) === current.row);
    const rowControl = current.part === 'action' ? actionSelector : dismissSelector;
    if (matching) {
      candidates.push(matching.querySelector(rowControl));
      if (current.part === 'action') {
        candidates.push(matching.querySelector(dismissSelector));
      }
    }
    if (current.part === 'toggle') {
      candidates.push(root.querySelector('.unica-toast-stack-toggle'));
    } else if (current.part === 'clear') {
      candidates.push(root.querySelector('.unica-toast-dismiss-all'));
    } else if (current.part === 'list') {
      candidates.push(root.querySelector('.unica-toast-list'));
    }
    for (const id of current.following) {
      const row = rows.find((candidate) => rowId(candidate) === id);
      if (row) {
        for (const selector of new Set([rowControl, dismissSelector])) {
          const target = row.querySelector(selector);
          if (target && isVisibleReadingControl(target)) {
            candidates.push(target);
          }
        }
      }
    }
    if (rows.length === 1 && !matching) {
      candidates.push(
        rows[0]?.querySelector(rowControl) ?? null,
        rows[0]?.querySelector(dismissSelector) ?? null,
      );
    }
    candidates.push(...root.querySelectorAll(dockSelector));
  }
  memory.current = null;
  for (const candidate of candidates) {
    const sameControl =
      candidate?.closest<HTMLElement>(rowSelector)?.dataset.unicaToastItem === current.row &&
      candidate?.matches(current.part === 'action' ? actionSelector : dismissSelector);
    memory.restoring = Boolean(sameControl);
    try {
      if (focusTarget(candidate, document)) {
        if (
          candidate instanceof document.defaultView!.HTMLElement &&
          !sameControl &&
          !isVisibleReadingControl(candidate)
        ) {
          const list = candidate.closest<HTMLElement>('.unica-toast-list, .unica-toast-stack');
          if (list) {
            revealReadingControl(list, candidate);
          }
        }
        return;
      }
    } finally {
      memory.restoring = false;
    }
  }
  if (!focusTarget(memory.origin, document)) {
    focusTarget(fallback, document);
  }
  memory.origin = null;
}
