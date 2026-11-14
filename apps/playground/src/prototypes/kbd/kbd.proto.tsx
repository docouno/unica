import type { ComponentPropsWithRef, ReactElement } from 'react';
import './kbd.css';

export function Kbd({ className = '', ...props }: ComponentPropsWithRef<'kbd'>): ReactElement {
  return <kbd {...props} className={`kbd-proto ${className}`} />;
}

export function KbdGroup({
  className = '',
  ...props
}: ComponentPropsWithRef<'span'>): ReactElement {
  return <span {...props} className={`kbd-group-proto ${className}`} />;
}
