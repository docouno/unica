import { useEffect, useMemo } from 'react';
import type { ReactElement, ReactNode, Ref } from 'react';
import { requireSlotChild } from '../../core/Slot.js';
import { warnOnce } from '../../core/devWarning.js';
import { devWarningsEnabled } from '../../core/devWarningsEnabled.js';
import { mergeRefs } from '../../core/mergeRefs.js';

const hostTags = ['a', 'article', 'div', 'section'];
const interactiveContent = [
  'a',
  'audio[controls]',
  'button',
  'details',
  'embed',
  'iframe',
  'img[usemap]',
  'input:not([type="hidden" i])',
  'label',
  'select',
  'summary',
  'textarea',
  'video[controls]',
  '[tabindex]',
  '[contenteditable=""]',
  '[contenteditable="true" i]',
  '[contenteditable="plaintext-only" i]',
].join(', ');

function singleId(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const ids = value.split(/[\t\n\f\r ]+/).filter(Boolean);
  return ids.length === 1 ? ids[0] : undefined;
}

export function requireCardHost(children: ReactNode, labelledBy: string | undefined): ReactElement {
  const child = requireSlotChild<HTMLElement>(children, 'Card asChild');
  if (typeof child.type === 'string' && !hostTags.includes(child.type)) {
    throw new Error(
      'Card asChild requires a div, article, section, anchor, or an adapter for one.',
    );
  }
  if (child.type === 'a') {
    if (typeof child.props.href !== 'string' || !child.props.href.trim()) {
      throw new Error('Card asChild requires a nonempty href on its anchor.');
    }
    const childLabel = child.props['aria-labelledby'];
    if (!singleId(childLabel === undefined ? labelledBy : childLabel)) {
      throw new Error('Card asChild requires aria-labelledby with one CardTitle ID on its anchor.');
    }
  }
  return child;
}

function parentInDocument(element: Element): Element | null {
  const parent = element.parentNode;
  if (parent?.nodeType === 11 && 'host' in parent) {
    return (parent as ShadowRoot).host;
  }
  return element.parentElement;
}

function hiddenBoundary(element: Element, stop: Element | null): Element | null {
  let descendant: Element | null = null;
  let visibilityBoundary: Element | null = null;
  let inheritsHiddenVisibility = true;
  for (
    let current: Element | null = element;
    current && current !== stop;
    current = parentInDocument(current)
  ) {
    if (current.matches('[hidden], [inert], [aria-hidden="true" i]')) {
      return current;
    }
    if (
      descendant &&
      current.matches('details:not([open])') &&
      descendant !== current.querySelector(':scope > summary')
    ) {
      return current;
    }
    const style = current.ownerDocument.defaultView?.getComputedStyle(current);
    if (
      style?.display === 'none' ||
      style?.opacity === '0' ||
      style?.contentVisibility === 'hidden'
    ) {
      return current;
    }
    if (inheritsHiddenVisibility) {
      // Follow inherited visibility to the boundary that can reveal this element.
      inheritsHiddenVisibility = style?.visibility === 'hidden' || style?.visibility === 'collapse';
      if (inheritsHiddenVisibility) {
        visibilityBoundary = current;
      }
    }
    descendant = current;
  }
  return visibilityBoundary;
}

function validateHost(host: HTMLElement | null): Element | null {
  if (
    !host ||
    host.namespaceURI !== 'http://www.w3.org/1999/xhtml' ||
    !hostTags.includes(host.localName)
  ) {
    warnOnce(
      'card-host',
      'Card asChild must forward its ref to a div, article, section, or anchor.',
    );
    return null;
  }
  if (host.localName !== 'a') {
    return null;
  }
  if (!host.getAttribute('href')?.trim()) {
    warnOnce('card-href', 'Card asChild requires a nonempty href on its anchor.');
  }
  if (host.querySelector(interactiveContent)) {
    warnOnce(
      'card-interactive-content',
      'A Card anchor cannot contain interactive descendants or descendants with tabIndex.',
    );
  }

  const id = singleId(host.getAttribute('aria-labelledby'));
  const root = host.getRootNode() as ParentNode;
  const escape = host.ownerDocument.defaultView?.CSS?.escape;
  const matches = id
    ? escape
      ? [...root.querySelectorAll(`#${escape(id)}`)]
      : [...root.querySelectorAll('[id]')].filter((element) => element.id === id)
    : [];
  const title = matches[0] as HTMLElement | undefined;
  const concealed = hiddenBoundary(host, null);
  if (
    matches.length !== 1 ||
    !title?.matches('.unica-card-title:is(h1, h2, h3, h4, h5, h6)') ||
    !host.contains(title) ||
    (!concealed &&
      (hiddenBoundary(title, host) ||
        title.checkVisibility?.({ visibilityProperty: true, opacityProperty: true }) === false ||
        !(title.innerText ?? title.textContent).trim()))
  ) {
    warnOnce(
      'card-label',
      'Card asChild aria-labelledby must reference one visible, uniquely identified CardTitle inside its anchor.',
    );
  }
  return concealed;
}

function createHostWatcher() {
  let inspectCurrent: (() => void) | undefined;
  return {
    validate(): void {
      if (inspectCurrent) {
        inspectCurrent();
      } else {
        validateHost(null);
      }
    },
    attach(this: void, host: HTMLElement | null): (() => void) | undefined {
      if (!host) {
        return;
      }
      let boundary: Element | null = null;
      const observeHost = (): void => {
        observer?.observe(host, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
        });
      };
      // An adapter can change its host or children without rerendering Card.
      const inspect = (): void => {
        if (inspectCurrent !== inspect) {
          return;
        }
        const concealed = validateHost(host);
        if (concealed !== boundary) {
          boundary?.removeEventListener('toggle', inspect);
          boundary = concealed;
          observer?.disconnect();
          observeHost();
          if (boundary && boundary !== host) {
            observer?.observe(boundary, {
              attributes: true,
              attributeFilter: ['hidden', 'aria-hidden', 'inert', 'class', 'style', 'open'],
            });
          }
          // Native popovers can open without changing any attribute.
          boundary?.addEventListener('toggle', inspect);
        }
      };
      const observer = host.localName === 'a' ? new MutationObserver(inspect) : undefined;
      inspectCurrent = inspect;
      queueMicrotask(inspect);
      observeHost();
      return () => {
        boundary?.removeEventListener('toggle', inspect);
        observer?.disconnect();
        if (inspectCurrent === inspect) {
          inspectCurrent = undefined;
        }
      };
    },
  };
}

export function useCardHostRef(
  ref: Ref<HTMLElement> | undefined,
  delegated: boolean,
): Ref<HTMLElement> | undefined {
  const inspect = delegated && devWarningsEnabled();
  const watcher = useMemo(() => (inspect ? createHostWatcher() : undefined), [inspect]);
  useEffect(() => {
    watcher?.validate();
  });
  return useMemo(() => (watcher ? mergeRefs(ref, watcher.attach) : ref), [watcher, ref]);
}
