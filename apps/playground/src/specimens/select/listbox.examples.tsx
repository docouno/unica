import { useState } from 'react';
import type { ReactNode } from 'react';
import { Card, Divider, Stack, Text } from '@docouno/unica';
import { Listbox, SelectPanel } from '../../prototypes/select/select.proto.js';
import { regionOptions, roleOptions, simpleOptions } from '../../prototypes/select/select.data.js';
import '../../prototypes/select/select.examples.css';
import type { PreviewProps } from '../../workbench/types.js';

function Sample({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <Stack gap={12} style={{ minInlineSize: 0 }}>
      <Text size="caption-l" color="secondary">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </Stack>
  );
}

export function Density({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      {(['s', 'm', 'l'] as const).map((size) => (
        <Sample key={size} title={`${size.toUpperCase()} · single selection`}>
          <Listbox
            {...ctx.subject}
            size={size}
            options={simpleOptions}
            defaultValue="editor"
            aria-label={`Role ${size}`}
          />
          <Listbox
            {...ctx.subject}
            size={size}
            options={[
              { value: 'plain', label: 'Without a description' },
              { value: 'icon', label: 'With an icon', icon: roleOptions[0]?.icon },
              {
                value: 'description',
                label: 'With a description',
                description: 'A second line of context.',
              },
              {
                value: 'wrapped',
                label: 'A longer option label that continues on another line',
              },
              {
                value: 'rich',
                label: 'Publishing permissions',
                icon: roleOptions[1]?.icon,
                description: 'Review and publish changes across all shared workspaces.',
              },
            ]}
            defaultValue="icon"
            aria-label={`Mixed row anatomy ${size}`}
          />
        </Sample>
      ))}
    </div>
  );
}

export function Anatomy({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      <Sample title="Single · rich options">
        <Listbox
          {...ctx.subject}
          options={[
            ...roleOptions,
            {
              value: 'custom',
              label: 'Custom policy',
              description: 'Use the policy defined by your organization',
              group: 'Administration',
            },
          ]}
          defaultValue="editor"
          aria-label="Role with descriptions"
        />
      </Sample>
      <Sample title="Multiple · immediate toggles">
        <Listbox
          {...ctx.subject}
          options={simpleOptions}
          multiple
          defaultValues={['viewer', 'editor']}
          aria-label="Multiple roles"
        />
      </Sample>
    </div>
  );
}

export function StatePins({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto" inert>
      {(
        [
          ['Available', false, undefined],
          ['Selected', true, undefined],
          ['Hover', false, 'hover'],
          ['Selected + hover', true, 'hover'],
          ['Pressed', true, 'pressed'],
          ['Keyboard focus', false, 'focus'],
          ['Selected + focus', true, 'focus'],
        ] as const
      ).map(([title, selected, preview]) => (
        <Sample key={title} title={title}>
          <Listbox
            {...ctx.subject}
            options={[{ value: 'editor', label: 'Editor' }]}
            value={selected ? 'editor' : null}
            previewOption="editor"
            previewState={preview}
            aria-label={title}
          />
        </Sample>
      ))}
    </div>
  );
}

export function Availability({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      <Sample title="Read only · browse safely">
        <Listbox
          {...ctx.subject}
          title="Workspace role"
          options={roleOptions}
          value="editor"
          readOnly
        />
      </Sample>
      <Sample title="Disabled · selection retained">
        <Listbox
          {...ctx.subject}
          options={simpleOptions}
          value="editor"
          disabled
          aria-label="Disabled roles"
        />
      </Sample>
      <Sample title="Selected option disabled">
        <Listbox
          {...ctx.subject}
          options={roleOptions}
          defaultValue="admin"
          aria-label="Administrative role"
        />
      </Sample>
      <Sample title="Removed from catalog">
        <Listbox
          {...ctx.subject}
          options={simpleOptions}
          multiple
          defaultValues={['editor', 'maintainer']}
          orphanLabels={{ maintainer: 'Maintainer' }}
          aria-label="Saved roles"
        />
      </Sample>
      <Sample title="Only saved answer remains">
        <Listbox
          {...ctx.subject}
          options={[]}
          defaultValue="maintainer"
          orphanLabels={{ maintainer: 'Maintainer' }}
          aria-label="Unavailable saved role"
        />
      </Sample>
      <Sample title="Empty catalog">
        <Listbox
          {...ctx.subject}
          options={[]}
          aria-label="No roles available"
          emptyState={<bdi>No roles available in this workspace.</bdi>}
        />
      </Sample>
      <Sample title="Unavailable · locked">
        <Listbox
          {...ctx.subject}
          options={[]}
          value="maintainer"
          orphanLabels={{ maintainer: 'Maintainer' }}
          readOnly
          title="Saved role"
        />
        <Listbox
          {...ctx.subject}
          options={[]}
          value="maintainer"
          orphanLabels={{ maintainer: 'Maintainer' }}
          disabled
          aria-label="Disabled saved role"
        />
      </Sample>
      <Sample title="All options disabled">
        <Listbox
          {...ctx.subject}
          options={simpleOptions.map((option) => ({ ...option, disabled: true }))}
          value="editor"
          aria-label="Locked roles"
        />
      </Sample>
    </div>
  );
}

export function Overflow({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      <Sample title="Long label & description">
        <Listbox
          {...ctx.subject}
          options={[
            {
              value: 'long',
              label: 'Organization-wide editorial and publishing permissions',
              description:
                'Review changes across every workspace, including archived projects and externally shared pages.',
            },
            {
              value: 'url',
              label: 'https://example.com/workspaces/engineering/permission-policies',
              description: 'A long, unbroken value wraps without horizontal scrolling.',
            },
          ]}
          defaultValue="long"
          aria-label="Long permission labels"
        />
      </Sample>
      <Regions ctx={ctx} />
    </div>
  );
}

function Regions({ ctx }: Pick<PreviewProps, 'ctx'>) {
  const [values, setValues] = useState<readonly string[]>(['amsterdam', 'london']);
  const labels = values.map(
    (value) => regionOptions.find((option) => option.value === value)?.label,
  );
  return (
    <Stack gap={12} style={{ minInlineSize: 0 }}>
      <Card size="s" variant="subtle">
        <Listbox
          {...ctx.subject}
          title="Available regions"
          className="select-study-scroll-proto"
          options={regionOptions}
          multiple
          values={values}
          onValuesChange={setValues}
        />
      </Card>
      <Divider decorative />
      <Text size="body-s" color="secondary" role="status">
        <bdi>Selected: {labels.length ? labels.join(', ') : 'None'}</bdi>
      </Text>
    </Stack>
  );
}

export function Surfaces({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      <Card data-surface="base" size="s" variant="subtle">
        <Listbox
          {...ctx.subject}
          options={simpleOptions}
          defaultValue="editor"
          title="Role on a card"
        />
      </Card>
      <SelectPanel>
        <Listbox
          {...ctx.subject}
          options={simpleOptions}
          defaultValue="editor"
          title="Role in a floating panel"
        />
      </SelectPanel>
    </div>
  );
}
