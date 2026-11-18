import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Button } from '../button/button.proto.js';
import { Card } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import { Stepper, StepperStep } from './stepper.proto.js';
import type { StepperProps, StepperStepProps } from './stepper.proto.js';
import './stepper.examples.css';

const setup: readonly StepperStepProps[] = [
  { value: 'details', label: 'Workspace details', description: 'Name and region' },
  { value: 'access', label: 'Access rules', description: 'Roles and invitations' },
  { value: 'review', label: 'Review setup', description: 'Confirm and create' },
];

const firstDone = setup.map((step, index) => ({ ...step, completed: index === 0 }));
const allDone = setup.map((step) => ({ ...step, completed: true }));
const issues = setup.map((step, index) => {
  const issue = ['Choose an available workspace name.', 'Assign a workspace owner.'][index];
  return { ...step, completed: index === 0, invalid: Boolean(issue), issue };
});

function Map({
  steps,
  ...props
}: Omit<StepperProps, 'children'> & { readonly steps: readonly StepperStepProps[] }): ReactElement {
  return (
    <Stepper {...props}>
      {steps.map((step) => (
        <StepperStep key={step.value} {...step} />
      ))}
    </Stepper>
  );
}

function Example({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="stepper-example">
      <Text size="caption-l" color="muted" weight="medium">
        {label}
      </Text>
      {children}
    </div>
  );
}

function Sizes({ layout }: { readonly layout: 'horizontal' | 'vertical' }): ReactElement {
  const vertical = layout === 'vertical';
  const verticalSteps = firstDone.map((step) =>
    step.value === 'access'
      ? { ...step, description: 'Roles, invitations, and permissions for shared spaces.' }
      : step,
  );

  return (
    <div className={vertical ? 'stepper-example-vertical-sizes' : 'stepper-example-stack'}>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Example key={size} label={size === 's' ? 'Small' : size === 'm' ? 'Medium' : 'Large'}>
          <Map
            label={`Workspace setup, ${size.toUpperCase()}`}
            size={size}
            layout={layout}
            steps={
              vertical
                ? verticalSteps
                : size === 's'
                  ? firstDone.map((step) => ({ ...step, description: undefined }))
                  : firstDone
            }
            value="access"
          />
        </Example>
      ))}
    </div>
  );
}

function States(): ReactElement {
  return (
    <div className="stepper-example-stack">
      <Example label="Before starting">
        <Map label="Workspace setup" steps={setup} value={null} />
      </Example>
      <Example label="Current and earlier steps need attention">
        <Map label="Workspace setup" steps={issues} value="access" />
      </Example>
      <Example label="Revisiting a completed step">
        <Map label="Workspace setup" steps={allDone} value="details" />
      </Example>
      <Example label="Five stages · a saved draft">
        <Map
          label="Workspace configuration"
          value="defaults"
          steps={[
            { value: 'details', label: 'Workspace', completed: true },
            { value: 'groups', label: 'Map groups', completed: true },
            {
              value: 'defaults',
              label: 'Default policies',
              description: 'Region and retention period',
            },
            { value: 'integrations', label: 'Connect services' },
            { value: 'review', label: 'Review and launch' },
          ]}
        />
      </Example>
      <Example label="Complete">
        <Map label="Workspace setup" steps={allDone} value={null} />
      </Example>
    </div>
  );
}

function Layouts(): ReactElement {
  const longSteps: readonly StepperStepProps[] = [
    { value: 'source', label: 'Source workspace', completed: true },
    {
      value: 'groups',
      label: 'Map external groups and access policies',
      description: 'Preserve inherited permissions for shared spaces.',
      completed: true,
    },
    {
      value: 'defaults',
      label: 'Configure workspace defaults',
      description: 'Set the retention window and the default region.',
    },
    { value: 'review', label: 'Review', description: 'Confirm the configuration' },
  ];

  return (
    <div className="stepper-example-layouts">
      <Example label="Vertical · a narrow column">
        <Map label="Workspace configuration" layout="vertical" steps={longSteps} value="defaults" />
      </Example>
      <div className="stepper-example-stack stepper-example-compact">
        <Example label="Compact · steps with issues">
          <Map label="Workspace setup" layout="compact" steps={issues} value="access" />
        </Example>
        <Example label="Compact · saved for later">
          <Map label="Workspace setup" layout="compact" steps={firstDone} value={null} />
        </Example>
        <Example label="Compact · complete">
          <Map label="Workspace setup" layout="compact" steps={allDone} value={null} />
        </Example>
      </div>
    </div>
  );
}

const previewSteps: readonly StepperStepProps[] = [
  { value: 'plan', label: 'Plan', completed: true },
  { value: 'details', label: 'Details', completed: true, preview: 'hover' },
  {
    value: 'access',
    label: 'Access rules',
    invalid: true,
    issue: 'Assign an owner.',
    preview: 'pressed',
  },
  { value: 'defaults', label: 'Defaults', completed: true, preview: 'focus' },
  { value: 'review', label: 'Review' },
  { value: 'launch', label: 'Launch' },
];

function Interaction(): ReactElement {
  const [current, setCurrent] = useState('review');
  return (
    <Example label="Pinned states · Details hovered, Access rules pressed, Defaults focused">
      <Map
        label="Workspace setup with pinned interaction states"
        layout="vertical"
        steps={previewSteps}
        value={current}
        onValueChange={setCurrent}
      />
    </Example>
  );
}

function Journey(): ReactElement {
  const [current, setCurrent] = useState<string | null>('access');
  const [completed, setCompleted] = useState<readonly string[]>(['details']);
  const [owner, setOwner] = useState<'unchecked' | 'missing' | 'assigned'>('missing');
  const needsOwner = owner === 'missing';
  const index = setup.findIndex((step) => step.value === current);
  const active = setup[index];

  function advance(): void {
    if (!active) {
      setCompleted([]);
      setOwner('unchecked');
      setCurrent('details');
      return;
    }
    if (active.value === 'access' && needsOwner) {
      return;
    }
    setCompleted((previous) =>
      previous.includes(active.value) ? previous : [...previous, active.value],
    );
    const next = setup[index + 1]?.value ?? null;
    if (next === 'access' && owner === 'unchecked') {
      setOwner('missing');
    }
    setCurrent(next);
  }

  return (
    <div className="stepper-example-journey">
      <Map
        label="Workspace setup"
        value={current}
        onValueChange={setCurrent}
        steps={setup.map((step) => ({
          ...step,
          completed: completed.includes(step.value),
          invalid: step.value === 'access' && needsOwner,
          issue: step.value === 'access' && needsOwner ? 'Assign a workspace owner.' : undefined,
        }))}
      />
      <Card>
        <div className="stepper-example-panel-copy">
          <Title as="h3" size="body-m">
            {active?.label ?? 'Workspace created'}
          </Title>
          <Text size="body-s" color="secondary">
            <bdi>
              {active?.value === 'access'
                ? needsOwner
                  ? 'Every workspace needs at least one owner.'
                  : 'An owner has been assigned.'
                : (active?.description ?? 'Your workspace is ready to use.')}
            </bdi>
          </Text>
        </div>
        <div className="stepper-example-actions">
          {active?.value === 'access' && needsOwner && (
            <Button
              variant="secondary"
              tone="neutral"
              size="s"
              onClick={() => setOwner('assigned')}
            >
              Assign an owner
            </Button>
          )}
          <Button size="s" disabled={active?.value === 'access' && needsOwner} onClick={advance}>
            {active ? (active.value === 'review' ? 'Create workspace' : 'Continue') : 'Start over'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function FloatingExample(): ReactElement {
  return (
    <div className="stepper-example-overlay">
      <Map label="Workspace setup" layout="vertical" steps={issues} value="access" />
    </div>
  );
}

export default defineSpecimen({
  id: 'stepper',
  title: 'Stepper',
  group: 'Navigation',
  summary: 'An ordered map for setup, review, and other staged tasks.',
  sections: [
    {
      id: 'sizes',
      title: 'Horizontal sizes',
      kind: 'matrix',
      render: () => <Sizes layout="horizontal" />,
    },
    {
      id: 'vertical-sizes',
      title: 'Vertical sizes',
      kind: 'matrix',
      render: () => <Sizes layout="vertical" />,
    },
    { id: 'states', title: 'Progress and validation', kind: 'states', render: () => <States /> },
    {
      id: 'layouts',
      title: 'Vertical and compact layouts',
      kind: 'matrix',
      render: () => <Layouts />,
    },
    {
      id: 'interaction',
      title: 'Return to a step',
      kind: 'states',
      render: () => <Interaction />,
    },
    { id: 'journey', title: 'Workspace setup', kind: 'context', render: () => <Journey /> },
    {
      id: 'overlay',
      title: 'In a floating surface',
      kind: 'context',
      overlayStage: true,
      surface: 'overlay',
      render: () => <FloatingExample />,
    },
  ],
});
