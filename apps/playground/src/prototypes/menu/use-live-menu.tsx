import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, ReactElement, PointerEvent } from 'react';
import type { ButtonProps } from '../button/button.proto.js';
import { MenuBack, MenuRows, MenuSurface } from './menu.proto.js';
import { menuRows } from './menu.entries.js';
import type { MenuBranch, MenuEntry, MenuSize } from './menu.entries.js';

export type TriggerProps = Required<
  Pick<
    ButtonProps,
    | 'ref'
    | 'onClick'
    | 'onKeyDown'
    | 'popoverTarget'
    | 'aria-haspopup'
    | 'aria-controls'
    | 'aria-expanded'
  >
> &
  Pick<ButtonProps, 'onPointerDown'>;

export interface LiveMenuProps {
  readonly label: string;
  readonly items: readonly MenuEntry[];
  readonly trigger: (props: TriggerProps) => ReactElement;
  readonly size?: MenuSize;
  readonly align?: 'start' | 'end';
}

export interface MenuInvocation {
  readonly anchor: HTMLElement;
  readonly restore: HTMLElement;
  readonly align?: 'start' | 'end';
  readonly capturePointerId?: number;
  readonly position?: { readonly x: number; readonly y: number };
  readonly focus: 'panel' | 'first' | 'last';
}

interface LiveMenuBindings {
  readonly triggerProps: TriggerProps;
  readonly invocation: MenuInvocation | null;
  readonly panel: ReactElement;
  readonly triggerElement: () => HTMLButtonElement | null;
  readonly open: (invocation: MenuInvocation) => void;
}

const EDGE = 16;
const TRIGGER_GAP = 6;
const POINT_GAP = 4;
const SUB_GAP = 6;

function boundsFor(anchor: HTMLElement): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  const frame = anchor.closest('[data-menu-boundary], .wb-viewport-inner')?.getBoundingClientRect();
  const view = window.visualViewport;
  const left = view?.offsetLeft ?? 0;
  const top = view?.offsetTop ?? 0;
  const right = left + (view?.width ?? document.documentElement.clientWidth);
  const bottom = top + (view?.height ?? window.innerHeight);
  return {
    left: Math.max(left, frame?.left ?? left) + EDGE,
    right: Math.min(right, frame?.right ?? right) - EDGE,
    top: top + EDGE,
    bottom: bottom - EDGE,
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(value, maximum));
}

function rootPlacement(
  panel: HTMLElement,
  invocation: MenuInvocation,
  align: 'start' | 'end',
  keepSide = false,
): void {
  const bounds = boundsFor(invocation.anchor);
  const anchor = invocation.anchor.getBoundingClientRect();
  const alignment = invocation.align ?? align;
  const point = invocation.position;
  if (!point && (anchor.bottom < bounds.top - EDGE || anchor.top > bounds.bottom + EDGE)) {
    panel.hidePopover();
    return;
  }

  const scroller = panel.querySelector('.menu-rows-proto');
  const scrollTop = scroller?.scrollTop ?? 0;
  panel.style.maxWidth = `${Math.max(0, bounds.right - bounds.left)}px`;
  panel.style.maxHeight = 'none';
  const natural = panel.getBoundingClientRect();
  const rtl = getComputedStyle(panel).direction === 'rtl';
  const gap = point ? POINT_GAP : TRIGGER_GAP;
  const below = (point?.y ?? anchor.bottom) + gap;
  const above = (point?.y ?? anchor.top) - gap;
  const belowRoom = bounds.bottom - Math.max(below, bounds.top);
  const aboveRoom = Math.min(above, bounds.bottom) - bounds.top;
  const up = keepSide
    ? panel.dataset.placement === 'top'
    : belowRoom < natural.height && aboveRoom > belowRoom;
  const available = Math.max(0, up ? aboveRoom : belowRoom);
  const overlap = available < Math.min(natural.height, 82);
  panel.style.maxHeight = `${overlap ? bounds.bottom - bounds.top : available}px`;
  const height = panel.getBoundingClientRect().height;
  if (scroller) {
    scroller.scrollTop = scrollTop;
  }

  let x = (alignment === 'start') !== rtl ? anchor.left : anchor.right - natural.width;
  if (point) {
    const after = point.x + gap;
    const before = point.x - gap - natural.width;
    const prefer = rtl ? before : after;
    const alternative = rtl ? after : before;
    x = prefer >= bounds.left && prefer + natural.width <= bounds.right ? prefer : alternative;
  }
  const y = up ? above - height : below;
  panel.style.left = `${clamp(x, bounds.left, bounds.right - natural.width)}px`;
  panel.style.top = `${clamp(y, bounds.top, bounds.bottom - height)}px`;
  panel.dataset.placement = up ? 'top' : 'bottom';
}

interface BranchState {
  readonly id: string;
  readonly row: HTMLElement;
  readonly side: 'left' | 'right' | 'inline';
  readonly focus: boolean;
  readonly flipped: boolean;
}

function branchSide(panel: HTMLElement, anchor: HTMLElement): BranchState['side'] {
  if (matchMedia('(pointer: coarse)').matches) {
    return 'inline';
  }
  const bounds = boundsFor(anchor);
  const rect = panel.getBoundingClientRect();
  const after = bounds.right - rect.right - SUB_GAP >= rect.width - 0.5;
  const before = rect.left - bounds.left - SUB_GAP >= rect.width - 0.5;
  const rtl = getComputedStyle(panel).direction === 'rtl';
  if (rtl ? before : after) {
    return rtl ? 'left' : 'right';
  }
  if (rtl ? after : before) {
    return rtl ? 'right' : 'left';
  }
  return 'inline';
}

function focusRow(panel: HTMLElement, option: HTMLElement | undefined): void {
  (option ?? panel).focus({ preventScroll: true });
  const scroller = option?.closest('.menu-rows-proto');
  if (!option || !scroller) {
    return;
  }
  const row = option.getBoundingClientRect();
  const frame = scroller.getBoundingClientRect();
  if (row.bottom > frame.bottom) {
    scroller.scrollTop += row.bottom - frame.bottom;
  } else if (row.top < frame.top) {
    scroller.scrollTop -= frame.top - row.top;
  }
}

function rowElements(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>('[data-option]')).filter(
    (row) => row.closest('[role="menu"]') === panel,
  );
}

// Local behavior for inspecting the design. It intentionally supports one submenu level.
export function useLiveMenu({
  label,
  items,
  size = 'm',
  align = 'start',
}: Omit<LiveMenuProps, 'trigger'>): LiveMenuBindings {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const bindTrigger = useCallback((element: HTMLButtonElement | null): void => {
    triggerRef.current = element;
  }, []);
  const [invocation, setInvocation] = useState<MenuInvocation | null>(null);
  const [branch, setBranch] = useState<BranchState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hovered = useRef<string | undefined>(undefined);
  const typed = useRef({ value: '', time: 0 });

  const clearIntent = (): void => {
    clearTimeout(timer.current);
    hovered.current = undefined;
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const open = (next: MenuInvocation): void => {
    clearIntent();
    typed.current = { value: '', time: 0 };
    setBranch(null);
    setInvocation(next);
  };

  useLayoutEffect(() => {
    const panel = rootRef.current;
    if (!panel || !invocation) {
      return;
    }
    if (!panel.matches(':popover-open')) {
      panel.showPopover({ source: invocation.anchor });
    }
    if (invocation.capturePointerId !== undefined) {
      try {
        panel.setPointerCapture(invocation.capturePointerId);
      } catch {
        // The releasing pointer may have already left the active pointer set.
      }
    }
    const position = (): void => rootPlacement(panel, invocation, align);
    position();
    const rows = rowElements(panel);
    focusRow(
      panel,
      invocation.focus === 'panel' ? undefined : rows.at(invocation.focus === 'last' ? -1 : 0),
    );

    const onScroll = (event: Event): void => {
      if (event.target instanceof Node && panel.contains(event.target)) {
        return;
      }
      if (invocation.position) {
        panel.hidePopover();
      } else {
        position();
      }
    };
    const onResize = (): void => {
      position();
      setBranch(null);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, [align, invocation]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const child = childRef.current;
    if (!root || !branch || !invocation) {
      return;
    }
    if (branch.side === 'inline') {
      const scroller = root.querySelector('.menu-rows-proto');
      if (scroller) {
        scroller.scrollTop = 0;
      }
      rootPlacement(root, invocation, align, true);
      focusRow(root, rowElements(root)[1]);
      return;
    }
    if (!child) {
      return;
    }
    const position = (): void => {
      const bounds = boundsFor(invocation.anchor);
      const parent = root.getBoundingClientRect();
      const row = branch.row.getBoundingClientRect();
      child.style.width = `${parent.width}px`;
      child.style.maxHeight = `${bounds.bottom - bounds.top}px`;
      const rect = child.getBoundingClientRect();
      const x =
        branch.side === 'right' ? parent.right + SUB_GAP : parent.left - SUB_GAP - rect.width;
      child.style.left = `${clamp(x, bounds.left, bounds.right - rect.width)}px`;
      child.style.top = `${clamp(row.top - 5, bounds.top, bounds.bottom - rect.height)}px`;
    };
    if (!child.matches(':popover-open')) {
      child.showPopover({ source: branch.row });
    }
    position();
    if (branch.focus) {
      focusRow(child, rowElements(child)[0]);
    }
    const onScroll = (event: Event): void => {
      if (!(event.target instanceof Node && child.contains(event.target))) {
        const rows = branch.row.closest('.menu-rows-proto')?.getBoundingClientRect();
        const rect = branch.row.getBoundingClientRect();
        if (rows && (rect.bottom <= rows.top || rect.top >= rows.bottom)) {
          child.hidePopover();
          setBranch(null);
        } else {
          position();
        }
      }
    };
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [align, branch, invocation]);

  const close = (restore: boolean): void => {
    const root = rootRef.current;
    const owned = root?.contains(document.activeElement);
    root?.hidePopover();
    if (restore && owned) {
      invocation?.restore.focus({ preventScroll: true });
    }
    clearIntent();
    setBranch(null);
    setInvocation(null);
  };

  const closeBranch = (restore: boolean): void => {
    if (!branch) {
      return;
    }
    clearIntent();
    const child = childRef.current;
    const ownedFocus = child?.contains(document.activeElement);
    child?.hidePopover();
    setBranch(null);
    if (!restore && !ownedFocus) {
      return;
    }
    const root = rootRef.current;
    if (branch.side === 'inline' && root && invocation) {
      requestAnimationFrame(() => {
        if (root.matches(':popover-open')) {
          rootPlacement(root, invocation, align, true);
          focusRow(
            root,
            rowElements(root).find((row) => row.dataset.option === branch.id),
          );
        }
      });
    } else {
      branch.row.focus({ preventScroll: true });
    }
  };

  const startBranch = (row: HTMLElement, item: MenuBranch, focus: boolean): void => {
    if (item.disabled || !rootRef.current || !invocation) {
      return;
    }
    clearIntent();
    if (branch?.id === item.id && branch.side !== 'inline') {
      const child = childRef.current;
      if (focus && child) {
        focusRow(child, rowElements(child)[0]);
      }
      return;
    }
    const side = branchSide(rootRef.current, invocation.anchor);
    const rtl = getComputedStyle(rootRef.current).direction === 'rtl';
    setBranch({ id: item.id, row, side, focus, flipped: side === (rtl ? 'right' : 'left') });
  };

  const handleKey = (
    event: KeyboardEvent<HTMLDivElement>,
    entries: readonly MenuEntry[],
    childLevel: boolean,
  ): void => {
    const panel = event.currentTarget;
    if (!panel || event.altKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing) {
      return;
    }
    const rows = rowElements(panel);
    const active = rows.findIndex((row) => row === document.activeElement);
    const rtl = getComputedStyle(panel).direction === 'rtl';
    const enterBranch = rtl ? 'ArrowLeft' : 'ArrowRight';
    const leaveBranch = rtl ? 'ArrowRight' : 'ArrowLeft';
    const row = rows[active];
    const item = menuRows(entries).find((entry) => entry.id === row?.dataset.option);

    if (event.key === 'Tab') {
      // Start native sequential navigation from the caller.
      close(true);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (childLevel || branch) {
        closeBranch(true);
      } else {
        close(true);
      }
      return;
    }
    if (event.key === leaveBranch && childLevel) {
      event.preventDefault();
      closeBranch(true);
      return;
    }
    if (event.key === enterBranch && item?.type === 'branch' && row) {
      event.preventDefault();
      startBranch(row, item, true);
      return;
    }
    if (event.key === ' ' && row instanceof HTMLAnchorElement) {
      event.preventDefault();
      row.click();
      return;
    }

    let target: HTMLElement | undefined;
    switch (event.key) {
      case 'ArrowDown':
        target = rows[(active + 1) % rows.length];
        break;
      case 'ArrowUp':
        target = rows[active <= 0 ? rows.length - 1 : active - 1];
        break;
      case 'Home':
        target = rows[0];
        break;
      case 'End':
        target = rows.at(-1);
        break;
      default: {
        if (event.key.length !== 1 || event.key === ' ') {
          return;
        }
        const now = event.timeStamp;
        const letter = event.key.toLocaleLowerCase();
        const previous = now - typed.current.time < 550 ? typed.current.value : '';
        const query = previous === letter ? letter : previous + letter;
        typed.current = { value: query, time: now };
        const from = Math.max(0, active + (query.length === 1 ? 1 : 0));
        const ordered = [...rows.slice(from), ...rows.slice(0, from)];
        target = ordered.find((candidate) => {
          const entry = menuRows(entries).find(({ id: key }) => key === candidate.dataset.option);
          return entry?.label.toLocaleLowerCase().startsWith(query);
        });
      }
    }
    if (target) {
      event.preventDefault();
      clearIntent();
      if (!childLevel && branch && target.dataset.option !== branch.id) {
        closeBranch(false);
      }
      focusRow(panel, target);
    }
  };

  const select = (event: MouseEvent<HTMLDivElement>, entries: readonly MenuEntry[]): void => {
    const row = (event.target as Element).closest<HTMLElement>('[data-option]');
    const item = menuRows(entries).find(({ id: key }) => key === row?.dataset.option);
    if (!row || !item) {
      return;
    }
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    if (item.type === 'branch') {
      startBranch(row, item, true);
      return;
    }
    if (
      item.type === 'link' &&
      (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    ) {
      return;
    }
    if ('run' in item) {
      item.run?.();
    }
    if (item.type !== 'checkbox') {
      close(true);
    }
  };

  const previewBranch = (
    event: PointerEvent<HTMLDivElement>,
    entries: readonly MenuEntry[],
  ): void => {
    if (event.pointerType !== 'mouse') {
      return;
    }
    const row = (event.target as Element).closest<HTMLElement>('[data-option]');
    if (!row || row.dataset.option === hovered.current) {
      return;
    }
    clearIntent();
    hovered.current = row.dataset.option;
    const item = menuRows(entries).find(({ id: key }) => key === row.dataset.option);
    if (branch?.id === item?.id) {
      return;
    }
    if (
      item?.type === 'branch' &&
      !item.disabled &&
      rootRef.current &&
      invocation &&
      branchSide(rootRef.current, invocation.anchor) !== 'inline'
    ) {
      timer.current = setTimeout(() => startBranch(row, item, false), branch ? 300 : 170);
    } else if (branch) {
      timer.current = setTimeout(() => closeBranch(false), 300);
    }
  };

  const active = menuRows(items).find(
    (item): item is MenuBranch => item.type === 'branch' && item.id === branch?.id,
  );
  const drill = branch?.side === 'inline' && active;
  const area = drill ? active.items : items;
  const childId = `${id}-child`;

  return {
    triggerElement: () => triggerRef.current,
    invocation,
    open,
    triggerProps: {
      ref: bindTrigger,
      popoverTarget: id,
      'aria-haspopup': 'menu',
      'aria-expanded': Boolean(invocation),
      'aria-controls': id,
      onKeyDown: (event) => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault();
          open({
            anchor: event.currentTarget,
            restore: event.currentTarget,
            focus: event.key === 'ArrowUp' ? 'last' : 'first',
          });
        }
      },
      onClick: (event) => {
        event.preventDefault();
        if (rootRef.current?.matches(':popover-open') && !invocation?.position) {
          close(true);
        } else {
          open({
            anchor: event.currentTarget,
            restore: event.currentTarget,
            focus: event.detail === 0 ? 'first' : 'panel',
          });
        }
      },
    },
    panel: (
      <MenuSurface
        ref={rootRef}
        id={id}
        popover="auto"
        role="menu"
        tabIndex={-1}
        aria-label={drill ? active.label : label}
        size={size}
        onKeyDown={(event) => handleKey(event, area, Boolean(drill))}
        onClick={(event) => select(event, area)}
        onPointerOver={(event) => {
          if (!drill) {
            previewBranch(event, area);
          }
        }}
        onPointerLeave={clearIntent}
        onToggle={(event) => {
          if (event.target === event.currentTarget && event.newState === 'closed') {
            clearIntent();
            setInvocation(null);
            setBranch(null);
          }
        }}
      >
        {drill && (
          <MenuBack
            name={`Back to ${label}`}
            title={active.label}
            onClick={() => closeBranch(true)}
          />
        )}
        <MenuRows
          items={area}
          activeBranch={branch?.id}
          branchControls={childId}
          flipped={branch?.flipped}
        />
        {active && !drill && (
          <MenuSurface
            ref={childRef}
            id={childId}
            role="menu"
            aria-label={active.label}
            popover="auto"
            tabIndex={-1}
            size={size}
            onKeyDown={(event) => {
              event.stopPropagation();
              handleKey(event, active.items, true);
            }}
            onClick={(event) => {
              event.stopPropagation();
              select(event, active.items);
            }}
            onPointerOver={(event) => event.stopPropagation()}
            onPointerEnter={clearIntent}
            onToggle={(event) => {
              if (event.target === event.currentTarget && event.newState === 'closed') {
                closeBranch(false);
              }
            }}
          >
            <MenuRows items={active.items} />
          </MenuSurface>
        )}
      </MenuSurface>
    ),
  };
}
