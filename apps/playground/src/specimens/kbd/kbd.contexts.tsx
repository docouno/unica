import { useId, useState } from 'react';
import { Box, Button, Card, Flex, Input, Kbd, Stack, Text, Title, Tooltip } from '@docouno/unica';
import { ExampleSurface } from '../shared/example-surface.js';
import { MenuPreview } from '../../prototypes/menu/menu.proto.js';
import type { PreviewProps } from '../../workbench/types.js';

const documents = ['Release notes', 'Design review', 'Support handbook'];

export function Surfaces({ ctx }: PreviewProps) {
  const fieldId = useId();
  const hintId = useId();
  const [query, setQuery] = useState('');
  const matches = documents.filter((title) =>
    title.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <ExampleSurface surface={ctx.surface}>
      <Text size="body-s">
        <bdi>
          Use <Kbd {...ctx.subject}>Tab</Kbd> to reach the document filter.
        </bdi>
      </Text>
      <Stack gap={4}>
        <Text as="label" htmlFor={fieldId} size="body-s">
          Filter documents
        </Text>
        <Box style={{ position: 'relative' }}>
          <Input
            id={fieldId}
            aria-describedby={hintId}
            aria-keyshortcuts="Escape"
            width="full"
            placeholder="Search by title"
            value={query}
            style={{ paddingInlineEnd: 'calc(3em + var(--space-12))' }}
            onChange={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !event.nativeEvent.isComposing && query) {
                event.preventDefault();
                setQuery('');
              }
            }}
          />
          <Box
            as="span"
            aria-hidden="true"
            style={{
              position: 'absolute',
              insetBlock: 0,
              insetInlineEnd: 'var(--space-8)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none',
            }}
          >
            <Kbd size="s">Esc</Kbd>
          </Box>
        </Box>
      </Stack>
      <Card size="s">
        <Stack gap={8}>
          <Title as="h3" size="heading-s">
            Matching documents
          </Title>
          <Text size="body-s" role="status">
            <bdi>{matches.join(' · ') || 'No matching documents'}</bdi>
          </Text>
          <Text id={hintId} size="caption-l" color="secondary">
            <bdi>
              Press <Kbd>Esc</Kbd> in the field to clear the filter.
            </bdi>
          </Text>
        </Stack>
      </Card>
    </ExampleSurface>
  );
}

export function OverlayContext({ ctx }: PreviewProps) {
  const [bold, setBold] = useState(false);
  return (
    <Stack gap={12} align="start" style={{ inlineSize: '100%', minInlineSize: 0 }}>
      <Flex
        className="kbd-formatting-panel unica-overlay-surface"
        data-surface="overlay"
        gap={12}
        align="center"
        wrap="wrap"
      >
        <Tooltip label="Toggle bold" shortcut={<Kbd {...ctx.subject}>↵</Kbd>}>
          <Button
            size="s"
            tone="neutral"
            variant="secondary"
            pressed={bold}
            onPressedChange={setBold}
          >
            Bold
          </Button>
        </Tooltip>
        <Text size="body-s" weight={bold ? 'bold' : 'regular'}>
          Document title
        </Text>
      </Flex>
      <MenuPreview
        label="Document commands"
        ref={(menu) => {
          // MenuPreview renders its own Kbd for each shortcut.
          const shortcuts = menu?.querySelectorAll('kbd');
          for (const [attribute, value] of Object.entries(ctx.subject)) {
            shortcuts?.forEach((key) => key.setAttribute(attribute, value));
          }
        }}
        items={[
          { id: 'find', label: 'Find in document', shortcut: '⌘F' },
          { id: 'palette', label: 'Command palette', shortcut: '⇧⌘P', preview: 'hover' },
          { id: 'separator', type: 'separator' },
          { id: 'compare', label: 'Compare revisions', shortcut: '⌘D', disabled: true },
        ]}
      />
    </Stack>
  );
}

export function OwnerStates({ ctx }: PreviewProps) {
  const controls = ctx.story?.controls;
  const variant =
    controls?.variant === 'secondary' || controls?.variant === 'ghost'
      ? controls.variant
      : 'primary';
  const tone =
    controls?.tone === 'danger' || controls?.tone === 'neutral' ? controls.tone : 'accent';
  const removing = tone === 'danger';
  const [count, setCount] = useState(1);
  const available = removing ? count > 0 : count < documents.length;
  return (
    <ExampleSurface surface={ctx.surface}>
      <Stack gap={8} align="start">
        <Button
          variant={variant}
          tone={tone}
          disabled={controls?.state === 'disabled' || !available}
          loading={controls?.state === 'loading'}
          onClick={() => setCount(removing ? count - 1 : count + 1)}
        >
          <bdi>
            {removing ? 'Remove bookmark' : 'Add bookmark'}{' '}
            <Kbd {...ctx.subject} aria-hidden="true">
              ↵
            </Kbd>
          </bdi>
        </Button>
        <Text size="body-s" role="status">
          <bdi>
            {count ? `Bookmarks · ${documents.slice(0, count).join(' · ')}` : 'No bookmarks'}
          </bdi>
        </Text>
      </Stack>
    </ExampleSurface>
  );
}

export function ActionContext({ ctx }: PreviewProps) {
  const fieldId = useId();
  const [saved, setSaved] = useState('Release notes');
  const [draft, setDraft] = useState('Release checklist');
  const title = draft.trim();
  const canSave = title !== '' && title !== saved;

  return (
    <ExampleSurface surface={ctx.surface}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave) {
            setSaved(title);
            setDraft(title);
            event.currentTarget.querySelector('input')?.focus();
          }
        }}
      >
        <Stack gap={8} align="start">
          <Text as="label" htmlFor={fieldId} size="body-s">
            Document label
          </Text>
          <Input
            id={fieldId}
            dir="auto"
            width="full"
            value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)}
          />
          <Button type="submit" variant="secondary" disabled={!canSave}>
            <bdi>
              Save{' '}
              <Kbd {...ctx.subject} aria-hidden="true">
                ↵
              </Kbd>
            </bdi>
          </Button>
        </Stack>
      </form>
      <Text size="body-s" role="status" style={{ overflowWrap: 'anywhere' }}>
        <bdi>Saved label</bdi> · <bdi>{saved}</bdi>
      </Text>
    </ExampleSurface>
  );
}

export const actionsCode = `import { useId, useState } from 'react';
import '@docouno/unica/styles.css';
import { Button, Input, Kbd, Stack, Text } from '@docouno/unica';

export function DocumentLabel() {
  const fieldId = useId();
  const [saved, setSaved] = useState('Release notes');
  const [draft, setDraft] = useState('Release checklist');
  const title = draft.trim();
  const canSave = title !== '' && title !== saved;

  return (
    <Stack gap={12}>
      <form onSubmit={(event) => {
        event.preventDefault();
        if (canSave) {
          setSaved(title);
          setDraft(title);
          event.currentTarget.querySelector('input')?.focus();
        }
      }}>
        <Stack gap={8} align="start">
          <Text as="label" htmlFor={fieldId} size="body-s">Document label</Text>
          <Input id={fieldId} dir="auto" width="full" value={draft}
            onChange={(event) => setDraft(event.currentTarget.value)} />
          <Button type="submit" variant="secondary" disabled={!canSave}>
            <bdi>Save <Kbd aria-hidden="true">↵</Kbd></bdi>
          </Button>
        </Stack>
      </form>
      <Text size="body-s" role="status" style={{ overflowWrap: 'anywhere' }}>
        <bdi>Saved label</bdi> · <bdi>{saved}</bdi>
      </Text>
    </Stack>
  );
}`;
