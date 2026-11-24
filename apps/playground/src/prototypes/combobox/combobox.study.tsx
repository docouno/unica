import type { ReactElement, ReactNode } from 'react';
import { Text } from '@docouno/unica';
import './combobox.examples.css';

export function Study({
  title,
  surface,
  children,
}: {
  readonly title: string;
  readonly surface?: 'base' | 'overlay';
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div
      className={
        surface === 'overlay'
          ? 'suggestion-study-proto unica-overlay-surface'
          : 'suggestion-study-proto'
      }
      data-surface={surface}
    >
      <Text size="caption-l" color="secondary">
        {title}
      </Text>
      <div inert>{children}</div>
    </div>
  );
}
