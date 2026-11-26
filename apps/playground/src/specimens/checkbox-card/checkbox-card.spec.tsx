import {
  Flex,
  CheckboxCard,
  ChoiceCardContent,
  ChoiceCardLabel,
  ChoiceCardDescription,
  CheckboxCardIndicator,
} from '@docouno/unica';
import { size, disabled, readOnly, choice, eventProp, required, toggle } from '../control-props.js';
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
import { ExportFormats } from './export-formats.js';
import exportSource from './export-formats.tsx?raw';
import { RetentionOption } from './retention-option.js';
import retentionSource from './retention-option.tsx?raw';

const label = 'Archive completed exports';
const help = 'Keep generated files together for 30 days.';

export default defineComponent({
  id: 'checkbox-card',
  title: 'CheckboxCard',
  category: 'Forms',
  status: 'UI',
  summary: 'Independent options with descriptions, metadata, and secondary actions.',
  componentName: 'CheckboxCard',
  props: {
    size,
    disabled,
    readOnly,
    defaultChecked: toggle('Interaction', 'Start with this choice selected.'),
    required,
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
      affects: [{ key: 'status', value: 'danger' }],
      reason: 'Disabled choices suppress invalid styling and semantics.',
    },
  ],
  render: withOverlaySurface(({ values, ctx }) => {
    const { defaultChecked, ...options } = values;
    const titleId = ctx.id + '-title';
    const descriptionId = ctx.id + '-description';
    const common = {
      ...options,
      id: ctx.id,
      name: 'archive',
      value: 'exports',
      defaultChecked,
      onCheckedChange: (next: boolean) => ctx.action('onCheckedChange')(next),
    };
    const card =
      options.indicatorPlacement === 'none' ? (
        <CheckboxCard {...common} aria-labelledby={titleId} aria-describedby={descriptionId}>
          <ChoiceCardContent>
            <Flex align="start" justify="space-between" gap={12}>
              <ChoiceCardLabel id={titleId}>{label}</ChoiceCardLabel>
              <CheckboxCardIndicator />
            </Flex>
            <ChoiceCardDescription id={descriptionId}>
              <bdi>{help}</bdi>
            </ChoiceCardDescription>
          </ChoiceCardContent>
        </CheckboxCard>
      ) : (
        <CheckboxCard {...common} label={label} description={<bdi>{help}</bdi>} />
      );
    return (
      <div {...ctx.subject} data-choice-card-sample="" key={String(defaultChecked)}>
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
      required: false,
      status: 'neutral',
      indicatorPlacement: 'start',
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
              <CheckboxCardIndicator />
            </Flex>
            <ChoiceCardDescription id={id + "-description"}><bdi>${help}</bdi></ChoiceCardDescription>
          </ChoiceCardContent>
        </CheckboxCard>`
      : ' />';
    const snippet = `<CheckboxCard name="archive" value="exports"${slots}${describedBy}${attributes} onCheckedChange={(next) => console.log(next)}${content}`;
    return `${manual ? "import { useId } from 'react';\n" : ''}import { CheckboxCard${manual ? ', Flex, ChoiceCardContent, ChoiceCardLabel, ChoiceCardDescription, CheckboxCardIndicator' : ''} } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ArchiveOption() {
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
      mode: 'live',
      reset: true,
      caption:
        'Hover or hold the primary target to see the edge change. Tab to a choice for its outer focus ring.',
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
      actions: [{ id: 'check-selection', label: 'Check selection' }],
      reset: true,
      caption:
        'Check an empty selection, choose a format, and check again. Tab to the selected card in the second example to see the error edge and focus ring together.',
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
        ({ ctx }) => <ExportFormats subjectProps={ctx.subject} />,
        'border-box',
      ),
      code: exportSource,
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
            <RetentionOption subjectProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: retentionSource,
    },
  ],
});
