import type { ReactElement, ReactNode } from 'react';
import type { Surface } from '../workbench/types.js';
import { Text } from '@docouno/unica';
import './binary-examples.css';

export function Sample({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="binary-demo-sample">
      <Text as="span" size="caption-l" color="muted">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </div>
  );
}

export function BinaryPlate({
  children,
  surface,
}: {
  readonly children: ReactNode;
  readonly surface: Surface;
}): ReactElement {
  return (
    <div
      data-plate={surface}
      data-surface={surface}
      className={
        surface === 'overlay' ? 'binary-demo-plate unica-overlay-surface' : 'binary-demo-plate'
      }
    >
      {children}
    </div>
  );
}
