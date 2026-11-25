import { TagsInput } from '../../prototypes/tags-input/tags-input.proto.js';
import { size, variant, status, disabled, readOnly, eventProp } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
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
} from './tags-input.examples.js';
import { TopicFilter } from './topic-filter.js';
import filterSource from './topic-filter.tsx?raw';
import { RecipientList } from './recipient-list.js';
import recipientsSource from './recipient-list.tsx?raw';

const startingTopics = { topics: ['Design', 'Research'], empty: [] };
const messages = {
  neutral: '',
  info: 'Topics are visible to everyone with access.',
  success: 'The reviewer approved the topics.',
  warning: 'Changes to these topics need review.',
  danger: 'The reviewer requested a correction.',
};

export default defineComponent({
  id: 'tags-input',
  title: 'TagsInput',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary:
    'Edit an ordered set of free-form tags. Enter or Add accepts the draft. Rejected batches stay available for correction.',
  componentName: 'TagsInput',
  props: {
    size,
    variant,
    status,
    disabled,
    readOnly: {
      ...readOnly,
      description:
        'Project the committed values as selectable text and preserve any unadded draft separately.',
    },
    initialValues: {
      kind: 'slot',
      group: 'Content',
      publicType: 'readonly string[]',
      default: 'topics',
      description:
        'The example starts with Design and Research. Omitting initialValues starts an empty field. For controlled tags, pass values and handle onValuesChange.',
      choices: [
        { value: 'topics', label: 'Design and Research', code: "['Design', 'Research']" },
        { value: 'empty', label: 'No topics', code: '[]' },
      ],
    },
    initialDraft: {
      kind: 'string',
      group: 'Content',
      default: '',
      examples: ['', 'Field notes'],
      description:
        'Uncommitted text in the editor when the field first opens. Editing the draft does not change the accepted tags.',
    },
    maxTags: {
      kind: 'number',
      group: 'Availability',
      default: 5,
      examples: [2, 5, 10],
      description:
        'This example allows five tags. Omit maxTags for unlimited capacity. Limits round down to a minimum of zero. Lowering the limit keeps existing tags.',
    },
    onValuesChange: eventProp(
      'Receives all committed tags in order after a successful addition or removal.',
      '(values) => console.log(values)',
      '(values: readonly string[]) => void',
    ),
    onDraftChange: eventProp(
      'Receives the current uncommitted text, including the empty string after acceptance.',
      '(draft) => console.log(draft)',
      '(draft: string) => void',
    ),
  },
  constraints: [
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: ['info', 'success', 'warning', 'danger'].map((value) => ({ key: 'status', value })),
      reason: 'A disabled field suppresses status feedback and keeps its accepted values visible.',
    },
  ],
  render: withOverlaySurface(
    ({ values: { initialValues, initialDraft, ...values }, ctx }) => (
      <TagsInput
        {...values}
        {...ctx.subject}
        id={ctx.id}
        label="Topics"
        key={JSON.stringify([initialValues, initialDraft])}
        initialValues={startingTopics[initialValues]}
        initialDraft={initialDraft}
        message={messages[values.status]}
        onValuesChange={ctx.action('onValuesChange')}
        onDraftChange={ctx.action('onDraftChange')}
      />
    ),
    'border-box',
  ),
  code: ({ initialValues, maxTags, ...values }) => {
    const attrs = previewProps(values, {
      size: 'm',
      variant: 'default',
      status: 'neutral',
      disabled: false,
      readOnly: false,
      initialDraft: '',
    });
    const message =
      !values.disabled && messages[values.status]
        ? ` message={${JSON.stringify(messages[values.status])}}`
        : '';
    return `import { TagsInput } from './prototypes/tags-input/tags-input.proto.js';
import '@docouno/unica/styles.css';

export function TopicEditor() {
  return <TagsInput label="Topics" initialValues={${JSON.stringify(startingTopics[initialValues])}} maxTags={${Math.max(0, Math.floor(maxTags))}}${attrs}${message} onValuesChange={(values) => console.log(values)} onDraftChange={(draft) => console.log(draft)} />;
}`;
  },
  states: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Default and ghost by size',
      caption:
        'Compare the same two accepted topics and a five-tag limit across the three field sizes.',
    },
  ],
  cases: [
    {
      id: 'field-roles',
      title: 'Populated and empty fields',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare Research at S, M and L in a default form field and a ghost inline property. Each column ends with an empty field and its acceptance instructions. At 100% text on a fine pointer, a single row uses the 30, 40 and 48px minimum heights.',
      render: withOverlaySurface(TagsRoles, 'border-box'),
    },
    {
      id: 'shape',
      title: 'Standalone & field geometry',
      caption:
        'Compare the same values as standalone Tags and inset field tokens at S, M and L. Removing a value from either view updates both. New subjects can be added inside the field.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(TagsShape, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Anatomy, wrapping & shared rhythm',
      caption:
        'Edit the shared field and domain examples. The three pinned control groups compare each size with a collection title and a Save button.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(TagsAnatomy, 'border-box'),
    },
    {
      id: 'interaction',
      title: 'Hover, press & focus',
      caption:
        'The default and ghost comparisons pin hover, press and keyboard focus. Try the last field to move between the editor, tag removal and Add.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(TagsInteraction, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Status & clear correction',
      caption:
        'The five application statuses are pinned. Correct the invalid domain or the duplicate topic below, then add it. Accepted tags keep their ordinary appearance.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(TagsFeedback, 'border-box'),
    },
    {
      id: 'batches',
      title: 'Batch acceptance & repair',
      caption:
        'Load either recipient draft above. Correct the rejected line and choose Add. A newline separates values while spaces and commas remain part of a tag. A batch must fit in full.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      actions: [
        { id: 'rejected', label: 'Load rejected batch' },
        { id: 'valid', label: 'Load valid batch' },
      ],
      render: withOverlaySurface(TagsBatches, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Capacity, reading & availability',
      caption:
        'Remove a tag to free a place at capacity. Switch the Subjects field to read only to copy all accepted values. Returning to editing restores the separate draft.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: { readOnly: { kind: 'boolean', label: 'Read only subjects', default: false } },
      render: withOverlaySurface(TagsAvailability, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long values, drafts & direction',
      caption:
        'Long values wrap in place. Inspect the multilingual tags in either reading direction or scroll a bounded draft without moving Add.',
      kind: 'content',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(TagsOverflow, 'border-box'),
    },
    {
      id: 'drafts',
      title: 'Bounded drafts & native scroll',
      caption:
        'Compare short and two-line drafts with bounded S, M and L drafts in both field roles. Scroll the longer text while Add stays beside the last visible line.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(TagsDrafts, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      caption:
        'Compare default and ghost topics beside a collection title. The base card and floating panel each supply the material around their fields.',
      kind: 'surface',
      mode: 'live',
      reset: true,
      surface: 'overlay',
      overlayStage: true,
      render: TagsSurfaces,
    },
    {
      id: 'submission',
      title: 'Explicit acceptance & draft protection',
      caption:
        'Continue with an unadded draft to see the form request a correction. Add or clear it, then continue to inspect the submitted topics in their accepted order.',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      render: withOverlaySurface(TagsSubmission, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'topic-filter',
      title: 'Filter notes by topic',
      mode: 'live',
      reset: true,
      caption:
        'Research includes two notes. Add Design to include Type specimens, or remove every topic to see the complete list. Draft text takes effect only after acceptance.',
      render: withOverlaySurface(
        ({ ctx }) => <TopicFilter fieldProps={ctx.subject} />,
        'border-box',
      ),
      code: filterSource.replaceAll('../../prototypes/', './prototypes/'),
    },
    {
      id: 'recipient-list',
      title: 'Preview a recipient list',
      mode: 'live',
      reset: true,
      caption:
        'Add addresses one per line, then preview the list in acceptance order. An incomplete address holds the entire batch for correction. The native form reads only the accepted recipients.',
      render: withOverlaySurface(
        ({ ctx }) => <RecipientList fieldProps={ctx.subject} />,
        'border-box',
      ),
      code: recipientsSource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
