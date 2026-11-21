import { defineGlyph } from '@docouno/unica';
import { createElement, type ComponentPropsWithRef } from 'react';

function WideSvg({ children, ...props }: ComponentPropsWithRef<'svg'>) {
  return createElement(
    'svg',
    { ...props, viewBox: '0 0 32 16' },
    children,
    createElement('path', {
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 2,
      d: 'M1 1h30v14H1zM7 8h18',
    }),
  );
}

export const WideGlyph = defineGlyph(WideSvg);
