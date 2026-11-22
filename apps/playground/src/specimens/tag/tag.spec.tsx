import { FormField } from '../../prototypes/form-field/form-field.proto.js';
import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import {
  CalendarBlankIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  FolderIcon,
  InfoIcon,
  LockSimpleIcon,
  TagIcon,
  UsersIcon,
  WarningCircleIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import type { BadgeStatus } from '@docouno/unica';
import { Badge, Input } from '@docouno/unica';
import { Button } from '../../prototypes/button/button.proto.js';
import { Tag, TagGroup } from '../../prototypes/tag/tag.proto.js';
import type { TagGroupItem, TagProps, TagSize } from '../../prototypes/tag/tag.proto.js';
import '../../prototypes/tag/tag.examples.css';

const { TagsInput } = await import('../../prototypes/tags-input/tags-input.proto.js');

const sizes: readonly TagSize[] = ['s', 'm', 'l'];
const heights = { s: 22, m: 26, l: 30 } as const;
const controlHeights = { s: 30, m: 40, l: 48 } as const;
const noRemoval = (): void => undefined;
const seed: readonly TagGroupItem[] = [
  { id: 'design', label: 'Design systems', removeLabel: 'Remove Design systems' },
  { id: 'api', label: 'API', removeLabel: 'Remove API' },
  { id: 'web', label: 'Web platform', removeLabel: 'Remove Web platform' },
  { id: 'a11y', label: 'Accessibility', removeLabel: 'Remove Accessibility' },
  { id: 'docs', label: 'Documentation', removeLabel: 'Remove Documentation' },
  { id: 'security', label: 'Security', removeLabel: 'Remove Security' },
];

function SampleTag(props: Omit<TagProps, 'onRemove'>): ReactElement {
  const [removed, setRemoved] = useState(false);
  const restore = useRef<HTMLButtonElement>(null);
  return removed ? (
    <button
      ref={restore}
      autoFocus
      type="button"
      className="tag-demo-restore"
      onClick={() => setRemoved(false)}
    >
      Restore label
    </button>
  ) : (
    <Tag {...props} onRemove={() => setRemoved(true)} />
  );
}

function Anatomy(): ReactElement {
  return (
    <div className="tag-demo-stack">
      {sizes.map((size) => (
        <div className="tag-demo-size-row" key={size}>
          <span className="tag-demo-size-label">
            {size.toUpperCase()} <span>{heights[size]} px</span>
          </span>
          <div className="tag-demo-flow">
            <SampleTag size={size} removeLabel="Remove Research">
              Research
            </SampleTag>
            <SampleTag size={size} iconLeft={FolderIcon} removeLabel="Remove Design systems">
              Design systems
            </SampleTag>
            <SampleTag size={size} iconLeft={UsersIcon} removeLabel="Remove Platform team">
              Platform team
            </SampleTag>
          </div>
        </div>
      ))}
    </div>
  );
}

function SizeFit(): ReactElement {
  const id = useId();
  const [values, setValues] = useState<readonly string[]>(['Design systems']);
  return (
    <div className="tag-demo-stack">
      {sizes.map((size) => (
        <div className="tag-demo-fit" key={size} data-size={size}>
          <span className="tag-demo-title">
            {size.toUpperCase()} · {heights[size]} px tag / {controlHeights[size]} px control
          </span>
          <div className="tag-demo-fit-fields">
            <FormField htmlFor={`${id}-value-${size}`} label="Single value" size={size}>
              <Input id={`${id}-value-${size}`} size={size} defaultValue="Design systems" />
            </FormField>
            <TagsInput
              size={size}
              label="Assigned values"
              values={values}
              onValuesChange={setValues}
              placeholder="Add value…"
            />
          </div>
          <div className="tag-demo-flow">
            <Badge size={size}>Verified</Badge>
            <SampleTag size={size} iconLeft={FolderIcon} removeLabel="Remove Research">
              Research
            </SampleTag>
            <Button
              size={size}
              variant="secondary"
              tone="neutral"
              onClick={() =>
                setValues((current) => {
                  let index = current.length + 1;
                  while (current.includes(`Label ${index}`)) {
                    index += 1;
                  }
                  return [...current, `Label ${index}`];
                })
              }
            >
              Add label
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Palette(): ReactElement {
  const roles: readonly {
    status: BadgeStatus;
    label: string;
    icon: NonNullable<TagProps['iconLeft']>;
  }[] = [
    { status: 'neutral', label: 'Research', icon: TagIcon },
    { status: 'accent', label: 'Featured', icon: FolderIcon },
    { status: 'info', label: 'External', icon: InfoIcon },
    { status: 'success', label: 'Verified', icon: CheckCircleIcon },
    { status: 'warning', label: 'Needs review', icon: WarningIcon },
    { status: 'danger', label: 'Invalid address', icon: WarningCircleIcon },
  ];
  return (
    <div className="tag-demo-palette">
      {roles.map(({ status, label, icon }) => (
        <div className="tag-demo-sample" key={status}>
          <span className="tag-demo-caption">{status}</span>
          <SampleTag status={status} iconLeft={icon} removeLabel={`Remove ${label}`}>
            {label}
          </SampleTag>
        </div>
      ))}
    </div>
  );
}

function RemovalStates(): ReactElement {
  return (
    <div className="tag-demo-stack">
      <div className="tag-demo-state-grid">
        <div className="tag-demo-sample">
          <span className="tag-demo-caption">Rest</span>
          <Tag onRemove={noRemoval} removeLabel="Remove Research">
            Research
          </Tag>
          <Tag iconLeft={FolderIcon} onRemove={noRemoval} removeLabel="Remove Design">
            Design
          </Tag>
        </div>
        <div className="tag-demo-sample">
          <span className="tag-demo-caption">Hover ×</span>
          <Tag previewState="hover" onRemove={noRemoval} removeLabel="Remove Research">
            Research
          </Tag>
          <Tag
            iconLeft={FolderIcon}
            previewState="hover"
            onRemove={noRemoval}
            removeLabel="Remove Design"
          >
            Design
          </Tag>
        </div>
        <div className="tag-demo-sample">
          <span className="tag-demo-caption">Press ×</span>
          <Tag previewState="active" onRemove={noRemoval} removeLabel="Remove Research">
            Research
          </Tag>
          <Tag
            iconLeft={FolderIcon}
            previewState="active"
            onRemove={noRemoval}
            removeLabel="Remove Design"
          >
            Design
          </Tag>
        </div>
        <div className="tag-demo-sample">
          <span className="tag-demo-caption">Keyboard</span>
          <Tag previewState="focus" onRemove={noRemoval} removeLabel="Remove Research">
            Research
          </Tag>
          <Tag
            iconLeft={FolderIcon}
            previewState="focus"
            onRemove={noRemoval}
            removeLabel="Remove Design"
          >
            Design
          </Tag>
        </div>
        <div className="tag-demo-sample">
          <span className="tag-demo-caption">Unavailable</span>
          <Tag disabled onRemove={noRemoval} removeLabel="Remove Research">
            Research
          </Tag>
          <Tag iconLeft={FolderIcon} disabled onRemove={noRemoval} removeLabel="Remove Design">
            Design
          </Tag>
        </div>
        <div className="tag-demo-sample">
          <span className="tag-demo-caption">Removing</span>
          <Tag pending onRemove={noRemoval} removeLabel="Removing Research">
            Research
          </Tag>
          <Tag iconLeft={FolderIcon} pending onRemove={noRemoval} removeLabel="Removing Design">
            Design
          </Tag>
        </div>
      </div>
      <div className="tag-demo-flow tag-demo-focus-sizes">
        {sizes.map((size) => (
          <Tag
            key={size}
            size={size}
            status="accent"
            previewState="focus"
            iconLeft={FolderIcon}
            onRemove={noRemoval}
            removeLabel={`Remove Design, ${size} preview`}
          >
            Design
          </Tag>
        ))}
      </div>
      <p className="tag-demo-note">
        Only the remove plate reacts. The label stays readable when removal is unavailable.
      </p>
    </div>
  );
}

function Collection({
  size,
  expanded = false,
  locked = false,
}: {
  size: TagSize;
  expanded?: boolean;
  locked?: boolean;
}): ReactElement {
  const [items, setItems] = useState(seed);
  const restore = useRef<HTMLButtonElement>(null);
  return (
    <div className="tag-demo-collection">
      <div className="tag-demo-heading">
        <span className="tag-demo-caption">
          {locked ? 'Removal locked' : `${size.toUpperCase()} · ${items.length} labels`}
        </span>
        <button
          ref={restore}
          className="tag-demo-restore"
          type="button"
          onClick={() => setItems(seed)}
        >
          Restore
        </button>
      </div>
      <TagGroup
        size={size}
        label={locked ? 'Locked labels' : `${size.toUpperCase()} labels`}
        items={
          locked
            ? items
            : items.map((item) =>
                item.id === 'web' ? { ...item, iconLeft: LockSimpleIcon, disabled: true } : item,
              )
        }
        disabled={locked}
        maxVisible={3}
        defaultExpanded={expanded}
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        emptyFocusRef={restore}
      />
      {locked && (
        <p className="tag-demo-note">
          Labels are required by this workspace. You can still reveal the full set.
        </p>
      )}
    </div>
  );
}

function Groups(): ReactElement {
  return (
    <div className="tag-demo-stack">
      {sizes.map((size) => (
        <Collection key={size} size={size} expanded={size === 'l'} />
      ))}
    </div>
  );
}

function LongLabels(): ReactElement {
  const [full, setFull] = useState(false);
  const [inspected, setInspected] = useState('');
  const values = [
    'Internationalization and content accessibility',
    'alexandra.chen@design.example',
    'release_2026_11_accessibility_review',
  ];
  const detailsId = useId();
  return (
    <div className="tag-demo-stack">
      <div className="tag-demo-flow tag-demo-constrained">
        {values.map((value, index) => (
          <SampleTag
            key={value}
            size="m"
            iconLeft={index === 1 ? EnvelopeIcon : FolderIcon}
            removeLabel={`Remove ${value}`}
            onFocus={() => setInspected(value)}
            onMouseEnter={() => setInspected(value)}
          >
            {value}
          </SampleTag>
        ))}
      </div>
      <p className="tag-demo-readout" aria-live="polite">
        {inspected || 'Focus a remove button or point to a label to read the full value.'}
      </p>
      <div>
        <button
          type="button"
          className="tag-demo-restore"
          aria-expanded={full}
          aria-controls={detailsId}
          onClick={() => setFull(!full)}
        >
          {full ? 'Hide full values' : 'Show full values'}
        </button>
      </div>
      <ul id={detailsId} hidden={!full} className="tag-demo-full-values">
        {values.map((value) => (
          <li key={value}>
            <bdi>{value}</bdi>
          </li>
        ))}
      </ul>
      <p className="tag-demo-note">
        Single-line labels yield space to ×. The adjacent readout and full-value list demonstrate
        keyboard and touch inspection without turning the label into a second action.
      </p>
    </div>
  );
}

function RemovalFlow(): ReactElement {
  const [items, setItems] = useState<readonly TagGroupItem[]>([
    {
      id: 'date',
      label: 'This month',
      removeLabel: 'Remove This month',
      iconLeft: CalendarBlankIcon,
    },
    {
      id: 'team',
      label: 'Platform team',
      removeLabel: 'Remove Platform team',
      iconLeft: UsersIcon,
    },
    { id: 'review', label: 'Needs review', removeLabel: 'Remove Needs review' },
  ]);
  const [waiting, setWaiting] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [defer, setDefer] = useState(false);
  const restore = useRef<HTMLButtonElement>(null);
  const original = useRef(items);
  const previewGroup = useRef<HTMLDivElement>(null);
  const complete = (accept: boolean): void => {
    if (!waiting) {
      return;
    }
    const pendingButton = previewGroup.current?.querySelector<HTMLButtonElement>('[aria-busy]');
    if (accept) {
      setItems((current) => current.filter((item) => item.id !== waiting));
      setMessage('Label removed.');
    } else {
      setMessage('Could not remove the label. Nothing changed; try again.');
    }
    setWaiting(null);
    if (!accept) {
      queueMicrotask(() => pendingButton?.focus());
    }
  };
  return (
    <div className="tag-demo-stack">
      <div className="tag-demo-heading">
        <span className="tag-demo-caption">Applied labels</span>
        <button
          ref={restore}
          type="button"
          className="tag-demo-restore"
          onClick={() => {
            setItems(original.current);
            setWaiting(null);
            setMessage('');
          }}
        >
          Restore labels
        </button>
      </div>
      <TagGroup
        ref={previewGroup}
        label="Applied labels"
        items={items.map((item) => ({
          ...item,
          pending: waiting === item.id,
          disabled: waiting !== null && waiting !== item.id,
        }))}
        emptyMessage="No labels applied"
        emptyFocusRef={restore}
        onRemove={(id) => {
          if (defer) {
            setWaiting(id);
            setMessage('Waiting for confirmation…');
          } else {
            setItems((current) => current.filter((item) => item.id !== id));
            setMessage('');
          }
        }}
      />
      <div className="tag-demo-simulation">
        <label>
          <input
            type="checkbox"
            checked={defer}
            disabled={waiting !== null}
            onChange={(event) => setDefer(event.currentTarget.checked)}
          />{' '}
          Simulate delayed removal
        </label>
        {waiting && (
          <div className="tag-demo-flow">
            <button type="button" onClick={() => complete(true)}>
              Confirm removal
            </button>
            <button type="button" onClick={() => complete(false)}>
              Reject removal
            </button>
          </div>
        )}
      </div>
      <p className="tag-demo-readout" role="status">
        {message ||
          'Remove labels with × or the keyboard. After the last one, focus returns to Restore labels.'}
      </p>
    </div>
  );
}

function OverlayLabels(): ReactElement {
  const [items, setItems] = useState<readonly TagGroupItem[]>([
    { id: 'editor', label: 'Editors', removeLabel: 'Remove Editors', iconLeft: UsersIcon },
    {
      id: 'guest',
      label: 'External guests',
      removeLabel: 'Remove External guests',
      status: 'info',
    },
    {
      id: 'policy',
      label: 'Workspace policy',
      removeLabel: 'Remove Workspace policy',
      iconLeft: LockSimpleIcon,
      disabled: true,
    },
  ]);
  const restore = useRef<HTMLButtonElement>(null);
  return (
    <div className="tag-demo-overlay" data-surface="overlay">
      <div className="tag-demo-heading">
        <span className="tag-demo-title">Assigned groups</span>
        <button
          ref={restore}
          className="tag-demo-restore"
          type="button"
          onClick={() =>
            setItems([
              {
                id: 'editor',
                label: 'Editors',
                removeLabel: 'Remove Editors',
                iconLeft: UsersIcon,
              },
              {
                id: 'guest',
                label: 'External guests',
                removeLabel: 'Remove External guests',
                status: 'info',
              },
              {
                id: 'policy',
                label: 'Workspace policy',
                removeLabel: 'Remove Workspace policy',
                iconLeft: LockSimpleIcon,
                disabled: true,
              },
            ])
          }
        >
          Restore
        </button>
      </div>
      <TagGroup
        items={items}
        label="Assigned groups"
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
        emptyFocusRef={restore}
      />
      <p className="tag-demo-note">
        Labels carry their meaning into the floating surface; only available remove buttons respond.
      </p>
    </div>
  );
}

export default defineComponent({
  id: 'tag',
  title: 'Tag & TagGroup',
  category: 'Feedback & Status',
  status: 'Proto',
  summary: 'Assigned values with a quiet capsule, one remove action, and a wrapping collection.',
  componentName: 'Tag',
  props: {
    size: {
      kind: 'enum',
      group: 'Layout',
      default: 'm',
      description: 'Painted label size; removal stays reachable.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    status: {
      kind: 'enum',
      group: 'Semantic status',
      default: 'neutral',
      description: 'Semantic meaning assigned to the value.',
      choices: [
        { value: 'neutral' },
        { value: 'accent' },
        { value: 'info' },
        { value: 'success' },
        { value: 'warning' },
        { value: 'danger' },
      ],
    },
    iconLeft: {
      kind: 'slot',
      group: 'Content',
      default: 'none',
      description: 'Optional classification glyph.',
      choices: [
        { value: 'none', label: 'None' },
        { value: 'tag', label: 'Tag icon', code: 'TagIcon' },
      ],
    },
    label: {
      kind: 'string',
      group: 'Example',
      default: 'Documentation',
      description: 'Assigned value and its removal label.',
      demo: true,
    },
    disabled: {
      kind: 'boolean',
      group: 'Availability',
      default: false,
      description: 'Keep the value readable while preventing removal.',
    },
    pending: {
      kind: 'boolean',
      group: 'Availability',
      default: false,
      description: 'Show pending removal appearance.',
    },
    onRemove: {
      kind: 'action',
      group: 'Events',
      description: 'Reports a removal request.',
      code: 'handleRemove',
    },
  },
  code: (
    values,
  ) => `<Tag removeLabel={${JSON.stringify(`Remove ${values.label}`)}}${values.size === 'm' ? '' : ` size="${values.size}"`}${values.status === 'neutral' ? '' : ` status="${values.status}"`}${values.iconLeft === 'tag' ? ' iconLeft={TagIcon}' : ''}${values.disabled ? ' disabled' : ''}${values.pending ? ' pending' : ''} onRemove={handleRemove}>
  {${JSON.stringify(values.label)}}
</Tag>`,
  render: function TagSubject({ values, ctx }) {
    const [removed, setRemoved] = useState(false);
    if (removed) {
      return (
        <Button variant="secondary" autoFocus onClick={() => setRemoved(false)}>
          Restore tag
        </Button>
      );
    }
    return (
      <Tag
        {...ctx.subject}
        size={values.size}
        status={values.status}
        disabled={values.disabled}
        pending={values.pending}
        removeLabel={`Remove ${values.label}`}
        {...(values.iconLeft === 'tag' ? { iconLeft: TagIcon } : {})}
        onRemove={() => {
          setRemoved(true);
          ctx.action('onRemove')(values.label);
        }}
      >
        {values.label}
      </Tag>
    );
  },
  matrixViews: [
    {
      id: 'palette',
      title: 'Meaning before color',
      rows: 'status',
      cols: 'size',
      caption:
        'Neutral for everyday metadata. Color describes the value, never the removal action.',
      reference: () => <Palette />,
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'A label, with one way out',
      caption: '22 / 26 / 30 px painted surfaces. M is the default. Remove and restore any sample.',
      kind: 'behavior',
      render: () => <Anatomy />,
    },
    {
      id: 'states',
      title: 'The smallest useful feedback',
      caption:
        'Pinned visual states for comparison; these samples keep their values. Live removal follows below.',
      kind: 'behavior',
      render: () => <RemovalStates />,
    },
    {
      id: 'groups',
      title: 'Wrapping & disclosure',
      caption:
        'Wrap naturally. Reveal the tail in place. Arrow keys follow reading order and skip locked values.',
      kind: 'behavior',
      render: () => <Groups />,
    },
    {
      id: 'locked',
      title: 'Readable, even when locked',
      kind: 'behavior',
      render: () => <Collection size="m" locked />,
    },
    {
      id: 'overflow',
      title: 'Long values, intact actions',
      kind: 'content',
      render: () => <LongLabels />,
    },
    {
      id: 'removal',
      title: 'Remove, confirm, recover',
      caption:
        'A local interaction preview. Delayed outcomes are explicitly controlled by the simulation buttons.',
      kind: 'behavior',
      render: () => <RemovalFlow />,
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <OverlayLabels />,
    },
  ],
  usage: [
    {
      id: 'fit',
      title: 'With fields & controls',
      caption:
        'Tags fit inside fields and share the text scale of neighboring controls. Values stay in sync across sizes; add or remove them to inspect wrapping.',
      code: `<>
  <TagsInput label="Assigned values" values={values} onValuesChange={setValues} />
  <Badge>Verified</Badge>
  <Tag iconLeft={FolderIcon} removeLabel="Remove Research" onRemove={removeResearch}>Research</Tag>
  <Button variant="secondary" tone="neutral" onClick={addLabel}>Add label</Button>
</>`,
      render: () => <SizeFit />,
    },
  ],
});
