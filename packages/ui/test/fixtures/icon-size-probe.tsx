import type { JSX } from 'react';
import { useComponentDefaults, type UnicaComponentDefaults } from '../../src/core/UnicaProvider.js';

type IconSize = NonNullable<UnicaComponentDefaults['Icon']>['size'];

interface IconSizeProbeProps {
  readonly label: string;
  readonly size?: IconSize;
  readonly groupSize?: IconSize;
}

export function IconSizeProbe({ label, size, groupSize }: IconSizeProbeProps): JSX.Element {
  const resolvedSize = useComponentDefaults('Icon', 'size', {
    instance: size,
    group: groupSize,
    builtIn: 'inherit',
  });
  const width = resolvedSize === 'inherit' ? '1em' : `var(--size-${resolvedSize}-icon)`;

  return (
    <button type="button" data-size={resolvedSize} style={{ width }}>
      {label}
    </button>
  );
}
