import { Textarea } from '../../prototypes/textarea/textarea.proto.js';
import {
  size,
  variant,
  status,
  width,
  disabled,
  readOnly,
  required,
  toggle,
  choice,
  eventProp,
} from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import type { ReactElement } from 'react';
import type { TextareaExampleName } from '../../prototypes/textarea/textarea.examples.js';

const { TextareaExamples } = await import('../../prototypes/textarea/textarea.examples.js');

function preview(section: TextareaExampleName): ReactElement {
  return <TextareaExamples section={section} />;
}

export default defineComponent({
  id: 'textarea',
  title: 'Textarea',
  category: 'Forms',
  status: 'Proto',
  summary:
    'Room for a thought: quiet multiline fields, stable feedback, and deliberate control over height.',
  componentName: 'Textarea',
  form: 'wrap',
  props: {
    size,
    variant,
    status,
    width,
    disabled,
    readOnly,
    required,
    resize: choice(
      'Geometry',
      'Whether the field can be resized vertically.',
      ['vertical', 'none'],
      'vertical',
    ),
    autosize: toggle('Geometry', 'Grow to fit the content.'),
    rows: {
      kind: 'number',
      group: 'Geometry',
      default: 3,
      examples: [2, 3, 5],
      description: 'Initial number of visible lines.',
    },
    onChange: eventProp('Reports the text after a native edit.', 'handleChange'),
  },
  constraints: [
    {
      kind: 'precedence',
      when: { autosize: true },
      affects: ['resize', 'rows'],
      reason: 'Autosize uses its own row limits and overrides manual resizing.',
    },
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['status'],
      reason: 'The disabled state suppresses feedback color.',
    },
  ],
  render: ({ values, ctx }) => (
    <Textarea
      {...values}
      {...ctx.subject}
      id={ctx.id}
      name="summary"
      label="Release summary"
      placeholder="What shipped?"
      defaultValue="Search now includes archived pages."
      onChange={(event) => ctx.action('onChange')(event.currentTarget.value)}
    />
  ),
  code: (_values, attributes) =>
    `<Textarea
  label="Release summary"
  name="summary"
  placeholder="What shipped?"
  defaultValue="Search now includes archived pages."${attributes}
/>`,
  matrixViews: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Roles & sizes',
      caption:
        'Default defines a form slot. Ghost keeps inline prose light, with a quiet baseline. S, M, and L share Input geometry.',
      reference: () => preview('roles'),
    },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Hover & focus',
      caption:
        'Pinned comparisons: quiet pointer editing and a full keyboard contour, with no movement or change in wrapping.',
      kind: 'behavior',
      render: () => preview('interaction'),
    },
    {
      id: 'feedback',
      title: 'Status & protected gutter',
      caption:
        'One glyph at the first line, before the native scrollbar. Its space stays reserved even without a status.',
      kind: 'behavior',
      render: () => preview('feedback'),
    },
    {
      id: 'availability',
      title: 'Reading & availability',
      caption:
        'Read-only keeps full contrast, selection, and scrolling. Disabled suppresses editing cues, status, and resizing.',
      kind: 'behavior',
      render: () => preview('availability'),
    },
    {
      id: 'height',
      title: 'Manual, fixed & growing height',
      caption:
        'One height owner: manual resizing or content growth. At the cap, the native text viewport scrolls.',
      kind: 'behavior',
      render: () => preview('height'),
    },
    {
      id: 'footer',
      title: 'Labels, guidance & counters',
      caption:
        'Guidance spans the width. Feedback and counter share the footer, wrapping cleanly in narrow spaces.',
      kind: 'behavior',
      render: () => preview('footer'),
    },
    {
      id: 'live',
      title: 'Live length & feedback transitions',
      caption:
        'Type, paste, check, and correct. This local demonstration preserves the draft and keeps the status gutter stable.',
      kind: 'behavior',
      render: () => preview('live'),
    },
    {
      id: 'overflow',
      title: 'Long content & direction',
      caption:
        'Try 360px, 120% text, and RTL. Long prose wraps; explicit log lines keep their horizontal viewport.',
      kind: 'content',
      render: () => preview('overflow'),
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      caption:
        'The same fields on real material plates. These are static surface comparisons, not open dialogs.',
      kind: 'surface',
      render: () => preview('surfaces'),
    },
  ],
});
