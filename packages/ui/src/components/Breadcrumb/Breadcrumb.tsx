import { Children, Fragment, isValidElement } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { cx, dataFlag } from '../../core/cx.js';
import type { BreadcrumbProps } from './types.js';
import './breadcrumb.css';

function trailItems(children: ReactNode): ReactElement[] {
  const items = Children.map(children, (child) => {
    if (child === null || child === undefined || (typeof child === 'string' && !child.trim())) {
      return null;
    }
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return trailItems(child.props.children);
    }
    return <Fragment>{child}</Fragment>;
  });
  // React flattens returned arrays and combines keys with their source paths.
  return (items ?? []) as ReactElement[];
}

/** Named navigation landmark for an ordered hierarchy of links and static labels. */
export function Breadcrumb({
  children,
  className,
  size = 'm',
  underline = 'always',
  separator = '/',
  'aria-label': label,
  'aria-labelledby': labelledBy,
  dangerouslySetInnerHTML,
  ...props
}: BreadcrumbProps): ReactElement | null {
  if (dangerouslySetInnerHTML !== undefined) {
    throw new Error('Breadcrumb requires its trail to be supplied as ordinary children.');
  }

  const items = trailItems(children);
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      {...props}
      aria-label={label ?? (labelledBy?.trim() ? undefined : 'Breadcrumb')}
      aria-labelledby={labelledBy}
      className={cx('unica-breadcrumb', className)}
      data-unica-breadcrumb-size={size}
      data-unica-breadcrumb-underline={underline}
    >
      <ol
        className="unica-breadcrumb-list"
        role="list"
        data-unica-breadcrumb-spacing-only={dataFlag(separator === null)}
      >
        {items.map((item, index) => (
          <li key={item.key} className="unica-breadcrumb-item">
            {index > 0 && separator !== null && (
              <span className="unica-breadcrumb-separator" aria-hidden="true">
                {separator}
              </span>
            )}
            <span className="unica-breadcrumb-label">{item}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}
