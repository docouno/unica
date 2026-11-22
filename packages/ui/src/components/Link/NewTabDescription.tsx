import { Fragment, isValidElement, useRef } from 'react';
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';
import {
  containsSafe,
  getComputedStyleSafe,
  getLiveView,
  getOwnerDocument,
  getRootNodeSafe,
  isElementNode,
  reportErrorSafe,
} from '../../core/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

interface DescriptionProps {
  readonly id: string;
  readonly hint: string;
  readonly authorIds: readonly string[];
  readonly authorDescription: string | undefined;
  readonly title: string | undefined;
  readonly hasExplicitName: boolean;
  readonly label: ReactNode;
  readonly nameIds: readonly string[];
}

const nonLabelElements = /* @__PURE__ */ new Set(['script', 'style', 'template']);
const FULL_TITLE_ATTRIBUTES = [
  'id',
  'aria-label',
  'aria-hidden',
  'alt',
  'class',
  'hidden',
  'inert',
  'role',
  'style',
  'title',
];

type WatchMode = 'none' | 'idOnly' | 'fullTitle';

interface DescriptionSubscriber {
  readonly onMutations: (records: readonly MutationRecord[]) => void;
  readonly watchTitle: boolean;
}

interface RootWatcher {
  readonly subscribers: Set<DescriptionSubscriber>;
  readonly observer: MutationObserver;
  mode: WatchMode;
  reconfigure: () => void;
}

const rootWatchers = new WeakMap<Document | ShadowRoot, RootWatcher>();

function subscribeRootWatcher(
  scope: Document | ShadowRoot,
  view: Window & typeof globalThis,
  subscriber: DescriptionSubscriber,
): () => void {
  let watcher = rootWatchers.get(scope);
  if (!watcher) {
    const subscribers = new Set<DescriptionSubscriber>();
    const observer = new view.MutationObserver((records) => {
      for (const entry of [...subscribers]) {
        try {
          entry.onMutations(records);
        } catch (error) {
          reportErrorSafe(view, error);
        }
      }
    });
    const created: RootWatcher = {
      subscribers,
      observer,
      mode: 'none',
      reconfigure() {
        let nextMode: WatchMode = 'none';
        for (const entry of subscribers) {
          if (entry.watchTitle) {
            nextMode = 'fullTitle';
            break;
          }
          nextMode = 'idOnly';
        }
        if (nextMode === created.mode) {
          return;
        }
        // Calling observe again preserves pending records for existing subscribers.
        created.mode = nextMode;
        if (nextMode === 'fullTitle') {
          observer.observe(scope, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: FULL_TITLE_ATTRIBUTES,
          });
        } else if (nextMode === 'idOnly') {
          observer.observe(scope, {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: ['id'],
          });
        }
      },
    };
    watcher = created;
    rootWatchers.set(scope, watcher);
  }

  const owned = watcher;
  owned.subscribers.add(subscriber);
  owned.reconfigure();

  return () => {
    owned.subscribers.delete(subscriber);
    if (owned.subscribers.size === 0) {
      owned.observer.disconnect();
      owned.mode = 'none';
      if (rootWatchers.get(scope) === owned) {
        rootWatchers.delete(scope);
      }
    } else {
      owned.reconfigure();
    }
  };
}

function isPresentational(role: string | null | undefined): boolean {
  const first = role?.trim().split(/\s+/, 1)[0];
  return first === 'none' || first === 'presentation';
}

function staticLabelText(label: ReactNode, accessible: boolean): string {
  if (typeof label === 'string' || typeof label === 'number' || typeof label === 'bigint') {
    return String(label).replace(/[\t\n\f\r ]+/g, ' ');
  }
  if (Array.isArray(label)) {
    return (label as readonly ReactNode[])
      .map((child) => staticLabelText(child, accessible))
      .join('');
  }
  // Inspect authored markup for text without rendering opaque components.
  if (!isValidElement<ComponentPropsWithoutRef<'img'>>(label)) {
    return '';
  }
  const { props, type } = label;
  if (type === Fragment) {
    return staticLabelText(props.children, accessible);
  }
  if (
    typeof type !== 'string' ||
    nonLabelElements.has(type) ||
    props.hidden ||
    props.style?.display === 'none' ||
    props.style?.visibility === 'hidden' ||
    props.style?.visibility === 'collapse' ||
    props.style?.contentVisibility === 'hidden'
  ) {
    return '';
  }
  if (
    accessible &&
    (props.inert || props['aria-hidden'] === true || props['aria-hidden'] === 'true')
  ) {
    return '';
  }
  if (accessible && props['aria-label']?.trim()) {
    return props['aria-label'];
  }
  if (type === 'img') {
    return accessible && !isPresentational(props.role) ? (props.alt ?? props.title ?? '') : '';
  }
  if (type === 'br') {
    return '\n';
  }
  return staticLabelText(props.children, accessible);
}

// A native tooltip describes links that already have a name, unless it
// repeats their rendered text.
function titleDescription(
  title: string,
  renderedText: string,
  hasName: () => boolean,
): string | undefined {
  return renderedText.trim() !== title && hasName() ? title : undefined;
}

function isHidden(element: Element): boolean {
  const style = getComputedStyleSafe(element);
  return (
    element.getAttribute('aria-hidden') === 'true' ||
    element.hasAttribute('inert') ||
    style?.display === 'none' ||
    style?.visibility === 'hidden' ||
    style?.visibility === 'collapse' ||
    style?.contentVisibility === 'hidden'
  );
}

// Read the ordinary visible label sources. The browser owns name computation.
function labelText(element: Element, includeHidden: boolean): string {
  if ((!includeHidden && isHidden(element)) || nonLabelElements.has(element.localName)) {
    return '';
  }
  const label = element.getAttribute('aria-label');
  if (label?.trim()) {
    return label;
  }
  if (element.localName === 'img' && !isPresentational(element.getAttribute('role'))) {
    return element.getAttribute('alt') ?? element.getAttribute('title') ?? '';
  }
  return Array.from(element.childNodes, (child) => {
    if (isElementNode(child)) {
      return labelText(child, includeHidden);
    }
    return child.nodeType === 3 ? (child.textContent ?? '') : '';
  }).join('');
}

function hasReferencedName(element: Element | null): boolean {
  if (!element) {
    return false;
  }
  // Explicitly referencing a hidden target includes that target's content.
  for (let ancestor: Element | null = element; ancestor; ancestor = ancestor.parentElement) {
    if (isHidden(ancestor)) {
      return Boolean(labelText(element, true).trim());
    }
  }
  return Boolean(labelText(element, false).trim());
}

export function NewTabDescription({
  id,
  hint,
  authorIds,
  authorDescription,
  title,
  hasExplicitName,
  label,
  nameIds,
}: DescriptionProps): ReactElement {
  const fallback = useRef<HTMLSpanElement>(null);
  const authorIdsKey = authorIds.join(' ');
  const nameIdsKey = nameIds.join(' ');
  const initialDescription =
    authorIds.length === 0
      ? (authorDescription ??
        (title &&
          titleDescription(
            title,
            staticLabelText(label, false).replace(/ +/g, ' '),
            () => hasExplicitName || Boolean(staticLabelText(label, true).trim()),
          )))
      : undefined;

  useIsoLayoutEffect(() => {
    const span = fallback.current;
    const anchor = span?.closest('a');
    if (!span || !anchor || (!authorDescription && !title)) {
      return;
    }

    // IDREFs resolve in the anchor's tree, including when it lives in a shadow root.
    const root = getRootNodeSafe(anchor);
    if (!('getElementById' in root)) {
      return;
    }
    const scope = root as Document | ShadowRoot;
    const stableAuthorIds = authorIdsKey ? authorIdsKey.split(' ') : [];
    const stableNameIds = nameIdsKey ? nameIdsKey.split(' ') : [];

    const syncDescription = (): void => {
      let text = '';
      if (!stableAuthorIds.some((refId) => scope.getElementById(refId) !== null)) {
        if (authorDescription) {
          text = authorDescription;
        } else if (title) {
          text =
            titleDescription(
              title,
              anchor.innerText ?? labelText(anchor, false),
              () =>
                hasExplicitName ||
                stableNameIds.some((refId) => hasReferencedName(scope.getElementById(refId))) ||
                Boolean(labelText(anchor, false).trim()),
            ) ?? '';
        }
      }

      if (span.textContent !== text) {
        span.textContent = text;
      }
    };

    syncDescription();
    const watchTitle = Boolean(title && !authorDescription);
    const watchReferences =
      stableAuthorIds.length > 0 || (watchTitle && !hasExplicitName && stableNameIds.length > 0);
    const view = getLiveView(getOwnerDocument(anchor));
    if (!view || typeof view.MutationObserver !== 'function' || (!watchReferences && !watchTitle)) {
      return;
    }

    const ids = [...stableAuthorIds, ...stableNameIds];
    let references = ids.map((refId) => scope.getElementById(refId));
    const onMutations = (records: readonly MutationRecord[]): void => {
      if (ids.length && records.some((r) => r.type === 'childList' || r.attributeName === 'id')) {
        const next = ids.map((refId) => scope.getElementById(refId));
        const changed = next.some((node, index) => node !== references[index]);
        references = next;
        if (changed) {
          syncDescription();
          return;
        }
      }
      if (!watchTitle) {
        return;
      }
      const touches = (node: Element, record: MutationRecord): boolean =>
        containsSafe(node, record.target) ||
        (record.type === 'attributes' && containsSafe(record.target, node));
      if (
        records.some(
          (r) => touches(anchor, r) || references.some((node) => node && touches(node, r)),
        )
      ) {
        syncDescription();
      }
    };
    return subscribeRootWatcher(scope, view, { onMutations, watchTitle });
  }, [authorIdsKey, authorDescription, title, hasExplicitName, nameIdsKey]);

  return (
    <span id={id} hidden>
      {authorDescription || title ? <span ref={fallback}>{initialDescription}</span> : null} {hint}
    </span>
  );
}
