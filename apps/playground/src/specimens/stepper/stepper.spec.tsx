import type { PreviewContext } from '../../workbench/types.js';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { defineComponent } from '../../workbench/types.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { Card } from '../../prototypes/card/card.proto.js';
import { Text, Title } from '@docouno/unica';
import { Stepper, StepperStep } from '../../prototypes/stepper/stepper.proto.js';
import type { StepperProps, StepperStepProps } from '../../prototypes/stepper/stepper.proto.js';
import '../../prototypes/stepper/stepper.examples.css';

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
  const [owner, setOwner] = useState<'unchecked' | 'missing' | 'assigned'>('unchecked');
  const ownerAction = useRef<HTMLButtonElement>(null);
  const continueAction = useRef<HTMLButtonElement>(null);
  const needsOwner = owner === 'missing';
  const index = setup.findIndex((step) => step.value === current);
  const active = setup[index];

  useLayoutEffect(() => {
    if (owner === 'assigned') {
      continueAction.current?.focus();
    }
  }, [owner]);

  function advance(): void {
    if (!active) {
      setCompleted([]);
      setOwner('unchecked');
      setCurrent('details');
      return;
    }
    if (active.value === 'access' && owner !== 'assigned') {
      setOwner('missing');
      ownerAction.current?.focus();
      return;
    }
    setCompleted((previous) =>
      previous.includes(active.value) ? previous : [...previous, active.value],
    );
    setCurrent(setup[index + 1]?.value ?? null);
  }

  return (
    <div className="stepper-example-journey">
      <Map
        label="Workspace setup"
        value={current}
        onValueChange={setCurrent}
        steps={setup.map((step) => ({
          value: step.value,
          label: step.label,
          completed: completed.includes(step.value),
          invalid: step.value === 'access' && needsOwner,
          issue: step.value === 'access' && needsOwner ? 'Assign a workspace owner.' : undefined,
        }))}
      />
      <Card>
        <div className="stepper-example-panel-copy">
          <Title as="h3" size="body-m">
            {active?.value === 'access'
              ? 'Workspace owner'
              : (active?.label ?? 'Workspace created')}
          </Title>
          <Text size="body-s" color="secondary">
            <bdi>
              {active?.value === 'access'
                ? owner === 'assigned'
                  ? 'An owner has been assigned.'
                  : 'Owners can manage members and workspace settings.'
                : (active?.description ?? 'Your workspace is ready to use.')}
            </bdi>
          </Text>
        </div>
        <div className="stepper-example-actions">
          {active?.value === 'access' && owner !== 'assigned' && (
            <Button
              ref={ownerAction}
              variant="secondary"
              tone="neutral"
              size="s"
              onClick={() => setOwner('assigned')}
            >
              Assign an owner
            </Button>
          )}
          <Button
            ref={continueAction}
            size="s"
            disabled={active?.value === 'access' && needsOwner}
            onClick={advance}
          >
            {active ? (active.value === 'review' ? 'Create workspace' : 'Continue') : 'Start over'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

function FloatingExample(): ReactElement {
  const steps: readonly StepperStepProps[] = [
    {
      value: 'source',
      label: 'Source repository',
      invalid: true,
      issue: 'Reconnect the repository.',
    },
    { value: 'destination', label: 'Destination', description: 'Choose a workspace' },
    { value: 'review', label: 'Review' },
  ];

  return (
    <div className="stepper-example-overlay">
      <Map label="Repository import" layout="vertical" steps={steps} value="destination" />
    </div>
  );
}

function InspectSteps({
  size,
  layout,
  startAt,
  ctx,
}: Required<Pick<StepperProps, 'size' | 'layout'>> & {
  readonly startAt: string;
  readonly ctx: PreviewContext;
}): ReactElement {
  const [step, setStep] = useState(startAt);
  return (
    <Stepper
      {...ctx.subject}
      label="Publish a release"
      value={step}
      size={size}
      layout={layout}
      onValueChange={(next) => {
        setStep(next);
        ctx.action('onValueChange')(next);
      }}
    >
      <StepperStep value="details" label="Details" completed />
      <StepperStep value="review" label="Review" completed={startAt === 'publish'} />
      <StepperStep value="publish" label="Publish" />
    </Stepper>
  );
}

export default defineComponent({
  id: 'stepper',
  title: 'Stepper',
  category: 'Navigation',
  status: 'Proto',
  summary: 'An ordered map for setup, review, and other staged tasks.',
  props: {
    size: {
      kind: 'enum',
      group: 'Layout',
      default: 'm',
      description: 'Step and connector density.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    layout: {
      kind: 'enum',
      group: 'Layout',
      default: 'responsive',
      description: 'Arrangement of the full step list or compact summary.',
      choices: [
        { value: 'responsive' },
        { value: 'horizontal' },
        { value: 'vertical' },
        { value: 'compact' },
      ],
    },
    startAt: {
      kind: 'enum',
      group: 'Example',
      default: 'review',
      description: 'Selected step when the example mounts.',
      demo: true,
      choices: [{ value: 'details' }, { value: 'review' }, { value: 'publish' }],
    },
    onValueChange: {
      kind: 'action',
      group: 'Events',
      description: 'Reports which completed or invalid step was selected.',
      code: 'handleValueChange',
    },
  },
  code: (
    values,
  ) => `<Stepper label="Publish a release" value={step}${values.size === 'm' ? '' : ` size="${values.size}"`}${values.layout === 'responsive' ? '' : ` layout="${values.layout}"`} onValueChange={handleValueChange}>
  <StepperStep value="details" label="Details" completed />
  <StepperStep value="review" label="Review"${values.startAt === 'publish' ? ' completed' : ''} />
  <StepperStep value="publish" label="Publish" />
</Stepper>`,
  render: ({ values, ctx }) => (
    <div style={{ inlineSize: '100%' }}>
      <InspectSteps
        key={values.startAt}
        size={values.size}
        layout={values.layout}
        startAt={values.startAt}
        ctx={ctx}
      />
    </div>
  ),
  matrixViews: [
    {
      id: 'sizes',
      title: 'Horizontal sizes',
      rows: 'size',
      fixed: { layout: 'horizontal' },
      reference: () => <Sizes layout="horizontal" />,
    },
    {
      id: 'vertical-sizes',
      title: 'Vertical sizes',
      rows: 'size',
      fixed: { layout: 'vertical' },
      reference: () => <Sizes layout="vertical" />,
    },
    {
      id: 'layouts',
      title: 'Vertical and compact layouts',
      rows: 'layout',
      reference: () => <Layouts />,
    },
  ],
  cases: [
    {
      id: 'states',
      title: 'Progress and validation',
      kind: 'behavior',
      render: () => <States />,
    },
    {
      id: 'interaction',
      title: 'Return to a step',
      kind: 'behavior',
      render: () => <Interaction />,
    },
    {
      id: 'overlay',
      title: 'In a floating surface',
      overlayStage: true,
      surface: 'overlay',
      kind: 'surface',
      render: () => <FloatingExample />,
    },
  ],
  usage: [
    {
      id: 'journey',
      title: 'Workspace setup',
      code: `<Stepper label="Workspace setup" value={current} onValueChange={setCurrent}>
  {setup.map((step) => (
    <StepperStep key={step.value} value={step.value} label={step.label}
      completed={completed.includes(step.value)}
      invalid={step.value === 'access' && needsOwner}
      issue={step.value === 'access' && needsOwner ? 'Assign a workspace owner.' : undefined} />
  ))}
</Stepper>`,
      render: () => <Journey />,
    },
  ],
});
