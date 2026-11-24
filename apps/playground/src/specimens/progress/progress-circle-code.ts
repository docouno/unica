import { withActivityNameCode } from './activity-name.js';
import { previewProps, previewText } from '../preview-code.js';
import type { ProgressCircleValues } from './progress-circle.spec.js';

export const missingOperationName = 'Give the operation an accessible name or a referenced label.';

export function progressCirclePreview(values: ProgressCircleValues) {
  const { determinate, value, max, size, tone } = values;
  const measured = determinate && Number.isFinite(value) && Number.isFinite(max) && max > 0;
  const valueText = measured ? values['aria-valuetext'].trim() : '';
  return {
    name: values['aria-label'].trim(),
    reference: values.labelledByText.trim(),
    value: determinate ? value : null,
    attributes: {
      size,
      tone,
      ...(determinate ? { max } : {}),
      ...(valueText ? { 'aria-valuetext': valueText } : {}),
    },
  };
}

export function progressCircleCode(values: ProgressCircleValues): string {
  const { name, reference, value, attributes } = progressCirclePreview(values);
  if (!name && !reference) {
    return `import { Text } from '@docouno/unica';

<Text size="body-s">${missingOperationName}</Text>`;
  }
  const props = previewProps(attributes, { size: 'inherit', tone: 'inherit', max: 100 });
  const label = name ? ` aria-label=${previewText(name)}` : '';
  return withActivityNameCode(
    'ProgressCircle',
    reference,
    (labelledBy) => `<ProgressCircle value={${value}}${props}${label}${labelledBy} />`,
  );
}
