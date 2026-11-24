import { useState } from 'react';
import type { ReactElement } from 'react';
import { Stack } from '@docouno/unica';
import type { StepperStepProps } from '../../prototypes/stepper/stepper.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import { StepMap } from './stepper-map.js';
import './stepper-state.css';

const pinnedSteps: readonly StepperStepProps[] = [
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

const liveSteps = pinnedSteps.map((step) => {
  const live = { ...step };
  delete live.preview;
  return live;
});

export function ReturnToStep({ ctx }: PreviewProps): ReactElement {
  const [current, setCurrent] = useState('review');
  const [pinned, setPinned] = useState(true);
  const showLiveStates = () => setPinned(false);

  return (
    <Stack
      className={
        ctx.surface === 'overlay'
          ? 'stepper-state-study unica-overlay-surface'
          : 'stepper-state-study'
      }
      data-surface={ctx.surface}
      onFocusCapture={showLiveStates}
      onPointerEnter={showLiveStates}
    >
      <StepMap
        {...ctx.subject}
        label="Workspace setup"
        layout="vertical"
        steps={pinned ? pinnedSteps : liveSteps}
        value={current}
        onValueChange={(next) => {
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
    invalid: true,
    issue: 'Reconnect the repository.',
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
        label="Repository import"
        layout="vertical"
        steps={importSteps}
        value="destination"
      />
    </Stack>
  );
}
