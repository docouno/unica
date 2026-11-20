import { autoUpdate, computePosition, flip, offset, platform, shift, size } from '@floating-ui/dom';
import type { Placement } from '@floating-ui/dom';

type Side = 'top' | 'bottom' | 'start' | 'end';
type Align = 'start' | 'center' | 'end';

interface AnchoredOverlay {
  readonly anchor: HTMLElement;
  readonly floating: HTMLElement;
  readonly side: Side;
  readonly align: Align;
  readonly gap: number;
}

const updates = new WeakMap<HTMLElement, () => void>();

/** Bind an already open, in-place popover to its anchor. */
export function positionOverlay({
  anchor,
  floating,
  side,
  align,
  gap,
}: AnchoredOverlay): () => void {
  updates.get(floating)?.();
  const document = anchor.ownerDocument;
  const view = document.defaultView;
  if (!view) {
    return () => {};
  }

  const { style } = floating;
  const margin = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
  const inset = ['top', 'right', 'bottom', 'left'];
  const properties = [
    'position',
    ...(style.getPropertyValue('margin') ? ['margin'] : margin),
    ...(style.getPropertyValue('inset') ? ['inset'] : inset),
    '--anchor-width',
    '--overlay-available-height',
  ];
  const original = properties.map((property) => ({
    property,
    value: style.getPropertyValue(property),
    priority: style.getPropertyPriority(property),
  }));
  const surface = floating.getAttribute('data-surface');
  floating.dataset.surface = 'overlay';
  style.position = 'fixed';
  style.margin = '0';
  style.inset = '0 auto auto 0';

  let active = true;
  let revision = 0;
  const update = (): void => {
    const current = ++revision;
    const valid = (): boolean =>
      active &&
      current === revision &&
      anchor.isConnected &&
      floating.isConnected &&
      anchor.ownerDocument === document &&
      floating.ownerDocument === document &&
      floating.matches(':popover-open');
    if (!valid()) {
      return;
    }
    const rtl = view.getComputedStyle(anchor).direction === 'rtl';
    const physical =
      side === 'start'
        ? rtl
          ? 'right'
          : 'left'
        : side === 'end'
          ? rtl
            ? 'left'
            : 'right'
          : side;
    const placement: Placement = align === 'center' ? physical : `${physical}-${align}`;

    let availableHeight = 0;
    let anchorWidth = 0;
    void computePosition(anchor, floating, {
      placement,
      strategy: 'fixed',
      // A local direction override on the floating surface must not flip the anchor's alignment.
      platform: { ...platform, isRTL: () => rtl },
      middleware: [
        offset(gap),
        flip(),
        shift(),
        size({
          apply({ availableHeight: height, rects }) {
            availableHeight = Math.max(0, height);
            anchorWidth = rects.reference.width;
          },
        }),
      ],
    }).then(
      ({ x, y }) => {
        if (valid()) {
          style.left = `${x}px`;
          style.top = `${y}px`;
          style.setProperty('--anchor-width', `${anchorWidth}px`);
          style.setProperty('--overlay-available-height', `${availableHeight}px`);
        }
      },
      (error: unknown) => {
        if (valid()) {
          view.reportError(error);
        }
      },
    );
  };

  const stop = autoUpdate(anchor, floating, update);
  const cleanup = (): void => {
    if (!active) {
      return;
    }
    active = false;
    stop();
    updates.delete(floating);
    style.removeProperty('inset');
    style.removeProperty('margin');
    for (const { property, value, priority } of original) {
      style.setProperty(property, value, priority);
    }
    if (surface === null) {
      floating.removeAttribute('data-surface');
    } else {
      floating.setAttribute('data-surface', surface);
    }
  };
  updates.set(floating, cleanup);
  return cleanup;
}
