import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PropSchema } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { stepperCode } from './stepper-code.js';
import { RepositoryImport, ReturnToStep } from './stepper-interaction.examples.js';
import { WorkspaceSetupExample } from './stepper-journey.example.js';
import journeySource from './stepper-journey.example.tsx?raw';
import { StepperPlayground } from './stepper-playground.js';
import { CompactSummaries, LongLabels, ProgressStates } from './stepper-state.examples.js';

const props = {
  size: {
    kind: 'enum',
    group: 'Geometry',
    default: 'm',
    description: 'Set marker size, label typography and space between stages.',
    choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
  },
  layout: {
    kind: 'enum',
    group: 'Geometry',
    default: 'responsive',
    description:
      'Choose a map or a compact summary. The responsive layout follows the width of its own container.',
    choices: [
      { value: 'responsive' },
      { value: 'horizontal' },
      { value: 'vertical' },
      { value: 'compact' },
    ],
  },
  label: {
    kind: 'string',
    group: 'Semantics',
    default: '',
    description:
      'Name the process that the map describes. A blank field uses the selected process name.',
    examples: ['', 'Workspace setup', 'Publish a release'],
  },
  value: {
    kind: 'string',
    group: 'Interaction',
    publicType: 'string | null',
    default: 'review',
    description:
      'Set the initial current stage of the example owner. A blank value passes null. An unmatched stage has no current marker.',
    examples: ['', 'details', 'access', 'review', 'publish'],
  },
  onValueChange: {
    kind: 'action',
    group: 'Interaction',
    publicType: '(value: string) => void',
    description:
      'Request a completed stage or a stage with an issue. The owner decides whether to make it current.',
    code: 'handleValueChange',
  },
  example: {
    kind: 'enum',
    group: 'Content',
    demo: true,
    default: 'release',
    label: 'Process',
    description: 'Choose the release or workspace stages and their descriptions.',
    choices: [
      { value: 'release', label: 'Release' },
      { value: 'workspace', label: 'Workspace setup' },
    ],
  },
  allowReturn: {
    kind: 'boolean',
    group: 'Interaction',
    demo: true,
    default: true,
    label: 'Allow return',
    description:
      'Choose an interactive or read-only map. Switching starts the map at its configured value.',
  },
} as const satisfies PropSchema;

export type StepperValues = ComponentValues<typeof props>;

const workspace = {
  example: 'workspace',
  label: 'Workspace setup',
  value: 'access',
  allowReturn: false,
} as const;

export default defineComponent({
  id: 'stepper',
  title: 'Stepper',
  category: 'Navigation',
  status: 'Proto',
  componentName: 'Stepper',
  summary: 'An ordered map for setup, review, and other staged tasks.',
  props,
  code: stepperCode,
  render: withOverlaySurface(StepperPlayground, 'border-box'),
  states: [
    {
      id: 'sizes',
      title: 'Horizontal sizes',
      rows: 'size',
      fixed: { ...workspace, layout: 'horizontal' },
      caption:
        'Compare the 24, 32 and 40 pixel markers along the same route. The dense row uses titles alone, and larger rows include a description.',
    },
    {
      id: 'vertical-sizes',
      title: 'Vertical sizes',
      rows: 'size',
      fixed: { ...workspace, layout: 'vertical' },
      caption:
        'The current stage has a longer description. Compare the first label line and the rails as the marker size changes.',
    },
    {
      id: 'layouts',
      title: 'Step layouts',
      rows: 'layout',
      fixed: { ...workspace, size: 'm' },
      caption:
        'Compare the two full maps with a compact summary. The responsive map changes with available width.',
    },
  ],
  cases: [
    {
      id: 'states',
      title: 'Progress and validation',
      kind: 'behavior',
      mode: 'pinned',
      controls: {
        progress: {
          kind: 'enum',
          label: 'Progress',
          default: 'issues',
          choices: [
            { value: 'unstarted', label: 'Before starting' },
            { value: 'issues', label: 'Two stages with issues' },
            { value: 'revisited', label: 'Revisited stage' },
            { value: 'draft', label: 'Saved draft' },
            { value: 'complete', label: 'Complete' },
          ],
        },
      },
      caption:
        'Compare the current marker, completed checkmarks and connecting rails before starting, after validation, and when all stages are complete.',
      render: ProgressStates,
    },
    {
      id: 'long-labels',
      title: 'Long stages in a narrow column',
      kind: 'content',
      mode: 'pinned',
      caption:
        'Long stage names and descriptions wrap beside the markers. The vertical rails stay aligned as the rows grow.',
      render: LongLabels,
    },
    {
      id: 'compact',
      title: 'Compact summaries',
      kind: 'content',
      mode: 'pinned',
      controls: {
        progress: {
          kind: 'enum',
          label: 'Progress',
          default: 'issues',
          choices: [
            { value: 'issues', label: 'Two stages with issues' },
            { value: 'saved', label: 'Saved for later' },
            { value: 'complete', label: 'Complete' },
          ],
        },
      },
      caption:
        'In a column up to 320px wide, the summary names the current issue and an earlier stage to check. Saved and finished processes show how much is complete.',
      render: CompactSummaries,
    },
    {
      id: 'interaction',
      title: 'Return to a step',
      kind: 'behavior',
      mode: 'live',
      controls: {
        request: {
          kind: 'enum',
          label: 'Return request',
          default: 'accept',
          choices: [
            { value: 'accept', label: 'Accept' },
            { value: 'decline', label: 'Decline' },
          ],
        },
      },
      reset: true,
      caption:
        'Details starts hovered, Access rules pressed and Defaults focused. Move into the map or tab to a stage to compare focus when its owner accepts or declines a return.',
      render: ReturnToStep,
    },
    {
      id: 'overlay',
      title: 'In a floating surface',
      kind: 'surface',
      mode: 'pinned',
      overlayStage: true,
      surface: 'overlay',
      caption:
        'A repository import stays on its destination stage. The earlier source stage explains how to reconnect the repository.',
      render: RepositoryImport,
    },
  ],
  compositions: [
    {
      id: 'journey',
      title: 'Workspace setup',
      mode: 'live',
      reset: true,
      caption:
        'Continue without an owner to show the correction. Revisit a completed stage, assign an owner, then review and create the workspace.',
      render: ({ ctx }) => (
        <div
          data-example-disclosure=""
          style={{ inlineSize: 'min(100%, 48rem)', minInlineSize: 0 }}
        >
          <ExampleSurface surface={ctx.surface} sizing="border-box">
            <WorkspaceSetupExample subject={ctx.subject} />
          </ExampleSurface>
        </div>
      ),
      code: journeySource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
