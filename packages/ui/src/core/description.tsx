import { Fragment, createContext, isValidElement, useRef } from 'react';
import type { ComponentPropsWithoutRef, Context, ReactElement, ReactNode } from 'react';
import {
  containsSafe,
  getComputedStyleSafe,
  getLiveView,
  getOwnerDocument,
  getRootNodeSafe,
  isElementNode,
  reportErrorSafe,
} from './dom.js';
import { useIsoLayoutEffect } from './useIsoLayoutEffect.js';

interface DescriptionContribution {
  readonly id: string;
  readonly fallbackId: string;
}

// A contribution surrounds one slotted trigger. Link identifies it by its IDREF,
// so it does not affect other links rendered inside the same React subtree.
export const DescriptionScope: Context<DescriptionContribution | null> =
  /* @__PURE__ */ createContext<DescriptionContribution | null>(null);

export function descriptionIds(value?: string): string[] {
  return [...new Set(value?.split(/[\t\n\f\r ]+/).filter(Boolean))];
}

interface DescriptionProps {
  readonly id?: string | undefined;
  readonly trigger?: HTMLElement | null | undefined;
  readonly authorIds: readonly string[];
  readonly authorDescription?: string | undefined;
  readonly title?: string | undefined;
  readonly hasExplicitName?: boolean | undefined;
  readonly label?: ReactNode;
  readonly source?: ReactElement | undefined;
  readonly nameIds: readonly string[];
}

const nonLabelElements = /* @__PURE__ */ new Set(['script', 'style', 'template']);
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
            // Author CSS can change the visible label through any attribute.
            attributes: true,
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

// A native tooltip describes sources that already have a name, unless it
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

type NativeNameProps = Pick<
  ComponentPropsWithoutRef<'input'>,
  'alt' | 'type' | 'value' | 'defaultValue'
>;

function hasIntrinsicName(
  tag: string,
  { alt, type, value, defaultValue }: NativeNameProps,
): boolean {
  if (tag === 'img' || (tag === 'input' && type === 'image')) {
    return Boolean(alt?.trim());
  }
  if (tag === 'input' && (type === 'button' || type === 'reset' || type === 'submit')) {
    const text = value ?? defaultValue;
    return text === undefined ? type !== 'button' : Boolean(String(text).trim());
  }
  return false;
}

function hasMountedName(anchor: HTMLElement): boolean {
  const { localName } = anchor;
  if ('labels' in anchor) {
    const { labels } = anchor as HTMLInputElement;
    if (labels && Array.from(labels).some((label) => Boolean(labelText(label, false).trim()))) {
      return true;
    }
    if (localName === 'input') {
      const input = anchor as HTMLInputElement;
      return hasIntrinsicName(localName, {
        alt: input.alt,
        type: input.type,
        value: input.getAttribute('value') ?? undefined,
      });
    }
    if (localName !== 'button') {
      return false;
    }
  }
  if (localName === 'img') {
    return (
      !isPresentational(anchor.getAttribute('role')) &&
      Boolean((anchor as HTMLImageElement).alt.trim())
    );
  }
  return Boolean(labelText(anchor, false).trim());
}

export function DescriptionFallback({
  id,
  trigger,
  authorIds,
  authorDescription: sourceDescription,
  title: sourceTitle,
  hasExplicitName = false,
  label,
  source,
  nameIds,
}: DescriptionProps): ReactElement {
  const fallback = useRef<HTMLSpanElement>(null);
  const syncOnCommit = useRef<(() => void) | null>(null);
  const authorDescription = sourceDescription?.trim() || undefined;
  const title = sourceTitle?.trim() || undefined;
  const authorIdsKey = authorIds.join(' ');
  const nameIdsKey = nameIds.join(' ');
  const initialDescription =
    authorIds.length === 0
      ? (authorDescription ??
        (title &&
          titleDescription(
            title,
            staticLabelText(label, false).replace(/ +/g, ' '),
            () =>
              hasExplicitName ||
              (isValidElement<NativeNameProps>(source) &&
                typeof source.type === 'string' &&
                hasIntrinsicName(source.type, source.props)) ||
              Boolean(staticLabelText(label, true).trim()),
          )))
      : undefined;

  useIsoLayoutEffect(() => {
    syncOnCommit.current = null;
    const span = fallback.current;
    // Link renders the fallback inside its own anchor, including router slots.
    // Tooltip renders phrasing content beside the source, including void controls.
    const anchor = trigger === undefined ? span?.closest('a') : trigger;
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
                hasMountedName(anchor),
            ) ?? '';
        }
      }

      if (span.textContent !== text) {
        span.textContent = text;
      }
    };

    syncOnCommit.current = syncDescription;
    const watchTitle = Boolean(title && !authorDescription);
    const watchReferences =
      stableAuthorIds.length > 0 || (watchTitle && !hasExplicitName && stableNameIds.length > 0);
    const view = getLiveView(getOwnerDocument(anchor));
    if (!view || typeof view.MutationObserver !== 'function' || (!watchReferences && !watchTitle)) {
      return;
    }

    const onMutations = (records: readonly MutationRecord[]): void => {
      if (watchReferences) {
        // Sibling selectors and stylesheet edits can change a referenced name without
        // mutating the link or the IDREF. A plain description only depends on ID presence.
        if (watchTitle || records.some((r) => r.type === 'childList' || r.attributeName === 'id')) {
          syncDescription();
        }
        return;
      }

      // Ordinary titled links read layout only for changes to their own label or ancestors.
      const affectsAnchor = records.some((record) => {
        if (containsSafe(anchor, record.target)) {
          return true;
        }
        if (record.type === 'attributes') {
          return containsSafe(record.target, anchor);
        }
        if (record.type === 'childList') {
          for (const added of record.addedNodes) {
            if (containsSafe(added, anchor)) {
              return true;
            }
          }
        }
        return false;
      });
      if (affectsAnchor) {
        syncDescription();
      }
    };
    return subscribeRootWatcher(scope, view, { onMutations, watchTitle });
  }, [trigger, authorIdsKey, authorDescription, title, hasExplicitName, nameIdsKey]);

  // A parent render may change CSS outside the observed label. Refresh after the commit
  // while keeping observer registrations stable across equivalent renders.
  useIsoLayoutEffect(() => {
    syncOnCommit.current?.();
  });

  return (
    <span id={id} hidden={id !== undefined} ref={fallback}>
      {initialDescription}
    </span>
  );
}
