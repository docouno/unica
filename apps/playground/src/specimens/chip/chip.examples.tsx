import { useState } from 'react';
import { BookOpenIcon, FileTextIcon, FolderIcon, StarIcon } from '@phosphor-icons/react';
import { Button, Checkbox, Chip, ChipGroup, Divider, Flex, Stack, Text } from '@docouno/unica';
import type { ChipGroupProps } from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import './chip.examples.css';

type ChipOption = ChipGroupProps['items'][number];

const sizes = ['s', 'm', 'l'] as const;
const formats: readonly ChipOption[] = [
  { value: 'all', label: 'All formats' },
  { value: 'articles', label: 'Articles', iconLeft: FileTextIcon },
  { value: 'guides', label: 'Guides', iconLeft: BookOpenIcon },
  { value: 'collections', label: 'Collections', iconLeft: FolderIcon },
];
const topics: readonly ChipOption[] = [
  { value: 'design', label: 'Design systems' },
  { value: 'web', label: 'Web platform' },
  { value: 'a11y', label: 'Accessibility' },
  { value: 'research', label: 'Research' },
  { value: 'content', label: 'Content design' },
  { value: 'security', label: 'Security', disabled: true },
];

export function SelectionWidths({ ctx }: PreviewProps) {
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      {sizes.map((size) => (
        <div className="chip-demo-size-row" key={size}>
          <Text size="caption-l" weight="medium" color="secondary">
            {size.toUpperCase()}
          </Text>
          <Flex gap={8} wrap="wrap" align="center">
            <Chip {...ctx.subject} size={size}>
              Research
            </Chip>
            <Chip {...ctx.subject} size={size} defaultChecked>
              Research
            </Chip>
            <Chip {...ctx.subject} size={size} iconLeft={FolderIcon}>
              Collections
            </Chip>
            <Chip {...ctx.subject} size={size} iconLeft={FolderIcon} defaultChecked>
              Collections
            </Chip>
          </Flex>
        </div>
      ))}
    </Stack>
  );
}

export function Interaction({ ctx }: PreviewProps) {
  return (
    <Stack gap={16} style={{ minInlineSize: 0 }}>
      {sizes.map((size) => (
        <Flex key={size} gap={8} wrap="wrap" align="center">
          <Chip {...ctx.subject} size={size}>
            Research
          </Chip>
          <Chip {...ctx.subject} size={size} iconLeft={StarIcon} defaultChecked>
            Favorites only
          </Chip>
          <Chip {...ctx.subject} size={size} disabled>
            Unavailable
          </Chip>
          <Chip {...ctx.subject} size={size} disabled defaultChecked>
            Policy included
          </Chip>
        </Flex>
      ))}
    </Stack>
  );
}

export function Groups({ ctx }: PreviewProps) {
  const [format, setFormat] = useState('all');
  const [selected, setSelected] = useState<readonly string[]>(['design', 'a11y']);
  useStoryAction(ctx, (action) => {
    setSelected(
      action === 'all' ? topics.filter((item) => !item.disabled).map((item) => item.value) : [],
    );
  });
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      <ChipGroup
        {...ctx.subject}
        label="Format"
        description="Choose one. All formats clears this facet."
        items={formats}
        value={format}
        onValueChange={setFormat}
      />
      <ChipGroup
        {...ctx.subject}
        multiple
        label="Topics"
        description="Choose any. Unavailable topics stay visible."
        items={topics}
        value={selected}
        onValueChange={setSelected}
      />
      <Text size="body-s" color="secondary" role="status">
        <bdi>
          {formats.find((item) => item.value === format)?.label} ·{' '}
          {selected.length
            ? `${selected.length} ${selected.length === 1 ? 'topic' : 'topics'} selected`
            : 'Any topic'}
        </bdi>
      </Text>
    </Stack>
  );
}

const longOptions = [
  { value: 'web', label: 'Platform architecture · Web applications', iconLeft: FolderIcon },
  { value: 'data', label: 'Platform architecture · Data infrastructure', iconLeft: FolderIcon },
  { value: 'email', label: 'documentation-review@example.com' },
  { value: 'id', label: 'release_candidate_2026_11_build_1847' },
] as const satisfies readonly ChipOption[];

export function Overflow({ ctx }: PreviewProps) {
  const [value, setValue] = useState<readonly string[]>(['web']);
  return (
    <form aria-label="Long filter options">
      <Stack gap={24} style={{ minInlineSize: 0 }}>
        <div className="chip-demo-capped">
          <ChipGroup
            {...ctx.subject}
            multiple
            name="topic"
            label="Long option names"
            description="These options have a local width limit."
            items={longOptions}
            value={value}
            onValueChange={setValue}
          />
        </div>
        <Text size="body-s" color="secondary" style={{ overflowWrap: 'anywhere' }} role="status">
          <bdi>
            Selected:{' '}
            {value.length
              ? longOptions
                  .filter((item) => value.includes(item.value))
                  .map((item) => item.label)
                  .join('; ')
              : 'None'}
          </bdi>
        </Text>
        <details className="chip-demo-details">
          <summary>Choose with full option names</summary>
          <Stack gap={8} style={{ marginBlockStart: 'var(--space-12)' }}>
            {longOptions.map((option) => (
              <Checkbox
                key={option.value}
                label={<bdi>{option.label}</bdi>}
                checked={value.includes(option.value)}
                onCheckedChange={(checked) =>
                  setValue((current) =>
                    checked
                      ? [...current, option.value]
                      : current.filter((v) => v !== option.value),
                  )
                }
              />
            ))}
          </Stack>
        </details>
      </Stack>
    </form>
  );
}

export function Availability({ ctx }: PreviewProps) {
  return (
    <ChipGroup
      {...ctx.subject}
      multiple
      label="Export formats"
      description="PDF is included by your workspace policy."
      items={[
        { value: 'pdf', label: 'PDF', disabled: true },
        { value: 'md', label: 'Markdown' },
        { value: 'html', label: 'HTML' },
      ]}
      defaultValue={['pdf', 'md']}
      disabled={ctx.story?.controls.locked === true}
    />
  );
}

const exportFormats = [
  { value: 'pdf', label: 'PDF' },
  { value: 'md', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
] as const satisfies readonly ChipOption[];

export function Validation({ ctx }: PreviewProps) {
  const [value, setValue] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <form
      onReset={() => {
        setValue(null);
        setAttempted(false);
        setMessage('');
      }}
      onInvalid={() => setAttempted(true)}
      onSubmit={(event) => {
        event.preventDefault();
        const format = new FormData(event.currentTarget).get('format');
        const selected = exportFormats.find((option) => option.value === format);
        if (selected) {
          setMessage(`Ready to export as ${selected.label}.`);
        }
      }}
    >
      <Stack gap={24}>
        <ChipGroup
          {...ctx.subject}
          name="format"
          label="File format"
          description="Choose one. Required for export."
          required
          status={attempted && value === null ? 'danger' : undefined}
          message={attempted && value === null ? 'Choose a format to continue.' : undefined}
          items={exportFormats}
          value={value}
          onValueChange={(next) => {
            setValue(next);
            setMessage('');
          }}
        />
        <Flex gap={8} wrap="wrap" align="center">
          <Button size="s" type="submit">
            Continue
          </Button>
          <Button size="s" type="reset" variant="ghost" tone="neutral">
            Clear choice
          </Button>
        </Flex>
        <Text size="body-s" color="secondary" role="status">
          <bdi>{message}</bdi>
        </Text>
      </Stack>
    </form>
  );
}

export function ResultFeedback({ ctx }: PreviewProps) {
  const [selected, setSelected] = useState<readonly string[]>(['design']);
  const [result, setResult] = useState<{
    request: number;
    phase: 'ready' | 'waiting' | 'failed';
  }>({ request: 0, phase: 'ready' });
  useStoryAction(ctx, (action) => {
    const completed = action === 'stale' ? result.request - 1 : result.request;
    setResult((current) => {
      if (completed !== current.request || current.phase === 'ready') {
        return current;
      }
      return { ...current, phase: action === 'fail' ? 'failed' : 'ready' };
    });
  });
  const { phase } = result;
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      <ChipGroup
        {...ctx.subject}
        multiple
        label="Topics"
        description="Selection is immediate. Result feedback appears below the options."
        items={topics.slice(0, 3)}
        value={selected}
        onValueChange={(next) => {
          setSelected(next);
          setResult((current) => ({ request: current.request + 1, phase: 'waiting' }));
        }}
      />
      <Text size="body-s" color="secondary" role="status">
        <bdi>
          {phase === 'waiting'
            ? 'Updating results…'
            : phase === 'failed'
              ? 'Results could not be updated. Your selection is kept.'
              : `${selected.length} topic ${selected.length === 1 ? 'filter' : 'filters'} applied.`}
        </bdi>
      </Text>
    </Stack>
  );
}

export function FloatingFilters({ ctx }: PreviewProps) {
  return (
    <div style={{ inlineSize: 'min(100%, 34rem)', minInlineSize: 0 }}>
      <ExampleSurface surface={ctx.surface} sizing="border-box" gap={24}>
        <ChipGroup
          {...ctx.subject}
          multiple
          label="Include in search"
          description="Choose any content types."
          items={formats.slice(1)}
          defaultValue={['articles', 'guides']}
        />
        <Stack gap={16}>
          <Divider />
          <div>
            <Chip size="s" iconLeft={StarIcon} defaultChecked>
              Favorites only
            </Chip>
          </div>
        </Stack>
      </ExampleSurface>
    </div>
  );
}
