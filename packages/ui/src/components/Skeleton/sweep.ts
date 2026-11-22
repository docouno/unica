import { useCallback, useMemo } from 'react';
import type { Ref, RefCallback } from 'react';
import {
  addListenerSafe,
  getLiveView,
  getOwnerDocument,
  isRTL,
  removeListenerSafe,
} from '../../core/dom.js';
import { mergeRefs } from '../../core/mergeRefs.js';

const sweepName = 'unica-skeleton-sweep';
const animationProperty = '--_skeleton-sweep-animation';
const geometryProperties = [
  '--_skeleton-band-width',
  '--_skeleton-sweep-start',
  '--_skeleton-sweep-end',
  '--_skeleton-band-angle',
] as const;
const [bandWidth, sweepStart, sweepEnd, bandAngle] = geometryProperties;
const bandSlope = Math.tan((12 * Math.PI) / 180);

type GeometryProperty = (typeof geometryProperties)[number];
type BrowserWindow = NonNullable<Document['defaultView']>;

interface Sweep {
  readonly end: number;
  readonly add: (node: HTMLElement, animation: CSSAnimation) => void;
  readonly stop: () => void;
}

const sweeps = new WeakMap<Document, Sweep>();

function createSweep(view: BrowserWindow, start: number, duration: number): Sweep {
  const { document } = view;
  const paints = new Map<HTMLElement, CSSAnimation>();
  const visible = new Set<HTMLElement>();
  const initial = new Set<HTMLElement>();
  let frame: number | undefined;

  function schedule(): void {
    if (visible.size || initial.size) {
      frame ??= view.requestAnimationFrame(update);
    }
  }

  function update(): void {
    frame = undefined;
    if (!visible.size && !initial.size) {
      return;
    }
    const { clientWidth, clientHeight } = document.documentElement;
    const band = Math.max(64, Math.min(320, 64 + (clientWidth - 480) * 0.27));
    const middleY = clientHeight / 2;
    const overhang = middleY * bandSlope;
    // Sample the rendered boxes together. A remote CSS selector or a CSSOM edit can
    // move a clipped paint without changing its size or its intersection ratio.
    const changes: { node: HTMLElement; property: GeometryProperty; value: string }[] = [];
    function measure(node: HTMLElement): void {
      const rect = node.getBoundingClientRect();
      const style = view.getComputedStyle(node);
      const borderLeft = parseFloat(style.borderLeftWidth) || 0;
      const borderTop = parseFloat(style.borderTopWidth) || 0;
      const borderBox = style.boxSizing === 'border-box';
      const localWidth = borderBox ? parseFloat(style.width) : node.offsetWidth;
      const localHeight = borderBox ? parseFloat(style.height) : node.offsetHeight;
      const scaleX = rect.width > 0 && localWidth > 0 ? rect.width / localWidth : 1;
      const scaleY = rect.height > 0 && localHeight > 0 ? rect.height / localHeight : 1;
      const rtl = isRTL(node, style);
      const slope = rtl ? bandSlope : -bandSlope;
      const top = rect.top + borderTop * scaleY;
      const offset = (slope * (top - middleY) - rect.left) / scaleX - borderLeft;
      const before = offset - (band + overhang) / scaleX;
      const after = offset + (clientWidth + overhang) / scaleX;
      function queueIfChanged(property: GeometryProperty, value: string): void {
        if (node.style.getPropertyValue(property) !== value) {
          changes.push({ node, property, value });
        }
      }
      queueIfChanged(bandWidth, `${band / scaleX}px`);
      queueIfChanged(sweepStart, `${rtl ? after : before}px`);
      queueIfChanged(sweepEnd, `${rtl ? before : after}px`);
      queueIfChanged(bandAngle, `${Math.atan((slope * scaleY) / scaleX)}rad`);
    }
    for (const node of initial) {
      if (!visible.has(node)) {
        measure(node);
      }
    }
    initial.clear();
    visible.forEach(measure);
    for (const { node, property, value } of changes) {
      node.style.setProperty(property, value);
    }
    schedule();
  }

  const intersection =
    typeof view.IntersectionObserver === 'function'
      ? new view.IntersectionObserver((entries) => {
          for (const entry of entries) {
            const node = entry.target as HTMLElement;
            if (entry.isIntersecting && paints.has(node)) {
              visible.add(node);
            } else {
              visible.delete(node);
            }
          }
          schedule();
        })
      : undefined;

  function clear(node: HTMLElement): void {
    for (const property of geometryProperties) {
      node.style.removeProperty(property);
    }
  }

  function stop(): void {
    sweeps.delete(document);
    intersection?.disconnect();
    if (frame !== undefined) {
      view.cancelAnimationFrame(frame);
      frame = undefined;
    }
    for (const node of paints.keys()) {
      clear(node);
    }
    paints.clear();
    visible.clear();
    initial.clear();
  }

  function add(node: HTMLElement, animation: CSSAnimation): void {
    if (paints.get(node) === animation) {
      return;
    }
    paints.set(node, animation);
    if (intersection) {
      initial.add(node);
      intersection.observe(node);
    } else {
      visible.add(node);
    }
    animation.startTime = start;
    schedule();

    const remove = (): void => {
      if (paints.get(node) !== animation) {
        return;
      }
      intersection?.unobserve(node);
      paints.delete(node);
      visible.delete(node);
      initial.delete(node);
      clear(node);
      if (!paints.size) {
        stop();
      }
    };
    void animation.finished.then(remove, remove);
  }

  return { end: start + duration, add, stop };
}

function attachSweep(root: HTMLElement): () => void {
  const ownerDocument = getOwnerDocument(root);
  if (!ownerDocument) {
    return () => {};
  }
  const doc: Document = ownerDocument;
  const view = getLiveView(doc);
  function onStart(event: AnimationEvent): void {
    const node = event.target;
    if (!view || event.animationName !== sweepName || !(node instanceof view.HTMLElement)) {
      return;
    }
    const animation = node
      .getAnimations({ subtree: true })
      .find(
        (candidate): candidate is CSSAnimation =>
          'animationName' in candidate && candidate.animationName === sweepName,
      );
    const duration = animation?.effect?.getComputedTiming().endTime;
    const now = doc.timeline.currentTime;
    if (!animation || typeof duration !== 'number' || duration <= 0 || typeof now !== 'number') {
      return;
    }

    let sweep = sweeps.get(doc);
    if (!sweep || now >= sweep.end) {
      sweep?.stop();
      const start = typeof animation.startTime === 'number' ? animation.startTime : now;
      sweep = createSweep(view, start, duration);
      sweeps.set(doc, sweep);
    }
    sweep.add(node, animation);
  }

  addListenerSafe(root, 'animationstart', onStart);
  root.style.setProperty(animationProperty, sweepName);
  return () => {
    root.style.removeProperty(animationProperty);
    removeListenerSafe(root, 'animationstart', onStart);
  };
}

export function useSkeletonSweep<T extends HTMLElement>(ref: Ref<T> | undefined): RefCallback<T> {
  const attach = useCallback((node: T | null) => (node ? attachSweep(node) : undefined), []);
  return useMemo(() => mergeRefs(attach, ref), [attach, ref]);
}
