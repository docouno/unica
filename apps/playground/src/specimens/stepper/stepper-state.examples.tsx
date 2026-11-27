import type { ReactElement } from 'react';
import type { StepperStepProps } from '@docouno/unica';
import type { PreviewContext, PreviewProps } from '../../workbench/types.js';
import { StepMap } from './stepper-map.js';
import { workspaceSteps } from './stepper-steps.js';
import './stepper-state.css';

interface ProgressMap {
  readonly value: string | null;
  readonly steps: readonly StepperStepProps[];
  readonly label?: string;
}

const corrections: ProgressMap = {
  value: 'access',
  steps: workspaceSteps.map((step) => {
    if (step.value === 'details') {
      return {
        ...step,
        completed: true,
        status: 'danger',
        message: 'Choose an available workspace name.',
      };
    }
    if (step.value === 'access') {
      return { ...step, status: 'danger', message: 'Assign a workspace owner.' };
    }
    return step;
  }),
};

const completed = workspaceSteps.map((step) => ({ ...step, completed: true }));
const progressMaps: Readonly<Record<string, ProgressMap>> = {
  issues: corrections,
  revisited: { value: 'details', steps: completed },
  saved: {
    value: null,
    steps: workspaceSteps.map((step) => ({ ...step, completed: step.value === 'details' })),
  },
  draft: {
    label: 'Workspace configuration',
    value: 'defaults',
    steps: [
      { value: 'details', label: 'Workspace', completed: true },
      { value: 'groups', label: 'Map groups', completed: true },
      { value: 'defaults', label: 'Default policies', description: 'Region and retention period' },
      { value: 'integrations', label: 'Connect services' },
      { value: 'review', label: 'Review and launch' },
    ],
  },
  unstarted: { value: null, steps: workspaceSteps },
  complete: { value: null, steps: completed },
};

const narrowMap: ProgressMap = {
  label: 'Workspace configuration',
  value: 'defaults',
  steps: [
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
  ],
};

function selectedMap(ctx: PreviewContext): ProgressMap {
  const selection = ctx.story?.controls.progress;
  return (typeof selection === 'string' && progressMaps[selection]) || corrections;
}

function StateStudy({
  ctx,
  study,
  map,
}: PreviewProps & {
  readonly study: 'progress' | 'long-labels' | 'compact';
  readonly map: ProgressMap;
}): ReactElement {
  return (
    <div
      className={
        ctx.surface === 'overlay'
          ? 'stepper-state-study unica-overlay-surface'
          : 'stepper-state-study'
      }
      data-study={study}
      data-surface={ctx.surface}
    >
      <StepMap
        {...ctx.subject}
        aria-label={map.label ?? 'Workspace setup'}
        value={map.value}
        steps={map.steps}
        layout={study === 'compact' ? 'compact' : 'vertical'}
      />
    </div>
  );
}

export function ProgressStates({ ctx }: PreviewProps): ReactElement {
  return <StateStudy ctx={ctx} study="progress" map={selectedMap(ctx)} />;
}

export function LongLabels({ ctx }: PreviewProps): ReactElement {
  return <StateStudy ctx={ctx} study="long-labels" map={narrowMap} />;
}

export function CompactSummaries({ ctx }: PreviewProps): ReactElement {
  return <StateStudy ctx={ctx} study="compact" map={selectedMap(ctx)} />;
}
