import { useCallback, useMemo } from 'react';
import type { Ref, RefCallback } from 'react';
import {
  addListenerSafe,
  composedContains,
  getAttributeSafe,
  getComposedParentElement,
  getComputedStyleSafe,
  getLiveView,
  getLocalName,
  getOwnerDocument,
  isConnectedNode,
  isElementNode,
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
const positionMotion = new Set([
  'transform',
  'translate',
  'scale',
  'left',
  'right',
  'top',
  'bottom',
  'inset',
  'insetInline',
  'insetInlineStart',
  'insetInlineEnd',
  'insetBlock',
  'insetBlockStart',
  'insetBlockEnd',
  'margin',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
  'marginInline',
  'marginInlineStart',
  'marginInlineEnd',
  'marginBlock',
  'marginBlockStart',
  'marginBlockEnd',
]);

type BrowserWindow = NonNullable<Document['defaultView']>;

function isPlaying(animation: Animation): boolean {
  return animation.pending || animation.playState === 'running';
}

function findDefiningAutoDirAncestor(node: Element): Element | null {
  for (let current: Element | null = node; current; current = getComposedParentElement(current)) {
    const rawDir = getAttributeSafe(current, 'dir');
    if (rawDir !== null) {
      const normalized = rawDir.toLowerCase();
      if (normalized === 'auto') {
        return current;
      }
      if (normalized === 'ltr' || normalized === 'rtl') {
        return null;
      }
    }
    if (getLocalName(current) === 'bdi') {
      return current;
    }
  }
  return null;
}

function collectLayoutChildren(
  container: Element,
  siblings: Set<Element>,
  wrappers: Set<Element>,
): void {
  for (const child of container.children) {
    if (getComputedStyleSafe(child)?.display === 'contents') {
      if (!wrappers.has(child)) {
        wrappers.add(child);
        collectLayoutChildren(child, siblings, wrappers);
      }
    } else {
      siblings.add(child);
    }
  }
}

interface Sweep {
  readonly end: number;
  readonly add: (node: HTMLElement, animation: CSSAnimation) => void;
  readonly stop: () => void;
}

const sweeps = new WeakMap<Document, Sweep>();

function createSweep(view: BrowserWindow, start: number, duration: number): Sweep {
  const { document } = view;
  const paints = new Map<HTMLElement, CSSAnimation>();
  const visiblePaints = new Set<HTMLElement>();
  const measuredOnce = new Set<HTMLElement>();
  const pendingInvisible = new Set<HTMLElement>();
  const writtenStyles = new WeakMap<HTMLElement, string | null>();
  const pendingDisplayChecks = new Set<Element>();
  let visibleLayoutParents = new Set<Element>();
  let contentsWrappers = new Set<Element>();
  let layoutSiblings = new Set<Element>();
  let observedResize = new Set<Element>();
  const pendingInitialResize = new Set<Element>();
  let moving: Animation[] = [];
  let layoutDirty = true;
  let motionDirty = true;
  let frame: number | undefined;

  function observeLayout(): void {
    const parents = new Set<Element>();
    const wrappers = new Set<Element>();
    const siblings = new Set<Element>();
    const autoDirs = new Set<Element>();
    const resizeBoxes = new Set<Element>();

    if (visiblePaints.size > 0 && document.documentElement) {
      resizeBoxes.add(document.documentElement);
    }

    for (const node of visiblePaints) {
      resizeBoxes.add(node);
      const autoDir = findDefiningAutoDirAncestor(node);
      if (autoDir) {
        autoDirs.add(autoDir);
      }
      // A sibling's intrinsic size (including children behind display: contents) can move a placeholder.
      for (
        let parent = getComposedParentElement(node);
        parent && !parents.has(parent);
        parent = getComposedParentElement(parent)
      ) {
        parents.add(parent);
        resizeBoxes.add(parent);
        if (getComputedStyleSafe(parent)?.display === 'contents') {
          wrappers.add(parent);
        }
        collectLayoutChildren(parent, siblings, wrappers);
      }
    }
    for (const sibling of siblings) {
      resizeBoxes.add(sibling);
    }

    for (const box of observedResize) {
      if (!resizeBoxes.has(box)) {
        resize.unobserve(box);
        pendingInitialResize.delete(box);
      }
    }
    for (const box of resizeBoxes) {
      if (!observedResize.has(box)) {
        pendingInitialResize.add(box);
        resize.observe(box);
      }
    }
    observedResize = resizeBoxes;
    visibleLayoutParents = parents;
    contentsWrappers = wrappers;
    layoutSiblings = siblings;

    // Register each unique target once in strict priority order (per DOM Standard, repeated
    // observe() calls on the same target replace earlier options).
    mutations.disconnect();
    if (visiblePaints.size > 0) {
      const registered = new Set<Node>();
      // Priority 1: nearest defining dir="auto" / <bdi> ancestors
      for (const ancestor of autoDirs) {
        if (!registered.has(ancestor)) {
          registered.add(ancestor);
          mutations.observe(ancestor, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
          });
        }
      }
      // Priority 2: (visibleLayoutParents U contentsWrappers) \ autoDirAncestors
      const containers = new Set<Element>([...parents, ...wrappers]);
      for (const container of containers) {
        if (!registered.has(container)) {
          registered.add(container);
          mutations.observe(container, { attributes: true, childList: true });
        }
      }
      // Priority 3: (visiblePaints U layoutSiblings) \ (autoDirAncestors U containers)
      for (const item of [...visiblePaints, ...siblings]) {
        if (!registered.has(item)) {
          registered.add(item);
          mutations.observe(item, { attributes: true });
        }
      }
      // Priority 4: direct Text children of containers outside autoDirAncestors
      for (const container of containers) {
        if (autoDirs.has(container)) {
          continue;
        }
        for (let child = container.firstChild; child; child = child.nextSibling) {
          if (child.nodeType === 3 && !registered.has(child)) {
            registered.add(child);
            mutations.observe(child, { characterData: true });
          }
        }
      }
      // Priority 5: documentElement dir attribute (only when not already covered)
      const docEl = document.documentElement;
      if (docEl && !registered.has(docEl)) {
        registered.add(docEl);
        mutations.observe(docEl, { attributes: true, attributeFilter: ['dir'] });
      }
    }

    layoutDirty = false;
    motionDirty = true;
  }

  function readMovingSurfaces(): void {
    if (visiblePaints.size === 0) {
      moving = [];
      motionDirty = false;
      return;
    }
    const hosts = new Set([...visibleLayoutParents, ...visiblePaints]);
    moving = [...hosts].flatMap((element) =>
      element.getAnimations().filter((animation) => {
        if (
          !isPlaying(animation) ||
          ('animationName' in animation && animation.animationName === sweepName)
        ) {
          return false;
        }
        const { effect } = animation;
        return (
          effect instanceof view.KeyframeEffect &&
          effect
            .getKeyframes()
            .some((keyframe) => Object.keys(keyframe).some((key) => positionMotion.has(key)))
        );
      }),
    );
    motionDirty = false;
  }

  function update(): void {
    frame = undefined;
    if (pendingDisplayChecks.size > 0) {
      for (const el of pendingDisplayChecks) {
        const isContents = isConnectedNode(el) && getComputedStyleSafe(el)?.display === 'contents';
        if (contentsWrappers.has(el) !== isContents) {
          layoutDirty = true;
          break;
        }
      }
      pendingDisplayChecks.clear();
    }
    if (layoutDirty) {
      observeLayout();
    }
    if (motionDirty) {
      readMovingSurfaces();
    }
    if (visiblePaints.size === 0) {
      return;
    }

    const { clientWidth, clientHeight } = document.documentElement;
    const band = Math.max(64, Math.min(320, 64 + (clientWidth - 480) * 0.27));
    const middleY = clientHeight / 2;
    const overhang = middleY * bandSlope;
    // Read the whole batch before writing. Normal animation frames need no DOM reads.
    const positions = Array.from(visiblePaints, (node) => {
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
      // Project the viewport band onto the top edge of this paint box.
      const offset = (slope * (top - middleY) - rect.left) / scaleX - borderLeft;
      const before = `${offset - (band + overhang) / scaleX}px`;
      const after = `${offset + (clientWidth + overhang) / scaleX}px`;
      return {
        node,
        values: [
          [bandWidth, `${band / scaleX}px`],
          [sweepStart, rtl ? after : before],
          [sweepEnd, rtl ? before : after],
          [bandAngle, `${Math.atan((slope * scaleY) / scaleX)}rad`],
        ] as const,
      };
    });
    for (const { node, values } of positions) {
      measuredOnce.add(node);
      let changed = false;
      for (const [property, value] of values) {
        if (node.style.getPropertyValue(property) !== value) {
          node.style.setProperty(property, value);
          changed = true;
        }
      }
      if (changed) {
        writtenStyles.set(node, node.getAttribute('style'));
      }
    }

    if (pendingInvisible.size > 0) {
      let detachedOffscreen = false;
      for (const node of pendingInvisible) {
        if (measuredOnce.has(node) && visiblePaints.delete(node)) {
          detachedOffscreen = true;
        }
      }
      pendingInvisible.clear();
      if (detachedOffscreen) {
        // Keep written --_skeleton-* geometry on offscreen nodes; only stop observing them.
        observeLayout();
        if (motionDirty) {
          readMovingSurfaces();
        }
      }
    }

    if (visiblePaints.size > 0 && moving.some(isPlaying)) {
      schedule();
    }
  }

  function schedule(): void {
    if (visiblePaints.size > 0) {
      frame ??= view.requestAnimationFrame(update);
    }
  }

  const resize = new view.ResizeObserver((entries) => {
    let resized = false;
    for (let index = 0; index < entries.length; index++) {
      const target = entries[index]!.target;
      if (pendingInitialResize.delete(target)) {
        continue;
      }
      resized = true;
    }
    if (resized) {
      schedule();
    }
  });
  const intersection =
    typeof view.IntersectionObserver === 'function'
      ? new view.IntersectionObserver((entries) => {
          let visibilityChanged = false;
          for (let index = 0; index < entries.length; index++) {
            const entry = entries[index]!;
            const node = entry.target as HTMLElement;
            if (!paints.has(node)) {
              continue;
            }
            if (entry.isIntersecting) {
              pendingInvisible.delete(node);
              if (!visiblePaints.has(node)) {
                visiblePaints.add(node);
                visibilityChanged = true;
              }
            } else if (measuredOnce.has(node)) {
              if (visiblePaints.delete(node)) {
                visibilityChanged = true;
              }
            } else {
              // Defer detaching until after the initial geometry write completes.
              pendingInvisible.add(node);
            }
          }
          if (visibilityChanged) {
            layoutDirty = true;
            if (visiblePaints.size > 0) {
              schedule();
            } else {
              if (frame !== undefined) {
                view.cancelAnimationFrame(frame);
                frame = undefined;
              }
              observeLayout();
              moving = [];
            }
          }
        })
      : undefined;

  const mutations = new view.MutationObserver((records) => {
    let shouldSchedule = false;
    for (let index = 0; index < records.length; index++) {
      const record = records[index]!;
      const { type, target, attributeName } = record;
      if (
        type === 'attributes' &&
        attributeName === 'style' &&
        target instanceof view.HTMLElement &&
        paints.has(target) &&
        writtenStyles.get(target) === target.getAttribute('style')
      ) {
        continue;
      }
      shouldSchedule = true;
      if (type === 'childList' || (type === 'attributes' && attributeName === 'dir')) {
        layoutDirty = true;
      } else if (type === 'attributes' && isElementNode(target)) {
        pendingDisplayChecks.add(target);
      }
    }
    if (shouldSchedule) {
      schedule();
    }
  });

  function onScroll(event: Event): void {
    if (visiblePaints.size === 0) {
      return;
    }
    const { target } = event;
    if (target === document || target === view) {
      schedule();
      return;
    }
    if (isElementNode(target)) {
      for (const paint of visiblePaints) {
        if (composedContains(target, paint)) {
          schedule();
          return;
        }
      }
    }
  }

  function onSurfaceMotion(event: Event): void {
    const { target } = event;
    if (
      isElementNode(target) &&
      (visibleLayoutParents.has(target) ||
        (target instanceof view.HTMLElement && visiblePaints.has(target)))
    ) {
      motionDirty = true;
      schedule();
    }
  }

  const motionEvents = [
    'transitionrun',
    'transitionend',
    'transitioncancel',
    'animationstart',
    'animationend',
    'animationcancel',
  ] as const;
  addListenerSafe(view, 'resize', schedule);
  addListenerSafe(view, 'scroll', onScroll, { capture: true, passive: true });
  for (const event of motionEvents) {
    addListenerSafe(view, event, onSurfaceMotion, true);
  }

  function clear(node: HTMLElement): void {
    for (const property of geometryProperties) {
      node.style.removeProperty(property);
    }
    writtenStyles.set(node, node.getAttribute('style'));
  }

  function stop(): void {
    sweeps.delete(document);
    resize.disconnect();
    intersection?.disconnect();
    mutations.disconnect();
    removeListenerSafe(view, 'resize', schedule);
    removeListenerSafe(view, 'scroll', onScroll, true);
    for (const event of motionEvents) {
      removeListenerSafe(view, event, onSurfaceMotion, true);
    }
    if (frame !== undefined) {
      view.cancelAnimationFrame(frame);
      frame = undefined;
    }
    for (const node of paints.keys()) {
      clear(node);
    }
    paints.clear();
    visiblePaints.clear();
    measuredOnce.clear();
    pendingInvisible.clear();
    pendingDisplayChecks.clear();
    visibleLayoutParents.clear();
    contentsWrappers.clear();
    layoutSiblings.clear();
    observedResize.clear();
    pendingInitialResize.clear();
    moving = [];
  }

  function add(node: HTMLElement, animation: CSSAnimation): void {
    if (paints.get(node) === animation) {
      return;
    }
    paints.set(node, animation);
    visiblePaints.add(node);
    pendingInvisible.delete(node);
    intersection?.observe(node);
    layoutDirty = true;
    animation.startTime = start;
    schedule();

    const remove = (): void => {
      if (paints.get(node) !== animation) {
        return;
      }
      intersection?.unobserve(node);
      paints.delete(node);
      visiblePaints.delete(node);
      measuredOnce.delete(node);
      pendingInvisible.delete(node);
      clear(node);
      if (paints.size === 0) {
        stop();
      } else {
        layoutDirty = true;
        if (visiblePaints.size > 0) {
          schedule();
        } else {
          observeLayout();
        }
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
