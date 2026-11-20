import { RadioCard } from '../../prototypes/choice-card/choice-card.proto.js';
import { size, disabled, readOnly, choice, eventProp } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import {
  Anatomy,
  Availability,
  Interaction,
  Overflow,
  Overlay,
  Sizes,
  Validation,
} from '../../prototypes/choice-card/choice-card.examples.js';

export default defineComponent({
  id: 'radio-card',
  title: 'RadioCard',
  category: 'Forms',
  status: 'Proto',
  summary:
    'One considered choice among alternatives. Circular markers, comparable content, and independent secondary actions.',
  componentName: 'RadioCard',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    status: choice('Field', 'Feedback tone of the selection.', ['neutral', 'danger'], 'neutral'),
    indicatorPlacement: choice(
      'Geometry',
      'Which edge displays the indicator.',
      ['start', 'end', 'none'],
      'start',
    ),
    onChange: eventProp('Reports the selected backup schedule.', 'handleChange'),
  },
  render: ({ values, ctx }) => (
    <form {...ctx.form}>
      <div role="radiogroup" aria-label="Backup schedule">
        <RadioCard
          {...values}
          {...ctx.subject}
          id={`${ctx.id}-daily`}
          name="backup"
          value="daily"
          label="Daily"
          description="Every day at 02:00 UTC"
          defaultChecked
          onChange={(event) => ctx.action('onChange')(event.currentTarget.value)}
        />
        <RadioCard
          {...values}
          {...ctx.subject}
          id={`${ctx.id}-weekly`}
          name="backup"
          value="weekly"
          label="Weekly"
          description="Every Monday at 02:00 UTC"
          onChange={(event) => ctx.action('onChange')(event.currentTarget.value)}
        />
      </div>
    </form>
  ),
  code: (_values, attributes) =>
    `<div role="radiogroup" aria-label="Backup schedule">
  <RadioCard label="Daily" name="backup" value="daily" defaultChecked${attributes} />
  <RadioCard label="Weekly" name="backup" value="weekly"${attributes} />
</div>`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'indicatorPlacement',
      title: 'Three densities · one material',
      caption: 'Live values. No decorative variants; every card keeps a visible non-color marker.',
      reference: () => <Sizes kind="radio" />,
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Content, metadata & independent actions',
      caption:
        'Live details and terms actions do not change selection. Start/end placement and an explicit custom marker share the same anatomy.',
      kind: 'behavior',
      render: () => <Anatomy kind="radio" />,
    },
    {
      id: 'states',
      title: 'Pointer & keyboard feedback',
      caption:
        'Appearance pins keep hover, held press, and focus visible for comparison. Inputs remain live; pins never move DOM focus.',
      kind: 'behavior',
      render: () => <Interaction kind="radio" />,
    },
    {
      id: 'availability',
      title: 'Policy & availability',
      kind: 'behavior',
      render: () => <Availability kind="radio" />,
    },
    {
      id: 'validation',
      title: 'Validation & state intersections',
      caption:
        'Check an empty selection, then correct it. One message explains the group error; selection stays legible.',
      kind: 'behavior',
      render: () => <Validation kind="radio" />,
    },
    {
      id: 'overflow',
      title: 'Long content & narrow layouts',
      kind: 'content',
      render: () => <Overflow kind="radio" />,
    },
    {
      id: 'overlay',
      title: 'Choices in a floating surface',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Static floating plate with live inputs, contextual fills, and no competing card shadow.',
      kind: 'surface',
      render: () => <Overlay kind="radio" />,
    },
  ],
});
