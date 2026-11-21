import { Children, isValidElement } from 'react';
import type { ComponentPropsWithRef, JSX, ReactNode } from 'react';

import { devWarningsEnabled } from '../../core/devWarningsEnabled.js';
import {
  type LayoutStyle,
  type Responsive,
  type Spacing,
  breakpointValue,
  breakpoints,
  layoutClass,
  setResponsive,
  space,
} from './responsive.js';

import './layout.css';

type TrackCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
const maxTrackCount = 12;
const areaName = /^[a-zA-Z0-9_\u0080-\u{10ffff}-]+$/u;
const areaTokens = /[a-zA-Z0-9_\u0080-\u{10ffff}-]+|\.+|[^ \t\n\r\f]/gu;

export interface GridProps extends ComponentPropsWithRef<'div'> {
  columns?: Responsive<TrackCount> | undefined;
  gap?: Responsive<Spacing> | undefined;
  flow?: 'row' | 'column' | undefined;
  areas?: readonly string[] | undefined;
}

interface GridAreas {
  width: number;
  rows: readonly (readonly string[])[];
}

function parseAreas(areas: readonly string[], warn: boolean): GridAreas | undefined {
  const rows = areas.map((row) => row.match(areaTokens) ?? []);
  const width = rows[0]?.length ?? 0;
  if (!width || width > maxTrackCount) {
    if (warn) {
      console.warn('Grid areas must have between 1 and 12 cells in each row.');
    }
    return;
  }
  for (const row of rows) {
    if (row.length !== width) {
      if (warn) {
        console.warn('Grid areas rows must all have the same number of cells.');
      }
      return;
    }
    if (row.some((cell) => !cell.startsWith('.') && !areaName.test(cell))) {
      if (warn) {
        console.warn('Grid areas contains a cell with an invalid name.');
      }
      return;
    }
  }
  return { width, rows };
}

function checkAreas({ rows }: GridAreas): Set<string> {
  const bounds = new Map<string, { top: number; left: number; right: number; bottom: number }>();
  rows.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell.startsWith('.')) {
        return;
      }
      const box = bounds.get(cell);
      if (box) {
        box.left = Math.min(box.left, x);
        box.right = Math.max(box.right, x);
        box.bottom = y;
      } else {
        bounds.set(cell, { top: y, left: x, right: x, bottom: y });
      }
    });
  });

  for (const [name, { top, left, right, bottom }] of bounds) {
    const rectangle = rows.slice(top, bottom + 1);
    if (!rectangle.every((row) => row.slice(left, right + 1).every((cell) => cell === name))) {
      console.warn(`Grid areas cell "${name}" must form a single rectangle.`);
    }
  }
  return new Set(bounds.keys());
}

function checkGrid(
  children: ReactNode,
  columns: GridProps['columns'],
  areas: GridAreas | undefined,
): void {
  const names = areas ? checkAreas(areas) : undefined;
  let trackCount = areas?.width ?? 1;
  const tracks = breakpoints.map((breakpoint) => {
    trackCount = breakpointValue(columns, breakpoint) ?? trackCount;
    if (areas && trackCount !== areas.width) {
      console.warn(`Grid columns at ${breakpoint} must match the ${areas.width}-cell areas map.`);
    }
    return { breakpoint, available: trackCount };
  });
  Children.forEach(children, (child) => {
    if (!isValidElement<GridItemProps>(child) || child.type !== GridItem) {
      return;
    }
    if (child.props.area !== undefined) {
      if (!names?.has(child.props.area)) {
        console.warn(`GridItem area "${child.props.area}" is absent from its parent Grid areas.`);
      }
      return;
    }
    let span = 1;
    for (const { breakpoint, available } of tracks) {
      span = breakpointValue(child.props.span, breakpoint) ?? span;
      if (span > available) {
        console.warn(`GridItem span ${span} exceeds ${available} Grid columns at ${breakpoint}.`);
      }
    }
  });
}

export function Grid({
  className,
  style,
  columns,
  gap,
  flow,
  areas,
  children,
  ...props
}: GridProps): JSX.Element {
  const layout: LayoutStyle = {};
  const warn = devWarningsEnabled();
  const map = areas === undefined ? undefined : parseAreas(areas, warn);
  if (warn) {
    checkGrid(children, columns, map);
  }
  if (map) {
    layout['--_grid-area-width'] = map.width;
    layout['--_grid-areas'] = map.rows.map((row) => `"${row.join(' ')}"`).join(' ');
  }
  if (flow !== undefined) {
    layout['--_grid-flow'] = flow;
  }
  setResponsive(layout, 'grid-columns', columns);
  setResponsive(layout, 'grid-gap', gap, space);
  return (
    <div
      {...props}
      className={layoutClass('unica-grid', className)}
      style={{ ...layout, ...style }}
    >
      {children}
    </div>
  );
}

export type GridItemProps = ComponentPropsWithRef<'div'> &
  (
    { area: string; span?: never } | { area?: undefined; span?: Responsive<TrackCount> | undefined }
  );

function areaLine(area: string, edge: 'start' | 'end'): string {
  // An explicit line occurrence avoids the named-area shorthand in <grid-line>.
  // Only leading digits need escaping after validating the name and adding the suffix.
  const name = `${area}-${edge}`.replace(/^(-?)([0-9])/u, '$1\\3$2 ');
  return `1 ${name}`;
}

export function GridItem({ className, style, area, span, ...props }: GridItemProps): JSX.Element {
  const layout: LayoutStyle = {};
  if (area === undefined) {
    setResponsive(layout, 'grid-item-span', span, (tracks) => `span ${tracks}`);
  } else {
    if (span !== undefined && devWarningsEnabled()) {
      console.warn('GridItem area takes precedence over span. Supply only one of these props.');
    }
    if (areaName.test(area)) {
      layout['--_grid-item-area-start'] = areaLine(area, 'start');
      layout['--_grid-item-area-end'] = areaLine(area, 'end');
    } else if (devWarningsEnabled()) {
      console.warn(`GridItem area "${area}" is not a valid cell name.`);
    }
  }
  return (
    <div
      {...props}
      className={layoutClass('unica-grid-item', className)}
      style={{ ...layout, ...style }}
    />
  );
}
