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
  const layer = host.ownerDocument.createElement('div');
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
  // A text range includes descendants of clipping boxes, even when their text is invisible.
  const document = element.ownerDocument;
  const view = document.defaultView;
  if (!view) {
    return rect;
  }
  const range = document.createRange();
  let { left, right, top, bottom } = rect;
  for (const child of element.childNodes) {
    range.selectNode(child);
    const contents =
      child instanceof view.Element && !view.getComputedStyle(child).overflow.includes('visible')
        ? child.getBoundingClientRect()
        : range.getBoundingClientRect();
    if (!contents.width || !contents.height) {
      continue;
    }
    if (extendsInline) {
      left = Math.min(left, contents.left);
      right = Math.max(right, contents.right);
    }
    if (extendsBlock) {
      top = Math.min(top, contents.top);
      bottom = Math.max(bottom, contents.bottom);
    }
  }
  return new DOMRect(left, top, right - left, bottom - top);
}

function addOutline(
  layer: HTMLDivElement,
  layerRect: DOMRect,
  scale: number,
  rect: DOMRect,
  naturalSize: NaturalSize,
): HTMLSpanElement {
  const document = layer.ownerDocument;
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
  sample: MeasuredSubject,
  label: DOMRect,
  layer: DOMRect,
  samples: readonly MeasuredSubject[],
  occupied: readonly DOMRect[],
  placed: readonly DOMRect[],
): DOMRect {
  const subject = sample.rect;
  const { width, height } = label;
  const rightLimit = Math.max(layer.left, layer.right - width);
  const constrainLeft = (left: number): number => Math.max(layer.left, Math.min(left, rightLimit));
  const fits = (
    left: number,
    top: number,
    rectangles: readonly DOMRect[],
    tolerance = 0,
  ): boolean => {
    const right = left + width - tolerance;
    const bottom = top + height - tolerance;
    for (const rect of rectangles) {
      if (
        right > rect.left &&
        left + tolerance < rect.right &&
        bottom > rect.top &&
        top + tolerance < rect.bottom
      ) {
        return false;
      }
    }
    return true;
  };
  const above = subject.top - height - labelGap;
  const below = subject.bottom + labelGap;
  const aligned = constrainLeft(subject.left);
  const before = constrainLeft(subject.left - width - labelGap);
  const after = constrainLeft(subject.right + labelGap);
  const lefts = new Set([
    aligned,
    layer.left,
    rightLimit,
    ...occupied.flatMap((rect) => [
      constrainLeft(rect.left - width - labelGap),
      constrainLeft(rect.right + labelGap),
    ]),
  ]);
  const tops = new Set([
    above,
    below,
    subject.top,
    ...occupied.flatMap((rect) => [rect.top - height - labelGap, rect.bottom + labelGap]),
  ]);
  const inLayer = (top: number): boolean => top >= layer.top && top + height <= layer.bottom;
  // A column of narrow subjects leaves room beyond its shared edge.
  if (subject.width < width) {
    const column = samples.filter(({ nativeHost }) => nativeHost === sample.nativeHost);
    const flushLeft = column.every(({ rect }) => Math.abs(rect.left - subject.left) < 1);
    const flushRight = column.every(({ rect }) => Math.abs(rect.right - subject.right) < 1);
    if (flushLeft !== flushRight) {
      const side = flushLeft ? before : after;
      const centered = subject.top + (subject.height - height) / 2;
      // Leave a label and a one-pixel gap for each later row.
      const rowsBelow = column.filter(({ rect }) => rect.top > subject.top).length;
      const latest = layer.bottom - height - rowsBelow * (height + 1);
      const starts = [
        Math.min(centered, latest),
        ...placed.map(({ bottom }) => bottom + 1),
        centered,
        ...tops,
      ];
      for (const top of starts) {
        if (
          top <= subject.bottom + labelGap &&
          top + height >= subject.top - labelGap &&
          inLayer(top) &&
          fits(side, top, occupied)
        ) {
          return new DOMRect(side, top, width, height);
        }
      }
    }
  }
  // A board of tiny targets has no interior space for dimensions. Keep its free gaps available.
  if (samples.some(({ rect }) => rect.height >= height)) {
    for (const [left, top] of [
      [aligned, above],
      [aligned, below],
      [before, subject.top],
      [after, subject.top],
    ] as const) {
      if (inLayer(top) && fits(left, top, occupied)) {
        if (top === below && inLayer(above)) {
          // Keep a free slot above the subject before moving into the row of supporting text.
          for (const candidate of lefts) {
            const center = candidate + width / 2;
            if (
              center >= subject.left &&
              center <= subject.right &&
              fits(candidate, above, occupied)
            ) {
              return new DOMRect(candidate, above, width, height);
            }
          }
        }
        return new DOMRect(left, top, width, height);
      }
    }

    // One pixel between labels leaves room to align each measurement with its own row or column.
    const preferredX = new Set([
      aligned,
      before,
      after,
      constrainLeft(subject.left + (subject.width - width) / 2),
      ...lefts,
      ...placed.flatMap((rect) => [
        constrainLeft(rect.left - width - 1),
        constrainLeft(rect.right + 1),
      ]),
    ]);
    const preferredY = new Set([
      above,
      below,
      subject.top,
      subject.bottom - height,
      subject.top + (subject.height - height) / 2,
      layer.top,
      layer.bottom - height,
      ...tops,
      ...placed.flatMap((rect) => [rect.top - height - 1, rect.bottom + 1]),
    ]);
    const columns = [
      ...new Set([
        ...preferredX,
        ...samples.flatMap(({ occupied }) => [
          constrainLeft(occupied.left - width),
          constrainLeft(occupied.right),
        ]),
      ]),
    ].filter((left) => left <= subject.right + height && left + width >= subject.left - height);
    const rows = [
      ...new Set([
        ...preferredY,
        ...samples.flatMap(({ occupied }) => [occupied.top - height, occupied.bottom]),
      ]),
    ].filter(
      (top) =>
        inLayer(top) && top <= subject.bottom + height && top + height >= subject.top - height,
    );
    // A side can line up with a row even when the label is wider than its subject.
    const candidates = rows
      .flatMap((top) =>
        columns.map((left) => {
          const dx = Math.abs(left + width / 2 - (subject.left + subject.width / 2));
          const dy = Math.abs(top + height / 2 - (subject.top + subject.height / 2));
          return {
            left,
            top,
            touching: !preferredX.has(left) || !preferredY.has(top),
            centered:
              dx <= Math.max(width, subject.width) / 2 ||
              dy <= Math.max(height, subject.height) / 2,
            across: dx < (width + subject.width) / 2 || dy < (height + subject.height) / 2,
            gap: Math.max(
              0,
              subject.left - left - width,
              left - subject.right,
              subject.top - top - height,
              top - subject.bottom,
            ),
            distance: (left - subject.left) ** 2 + (top - subject.top) ** 2,
          };
        }),
      )
      .filter((point) => point.across)
      .sort(
        (a, b) =>
          Number(a.touching) - Number(b.touching) ||
          Number(b.centered) - Number(a.centered) ||
          a.gap - b.gap ||
          a.distance - b.distance,
      );
    let point = candidates.find(
      ({ left, top, touching }) => !touching && fits(left, top, occupied),
    );
    if (!point) {
      // Nested subjects can share their enclosing canvas. Keep unrelated contents unobscured.
      const backgrounds = samples.filter(({ element }) => element.contains(sample.element));
      const foreground = samples
        .filter((entry) => !backgrounds.includes(entry))
        .map((entry) => entry.occupied);
      point = candidates.find(
        ({ left, top, touching }) =>
          fits(left, top, placed) &&
          fits(left, top, foreground, touching ? 1 : 0) &&
          backgrounds.some(({ rect }) => {
            const insideX = left >= rect.left && left + width <= rect.right;
            const insideY = top >= rect.top && top + height <= rect.bottom;
            return (
              (insideX && (insideY || (top <= rect.top && top + height >= rect.bottom))) ||
              (insideY && left <= rect.left && left + width >= rect.right)
            );
          }),
      );
    }
    if (point) {
      return new DOMRect(point.left, point.top, width, height);
    }
  }

  // Small subjects can run out of adjacent space. Keep their contents and earlier labels clear.
  for (const top of tops) {
    if (!inLayer(top)) {
      continue;
    }
    for (const left of lefts) {
      if (fits(left, top, occupied)) {
        return new DOMRect(left, top, width, height);
      }
    }
  }
  const aboveAll = Math.min(...occupied.map((rect) => rect.top)) - height - labelGap;
  const belowAll = Math.max(...occupied.map((rect) => rect.bottom)) + labelGap;
  return new DOMRect(
    aligned,
    subject.top - aboveAll <= belowAll - subject.bottom ? aboveAll : belowAll,
    width,
    height,
  );
}

function placeLabels(
  entries: readonly { sample: MeasuredSubject; label: HTMLSpanElement }[],
  layer: DOMRect,
  scale: number,
  samples: readonly MeasuredSubject[],
): void {
  const placed: DOMRect[] = [];
  const occupied = samples.map((sample) => sample.occupied);
  const measurements = entries.map(({ label }) => label.getBoundingClientRect());
  for (const [index, { sample, label }] of entries.entries()) {
    const { rect } = sample;
    const position = labelPosition(sample, measurements[index]!, layer, samples, occupied, placed);
    occupied.push(position);
    label.style.left = `${(position.left - rect.left) / scale}px`;
    label.style.top = `${(position.top - rect.top) / scale}px`;
    placed.push(position);
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
    const document = scope.ownerDocument;
    const window = document.defaultView;
    if (!window) {
      return;
    }
    const { Element, HTMLElement, MutationObserver, ResizeObserver } = window;
    const styleOf = window.getComputedStyle.bind(window);

    const sizes = new WeakMap<Element, NaturalSize>();
    const observed = new Set<Element>();
    const moving = new Set<Element>();
    let nativeHosts = new Set<Element>();
    let layer: HTMLDivElement | undefined;
    let frame = 0;
    let waitingOnFonts = false;

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
              const isVertical = /^(vertical|sideways)/.test(styleOf(target).writingMode);
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
      const artboardScale = Number(styleOf(scope).getPropertyValue('--wb-viewport-scale')) || 1;
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
        const style = styleOf(subject);
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
        const entries = samples.map((sample) => {
          const { element, rect, nativeHost } = sample;
          const subjectScale = nativeHost ? 1 : artboardScale;
          const size =
            sizes.get(element) ??
            (element instanceof HTMLElement
              ? { width: element.offsetWidth, height: element.offsetHeight }
              : { width: rect.width / subjectScale, height: rect.height / subjectScale });
          return { sample, label: addOutline(activeLayer, layerRect, scale, rect, size) };
        });
        placeLabels(entries, layerRect, scale, samples);
      } else {
        layer?.remove();
        layer = undefined;
      }
      // Inline text can change width without producing a ResizeObserver entry.
      const fonts = scope.ownerDocument.fonts;
      if (samples.length && !waitingOnFonts && fonts?.status === 'loading') {
        waitingOnFonts = true;
        const remeasure = (): void => {
          if (waitingOnFonts) {
            waitingOnFonts = false;
            schedule();
          }
        };
        fonts.ready.then(remeasure, remeasure);
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
      waitingOnFonts = false;
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
