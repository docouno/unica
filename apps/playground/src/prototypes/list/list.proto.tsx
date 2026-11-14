import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import './list.css';

export function List({ className = '', ...props }: ComponentPropsWithRef<'ul'>): ReactElement {
  return <ul {...props} className={`list-proto ${className}`} />;
}

export interface ListItemProps extends Omit<ComponentPropsWithRef<'li'>, 'title'> {
  readonly title?: ReactNode;
  readonly description?: ReactNode;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
}

export function ListItem({
  title,
  description,
  leading,
  trailing,
  className = '',
  children,
  ...props
}: ListItemProps): ReactElement {
  return (
    <li {...props} className={`list-item-proto ${className}`}>
      {leading && <span className="list-leading-proto">{leading}</span>}
      <div className="list-copy-proto">
        {title && <div className="list-title-proto">{title}</div>}
        {description && <div className="list-description-proto">{description}</div>}
        {children}
      </div>
      {trailing && <span className="list-trailing-proto">{trailing}</span>}
    </li>
  );
}
