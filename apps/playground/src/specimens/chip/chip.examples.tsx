import { useState } from 'react';
import { BookOpenIcon, FileTextIcon, FolderIcon, StarIcon } from '@phosphor-icons/react';
import { Button, Checkbox, Divider, Flex, Stack, Text } from '@docouno/unica';
import { Chip, ChipGroup } from '../../prototypes/chip/chip.proto.js';
import type { ChipOption, ChipPreviewState } from '../../prototypes/chip/chip.proto.js';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import '../../prototypes/chip/chip.examples.css';

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

const states: readonly { label: string; preview?: ChipPreviewState; disabled?: boolean }[] = [
  { label: 'Rest' },
  { label: 'Hover', preview: 'hover' },
  { label: 'Press', preview: 'active' },
  { label: 'Focus', preview: 'focus' },
  { label: 'Unavailable', disabled: true },
];

export function Interaction({ ctx }: PreviewProps) {
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      <div className="chip-demo-state-grid" inert>
        {states.map((state) => (
          <Stack gap={12} key={state.label}>
            <Text size="caption-l" color="secondary">
              {state.label}
            </Text>
            {[false, true].map((checked) => (
              <Flex gap={8} wrap="wrap" align="center" key={String(checked)}>
                <Chip
                  defaultChecked={checked}
                  disabled={state.disabled}
                  previewState={state.preview}
                >
                  Research
                </Chip>
                <Chip
                  defaultChecked={checked}
                  iconLeft={FolderIcon}
                  disabled={state.disabled}
                  previewState={state.preview}
                >
                  Collections
                </Chip>
              </Flex>
            ))}
          </Stack>
        ))}
      </div>
      <Stack inert gap={16}>
        <Divider />
        <Flex gap={8} wrap="wrap" align="center">
          {sizes.map((size) => (
            <Chip key={size} {...ctx.subject} size={size} defaultChecked previewState="focus">
              {size.toUpperCase()} focus
            </Chip>
          ))}
        </Flex>
      </Stack>
      <Stack gap={8}>
        <Text size="caption-l" color="secondary">
          Live keyboard choices
        </Text>
        <Flex gap={8} wrap="wrap" align="center">
          <Chip>Design systems</Chip>
          <Chip defaultChecked iconLeft={StarIcon}>
            Favorites only
          </Chip>
        </Flex>
      </Stack>
    </Stack>
  );
}

export function Groups({ ctx }: PreviewProps) {
  const [format, setFormat] = useState('all');
  const [selected, setSelected] = useState<readonly string[]>(['design', 'a11y']);
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
      <Flex gap={8} wrap="wrap" align="center">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          onClick={() =>
            setSelected(topics.filter((item) => !item.disabled).map((item) => item.value))
          }
        >
          Select all available topics
        </Button>
        <Button size="s" variant="ghost" tone="neutral" onClick={() => setSelected([])}>
          Clear topics
        </Button>
      </Flex>
    </Stack>
  );
}

const longOptions: readonly ChipOption[] = [
  { value: 'web', label: 'Platform architecture · Web applications', iconLeft: FolderIcon },
  { value: 'data', label: 'Platform architecture · Data infrastructure', iconLeft: FolderIcon },
  { value: 'email', label: 'documentation-review@example.com' },
  { value: 'id', label: 'release_candidate_2026_11_build_1847' },
];

export function Overflow({ ctx }: PreviewProps) {
  const [value, setValue] = useState<readonly string[]>(['web']);
  return (
    <Stack gap={24} style={{ minInlineSize: 0 }}>
      <div className="chip-demo-capped">
        <ChipGroup
          {...ctx.subject}
          multiple
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
                  checked ? [...current, option.value] : current.filter((v) => v !== option.value),
                )
              }
            />
          ))}
        </Stack>
      </details>
    </Stack>
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

const exportFormats: readonly ChipOption[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'md', label: 'Markdown' },
  { value: 'html', label: 'HTML' },
];

export function Validation({ ctx }: PreviewProps) {
  const [value, setValue] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        if (!value) {
          event.currentTarget.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus();
        } else {
          setMessage(
            `Ready to export as ${exportFormats.find((option) => option.value === value)?.label}.`,
          );
        }
      }}
    >
      <Stack gap={24}>
        <ChipGroup
          {...ctx.subject}
          name="format"
          label="File format"
          description="Choose one. Required for export."
          error={attempted && !value ? 'Choose a format to continue.' : undefined}
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
          <Button
            size="s"
            type="button"
            variant="ghost"
            tone="neutral"
            onClick={() => {
              setValue(null);
              setAttempted(false);
              setMessage('');
            }}
          >
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
  const [phase, setPhase] = useState<'ready' | 'waiting' | 'failed'>('ready');
  useStoryAction(ctx, (action) => {
    if (phase !== 'ready') {
      setPhase(action === 'fail' ? 'failed' : 'ready');
    }
  });
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
          setPhase('waiting');
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
