import { Flex, Stack, Text } from '@docouno/unica';
import type { ReactElement } from 'react';
import { previewText } from '../preview-code.js';

export const labelledByText = {
  kind: 'string',
  group: 'Semantics',
  label: 'Referenced label',
  default: '',
  description:
    'Link the example to separate visible text with aria-labelledby. This text takes precedence over aria-label.',
  demo: true,
} as const;

type Activity = 'Progress' | 'ProgressCircle' | 'Spinner';

export function withActivityName(
  component: Activity,
  labelId: string,
  text: string,
  children: ReactElement,
): ReactElement {
  if (!text.trim()) {
    return children;
  }
  const label = (
    <Text id={labelId} as="span" size="body-s" dir="auto" data-activity-label={component}>
      {text.trim()}
    </Text>
  );
  return component === 'Progress' ? (
    <Stack gap={8} style={{ inlineSize: '100%' }}>
      {label}
      {children}
    </Stack>
  ) : (
    <Flex align="center" gap={8}>
      {children}
      {label}
    </Flex>
  );
}

export function withActivityNameCode(
  component: Activity,
  text: string,
  render: (labelledBy: string) => string,
): string {
  const reference = text.trim();
  if (!reference) {
    return `import { ${component} } from '@docouno/unica';\n\n${render('')}`;
  }
  const subject = render(' aria-labelledby={labelId}');
  const label = `<Text id={labelId} as="span" size="body-s" dir="auto">${previewText(reference)}</Text>`;
  const stacked = component === 'Progress';
  const layout = stacked
    ? `<Stack gap={8} style={{ inlineSize: '100%' }}>\n        ${label}\n        ${subject}\n      </Stack>`
    : `<Flex align="center" gap={8}>\n        ${subject}\n        ${label}\n      </Flex>`;
  return `import { useId } from 'react';
import { ${component}, ${stacked ? 'Stack' : 'Flex'}, Text } from '@docouno/unica';

export function Named${component}() {
  const labelId = useId();
  return (
    ${layout}
  );
}`;
}
