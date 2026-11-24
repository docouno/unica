import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { Box, Button, Flex, Icon, Radio, RadioGroup, Stack, Text } from '@docouno/unica';
import { WarningCircleIcon } from '@phosphor-icons/react';
import type { PreviewProps } from '../../workbench/types.js';
import { BinaryPlate, Sample } from '../binary-examples.js';
import './radio.examples.css';

export function Interaction({ ctx }: PreviewProps): ReactElement {
  return (
    <RadioGroup
      {...ctx.subject}
      aria-label="Delivery frequency"
      orientation="horizontal"
      defaultValue="weekly"
    >
      <Radio value="daily" label="Daily" />
      <Radio value="weekly" label="Weekly" />
      <Radio value="monthly" label="Monthly" />
    </RadioGroup>
  );
}
export function Availability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="binary-demo-grid radio-example-grid">
      <Sample title="Managed retention">
        <RadioGroup {...ctx.subject} aria-label="Managed retention" readOnly defaultValue="90">
          <Radio value="30" label="30 days" />
          <Radio
            value="90"
            label="90 days"
            description={<bdi>Retention is managed by your organization.</bdi>}
          />
        </RadioGroup>
      </Sample>
      <Sample title="Disabled group">
        <RadioGroup {...ctx.subject} aria-label="Unavailable retention" disabled defaultValue="90">
          <Radio value="30" label="30 days" />
          <Radio
            value="90"
            label="90 days"
            description={<bdi>Available after the workspace is verified.</bdi>}
          />
        </RadioGroup>
      </Sample>
      <Sample title="Unavailable channel">
        <RadioGroup {...ctx.subject} aria-label="Delivery channel" defaultValue="email">
          <Radio value="email" label="Email" />
          <Radio
            value="chat"
            label="Team chat"
            description={<bdi>Connect a channel to use this option.</bdi>}
            disabled
          />
          <Radio value="inbox" label="Inbox" />
        </RadioGroup>
      </Sample>
      <Sample title="Disconnected channel">
        <RadioGroup {...ctx.subject} aria-label="Existing delivery channel" defaultValue="chat">
          <Radio
            value="chat"
            label="Team chat"
            description={<bdi>This connection is no longer available. Choose a replacement.</bdi>}
            disabled
          />
          <Radio value="email" label="Email" />
          <Radio value="inbox" label="Inbox" />
        </RadioGroup>
      </Sample>
    </div>
  );
}
export function Validation({ ctx }: PreviewProps): ReactElement {
  const [selected, setSelected] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [submitted, setSubmitted] = useState('');
  const [policy, setPolicy] = useState('public');
  const id = useId();
  const invalid = attempted && selected === null;
  return (
    <div className="binary-demo-grid radio-example-grid">
      <form
        onInvalid={() => setAttempted(true)}
        onSubmit={(event) => {
          event.preventDefault();
          const answer = new FormData(event.currentTarget).get('visibility');
          setSubmitted(typeof answer === 'string' ? answer : '');
        }}
      >
        <Stack gap={8}>
          <Text size="body-s" weight="medium" id={id}>
            Default visibility
          </Text>
          <RadioGroup
            {...ctx.subject}
            aria-labelledby={id}
            aria-describedby={invalid ? `${id}-error` : undefined}
            name="visibility"
            required
            value={selected}
            onValueChange={(next) => {
              setSelected(next);
              setSubmitted('');
            }}
            status={invalid ? 'danger' : 'neutral'}
          >
            <Radio value="private" label="Private" />
            <Radio value="team" label="Team" />
          </RadioGroup>
          {invalid && (
            <Flex align="start" gap={8} id={`${id}-error`} role="alert">
              <Icon icon={WarningCircleIcon} size="s" color="danger" />
              <Text size="caption-l" color="danger">
                <bdi>Choose a visibility setting.</bdi>
              </Text>
            </Flex>
          )}
          <Box>
            <Button variant="secondary" tone="accent" size="s" type="submit">
              Check selection
            </Button>
          </Box>
          <Text role="status" size="caption-l" color="secondary">
            {submitted && (
              <bdi>
                {submitted === 'private'
                  ? 'Private visibility selected.'
                  : 'Team visibility selected.'}
              </bdi>
            )}
          </Text>
        </Stack>
      </form>
      <Sample title="Workspace policy">
        <RadioGroup
          {...ctx.subject}
          aria-label="Sharing policy"
          aria-describedby={id + '-policy'}
          status={policy === 'public' ? 'danger' : 'neutral'}
          value={policy}
          onValueChange={setPolicy}
        >
          <Radio value="public" label="Public" />
          <Radio value="team" label="Team only" />
        </RadioGroup>
        <Text
          id={id + '-policy'}
          size="caption-l"
          color={policy === 'public' ? 'danger' : 'secondary'}
          role="status"
        >
          <bdi>
            {policy === 'public'
              ? 'Public access conflicts with the current policy.'
              : 'Team access is allowed by the current policy.'}
          </bdi>
        </Text>
      </Sample>
    </div>
  );
}
export function Overflow({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24} className="binary-demo-narrow">
      <RadioGroup {...ctx.subject} aria-label="Notification detail" defaultValue="all">
        <Radio
          value="all"
          label="Include every update from collections this team can access"
          description={
            <bdi>Includes updates from collections shared with this team in the future.</bdi>
          }
        />
        <Radio
          value="summary"
          label="Send one summary with mentions, comments, and changes that need attention"
        />
        <Radio value="custom" label="Use_workspace_notification_preferences_without_overrides" />
      </RadioGroup>
      <RadioGroup
        {...ctx.subject}
        size="s"
        aria-label="Compact display"
        orientation="horizontal"
        defaultValue="comfortable"
      >
        <Radio value="compact" label="Compact" />
        <Radio value="comfortable" label="Comfortable" />
      </RadioGroup>
      <RadioGroup {...ctx.subject} size="l" aria-label="Touch display" defaultValue="all">
        <Radio value="all" label="Show descriptions beneath each option" />
        <Radio value="labels" label="Show labels only" />
      </RadioGroup>
    </Stack>
  );
}
export function SurfaceChoices({ ctx }: PreviewProps): ReactElement {
  return (
    <BinaryPlate surface={ctx.surface}>
      <RadioGroup {...ctx.subject} aria-label="Visibility" defaultValue="team">
        <Radio value="private" label="Private" />
        <Radio value="team" label="Team" />
        <Radio value="public" label="Public" />
      </RadioGroup>
    </BinaryPlate>
  );
}
