import type { ComponentPropsWithRef, ReactElement } from 'react';
import './link.css';

export interface LinkProps extends ComponentPropsWithRef<'a'> {
  readonly tone?: 'accent' | 'neutral';
}

export function Link({
  tone = 'accent',
  className = '',
  href = '#',
  ...props
}: LinkProps): ReactElement {
  return <a {...props} href={href} className={`link-proto ${className}`} data-tone={tone} />;
}
