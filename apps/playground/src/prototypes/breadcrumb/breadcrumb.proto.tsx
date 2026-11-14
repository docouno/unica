import type { ComponentPropsWithRef, ReactElement } from 'react';
import './breadcrumb.css';

export interface BreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}
export interface BreadcrumbProps extends ComponentPropsWithRef<'nav'> {
  readonly items: readonly (string | BreadcrumbItem)[];
}

export function Breadcrumb({
  items,
  className = '',
  ...props
}: BreadcrumbProps): ReactElement | null {
  if (!items.length) {
    return null;
  }
  return (
    <nav aria-label="Breadcrumb" {...props} className={`breadcrumb-proto ${className}`}>
      <ol>
        {items.map((item, index) => {
          const entry = typeof item === 'string' ? { label: item } : item;
          const current = index === items.length - 1;
          return (
            <li key={`${entry.label}-${index}`}>
              {index > 0 && (
                <span className="breadcrumb-separator-proto" aria-hidden="true">
                  /
                </span>
              )}
              {entry.href && !current ? (
                <a href={entry.href}>{entry.label}</a>
              ) : (
                <span aria-current={current ? 'page' : undefined}>{entry.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
