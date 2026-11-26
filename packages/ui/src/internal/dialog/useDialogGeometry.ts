import { useState } from 'react';
import {
  addListenerSafe,
  getDeepActiveElement,
  getLiveView,
  removeListenerSafe,
} from '../../core/dom.js';
import { createFrameJob } from '../../core/frame-scheduler.js';
import { composedAncestors, composedContains } from '../../core/overlay/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import type { DialogSide, ResponsiveDialogSide } from './types.js';

type DialogEdge = 'center' | DialogSide;

const narrowAttribute = 'data-unica-dialog-narrow';
const compactAttribute = 'data-unica-dialog-compact';
const wholeScrollAttribute = 'data-unica-dialog-whole-scroll';
const beforeContentAttribute = 'data-unica-dialog-before-content';
const afterContentAttribute = 'data-unica-dialog-after-content';
const authoredTabIndexAttribute = 'data-unica-dialog-body-tabindex';
const viewportProperties = [
  '--_dialog-viewport-width',
  '--_dialog-viewport-height',
  '--_dialog-viewport-top',
  '--_dialog-viewport-right',
  '--_dialog-viewport-bottom',
  '--_dialog-viewport-left',
] as const;

function observeViewport(
  dialog: HTMLDialogElement,
  setNarrow: (narrow: boolean) => void,
): () => void {
  const document = dialog.ownerDocument;
  const view = getLiveView(document);
  if (!view) {
    return () => undefined;
  }

  const viewport = view.visualViewport;
  const root = document.documentElement;
  const measure = (): (() => void) => {
    const layoutWidth = root.clientWidth || view.innerWidth;
    const layoutHeight = root.clientHeight || view.innerHeight;
    const width = Math.min(viewport?.width || layoutWidth, layoutWidth);
    const height = Math.min(viewport?.height || layoutHeight, layoutHeight);
    const left = Math.max(0, viewport?.offsetLeft ?? 0);
    const top = Math.max(0, viewport?.offsetTop ?? 0);
    const right = Math.max(0, layoutWidth - (left + width));
    const bottom = Math.max(0, layoutHeight - (top + height));
    const values = [width, height, top, right, bottom, left] as const;

    return () => {
      for (const [index, property] of viewportProperties.entries()) {
        const value = `${values[index]}px`;
        if (dialog.style.getPropertyValue(property) !== value) {
          dialog.style.setProperty(property, value);
        }
      }
      const narrow = width <= 600;
      dialog.toggleAttribute(narrowAttribute, narrow);
      dialog.toggleAttribute(compactAttribute, width <= 420);
      setNarrow(narrow);
    };
  };

  measure()();
  const frame = createFrameJob(document, { measure });
  const layout =
    typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(frame.schedule) : null;
  layout?.observe(root);
  addListenerSafe(view, 'resize', frame.schedule);
  if (viewport) {
    addListenerSafe(viewport, 'resize', frame.schedule);
    addListenerSafe(viewport, 'scroll', frame.schedule);
  }
  return () => {
    frame.dispose();
    layout?.disconnect();
    removeListenerSafe(view, 'resize', frame.schedule);
    if (viewport) {
      removeListenerSafe(viewport, 'resize', frame.schedule);
      removeListenerSafe(viewport, 'scroll', frame.schedule);
    }
    for (const property of viewportProperties) {
      dialog.style.removeProperty(property);
    }
    dialog.removeAttribute(narrowAttribute);
    dialog.removeAttribute(compactAttribute);
  };
}

function blockEdges(style: CSSStyleDeclaration, edge: 'margin' | 'padding'): number {
  const start = edge === 'margin' ? style.marginBlockStart : style.paddingBlockStart;
  const end = edge === 'margin' ? style.marginBlockEnd : style.paddingBlockEnd;
  return (Number.parseFloat(start) || 0) + (Number.parseFloat(end) || 0);
}

function revealFocusedContent(surface: HTMLDivElement, owner: HTMLElement | null): void {
  const focused = getDeepActiveElement(surface.ownerDocument);
  if (!owner || !focused || focused === owner || !composedContains(owner, focused)) {
    return;
  }
  for (const ancestor of composedAncestors(focused)) {
    if (ancestor === owner) {
      break;
    }
    if (ancestor.matches(':modal, :popover-open')) {
      return;
    }
  }

  const viewport = owner.getBoundingClientRect();
  const target = focused.getBoundingClientRect();
  const scale = viewport.height / owner.offsetHeight || 1;
  const top = viewport.top + (owner.clientTop + 4) * scale;
  const bottom = top + (owner.clientHeight - 8) * scale;
  if (target.top < top || target.height > bottom - top) {
    owner.scrollTop += (target.top - top) / scale;
  } else if (target.bottom > bottom) {
    owner.scrollTop += (target.bottom - bottom) / scale;
  }
}

function observePanel(surface: HTMLDivElement): () => void {
  const view = getLiveView(surface.ownerDocument);
  if (!view || typeof view.ResizeObserver !== 'function') {
    return () => undefined;
  }
  let body: HTMLElement | null = null;
  let content: HTMLElement | null = null;
  let chrome: Element[] = [];

  const updateSeams = (): void => {
    const scroll = body && !surface.hasAttribute(wholeScrollAttribute) ? body : null;
    const overflow = scroll !== null && scroll.scrollHeight > scroll.clientHeight + 1;
    const tabIndex = overflow ? 0 : -1;
    if (body && !body.hasAttribute(authoredTabIndexAttribute) && body.tabIndex !== tabIndex) {
      body.tabIndex = tabIndex;
    }
    surface.toggleAttribute(beforeContentAttribute, overflow && scroll.scrollTop > 1);
    surface.toggleAttribute(
      afterContentAttribute,
      overflow && scroll.scrollTop + scroll.clientHeight < scroll.scrollHeight - 1,
    );
  };

  const measureLayout = (): (() => void) => {
    const chromeHeight = chrome.reduce((height, part) => {
      const layout = view.getComputedStyle(part);
      if (
        layout.display === 'none' ||
        layout.position === 'absolute' ||
        layout.position === 'fixed'
      ) {
        return height;
      }
      const size =
        part instanceof view.HTMLElement ? part.offsetHeight : part.getBoundingClientRect().height;
      return height + size + blockEdges(layout, 'margin');
    }, 0);
    const bodyLayout = body && view.getComputedStyle(body);
    const bodyMargins =
      bodyLayout && bodyLayout.display !== 'none' ? blockEdges(bodyLayout, 'margin') : 0;
    const reserved =
      chromeHeight + blockEdges(view.getComputedStyle(surface), 'padding') + bodyMargins;
    const availableReadingHeight = surface.clientHeight - reserved;
    const naturalBodyHeight = content?.offsetHeight ?? 0;
    const whole =
      availableReadingHeight < 96 &&
      (naturalBodyHeight > Math.max(0, availableReadingHeight) || reserved > surface.clientHeight);
    return () => {
      const changedOwner = whole !== surface.hasAttribute(wholeScrollAttribute);
      if (changedOwner) {
        if (whole && body) {
          body.scrollTop = 0;
        } else {
          surface.scrollTop = 0;
        }
        surface.toggleAttribute(wholeScrollAttribute, whole);
      }
      const tabIndex = whole ? 0 : -1;
      if (surface.tabIndex !== tabIndex) {
        surface.tabIndex = tabIndex;
      }
      updateSeams();
      if (changedOwner) {
        revealFocusedContent(surface, whole ? surface : body);
      }
    };
  };

  const onScroll = (event: Event): void => {
    if (event.target === body) {
      updateSeams();
    }
  };

  const frame = createFrameJob(surface.ownerDocument, { measure: measureLayout });
  const resize = new view.ResizeObserver(frame.schedule);
  const observe = (): void => {
    resize.disconnect();
    body = surface.querySelector<HTMLElement>(':scope > .unica-dialog-body');
    content = body?.querySelector<HTMLElement>(':scope > .unica-dialog-body-content') ?? null;
    chrome = [...surface.children].filter((part) => part !== body);
    for (const node of [surface, body, content, ...chrome]) {
      if (node) {
        resize.observe(node);
      }
    }
    hierarchy.disconnect();
    hierarchy.observe(surface, { childList: true });
    if (body) {
      hierarchy.observe(body, { attributes: true, attributeFilter: [authoredTabIndexAttribute] });
    }
    measureLayout()();
  };
  const hierarchy = new view.MutationObserver((records) => {
    if (records.some(({ type }) => type === 'childList')) {
      observe();
    } else {
      updateSeams();
    }
  });
  surface.addEventListener('scroll', onScroll, { capture: true, passive: true });
  observe();

  return () => {
    frame.dispose();
    resize.disconnect();
    hierarchy.disconnect();
    surface.removeEventListener('scroll', onScroll, true);
    surface.removeAttribute(wholeScrollAttribute);
    surface.removeAttribute(beforeContentAttribute);
    surface.removeAttribute(afterContentAttribute);
    surface.tabIndex = -1;
    if (body && !body.hasAttribute(authoredTabIndexAttribute)) {
      body.removeAttribute('tabindex');
    }
  };
}

/** Keeps one panel instance mounted as its viewport and scroll owner change. */
export function useDialogGeometry(
  dialog: HTMLDialogElement | null,
  surface: HTMLDivElement | null,
  isPhysicallyOpen: boolean,
  side: DialogEdge | ResponsiveDialogSide,
): DialogEdge {
  const [narrow, setNarrow] = useState(false);
  useIsoLayoutEffect(() => {
    if (dialog && isPhysicallyOpen) {
      return observeViewport(dialog, setNarrow);
    }
  }, [dialog, isPhysicallyOpen]);
  useIsoLayoutEffect(() => {
    if (surface && isPhysicallyOpen) {
      return observePanel(surface);
    }
  }, [surface, isPhysicallyOpen]);

  return typeof side === 'string' ? side : narrow ? side.narrow : side.wide;
}
