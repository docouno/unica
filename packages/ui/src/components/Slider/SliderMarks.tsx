import { useRef } from 'react';
import type { JSX } from 'react';
import { dataFlag } from '../../core/cx.js';
import type { StyleWithVars } from '../../core/mergeStyle.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import type { SliderScale } from './scale.js';
import type { SliderMark, SliderOrientation } from './types.js';

interface MarksProps {
  readonly marks: readonly SliderMark[];
  readonly scale: SliderScale;
  readonly orientation: SliderOrientation;
}

interface LabelPlacement {
  readonly start: number;
  readonly end: number;
}

function overlaps(a: LabelPlacement, b: LabelPlacement): boolean {
  return a.start < b.end + 4 && a.end + 4 > b.start;
}

function layOutLabels(node: HTMLDivElement, vertical: boolean): void {
  const all = [...node.querySelectorAll<HTMLElement>('.unica-slider-mark-label')];
  if (vertical) {
    // Keep the original compact column for short labels. Only long text asks
    // for more width, limited by the vertical control's available space.
    node.setAttribute('data-unica-slider-measuring', '');
    const width = all.reduce((widest, label) => Math.max(widest, label.offsetWidth + 9), 42);
    node.removeAttribute('data-unica-slider-measuring');
    node.style.setProperty('--_slider-vertical-label-width', `${width}px`);
  }
  const box = node.getBoundingClientRect();
  if (box.width <= 0 || node.clientWidth <= 0) {
    return;
  }

  const zoom = vertical ? box.height / node.clientHeight : box.width / node.clientWidth;
  const mirror =
    !vertical && node.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl'
      ? -1
      : 1;
  for (const label of all) {
    label.removeAttribute('data-unica-slider-suppressed');
    label.style.removeProperty('--_slider-label-shift');
    label.style.removeProperty('--_slider-label-row');
  }
  const labels = all.filter(
    (label) => label.ownerDocument.defaultView?.getComputedStyle(label).visibility !== 'hidden',
  );
  const edges = labels.length > 1 ? [labels[0]!, labels[labels.length - 1]!] : labels;
  const priority = [...(vertical ? [...edges].reverse() : edges), ...labels.slice(1, -1)];
  const occupied: LabelPlacement[] = [];
  let firstHeight = 0;
  let space = 0;
  for (const [index, label] of priority.entries()) {
    const rect = label.getBoundingClientRect();
    const start = vertical ? rect.top : rect.left;
    const length = vertical ? rect.height : rect.width;
    const limit = vertical ? box.bottom : box.right;
    const origin = vertical ? box.top : box.left;
    const anchor = Math.max(origin, Math.min(limit - length, start));
    const placement = { start: anchor, end: anchor + length };
    const intersects = occupied.some((previous) => overlaps(previous, placement));
    if (intersects && index > 1) {
      label.setAttribute('data-unica-slider-suppressed', '');
      continue;
    }
    if (intersects && vertical) {
      placement.start = occupied[0]!.end + 4;
      placement.end = placement.start + length;
    }
    if (placement.start !== start) {
      label.style.setProperty(
        '--_slider-label-shift',
        `${(mirror * (placement.start - start)) / zoom}px`,
      );
    }
    const height = rect.height / zoom;
    if (index === 0) {
      firstHeight = height;
    }
    if (intersects && !vertical) {
      label.style.setProperty('--_slider-label-row', `${firstHeight + 3}px`);
      space = Math.max(space, firstHeight + 3 + height);
    } else {
      occupied.push(placement);
      space = Math.max(space, vertical ? (placement.end - limit) / zoom : height);
    }
  }
  node.style.setProperty('--_slider-label-space', `${space}px`);
}

export function SliderMarks({ marks, scale, orientation }: MarksProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  const vertical = orientation === 'vertical';
  useIsoLayoutEffect(() => {
    const node = ref.current;
    const view = node?.ownerDocument.defaultView;
    if (!node || !view) {
      return;
    }
    const layout = (): void => layOutLabels(node, vertical);
    layout();
    const observer = new view.ResizeObserver(layout);
    observer.observe(node);
    for (const label of node.querySelectorAll('.unica-slider-mark-label')) {
      observer.observe(label);
    }
    return () => observer.disconnect();
  }, [marks, scale, vertical]);

  const firstLabel = marks.findIndex((mark) => mark.label !== undefined);
  const lastLabel = marks.findLastIndex((mark) => mark.label !== undefined);
  return (
    <div className="unica-slider-marks" aria-hidden="true" ref={ref}>
      {marks.map((mark, index) => {
        const position: StyleWithVars = { '--_slider-position': scale.fractionOf(mark.value) };
        const edge =
          mark.value === scale.min ? 'start' : mark.value === scale.maximum ? 'end' : undefined;
        return (
          <span
            key={mark.value}
            className="unica-slider-mark"
            style={position}
            data-unica-slider-edge={edge}
            data-unica-slider-secondary={dataFlag(
              index > firstLabel && index < lastLabel && index % 2 !== 0,
            )}
          >
            <span className="unica-slider-tick" />
            {mark.label !== undefined && (
              <span className="unica-slider-mark-label">
                <bdi>{mark.label}</bdi>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}
