import { Fragment, isValidElement, useLayoutEffect, useRef } from 'react';
import type { ComponentPropsWithoutRef, ReactElement, ReactNode } from 'react';

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
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
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
    if (child.nodeType === Node.ELEMENT_NODE) {
      return labelText(child as Element, includeHidden);
    }
    return child.nodeType === Node.TEXT_NODE ? (child.textContent ?? '') : '';
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

  useLayoutEffect(() => {
    const span = fallback.current;
    const anchor = span?.closest('a');
    if (!span || !anchor || (!authorDescription && !title)) {
      return;
    }

    // IDREFs resolve in the anchor's tree, including when it lives in a shadow root.
    const root = anchor.getRootNode();
    if (!('getElementById' in root)) {
      return;
    }
    const scope = root as Document | ShadowRoot;
    const syncDescription = (): void => {
      let text = '';
      if (!authorIds.some((refId) => scope.getElementById(refId) !== null)) {
        if (authorDescription) {
          text = authorDescription;
        } else if (title) {
          text =
            titleDescription(
              title,
              anchor.innerText ?? labelText(anchor, false),
              () =>
                hasExplicitName ||
                nameIds.some((refId) => hasReferencedName(scope.getElementById(refId))) ||
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
      authorIds.length > 0 || (watchTitle && !hasExplicitName && nameIds.length > 0);
    const Observer = anchor.ownerDocument.defaultView?.MutationObserver;
    if (!Observer || (!watchReferences && !watchTitle)) {
      return;
    }

    const observer = new Observer(syncDescription);
    observer.observe(watchReferences ? scope : anchor, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: watchTitle
        ? [
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
          ]
        : ['id'],
      characterData: watchTitle,
    });
    return () => observer.disconnect();
  }, [authorIds, authorDescription, title, hasExplicitName, nameIds]);

  return (
    <span id={id} hidden>
      {authorDescription || title ? <span ref={fallback}>{initialDescription}</span> : null} {hint}
    </span>
  );
}
