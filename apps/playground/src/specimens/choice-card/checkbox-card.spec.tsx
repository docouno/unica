import { CheckboxCard } from '../../prototypes/choice-card/choice-card.proto.js';
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
  id: 'checkbox-card',
  title: 'CheckboxCard',
  category: 'Forms',
  status: 'Proto',
  summary:
    'Independent options saved together. Visible checks, rich descriptions, metadata, and independent secondary actions.',
  componentName: 'CheckboxCard',
  form: 'wrap',
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
    onChange: eventProp('Reports whether the option is selected.', 'handleChange'),
  },
  render: ({ values, ctx }) => (
    <CheckboxCard
      {...values}
      {...ctx.subject}
      name="archive"
      id={ctx.id}
      label="Archive completed exports"
      description="Keep generated files together for 30 days."
      onChange={(event) => ctx.action('onChange')(event.currentTarget.checked)}
    />
  ),
  code: (_values, attributes) =>
    `<CheckboxCard
  label="Archive completed exports"
  name="archive"
  description="Keep generated files together for 30 days."${attributes}
/>`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'indicatorPlacement',
      title: 'Three densities · one material',
      caption: 'Live values. No decorative variants; every card keeps a visible non-color marker.',
      reference: () => <Sizes kind="checkbox" />,
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Content, metadata & independent actions',
      caption:
        'Live details and terms actions do not change selection. Start/end placement and an explicit custom marker share the same anatomy.',
      kind: 'behavior',
      render: () => <Anatomy kind="checkbox" />,
    },
    {
      id: 'states',
      title: 'Pointer & keyboard feedback',
      caption:
        'Appearance pins keep hover, held press, and focus visible for comparison. Inputs remain live; pins never move DOM focus.',
      kind: 'behavior',
      render: () => <Interaction kind="checkbox" />,
    },
    {
      id: 'availability',
      title: 'Policy & availability',
      kind: 'behavior',
      render: () => <Availability kind="checkbox" />,
    },
    {
      id: 'validation',
      title: 'Validation & state intersections',
      caption:
        'Check an empty selection, then correct it. One message explains the group error; selection stays legible.',
      kind: 'behavior',
      render: () => <Validation kind="checkbox" />,
    },
    {
      id: 'overflow',
      title: 'Long content & narrow layouts',
      kind: 'content',
      render: () => <Overflow kind="checkbox" />,
    },
    {
      id: 'overlay',
      title: 'Choices in a floating surface',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Static floating plate with live inputs, contextual fills, and no competing card shadow.',
      kind: 'surface',
      render: () => <Overlay kind="checkbox" />,
    },
  ],
});
