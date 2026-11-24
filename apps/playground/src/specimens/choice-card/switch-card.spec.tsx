import { Flex } from '@docouno/unica';
import {
  SwitchCard,
  SwitchCardContent,
  SwitchCardDescription,
  SwitchCardIndicator,
  SwitchCardLabel,
} from '../../prototypes/choice-card/choice-card.proto.js';
import { size, disabled, readOnly, loading, choice, eventProp } from '../control-props.js';
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
} from '../../prototypes/choice-card/choice-card.examples.js';
import { WorkspaceSettings } from './workspace-settings.js';
import settingsSource from './workspace-settings.tsx?raw';

const label = 'Release summaries';
const help = 'Send a digest after each release.';
const proto = './prototypes/choice-card/choice-card.proto.js';

export default defineComponent({
  id: 'switch-card',
  title: 'SwitchCard',
  category: 'Forms',
  status: 'Proto',
  summary:
    'Immediate settings with a trailing switch and a stable value while a request is pending.',
  componentName: 'SwitchCard',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    loading,
    indicatorPlacement: choice(
      'Geometry',
      'Start or end places the built-in switch. With none, place SwitchCardIndicator inside the content, as shown beside the title.',
      ['start', 'end', 'none'],
      'end',
    ),
    onChange: eventProp(
      'Receives the native input’s React change event. The event log displays its checked value.',
      '(event) => console.log(event.currentTarget.checked)',
      'ChangeEventHandler<HTMLInputElement>',
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
  render: withOverlaySurface(
    ({ values, ctx }) => (
      <form {...ctx.form} data-choice-card-sample="switch">
        <SwitchCard
          {...values}
          {...ctx.subject}
          id={ctx.id}
          name="summaries"
          label={label}
          description={<bdi>{help}</bdi>}
          onChange={(event) => ctx.action('onChange')(event.currentTarget.checked)}
        >
          {values.indicatorPlacement === 'none' ? (
            <SwitchCardContent>
              <Flex align="start" justify="space-between" gap={12}>
                <SwitchCardLabel>{label}</SwitchCardLabel>
                <SwitchCardIndicator />
              </Flex>
              <SwitchCardDescription>
                <bdi>{help}</bdi>
              </SwitchCardDescription>
            </SwitchCardContent>
          ) : undefined}
        </SwitchCard>
      </form>
    ),
    'border-box',
  ),
  code: (values) => {
    const attributes = previewProps(values, {
      size: 'm',
      disabled: false,
      readOnly: false,
      loading: false,
      indicatorPlacement: 'end',
    });
    const manual = values.indicatorPlacement === 'none';
    const content = manual
      ? `>
        <SwitchCardContent>
          <Flex align="start" justify="space-between" gap={12}>
            <SwitchCardLabel>${label}</SwitchCardLabel>
            <SwitchCardIndicator />
          </Flex>
          <SwitchCardDescription><bdi>${help}</bdi></SwitchCardDescription>
        </SwitchCardContent>
      </SwitchCard>`
      : ' />';
    return `import { useId } from 'react';
${manual ? "import { Flex } from '@docouno/unica';\n" : ''}import { SwitchCard${manual ? ', SwitchCardContent, SwitchCardLabel, SwitchCardDescription, SwitchCardIndicator' : ''} } from '${proto}';
import '@docouno/unica/styles.css';

export function ReleaseSummaries() {
  const id = useId();
  return (
    <form>
      <SwitchCard id={id} name="summaries"${manual ? ' aria-describedby={id + "-description"}' : ` label="${label}" description={<bdi>${help}</bdi>}`}${attributes} onChange={(event) => console.log(event.currentTarget.checked)}${content}
    </form>
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
      mode: 'pinned',
      reset: true,
      caption:
        'Hover, held press and keyboard contours stay visible for comparison. Activating a card changes its native switch.',
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
        ({ ctx }) => <WorkspaceSettings cardProps={ctx.subject} />,
        'border-box',
      ),
      code: settingsSource.replace('../../prototypes/', './prototypes/'),
    },
  ],
});
