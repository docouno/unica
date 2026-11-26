import { Button, Flex, Stack, Tag, Text } from '@docouno/unica';
import type { TagProps, TagStatus } from '@docouno/unica';
import {
  CheckCircleIcon,
  EnvelopeIcon,
  FolderIcon,
  InfoIcon,
  TagIcon,
  UsersIcon,
  WarningCircleIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, ReactElement } from 'react';
import { TagsInput } from '../../prototypes/tags-input/tags-input.proto.js';
import type { PreviewProps } from '../../workbench/types.js';

const sizes = ['s', 'm', 'l'] as const;
const heights = { s: 22, m: 26, l: 30 } as const;
const anatomy = [
  { label: 'Research' },
  { label: 'Design systems', iconLeft: FolderIcon },
  { label: 'Platform team', iconLeft: UsersIcon },
];

function useRemovedTags() {
  const [removed, setRemoved] = useState<readonly string[]>([]);
  function toggle(key: string): void {
    setRemoved((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }
  return { removed, toggle };
}

interface SampleProps extends Omit<
  TagProps,
  'children' | 'onRemove' | 'removeLabel' | 'textValue'
> {
  readonly label: string;
  readonly language?: string;
  readonly removed: boolean;
  readonly onToggle: () => void;
}

function preventRepeatedEnter(event: KeyboardEvent<HTMLElement>): void {
  if (event.key === 'Enter' && event.repeat) {
    event.preventDefault();
  }
}

function SampleTag({ label, language, removed, onToggle, ...props }: SampleProps): ReactElement {
  const button = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);
  useLayoutEffect(() => {
    const target = button.current;
    if (
      moveFocus.current &&
      target &&
      target.ownerDocument.activeElement === target.ownerDocument.body
    ) {
      target.focus();
    }
    moveFocus.current = false;
  }, [removed]);
  function toggle(): void {
    moveFocus.current = button.current?.matches(':focus') ?? false;
    onToggle();
  }
  const content = language
    ? { children: <bdi lang={language}>{label}</bdi>, textValue: label }
    : { children: label };
  return removed ? (
    <Button
      type="button"
      ref={button}
      size="s"
      variant="ghost"
      tone="neutral"
      aria-label={`Undo removal of ${label}`}
      onClick={toggle}
      onKeyDown={preventRepeatedEnter}
    >
      Undo removal
    </Button>
  ) : (
    <Tag
      {...props}
      {...content}
      removeRef={button}
      removeLabel={`Remove ${label}`}
      onRemove={toggle}
    />
  );
}

export function Anatomy({ ctx }: PreviewProps): ReactElement {
  const { removed, toggle } = useRemovedTags();
  return (
    <Stack gap={24}>
      {sizes.map((size) => (
        <div key={size} className="tag-demo-size-row">
          <Stack gap={2}>
            <Text as="span" size="caption-l" weight="semibold" color="secondary">
              {size.toUpperCase()}
            </Text>
            <Text as="span" size="caption-l" color="muted">
              <bdi dir="ltr">{heights[size]} px min</bdi>
            </Text>
          </Stack>
          <Flex wrap="wrap" align="center" gap={8}>
            {anatomy.map(({ label, iconLeft }) => {
              const key = `${size}-${label}`;
              return (
                <SampleTag
                  key={key}
                  {...ctx.subject}
                  size={size}
                  label={label}
                  {...(iconLeft ? { iconLeft } : {})}
                  removed={removed.includes(key)}
                  onToggle={() => toggle(key)}
                />
              );
            })}
          </Flex>
        </div>
      ))}
    </Stack>
  );
}

const meanings = [
  { status: 'neutral', label: 'Research', iconLeft: TagIcon },
  { status: 'accent', label: 'Featured', iconLeft: FolderIcon },
  { status: 'info', label: 'External', iconLeft: InfoIcon },
  { status: 'success', label: 'Verified', iconLeft: CheckCircleIcon },
  { status: 'warning', label: 'Needs review', iconLeft: WarningIcon },
  { status: 'danger', label: 'Invalid address', iconLeft: WarningCircleIcon },
] satisfies readonly {
  status: TagStatus;
  label: string;
  iconLeft: NonNullable<TagProps['iconLeft']>;
}[];

export function Palette({ ctx }: PreviewProps): ReactElement {
  const { removed, toggle } = useRemovedTags();
  return (
    <div className="tag-demo-palette">
      {meanings.map(({ status, label, iconLeft }) => (
        <Stack key={status} align="start" gap={8}>
          <Text size="caption-l" color="muted">
            {status}
          </Text>
          <SampleTag
            {...ctx.subject}
            status={status}
            label={label}
            iconLeft={iconLeft}
            removed={removed.includes(status)}
            onToggle={() => toggle(status)}
          />
        </Stack>
      ))}
    </div>
  );
}

const states = [
  { name: 'Available', props: {} },
  { name: 'Unavailable', props: { disabled: true } },
  { name: 'Removing', props: { loading: true } },
  { name: 'Unavailable while removing', props: { disabled: true, loading: true } },
] as const;

export function RemovalStates({ ctx }: PreviewProps): ReactElement {
  const { removed, toggle } = useRemovedTags();
  return (
    <div className="tag-demo-state-grid">
      {states.map(({ name, props }) => (
        <Stack key={name} align="start" gap={8}>
          <Text size="caption-l" color="muted">
            {name}
          </Text>
          {anatomy.slice(0, 2).map(({ label, iconLeft }) => {
            const key = `${name}-${label}`;
            return (
              <SampleTag
                {...ctx.subject}
                {...props}
                key={key}
                label={label}
                iconLeft={iconLeft}
                removed={removed.includes(key)}
                onToggle={() => toggle(key)}
              />
            );
          })}
        </Stack>
      ))}
    </div>
  );
}

const longValues = [
  { label: 'Internationalization and content accessibility', iconLeft: FolderIcon, lang: 'en' },
  { label: 'accessibility-reviews@workspace.example', iconLeft: EnvelopeIcon, lang: 'en' },
  { label: 'release_2026_11_accessibility_review', iconLeft: FolderIcon, lang: 'en' },
  { label: 'Локализация и доступность документов', iconLeft: FolderIcon, lang: 'ru' },
  { label: 'مراجعة مستندات مساحة العمل', iconLeft: FolderIcon, lang: 'ar' },
];

export function LongLabels({ ctx }: PreviewProps): ReactElement {
  const { removed, toggle } = useRemovedTags();
  const [full, setFull] = useState(false);
  const [inspected, setInspected] = useState('');
  const listId = useId();
  const active = longValues.filter(({ label }) => !removed.includes(label));
  const current = active.find(({ label }) => label === inspected);
  return (
    <Stack gap={24} data-example-disclosure="">
      <Flex wrap="wrap" align="center" gap={8} className="tag-demo-constrained">
        {longValues.map(({ label, iconLeft, lang }) => (
          <SampleTag
            {...ctx.subject}
            key={label}
            label={label}
            iconLeft={iconLeft}
            language={lang}
            removed={removed.includes(label)}
            onToggle={() => toggle(label)}
            onFocus={() => setInspected(label)}
            onMouseEnter={() => setInspected(label)}
          />
        ))}
      </Flex>
      <Text as="p" size="body-s" color="secondary" className="tag-demo-readout" aria-hidden="true">
        {current ? (
          <bdi lang={current.lang}>{current.label}</bdi>
        ) : (
          <bdi lang="en">
            {active.length > 0
              ? 'Focus or point to a label to read its full value.'
              : 'No assigned labels'}
          </bdi>
        )}
      </Text>
      <div>
        <Button
          type="button"
          size="s"
          variant="secondary"
          tone="neutral"
          aria-expanded={full}
          aria-controls={listId}
          onClick={() => setFull(!full)}
        >
          {full ? 'Hide full values' : 'Show full values'}
        </Button>
      </div>
      <ul id={listId} hidden={!full} className="tag-demo-full-values">
        {active.map(({ label, lang }) => (
          <li key={label}>
            <bdi lang={lang}>{label}</bdi>
          </li>
        ))}
        {active.length === 0 && <li>No assigned labels</li>}
      </ul>
    </Stack>
  );
}

export function EmbeddedTag({ ctx }: PreviewProps): ReactElement {
  const label = 'Internationalization and content accessibility for local workspaces';
  const [values, setValues] = useState<readonly string[]>([label]);
  return (
    <Stack gap={16} style={{ inlineSize: 'min(100%, 30rem)' }}>
      <Flex className="tag-demo-constrained">
        {values.includes(label) && (
          <Tag
            {...ctx.subject}
            removeLabel={`Remove ${label}`}
            onRemove={() => setValues((current) => current.filter((value) => value !== label))}
          >
            {label}
          </Tag>
        )}
      </Flex>
      <TagsInput label="Assigned values" values={values} onValuesChange={setValues} />
    </Stack>
  );
}
