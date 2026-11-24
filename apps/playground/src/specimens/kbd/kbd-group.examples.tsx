import { Card, Kbd, KbdGroup, Stack, Text, Title } from '@docouno/unica';
import { ExampleSurface } from '../shared/example-surface.js';
import type { PreviewProps } from '../../workbench/types.js';

export function GroupSizeExample({ ctx }: PreviewProps) {
  return (
    <ExampleSurface surface={ctx.surface}>
      <Stack gap={4} align="start">
        <Text size="caption-l" color="secondary">
          Medium group
        </Text>
        <KbdGroup size="m">
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Stack>
      <Stack gap={4} align="start">
        <Text size="caption-l" color="secondary">
          Small final key
        </Text>
        <KbdGroup {...ctx.subject} size="m">
          <Kbd>Ctrl</Kbd>
          <Kbd size="s">K</Kbd>
        </KbdGroup>
      </Stack>
    </ExampleSurface>
  );
}

export function VisibleStepsExample({ ctx }: PreviewProps) {
  const showShift = ctx.story?.controls.showShift !== false;
  const showEnter = ctx.story?.controls.showEnter !== false;
  return (
    <ExampleSurface surface={ctx.surface}>
      <Stack gap={4} align="start">
        <Text size="body-s">Selected keys</Text>
        <KbdGroup {...ctx.subject} size="s">
          <Kbd hidden={!showShift}>Shift</Kbd>
          {showEnter && <Kbd>Enter</Kbd>}
        </KbdGroup>
        {!showShift && !showEnter && (
          <Text size="caption-l" color="secondary">
            No keys selected
          </Text>
        )}
      </Stack>
    </ExampleSurface>
  );
}

export function SequenceExample({ ctx }: PreviewProps) {
  return (
    <ExampleSurface surface={ctx.surface}>
      <Card size="s">
        <Stack align="start" gap={8}>
          <Text size="caption-l" color="secondary">
            Windows and Linux
          </Text>
          <Title as="h3" size="heading-s">
            Comment selection
          </Title>
          <KbdGroup {...ctx.subject} separator="then" size="s">
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
            <KbdGroup>
              <Kbd>Ctrl</Kbd>
              <Kbd>C</Kbd>
            </KbdGroup>
          </KbdGroup>
        </Stack>
      </Card>
    </ExampleSurface>
  );
}

export const sequenceCode = `import '@docouno/unica/styles.css';
import { Card, Kbd, KbdGroup, Stack, Text, Title } from '@docouno/unica';

<Card size="s">
  <Stack align="start" gap={8}>
    <Text size="caption-l" color="secondary">Windows and Linux</Text>
    <Title as="h3" size="heading-s">Comment selection</Title>
    <KbdGroup separator="then" size="s">
      <KbdGroup><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup>
      <KbdGroup><Kbd>Ctrl</Kbd><Kbd>C</Kbd></KbdGroup>
    </KbdGroup>
  </Stack>
</Card>`;
