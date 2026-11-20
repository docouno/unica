import { size, disabled, choice, toggle, eventProp } from '../control-props.js';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { BookOpenIcon, FileTextIcon, FolderIcon, StarIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { Badge } from '../../prototypes/badge/badge.proto.js';
import { Tag } from '../../prototypes/tag/tag.proto.js';
import { Chip, ChipGroup } from '../../prototypes/chip/chip.proto.js';
import type { ChipOption, ChipPreviewState, ChipSize } from '../../prototypes/chip/chip.proto.js';
import '../../prototypes/chip/chip.examples.css';

const sizes: readonly ChipSize[] = ['s', 'm', 'l'];
const heights = { s: 20, m: 24, l: 28 } as const;
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

function Anatomy(): ReactElement {
  return (
    <div className="chip-demo-stack">
      {sizes.map((size) => (
        <div className="chip-demo-size-row" key={size}>
          <span className="chip-demo-size-label">
            {size.toUpperCase()} <small>{heights[size]} px</small>
          </span>
          <div className="chip-demo-flow">
            <Chip size={size}>Research</Chip>
            <Chip size={size} defaultChecked>
              Research
            </Chip>
            <Chip size={size} iconLeft={FolderIcon}>
              Collections
            </Chip>
            <Chip size={size} iconLeft={FolderIcon} defaultChecked>
              Collections
            </Chip>
          </div>
        </div>
      ))}
      <p className="chip-demo-note">
        Live controls. Select either label: its width stays fixed and the leading icon becomes a
        check.
      </p>
    </div>
  );
}

function States(): ReactElement {
  const states: readonly { label: string; preview?: ChipPreviewState; disabled?: boolean }[] = [
    { label: 'Rest' },
    { label: 'Hover · pinned', preview: 'hover' },
    { label: 'Press · pinned', preview: 'active' },
    { label: 'Focus · pinned', preview: 'focus' },
    { label: 'Unavailable', disabled: true },
  ];
  return (
    <div className="chip-demo-stack">
      <div className="chip-demo-state-grid">
        {states.map((state) => (
          <div className="chip-demo-sample" key={state.label}>
            <span className="chip-demo-caption">{state.label}</span>
            {[false, true].map((checked) => (
              <div className="chip-demo-flow" key={String(checked)}>
                <Chip
                  checked={checked}
                  onChange={() => undefined}
                  disabled={state.disabled}
                  previewState={state.preview}
                >
                  Research
                </Chip>
                <Chip
                  checked={checked}
                  onChange={() => undefined}
                  iconLeft={FolderIcon}
                  disabled={state.disabled}
                  previewState={state.preview}
                >
                  Collections
                </Chip>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="chip-demo-flow chip-demo-rule">
        {sizes.map((size) => (
          <Chip key={size} size={size} defaultChecked previewState="focus">
            {size.toUpperCase()} focus
          </Chip>
        ))}
      </div>
      <p className="chip-demo-note">
        The comparison above pins selection and pointer states. Focus a live option below to inspect
        real keyboard focus with hover or press.
      </p>
      <div className="chip-demo-flow">
        <Chip>Design systems</Chip>
        <Chip defaultChecked iconLeft={StarIcon}>
          Favorites only
        </Chip>
      </div>
    </div>
  );
}

function Groups(): ReactElement {
  const [format, setFormat] = useState<string | null>('all');
  const [selected, setSelected] = useState<readonly string[]>(['design', 'a11y']);
  return (
    <div className="chip-demo-stack">
      <ChipGroup
        label="Format"
        description="Choose one. All formats clears this facet."
        items={formats}
        value={format}
        onValueChange={setFormat}
      />
      <ChipGroup
        multiple
        label="Topics"
        description="Choose any. Unavailable topics stay visible."
        items={topics}
        value={selected}
        onValueChange={setSelected}
      />
      <div className="chip-demo-summary" role="status">
        {format === 'all' ? 'All formats' : formats.find((item) => item.value === format)?.label} ·{' '}
        {selected.length ? `${selected.length} topics selected` : 'Any topic'}
      </div>
      <div className="chip-demo-flow">
        <button
          className="chip-demo-text-action"
          type="button"
          onClick={() =>
            setSelected(topics.filter((item) => !item.disabled).map((item) => item.value))
          }
        >
          Select all available topics
        </button>
        <button className="chip-demo-text-action" type="button" onClick={() => setSelected([])}>
          Clear topics
        </button>
      </div>
      <p className="chip-demo-note">
        Single: arrows select, Tab leaves the group. Multiple: Tab visits each option, Space toggles
        it. Rows wrap in reading order.
      </p>
    </div>
  );
}

function ScaleAndFit(): ReactElement {
  return (
    <div className="chip-demo-stack">
      {sizes.map((size) => (
        <div className="chip-demo-fit-row" key={size}>
          <span className="chip-demo-caption">
            {size.toUpperCase()} · independent heights, shared text scale
          </span>
          <div className="chip-demo-flow">
            <Badge size={size}>12 results</Badge>
            <Chip size={size} defaultChecked iconLeft={StarIcon}>
              Favorites
            </Chip>
            <Tag
              size={size}
              removeLabel="Remove Design systems"
              onRemove={() => undefined}
              disabled
            >
              Design systems
            </Tag>
            <Button size={size} variant="secondary" tone="neutral">
              Apply
            </Button>
          </div>
          <div className="chip-demo-flow">
            {['XS', 'S', 'M', 'L', 'XL'].map((label) => (
              <Chip key={label} size={size} defaultChecked={label === 'M'}>
                {label}
              </Chip>
            ))}
          </div>
        </div>
      ))}
      <p className="chip-demo-note">
        Whole-chip targets reserve at least 24 × 24 px; touch reserves 44 × 44 px. No target
        overlaps a neighboring option.
      </p>
    </div>
  );
}

function Overflow(): ReactElement {
  const options: readonly ChipOption[] = [
    { value: 'web', label: 'Platform architecture · Web applications', iconLeft: FolderIcon },
    { value: 'data', label: 'Platform architecture · Data infrastructure', iconLeft: FolderIcon },
    { value: 'email', label: 'documentation-review@example.com' },
    { value: 'id', label: 'release_candidate_2026_11_build_1847' },
  ];
  const [value, setValue] = useState<readonly string[]>(['web']);
  return (
    <div className="chip-demo-stack">
      <div className="chip-demo-capped">
        <ChipGroup
          multiple
          label="Long option names"
          description="These options have a local width limit."
          items={options}
          value={value}
          onValueChange={setValue}
        />
      </div>
      <div className="chip-demo-summary">
        Selected:{' '}
        {value.length
          ? options
              .filter((item) => value.includes(item.value))
              .map((item) => item.label)
              .join('; ')
          : 'None'}
      </div>
      <details className="chip-demo-details">
        <summary>Choose with full option names</summary>
        <div className="chip-demo-full-options">
          {options.map((option) => (
            <label key={option.value}>
              <input
                type="checkbox"
                checked={value.includes(option.value)}
                onChange={(event) =>
                  setValue((current) =>
                    event.target.checked
                      ? [...current, option.value]
                      : current.filter((item) => item !== option.value),
                  )
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </details>
      <p className="chip-demo-note">
        Hover or keyboard focus reveals truncated text. The full-name chooser also works on touch,
        without guessing between similar prefixes. Opening it never changes selection.
      </p>
    </div>
  );
}

function Availability(): ReactElement {
  const [locked, setLocked] = useState(false);
  return (
    <div className="chip-demo-stack">
      <ChipGroup
        multiple
        label="Export formats"
        description="PDF is included by your workspace policy."
        items={[
          { value: 'pdf', label: 'PDF', disabled: true },
          { value: 'md', label: 'Markdown' },
          { value: 'html', label: 'HTML' },
        ]}
        defaultValue={['pdf', 'md']}
        disabled={locked}
      />
      <label className="chip-demo-native-toggle">
        <input
          type="checkbox"
          checked={locked}
          onChange={(event) => setLocked(event.target.checked)}
        />{' '}
        Lock the whole group
      </label>
      <p className="chip-demo-note">
        Unavailable values retain their check and material. They receive no focus, hover, or press
        feedback.
      </p>
    </div>
  );
}

function Validation(): ReactElement {
  const id = useId();
  const [value, setValue] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState('');
  const error = attempted && !value ? 'Choose a format to continue.' : undefined;
  return (
    <form
      className="chip-demo-stack"
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        if (!value) {
          event.currentTarget.querySelector<HTMLInputElement>('input:not(:disabled)')?.focus();
          setMessage('');
        } else {
          setMessage(`Ready to export as ${value.toUpperCase()}.`);
        }
      }}
    >
      <ChipGroup
        name={id}
        label="File format"
        description="Choose one. Required for export."
        error={error}
        items={formats.slice(1)}
        value={value}
        onValueChange={(next) => {
          setValue(next);
          setMessage('');
        }}
      />
      <div className="chip-demo-flow">
        <Button size="s" type="submit">
          Continue
        </Button>
        <Button
          size="s"
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
      </div>
      <p className="chip-demo-note" role="status">
        {message ||
          'A missing answer belongs to the group. Individual options keep their normal material.'}
      </p>
    </form>
  );
}

function ResultFeedback(): ReactElement {
  const [selected, setSelected] = useState<readonly string[]>(['design']);
  const [phase, setPhase] = useState<'ready' | 'waiting' | 'failed'>('ready');
  return (
    <div className="chip-demo-stack">
      <ChipGroup
        multiple
        label="Topics"
        description="Selection is immediate. Result feedback lives below the options."
        items={topics.slice(0, 3)}
        value={selected}
        onValueChange={(next) => {
          setSelected(next);
          setPhase('waiting');
        }}
      />
      <div className="chip-demo-summary" role="status">
        {phase === 'waiting'
          ? 'Updating results…'
          : phase === 'failed'
            ? 'Results could not be updated. Your selection is kept. Try again.'
            : `${selected.length} topic filters applied.`}
      </div>
      <div className="chip-demo-flow">
        <Button size="s" variant="secondary" tone="neutral" onClick={() => setPhase('ready')}>
          Show results
        </Button>
        <Button size="s" variant="ghost" tone="neutral" onClick={() => setPhase('failed')}>
          Preview failure
        </Button>
      </div>
      <p className="chip-demo-note">
        Manual result preview. Waiting never replaces the selection check or disables unrelated
        options.
      </p>
    </div>
  );
}

function Overlay(): ReactElement {
  return (
    <div className="chip-demo-overlay">
      <ChipGroup
        multiple
        label="Include in search"
        description="Choose any content types."
        items={formats.slice(1)}
        defaultValue={['articles', 'guides']}
      />
      <div className="chip-demo-rule">
        <Chip size="s" iconLeft={StarIcon} defaultChecked>
          Favorites only
        </Chip>
      </div>
    </div>
  );
}

export default defineComponent({
  id: 'chip',
  title: 'Chip',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary:
    'Compact, wrapping choices. Calm neutral options become accented and checked when selected.',
  componentName: 'Chip',
  form: 'wrap',
  props: {
    size,
    disabled,
    type: {
      ...choice(
        'Selection',
        'Native selection input used for this study.',
        ['checkbox', 'radio'],
        'checkbox',
      ),
      demo: true,
    },
    defaultChecked: toggle('Selection', 'Start selected.'),
    iconLeft: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      description: 'Leading icon or no icon.',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'folder', label: 'Folder', code: 'FolderIcon' },
      ],
    },
    onChange: eventProp('Reports whether the filter chip is selected.', 'handleChange'),
  },
  render: ({ values, ctx }) => {
    const { iconLeft, ...control } = values;
    return (
      <Chip
        {...control}
        {...ctx.subject}
        key={String(values.defaultChecked)}
        name={`formats-${ctx.id}`}
        value="collections"
        style={{ justifySelf: 'center' }}
        iconLeft={iconLeft === 'folder' ? FolderIcon : undefined}
        onChange={(event) => ctx.action('onChange')(event.currentTarget.checked)}
      >
        Collections
      </Chip>
    );
  },
  code: (_values, attributes) =>
    `<Chip name="formats" value="collections"${attributes}>Collections</Chip>`,
  matrixViews: [
    {
      id: 'anatomy',
      rows: 'size',
      cols: 'defaultChecked',
      group: 'iconLeft',
      title: 'Scale & selection',
      reference: () => <Anatomy />,
    },
  ],
  cases: [
    {
      id: 'groups',
      title: 'Single & multiple choice',
      kind: 'behavior',
      render: () => <Groups />,
    },
    {
      id: 'states',
      title: 'Interaction states',
      kind: 'behavior',
      render: () => <States />,
    },
    {
      id: 'availability',
      title: 'Unavailable values',
      kind: 'behavior',
      render: () => <Availability />,
    },
    {
      id: 'overflow',
      title: 'Long names & narrow spaces',
      kind: 'content',
      render: () => <Overflow />,
    },
    {
      id: 'validation',
      title: 'Required choice',
      kind: 'behavior',
      render: () => <Validation />,
    },
    {
      id: 'feedback',
      title: 'Selection & result feedback',
      kind: 'behavior',
      render: () => <ResultFeedback />,
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <Overlay />,
    },
  ],
  usage: [
    {
      id: 'fit',
      title: 'Compact geometry & neighboring controls',
      code: `<>
  <Badge size="m">12 results</Badge>
  <Chip size="m" defaultChecked iconLeft={StarIcon}>Favorites</Chip>
  <Tag size="m">Design systems</Tag>
  <Button size="m" variant="secondary" tone="neutral">Apply</Button>
</>`,
      render: () => <ScaleAndFit />,
    },
  ],
});
