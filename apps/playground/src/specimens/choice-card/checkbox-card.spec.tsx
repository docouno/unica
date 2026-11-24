import { Flex } from '@docouno/unica';
import {
  CheckboxCard,
  CheckboxCardContent,
  CheckboxCardLabel,
  CheckboxCardDescription,
  CheckboxCardIndicator,
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
import { ExportFormats } from './export-formats.js';
import exportSource from './export-formats.tsx?raw';
import { RetentionOption } from './retention-option.js';
import retentionSource from './retention-option.tsx?raw';

const label = 'Archive completed exports';
const help = 'Keep generated files together for 30 days.';
const proto = './prototypes/choice-card/choice-card.proto.js';

export default defineComponent({
  id: 'checkbox-card',
  title: 'CheckboxCard',
  category: 'Forms',
  status: 'Proto',
  summary: 'Independent options with descriptions, metadata, and secondary actions.',
  componentName: 'CheckboxCard',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    status: choice(
      'Semantics',
      'Validation feedback for the option.',
      ['neutral', 'danger'],
      'neutral',
    ),
    indicatorPlacement: choice(
      'Geometry',
      'Start or end places the built-in check. With none, place CheckboxCardIndicator inside the content, as shown beside the title.',
      ['start', 'end', 'none'],
      'start',
    ),
    onChange: {
      kind: 'action',
      group: 'Interaction',
      publicType: 'ChangeEventHandler<HTMLInputElement>',
      description:
        'Receives the native input’s React change event. The event log shows its checked value.',
      code: '(event) => console.log(event.currentTarget.checked)',
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
  render: withOverlaySurface(
    ({ values, ctx }) => (
      <form {...ctx.form} data-choice-card-sample="">
        <CheckboxCard
          {...values}
          {...ctx.subject}
          id={ctx.id}
          name="archive"
          value="exports"
          label={label}
          description={<bdi>{help}</bdi>}
          onChange={(event) => ctx.action('onChange')(event.currentTarget.checked)}
        >
          {values.indicatorPlacement === 'none' ? (
            <CheckboxCardContent>
              <Flex align="start" justify="space-between" gap={12}>
                <CheckboxCardLabel>{label}</CheckboxCardLabel>
                <CheckboxCardIndicator />
              </Flex>
              <CheckboxCardDescription>
                <bdi>{help}</bdi>
              </CheckboxCardDescription>
            </CheckboxCardContent>
          ) : undefined}
        </CheckboxCard>
      </form>
    ),
    'border-box',
  ),
  code: (values) => {
    const attributes = previewProps(values, {
      size: 'm',
      disabled: false,
      readOnly: false,
      status: 'neutral',
      indicatorPlacement: 'start',
    });
    if (values.indicatorPlacement === 'none') {
      return `import { useId } from 'react';
import { Flex } from '@docouno/unica';
import { CheckboxCard, CheckboxCardContent, CheckboxCardLabel, CheckboxCardDescription, CheckboxCardIndicator } from '${proto}';
import '@docouno/unica/styles.css';

export function ArchiveOption() {
  const id = useId();
  return (
    <CheckboxCard id={id} aria-describedby={id + '-description'} name="archive" value="exports"${attributes} onChange={(event) => console.log(event.currentTarget.checked)}>
      <CheckboxCardContent>
        <Flex align="start" justify="space-between" gap={12}>
          <CheckboxCardLabel>${label}</CheckboxCardLabel>
          <CheckboxCardIndicator />
        </Flex>
        <CheckboxCardDescription><bdi>${help}</bdi></CheckboxCardDescription>
      </CheckboxCardContent>
    </CheckboxCard>
  );
}`;
    }
    return `import { CheckboxCard } from '${proto}';
import '@docouno/unica/styles.css';

export function ArchiveOption() {
  return <CheckboxCard name="archive" value="exports" label="${label}" description={<bdi>${help}</bdi>}${attributes} onChange={(event) => console.log(event.currentTarget.checked)} />;
}`;
  },
  states: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'indicatorPlacement',
      title: 'Size and indicator placement',
      caption: 'Compare automatic checks at either edge with a check placed beside the title.',
    },
  ],
  cases: [
    {
      id: 'size-pairs',
      title: 'Selected and empty at each size',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare the empty square and selected check at each density. The pairs stack as the available width narrows.',
      render: withOverlaySurface(({ ctx }) => <Sizes kind="checkbox" ctx={ctx} />, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Content, metadata and secondary actions',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Open the details or follow the terms without changing the choice. The final card places its check beside the title.',
      render: withOverlaySurface(({ ctx }) => <Anatomy kind="checkbox" ctx={ctx} />, 'border-box'),
    },
    {
      id: 'states',
      title: 'Pointer and keyboard feedback',
      kind: 'behavior',
      mode: 'pinned',
      reset: true,
      caption:
        'Hover, held press, and keyboard contours are pinned for comparison. Activate a card to change its native checked state.',
      render: withOverlaySurface(
        ({ ctx }) => <Interaction kind="checkbox" ctx={ctx} />,
        'border-box',
      ),
    },
    {
      id: 'availability',
      title: 'Policy and availability',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Read-only choices can receive focus. Disabled choices retain their values visually. Policy links remain available in both groups.',
      render: withOverlaySurface(
        ({ ctx }) => <Availability kind="checkbox" ctx={ctx} />,
        'border-box',
      ),
    },
    {
      id: 'validation',
      title: 'Validate an export selection',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Check an empty selection, choose a format, and check again. The pinned pair shows how selection and keyboard focus coexist with an error.',
      render: withOverlaySurface(
        ({ ctx }) => <Validation kind="checkbox" ctx={ctx} />,
        'border-box',
      ),
    },
    {
      id: 'overflow',
      title: 'Long options and identifiers',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption: 'Long titles, metadata and the policy link wrap while both cards keep their checks.',
      render: withOverlaySurface(({ ctx }) => <Overflow kind="checkbox" ctx={ctx} />, 'border-box'),
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
        'Choose the contents of an archive on a floating plate. Organization policy keeps one option selected.',
      render: ({ ctx }) => <Overlay kind="checkbox" ctx={ctx} />,
    },
  ],
  compositions: [
    {
      id: 'formats',
      title: 'Export formats',
      mode: 'live',
      reset: true,
      caption:
        'Select either or both formats. Each card submits its own value under the same name.',
      render: withOverlaySurface(
        ({ ctx }) => <ExportFormats cardProps={ctx.subject} />,
        'border-box',
      ),
      code: exportSource.replace('../../prototypes/', './prototypes/'),
    },
    {
      id: 'retention',
      title: 'Optional file retention',
      mode: 'live',
      reset: true,
      caption:
        'Read the policy before choosing whether to retain the originals. Opening the policy preserves the selection.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div data-example-disclosure="">
            <RetentionOption cardProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: retentionSource.replace('../../prototypes/', './prototypes/'),
    },
  ],
});
