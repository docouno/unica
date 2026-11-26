import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { GlobeHemisphereWestIcon } from '@phosphor-icons/react';
import { Button, Divider, Flex, Listbox, Select, Stack, Text, Title } from '@docouno/unica';
import {
  regionLabels,
  regionOptions,
  roleOptions,
  simpleRoles,
} from '../listbox/choice-catalogs.js';
import { SelectFieldExample } from './select-field-example.js';
import type { PreviewProps, Surface } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import '../listbox/listbox.examples.css';
import './select.examples.css';

function Sample({
  title,
  children,
  surface,
}: {
  readonly title: string;
  readonly children: ReactNode;
  readonly surface?: Surface;
}) {
  const content = (
    <Stack gap={12} style={{ minInlineSize: 0 }}>
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

export function LiveSelect({ ctx }: PreviewProps) {
  const [values, setValues] = useState<readonly string[]>(['amsterdam', 'london']);
  const [value, setValue] = useState<string | null>('editor');
  return (
    <Stack gap={16} style={{ inlineSize: 'min(100%, 32rem)', marginInline: 'auto' }}>
      <SelectFieldExample
        {...ctx.subject}
        label="Workspace role"
        options={roleOptions}
        value={value}
        onValueChange={setValue}
        clearable
      />
      <SelectFieldExample
        {...ctx.subject}
        label="Deployment regions"
        options={regionOptions}
        value={values}
        onValueChange={setValues}
        multiple
        searchable
        placeholder="Choose regions"
      />
      <Divider decorative />
      <Text size="body-s" color="secondary" role="status">
        <bdi>
          Saved role:{' '}
          {roleOptions.flatMap((group) => group.options).find((option) => option.value === value)
            ?.label ?? 'None'}{' '}
          · Regions: {values.length ? values.map((key) => regionLabels[key]).join(', ') : 'None'}
        </bdi>
      </Text>
    </Stack>
  );
}

function DataStates({ ctx }: PreviewProps) {
  const state = ctx.story?.controls.data ?? 'failed';
  return (
    <SelectFieldExample
      {...ctx.subject}
      label="Available regions"
      options={state === 'empty' ? [] : regionOptions}
      defaultValue="london"
      selectedLabels={regionLabels}
      loading={state === 'loading'}
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
              onClick={() => ctx.story?.setControl('data', 'ready')}
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
    <div className="picker-study-grid">
      {(['s', 'm', 'l'] as const).map((size) => (
        <Sample title={`${size.toUpperCase()} density`} key={size}>
          <SelectFieldExample
            {...ctx.subject}
            size={size}
            options={simpleRoles}
            label="Workspace role"
            defaultValue="editor"
          />
          <Select
            {...ctx.subject}
            size={size}
            variant="ghost"
            options={simpleRoles}
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
    <div className="picker-study-grid">
      <Sample surface={ctx.surface} title="Single selection">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={roleOptions}
          defaultValue="editor"
        />
      </Sample>
      <Sample surface={ctx.surface} title="Multiple selection with search">
        <SelectFieldExample
          {...ctx.subject}
          label="Deployment regions"
          options={regionOptions}
          multiple
          defaultValue={['amsterdam', 'london']}
          searchable
          defaultOpen={!ctx.comparing}
        />
      </Sample>
      {ctx.comparing && (
        <Sample title="Grouped rows on a floating surface">
          <ExampleSurface surface="overlay" sizing="border-box">
            <Listbox
              {...ctx.subject}
              aria-label="Deployment regions in flow"
              options={regionOptions.slice(0, 1)}
              multiple
              defaultValue={['amsterdam', 'london']}
            />
          </ExampleSurface>
        </Sample>
      )}
    </div>
  );
}

export function Triggers({ ctx }: PreviewProps) {
  return (
    <div className="picker-study-grid">
      <Sample title="Empty">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={simpleRoles}
          placeholder="Choose a role…"
        />
      </Sample>
      <Sample title="Selected">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={simpleRoles}
          defaultValue="editor"
        />
      </Sample>
      <Sample title="Disabled">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={simpleRoles}
          value="editor"
          disabled
        />
      </Sample>
      <Sample title="Read only">
        <SelectFieldExample
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
    <div className="picker-study-grid">
      <Sample title="Required · no answer">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          required
          options={simpleRoles}
          placeholder="Choose a role…"
          status="danger"
          message={<bdi>Choose a role before inviting people.</bdi>}
        />
      </Sample>
      <Sample title="Warning">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={simpleRoles}
          defaultValue="editor"
          status="warning"
          message={<bdi>Editors can publish to shared spaces.</bdi>}
        />
      </Sample>
      <Sample title="Success">
        <SelectFieldExample
          {...ctx.subject}
          label="Deployment region"
          options={regionOptions}
          defaultValue="london"
          status="success"
          message={<bdi>This region meets your residency policy.</bdi>}
        />
      </Sample>
      <Sample title="Information">
        <SelectFieldExample
          {...ctx.subject}
          label="Deployment region"
          options={regionOptions}
          defaultValue="london"
          status="info"
          message={<bdi>Your organization recommends London.</bdi>}
        />
      </Sample>
      <Sample title="Invalid field · ordinary options">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={simpleRoles}
          status="danger"
          message={<bdi>Select an available role.</bdi>}
        />
      </Sample>
      <Sample title="Ghost · invalid inline value">
        <SelectFieldExample
          {...ctx.subject}
          variant="ghost"
          label="Workspace role"
          options={simpleRoles}
          status="danger"
          placeholder="Choose a role…"
          message={<bdi>A role is required for this member.</bdi>}
        />
      </Sample>
      <Sample title="Disabled overrides validation & loading">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={simpleRoles}
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
    <div className="picker-study-grid">
      <Sample title="Filter several choices">
        <SelectFieldExample
          {...ctx.subject}
          label="Deployment regions"
          options={regionOptions}
          multiple
          defaultValue={['london', 'virginia']}
          searchable
        />
      </Sample>
      <Sample title="Search a single choice">
        <SelectFieldExample
          {...ctx.subject}
          label="Deployment region"
          options={regionOptions}
          defaultValue="london"
          searchable

          clearable
        />
      </Sample>
      <Sample title="Empty catalog">
        <SelectFieldExample
          {...ctx.subject}
          label="Deployment region"
          options={[]}

          emptyState="No regions are available yet."
        />
      </Sample>
    </div>
  );
}

export function Loading({ ctx }: PreviewProps) {
  return (
    <div className="picker-study-grid">
      <Sample title="First load · S / M / L">
        {(['s', 'm', 'l'] as const).map((size) => (
          <Select
            {...ctx.subject}
            key={size}
            size={size}
            options={[]}
            loading
            searchable

            aria-label={`Initial load ${size}`}
          />
        ))}
      </Sample>
      <Sample title="Refresh · known catalog">
        <SelectFieldExample
          {...ctx.subject}
          label="Deployment regions"
          options={regionOptions.slice(0, 1)}
          multiple
          defaultValue={['amsterdam', 'london']}
          loading
          searchable
        />
      </Sample>
      <Sample title="Catalog recovery">
        <DataStates ctx={ctx} />
      </Sample>
      <Sample title="Read only · refresh">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={simpleRoles}
          defaultValue="editor"
          readOnly
          loading
        />
      </Sample>
    </div>
  );
}

export function Availability({ ctx }: PreviewProps) {
  return (
    <div className="picker-study-grid">
      <Sample title="Read only + search">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={roleOptions}
          defaultValue="editor"
          readOnly
          searchable
        />
      </Sample>
      <Sample title="Saved option removed">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={simpleRoles}
          defaultValue="maintainer"
          selectedLabels={{ maintainer: 'Maintainer' }}
          clearable
        />
      </Sample>
      <Sample title="Remove one unavailable answer">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace roles"
          options={simpleRoles}
          multiple
          defaultValue={['editor', 'maintainer']}
          selectedLabels={{ maintainer: 'Maintainer' }}
          searchable
        />
      </Sample>
      <Sample title="Saved option disabled">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={roleOptions}
          defaultValue="admin"
        />
      </Sample>
      <Sample title="All options disabled">
        <SelectFieldExample
          {...ctx.subject}
          label="Workspace role"
          options={simpleRoles.map((option) => ({ ...option, disabled: true }))}
          description={<bdi>Your administrator manages these roles.</bdi>}
        />
      </Sample>
    </div>
  );
}

export function Summary({ ctx }: PreviewProps) {
  return (
    <div className="picker-study-grid">
      <Sample title="Full width · names before counts">
        <SelectFieldExample
          {...ctx.subject}
          label="Deployment regions"
          options={regionOptions}
          multiple
          defaultValue={['amsterdam', 'london', 'stockholm']}
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
            defaultValue={['amsterdam', 'frankfurt', 'london', 'stockholm', 'virginia']}
          />
        </div>
      </Sample>
      <Sample title="Long value · fixed height">
        <SelectFieldExample
          {...ctx.subject}
          label="Permission policy"
          options={[
            {
              value: 'long',
              label: 'Organization-wide editorial and publishing permissions',
              description: 'Review and publish changes across every workspace.',
            },
            ...simpleRoles,
          ]}
          defaultValue="long"
        />
      </Sample>
      <Sample title="Long placeholder">
        <SelectFieldExample
          {...ctx.subject}
          label="Permission policy"
          options={simpleRoles}
          placeholder="Choose an organization-wide permission policy…"
        />
      </Sample>
    </div>
  );
}

export function ModalSelect({ ctx }: PreviewProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const headingId = `${ctx.id}-modal-heading`;
  const [saved, setSaved] = useState('viewer');

  return (
    <Stack gap={12}>
      <Button
        type="button"
        variant="secondary"
        tone="neutral"
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        Edit review access
      </Button>
      <dialog
        ref={dialog}
        data-surface="overlay"
        className="unica-overlay-surface select-study-dialog"
        aria-labelledby={headingId}
        onClose={() => form.current?.reset()}
      >
        <form
          ref={form}
          onSubmit={(event) => {
            event.preventDefault();
            const role = new FormData(event.currentTarget).get('role');
            if (typeof role === 'string') {
              setSaved(role);
              dialog.current?.close();
            }
          }}
        >
          <Stack gap={16}>
            <Title as="h2" id={headingId} size="body-m">
              Review access
            </Title>
            <SelectFieldExample
              {...ctx.subject}
              key={saved}
              label="Reviewer role"
              name="role"
              options={simpleRoles}
              defaultValue={saved}
              required
              searchable
            />
            <Flex gap={8} wrap="wrap" justify="end">
              <Button type="reset" variant="ghost" tone="neutral">
                Reset
              </Button>
              <Button
                type="button"
                variant="secondary"
                tone="neutral"
                onClick={() => dialog.current?.close()}
              >
                Cancel
              </Button>
              <Button type="submit">Save access</Button>
            </Flex>
          </Stack>
        </form>
      </dialog>
      <Text size="body-s" role="status">
        <bdi>Saved access: {simpleRoles.find(({ value }) => value === saved)?.label}</bdi>
      </Text>
    </Stack>
  );
}
