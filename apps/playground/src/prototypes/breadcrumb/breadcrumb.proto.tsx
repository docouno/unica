import { Children } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import './breadcrumb.css';

type BreadcrumbUnderline = 'always' | 'hover' | 'none';

export interface BreadcrumbProps extends ComponentPropsWithRef<'nav'> {
  readonly size?: 's' | 'm' | 'l';
  readonly underline?: BreadcrumbUnderline;
  readonly separator?: ReactNode;
}

export function Breadcrumb({
  size = 'm',
  underline = 'always',
  separator = '/',
  children,
  className = '',
  ...props
}: BreadcrumbProps): ReactElement | null {
  const items = Children.toArray(children).filter((item) => item !== '');
  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      {...props}
      className={`breadcrumb-proto ${className}`}
      data-size={size}
      data-underline={underline}
    >
      <ol
        className="breadcrumb-proto-list"
        role="list"
        data-spacing-only={separator === null || undefined}
      >
        {Children.map(items, (item, index) => (
          <li className="breadcrumb-proto-item">
            {index > 0 && separator !== null && (
              <span className="breadcrumb-proto-separator" aria-hidden="true">
                {separator}
              </span>
            )}
            <span className="breadcrumb-proto-value">{item}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export interface BreadcrumbLinkProps extends ComponentPropsWithRef<'a'> {
  readonly href: string;
  readonly underline?: BreadcrumbUnderline;
  readonly disabled?: boolean;
  readonly iconOnly?: boolean;
  /** Workbench pins for the comparison rows. */
  readonly previewState?: 'hover' | 'active';
  readonly previewFocus?: boolean;
}

export function BreadcrumbLink({
  href,
  disabled = false,
  underline,
  iconOnly = false,
  previewState,
  previewFocus,
  className = '',
  ref,
  ...props
}: BreadcrumbLinkProps): ReactElement {
  const nativeProps = disabled
    ? {
        children: props.children,
        id: props.id,
        'aria-label': props['aria-label'],
        'aria-labelledby': props['aria-labelledby'],
        'aria-describedby': props['aria-describedby'],
        'aria-current': props['aria-current'],
        'aria-disabled': true as const,
        role: 'link',
      }
    : { ...props, href };

  return (
    <a
      {...nativeProps}
      className={`breadcrumb-proto-link ${className}`}
      data-underline={underline}
      data-icon-only={iconOnly || undefined}
      data-preview-state={previewState}
      data-preview-focus={previewFocus || undefined}
      ref={ref}
    />
  );
}

export function BreadcrumbPage({
  className = '',
  ...props
}: ComponentPropsWithRef<'span'>): ReactElement {
  return <span {...props} aria-current="page" className={`breadcrumb-proto-page ${className}`} />;
}
