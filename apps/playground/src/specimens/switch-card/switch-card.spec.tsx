import {
  Flex,
  SwitchCard,
  ChoiceCardContent,
  ChoiceCardLabel,
  ChoiceCardDescription,
  SwitchCardIndicator,
} from '@docouno/unica';
import { size, disabled, readOnly, loading, choice, eventProp, toggle } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  Anatomy,
  Availability,
  Interaction,
  Overflow,
  Overlay,
  Sizes,
  SwitchPending,
  SwitchRequest,
} from '../shared/choice-card-studies.js';
import { WorkspaceSettings } from './workspace-settings.js';
import settingsSource from './workspace-settings.tsx?raw';

const label = 'Release summaries';
const help = 'Send a digest after each release.';

export default defineComponent({
  id: 'switch-card',
  title: 'SwitchCard',
  category: 'Forms',
  status: 'UI',
  summary:
    'Immediate settings with a trailing switch and a stable value while a request is pending.',
  componentName: 'SwitchCard',
  props: {
    size,
    disabled,
    readOnly,
    defaultChecked: toggle('Interaction', 'Start with this choice selected.'),
    loading,
    indicatorPlacement: choice(
      'Geometry',
      'Start or end places the built-in switch. With none, place SwitchCardIndicator inside the content, as shown beside the title.',
      ['start', 'end', 'none'],
      'end',
    ),
    onCheckedChange: eventProp(
      'Receives the proposed checked value.',
      '(next) => console.log(next)',
      '(next: boolean) => void',
    ),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'loading', value: true }],
      reason: 'A disabled switch card suppresses the pending indicator and leaves the tab order.',
    },
  ],
  render: withOverlaySurface(({ values, ctx }) => {
    const { defaultChecked, ...options } = values;
    const titleId = ctx.id + '-title';
    const descriptionId = ctx.id + '-description';
    const common = {
      ...options,
      id: ctx.id,
      name: 'summaries',
      value: 'on',
      defaultChecked,
      onCheckedChange: (next: boolean) => ctx.action('onCheckedChange')(next),
    };
    const card =
      options.indicatorPlacement === 'none' ? (
        <SwitchCard {...common} aria-labelledby={titleId} aria-describedby={descriptionId}>
          <ChoiceCardContent>
            <Flex align="start" justify="space-between" gap={12}>
              <ChoiceCardLabel id={titleId}>{label}</ChoiceCardLabel>
              <SwitchCardIndicator />
            </Flex>
            <ChoiceCardDescription id={descriptionId}>
              <bdi>{help}</bdi>
            </ChoiceCardDescription>
          </ChoiceCardContent>
        </SwitchCard>
      ) : (
        <SwitchCard {...common} label={label} description={<bdi>{help}</bdi>} />
      );
    return (
      <div {...ctx.subject} data-choice-card-sample="switch" key={String(defaultChecked)}>
        {card}
      </div>
    );
  }, 'border-box'),
  code: (values) => {
    const attributes = previewProps(values, {
      size: 'm',
      disabled: false,
      readOnly: false,
      defaultChecked: false,
      loading: false,
      indicatorPlacement: 'end',
    });
    const manual = values.indicatorPlacement === 'none';
    const describedBy = manual ? ' aria-describedby={id + "-description"}' : '';
    const slots = manual
      ? ` aria-labelledby={id + "-title"}`
      : ` label="${label}" description={<bdi>${help}</bdi>}`;
    const content = manual
      ? `>
          <ChoiceCardContent>
            <Flex align="start" justify="space-between" gap={12}>
              <ChoiceCardLabel id={id + "-title"}>${label}</ChoiceCardLabel>
              <SwitchCardIndicator />
            </Flex>
            <ChoiceCardDescription id={id + "-description"}><bdi>${help}</bdi></ChoiceCardDescription>
          </ChoiceCardContent>
        </SwitchCard>`
      : ' />';
    const snippet = `<SwitchCard name="summaries" value="on"${slots}${describedBy}${attributes} onCheckedChange={(next) => console.log(next)}${content}`;
    return `${manual ? "import { useId } from 'react';\n" : ''}import { SwitchCard${manual ? ', Flex, ChoiceCardContent, ChoiceCardLabel, ChoiceCardDescription, SwitchCardIndicator' : ''} } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ReleaseSummaries() {
  ${manual ? 'const id = useId();\n  ' : ''}return (
    ${snippet}
  );
}`;
  },
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'indicatorPlacement',
      title: 'Size and indicator placement',
      caption:
        'Compare the automatic switch at either edge with a switch placed beside the title. Each card starts off and keeps its own setting.',
    },
  ],
  cases: [
    {
      id: 'size-pairs',
      title: 'Review reminders at each density',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare the trailing track on identical settings that start off and on. The pair stacks when space is limited.',
      render: withOverlaySurface(({ ctx }) => <Sizes kind="switch" ctx={ctx} />, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Content, metadata and secondary actions',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Open the details or follow the terms while keeping the digest setting. The final card places its switch beside the title.',
      render: withOverlaySurface(({ ctx }) => <Anatomy kind="switch" ctx={ctx} />, 'border-box'),
    },
    {
      id: 'states',
      title: 'Pointer and keyboard feedback',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Hover or hold the primary target to see the edge change. Tab to a choice for its outer focus ring.',
      render: withOverlaySurface(
        ({ ctx }) => <Interaction kind="switch" ctx={ctx} />,
        'border-box',
      ),
    },
    {
      id: 'availability',
      title: 'Policy and availability',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Read-only settings keep their value in the tab order. Disabled settings skip focus. The policy links remain available in both groups.',
      render: withOverlaySurface(
        ({ ctx }) => <Availability kind="switch" ctx={ctx} />,
        'border-box',
      ),
    },
    {
      id: 'pending',
      title: 'Pending at every size',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare a pending change from off and on at each density. The spinner keeps the committed position. A disabled setting suppresses pending feedback.',
      render: withOverlaySurface(SwitchPending, 'border-box'),
    },
    {
      id: 'request',
      title: 'Save, fail and retry',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Toggle reminders to start a request. Succeed or Fail resolves each waiting request. Read the schedule during a save, or retry a failed change.',
      actions: [
        { id: 'succeed', label: 'Succeed' },
        { id: 'fail', label: 'Fail' },
      ],
      render: withOverlaySurface(SwitchRequest, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long settings and identifiers',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Long titles, metadata and the policy link wrap around the switch. Follow the guidance while keeping the current settings.',
      render: withOverlaySurface(({ ctx }) => <Overflow kind="switch" ctx={ctx} />, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'Notifications in a floating surface',
      kind: 'surface',
      mode: 'live',
      reset: true,
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Change the notification channels on a floating plate. The organization keeps its policy setting enabled.',
      render: ({ ctx }) => <Overlay kind="switch" ctx={ctx} />,
    },
  ],
  compositions: [
    {
      id: 'shared',
      title: 'Workspace access and notifications',
      mode: 'live',
      reset: true,
      caption:
        'Compare the selected access policy and the immediate notification setting at three densities. Toggle a notification without changing access.',
      render: withOverlaySurface(
        ({ ctx }) => <WorkspaceSettings subjectProps={ctx.subject} />,
        'border-box',
      ),
      code: settingsSource,
    },
  ],
});
