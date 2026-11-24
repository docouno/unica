import { Flex, Stack, Text } from '@docouno/unica';
import {
  RadioCard,
  RadioCardContent,
  RadioCardLabel,
  RadioCardDescription,
  RadioCardIndicator,
} from '../../prototypes/choice-card/choice-card.proto.js';
import { size, disabled, readOnly, choice } from '../control-props.js';
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
  Validation,
} from '../../prototypes/choice-card/choice-card.examples.js';
import { BackupSchedule } from './backup-schedule.js';
import backupSource from './backup-schedule.tsx?raw';
import { OutputResolution } from './output-resolution.js';
import resolutionSource from './output-resolution.tsx?raw';

const label = 'Daily backup';
const help = 'Every day at 02:00 UTC.';
const proto = './prototypes/choice-card/choice-card.proto.js';

export default defineComponent({
  id: 'radio-card',
  title: 'RadioCard',
  category: 'Forms',
  status: 'Proto',
  summary:
    'An exclusive choice with room for details, metadata, and independent secondary actions.',
  componentName: 'RadioCard',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    status: choice(
      'Semantics',
      'The danger example shows an approval message while the option is enabled.',
      ['neutral', 'danger'],
      'neutral',
    ),
    indicatorPlacement: choice(
      'Geometry',
      'Start or end places the built-in radio dot. With none, place RadioCardIndicator inside the content, as shown beside the title.',
      ['start', 'end', 'none'],
      'start',
    ),
    onChange: {
      kind: 'action',
      group: 'Interaction',
      publicType: 'ChangeEventHandler<HTMLInputElement>',
      description:
        'Receives the native radio input’s React change event. The event log displays the selected value.',
      code: '(event) => console.log(event.currentTarget.value)',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'status', value: 'danger' }],
      reason: 'Disabled choices suppress invalid styling and semantics.',
    },
  ],
  render: withOverlaySurface(({ values, ctx }) => {
    const review = values.status === 'danger' && !values.disabled;
    return (
      <form {...ctx.form} data-choice-card-sample="">
        <Stack gap={8}>
          <RadioCard
            {...values}
            {...ctx.subject}
            id={ctx.id}
            name="backup"
            value="daily"
            label={label}
            description={<bdi>{help}</bdi>}
            aria-describedby={review ? ctx.id + '-review' : undefined}
            onChange={(event) => ctx.action('onChange')(event.currentTarget.value)}
          >
            {values.indicatorPlacement === 'none' ? (
              <RadioCardContent>
                <Flex align="start" justify="space-between" gap={12}>
                  <RadioCardLabel>{label}</RadioCardLabel>
                  <RadioCardIndicator />
                </Flex>
                <RadioCardDescription>
                  <bdi>{help}</bdi>
                </RadioCardDescription>
              </RadioCardContent>
            ) : undefined}
          </RadioCard>
          {review && (
            <Text id={ctx.id + '-review'} size="caption-l" color="danger">
              <bdi>This schedule needs approval.</bdi>
            </Text>
          )}
        </Stack>
      </form>
    );
  }, 'border-box'),
  code: (values) => {
    const attributes = previewProps(values, {
      size: 'm',
      disabled: false,
      readOnly: false,
      status: 'neutral',
      indicatorPlacement: 'start',
    });
    const manual = values.indicatorPlacement === 'none';
    const review = values.status === 'danger' && !values.disabled;
    const description = manual
      ? review
        ? ' aria-describedby={id + "-review " + id + "-description"}'
        : ' aria-describedby={id + "-description"}'
      : review
        ? ' aria-describedby={id + "-review"}'
        : '';
    const content = manual
      ? `>
          <RadioCardContent>
            <Flex align="start" justify="space-between" gap={12}>
              <RadioCardLabel>${label}</RadioCardLabel>
              <RadioCardIndicator />
            </Flex>
            <RadioCardDescription><bdi>${help}</bdi></RadioCardDescription>
          </RadioCardContent>
        </RadioCard>`
      : ' />';
    return `import { useId } from 'react';
import { Stack${manual ? ', Flex' : ''}${review ? ', Text' : ''} } from '@docouno/unica';
import { RadioCard${manual ? ', RadioCardContent, RadioCardLabel, RadioCardDescription, RadioCardIndicator' : ''} } from '${proto}';
import '@docouno/unica/styles.css';

export function DailyBackup() {
  const id = useId();
  return (
    <form>
      <Stack gap={8}>
        <RadioCard id={id} name="backup" value="daily"${manual ? '' : ` label="${label}" description={<bdi>${help}</bdi>}`}${description}${attributes} onChange={(event) => console.log(event.currentTarget.value)}${content}${review ? '\n        <Text id={id + "-review"} size="caption-l" color="danger"><bdi>This schedule needs approval.</bdi></Text>' : ''}
      </Stack>
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
        'Compare an automatic radio dot at either edge with a dot placed beside the title. Select an empty card to see the mark at each density.',
    },
  ],
  cases: [
    {
      id: 'size-pairs',
      title: 'Access policies at each size',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Invited people starts selected at each density. Switch to Team workspace without changing the other pairs. At narrow widths, the cards stack.',
      render: withOverlaySurface(({ ctx }) => <Sizes kind="radio" ctx={ctx} />, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Content, metadata and secondary actions',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Open the details or follow the terms without changing the choice. The final card places its dot beside the title.',
      render: withOverlaySurface(({ ctx }) => <Anatomy kind="radio" ctx={ctx} />, 'border-box'),
    },
    {
      id: 'states',
      title: 'Pointer and keyboard feedback',
      kind: 'behavior',
      mode: 'pinned',
      reset: true,
      caption:
        'Hover, held press, and keyboard contours are pinned for comparison. Select an access level to move the dot within its pair.',
      render: withOverlaySurface(({ ctx }) => <Interaction kind="radio" ctx={ctx} />, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Policy and availability',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'The read-only policy stays selected. In the other group, choose Invited people to replace the disabled legacy policy. Both policy links remain available.',
      render: withOverlaySurface(
        ({ ctx }) => <Availability kind="radio" ctx={ctx} />,
        'border-box',
      ),
    },
    {
      id: 'validation',
      title: 'Validate a retention policy',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Check an empty selection, choose a retention period, and check again. The pinned pair shows how selection and keyboard focus coexist with an error.',
      render: withOverlaySurface(({ ctx }) => <Validation kind="radio" ctx={ctx} />, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long options and identifiers',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare a long policy title and an unbroken policy identifier. Follow the policy link without changing the selected retention option.',
      render: withOverlaySurface(({ ctx }) => <Overflow kind="radio" ctx={ctx} />, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'Choices in a floating surface',
      kind: 'surface',
      mode: 'live',
      reset: true,
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Choose who can open a page on the floating plate. Selecting an access policy replaces the previous answer.',
      render: ({ ctx }) => <Overlay kind="radio" ctx={ctx} />,
    },
  ],
  compositions: [
    {
      id: 'backup-schedule',
      title: 'Save a backup schedule',
      mode: 'live',
      reset: true,
      caption:
        'Daily and weekly backups share one native form field. Choose a schedule and save it to read the submitted answer.',
      render: withOverlaySurface(
        ({ ctx }) => <BackupSchedule cardProps={ctx.subject} />,
        'border-box',
      ),
      code: backupSource.replace('../../prototypes/', './prototypes/'),
    },
    {
      id: 'output-resolution',
      title: 'Choose an export resolution',
      mode: 'live',
      reset: true,
      caption:
        'Choose a resolution to update the pixel dimensions of a fixed eight-by-six-inch image. Each group keeps its own choice.',
      render: withOverlaySurface(
        ({ ctx }) => <OutputResolution cardProps={ctx.subject} />,
        'border-box',
      ),
      code: resolutionSource.replace('../../prototypes/', './prototypes/'),
    },
  ],
});
