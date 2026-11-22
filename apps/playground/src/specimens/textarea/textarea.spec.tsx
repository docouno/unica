import { useState } from 'react';
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
import type { PreviewContext } from '../../workbench/types.js';
import type { ReactElement } from 'react';
import type { TextareaProps } from '@docouno/unica';
import { LabeledTextarea, TextareaExamples } from './textarea.examples.js';
import { textareaFeedback } from './textarea.feedback.js';
import type { TextareaExampleName } from './textarea.examples.js';

function preview(section: TextareaExampleName) {
  return function Example({ ctx }: { readonly ctx: PreviewContext }): ReactElement {
    return <TextareaExamples section={section} subject={ctx.subject} />;
  };
}

function ControlledPreview({
  initial,
  onEdit,
  ...props
}: Omit<TextareaProps, 'value' | 'defaultValue'> & {
  readonly label: string;
  readonly initial: string;
  readonly onEdit: (draft: string) => void;
}): ReactElement {
  const [draft, setDraft] = useState(() => ({ initial, value: initial }));
  const value = draft.initial === initial ? draft.value : initial;
  if (draft.initial !== initial) {
    setDraft({ initial, value });
  }
  return (
    <LabeledTextarea
      {...props}
      value={value}
      onChange={(event) => {
        const draft = event.currentTarget.value;
        setDraft({ initial, value: draft });
        onEdit(draft);
      }}
    />
  );
}

const initialDraft = 'Search now includes archived pages.';
const exampleLabel = 'Release summary';
export default defineComponent({
  id: 'textarea',
  title: 'Textarea',
  category: 'Forms',
  status: 'UI',
  summary: 'Native multiline editing with manual, fixed, and content-sized height.',
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
    minRows: {
      kind: 'number',
      group: 'Geometry',
      default: 3,
      examples: [1, 3, 5],
      description: 'Minimum visible rows with autosize.',
    },
    rowCap: {
      kind: 'number',
      group: 'Geometry',
      label: 'Max rows',
      demo: true,
      default: 0,
      examples: [0, 4, 6],
      description: 'Maximum rows with autosize. Zero leaves the height uncapped.',
    },
    wrap: choice(
      'Field',
      'Whether long lines wrap visually and in submitted text.',
      ['soft', 'hard', 'off'],
      'soft',
    ),
    cols: {
      kind: 'number',
      group: 'Field',
      default: 20,
      examples: [12, 20, 40],
      description: 'Native column hint for wrapping on submission with wrap="hard".',
    },
    name: {
      kind: 'string',
      group: 'Form',
      demo: true,
      default: 'summary',
      description: 'Name used for the native form entry.',
    },
    useValue: { ...toggle('Form', 'The example updates a controlled value.'), demo: true },
    useDefaultValue: {
      ...toggle('Form', 'Pass an initial value to the native control.', true),
      demo: true,
    },
    draft: {
      kind: 'string',
      group: 'Form',
      demo: true,
      default: initialDraft,
      examples: ['', initialDraft],
      description:
        'Updates value in controlled mode. An uncontrolled default applies when the field mounts.',
    },
    onChange: eventProp('Reports the text after a native edit.', 'handleChange'),
  },
  constraints: [
    {
      kind: 'forbidden',
      when: { useValue: true, useDefaultValue: true },
      affects: ['useDefaultValue'],
      reason: 'Use either value or defaultValue for one instance.',
    },
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
      reason: 'The disabled state suppresses feedback color and resizing.',
    },
  ],
  render({ values: { useValue, useDefaultValue, draft, rowCap, ...values }, ctx }) {
    const props = {
      ...values,
      ...ctx.subject,
      id: ctx.id,
      label: exampleLabel,
      placeholder: 'What shipped?',
      maxRows: rowCap > 0 ? rowCap : undefined,
    };
    const onEdit = ctx.action('onChange');
    return useValue ? (
      <ControlledPreview initial={draft} onEdit={onEdit} {...props} />
    ) : (
      <LabeledTextarea
        key={useDefaultValue ? 'default' : 'native'}
        {...props}
        defaultValue={useDefaultValue ? draft : undefined}
        onChange={(event) => onEdit(event.currentTarget.value)}
      />
    );
  },
  code(values, attributes) {
    const { useValue, useDefaultValue, draft, rowCap, name, wrap, status, disabled, required } =
      values;
    const value = useValue
      ? ' value={value}'
      : useDefaultValue
        ? ` defaultValue={${JSON.stringify(draft)}}`
        : '';
    const cap = rowCap > 0 ? ` maxRows={${rowCap}}` : '';
    const feedback =
      wrap === 'off' && status !== 'neutral' && !disabled ? textareaFeedback[status] : undefined;
    const label = required ? `${exampleLabel} <span aria-hidden="true">*</span>` : exampleLabel;
    const handler = useValue
      ? 'onChange={(event) => setValue(event.currentTarget.value)}'
      : 'onChange={handleChange}';
    const example = `<>
  <label htmlFor="summary">${label}</label>
  <Textarea
    id="summary"
    name={${JSON.stringify(name)}}
    placeholder="What shipped?"${value}${cap}${attributes.replace('onChange={handleChange}', handler)}${feedback ? '\n    aria-describedby="summary-feedback"' : ''}
  />${feedback ? `\n  <p id="summary-feedback"><${feedback.name} aria-hidden="true" /> ${feedback.label}</p>` : ''}
</>`;
    return useValue
      ? `function ReleaseSummary() {
  const [value, setValue] = useState(${JSON.stringify(draft)});
  return (${example});
}`
      : example;
  },
  matrixViews: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Roles & sizes',
      caption:
        'Default defines a form slot. Ghost keeps inline prose light, with a quiet baseline. S, M, and L share Input geometry.',
      reference: preview('roles'),
    },
    {
      id: 'height-status',
      rows: 'status',
      cols: 'autosize',
      title: 'Status & height',
      fixed: {
        draft: 'First point.\nSecond point.\nA final thought.\nOne more detail.',
        rowCap: 5,
      },
    },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Hover & focus',
      caption:
        'Click either field, then use Tab to compare the quiet pointer edge and the full keyboard contour.',
      kind: 'behavior',
      render: preview('interaction'),
    },
    {
      id: 'feedback',
      title: 'Status & protected gutter',
      caption:
        'One glyph at the first line, before the native scrollbar. Its space stays reserved even without a status.',
      kind: 'behavior',
      render: preview('feedback'),
    },
    {
      id: 'availability',
      title: 'Reading & availability',
      caption:
        'Read-only keeps full contrast, selection, and scrolling. Disabled suppresses editing cues, status, and resizing.',
      kind: 'behavior',
      render: preview('availability'),
    },
    {
      id: 'height',
      title: 'Manual, fixed & growing height',
      caption:
        'One height owner: manual resizing or content growth. At the cap, the native text viewport scrolls.',
      kind: 'behavior',
      render: preview('height'),
    },
    {
      id: 'footer',
      title: 'Labels, guidance & counters',
      caption:
        'Guidance spans the width. Feedback and counter share the footer, wrapping cleanly in narrow spaces.',
      kind: 'behavior',
      render: preview('footer'),
    },
    {
      id: 'live',
      title: 'Live length & feedback transitions',
      caption:
        'Type, paste, check, and correct. This local demonstration preserves the draft and keeps the status gutter stable.',
      kind: 'behavior',
      render: preview('live'),
    },
    {
      id: 'overflow',
      title: 'Long content & direction',
      caption:
        'Try 360px, 120% text, and RTL. Long prose wraps; explicit log lines keep their horizontal viewport.',
      kind: 'content',
      render: preview('overflow'),
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      caption:
        'The same fields on real material plates. Compare the framed and inline roles on both surface materials.',
      kind: 'surface',
      render: preview('surfaces'),
    },
  ],
  usage: [
    {
      id: 'form',
      title: 'Draft in a native form',
      caption: 'Check and correct feedback, submit the edited draft, and reset it.',
      render: preview('live'),
    },
    {
      id: 'logs',
      title: 'Unwrapped logs',
      caption: 'Keep long lines intact and associate the external feedback with the editor.',
      render: preview('overflow'),
    },
  ],
});
