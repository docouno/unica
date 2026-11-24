import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { GlobeHemisphereWestIcon } from '@phosphor-icons/react';
import { Button, Divider, Stack, Text } from '@docouno/unica';
import { Select } from '../../prototypes/select/select.proto.js';
import { regionOptions, roleOptions, simpleOptions } from '../../prototypes/select/select.data.js';
import type { PreviewProps, Surface } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import '../../prototypes/select/select.examples.css';

function Sample({
  title,
  children,
  inert,
  surface,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly inert?: boolean;
  readonly surface?: Surface;
}) {
  const content = (
    <Stack gap={12} inert={inert} style={{ minInlineSize: 0 }}>
      <Text size="caption-l" color="secondary">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </Stack>
  );
  return surface === 'overlay' ? (
    <ExampleSurface surface={surface} sizing="border-box">
      {content}
    </ExampleSurface>
  ) : (
    content
  );
}

const regionLabels = Object.fromEntries(regionOptions.map(({ value, label }) => [value, label]));

export function LiveSelect({ ctx }: PreviewProps) {
  const [values, setValues] = useState<readonly string[]>(['amsterdam', 'london']);
  const [value, setValue] = useState<string | null>('editor');
  return (
    <Stack gap={16} style={{ inlineSize: 'min(100%, 32rem)', marginInline: 'auto' }}>
      <Select
        {...ctx.subject}
        label="Workspace role"
        options={roleOptions}
        value={value}
        onValueChange={setValue}
        clearable
      />
      <Select
        {...ctx.subject}
        label="Deployment regions"
        options={regionOptions}
        values={values}
        onValuesChange={setValues}
        multiple
        searchable
        placeholder="Choose regions"
      />
      <Divider decorative />
      <Text size="body-s" color="secondary" role="status">
        <bdi>
          Saved role: {roleOptions.find((option) => option.value === value)?.label ?? 'None'} ·
          Regions: {values.length ? values.map((key) => regionLabels[key]).join(', ') : 'None'}
        </bdi>
      </Text>
    </Stack>
  );
}

function DataStates({ ctx }: PreviewProps) {
  const recoveringPanel = useRef<HTMLElement | null>(null);
  const state = ctx.story?.controls.data ?? 'failed';
  useLayoutEffect(() => {
    if (state === 'ready' && recoveringPanel.current) {
      recoveringPanel.current
        .querySelector<HTMLElement>('[role="listbox"]')
        ?.focus({ preventScroll: true });
      recoveringPanel.current = null;
    }
  }, [state]);
  return (
    <Select
      {...ctx.subject}
      label="Available regions"
      options={state === 'empty' ? [] : regionOptions}
      defaultValue="london"
      orphanLabels={regionLabels}
      loading={state === 'loading'}
      previewOpen
      errorState={
        state === 'failed' ? (
          <Stack gap={12}>
            <Stack gap={4}>
              <Text size="body-s" weight="medium">
                Regions couldn’t be loaded
              </Text>
              <Text size="body-s" color="secondary">
                <bdi>Your saved selection is kept.</bdi>
              </Text>
            </Stack>
            <Button
              type="button"
              size="s"
              variant="secondary"
              tone="neutral"
              style={{ alignSelf: 'start' }}
              onClick={(event) => {
                recoveringPanel.current = event.currentTarget.closest('.select-panel-proto');
                ctx.story?.setControl('data', 'ready');
              }}
            >
              Try again
            </Button>
          </Stack>
        ) : undefined
      }
      emptyState="No regions are available yet."
    />
  );
}

export function FieldRoles({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      {(['s', 'm', 'l'] as const).map((size) => (
        <Sample title={`${size.toUpperCase()} density`} key={size}>
          <Select
            {...ctx.subject}
            size={size}
            options={simpleOptions}
            label="Workspace role"
            defaultValue="editor"
          />
          <Select
            {...ctx.subject}
            size={size}
            variant="ghost"
            options={simpleOptions}
            defaultValue="viewer"
            aria-label={`Inline role ${size}`}
            width="auto"
          />
          <Select
            {...ctx.subject}
            size={size}
            options={regionOptions}
            defaultValue="london"
            iconLeft={GlobeHemisphereWestIcon}
            aria-label={`Region ${size}`}
          />
        </Sample>
      ))}
    </div>
  );
}

export function OpenPanels({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      <Sample surface={ctx.surface} title="Single · explicit selection">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={roleOptions}
          defaultValue="editor"
          previewOpen
        />
      </Sample>
      <Sample surface={ctx.surface} title="Multiple · search & selection">
        <Select
          {...ctx.subject}
          label="Deployment regions"
          options={regionOptions}
          multiple
          defaultValues={['amsterdam', 'london']}
          searchable
          previewOpen
          previewActive="london"
        />
      </Sample>
    </div>
  );
}

export function Triggers({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      <Sample title="Empty">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={simpleOptions}
          placeholder="Choose a role…"
        />
      </Sample>
      {(['hover', 'pressed', 'focus'] as const).map((state) => (
        <Sample
          key={state}
          inert
          title={
            state === 'focus'
              ? 'Keyboard focus'
              : state === 'pressed'
                ? 'Pressed · no translation'
                : 'Hover'
          }
        >
          <Select
            {...ctx.subject}
            label="Workspace role"
            options={simpleOptions}
            defaultValue="editor"
            previewState={state}
          />
        </Sample>
      ))}
      <Sample title="Disabled">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={simpleOptions}
          value="editor"
          disabled
        />
      </Sample>
      <Sample title="Read only">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={roleOptions}
          defaultValue="editor"
          readOnly
        />
      </Sample>
    </div>
  );
}

export function Feedback({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto" inert>
      <Sample title="Required · no answer">
        <Select
          {...ctx.subject}
          label="Workspace role"
          required
          options={simpleOptions}
          placeholder="Choose a role…"
          status="danger"
          message={<bdi>Choose a role before inviting people.</bdi>}
        />
      </Sample>
      <Sample title="Warning">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={simpleOptions}
          defaultValue="editor"
          status="warning"
          message={<bdi>Editors can publish to shared spaces.</bdi>}
        />
      </Sample>
      <Sample title="Success">
        <Select
          {...ctx.subject}
          label="Deployment region"
          options={regionOptions}
          defaultValue="london"
          status="success"
          message={<bdi>This region meets your residency policy.</bdi>}
        />
      </Sample>
      <Sample title="Information">
        <Select
          {...ctx.subject}
          label="Deployment region"
          options={regionOptions}
          defaultValue="london"
          status="info"
          message={<bdi>Your organization recommends London.</bdi>}
        />
      </Sample>
      <Sample title="Invalid field · ordinary options">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={simpleOptions}
          status="danger"
          message={<bdi>Select an available role.</bdi>}
          previewOpen
        />
      </Sample>
      <Sample title="Ghost · invalid inline value">
        <Select
          {...ctx.subject}
          variant="ghost"
          label="Workspace role"
          options={simpleOptions}
          status="danger"
          placeholder="Choose a role…"
          message={<bdi>A role is required for this member.</bdi>}
        />
      </Sample>
      <Sample title="Disabled overrides validation & loading">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={simpleOptions}
          defaultValue="editor"
          status="danger"
          disabled
          loading
          message={<bdi>Choose a role before continuing.</bdi>}
          description={<bdi>Managed by your organization.</bdi>}
        />
      </Sample>
    </div>
  );
}

export function Search({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      <Sample title="Filtered · hidden selection retained">
        <Select
          {...ctx.subject}
          label="Deployment regions"
          options={regionOptions}
          multiple
          defaultValues={['london', 'virginia']}
          searchable
          previewOpen
          previewQuery="Americas"
        />
      </Sample>
      <Sample title="No matching results">
        <Select
          {...ctx.subject}
          label="Deployment region"
          options={regionOptions}
          defaultValue="london"
          searchable
          previewOpen
          previewQuery="Oslo"
          clearable
        />
      </Sample>
      <Sample title="Empty catalog">
        <Select
          {...ctx.subject}
          label="Deployment region"
          options={[]}
          previewOpen
          emptyState="No regions are available yet."
        />
      </Sample>
    </div>
  );
}

export function Loading({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      <Sample title="First load · S / M / L">
        {(['s', 'm', 'l'] as const).map((size) => (
          <Select
            {...ctx.subject}
            key={size}
            size={size}
            options={[]}
            loading
            searchable
            previewOpen
            aria-label={`Initial load ${size}`}
          />
        ))}
      </Sample>
      <Sample title="Refresh · known catalog">
        <Select
          {...ctx.subject}
          label="Deployment regions"
          options={regionOptions.slice(0, 3)}
          multiple
          defaultValues={['amsterdam', 'london']}
          loading
          searchable
          previewOpen
        />
      </Sample>
      <Sample title="Catalog recovery">
        <DataStates ctx={ctx} />
      </Sample>
      <Sample title="Read only · refresh">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={simpleOptions}
          defaultValue="editor"
          readOnly
          loading
          previewOpen
        />
      </Sample>
    </div>
  );
}

export function Availability({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      <Sample title="Read only + search">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={roleOptions}
          defaultValue="editor"
          readOnly
          searchable
          previewOpen
        />
      </Sample>
      <Sample title="Saved option removed">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={simpleOptions}
          defaultValue="maintainer"
          orphanLabels={{ maintainer: 'Maintainer' }}
          clearable
          previewOpen
        />
      </Sample>
      <Sample title="Remove one unavailable answer">
        <Select
          {...ctx.subject}
          label="Workspace roles"
          options={simpleOptions}
          multiple
          defaultValues={['editor', 'maintainer']}
          orphanLabels={{ maintainer: 'Maintainer' }}
          previewOpen
          searchable
        />
      </Sample>
      <Sample title="Saved option disabled">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={roleOptions}
          defaultValue="admin"
          previewOpen
        />
      </Sample>
      <Sample title="All options disabled">
        <Select
          {...ctx.subject}
          label="Workspace role"
          options={simpleOptions.map((option) => ({ ...option, disabled: true }))}
          previewOpen
          description={<bdi>Your administrator manages these roles.</bdi>}
        />
      </Sample>
    </div>
  );
}

export function Summary({ ctx }: PreviewProps) {
  return (
    <div className="select-study-grid-proto">
      <Sample title="Full width · names before counts">
        <Select
          {...ctx.subject}
          label="Deployment regions"
          options={regionOptions}
          multiple
          defaultValues={['amsterdam', 'london', 'stockholm']}
        />
      </Sample>
      <Sample title="Compact filter · remaining names in +N">
        <div style={{ inlineSize: 'min(100%, 210px)' }}>
          <Select
            {...ctx.subject}
            size="s"
            variant="ghost"
            aria-label="Filter regions"
            options={regionOptions}
            multiple
            defaultValues={['amsterdam', 'frankfurt', 'london', 'stockholm', 'virginia']}
          />
        </div>
      </Sample>
      <Sample title="Long value · fixed height">
        <Select
          {...ctx.subject}
          label="Permission policy"
          options={[
            {
              value: 'long',
              label: 'Organization-wide editorial and publishing permissions',
              description: 'Review and publish changes across every workspace.',
            },
            ...simpleOptions,
          ]}
          defaultValue="long"
        />
      </Sample>
      <Sample title="Long placeholder">
        <Select
          {...ctx.subject}
          label="Permission policy"
          options={simpleOptions}
          placeholder="Choose an organization-wide permission policy…"
        />
      </Sample>
    </div>
  );
}
