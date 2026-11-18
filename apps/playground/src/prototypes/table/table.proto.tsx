import { useLayoutEffect, useRef, useState } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { CaretDownIcon, CaretUpDownIcon, CaretUpIcon } from '@phosphor-icons/react';
import './table.css';
import '../scrollbar/scrollbar.css';

export type TableSize = 's' | 'm' | 'l';
export type TableAlign = 'start' | 'center' | 'end';
export type TableSortDirection = 'none' | 'ascending' | 'descending';

export interface TableProps extends ComponentPropsWithRef<'table'> {
  readonly size?: TableSize;
  readonly striped?: boolean;
  readonly stickyHeader?: boolean;
}

export function Table({
  size = 'm',
  striped,
  stickyHeader,
  className = '',
  ...props
}: TableProps): ReactElement {
  return (
    <table
      {...props}
      className={`table-proto ${className}`}
      data-size={size}
      data-striped={striped || undefined}
      data-sticky-header={stickyHeader || undefined}
    />
  );
}

export function TableCaption(props: ComponentPropsWithRef<'caption'>): ReactElement {
  return <caption {...props} />;
}

export function TableHeader(props: ComponentPropsWithRef<'thead'>): ReactElement {
  return <thead {...props} />;
}

export function TableBody(props: ComponentPropsWithRef<'tbody'>): ReactElement {
  return <tbody {...props} />;
}

export function TableFooter(props: ComponentPropsWithRef<'tfoot'>): ReactElement {
  return <tfoot {...props} />;
}

export interface TableRowProps extends Omit<
  ComponentPropsWithRef<'tr'>,
  'onClick' | 'tabIndex' | 'aria-selected'
> {
  readonly selected?: boolean;
}

export function TableRow({ selected, ...props }: TableRowProps): ReactElement {
  return <tr {...props} data-selected={selected || undefined} />;
}

interface TableHeadingProps extends Omit<ComponentPropsWithRef<'th'>, 'align'> {
  readonly align?: TableAlign;
}

export interface TableColumnHeaderProps extends TableHeadingProps {
  readonly sortDirection?: TableSortDirection;
  readonly onSort?: () => void;
}

export function TableColumnHeader({
  align,
  sortDirection = 'none',
  onSort,
  children,
  ...props
}: TableColumnHeaderProps): ReactElement {
  const Caret =
    sortDirection === 'ascending'
      ? CaretUpIcon
      : sortDirection === 'descending'
        ? CaretDownIcon
        : CaretUpDownIcon;
  return (
    <th
      scope="col"
      {...props}
      data-align={align}
      data-sortable={onSort ? '' : undefined}
      aria-sort={onSort && sortDirection !== 'none' ? sortDirection : undefined}
    >
      {onSort ? (
        <button className="table-sort-proto" type="button" onClick={onSort}>
          <span>{children}</span>
          <Caret aria-hidden="true" weight="bold" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function TableRowHeader({ align, ...props }: TableHeadingProps): ReactElement {
  return <th scope="row" {...props} data-align={align} />;
}

export interface TableCellProps extends Omit<ComponentPropsWithRef<'td'>, 'align'> {
  readonly align?: TableAlign;
  /** Uses the inset and sizing for a full-width ghost field. */
  readonly editor?: boolean;
}

export function TableCell({ align, editor, ...props }: TableCellProps): ReactElement {
  return <td {...props} data-align={align} data-editor={editor || undefined} />;
}

function visibleTableArea(
  viewport: HTMLDivElement,
  target: Element,
): { top: number; right: number; bottom: number; left: number } {
  const box = viewport.getBoundingClientRect();
  const left = box.left + viewport.clientLeft;
  const top = box.top + viewport.clientTop;
  const header =
    target.closest('tbody, tfoot') &&
    viewport.querySelector(':scope > table[data-sticky-header] > thead');
  return {
    top: Math.max(top, header ? header.getBoundingClientRect().bottom : top),
    right: left + viewport.clientWidth,
    bottom: top + viewport.clientHeight,
    left,
  };
}

export function TableScroll({
  className = '',
  'aria-label': label,
  'aria-labelledby': labelledBy,
  onFocusCapture,
  ...props
}: Omit<ComponentPropsWithRef<'div'>, 'ref' | 'tabIndex' | 'role'>): ReactElement {
  const viewport = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const element = viewport.current;
    const table = element?.querySelector(':scope > table');
    if (!element || !table) {
      return;
    }
    const stickyHeader = table.querySelector('thead');
    const update = (): void => {
      setOverflowing(
        element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight,
      );
      const height = table.hasAttribute('data-sticky-header') ? stickyHeader?.offsetHeight : 0;
      element.style.setProperty('--table-stuck-header-height', `${height ?? 0}px`);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    observer.observe(table);
    if (stickyHeader) {
      observer.observe(stickyHeader);
    }
    update();
    const dismissScrolledPopover = (event: Event): void => {
      if (event.target !== element) {
        return;
      }
      const anchor = element.querySelector('[aria-expanded="true"][aria-controls]');
      const panelId = anchor?.getAttribute('aria-controls');
      const panel = panelId ? element.ownerDocument.getElementById(panelId) : null;
      if (!anchor || !panel?.matches(':popover-open')) {
        return;
      }
      const visible = visibleTableArea(element, anchor);
      const box = anchor.getBoundingClientRect();
      if (
        box.bottom <= visible.top ||
        box.top >= visible.bottom ||
        box.right <= visible.left ||
        box.left >= visible.right
      ) {
        if (panel.contains(element.ownerDocument.activeElement)) {
          element.focus({ preventScroll: true });
        }
        if (panel.matches(':popover-open')) {
          panel.hidePopover();
        }
      }
    };
    // Handle anchor loss before the floating surface's window scroll callback.
    const view = element.ownerDocument.defaultView;
    view?.addEventListener('scroll', dismissScrolledPopover, true);
    return () => {
      observer.disconnect();
      view?.removeEventListener('scroll', dismissScrolledPopover, true);
    };
  }, []);

  return (
    <div
      {...props}
      ref={viewport}
      className={`table-scroll-proto scrollbar-proto ${className}`}
      tabIndex={overflowing ? 0 : undefined}
      role={overflowing ? 'region' : undefined}
      aria-label={overflowing ? label : undefined}
      aria-labelledby={overflowing ? labelledBy : undefined}
      onFocusCapture={(event) => {
        onFocusCapture?.(event);
        const element = event.currentTarget;
        const target = event.target;
        const popup = target.closest(':popover-open');
        if (!overflowing || target === element || (popup && element.contains(popup))) {
          return;
        }
        const visible = visibleTableArea(element, target);
        const box = target.getBoundingClientRect();
        const inset = 4;
        const left =
          box.left < visible.left + inset
            ? box.left - visible.left - inset
            : Math.max(0, box.right - visible.right + inset);
        const top =
          box.top < visible.top + inset
            ? box.top - visible.top - inset
            : Math.max(0, box.bottom - visible.bottom + inset);
        if (left || top) {
          element.scrollBy({ left, top, behavior: 'instant' });
        }
      }}
    />
  );
}
