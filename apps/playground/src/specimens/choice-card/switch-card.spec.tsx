import { SwitchCard } from '../../prototypes/choice-card/choice-card.proto.js';
import { size, disabled, readOnly, loading, choice, eventProp } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import {
  Anatomy,
  SharedAnatomy,
  Availability,
  Interaction,
  Overflow,
  Overlay,
  Sizes,
  SwitchPending,
  SwitchRequest,
} from '../../prototypes/choice-card/choice-card.examples.js';

export default defineComponent({
  id: 'switch-card',
  title: 'SwitchCard',
  category: 'Forms',
  status: 'Proto',
  summary:
    'Immediate settings with stable labels. Trailing switches, pending committed values, and local success or failure feedback.',
  componentName: 'SwitchCard',
  form: 'wrap',
  props: {
    size,
    disabled,
    readOnly,
    loading,
    indicatorPlacement: choice(
      'Geometry',
      'Which edge displays the indicator.',
      ['start', 'end', 'none'],
      'end',
    ),
    onChange: eventProp('Reports whether summaries are enabled.', 'handleChange'),
  },
  render: ({ values, ctx }) => (
    <SwitchCard
      {...values}
      {...ctx.subject}
      id={ctx.id}
      name="summaries"
      label="Release summaries"
      description="Send a digest after each release."
      onChange={(event) => ctx.action('onChange')(event.currentTarget.checked)}
    />
  ),
  code: (_values, attributes) =>
    `<SwitchCard label="Release summaries" name="summaries" description="Send a digest after each release."${attributes} />`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'indicatorPlacement',
      title: 'Three densities · one material',
      caption: 'Live values. No decorative variants; every card keeps a visible non-color marker.',
      reference: () => <Sizes kind="switch" />,
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Content, metadata & independent actions',
      caption:
        'Live details and terms actions do not change selection. Start/end placement and an explicit custom marker share the same anatomy.',
      kind: 'behavior',
      render: () => <Anatomy kind="switch" />,
    },
    {
      id: 'states',
      title: 'Pointer & keyboard feedback',
      caption:
        'Appearance pins keep hover, held press, and focus visible for comparison. Inputs remain live; pins never move DOM focus.',
      kind: 'behavior',
      render: () => <Interaction kind="switch" />,
    },
    {
      id: 'availability',
      title: 'Policy & availability',
      kind: 'behavior',
      render: () => <Availability kind="switch" />,
    },
    {
      id: 'pending',
      title: 'Pending at every size',
      caption:
        'Pinned pending values. The spinner replaces the thumb glyph; the last committed value stays visible.',
      kind: 'behavior',
      render: () => <SwitchPending />,
    },
    {
      id: 'request',
      title: 'Apply immediately · success, failure & retry',
      caption:
        'Live local request preview. Succeed and Fail explicitly resolve the pending change.',
      kind: 'behavior',
      render: () => <SwitchRequest />,
    },
    {
      id: 'overflow',
      title: 'Long content & narrow layouts',
      kind: 'content',
      render: () => <Overflow kind="switch" />,
    },
    {
      id: 'overlay',
      title: 'Choices in a floating surface',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Static floating plate with live inputs, contextual fills, and no competing card shadow.',
      kind: 'surface',
      render: () => <Overlay kind="switch" />,
    },
  ],
  usage: [
    {
      id: 'shared',
      title: 'Shared anatomy across families',
      caption:
        'Radio alternatives and immediate settings share title and description metrics at every density.',
      code: `<>
  <RadioCard size="m" label="Workspace access" defaultChecked />
  <SwitchCard size="m" label="Activity notifications" defaultChecked />
</>`,
      render: () => <SharedAnatomy />,
    },
  ],
});
