import { useLayoutEffect } from 'react';
import type { RefObject } from 'react';

export function windowBounds(): { left: number; right: number; top: number; bottom: number } {
  const viewport = window.visualViewport;
  const left = viewport?.offsetLeft ?? 0;
  const top = viewport?.offsetTop ?? 0;
  return {
    left,
    right: left + (viewport?.width ?? document.documentElement.clientWidth),
    top,
    bottom: top + (viewport?.height ?? window.innerHeight),
  };
}

export function useShellPopoverPosition(
  anchorRef: RefObject<HTMLButtonElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
  preferredWidth: number,
  kind: 'account' | 'documents',
  enabled = true,
): void {
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!enabled || !anchor || !panel) {
      return;
    }
    const owner = anchor.closest('.app-shell-proto') ?? anchor;
    const viewport = window.visualViewport;
    const choices = panel.querySelector('.app-shell-document-choices');

    function place(trigger: HTMLButtonElement, surface: HTMLDivElement): void {
      const { left, right, top, bottom } = windowBounds();
      const target = trigger.getBoundingClientRect();
      const open = surface.matches(':popover-open');
      if (
        open &&
        (!target.width ||
          target.right <= left ||
          target.left >= right ||
          target.bottom <= top ||
          target.top >= bottom)
      ) {
        surface.hidePopover();
        return;
      }
      const width = Math.max(0, Math.min(preferredWidth, right - left - 16));
      surface.style.setProperty('--shell-popover-width', `${width}px`);
      const rtl = getComputedStyle(trigger).direction === 'rtl';
      const alignLeft = kind === 'account' ? !rtl : rtl;
      const x = alignLeft ? target.left : target.right - width;
      const above = target.top - top - 16;
      const below = bottom - target.bottom - 16;
      const requiredHeight = open ? Math.min(320, (choices?.scrollHeight ?? 40) + 10) : 180;
      const placeAbove =
        kind === 'account'
          ? above >= requiredHeight || above > below
          : below < requiredHeight && above > below;
      surface.style.setProperty(
        '--shell-popover-x',
        `${Math.max(left + 8, Math.min(x, right - width - 8))}px`,
      );
      surface.style.setProperty(
        '--shell-popover-top',
        placeAbove ? 'auto' : `${target.bottom + 8}px`,
      );
      surface.style.setProperty(
        '--shell-popover-bottom',
        placeAbove ? `${window.innerHeight - target.top + 8}px` : 'auto',
      );
      surface.style.setProperty(
        '--shell-popover-height',
        `${Math.max(0, placeAbove ? above : below)}px`,
      );
    }

    const update = (): void => {
      if (panel.matches(':popover-open')) {
        place(anchor, panel);
      }
    };
    const onScroll = (event: Event): void => {
      if (!(event.target instanceof Node && panel.contains(event.target))) {
        update();
      }
    };
    const observer = new ResizeObserver(update);
    const stop = (): void => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      viewport?.removeEventListener('resize', update);
    };
    const beforeToggle = (event: Event): void => {
      if ((event as ToggleEvent).newState === 'open') {
        place(anchor, panel);
      }
    };
    const toggle = (): void => {
      if (panel.matches(':popover-open')) {
        update();
        observer.observe(owner);
        observer.observe(anchor);
        window.addEventListener('scroll', onScroll, true);
        window.addEventListener('resize', update);
        viewport?.addEventListener('scroll', update);
        viewport?.addEventListener('resize', update);
      } else {
        stop();
      }
    };
    panel.addEventListener('beforetoggle', beforeToggle);
    panel.addEventListener('toggle', toggle);
    return () => {
      stop();
      panel.removeEventListener('beforetoggle', beforeToggle);
      panel.removeEventListener('toggle', toggle);
    };
  }, [anchorRef, enabled, kind, panelRef, preferredWidth]);
}
