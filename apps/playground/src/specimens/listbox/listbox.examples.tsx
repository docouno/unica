import { useState } from 'react';
import type { ReactNode } from 'react';
import { Card, Divider, Listbox, Stack, Text } from '@docouno/unica';
import { ChatCircleIcon, EyeIcon } from '@phosphor-icons/react';
import { regionLabels, regionOptions, roleOptions, simpleRoles } from './choice-catalogs.js';
import './listbox.examples.css';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';

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
    <div className="picker-study-grid">
      {(['s', 'm', 'l'] as const).map((size) => (
        <Sample key={size} title={`${size.toUpperCase()} · single selection`}>
          <Listbox
            {...ctx.subject}
            size={size}
            options={simpleRoles}
            defaultValue="editor"
            aria-label={`Role ${size}`}
          />
          <Listbox
            {...ctx.subject}
            size={size}
            options={[
              { value: 'plain', label: 'Without a description' },
              { value: 'icon', label: 'With an icon', iconLeft: EyeIcon },
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
                iconLeft: ChatCircleIcon,
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
    <div className="picker-study-grid">
      <Sample title="Single · rich options">
        <Listbox
          {...ctx.subject}
          options={[
            ...roleOptions,
            {
              value: 'custom',
              label: 'Custom policy',
              description: 'Use the policy defined by your organization',
            },
          ]}
          defaultValue="editor"
          aria-label="Role with descriptions"
        />
      </Sample>
      <Sample title="Multiple · immediate toggles">
        <Listbox
          {...ctx.subject}
          options={simpleRoles}
          multiple
          defaultValue={['viewer', 'editor']}
          aria-label="Multiple roles"
        />
      </Sample>
    </div>
  );
}

export function Interactions({ ctx }: PreviewProps) {
  return (
    <div className="picker-study-grid">
      <Sample title="Single selection">
        <Listbox
          {...ctx.subject}
          options={simpleRoles}
          defaultValue="editor"
          aria-label="Single role"
        />
      </Sample>
      <Sample title="Multiple selection">
        <Listbox
          {...ctx.subject}
          options={simpleRoles}
          multiple
          defaultValue={['editor', 'viewer']}
          aria-label="Multiple roles"
        />
      </Sample>
    </div>
  );
}

export function Availability({ ctx }: PreviewProps) {
  return (
    <div className="picker-study-grid">
      <Sample title="Read only · browse safely">
        <Listbox
          {...ctx.subject}
          aria-label="Workspace role"
          options={roleOptions}
          value="editor"
          readOnly
        />
      </Sample>
      <Sample title="Disabled · selection retained">
        <Listbox
          {...ctx.subject}
          options={simpleRoles}
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
          options={simpleRoles}
          multiple
          defaultValue={['editor', 'maintainer']}
          selectedLabels={{ maintainer: 'Maintainer' }}
          aria-label="Saved roles"
        />
      </Sample>
      <Sample title="Only saved answer remains">
        <Listbox
          {...ctx.subject}
          options={[]}
          defaultValue="maintainer"
          selectedLabels={{ maintainer: 'Maintainer' }}
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
          selectedLabels={{ maintainer: 'Maintainer' }}
          readOnly
          aria-label="Saved role"
        />
        <Listbox
          {...ctx.subject}
          options={[]}
          value="maintainer"
          selectedLabels={{ maintainer: 'Maintainer' }}
          disabled
          aria-label="Disabled saved role"
        />
      </Sample>
      <Sample title="All options disabled">
        <Listbox
          {...ctx.subject}
          options={simpleRoles.map((option) => ({ ...option, disabled: true }))}
          value="editor"
          aria-label="Locked roles"
        />
      </Sample>
    </div>
  );
}

export function Overflow({ ctx }: PreviewProps) {
  return (
    <div className="picker-study-grid">
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
  const labels = values.map((value) => regionLabels[value]);
  return (
    <Stack gap={12} style={{ minInlineSize: 0 }}>
      <Card size="s" variant="subtle">
        <Listbox
          {...ctx.subject}
          aria-label="Available regions"
          className="listbox-study-scroll"
          options={regionOptions}
          multiple
          value={values}
          onValueChange={setValues}
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
    <div className="picker-study-grid">
      <Card data-surface="base" size="s" variant="subtle">
        <Listbox
          {...ctx.subject}
          options={simpleRoles}
          defaultValue="editor"
          aria-label="Role on a card"
        />
      </Card>
      <ExampleSurface surface="overlay" sizing="border-box">
        <Listbox
          {...ctx.subject}
          options={simpleRoles}
          defaultValue="editor"
          aria-label="Role on a floating surface"
        />
      </ExampleSurface>
    </div>
  );
}
