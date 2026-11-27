import { useState } from 'react';
import type { ReactElement } from 'react';
import { Stack } from '@docouno/unica';
import type { StepperStepProps } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { StepMap } from './stepper-map.js';
import './stepper-state.css';

const revisitSteps: readonly StepperStepProps[] = [
  { value: 'plan', label: 'Plan', completed: true },
  { value: 'details', label: 'Details', completed: true },
  {
    value: 'access',
    label: 'Access rules',
    status: 'danger',
    message: 'Assign an owner.',
  },
  { value: 'defaults', label: 'Defaults', completed: true },
  { value: 'review', label: 'Review' },
  { value: 'launch', label: 'Launch' },
];

export function ReturnToStep({ ctx }: PreviewProps): ReactElement {
  const [current, setCurrent] = useState('details');

  return (
    <Stack
      className={
        ctx.surface === 'overlay'
          ? 'stepper-state-study unica-overlay-surface'
          : 'stepper-state-study'
      }
      data-surface={ctx.surface}
    >
      <StepMap
        {...ctx.subject}
        aria-label="Workspace setup"
        allowReturn
        layout="vertical"
        steps={revisitSteps}
        value={current}
        onValueChange={(next) => {
          ctx.action('onValueChange')(next);
          if (ctx.story?.controls.request !== 'decline') {
            setCurrent(next);
          }
        }}
      />
    </Stack>
  );
}

const importSteps: readonly StepperStepProps[] = [
  {
    value: 'source',
    label: 'Source repository',
    status: 'danger',
    message: 'Reconnect the repository.',
  },
  { value: 'destination', label: 'Destination', description: 'Choose a workspace' },
  { value: 'review', label: 'Review' },
];

export function RepositoryImport({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack
      className="unica-overlay-surface"
      data-surface="overlay"
      style={{
        position: 'relative',
        boxSizing: 'border-box',
        inlineSize: 'min(100%, 23rem)',
        minInlineSize: 0,
        padding: 'var(--surface-m-padding)',
        borderRadius: 'var(--surface-m-radius)',
      }}
    >
      <StepMap
        {...ctx.subject}
        aria-label="Repository import"
        layout="vertical"
        steps={importSteps}
        value="destination"
      />
    </Stack>
  );
}
