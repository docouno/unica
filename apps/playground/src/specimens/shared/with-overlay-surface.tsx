import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from './example-surface.js';

export function withOverlaySurface<Props extends PreviewProps>(
  Preview: (props: Props) => ReactElement,
  sizing: 'content-box' | 'border-box' = 'content-box',
): (props: Props) => ReactElement {
  return function SurfacePreview(props: Props): ReactElement {
    const content = <Preview {...props} />;
    return props.ctx.surface === 'overlay' ? (
      <ExampleSurface surface="overlay" sizing={sizing}>
        {content}
      </ExampleSurface>
    ) : (
      content
    );
  };
}
