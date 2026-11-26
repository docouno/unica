import {
  composedAncestors,
  getComputedStyleSafe,
  getComposedParentElement,
} from '../../core/dom.js';

interface Scrollport {
  readonly element: Element;
  readonly viewport: boolean;
}

function getScrollports(target: HTMLElement): Scrollport[] {
  const document = target.ownerDocument;
  const viewport = document.scrollingElement;
  const ports: Scrollport[] = [];
  for (const element of composedAncestors(getComposedParentElement(target))) {
    if (element === viewport || element === document.body || element === document.documentElement) {
      continue;
    }
    const overflow = getComputedStyleSafe(element)?.overflowY;
    if (
      overflow === 'auto' ||
      overflow === 'scroll' ||
      overflow === 'hidden' ||
      overflow === 'overlay'
    ) {
      ports.push({ element, viewport: false });
    }
  }
  if (viewport) {
    ports.push({ element: viewport, viewport: true });
  }
  return ports;
}

interface VerticalBounds {
  readonly start: number;
  readonly height: number;
  readonly scale: number;
}

function verticalBounds({ element, viewport }: Scrollport): VerticalBounds {
  if (viewport) {
    return { start: 0, height: element.clientHeight, scale: 1 };
  }
  const rect = element.getBoundingClientRect();
  const layoutHeight = (element as HTMLElement).offsetHeight;
  const scale = layoutHeight > 0 && rect.height > 0 ? rect.height / layoutHeight : 1;
  return {
    start: rect.top + element.clientTop * scale,
    height: element.clientHeight * scale,
    scale,
  };
}

export function showFocusTarget(target: HTMLElement): void {
  const bounds = target.getBoundingClientRect();
  const outOfView = getScrollports(target).some((port) => {
    const { start, height } = verticalBounds(port);
    return bounds.top < start || bounds.bottom > start + height;
  });
  if (outOfView) {
    target.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }
}

function effectiveZoom(element: Element): number {
  if (element.currentCSSZoom > 0) {
    return element.currentCSSZoom;
  }
  let zoom = 1;
  for (const ancestor of composedAncestors(element)) {
    const value = getComputedStyleSafe(ancestor)?.getPropertyValue('zoom').trim() ?? '';
    const factor = Number.parseFloat(value) / (value.endsWith('%') ? 100 : 1);
    if (factor > 0) {
      zoom *= factor;
    }
  }
  return zoom;
}

function isScrollbarPress(port: Scrollport, event: MouseEvent): boolean {
  const { element, viewport } = port;
  if (event.target !== element && !(viewport && event.target === element.ownerDocument)) {
    return false;
  }
  if (viewport) {
    const width = element.ownerDocument.defaultView?.innerWidth ?? element.clientWidth;
    return (
      event.clientX >= 0 &&
      event.clientX < width &&
      (event.clientX < element.clientLeft ||
        event.clientX >= element.clientLeft + element.clientWidth)
    );
  }

  const style = getComputedStyleSafe(element);
  const borderStart = Number.parseFloat(style?.borderLeftWidth ?? '') || 0;
  const borderEnd = Number.parseFloat(style?.borderRightWidth ?? '') || 0;
  const left = element.clientLeft - borderStart;
  const width = (element as HTMLElement).offsetWidth - borderStart - borderEnd;
  // offsetX ignores transforms, but includes effective CSS zoom.
  const x = event.offsetX / effectiveZoom(element);
  return x >= 0 && x < width && (x < left || x >= left + element.clientWidth);
}

interface AnchorLease {
  readonly value: string;
  readonly priority: string;
  count: number;
}

const anchorLeases = /* @__PURE__ */ new WeakMap<CSSStyleDeclaration, AnchorLease>();

function suspendNativeAnchor(element: Element): () => void {
  const style = (element as HTMLElement).style;
  const property = 'overflow-anchor';
  const lease = anchorLeases.get(style) ?? {
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
    count: 0,
  };
  anchorLeases.set(style, lease);
  lease.count += 1;
  style.setProperty(property, 'none', lease.priority);

  return () => {
    lease.count -= 1;
    if (lease.count === 0) {
      anchorLeases.delete(style);
      if (
        style.getPropertyValue(property) === 'none' &&
        style.getPropertyPriority(property) === lease.priority
      ) {
        style.setProperty(property, lease.value, lease.priority);
      }
    }
  };
}

interface AnchoredPort extends Scrollport {
  readonly offset: number;
  expectedScroll: number;
  expectedMax: number;
}

export interface ScrollAnchor {
  readonly unchanged: (clampAllowance?: number) => boolean;
  readonly restore: () => void;
  readonly keepVisible: () => void;
  readonly watch: (cancel: () => void, readClampAllowance?: () => number) => () => void;
}

function maxScroll(element: Element): number {
  return Math.max(0, element.scrollHeight - element.clientHeight);
}

export function captureScrollAnchor(target: HTMLElement): ScrollAnchor {
  const ports: AnchoredPort[] = getScrollports(target).map((port) => ({
    ...port,
    offset: target.getBoundingClientRect().top - verticalBounds(port).start,
    expectedScroll: port.element.scrollTop,
    expectedMax: maxScroll(port.element),
  }));

  function unchanged(clampAllowance = 0): boolean {
    return ports.every(({ element, expectedScroll, expectedMax }) => {
      const max = maxScroll(element);
      const actual = element.scrollTop;
      // A closing panel can shrink this scrollport and clamp its position. Opening
      // content can then grow that same range again before we observe the clamp.
      const tolerance = max < expectedMax ? clampAllowance + 1 : 1;
      return (
        Math.abs(actual - expectedScroll) <= 1 ||
        (actual < expectedScroll && Math.abs(actual - max) <= tolerance)
      );
    });
  }

  function shiftPorts(
    getDelta: (port: AnchoredPort, bounds: DOMRect, viewport: VerticalBounds) => number,
  ): void {
    for (const port of ports) {
      const { element } = port;
      const viewport = verticalBounds(port);
      const delta = getDelta(port, target.getBoundingClientRect(), viewport);
      if (Math.abs(delta) > 0.5) {
        element.scrollTo({ top: element.scrollTop + delta / viewport.scale, behavior: 'instant' });
      }
      port.expectedScroll = element.scrollTop;
      port.expectedMax = maxScroll(element);
    }
  }

  function restore(): void {
    shiftPorts((port, bounds, viewport) => bounds.top - viewport.start - port.offset);
  }

  function keepVisible(): void {
    shiftPorts((_port, bounds, { start, height }) => {
      const end = start + height;
      if (bounds.height > height) {
        return bounds.top < end && bounds.bottom > start ? 0 : bounds.top - start;
      }
      return bounds.top < start ? bounds.top - start : Math.max(0, bounds.bottom - end);
    });
  }

  function watch(cancel: () => void, readClampAllowance?: () => number): () => void {
    const doc = target.ownerDocument;
    // Own scroll compensation while the paired panels change height. Native anchors
    // can follow a different node (such as the footer) and produce a competing delta.
    const resumes = ports
      .filter(({ element }) => 'style' in element)
      .map(({ element }) => suspendNativeAnchor(element));
    const onScroll = (): void => {
      if (!unchanged(readClampAllowance?.())) {
        cancel();
      }
    };
    const surfaces = ports.map((port) => (port.viewport ? doc : port.element));
    const onKeyDown = (event: KeyboardEvent): void => {
      if (
        !event.defaultPrevented &&
        /^(Arrow(?:Up|Down)|Home|End|Page(?:Up|Down))$/.test(event.key)
      ) {
        cancel();
      }
    };
    const onMouseDown: EventListener = (event) => {
      const port = ports.find(
        ({ element, viewport }) => event.currentTarget === (viewport ? doc : element),
      );
      if (port && isScrollbarPress(port, event as MouseEvent)) {
        cancel();
      }
    };
    for (const surface of surfaces) {
      surface.addEventListener('scroll', onScroll);
      // Listen on the owner itself so a shadow boundary cannot retarget a scrollbar press.
      surface.addEventListener('mousedown', onMouseDown, true);
    }
    doc.addEventListener('keydown', onKeyDown);
    doc.addEventListener('wheel', cancel, { capture: true, passive: true });
    doc.addEventListener('touchmove', cancel, { capture: true, passive: true });
    return () => {
      for (const surface of surfaces) {
        surface.removeEventListener('scroll', onScroll);
        surface.removeEventListener('mousedown', onMouseDown, true);
      }
      doc.removeEventListener('keydown', onKeyDown);
      doc.removeEventListener('wheel', cancel, true);
      doc.removeEventListener('touchmove', cancel, true);
      for (const resume of resumes) {
        resume();
      }
    };
  }

  return { unchanged, restore, keepVisible, watch };
}
