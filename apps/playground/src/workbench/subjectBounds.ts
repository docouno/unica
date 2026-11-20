import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

interface NaturalSize {
  readonly width: number;
  readonly height: number;
}

interface MeasuredSubject {
  readonly element: Element;
  readonly rect: DOMRect;
  readonly occupied: DOMRect;
  readonly nativeHost: Element | undefined;
}

const layerClass = 'wb-bounds-layer';
const subjectSelector = '[data-wb-subject]';
const outlineThickness = 2;
const labelGap = 3;

function matchesIfSupported(element: Element, selector: string): boolean {
  try {
    return element.matches(selector);
  } catch {
    return false;
  }
}

function nativeLayer(subject: Element, scope: HTMLElement): Element | undefined {
  let element: Element | null = subject;
  while (element && element !== scope) {
    if (
      (element.hasAttribute('popover') && matchesIfSupported(element, ':popover-open')) ||
      (element.tagName === 'DIALOG' && matchesIfSupported(element, ':modal'))
    ) {
      return element;
    }
    element = element.parentElement;
  }
  return undefined;
}

function createLayer(host: Element, inTopLayer: boolean): HTMLDivElement {
  const layer = document.createElement('div');
  layer.className = layerClass;
  layer.toggleAttribute('data-wb-native-layer', inTopLayer);
  layer.setAttribute('aria-hidden', 'true');
  if (inTopLayer) {
    layer.setAttribute('popover', 'manual');
  }
  host.append(layer);
  if (inTopLayer && typeof layer.showPopover === 'function') {
    // A separate top-layer box stays outside the panel's clipping and scroll dimensions.
    layer.showPopover();
  }
  return layer;
}

function occupiedRect(element: Element, rect: DOMRect, style: CSSStyleDeclaration): DOMRect {
  const extendsInline = style.overflowX === 'visible';
  const extendsBlock = style.overflowY === 'visible';
  if (!extendsInline && !extendsBlock) {
    return rect;
  }

  // Badges and tightly set inline text can paint outside the measured border box.
  const range = document.createRange();
  range.selectNodeContents(element);
  const contents = range.getBoundingClientRect();
  if (contents.width === 0 || contents.height === 0) {
    return rect;
  }
  const left = extendsInline ? Math.min(rect.left, contents.left) : rect.left;
  const right = extendsInline ? Math.max(rect.right, contents.right) : rect.right;
  const top = extendsBlock ? Math.min(rect.top, contents.top) : rect.top;
  const bottom = extendsBlock ? Math.max(rect.bottom, contents.bottom) : rect.bottom;
  return new DOMRect(left, top, right - left, bottom - top);
}

function addOutline(
  layer: HTMLDivElement,
  layerRect: DOMRect,
  scale: number,
  rect: DOMRect,
  naturalSize: NaturalSize,
): HTMLSpanElement {
  const outline = document.createElement('div');
  outline.className = 'wb-bounds-outline';
  outline.style.left = `${(rect.left - layerRect.left) / scale}px`;
  outline.style.top = `${(rect.top - layerRect.top) / scale}px`;
  outline.style.width = `${rect.width / scale}px`;
  outline.style.height = `${rect.height / scale}px`;
  outline.style.outlineWidth = `${outlineThickness / scale}px`;
  outline.style.outlineOffset = `${-outlineThickness / (2 * scale)}px`;

  const label = document.createElement('span');
  label.setAttribute('data-wb-bounds-label', '');
  label.style.scale = String(1 / scale);
  label.textContent = `${Math.round(naturalSize.width)} × ${Math.round(naturalSize.height)} px`;
  outline.append(label);
  layer.append(outline);
  return label;
}

function labelPosition(
  subject: DOMRect,
  label: DOMRect,
  layer: DOMRect,
  occupied: readonly DOMRect[],
): DOMRect {
  // Try the subject's own edges first, then gaps left by neighboring subjects and labels.
  const rightLimit = Math.max(layer.left, layer.right - label.width);
  const constrainLeft = (left: number): number => Math.max(layer.left, Math.min(left, rightLimit));
  const lefts = new Set([
    constrainLeft(subject.left),
    layer.left,
    rightLimit,
    ...occupied.flatMap((rect) => [
      constrainLeft(rect.left - label.width - labelGap),
      constrainLeft(rect.right + labelGap),
    ]),
  ]);
  const tops = new Set([
    subject.top - label.height - labelGap,
    subject.bottom + labelGap,
    subject.top,
    ...occupied.flatMap((rect) => [rect.top - label.height - labelGap, rect.bottom + labelGap]),
  ]);

  for (const top of tops) {
    if (top < layer.top || top + label.height > layer.bottom) {
      continue;
    }
    for (const left of lefts) {
      if (
        occupied.every(
          (rect) =>
            left + label.width <= rect.left ||
            left >= rect.right ||
            top + label.height <= rect.top ||
            top >= rect.bottom,
        )
      ) {
        return new DOMRect(left, top, label.width, label.height);
      }
    }
  }

  const floatAbove = Math.min(...occupied.map((rect) => rect.top)) - label.height - labelGap;
  const floatBelow = Math.max(...occupied.map((rect) => rect.bottom)) + labelGap;
  const top = subject.top - floatAbove <= floatBelow - subject.bottom ? floatAbove : floatBelow;
  return new DOMRect(constrainLeft(subject.left), top, label.width, label.height);
}

function placeLabels(
  entries: readonly { rect: DOMRect; label: HTMLSpanElement }[],
  layer: DOMRect,
  scale: number,
  occupied: DOMRect[],
): void {
  const measurements = entries.map(({ label }) => label.getBoundingClientRect());
  for (const [index, { rect, label }] of entries.entries()) {
    const position = labelPosition(rect, measurements[index]!, layer, occupied);
    label.style.left = `${(position.left - rect.left) / scale}px`;
    label.style.top = `${(position.top - rect.top) / scale}px`;
    occupied.push(position);
  }
}

export function useSubjectBounds(
  scopeRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  mode: 'all' | 'portaled' = 'all',
): void {
  useLayoutEffect(() => {
    const root = scopeRef.current;
    if (!enabled || !root) {
      return;
    }
    const scope = root;

    const sizes = new WeakMap<Element, NaturalSize>();
    const observed = new Set<Element>();
    const moving = new Set<Element>();
    let nativeHosts = new Set<Element>();
    let layer: HTMLDivElement | undefined;
    let frame = 0;

    const schedule = (): void => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(draw);
      }
    };
    const resize =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver((entries) => {
            for (const { target, borderBoxSize } of entries) {
              const box = borderBoxSize?.[0];
              if (!box || box.inlineSize === 0 || box.blockSize === 0 || !observed.has(target)) {
                continue;
              }
              const isVertical = /^(vertical|sideways)/.test(getComputedStyle(target).writingMode);
              sizes.set(target, {
                width: isVertical ? box.blockSize : box.inlineSize,
                height: isVertical ? box.inlineSize : box.blockSize,
              });
            }
            schedule();
          })
        : undefined;

    function draw(): void {
      frame = 0;
      const found = [...scope.querySelectorAll(subjectSelector)];
      const subjects = new Set(
        mode === 'portaled'
          ? found.filter((element) => !element.closest('.wb-inspector-preview'))
          : found,
      );
      const samples: MeasuredSubject[] = [];
      const nextNativeHosts = new Set<Element>();
      const artboardScale =
        Number(getComputedStyle(scope).getPropertyValue('--wb-viewport-scale')) || 1;
      for (const subject of observed) {
        if (subjects.has(subject)) {
          continue;
        }
        resize?.unobserve(subject);
        observed.delete(subject);
      }

      for (const subject of subjects) {
        if (!observed.has(subject)) {
          resize?.observe(subject, { box: 'border-box' });
          observed.add(subject);
        }
        const rect = subject.getBoundingClientRect();
        const style = getComputedStyle(subject);
        if (rect.width === 0 || rect.height === 0 || style.visibility !== 'visible') {
          continue;
        }

        const closedPopover = subject.closest('[popover]');
        if (closedPopover && !matchesIfSupported(closedPopover, ':popover-open')) {
          continue;
        }

        const nativeHost = nativeLayer(subject, scope);
        if (nativeHost) {
          nextNativeHosts.add(nativeHost);
        }
        samples.push({
          element: subject,
          rect,
          occupied: occupiedRect(subject, rect, style),
          nativeHost,
        });
      }

      if (samples.length) {
        // One viewport layer keeps a native panel and its trigger in the same coordinate space.
        const inTopLayer = nextNativeHosts.size > 0;
        const needsPromotion = [...nextNativeHosts].some((host) => !nativeHosts.has(host));
        if (!layer || layer.hasAttribute('data-wb-native-layer') !== inTopLayer || needsPromotion) {
          layer?.remove();
          layer = createLayer(scope, inTopLayer);
        }
        const activeLayer = layer;
        activeLayer.replaceChildren();
        const layerRect = activeLayer.getBoundingClientRect();
        const scale = inTopLayer ? 1 : artboardScale;
        const entries = samples.map(({ element, rect, nativeHost }) => {
          const subjectScale = nativeHost ? 1 : artboardScale;
          const size =
            sizes.get(element) ??
            (element instanceof HTMLElement
              ? { width: element.offsetWidth, height: element.offsetHeight }
              : { width: rect.width / subjectScale, height: rect.height / subjectScale });
          return { rect, label: addOutline(activeLayer, layerRect, scale, rect, size) };
        });
        placeLabels(
          entries,
          layerRect,
          scale,
          samples.map(({ occupied }) => occupied),
        );
      } else {
        layer?.remove();
        layer = undefined;
      }
      nativeHosts = nextNativeHosts;
      for (const element of moving) {
        const active =
          element.isConnected &&
          element
            .getAnimations()
            .some(
              (animation) =>
                animation.playState === 'running' &&
                animation.effect?.getTiming().iterations !== Infinity,
            );
        if (!active) {
          moving.delete(element);
        }
      }
      if (moving.size) {
        schedule();
      }
    }

    const watch = new MutationObserver((mutations) => {
      if (
        mutations.some(({ target, addedNodes, removedNodes }) => {
          if (target instanceof Element && target.closest(`.${layerClass}`)) {
            return false;
          }
          const moved = [...addedNodes, ...removedNodes];
          return (
            moved.length === 0 ||
            moved.some((node) => !(node instanceof Element && node.classList.contains(layerClass)))
          );
        })
      ) {
        schedule();
      }
    });

    watch.observe(scope, { attributes: true, childList: true, characterData: true, subtree: true });
    resize?.observe(scope);
    const viewport = scope.closest('.wb-viewport-host');
    if (viewport) {
      resize?.observe(viewport);
    }
    const artboard = scope.closest('.wb-artboard');
    if (artboard && artboard !== scope) {
      watch.observe(artboard, { attributes: true });
    }
    const onToggle = (event: Event): void => {
      if (!(event.target instanceof Element) || !event.target.classList.contains(layerClass)) {
        schedule();
      }
    };
    const onBeforeToggle = (event: ToggleEvent): void => {
      if (event.newState === 'open' && event.target instanceof Element) {
        nativeHosts.delete(event.target);
      }
    };
    const onMotionStart = (event: Event): void => {
      const target = event.target;
      if (
        target instanceof Element &&
        typeof target.getAnimations === 'function' &&
        (target.matches(subjectSelector) || target.querySelector(subjectSelector))
      ) {
        moving.add(target);
        schedule();
      }
    };
    scope.addEventListener('toggle', onToggle, true);
    scope.addEventListener('beforetoggle', onBeforeToggle, true);
    scope.addEventListener('animationstart', onMotionStart, true);
    scope.addEventListener('transitionrun', onMotionStart, true);
    const motionEvents = ['animationend', 'animationcancel', 'transitionend', 'transitioncancel'];
    for (const event of motionEvents) {
      scope.addEventListener(event, schedule, true);
    }
    const onScroll = (event: Event): void => {
      const target = event.target;
      if (
        target === document ||
        target === window ||
        (target instanceof Element && (scope.contains(target) || target.contains(scope)))
      ) {
        schedule();
      }
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', schedule);
    draw();

    return () => {
      window.cancelAnimationFrame(frame);
      resize?.disconnect();
      watch.disconnect();
      scope.removeEventListener('toggle', onToggle, true);
      scope.removeEventListener('beforetoggle', onBeforeToggle, true);
      scope.removeEventListener('animationstart', onMotionStart, true);
      scope.removeEventListener('transitionrun', onMotionStart, true);
      for (const event of motionEvents) {
        scope.removeEventListener(event, schedule, true);
      }
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', schedule);
      layer?.remove();
    };
  }, [enabled, mode, scopeRef]);
}
