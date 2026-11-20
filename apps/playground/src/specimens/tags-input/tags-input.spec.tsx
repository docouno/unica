import { TagsInput } from '../../prototypes/tags-input/tags-input.proto.js';
import { size, variant, status, disabled, readOnly, eventProp } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
const {
  TagsAnatomy,
  TagsAvailability,
  TagsBatches,
  TagsDrafts,
  TagsFeedback,
  TagsInteraction,
  TagsOverflow,
  TagsRoles,
  TagsShape,
  TagsSubmission,
  TagsSurfaces,
} = await import('../../prototypes/tags-input/tags-input.examples.js');

const tagLimit = 5;

export default defineComponent({
  id: 'tags-input',
  title: 'TagsInput',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary:
    'Free-form values, a persistent draft, and an explicit Add action. Keep every word, including when a batch needs correction.',
  componentName: 'TagsInput',
  props: {
    size,
    variant,
    status,
    disabled,
    readOnly,
    maxTags: {
      kind: 'number',
      group: 'Value',
      default: tagLimit,
      examples: [2, tagLimit, 10],
      description: 'Maximum number of committed tags.',
    },
    onValuesChange: eventProp('Reports committed tags.', 'handleValuesChange'),
    onDraftChange: eventProp('Reports the current uncommitted text.', 'handleDraftChange'),
  },
  render: ({ values, ctx }) => (
    <TagsInput
      {...values}
      {...ctx.subject}
      id={ctx.id}
      label="Topics"
      initialValues={['Design', 'Research']}
      onValuesChange={ctx.action('onValuesChange')}
      onDraftChange={ctx.action('onDraftChange')}
    />
  ),
  code: ({ maxTags }, attributes) => {
    const defaultLimit = maxTags === tagLimit ? ` maxTags={${tagLimit}}` : '';
    return `<TagsInput label="Topics" initialValues={['Design', 'Research']}${defaultLimit}${attributes} />`;
  },
  matrixViews: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Roles & sizes',
      caption:
        'S / M / L share Input’s 30 / 40 / 48px minimum rhythm. Default frames the set; Ghost retains a quiet baseline.',
      reference: () => <TagsRoles />,
    },
  ],
  cases: [
    {
      id: 'shape',
      title: 'Standalone & field geometry',
      caption:
        'Standalone Tag keeps its capsule. Field tokens and their removal plates follow the inset-radius rule: 4px in Soft/Frost, 0px in Pixel. Values stay synchronized.',
      kind: 'behavior',
      render: () => <TagsShape />,
    },
    {
      id: 'anatomy',
      title: 'Anatomy, wrapping & shared rhythm',
      caption:
        'Tag tokens and an editor–Add tail share one field. A multiline draft opens across the field with reserved space beside its text for Add.',
      kind: 'behavior',
      render: () => <TagsAnatomy />,
    },
    {
      id: 'interaction',
      title: 'Hover, press & focus',
      caption:
        'Pinned visual comparisons, followed by a live field. The editor owns the outer keyboard contour; × and Add own local contours. No physical press travel.',
      kind: 'behavior',
      render: () => <TagsInteraction />,
    },
    {
      id: 'feedback',
      title: 'Status & clear correction',
      caption:
        'A status edge and one shaped message glyph. Accepted tags stay neutral when a draft needs correction.',
      kind: 'behavior',
      render: () => <TagsFeedback />,
    },
    {
      id: 'batches',
      title: 'Batch acceptance & repair',
      caption:
        'Newlines split batches; spaces and commas remain text. Rejection is atomic. Sample controls load a draft; the editor and validation are live.',
      kind: 'behavior',
      render: () => <TagsBatches />,
    },
    {
      id: 'availability',
      title: 'Capacity, reading & availability',
      caption:
        'A reached limit is a capacity state. Read-only projects complete, selectable values and keeps an unadded draft separate. Disabled removes mutation actions.',
      kind: 'behavior',
      render: () => <TagsAvailability />,
    },
    {
      id: 'overflow',
      title: 'Long values, drafts & direction',
      caption:
        'Complete values wrap in place at narrow widths and 120% text. Hover and focus never insert extra content.',
      kind: 'content',
      render: () => <TagsOverflow />,
    },
    {
      id: 'drafts',
      title: 'Bounded drafts & native scroll',
      caption:
        'Short and multiline drafts without a scrollbar, then bounded S / M / L in Default / Ghost. Add shares the editor rhythm; only a real native scrollbar moves it inward.',
      kind: 'behavior',
      render: () => <TagsDrafts />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      caption:
        'Actual material plates, not simulated overlay mechanics. The existing Invite & Access scene consumes this same TagsInput.',
      kind: 'surface',
      render: () => <TagsSurfaces />,
    },
    {
      id: 'submission',
      title: 'Explicit acceptance & draft protection',
      caption:
        'A local native form demonstrates the intended result. Complete library serialization, reset, and accessibility mechanisms belong to implementation.',
      kind: 'behavior',
      render: () => <TagsSubmission />,
    },
  ],
});
