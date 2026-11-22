import {
  composedAncestors,
  composedContains,
  getComputedStyleSafe,
  getDocumentElement,
  getLiveView,
  getNamespaceURI,
  getShadowRootSafe,
  isElementNode,
  matchesSafe,
} from '../../core/dom.js';
import type { PointerPosition } from '../../core/pointer-proximity.js';

interface Bounds {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

interface ClipAncestor {
  readonly element: Element;
  readonly horizontal: boolean;
  readonly vertical: boolean;
}

type OutOfFlowPosition = 'absolute' | 'fixed';
type LightMeasurement = LightSample | 'blocked' | null;

export interface LightSample extends PointerPosition {
  readonly strength: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function within(point: PointerPosition, bounds: Bounds): PointerPosition {
  return {
    x: clamp(point.x, bounds.left, bounds.right),
    y: clamp(point.y, bounds.top, bounds.bottom),
  };
}

function inset(bounds: Bounds, distance: number): Bounds {
  return {
    left: bounds.left + distance,
    right: bounds.right - distance,
    top: bounds.top + distance,
    bottom: bounds.bottom - distance,
  };
}

function distance(a: PointerPosition, b: PointerPosition): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function nearestFacePoint(
  point: PointerPosition,
  visible: Bounds,
  face: Bounds,
  radius: number,
): PointerPosition | null {
  const nearest = within(point, visible);
  const center = within(nearest, inset(face, radius));
  const fromCenter = distance(nearest, center);
  if (fromCenter <= radius) {
    return nearest;
  }

  const ratio = radius / fromCenter;
  const edge = {
    x: center.x + (nearest.x - center.x) * ratio,
    y: center.y + (nearest.y - center.y) * ratio,
  };
  const constrained = within(edge, visible);
  if (constrained.x === edge.x && constrained.y === edge.y) {
    return edge;
  }

  // A scrollport can cut across the curved edge. Find the intersection with
  // the clipped side rather than probing an invisible corner or the center.
  const origin = within(center, visible);
  if (distance(origin, center) >= radius) {
    return null;
  }
  const vertical = constrained.x !== edge.x;
  const offset = vertical ? constrained.x - center.x : constrained.y - center.y;
  const length = Math.sqrt(Math.max(0, radius * radius - offset * offset));
  return within(
    vertical
      ? { x: constrained.x, y: center.y + Math.sign(nearest.y - center.y) * length }
      : { x: center.x + Math.sign(nearest.x - center.x) * length, y: constrained.y },
    visible,
  );
}

function clips(overflow: string): boolean {
  return (
    overflow === 'hidden' || overflow === 'auto' || overflow === 'scroll' || overflow === 'clip'
  );
}

function hasEffect(value: string): boolean {
  return Boolean(value && value !== 'none');
}

function establishesContainingBlock(
  style: CSSStyleDeclaration,
  position: OutOfFlowPosition,
): boolean {
  if (style.display === 'contents') {
    return false;
  }
  if (position === 'absolute' && style.position !== 'static') {
    return true;
  }

  const willChange = style.willChange.split(',').map((property) => property.trim());
  if (
    hasEffect(style.filter) ||
    hasEffect(style.backdropFilter) ||
    willChange.includes('filter') ||
    willChange.includes('backdrop-filter')
  ) {
    return true;
  }
  // Filters still apply to an ordinary inline box. Transforms and layout or
  // paint containment require a transformable box in this ancestor chain.
  return (
    style.display !== 'inline' &&
    !/^table-column(?:-group)?$/.test(style.display) &&
    ([style.transform, style.translate, style.rotate, style.scale, style.perspective].some(
      hasEffect,
    ) ||
      style.transformStyle === 'preserve-3d' ||
      style.contentVisibility === 'auto' ||
      /(?:^| )(?:layout|paint|content|strict)(?: |$)/.test(style.contain) ||
      willChange.some((property) =>
        /^(?:transform|translate|rotate|scale|perspective)$/.test(property),
      ))
  );
}

function clippingAncestors(
  element: HTMLElement,
  viewport: Element,
  doc: Document,
): ClipAncestor[] | null {
  const view = getLiveView(doc);
  const descriptor = view
    ? Object.getOwnPropertyDescriptor(view.HTMLElement.prototype, 'offsetParent')
    : undefined;
  const readOffsetParent: unknown = descriptor && Reflect.get(descriptor, 'get');
  const ancestors: ClipAncestor[] = [];
  let clipStartsAt: Element | OutOfFlowPosition | undefined;
  for (const ancestor of composedAncestors(element)) {
    const style = getComputedStyleSafe(ancestor);
    if (style?.opacity === '0' || style?.contentVisibility === 'hidden') {
      return null;
    }
    if (
      ancestor === clipStartsAt ||
      (typeof clipStartsAt === 'string' && style && establishesContainingBlock(style, clipStartsAt))
    ) {
      clipStartsAt = undefined;
    }
    if (clipStartsAt === undefined && style && style.display !== 'contents') {
      if (ancestor !== element && ancestor !== viewport && style.display !== 'inline') {
        const paint = /(?:^| )(?:paint|content|strict)(?: |$)/.test(style.contain);
        const horizontal = paint || clips(style.overflowX);
        const vertical = paint || clips(style.overflowY);
        if (horizontal || vertical) {
          ancestors.push({ element: ancestor, horizontal, vertical });
        }
      }
      if (
        (style.position === 'fixed' || style.position === 'absolute') &&
        getNamespaceURI(ancestor) === 'http://www.w3.org/1999/xhtml'
      ) {
        // Overflow follows the containing block chain. A positioned box can
        // escape intermediate scrollports, including when its block is the viewport.
        const offsetParent: unknown =
          typeof readOffsetParent === 'function'
            ? Reflect.apply(readOffsetParent, ancestor, [])
            : null;
        const zoom = ancestor.currentCSSZoom;
        // CSSOM can report a zoom boundary as offsetParent. Older Safari can
        // also report null for a fixed box with a containing ancestor.
        clipStartsAt =
          isElementNode(offsetParent) &&
          Number.isFinite(zoom) &&
          offsetParent.currentCSSZoom === zoom
            ? offsetParent
            : style.position;
      }
    }
    if (matchesSafe(ancestor, ':popover-open') || matchesSafe(ancestor, ':modal')) {
      break;
    }
  }
  return ancestors;
}

function clipToAncestors(bounds: Bounds, ancestors: readonly ClipAncestor[]): Bounds {
  let { left, right, top, bottom } = bounds;
  for (const { element, horizontal, vertical } of ancestors) {
    const clip = element.getBoundingClientRect();
    const { offsetWidth, offsetHeight } = element as HTMLElement;
    const scaleX = offsetWidth ? clip.width / offsetWidth : 1;
    const scaleY = offsetHeight ? clip.height / offsetHeight : 1;
    const x = clip.left + element.clientLeft * scaleX;
    const y = clip.top + element.clientTop * scaleY;
    if (horizontal) {
      left = Math.max(left, x);
      right = Math.min(right, x + element.clientWidth * scaleX);
    }
    if (vertical) {
      top = Math.max(top, y);
      bottom = Math.min(bottom, y + element.clientHeight * scaleY);
    }
  }
  return { left, right, top, bottom };
}

function hitFace(element: HTMLElement, doc: Document, x: number, y: number): boolean {
  let hit = doc.elementFromPoint?.(x, y) ?? null;
  while (hit) {
    if (composedContains(element, hit)) {
      return true;
    }
    const inner = getShadowRootSafe(hit)?.elementFromPoint?.(x, y);
    if (!inner || inner === hit) {
      break;
    }
    hit = inner;
  }
  return false;
}

function faceInHitStack(
  element: HTMLElement,
  root: Document | ShadowRoot,
  x: number,
  y: number,
  visited: Set<Document | ShadowRoot>,
): boolean {
  if (visited.has(root)) {
    return false;
  }
  visited.add(root);
  return (root.elementsFromPoint?.(x, y) ?? []).some((hit) => {
    if (composedContains(element, hit)) {
      return true;
    }
    const shadow = getShadowRootSafe(hit);
    return shadow !== null && faceInHitStack(element, shadow, x, y, visited);
  });
}

export function measureButtonLight(
  element: HTMLElement,
  doc: Document,
  pointer: PointerPosition,
  reach: number,
): LightMeasurement {
  const rect = element.getBoundingClientRect();
  const width = element.offsetWidth;
  const height = element.offsetHeight;
  if (!rect.width || !rect.height || !width || !height) {
    return 'blocked';
  }

  // The workbench scales the artboard. Compute distance and spot coordinates
  // in the unscaled button coordinate space.
  const scaleX = rect.width / width;
  const scaleY = rect.height / height;
  const point = { x: (pointer.x - rect.left) / scaleX, y: (pointer.y - rect.top) / scaleY };
  const face = { left: 0, right: width, top: 0, bottom: height };
  if (distance(point, within(point, face)) >= reach) {
    return null;
  }

  const viewport = getDocumentElement(doc);
  const ancestors = viewport && clippingAncestors(element, viewport, doc);
  if (!viewport || !ancestors) {
    return 'blocked';
  }
  const bounds = {
    left: Math.max(0, rect.left),
    right: Math.min(viewport.clientWidth, rect.right),
    top: Math.max(0, rect.top),
    bottom: Math.min(viewport.clientHeight, rect.bottom),
  };
  const radius = Math.min(
    width / 2,
    height / 2,
    Number.parseFloat(getComputedStyleSafe(element)?.borderTopLeftRadius ?? '') || 0,
  );

  function measure(target: Bounds, checkCover = false): LightMeasurement | 'miss' {
    if (target.right <= target.left || target.bottom <= target.top) {
      return 'blocked';
    }
    const visible = {
      left: (target.left - rect.left) / scaleX,
      right: (target.right - rect.left) / scaleX,
      top: (target.top - rect.top) / scaleY,
      bottom: (target.bottom - rect.top) / scaleY,
    };
    const edge = nearestFacePoint(point, visible, face, radius);
    if (!edge) {
      return 'blocked';
    }
    const strength = 1 - distance(point, edge) / reach;
    if (strength <= 0) {
      return null;
    }

    const padding = Math.min(
      0.5,
      (visible.right - visible.left) / 4,
      (visible.bottom - visible.top) / 4,
    );
    const probe = nearestFacePoint(
      point,
      inset(visible, padding),
      inset(face, padding),
      Math.max(0, radius - padding),
    );
    if (!probe) {
      return 'blocked';
    }
    const x = rect.left + probe.x * scaleX;
    const y = rect.top + probe.y * scaleY;
    if (hitFace(element, doc, x, y)) {
      return { ...point, strength };
    }
    // A lower hit at the same point proves that an overlay covers the edge.
    return checkCover && faceInHitStack(element, doc, x, y, new Set()) ? 'blocked' : 'miss';
  }

  // Start at the viewport edge and use scrollport geometry only for a clipped probe.
  const direct = measure(bounds, ancestors.length > 0);
  if (direct !== 'miss') {
    return direct;
  }
  const clipped = clipToAncestors(bounds, ancestors);
  if (
    clipped.left === bounds.left &&
    clipped.right === bounds.right &&
    clipped.top === bounds.top &&
    clipped.bottom === bounds.bottom
  ) {
    return 'blocked';
  }
  const fallback = measure(clipped);
  return fallback === 'miss' ? 'blocked' : fallback;
}
