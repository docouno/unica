import type { ComponentPropsWithRef, ReactElement } from 'react';
import './table.css';

export interface TableProps extends ComponentPropsWithRef<'table'> {
  readonly size?: 's' | 'm' | 'l';
}

export function Table({ size = 's', className = '', ...props }: TableProps): ReactElement {
  return <table {...props} className={`table-proto ${className}`} data-size={size} />;
}

export function TableScroll({
  className = '',
  ...props
}: ComponentPropsWithRef<'div'>): ReactElement {
  return <div tabIndex={0} {...props} className={`table-scroll-proto ${className}`} />;
}
