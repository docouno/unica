import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement, Ref, RefObject } from 'react';
import { XIcon } from '@phosphor-icons/react';
import { Icon } from '../icon/icon.proto.js';
import type { GlyphComponent } from '../icon/icon.proto.js';
import type { DisplayStatus } from '../badge/badge.styles.js';
import { statusStyle } from '../badge/badge.styles.js';
import { Tooltip } from '../menu/menu.proto.js';
import { Spinner } from '../progress/progress.proto.js';
import './tag.css';

export type TagSize = 's' | 'm' | 'l';
export type TagPreviewState = 'hover' | 'active' | 'focus';

export interface TagProps extends Omit<ComponentPropsWithRef<'span'>, 'onClick'> {
  readonly status?: DisplayStatus;
  readonly size?: TagSize;
  readonly iconLeft?: GlyphComponent;
  readonly onRemove: () => void;
  readonly removeLabel: string;
  readonly disabled?: boolean;
  readonly pending?: boolean;
  readonly removeRef?: Ref<HTMLButtonElement>;
  readonly removeTabIndex?: number;
  /** Pins a visual state for comparison; not a future library prop. */
  readonly previewState?: TagPreviewState;
}

// The transparent target reserves space in the flow. Its painted surface is
// smaller, so compact metadata does not become a row of full-height buttons.
export function Tag({
  status = 'neutral',
  size = 'm',
  iconLeft,
  onRemove,
  removeLabel,
  disabled = false,
  pending = false,
  removeRef,
  removeTabIndex,
  previewState,
  className = '',
  style,
  children,
  ...props
}: TagProps): ReactElement {
  const labelRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const touchStartedOnLabel = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(hideTimer.current), []);
  const revealLabel = (): void => {
    clearTimeout(hideTimer.current);
    const label = labelRef.current;
    const tooltip = tooltipRef.current;
    if (!label || !tooltip || label.scrollWidth <= label.clientWidth + 1) {
      return;
    }
    tooltip.showPopover();
    const anchor = label.getBoundingClientRect();
    const bounds = tooltip.getBoundingClientRect();
    tooltip.style.left = `${Math.max(12, Math.min(anchor.left, window.innerWidth - bounds.width - 12))}px`;
    tooltip.style.top = `${anchor.top >= bounds.height + 12 ? anchor.top - bounds.height - 8 : anchor.bottom + 8}px`;
  };
  const hideLabel = (): void => {
    clearTimeout(hideTimer.current);
    tooltipRef.current?.hidePopover();
  };
  return (
    <span
      {...props}
      className={`tag-proto ${className}`}
      data-size={size}
      data-status={status}
      data-disabled={disabled || undefined}
      data-pending={pending || undefined}
      data-preview={previewState}
      style={{ ...statusStyle(status), ...style }}
      onPointerEnter={(event) => {
        if (event.pointerType !== 'touch') {
          revealLabel();
        }
        props.onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        if (!event.currentTarget.querySelector(':focus-visible')) {
          hideTimer.current = setTimeout(hideLabel, 160);
        }
        props.onPointerLeave?.(event);
      }}
      onFocus={(event) => {
        if (event.target.matches(':focus-visible')) {
          revealLabel();
        }
        props.onFocus?.(event);
      }}
      onBlur={(event) => {
        hideLabel();
        props.onBlur?.(event);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && tooltipRef.current?.matches(':popover-open')) {
          hideLabel();
          event.preventDefault();
          event.stopPropagation();
        }
        props.onKeyDown?.(event);
      }}
    >
      {iconLeft && (
        <span className="tag-icon-proto" aria-hidden="true">
          <Icon icon={iconLeft} size={size} />
        </span>
      )}
      <span ref={labelRef} className="tag-label-proto">
        {children}
      </span>
      <button
        ref={removeRef}
        className="tag-remove-proto"
        type="button"
        disabled={disabled}
        aria-label={removeLabel}
        aria-disabled={pending || undefined}
        aria-busy={pending || undefined}
        tabIndex={removeTabIndex}
        onPointerDown={(event) => {
          // Touch browsers may retarget a label-edge tap to the nearest button.
          const label = labelRef.current?.getBoundingClientRect();
          touchStartedOnLabel.current = Boolean(
            event.pointerType === 'touch' &&
            label &&
            event.clientX >= label.left &&
            event.clientX <= label.right &&
            event.clientY >= label.top &&
            event.clientY <= label.bottom,
          );
        }}
        onClick={(event) => {
          const labelTap = touchStartedOnLabel.current && event.detail > 0;
          touchStartedOnLabel.current = false;
          if (!pending && !labelTap) {
            onRemove();
          }
        }}
      >
        <span className="tag-remove-visual-proto" aria-hidden="true">
          {pending ? <Spinner size="inherit" tone="inherit" /> : <Icon icon={XIcon} />}
        </span>
      </button>
      {typeof children === 'string' && (
        <Tooltip
          ref={tooltipRef}
          popover="manual"
          className="tag-full-label-proto"
          aria-hidden="true"
        >
          {children}
        </Tooltip>
      )}
    </span>
  );
}

export interface TagGroupItem {
  readonly id: string;
  readonly label: string;
  readonly removeLabel: string;
  readonly iconLeft?: GlyphComponent;
  readonly status?: DisplayStatus;
  readonly disabled?: boolean;
  readonly pending?: boolean;
}

export interface TagGroupProps extends Omit<ComponentPropsWithRef<'div'>, 'children' | 'onChange'> {
  readonly items: readonly TagGroupItem[];
  readonly label: string;
  readonly onRemove: (id: string) => void;
  readonly size?: TagSize;
  readonly disabled?: boolean;
  readonly maxVisible?: number;
  readonly defaultExpanded?: boolean;
  readonly emptyMessage?: string;
  readonly emptyFocusRef?: RefObject<HTMLElement | null>;
}

// Local preview coordination, not the future public collection/state API.
export function TagGroup({
  items,
  label,
  onRemove,
  size = 'm',
  disabled = false,
  maxVisible,
  defaultExpanded = false,
  emptyMessage = 'No labels',
  emptyFocusRef,
  className = '',
  ref,
  ...props
}: TagGroupProps): ReactElement {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const previousItems = useRef(items);
  const disclosureId = useId();
  const limit = maxVisible === undefined ? items.length : Math.max(1, maxVisible);
  const canExpand = items.length > limit;
  const visible = useMemo(
    () => (expanded ? items : items.slice(0, limit)),
    [expanded, items, limit],
  );
  const available = useMemo(() => {
    const ids = visible.filter((item) => !disabled && !item.disabled).map((item) => item.id);
    if (canExpand) {
      ids.push(disclosureId);
    }
    return ids;
  }, [visible, disabled, canExpand, disclosureId]);
  const tabStop = activeId && available.includes(activeId) ? activeId : available[0];

  const focus = (id: string | undefined): void => {
    if (id) {
      setActiveId(id);
      buttons.current.get(id)?.focus();
    } else {
      (emptyFocusRef?.current ?? root.current)?.focus();
    }
  };

  useLayoutEffect(() => {
    const old = previousItems.current;
    const removed = old.filter((item) => !items.some((current) => current.id === item.id));
    if (removed.length) {
      setAnnouncement(`${removed.map((item) => item.label).join(', ')} removed.`);
      // Do not retrieve focus if someone moved elsewhere while waiting.
      if (
        activeId &&
        !available.includes(activeId) &&
        (document.activeElement === document.body || root.current?.contains(document.activeElement))
      ) {
        const index = old.findIndex((item) => item.id === activeId);
        const next = visible.slice(Math.max(0, index)).find((item) => available.includes(item.id));
        const previous = visible
          .slice(0, Math.max(0, index))
          .findLast((item) => available.includes(item.id));
        const target = next?.id ?? previous?.id ?? (canExpand ? disclosureId : undefined);
        (target ? buttons.current.get(target) : (emptyFocusRef?.current ?? root.current))?.focus();
      }
    }
    previousItems.current = items;
  }, [items, activeId, available, visible, canExpand, disclosureId, emptyFocusRef]);

  return (
    <div
      {...props}
      ref={(node) => {
        root.current = node;
        if (typeof ref === 'function') {
          return ref(node);
        }
        if (ref) {
          ref.current = node;
        }
      }}
      role="toolbar"
      aria-label={label}
      tabIndex={-1}
      className={`tag-group-proto ${className}`}
      data-size={size}
      onKeyDown={(event) => {
        if (!(event.target instanceof HTMLButtonElement)) {
          return;
        }
        const current = [...buttons.current].find(([, node]) => node === event.target)?.[0];
        if (!current) {
          return;
        }
        const index = available.indexOf(current);
        const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
        let next = index;
        if (event.key === 'ArrowRight') {
          next += rtl ? -1 : 1;
        } else if (event.key === 'ArrowLeft') {
          next += rtl ? 1 : -1;
        } else if (event.key === 'Home') {
          next = 0;
        } else if (event.key === 'End') {
          next = available.length - 1;
        } else if (event.key === 'Delete' || event.key === 'Backspace') {
          if (current !== disclosureId) {
            event.preventDefault();
            if (!event.repeat) {
              buttons.current.get(current)?.click();
            }
          }
          return;
        } else {
          if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
          }
          return;
        }
        event.preventDefault();
        focus(available[Math.max(0, Math.min(available.length - 1, next))]);
      }}
    >
      {visible.map((item) => (
        <Tag
          key={item.id}
          size={size}
          {...(item.status ? { status: item.status } : {})}
          {...(item.iconLeft ? { iconLeft: item.iconLeft } : {})}
          disabled={disabled || item.disabled === true}
          pending={item.pending === true}
          removeLabel={item.removeLabel}
          removeTabIndex={tabStop === item.id ? 0 : -1}
          removeRef={(node) => {
            if (node) {
              buttons.current.set(item.id, node);
            } else {
              buttons.current.delete(item.id);
            }
          }}
          onFocus={() => setActiveId(item.id)}
          onRemove={() => onRemove(item.id)}
        >
          {item.label}
        </Tag>
      ))}
      {canExpand && (
        <button
          ref={(node) => {
            if (node) {
              buttons.current.set(disclosureId, node);
            } else {
              buttons.current.delete(disclosureId);
            }
          }}
          type="button"
          className="tag-disclosure-proto"
          data-size={size}
          aria-expanded={expanded}
          aria-label={
            expanded
              ? `Show fewer ${label.toLowerCase()}`
              : `Show ${items.length - limit} more ${label.toLowerCase()}`
          }
          tabIndex={tabStop === disclosureId ? 0 : -1}
          onFocus={() => setActiveId(disclosureId)}
          onClick={() => setExpanded(!expanded)}
        >
          <span>{expanded ? 'Show less' : `+${items.length - limit} more`}</span>
        </button>
      )}
      {!items.length && <span className="tag-group-empty-proto">{emptyMessage}</span>}
      <span className="tag-announcement-proto" role="status">
        {announcement}
      </span>
    </div>
  );
}
