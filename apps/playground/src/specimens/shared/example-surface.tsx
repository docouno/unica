import { Stack } from '@docouno/unica';
import type { Spacing } from '@docouno/unica';
import type { ReactElement, ReactNode } from 'react';
import type { Surface } from '../../workbench/types.js';
import './example-surface.css';

export function ExampleSurface({
  surface,
  gap = 12,
  children,
}: {
  readonly surface: Surface;
  readonly gap?: Spacing;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Stack
      gap={gap}
      data-surface={surface}
      className={
        surface === 'overlay' ? 'example-surface unica-overlay-surface' : 'example-surface'
      }
    >
      {children}
    </Stack>
  );
}
