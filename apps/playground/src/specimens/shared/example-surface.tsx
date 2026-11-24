import { Stack } from '@docouno/unica';
import type { Spacing } from '@docouno/unica';
import type { ReactElement, ReactNode } from 'react';
import type { Surface } from '../../workbench/types.js';
import './example-surface.css';

export function ExampleSurface({
  surface,
  gap = 12,
  sizing,
  children,
}: {
  readonly surface: Surface;
  readonly gap?: Spacing;
  readonly sizing?: 'content-box' | 'border-box';
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Stack
      gap={gap}
      data-surface={surface}
      data-sizing={sizing}
      className={
        surface === 'overlay' ? 'example-surface unica-overlay-surface' : 'example-surface'
      }
    >
      {children}
    </Stack>
  );
}
