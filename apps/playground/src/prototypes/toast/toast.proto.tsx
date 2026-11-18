import { Fragment, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, CSSProperties, ReactElement, ReactNode } from 'react';
import {
  BellIcon,
  CaretDownIcon,
  CaretUpIcon,
  CheckCircleIcon,
  InfoIcon,
  WarningIcon,
  XCircleIcon,
  XIcon,
} from '@phosphor-icons/react';
import { Button, IconButton } from '../button/button.proto.js';
import { Divider } from '../divider/divider.proto.js';
import { Icon } from '../icon/icon.proto.js';
import { Spinner } from '../progress/progress.proto.js';
import '../scrollbar/scrollbar.css';
import './toast.css';

export type ToastStatus = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ToastPlacement =
  'bottom-start' | 'bottom-center' | 'bottom-end' | 'top-start' | 'top-center' | 'top-end';
export type ToastPreviewState = 'rest' | 'hover' | 'active' | 'focus';

export interface ToastAction {
  readonly label: string;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly pending?: boolean;
}

export interface ToastCardProps extends Omit<ComponentPropsWithRef<'div'>, 'title'> {
  readonly title: string;
  readonly status?: ToastStatus;
  readonly loading?: boolean;
  readonly icon?: ReactNode;
  readonly action?: ToastAction | undefined;
  readonly actionLayout?: 'auto' | 'below';
  readonly onDismiss?: () => void;
  /** Passive queue metadata; the persistent dock owns expansion. */
  readonly stackSummary?:
    | {
        readonly count: number;
        readonly issues?: number;
      }
    | undefined;
  /** Pinned visual comparisons, never library states. */
  readonly previewControl?: 'action' | 'dismiss';
  readonly previewState?: ToastPreviewState;
  readonly previewFocus?: boolean;
}

// Disposable visual anatomy. The provider and public API are designed in Wave 2.
export function ToastCard({
  title,
  status = 'neutral',
  loading = false,
  icon,
  action,
  actionLayout = 'auto',
  onDismiss,
  stackSummary,
  previewControl,
  previewState,
  previewFocus,
  className = '',
  children,
  style,
  ...props
}: ToastCardProps): ReactElement {
  const id = useId();
  const card = useRef<HTMLDivElement>(null);
  const measure = useRef<HTMLSpanElement>(null);
  const [wrapAction, setWrapAction] = useState(false);
  useLayoutEffect(() => {
    const node = card.current;
    if (!node || !action || children || actionLayout === 'below') {
      return;
    }
    const update = (): void => {
      const actionWidth = node.querySelector<HTMLElement>('.toast-action')?.offsetWidth ?? 0;
      const closeWidth = node.querySelector<HTMLElement>('.toast-dismiss')?.offsetWidth ?? 0;
      const required =
        (measure.current?.scrollWidth ?? 0) + actionWidth + closeWidth + 20 + 24 + 26;
      setWrapAction(required > node.clientWidth);
    };
    const observer = new ResizeObserver(update);
    observer.observe(node);
    update();
    document.fonts?.ready.then(update, () => undefined);
    return () => observer.disconnect();
  }, [action, actionLayout, children, title]);
  const prefix = status === 'neutral' ? 'neutral' : `status-${status}`;
  const Glyph =
    status === 'success'
      ? CheckCircleIcon
      : status === 'warning'
        ? WarningIcon
        : status === 'danger'
          ? XCircleIcon
          : status === 'info'
            ? InfoIcon
            : BellIcon;
  const below = Boolean(children) || actionLayout === 'below' || wrapAction;
  return (
    <div
      ref={card}
      className={`toast-card ${className}`}
      data-surface="overlay"
      data-status={status}
      data-loading={loading || undefined}
      data-action-below={below || undefined}
      data-stack-summary={Boolean(stackSummary) || undefined}
      style={{ '--toast-signal': `var(--${prefix}-signal)`, ...style } as CSSProperties}
      {...props}
    >
      <span ref={measure} className="toast-inline-measure" aria-hidden="true">
        {title}
      </span>
      <span className="toast-glyph" aria-hidden="true">
        {loading ? <Spinner size="inherit" /> : (icon ?? <Icon icon={Glyph} />)}
      </span>
      <div className="toast-copy">
        <div className="toast-title" id={`${id}-title`}>
          {title}
        </div>
        {children && <div className="toast-description">{children}</div>}
      </div>
      {action && (
        <Button
          className="toast-action"
          size="s"
          variant="ghost"
          tone="neutral"
          disabled={action.disabled}
          loading={action.pending ?? false}
          onClick={action.onClick}
          previewState={previewControl === 'action' ? previewState : undefined}
          previewFocus={Boolean(previewControl === 'action' && previewFocus)}
        >
          {action.label}
        </Button>
      )}
      {onDismiss && (
        <IconButton
          className="toast-dismiss"
          icon={XIcon}
          size="s"
          variant="ghost"
          tone="neutral"
          aria-label={`Dismiss: ${title}`}
          onClick={onDismiss}
          previewState={previewControl === 'dismiss' ? previewState : undefined}
          previewFocus={Boolean(previewControl === 'dismiss' && previewFocus)}
        />
      )}
      {stackSummary && (
        <div className="toast-stack-hint">
          <span>
            {stackSummary.count} notifications
            {stackSummary.issues
              ? ` · ${stackSummary.issues} ${stackSummary.issues === 1 ? 'needs' : 'need'} attention`
              : ''}
          </span>
        </div>
      )}
    </div>
  );
}

export function ToastPlate({ depth }: { readonly depth: 1 | 2 }): ReactElement {
  return (
    <div className="toast-plate" data-depth={depth} data-surface="overlay" aria-hidden="true" />
  );
}

export interface ToastDockProps {
  readonly count: number;
  readonly expanded: boolean;
  readonly top?: boolean;
  readonly controls: string;
  readonly onToggle: () => void;
  readonly onDismissAll: () => void;
}

export function ToastDock({
  count,
  expanded,
  top,
  controls,
  onToggle,
  onDismissAll,
}: ToastDockProps): ReactElement {
  const ToggleGlyph = expanded
    ? top
      ? CaretUpIcon
      : CaretDownIcon
    : top
      ? CaretDownIcon
      : CaretUpIcon;
  return (
    <div
      className="toast-dock"
      data-surface="overlay"
      role="group"
      aria-label="Notification actions"
    >
      <Button
        className="toast-dismiss-all"
        variant="ghost"
        tone="neutral"
        size="s"
        aria-label={`Dismiss all ${count} notifications`}
        onClick={onDismissAll}
      >
        Dismiss all
      </Button>
      <Divider orientation="vertical" />
      <IconButton
        className="toast-stack-toggle"
        variant="ghost"
        tone="neutral"
        size="s"
        icon={ToggleGlyph}
        aria-label={`${expanded ? 'Collapse' : 'Expand'} ${count} notifications`}
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onToggle}
      />
    </div>
  );
}

export interface ToastItem extends Omit<ToastCardProps, 'stackSummary' | 'onDismiss'> {
  readonly id: string;
}

export interface ToastViewportProps {
  readonly items: readonly ToastItem[];
  readonly onDismiss: (id: string) => void;
  readonly onDismissAll: () => void;
  readonly placement?: ToastPlacement;
  readonly initialExpanded?: boolean;
  readonly className?: string;
}

function toastSlotStart(row: HTMLElement): number {
  const marker = row.previousElementSibling;
  return marker instanceof HTMLElement ? marker.offsetTop : row.offsetTop;
}

function alignStickyCovers(list: HTMLDivElement): void {
  if (typeof CSSUnitValue === 'undefined' || !list.hasAttribute('data-edge-motion')) {
    return;
  }
  for (const animation of list.getAnimations({ subtree: true })) {
    const timeline = animation.timeline;
    if (
      !(animation instanceof CSSAnimation) ||
      (animation.animationName !== 'toast-cover-start' &&
        animation.animationName !== 'toast-cover-end') ||
      !(animation.effect instanceof KeyframeEffect) ||
      !timeline ||
      !('startOffset' in timeline) ||
      !('endOffset' in timeline) ||
      !(timeline.startOffset instanceof CSSUnitValue) ||
      !(timeline.endOffset instanceof CSSUnitValue)
    ) {
      continue;
    }
    const row = animation.effect.target?.closest<HTMLElement>('.toast-list-item');
    const timelineLength = timeline.endOffset.value - timeline.startOffset.value;
    if (!row || timelineLength <= 0) {
      continue;
    }
    // Chromium can initialise the cover using the opening scroll position.
    // Anchor the interval to the one-pixel marker instead.
    const rowHeight = Number.parseFloat(row.style.getPropertyValue('--toast-row-height'));
    const offset =
      animation.animationName === 'toast-cover-start' ? timelineLength - 1 - rowHeight : 1;
    const startTime = (100 * offset) / timelineLength;
    if (
      !(animation.startTime instanceof CSSUnitValue) ||
      Math.abs(animation.startTime.value - startTime) > 0.0001
    ) {
      animation.startTime = new CSSUnitValue(startTime, 'percent');
    }
  }
}

function keepControlVisible(list: HTMLDivElement, control: HTMLElement): void {
  const row = control.closest<HTMLElement>('.toast-list-item');
  const marker = row?.previousElementSibling;
  const bounds = list.getBoundingClientRect();
  const { paddingBlockStart, paddingBlockEnd } = getComputedStyle(list);
  if (row && marker instanceof HTMLElement) {
    // Use the normal-flow slot at fractional text scales.
    const start = marker.getBoundingClientRect().top - bounds.top + list.scrollTop;
    const end = start + row.getBoundingClientRect().height;
    const min = Math.ceil(end - bounds.height + Number.parseFloat(paddingBlockEnd));
    const max = Math.floor(start - Number.parseFloat(paddingBlockStart));
    if (min <= max) {
      const inset = max - min >= 2 ? 1 : 0;
      list.scrollTop = Math.min(max - inset, Math.max(list.scrollTop, min + inset));
      return;
    }
  }
  const inset = 16;
  const target = control.getBoundingClientRect();
  if (target.top < bounds.top + inset) {
    list.scrollTop += target.top - bounds.top - inset;
  } else if (target.bottom > bounds.bottom - inset) {
    list.scrollTop += target.bottom - bounds.bottom + inset;
  }
}

// Local, bounded viewport for design inspection. Items and operation state are owned above it.
export function ToastViewport({
  items,
  onDismiss,
  onDismissAll,
  placement = 'bottom-end',
  initialExpanded = false,
  className = '',
}: ToastViewportProps): ReactElement | null {
  const [expanded, setExpanded] = useState(initialExpanded);
  const viewport = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const id = useId();
  const grouped = items.length > 1;
  const reading = grouped && expanded;
  const top = placement.startsWith('top');
  const [heldId, setHeldId] = useState<string | null>(null);
  const readingEdge = useRef({ pinned: true, max: 0 });
  const previousNewest = useRef<{ id: string; offset: number } | null>(null);
  useLayoutEffect(() => {
    const node = list.current;
    if (!reading || !node) {
      setExpanded(false);
      return;
    }
    previousNewest.current = null;
    node.scrollTop = top ? 0 : node.scrollHeight;
    readingEdge.current = { pinned: true, max: node.scrollHeight - node.clientHeight };
  }, [reading, top]);
  useLayoutEffect(() => {
    const node = list.current;
    if (!node || !reading) {
      return;
    }
    const rows = [...node.querySelectorAll<HTMLElement>('.toast-list-item')];
    const update = (): void => {
      const { paddingBlockStart, paddingBlockEnd } = getComputedStyle(node);
      const readableHeight =
        node.clientHeight -
        Number.parseFloat(paddingBlockStart) -
        Number.parseFloat(paddingBlockEnd);
      for (const row of rows) {
        const height = row.getBoundingClientRect().height;
        row.toggleAttribute('data-oversized', height > readableHeight);
        const measuredHeight = `${height}px`;
        if (row.style.getPropertyValue('--toast-row-height') !== measuredHeight) {
          row.style.setProperty('--toast-row-height', measuredHeight);
        }
      }
      const max = node.scrollHeight - node.clientHeight;
      // Leave very short scrollports enough room to show text between their edges.
      node.toggleAttribute('data-edge-motion', max > 1 && readableHeight >= 72);
      if (max <= 1) {
        readingEdge.current.pinned = true;
      }
      const newest = top ? rows[0] : rows.at(-1);
      const id = newest?.dataset.toastItem;
      const previous = previousNewest.current;
      const active = document.activeElement;
      const focusedControl =
        active instanceof HTMLElement && active !== node && node.contains(active);
      if (readingEdge.current.pinned && !focusedControl) {
        node.scrollTop = top ? 0 : max;
      } else if (top && previous && id !== previous.id) {
        const formerNewest = rows.find((row) => row.dataset.toastItem === previous.id);
        if (formerNewest) {
          node.scrollTop += toastSlotStart(formerNewest) - previous.offset;
        }
      }
      if (focusedControl) {
        readingEdge.current.pinned = top ? node.scrollTop <= 1 : max - node.scrollTop <= 1;
      }
      previousNewest.current = newest && id ? { id, offset: toastSlotStart(newest) } : null;
      readingEdge.current.max = max;
      alignStickyCovers(node);
    };
    const observer = new ResizeObserver(update);
    observer.observe(node);
    for (const row of rows) {
      observer.observe(row, { box: 'border-box' });
    }
    update();
    return () => observer.disconnect();
  }, [items, reading, top]);
  const changeExpanded = (value: boolean): void => {
    setHeldId(value ? null : (items.at(-1)?.id ?? null));
    setExpanded(value);
    // The same mounted toggle keeps focus and pointer coordinates.
  };
  const dismiss = (itemId: string): void => {
    const cards = [...(viewport.current?.querySelectorAll<HTMLElement>('.toast-card') ?? [])];
    const focusedIndex = cards.findIndex((card) => card.contains(document.activeElement));
    onDismiss(itemId);
    if (items.length <= 2) {
      setExpanded(false);
    }
    if (focusedIndex >= 0) {
      requestAnimationFrame(() => {
        const remaining = [
          ...(viewport.current?.querySelectorAll<HTMLElement>('.toast-card') ?? []),
        ];
        const next = remaining[Math.min(focusedIndex, remaining.length - 1)];
        const target =
          next?.querySelector<HTMLButtonElement>('.toast-dismiss') ??
          viewport.current?.querySelector<HTMLButtonElement>('.toast-dock button');
        target?.focus();
      });
    }
  };
  if (items.length === 0) {
    return null;
  }
  const front = items.find((item) => item.id === heldId) ?? items.at(-1);
  const hiddenIssues = items.filter(
    (item) => item.id !== front?.id && (item.status === 'warning' || item.status === 'danger'),
  ).length;
  const ordered = reading && top ? [...items].reverse() : items;
  const rowTimelines = reading
    ? ordered.map(({ id }) => {
        // Stable CSS identifiers keep earlier rows on the same timeline after an arrival.
        const name = Array.from(id, (character) => character.codePointAt(0)?.toString(16)).join(
          '-',
        );
        return { start: `--toast-start-${name}`, end: `--toast-end-${name}` };
      })
    : [];
  const dock = grouped ? (
    <ToastDock
      count={items.length}
      expanded={reading}
      top={top}
      controls={id}
      onToggle={() => changeExpanded(!reading)}
      onDismissAll={() => {
        setExpanded(false);
        onDismissAll();
      }}
    />
  ) : null;
  return (
    <div
      className={`toast-viewport ${className}`}
      ref={viewport}
      data-placement={placement}
      data-expanded={reading || undefined}
      data-grouped={grouped || undefined}
      role="region"
      aria-label="Notifications"
      onPointerEnter={() => {
        if (!reading) {
          setHeldId(front?.id ?? null);
        }
      }}
      onPointerLeave={() => {
        if (!viewport.current?.contains(document.activeElement)) {
          setHeldId(null);
        }
      }}
      onFocusCapture={() => {
        if (!reading) {
          setHeldId(front?.id ?? null);
        }
      }}
      onBlurCapture={(event) => {
        if (
          !event.currentTarget.contains(event.relatedTarget) &&
          !event.currentTarget.matches(':hover')
        ) {
          setHeldId(null);
        }
      }}
    >
      {top && dock}
      {reading ? (
        <div className="toast-reading">
          <div
            className="toast-list scrollbar-proto"
            id={id}
            ref={list}
            style={
              {
                '--toast-timelines': rowTimelines
                  .flatMap(({ start, end }) => [start, end])
                  .join(', '),
                '--toast-reading-order': ordered.length + 1,
              } as CSSProperties
            }
            tabIndex={0}
            aria-label="Notification list"
            role="group"
            onScroll={(event) => {
              const node = event.currentTarget;
              const { pinned, max: previousMax } = readingEdge.current;
              const max = node.scrollHeight - node.clientHeight;
              // A scroll event can arrive between a size change and its resize notification.
              const stillAtPreviousEnd =
                pinned && max !== previousMax && Math.abs(previousMax - node.scrollTop) <= 1;
              readingEdge.current.pinned = top
                ? node.scrollTop <= 1
                : max - node.scrollTop <= 1 || stillAtPreviousEnd;
            }}
            onFocusCapture={(event) => {
              const node = event.currentTarget;
              const target = event.target;
              if (target !== node && target.matches(':focus-visible')) {
                keepControlVisible(node, target);
              }
            }}
          >
            <div className="toast-track">
              {ordered.map(({ id: itemId, ...item }, index) => (
                <Fragment key={itemId}>
                  <div
                    aria-hidden="true"
                    className="toast-slot-start"
                    style={{ '--toast-slot-timeline': rowTimelines[index]?.start } as CSSProperties}
                  />
                  <div
                    className="toast-list-item"
                    data-toast-item={itemId}
                    data-before-depth={Math.min(index, 3) || undefined}
                    data-after-depth={Math.min(ordered.length - index - 1, 3) || undefined}
                    style={
                      {
                        '--toast-row-start': rowTimelines[index]?.start,
                        '--toast-row-end': rowTimelines[index]?.end,
                        '--toast-before-end': rowTimelines[index - 1]?.end,
                        '--toast-after-start': rowTimelines[index + 1]?.start,
                        '--toast-start-order': index + 1,
                        '--toast-end-order': ordered.length - index,
                      } as CSSProperties
                    }
                  >
                    <div className="toast-leading-cover">
                      <div className="toast-trailing-cover">
                        <div className="toast-projection">
                          <ToastCard {...item} onDismiss={() => dismiss(itemId)} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    aria-hidden="true"
                    className="toast-slot-end"
                    style={{ '--toast-slot-timeline': rowTimelines[index]?.end } as CSSProperties}
                  />
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      ) : front ? (
        <div
          id={id}
          className="toast-stack scrollbar-proto"
          data-plates={grouped ? Math.min(2, items.length - 1) : 0}
        >
          {items.length > 2 && <ToastPlate depth={2} />}
          {grouped && <ToastPlate depth={1} />}
          <ToastCard
            {...front}
            id={`${id}-front`}
            onDismiss={() => dismiss(front.id)}
            stackSummary={
              grouped
                ? {
                    count: items.length,
                    issues: hiddenIssues,
                  }
                : undefined
            }
          />
        </div>
      ) : null}
      {!top && dock}
    </div>
  );
}
