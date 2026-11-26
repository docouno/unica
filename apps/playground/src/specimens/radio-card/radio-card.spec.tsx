import type { ChangeEvent } from 'react';
import {
  Flex,
  RadioCard,
  ChoiceCardContent,
  ChoiceCardLabel,
  ChoiceCardDescription,
  RadioCardIndicator,
  RadioCardGroup,
  Stack,
  Text,
} from '@docouno/unica';
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
} from '../shared/choice-card-studies.js';
import { BackupSchedule } from './backup-schedule.js';
import backupSource from './backup-schedule.tsx?raw';
import { OutputResolution } from './output-resolution.js';
import resolutionSource from './output-resolution.tsx?raw';

const label = 'Daily backup';
const help = 'Every day at 02:00 UTC.';

export default defineComponent({
  id: 'radio-card',
  title: 'RadioCard',
  category: 'Forms',
  status: 'UI',
  summary:
    'An exclusive choice with room for details, metadata, and independent secondary actions.',
  componentName: 'RadioCard',
  props: {
    size,
    disabled,
    readOnly: { ...readOnly, description: 'Keep the whole group read-only.', demo: true },
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
      description: 'Receives the native change event when this option is selected.',
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
    const { readOnly, ...options } = values;
    const titleId = ctx.id + '-title';
    const descriptionId = ctx.id + '-description';
    const reviewId =
      values.status === 'danger' && !values.disabled ? ctx.id + '-review' : undefined;
    const common = {
      ...options,
      id: ctx.id,
      value: 'daily',
      onChange: (event: ChangeEvent<HTMLInputElement>) =>
        ctx.action('onChange')(event.currentTarget.value),
    };
    const card =
      options.indicatorPlacement === 'none' ? (
        <RadioCard
          {...common}
          aria-labelledby={titleId}
          aria-describedby={[descriptionId, reviewId].filter(Boolean).join(' ')}
        >
          <ChoiceCardContent>
            <Flex align="start" justify="space-between" gap={12}>
              <ChoiceCardLabel id={titleId}>{label}</ChoiceCardLabel>
              <RadioCardIndicator />
            </Flex>
            <ChoiceCardDescription id={descriptionId}>
              <bdi>{help}</bdi>
            </ChoiceCardDescription>
          </ChoiceCardContent>
        </RadioCard>
      ) : (
        <RadioCard
          {...common}
          label={label}
          description={<bdi>{help}</bdi>}
          aria-describedby={reviewId}
        />
      );
    return (
      <Stack gap={8}>
        <RadioCardGroup
          name={`${ctx.id}-backup`}
          aria-label="Backup schedule"
          readOnly={readOnly}
          defaultValue="weekly"
        >
          <div {...ctx.subject} className="choice-study-subject" data-choice-card-sample="">
            {card}
          </div>
          <RadioCard value="weekly" label="Weekly backup" />
        </RadioCardGroup>
        {reviewId && (
          <Text id={reviewId} size="caption-l" color="danger">
            <bdi>This schedule needs approval.</bdi>
          </Text>
        )}
      </Stack>
    );
  }, 'border-box'),
  code: (values) => {
    const attributes = previewProps(
      { ...values, readOnly: false },
      {
        size: 'm',
        disabled: false,
        readOnly: false,
        status: 'neutral',
        indicatorPlacement: 'start',
      },
    );
    const manual = values.indicatorPlacement === 'none';
    const review = values.status === 'danger' && !values.disabled;
    const describedBy = manual
      ? review
        ? ' aria-describedby={id + "-description " + id + "-review"}'
        : ' aria-describedby={id + "-description"}'
      : review
        ? ' aria-describedby={id + "-review"}'
        : '';
    const slots = manual
      ? ` aria-labelledby={id + "-title"}`
      : ` label="${label}" description={<bdi>${help}</bdi>}`;
    const content = manual
      ? `>
          <ChoiceCardContent>
            <Flex align="start" justify="space-between" gap={12}>
              <ChoiceCardLabel id={id + "-title"}>${label}</ChoiceCardLabel>
              <RadioCardIndicator />
            </Flex>
            <ChoiceCardDescription id={id + "-description"}><bdi>${help}</bdi></ChoiceCardDescription>
          </ChoiceCardContent>
        </RadioCard>`
      : ' />';
    const snippet = `<RadioCard value="daily"${slots}${describedBy}${attributes} onChange={(event) => console.log(event.currentTarget.value)}${content}`;
    return `import { useId } from 'react';
import { RadioCard, RadioCardGroup, Stack${manual ? ', Flex, ChoiceCardContent, ChoiceCardLabel, ChoiceCardDescription, RadioCardIndicator' : ''}${review ? ', Text' : ''} } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DailyBackup() {
  const id = useId();
  return (
    <Stack gap={8}>
      <RadioCardGroup name={id + "-backup"} aria-label="Backup schedule" defaultValue="weekly"${values.readOnly ? ' readOnly' : ''}>
        ${snippet}
        <RadioCard value="weekly" label="Weekly backup" />
      </RadioCardGroup>${review ? '\n      <Text id={id + "-review"} size="caption-l" color="danger">This schedule needs approval.</Text>' : ''}
    </Stack>
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
      mode: 'live',
      reset: true,
      caption:
        'Hover or hold the primary target to see the edge change. Tab to a choice for its outer focus ring.',
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
      actions: [{ id: 'check-selection', label: 'Check selection' }],
      reset: true,
      caption:
        'Check an empty selection, choose a retention period, and check again. Tab to the selected card in the second example to see the error edge and focus ring together.',
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
        ({ ctx }) => <BackupSchedule subjectProps={ctx.subject} />,
        'border-box',
      ),
      code: backupSource,
    },
    {
      id: 'output-resolution',
      title: 'Choose an export resolution',
      mode: 'live',
      reset: true,
      caption:
        'Choose a resolution to update the pixel dimensions of a fixed eight-by-six-inch image. Each group keeps its own choice.',
      render: withOverlaySurface(
        ({ ctx }) => <OutputResolution subjectProps={ctx.subject} />,
        'border-box',
      ),
      code: resolutionSource,
    },
  ],
});
