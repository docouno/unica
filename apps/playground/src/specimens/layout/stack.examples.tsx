import { Fragment } from 'react';
import { Divider, Input, Link, Stack, Text } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { LayoutExample } from './layout.examples.js';

export function NormalizedChildren({ ctx }: PreviewProps) {
  return (
    <LayoutExample>
      <Stack {...ctx.subject} gap={8} divider={<Divider decorative={false} />}>
        <Text size="body-s">Draft</Text>
        {null}
        {0}
        <Fragment key="checks">
          <Text size="body-s">In review</Text>
          <Text size="body-s">Ready</Text>
        </Fragment>
      </Stack>
    </LayoutExample>
  );
}

export function DividerToggle({ ctx }: PreviewProps) {
  const show = ctx.story?.controls.showDividers !== false;
  return (
    <LayoutExample>
      <Stack {...ctx.subject} gap={8} divider={show ? <Divider /> : undefined}>
        <Text weight="semibold">Checklist</Text>
        {null}
        <Fragment key="details">
          <Stack gap={4}>
            <Text as="label" htmlFor={ctx.id} size="body-s">
              Project name
            </Text>
            <Input id={ctx.id} defaultValue="Release notes" />
          </Stack>
          <Text size="body-s">Ready for review</Text>
        </Fragment>
      </Stack>
    </LayoutExample>
  );
}

const guide = 'https://github.com/docouno/unica/blob/main/docs/components/layout.md';
const helpLinks = [
  { section: 'responsive-values', title: 'Choose responsive values' },
  { section: 'flex-and-stack', title: 'Arrange a sequence' },
  { section: 'grid-and-griditem', title: 'Place an item in a grid' },
];

export function HelpTopics({ ctx }: PreviewProps) {
  return (
    <nav aria-label="Layout guide">
      <Stack {...ctx.subject} gap={8} divider={<Divider />}>
        {helpLinks.map(({ section, title }) => (
          <Link key={section} href={`${guide}#${section}`}>
            {title}
          </Link>
        ))}
      </Stack>
    </nav>
  );
}

export const helpTopicsCode = `import '@docouno/unica/styles.css';
import { Divider, Link, Stack } from '@docouno/unica';

<nav aria-label="Layout guide">
  <Stack gap={8} divider={<Divider />}>
${helpLinks.map(({ section, title }) => `    <Link href="${guide}#${section}">${title}</Link>`).join('\n')}
  </Stack>
</nav>`;
