import { useCallback, useRef } from 'react';
import type { Ref, RefCallback } from 'react';
import { mergeRefs } from '../../core/mergeRefs.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

const sweepName = 'unica-skeleton-sweep';
const animationProperty = '--_skeleton-sweep-animation';
const geometryProperties = [
  '--_skeleton-band-width',
  '--_skeleton-band-before',
  '--_skeleton-band-after',
  '--_skeleton-band-angle',
] as const;
const [bandWidth, bandBefore, bandAfter, bandAngle] = geometryProperties;
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

interface Sweep {
  readonly end: number;
  readonly add: (node: HTMLElement, animation: CSSAnimation) => void;
  readonly stop: () => void;
}

const sweeps = new WeakMap<Document, Sweep>();

function createSweep(view: BrowserWindow, start: number, duration: number): Sweep {
  const { document } = view;
  const paints = new Map<HTMLElement, CSSAnimation>();
  const writtenStyles = new WeakMap<HTMLElement, string | null>();
  let layoutParents = new Set<Element>();
  let observed = new Set<Element>();
  let moving: Animation[] = [];
  let layoutDirty = true;
  let motionDirty = true;
  let frame: number | undefined;

  function observeLayout(): void {
    const boxes = new Set<Element>([document.documentElement]);
    const parents = new Set<Element>();
    for (const node of paints.keys()) {
      boxes.add(node);
      // A sibling's intrinsic size can move a placeholder whose own size stays fixed.
      for (
        let parent = node.parentElement;
        parent && !parents.has(parent);
        parent = parent.parentElement
      ) {
        parents.add(parent);
        for (const child of parent.children) {
          boxes.add(child);
        }
      }
    }
    for (const box of observed) {
      if (!boxes.has(box)) {
        resize.unobserve(box);
      }
    }
    for (const box of boxes) {
      if (!observed.has(box)) {
        resize.observe(box);
      }
    }
    observed = boxes;
    layoutParents = parents;
    layoutDirty = false;
    motionDirty = true;
  }

  function readMovingSurfaces(): void {
    const hosts = new Set([...layoutParents, ...paints.keys()]);
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
    if (layoutDirty) {
      observeLayout();
    }
    if (motionDirty) {
      readMovingSurfaces();
    }
    const { clientWidth, clientHeight } = document.documentElement;
    const band = Math.max(64, Math.min(320, 64 + (clientWidth - 480) * 0.27));
    const middleY = clientHeight / 2;
    const overhang = middleY * bandSlope;
    // Read the whole batch before writing. Normal animation frames need no DOM reads.
    const positions = Array.from(paints.keys(), (node) => {
      const rect = node.getBoundingClientRect();
      const style = view.getComputedStyle(node);
      const borderLeft = parseFloat(style.borderLeftWidth) || 0;
      const borderTop = parseFloat(style.borderTopWidth) || 0;
      const borderBox = style.boxSizing === 'border-box';
      const localWidth = borderBox ? parseFloat(style.width) : node.offsetWidth;
      const localHeight = borderBox ? parseFloat(style.height) : node.offsetHeight;
      const scaleX = rect.width > 0 && localWidth > 0 ? rect.width / localWidth : 1;
      const scaleY = rect.height > 0 && localHeight > 0 ? rect.height / localHeight : 1;
      const slope = node.matches(':dir(rtl)') ? bandSlope : -bandSlope;
      const top = rect.top + borderTop * scaleY;
      // Project the viewport band onto the top edge of this paint box.
      const offset = (slope * (top - middleY) - rect.left) / scaleX - borderLeft;
      return {
        node,
        values: [
          [bandWidth, `${band / scaleX}px`],
          [bandBefore, `${offset - (band + overhang) / scaleX}px`],
          [bandAfter, `${offset + (clientWidth + overhang) / scaleX}px`],
          [bandAngle, `${Math.atan((slope * scaleY) / scaleX)}rad`],
        ] as const,
      };
    });
    for (const { node, values } of positions) {
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
    if (moving.some(isPlaying)) {
      schedule();
    }
  }

  function schedule(): void {
    frame ??= view.requestAnimationFrame(update);
  }

  const resize = new view.ResizeObserver(schedule);
  const mutations = new view.MutationObserver((records) => {
    if (records.some(({ type }) => type === 'childList')) {
      layoutDirty = true;
    }
    if (
      records.some(
        ({ target, attributeName }) =>
          attributeName !== 'style' ||
          !(target instanceof view.HTMLElement) ||
          writtenStyles.get(target) !== target.getAttribute('style'),
      )
    ) {
      schedule();
    }
  });
  mutations.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
  });
  function onSurfaceMotion(event: Event): void {
    const { target } = event;
    if (
      target instanceof view.Element &&
      (layoutParents.has(target) || (target instanceof view.HTMLElement && paints.has(target)))
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
  view.addEventListener('resize', schedule);
  view.addEventListener('scroll', schedule, { capture: true, passive: true });
  for (const event of motionEvents) {
    view.addEventListener(event, onSurfaceMotion, true);
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
    mutations.disconnect();
    view.removeEventListener('resize', schedule);
    view.removeEventListener('scroll', schedule, true);
    for (const event of motionEvents) {
      view.removeEventListener(event, onSurfaceMotion, true);
    }
    if (frame !== undefined) {
      view.cancelAnimationFrame(frame);
    }
    for (const node of paints.keys()) {
      clear(node);
    }
    paints.clear();
  }

  function add(node: HTMLElement, animation: CSSAnimation): void {
    if (paints.get(node) === animation) {
      return;
    }
    paints.set(node, animation);
    layoutDirty = true;
    animation.startTime = start;
    schedule();

    const remove = (): void => {
      if (paints.get(node) !== animation) {
        return;
      }
      paints.delete(node);
      clear(node);
      if (paints.size === 0) {
        stop();
      } else {
        layoutDirty = true;
        schedule();
      }
    };
    void animation.finished.then(remove, remove);
  }

  return { end: start + duration, add, stop };
}

function attachSweep(root: HTMLElement): () => void {
  const { ownerDocument } = root;
  const view = ownerDocument.defaultView;
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
    const now = ownerDocument.timeline.currentTime;
    if (!animation || typeof duration !== 'number' || duration <= 0 || typeof now !== 'number') {
      return;
    }

    let sweep = sweeps.get(ownerDocument);
    if (!sweep || now >= sweep.end) {
      sweep?.stop();
      const start = typeof animation.startTime === 'number' ? animation.startTime : now;
      sweep = createSweep(view, start, duration);
      sweeps.set(ownerDocument, sweep);
    }
    sweep.add(node, animation);
  }

  root.addEventListener('animationstart', onStart);
  root.style.setProperty(animationProperty, sweepName);
  return () => {
    root.style.removeProperty(animationProperty);
    root.removeEventListener('animationstart', onStart);
  };
}

export function useSkeletonSweep<T extends HTMLElement>(ref: Ref<T> | undefined): RefCallback<T> {
  const root = useRef<T>(null);
  useIsoLayoutEffect(() => (root.current ? attachSweep(root.current) : undefined), []);
  return useCallback((node: T | null) => mergeRefs(root, ref)(node), [ref]);
}
