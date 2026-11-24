import { ProgressCircle, Text } from '@docouno/unica';
import { useId } from 'react';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { withActivityName } from './activity-name.js';
import { missingOperationName, progressCirclePreview } from './progress-circle-code.js';
import type { ProgressCircleValues } from './progress-circle.spec.js';

interface PlaygroundProps extends PreviewProps {
  readonly values: ProgressCircleValues;
}

export function ProgressCirclePlayground({ ctx, values }: PlaygroundProps): ReactElement {
  const labelId = useId();
  const { name, reference, value, attributes } = progressCirclePreview(values);
  if (!name && !reference) {
    return <Text size="body-s">{missingOperationName}</Text>;
  }
  return withActivityName(
    'ProgressCircle',
    labelId,
    reference,
    <ProgressCircle
      {...ctx.subject}
      {...attributes}
      value={value}
      aria-label={name}
      aria-labelledby={reference ? labelId : undefined}
    />,
  );
}
