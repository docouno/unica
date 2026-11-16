import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Tooltip } from '../tooltip/tooltip.proto.js';
import './avatar-tooltip.css';

export interface AvatarNameHintProps {
  readonly name: string;
  /** The nested Avatar is decorative: pass alt="". */
  readonly children: ReactNode;
}

const openEvent = 'avatar-name-hint:open';

// Local design preview: native top layer and bounded viewport placement.
// This is not the reusable Tooltip engine or its public API.
export function AvatarNameHint({ name, children }: AvatarNameHintProps): ReactElement {
  const label = name.trim();
  const trigger = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const opening = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closing = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const intent = useRef({ trigger: false, panel: false, focus: false, dismissed: false });
  const touchFocus = useRef(false);
  const [open, setOpen] = useState(false);

  function clearTimers(): void {
    clearTimeout(opening.current);
    clearTimeout(closing.current);
  }

  function show(): void {
    clearTimers();
    if (!label || intent.current.dismissed) {
      return;
    }
    // Only one name is shown across the local preview at a time.
    document.dispatchEvent(new CustomEvent(openEvent, { detail: trigger.current }));
    setOpen(true);
  }

  function leave(): void {
    clearTimers();
    const current = intent.current;
    if (!current.trigger && !current.panel && !current.focus) {
      current.dismissed = false;
      closing.current = setTimeout(() => setOpen(false), 150);
    }
  }

  useEffect(() => {
    function closeOther(event: Event): void {
      if (event instanceof CustomEvent && event.detail !== trigger.current) {
        clearTimeout(opening.current);
        clearTimeout(closing.current);
        intent.current.panel = false;
        setOpen(false);
      }
    }
    document.addEventListener(openEvent, closeOther);
    return () => {
      document.removeEventListener(openEvent, closeOther);
      clearTimeout(opening.current);
      clearTimeout(closing.current);
    };
  }, []);

  useLayoutEffect(() => {
    const anchor = trigger.current;
    const popup = panel.current;
    if (!open || !label || !anchor || !popup) {
      return;
    }

    function position(): void {
      if (!anchor || !popup) {
        return;
      }
      const source = anchor.getBoundingClientRect();
      const floating = popup.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      const gap = 8;
      if (source.bottom <= 0 || source.top >= height || source.right <= 0 || source.left >= width) {
        setOpen(false);
        return;
      }
      const above = source.top - gap - floating.height;
      const below = source.bottom + gap;
      const top = above >= gap ? above : below;
      const left = source.left + (source.width - floating.width) / 2;
      popup.style.left = `${Math.max(gap, Math.min(left, width - floating.width - gap))}px`;
      popup.style.top = `${Math.max(gap, Math.min(top, height - floating.height - gap))}px`;
    }

    function dismiss(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        intent.current.dismissed = true;
        intent.current.panel = false;
        setOpen(false);
      }
    }

    popup.showPopover();
    position();
    const observer = new ResizeObserver(position);
    observer.observe(anchor);
    observer.observe(popup);
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    document.addEventListener('keydown', dismiss, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      document.removeEventListener('keydown', dismiss, true);
      if (popup.matches(':popover-open')) {
        popup.hidePopover();
      }
    };
  }, [open, label]);

  return (
    <>
      <span
        ref={trigger}
        className="avatar-name-hint"
        role={label ? 'img' : undefined}
        aria-label={label || undefined}
        tabIndex={label ? 0 : undefined}
        onPointerDown={(event) => {
          touchFocus.current = event.pointerType === 'touch';
        }}
        onPointerEnter={(event) => {
          if (event.pointerType === 'touch') {
            return;
          }
          intent.current.trigger = true;
          clearTimers();
          opening.current = setTimeout(show, 300);
        }}
        onPointerLeave={() => {
          intent.current.trigger = false;
          leave();
        }}
        onFocus={() => {
          intent.current.focus = true;
          if (!touchFocus.current) {
            show();
          }
          touchFocus.current = false;
        }}
        onBlur={() => {
          intent.current.focus = false;
          touchFocus.current = false;
          leave();
        }}
      >
        {children}
      </span>
      <Tooltip
        ref={panel}
        popover="manual"
        className="avatar-name-hint-panel"
        // The full name is already the trigger's accessible name, including while closed.
        aria-hidden="true"
        onPointerEnter={(event) => {
          if (event.pointerType !== 'touch') {
            intent.current.panel = true;
            clearTimers();
          }
        }}
        onPointerLeave={() => {
          intent.current.panel = false;
          leave();
        }}
      >
        <bdi dir="auto">{label}</bdi>
      </Tooltip>
    </>
  );
}
