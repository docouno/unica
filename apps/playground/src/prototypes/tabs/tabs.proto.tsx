import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type {
  ComponentPropsWithRef,
  ComponentPropsWithoutRef,
  CSSProperties,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
  ReactNode,
} from 'react';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import { Badge } from '../badge/badge.proto.js';
import { IconButton } from '../button/button.proto.js';
import { Icon } from '../icon/icon.proto.js';
import type { GlyphComponent } from '../icon/icon.proto.js';
import { HintPreview } from '../tooltip/tooltip.preview.js';
import type { HintTriggerBindings } from '../tooltip/tooltip.preview.js';
import './tabs.css';

type TabsSize = 's' | 'm' | 'l';
type Distribution = 'content' | 'equal';
type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide';

interface TabsContextValue {
  readonly id: string;
  readonly selected: string;
  readonly focused: string | null;
  readonly orientation: 'horizontal' | 'vertical';
  readonly size: TabsSize;
  readonly activationMode: 'automatic' | 'manual';
  readonly select: (value: string) => void;
  readonly setFocused: (value: string | null) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const tabs = useContext(TabsContext);
  if (!tabs) {
    throw new Error('Place tabs, their list and their panels inside Tabs.');
  }
  return tabs;
}

export interface TabsProps extends Omit<ComponentPropsWithRef<'div'>, 'defaultValue'> {
  readonly defaultValue?: string;
  readonly value?: string;
  readonly onValueChange?: (value: string) => void;
  readonly orientation?: 'horizontal' | 'vertical';
  readonly size?: TabsSize;
  readonly activationMode?: 'automatic' | 'manual';
}

// The preview has stable tab sets and keeps panel contents mounted. Library lifecycle ships separately.
export function Tabs({
  defaultValue,
  value,
  onValueChange,
  orientation = 'horizontal',
  size = 'm',
  activationMode = 'automatic',
  className = '',
  children,
  ...props
}: TabsProps): ReactElement {
  const id = useId();
  const [localValue, setLocalValue] = useState(defaultValue ?? '');
  const [focused, setFocused] = useState<string | null>(null);
  const selected = value ?? localValue;

  function select(next: string): void {
    if (next === selected) {
      return;
    }
    if (value === undefined) {
      setLocalValue(next);
    }
    onValueChange?.(next);
  }

  return (
    <TabsContext
      value={{ id, selected, focused, orientation, size, activationMode, select, setFocused }}
    >
      <div {...props} className={`tabs-proto ${className}`}>
        {children}
      </div>
    </TabsContext>
  );
}

const distributions = {
  content: {
    columns: 'max-content',
    width: 'max-content',
    padding: 'var(--tabs-padding)',
  },
  equal: {
    columns: 'minmax(var(--tabs-equal-min), 1fr)',
    width: 'min-content',
    padding: 'var(--tabs-equal-padding)',
  },
} as const;

function distributionStyle(
  distribution: NonNullable<TabsListProps['distribution']>,
): CSSProperties {
  const steps = typeof distribution === 'string' ? { mobile: distribution } : distribution;
  const breakpoints: readonly Breakpoint[] = ['mobile', 'tablet', 'desktop', 'wide'];
  let current = steps.mobile ?? 'content';
  const style: Record<string, string> = {};
  for (const breakpoint of breakpoints) {
    current = steps[breakpoint] ?? current;
    const { columns, width, padding } = distributions[current];
    style[`--tabs-${breakpoint}-columns`] = columns;
    style[`--tabs-${breakpoint}-width`] = width;
    style[`--tabs-${breakpoint}-padding`] = padding;
  }
  return style;
}

const scrollTolerance = 1;
const focusClearance = 4;

function scrollEdges(list: HTMLElement, rtl: boolean): { start: boolean; end: boolean } {
  const range = list.scrollWidth - list.clientWidth;
  const offset = rtl ? -list.scrollLeft : list.scrollLeft;
  return {
    start: range > scrollTolerance && offset > scrollTolerance,
    end: range > scrollTolerance && range - offset > scrollTolerance,
  };
}

function measureOverflow(list: HTMLElement): void {
  const position = list.scrollLeft;
  list.removeAttribute('data-overflow-layout');
  const overflow = list.scrollWidth - list.clientWidth > scrollTolerance;
  list.toggleAttribute('data-overflow-layout', overflow);
  if (overflow && list.scrollLeft !== position) {
    list.scrollLeft = position;
  }
}

function tabViewport(list: HTMLElement): {
  left: number;
  right: number;
  edges: ReturnType<typeof scrollEdges>;
  rtl: boolean;
} {
  const bounds = list.getBoundingClientRect();
  const style = getComputedStyle(list);
  const rtl = style.direction === 'rtl';
  const edges = scrollEdges(list, rtl);
  const inset =
    (Number.parseFloat(style.scrollPaddingInlineStart) || focusClearance) - focusClearance;
  const left = bounds.left + list.clientLeft;
  return {
    left: left + ((rtl ? edges.end : edges.start) ? inset : 0),
    right: left + list.clientWidth - ((rtl ? edges.start : edges.end) ? inset : 0),
    edges,
    rtl,
  };
}

function revealTab(list: HTMLElement, tab: HTMLElement): void {
  if (list.scrollWidth - list.clientWidth <= scrollTolerance) {
    return;
  }
  const viewport = tabViewport(list);
  const left = viewport.left + focusClearance;
  const right = viewport.right - focusClearance;
  const target = tab.getBoundingClientRect();
  const shift = target.left < left ? target.left - left : Math.max(0, target.right - right);
  // Commit even if the target fits, interrupting an in-flight chevron step.
  list.scrollTo({ left: list.scrollLeft + shift, behavior: 'auto' });
}

function canShowTabHint(tab: HTMLElement): boolean {
  const label = tab.querySelector('.tab-label-proto');
  const list = tab.closest<HTMLElement>('[role="tablist"]');
  if (
    !list ||
    (!tab.hasAttribute('data-icon-only') && !(label && label.scrollWidth > label.clientWidth))
  ) {
    return false;
  }
  const viewport = tabViewport(list);
  const target = tab.getBoundingClientRect();
  return target.right > viewport.left && target.left < viewport.right;
}

function scrollTabs(list: HTMLElement, toward: 'start' | 'end'): void {
  const style = getComputedStyle(list);
  const rtl = style.direction === 'rtl';
  const direction = (toward === 'end') !== rtl ? 1 : -1;
  const inset = Number.parseFloat(style.scrollPaddingInlineStart) || focusClearance;
  const distance = Math.max(24, list.clientWidth - 2 * inset - 24);
  list.scrollBy({
    left: direction * distance,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
  });
}

export interface TabsListProps extends ComponentPropsWithoutRef<'div'> {
  readonly distribution?: Distribution | Partial<Record<Breakpoint, Distribution>>;
}

export function TabsList({
  distribution = 'content',
  children,
  className = '',
  dir,
  style,
  ...props
}: TabsListProps): ReactElement {
  const { selected, orientation, size, activationMode, select, setFocused } = useTabs();
  const list = useRef<HTMLDivElement>(null);
  const browsing = useRef(false);
  const [edges, setEdges] = useState({ start: false, end: false, rtl: false });

  const updateEdges = useCallback((viewport: HTMLElement): void => {
    const { left, right, edges: next, rtl } = tabViewport(viewport);
    if (next.start || next.end) {
      const counts = Array.from(viewport.querySelectorAll('.tab-count-proto'), (count) => {
        const bounds = count.getBoundingClientRect();
        return { count, clipped: bounds.left < left - 0.5 || bounds.right > right + 0.5 };
      });
      for (const { count, clipped } of counts) {
        count.toggleAttribute('data-count-clipped', clipped);
      }
    }
    setEdges((current) =>
      current.start === next.start && current.end === next.end && current.rtl === rtl
        ? current
        : { ...next, rtl },
    );
  }, []);

  useLayoutEffect(() => {
    const viewport = list.current;
    if (!viewport || orientation !== 'horizontal') {
      return;
    }
    browsing.current = false;
    const syncLayout = (): void => {
      measureOverflow(viewport);
      const selectedTab = browsing.current
        ? null
        : viewport.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
      const target =
        viewport.querySelector<HTMLElement>('[role="tab"]:focus-visible') ?? selectedTab;
      if (target) {
        revealTab(viewport, target);
      }
      updateEdges(viewport);
    };
    syncLayout();
    const observer = new ResizeObserver(syncLayout);
    observer.observe(viewport);
    if (viewport.firstElementChild) {
      observer.observe(viewport.firstElementChild);
    }
    for (const count of viewport.querySelectorAll('.tab-count-proto')) {
      observer.observe(count);
    }
    const directionObserver = new MutationObserver(syncLayout);
    for (let ancestor = viewport.parentElement; ancestor; ancestor = ancestor.parentElement) {
      directionObserver.observe(ancestor, { attributeFilter: ['dir'] });
    }
    return () => {
      observer.disconnect();
      directionObserver.disconnect();
    };
  }, [selected, orientation, dir, updateEdges]);

  function navigate(event: KeyboardEvent<HTMLDivElement>): void {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.defaultPrevented
    ) {
      return;
    }
    const viewport = event.currentTarget;
    const tabs = Array.from(
      viewport.querySelectorAll<HTMLButtonElement>('[role="tab"]:enabled'),
    ).filter((tab) => tab.closest('[role="tablist"]') === viewport);
    const current = tabs.findIndex((tab) => tab === event.target);
    if (current === -1) {
      return;
    }
    const horizontal = orientation === 'horizontal';
    const rtl = horizontal && getComputedStyle(viewport).direction === 'rtl';
    const previous = horizontal ? (rtl ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp';
    const following = horizontal ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const offsets: Record<string, number> = {
      Home: 0,
      End: tabs.length - 1,
      [previous]: (current + tabs.length - 1) % tabs.length,
      [following]: (current + 1) % tabs.length,
    };
    const next = tabs[offsets[event.key] ?? -1];
    if (!next) {
      return;
    }
    event.preventDefault();
    next.focus({ preventScroll: true });
    if (horizontal && next === event.target) {
      revealTab(viewport, next);
      updateEdges(viewport);
    }
    if (activationMode === 'automatic' && next.dataset.tabValue !== undefined) {
      select(next.dataset.tabValue);
    }
  }

  const start = orientation === 'horizontal' && edges.start;
  const end = orientation === 'horizontal' && edges.end;

  function browseFromArrow(event: MouseEvent<HTMLButtonElement>): void {
    const viewport = list.current;
    if (viewport) {
      browsing.current = true;
      scrollTabs(viewport, event.currentTarget.dataset.edge === 'start' ? 'start' : 'end');
    }
  }

  return (
    <div
      className={`tabs-list-frame-proto ${className}`}
      data-orientation={orientation}
      data-size={size}
      data-scroll-start={start || undefined}
      data-scroll-end={end || undefined}
      data-scroll-rtl={edges.rtl || undefined}
      dir={dir}
      style={style}
    >
      <div
        {...props}
        ref={list}
        className="tabs-list-proto"
        role="tablist"
        aria-orientation={orientation}
        data-orientation={orientation}
        data-size={size}
        onKeyDown={navigate}
        onFocusCapture={(event) => {
          if (orientation === 'horizontal' && event.target.matches('[role="tab"]')) {
            browsing.current = false;
            revealTab(event.currentTarget, event.target);
            updateEdges(event.currentTarget);
          }
        }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFocused(null);
          }
        }}
        onWheel={(event) => {
          if (event.deltaX !== 0 || (event.shiftKey && event.deltaY !== 0)) {
            browsing.current = true;
          }
        }}
        onTouchMove={() => {
          browsing.current = true;
        }}
        onScroll={(event) => updateEdges(event.currentTarget)}
      >
        <div className="tabs-strip-proto" style={distributionStyle(distribution)}>
          {children}
        </div>
      </div>
      {(start || end) &&
        (['start', 'end'] as const).map((toward) => (
          <IconButton
            key={toward}
            className="tabs-scroll-arrow-proto"
            data-edge={toward}
            size={size}
            variant="ghost"
            icon={toward === 'start' ? CaretLeftIcon : CaretRightIcon}
            aria-label={toward === 'start' ? 'Scroll tabs back' : 'Scroll tabs forward'}
            tabIndex={-1}
            hidden={toward === 'start' ? !start : !end}
            onMouseDown={(event) => event.preventDefault()}
            onClick={browseFromArrow}
          />
        ))}
    </div>
  );
}

export interface TabsTabProps extends Omit<ComponentPropsWithoutRef<'button'>, 'value'> {
  readonly value: string;
  readonly iconLeft?: GlyphComponent;
  readonly count?: number | string;
  readonly countLabel?: string;
  /** Pins pointer feedback for side-by-side comparison. */
  readonly previewState?: 'hover' | 'press';
}

export function TabsTab({
  value,
  iconLeft,
  count,
  countLabel,
  previewState,
  disabled,
  children,
  'aria-label': name,
  className = '',
  onFocus,
  onClick,
  ...props
}: TabsTabProps): ReactElement {
  const tabs = useTabs();
  const selected = value === tabs.selected;
  const hasLabel = children !== undefined && children !== null;
  const iconOnly = !hasLabel && iconLeft !== undefined;
  const hint = iconOnly ? name : typeof children === 'string' ? children : undefined;

  function render(bindings?: HintTriggerBindings): ReactElement {
    return (
      <button
        {...props}
        {...bindings}
        id={`${tabs.id}-tab-${value}`}
        type="button"
        role="tab"
        className={`tab-proto ${className}`}
        aria-label={name}
        aria-selected={selected}
        aria-controls={`${tabs.id}-panel-${value}`}
        data-tab-value={value}
        data-preview={previewState}
        data-icon-only={iconOnly || undefined}
        tabIndex={value === (tabs.focused ?? tabs.selected) && !disabled ? 0 : -1}
        disabled={disabled}
        onFocus={(event) => {
          tabs.setFocused(value);
          bindings?.onFocus?.(event);
          onFocus?.(event);
        }}
        onClick={(event) => {
          bindings?.onClick?.(event);
          onClick?.(event);
          if (!event.defaultPrevented) {
            const viewport = event.currentTarget.closest<HTMLElement>('[role="tablist"]');
            if (viewport && tabs.orientation === 'horizontal') {
              revealTab(viewport, event.currentTarget);
            }
            tabs.select(value);
          }
        }}
      >
        <span className="tab-body-proto">
          {iconLeft && <Icon icon={iconLeft} size={tabs.size} />}
          {hasLabel && <bdi className="tab-label-proto">{children}</bdi>}
          {count !== undefined && (
            <Badge className="tab-count-proto" size="s" aria-hidden="true">
              {count}
            </Badge>
          )}
          {count !== undefined && countLabel && (
            <span className="tab-count-name-proto">{countLabel}</span>
          )}
        </span>
      </button>
    );
  }

  return hint && !disabled ? (
    <HintPreview canShow={canShowTabHint} trigger={render}>
      {hint}
    </HintPreview>
  ) : (
    render()
  );
}

export interface TabsContentProps extends ComponentPropsWithRef<'div'> {
  readonly value: string;
  readonly children?: ReactNode;
}

export function TabsContent({
  value,
  tabIndex = 0,
  className = '',
  ...props
}: TabsContentProps): ReactElement {
  const { id, selected } = useTabs();
  return (
    <div
      {...props}
      className={`tabs-content-proto ${className}`}
      id={`${id}-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`${id}-tab-${value}`}
      tabIndex={tabIndex}
      hidden={selected !== value}
    />
  );
}
