import type { ReactElement, ReactNode } from 'react';
import { Divider, Flex, Kbd, KbdGroup, Stack, Text, Title } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { KeyboardViewport } from './kbd.viewport.js';
import './kbd.examples.css';

function KeyRow({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Stack gap={4}>
      <Text size="caption-l" color="secondary">
        <bdi>{label}</bdi>
      </Text>
      <Flex gap={8} wrap="wrap" align="center">
        {children}
      </Flex>
    </Stack>
  );
}

const keyFamilies = [
  { label: 'Letters and marks', keys: ['K', 'Z', '/', '+', 'F12'] },
  { label: 'Modifiers', keys: ['⌘', '⌥', '⌃', '⇧', 'Ctrl', 'Alt'] },
  { label: 'Navigation and editing', keys: ['←', '↑', '↓', '→', '⇥', '↵', '↩', '⌫'] },
  { label: 'Named keys', keys: ['Esc', 'Enter', 'Shift', 'Space', 'Page Down'] },
] as const;

export function Keycaps({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface}>
      {keyFamilies.map(({ label, keys }) => (
        <KeyRow key={label} label={label}>
          {keys.map((key) => (
            <Kbd {...(key === '⌘' ? ctx.subject : {})} key={key} size="m">
              {key}
            </Kbd>
          ))}
        </KeyRow>
      ))}
    </ExampleSurface>
  );
}

export function Sizing({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface}>
      <Title as="h3" size="heading-m">
        <bdi>
          Search with{' '}
          <KbdGroup separator="">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
        </bdi>
      </Title>
      <Text size="body-l">
        <bdi>
          Press <Kbd {...ctx.subject}>Enter</Kbd> to open a result.
        </bdi>
      </Text>
      <Text size="body-m">
        <bdi>
          Use <Kbd>Tab</Kbd> to move to the next result.
        </bdi>
      </Text>
      <Text size="body-s">
        <bdi>
          Use{' '}
          <KbdGroup>
            <Kbd>Shift</Kbd>
            <Kbd>Tab</Kbd>
          </KbdGroup>{' '}
          to move back.
        </bdi>
      </Text>
      <Text size="caption-l" color="secondary">
        <bdi>
          Press <Kbd>Esc</Kbd> to dismiss.
        </bdi>
      </Text>
      <Divider />
      <Flex align="end" gap={24} wrap="wrap">
        {(['s', 'm', 'l'] as const).map((size) => (
          <KeyRow key={size} label={size.toUpperCase()}>
            <Kbd size={size}>Esc</Kbd>
            <KbdGroup size={size}>
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </KeyRow>
        ))}
      </Flex>
    </ExampleSurface>
  );
}

export function Notation({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface}>
      <KeyRow label="Command palette · macOS">
        <KbdGroup size="s" separator="">
          <Kbd>⇧</Kbd>
          <Kbd>⌘</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      </KeyRow>
      <KeyRow label="Command palette · Windows and Linux">
        <KbdGroup size="s">
          <Kbd>Ctrl</Kbd>
          <Kbd>Shift</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      </KeyRow>
      <KeyRow label="Go to inbox">
        <KbdGroup size="s" separator="then">
          <Kbd>G</Kbd>
          <Kbd>I</Kbd>
        </KbdGroup>
      </KeyRow>
      <KeyRow label="Comment selection">
        <KbdGroup size="s" separator="then">
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>C</Kbd>
          </KbdGroup>
        </KbdGroup>
      </KeyRow>
      <KeyRow label="Activate a button">
        <Text size="body-s">
          <bdi>
            <Kbd>Enter</Kbd> or <Kbd>Space</Kbd>
          </bdi>
        </Text>
      </KeyRow>
      <KeyRow label="Compact search hint">
        <Kbd {...ctx.subject} size="s">
          ⌘K
        </Kbd>
      </KeyRow>
      <KeyRow label="German key names">
        <KbdGroup size="s" lang="de">
          <Kbd label="Steuerung">Strg</Kbd>
          <Kbd>Umschalt</Kbd>
          <Kbd>P</Kbd>
        </KbdGroup>
      </KeyRow>
    </ExampleSurface>
  );
}

export function Reflow({ ctx }: PreviewProps): ReactElement {
  return (
    <ExampleSurface surface={ctx.surface}>
      <Stack gap={8} divider={<Divider />}>
        <Flex align="center" justify="space-between" gap={8} wrap="wrap">
          <Text size="body-s">Open the palette</Text>
          <KbdGroup size="s">
            <Kbd>Ctrl</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
        </Flex>
        <Flex align="center" justify="space-between" gap={8} wrap="wrap">
          <Text size="body-s">Go to inbox</Text>
          <KbdGroup size="s" separator="then">
            <Kbd>G</Kbd>
            <Kbd>I</Kbd>
          </KbdGroup>
        </Flex>
        <Flex align="center" justify="space-between" gap={8} wrap="wrap">
          <Text size="body-s">Custom command</Text>
          <Text size="caption-l" color="secondary">
            Not assigned
          </Text>
        </Flex>
      </Stack>
      <Text size="body-m" className="kbd-reading-measure">
        <bdi>
          Open the command palette with{' '}
          <KbdGroup>
            <Kbd {...ctx.subject}>Ctrl</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
          .
        </bdi>
      </Text>
      <Stack gap={4} className="kbd-reading-measure">
        <Text size="caption-l" color="secondary">
          Comment selection
        </Text>
        <Flex dir="ltr" align="center" gap={8} wrap="wrap">
          <KbdGroup size="s">
            <Kbd>Control</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>
          <Flex align="center" gap={8}>
            <Text size="body-s">then</Text>
            <KbdGroup size="s">
              <Kbd>Control</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>C</Kbd>
            </KbdGroup>
          </Flex>
        </Flex>
      </Stack>
      <Stack gap={4} className="kbd-long-shortcut">
        <Text size="caption-l" color="secondary">
          Extended selection
        </Text>
        <KeyboardViewport label="Long shortcut example">
          <KbdGroup size="s">
            <Kbd>Control</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>Page Down</Kbd>
          </KbdGroup>
        </KeyboardViewport>
      </Stack>
    </ExampleSurface>
  );
}
