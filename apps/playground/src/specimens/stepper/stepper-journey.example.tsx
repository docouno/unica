import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Button, Card, CardBody, CardFooter, Stack, Text, Title } from '@docouno/unica';
import '@docouno/unica/styles.css';
import { Stepper, StepperStep } from '../../prototypes/stepper/stepper.proto.js';

const stages = [
  { value: 'details', label: 'Workspace details', description: 'Atlas workspace · Europe region' },
  {
    value: 'access',
    label: 'Access rules',
    description: 'Owners can manage members and workspace settings.',
  },
  {
    value: 'review',
    label: 'Review setup',
    description: 'Create the Atlas workspace in Europe with you as its owner.',
  },
];

export function WorkspaceSetupExample({ subject = {} } = {}) {
  const id = useId();
  const [current, setCurrent] = useState('access');
  const [completed, setCompleted] = useState(['details']);
  const [owner, setOwner] = useState('unassigned');
  const pendingFocus = useRef('');
  const activeIndex = stages.findIndex((stage) => stage.value === current);
  const active = stages[activeIndex];
  const needsOwner = owner === 'missing';
  let description = active?.description ?? 'Atlas is ready to use. You are the workspace owner.';
  if (current === 'access' && owner === 'assigned') {
    description = 'You are the workspace owner.';
  }
  if (current === 'access' && needsOwner) {
    description = 'Assign an owner before you continue.';
  }

  useLayoutEffect(() => {
    if (pendingFocus.current) {
      document.getElementById(id + pendingFocus.current)?.focus();
      pendingFocus.current = '';
    }
  }, [current, owner, id]);

  function advance() {
    if (!active) {
      return;
    }
    if (current === 'access' && owner !== 'assigned') {
      pendingFocus.current = '-assign';
      setOwner('missing');
      return;
    }
    const next = stages[activeIndex + 1]?.value ?? '';
    pendingFocus.current = next === 'access' && needsOwner ? '-assign' : '-heading';
    setCompleted((previous) => (previous.includes(current) ? previous : [...previous, current]));
    setCurrent(next);
  }

  return (
    <Stack gap={24} style={{ inlineSize: 'min(100%, 48rem)', minInlineSize: 0 }}>
      <Stepper
        {...subject}
        label="Workspace setup"
        value={active?.value ?? null}
        {...(active && { onValueChange: setCurrent })}
      >
        {stages.map((stage) => (
          <StepperStep
            key={stage.value}
            value={stage.value}
            label={stage.label}
            completed={completed.includes(stage.value)}
            invalid={stage.value === 'access' && needsOwner}
            issue={stage.value === 'access' && needsOwner ? 'Assign a workspace owner.' : undefined}
          />
        ))}
      </Stepper>
      <Card>
        <CardBody>
          <Title as="h3" size="body-m" id={id + '-heading'} tabIndex={-1}>
            {current === 'access' ? 'Workspace owner' : (active?.label ?? 'Workspace created')}
          </Title>
          <Text size="body-s" color="secondary" id={id + '-description'}>
            <bdi>{description}</bdi>
          </Text>
        </CardBody>
        {active && (
          <CardFooter
            justify="start"
            onKeyDownCapture={(event) => {
              if (
                event.repeat &&
                (event.key === 'Enter' || event.key === ' ') &&
                event.target instanceof HTMLButtonElement
              ) {
                event.preventDefault();
              }
            }}
          >
            {current === 'access' && owner !== 'assigned' && (
              <Button
                id={id + '-assign'}
                type="button"
                variant="secondary"
                tone="neutral"
                size="s"
                aria-describedby={id + '-description'}
                onClick={() => {
                  pendingFocus.current = '-continue';
                  setOwner('assigned');
                }}
              >
                Assign me
              </Button>
            )}
            <Button
              id={id + '-continue'}
              type="button"
              size="s"
              disabled={current === 'access' && needsOwner}
              aria-describedby={
                current === 'access' && owner === 'assigned' ? id + '-description' : undefined
              }
              onClick={advance}
            >
              {current === 'review' ? 'Create workspace' : 'Continue'}
            </Button>
          </CardFooter>
        )}
      </Card>
    </Stack>
  );
}
