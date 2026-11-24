import { useId, useState } from 'react';
import {
  CheckCircleIcon,
  EraserIcon,
  FileTextIcon,
  PauseCircleIcon,
  TextBIcon,
  TextItalicIcon,
} from '@phosphor-icons/react';
import { Button, Flex, Icon, IconButton, Input, Stack, Text } from '@docouno/unica';
import { ExampleSurface } from '../shared/example-surface.js';
import type { PreviewProps } from '../../workbench/types.js';

export function EditorExample({ ctx }: PreviewProps) {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  return (
    <ExampleSurface surface={ctx.surface}>
      <Flex role="group" aria-label="Text formatting" gap={4} wrap="wrap">
        <IconButton
          icon={TextBIcon}
          aria-label="Bold"
          size="s"
          variant="ghost"
          pressed={bold}
          onPressedChange={setBold}
        />
        <IconButton
          icon={TextItalicIcon}
          aria-label="Italic"
          size="s"
          variant="ghost"
          pressed={italic}
          onPressedChange={setItalic}
        />
        <IconButton
          icon={EraserIcon}
          aria-label="Clear formatting"
          size="s"
          variant="ghost"
          disabled={!bold && !italic}
          onClick={() => {
            setBold(false);
            setItalic(false);
          }}
        />
      </Flex>
      <Text size="body-l" weight={bold ? 'bold' : 'regular'} italic={italic}>
        <Icon {...ctx.subject} icon={FileTextIcon} usage="slot" /> <bdi>Release notes</bdi>
      </Text>
    </ExampleSurface>
  );
}

export const editorCode = `import { useState } from 'react';
import { EraserIcon, FileTextIcon, TextBIcon, TextItalicIcon } from '@phosphor-icons/react';
import '@docouno/unica/styles.css';
import { Flex, Icon, IconButton, Stack, Text } from '@docouno/unica';

export function TextFormatting() {
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);

  return (
    <Stack gap={12}>
      <Flex role="group" aria-label="Text formatting" gap={4} wrap="wrap">
        <IconButton icon={TextBIcon} aria-label="Bold" size="s" variant="ghost"
          pressed={bold} onPressedChange={setBold} />
        <IconButton icon={TextItalicIcon} aria-label="Italic" size="s" variant="ghost"
          pressed={italic} onPressedChange={setItalic} />
        <IconButton icon={EraserIcon} aria-label="Clear formatting" size="s" variant="ghost"
          disabled={!bold && !italic} onClick={() => {
            setBold(false);
            setItalic(false);
          }} />
      </Flex>
      <Text size="body-l" weight={bold ? 'bold' : 'regular'} italic={italic}>
        <Icon icon={FileTextIcon} usage="slot" /> <bdi>Release notes</bdi>
      </Text>
    </Stack>
  );
}`;

export function ConnectorExample({ ctx }: PreviewProps) {
  const fieldId = useId();
  const [title, setTitle] = useState('Release notes');
  const [sync, setSync] = useState({ paused: false, snapshot: title });
  const mirroredTitle = sync.paused ? sync.snapshot : title;

  return (
    <ExampleSurface surface={ctx.surface}>
      <Stack gap={4}>
        <Text as="label" size="body-s" htmlFor={fieldId}>
          Source title
        </Text>
        <Input
          id={fieldId}
          size="s"
          width="full"
          dir="auto"
          value={title}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
      </Stack>
      <Text size="body-s" style={{ overflowWrap: 'anywhere' }}>
        <bdi>Mirrored title</bdi> · <bdi>{mirroredTitle.trim() ? mirroredTitle : 'Untitled'}</bdi>
      </Text>
      <Flex align="center" gap={12} wrap="wrap">
        <Text size="body-s" role="status">
          <Icon
            {...ctx.subject}
            icon={sync.paused ? PauseCircleIcon : CheckCircleIcon}
            usage="slot"
            color={sync.paused ? 'warning' : 'success'}
          />{' '}
          <bdi>{sync.paused ? 'Sync paused' : 'Sync active'}</bdi>
        </Text>
        <Button
          size="s"
          variant="secondary"
          onClick={() => setSync({ paused: !sync.paused, snapshot: title })}
        >
          {sync.paused ? 'Resume sync' : 'Pause sync'}
        </Button>
      </Flex>
    </ExampleSurface>
  );
}

export const connectorCode = `import { useId, useState } from 'react';
import { CheckCircleIcon, PauseCircleIcon } from '@phosphor-icons/react';
import '@docouno/unica/styles.css';
import { Button, Flex, Icon, Input, Stack, Text } from '@docouno/unica';

export function TitleSync() {
  const fieldId = useId();
  const [title, setTitle] = useState('Release notes');
  const [sync, setSync] = useState({ paused: false, snapshot: title });
  const mirroredTitle = sync.paused ? sync.snapshot : title;

  return (
    <Stack gap={12}>
      <Stack gap={4}>
        <Text as="label" size="body-s" htmlFor={fieldId}>Source title</Text>
        <Input id={fieldId} size="s" width="full" dir="auto" value={title}
          onChange={(event) => setTitle(event.currentTarget.value)} />
      </Stack>
      <Text size="body-s" style={{ overflowWrap: 'anywhere' }}>
        <bdi>Mirrored title</bdi> · <bdi>{mirroredTitle.trim() ? mirroredTitle : 'Untitled'}</bdi>
      </Text>
      <Flex align="center" gap={12} wrap="wrap">
        <Text size="body-s" role="status">
          <Icon icon={sync.paused ? PauseCircleIcon : CheckCircleIcon} usage="slot"
            color={sync.paused ? 'warning' : 'success'} />{' '}
          <bdi>{sync.paused ? 'Sync paused' : 'Sync active'}</bdi>
        </Text>
        <Button size="s" variant="secondary"
          onClick={() => setSync({ paused: !sync.paused, snapshot: title })}>
          {sync.paused ? 'Resume sync' : 'Pause sync'}
        </Button>
      </Flex>
    </Stack>
  );
}`;
