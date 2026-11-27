import type { ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import type { BreadcrumbPageProps } from './types.js';
import './breadcrumb.css';

/** Static current location with an explicit page marker. */
export function BreadcrumbPage({ className, ...props }: BreadcrumbPageProps): ReactElement {
  return <span {...props} aria-current="page" className={cx('unica-breadcrumb-page', className)} />;
}
