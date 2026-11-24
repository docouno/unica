import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { Box, Button, Checkbox, CheckboxGroup, Divider, Flex, Stack, Text } from '@docouno/unica';
import type { CheckboxProps } from '@docouno/unica';
import type { PreviewContext, PreviewProps } from '../../workbench/types.js';
import '../binary-examples.css';

export function MeasuredCheckbox({
  subject,
  description,
  ...props
}: CheckboxProps & { readonly subject: PreviewContext['subject'] }): ReactElement {
  // Native input attributes target the transparent input. Measure the visible label row.
  return (
    <div {...subject} className="binary-demo-subject">
      <Checkbox
        {...props}
        description={
          typeof description === 'string' && description ? <bdi>{description}</bdi> : description
        }
      />
    </div>
  );
}

const densities = [
  { size: 's', mark: 16, row: 30 },
  { size: 'm', mark: 20, row: 40 },
  { size: 'l', mark: 24, row: 48 },
] as const;

export function Sizes({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16} divider={<Divider />}>
      {densities.map(({ size, mark, row }) => (
        <Stack key={size} gap={8}>
          <Text size="caption-l" color="secondary">
            <bdi>
              {size.toUpperCase()} · {mark}px mark / {row}px minimum row
            </bdi>
          </Text>
          <Flex wrap="wrap" align="start" gap={12}>
            <MeasuredCheckbox subject={ctx.subject} size={size} label="Unselected" readOnly />
            <MeasuredCheckbox
              subject={ctx.subject}
              size={size}
              label="Selected"
              defaultChecked
              readOnly
            />
            <MeasuredCheckbox
              subject={ctx.subject}
              size={size}
              label="Partly selected"
              indeterminate
              readOnly
            />
          </Flex>
        </Stack>
      ))}
    </Stack>
  );
}

export function Interaction({ ctx }: PreviewProps): ReactElement {
  const [mixed, setMixed] = useState(true);
  return (
    <Flex wrap="wrap" gap={16} align="start">
      <MeasuredCheckbox subject={ctx.subject} label="Include notes" />
      <MeasuredCheckbox subject={ctx.subject} label="Include attachments" defaultChecked />
      <MeasuredCheckbox
        subject={ctx.subject}
        label="Include collections"
        indeterminate={mixed}
        onCheckedChange={() => setMixed(false)}
      />
    </Flex>
  );
}

export function Availability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="binary-demo-grid">
      <Stack gap={8}>
        <Text size="body-s" weight="medium">
          Read-only
        </Text>
        <MeasuredCheckbox
          subject={ctx.subject}
          label="Essential updates"
          description="Required by your organization."
          readOnly
          defaultChecked
        />
        <MeasuredCheckbox
          subject={ctx.subject}
          label="External sharing"
          description="Managed by an administrator."
          readOnly
        />
        <MeasuredCheckbox
          subject={ctx.subject}
          label="Selected permissions"
          description="Some permissions are set by policy."
          readOnly
          indeterminate
        />
      </Stack>
      <Stack gap={8}>
        <Text size="body-s" weight="medium">
          Disabled
        </Text>
        <MeasuredCheckbox
          subject={ctx.subject}
          label="Export archive"
          description="Available after verification."
          disabled
        />
        <MeasuredCheckbox subject={ctx.subject} label="Audit trail" defaultChecked disabled />
        <MeasuredCheckbox
          subject={ctx.subject}
          label="Selected permissions"
          indeterminate
          disabled
        />
      </Stack>
    </div>
  );
}

export function Validation({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  const [values, setValues] = useState<string[]>([]);
  const [result, setResult] = useState<'idle' | 'checked' | 'valid'>('idle');
  const invalid = result !== 'idle' && values.length === 0;
  const requiredMessage = 'Select a format to continue.';
  return (
    <div className="binary-demo-grid">
      <form
        className="binary-demo-field"
        onInvalid={() => setResult('checked')}
        onSubmit={(event) => {
          event.preventDefault();
          setResult('valid');
        }}
      >
        <Text size="body-s" weight="medium" id={id + '-label'}>
          Include in the export
        </Text>
        <Text size="caption-l" color="secondary" id={id + '-help'}>
          <bdi>Choose at least one format.</bdi>
        </Text>
        <CheckboxGroup
          {...ctx.subject}
          aria-labelledby={id + '-label'}
          aria-describedby={id + '-help' + (invalid ? ' ' + id + '-error' : '')}
          name="format"
          required
          requiredMessage={requiredMessage}
          value={values}
          onValueChange={(next) => {
            setValues(next);
            setResult((previous) => (previous === 'idle' ? 'idle' : 'checked'));
          }}
          status={invalid ? 'danger' : 'neutral'}
        >
          <Checkbox value="markdown" label="Markdown" />
          <Checkbox value="pdf" label="PDF" />
        </CheckboxGroup>
        <Box>
          <Button size="s" variant="secondary" tone="accent" type="submit">
            Check selection
          </Button>
        </Box>
        {invalid && (
          <Text size="caption-l" color="danger" id={id + '-error'} role="alert">
            <bdi>{requiredMessage}</bdi>
          </Text>
        )}
        <Text size="caption-l" color="secondary" role="status">
          {result === 'valid' && (
            <bdi>{values.length === 1 ? 'One format selected.' : 'Both formats selected.'}</bdi>
          )}
        </Text>
      </form>
      <Stack gap={8}>
        <Text size="body-s" weight="medium">
          Validation and availability
        </Text>
        <MeasuredCheckbox
          subject={ctx.subject}
          label="Selected value needs attention"
          description="This permission conflicts with the current policy."
          defaultChecked
          status="danger"
        />
        <MeasuredCheckbox
          subject={ctx.subject}
          label="Some values need attention"
          indeterminate
          status="danger"
        />
        <MeasuredCheckbox
          subject={ctx.subject}
          label="Unavailable value"
          description="Available after policy review."
          disabled
          status="danger"
        />
      </Stack>
    </div>
  );
}

export function Overflow({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  return (
    <Stack gap={24} className="binary-demo-narrow">
      <MeasuredCheckbox
        subject={ctx.subject}
        label="Include notes from every collection this team can access"
        description="Applies to current collections and any collections shared later."
        defaultChecked
      />
      <MeasuredCheckbox
        subject={ctx.subject}
        size="s"
        label="Keep this device trusted for 30 days"
        description="Only use this on a device you own."
      />
      <MeasuredCheckbox
        subject={ctx.subject}
        size="l"
        label="Allow contributors to download original attachments and all previous revisions"
      />
      <MeasuredCheckbox
        subject={ctx.subject}
        label="Include attachments_from_external_sources_without_short_names"
      />
      <div className="binary-demo-external-row">
        <MeasuredCheckbox
          subject={ctx.subject}
          className="binary-demo-external-control"
          id={id + '-input'}
          aria-labelledby={id}
        />
        <Text
          as="label"
          size="body-s"
          className="binary-demo-external-label"
          id={id}
          htmlFor={id + '-input'}
        >
          Include archived notes
        </Text>
      </div>
    </Stack>
  );
}
