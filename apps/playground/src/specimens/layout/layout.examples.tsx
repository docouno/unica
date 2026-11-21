import type { ReactNode } from 'react';
import './layout.examples.css';

export function LayoutExample({ children }: { children: ReactNode }) {
  return <div className="layout-example">{children}</div>;
}
