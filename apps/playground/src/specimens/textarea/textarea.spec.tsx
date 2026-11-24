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
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps } from '../preview-code.js';
import type { ReactElement } from 'react';
import type { TextareaProps } from '@docouno/unica';
import {
  LabeledTextarea,
  TextareaAvailability,
  TextareaFeedback,
  TextareaFooter,
  TextareaHeights,
  TextareaInteraction,
  TextareaLive,
  TextareaOverflow,
  TextareaRoles,
  TextareaSurfaces,
} from './textarea.examples.js';
import { ReviewNote } from './review-note.js';
import reviewSource from './review-note.tsx?raw';
import { ExportLog } from './export-log.js';
import logSource from './export-log.tsx?raw';
import { textareaFeedback } from './textarea.feedback.js';
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

function nativeColumns(input: number): number {
  const columns = Math.floor(input);
  return Number.isSafeInteger(columns) && columns > 0 ? columns : 20;
}
export default defineComponent({
  id: 'textarea',
  title: 'Textarea',
  category: 'Forms',
  status: 'UI',
  summary: 'Native multiline editing with manual, fixed, and content-sized height.',
  componentName: 'Textarea',
  form: 'owned',
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
    wrap: {
      ...choice(
        'Content',
        'Native wrapping mode. The inspector offers three common HTML values.',
        ['soft', 'hard', 'off'],
        'soft',
      ),
      publicType: 'string',
    },
    cols: {
      kind: 'number',
      group: 'Geometry',
      default: 20,
      examples: [12, 20, 40],
      description:
        'Native column hint for hard wrapping. This example uses whole columns and falls back to 20 for an invalid count.',
    },
    name: {
      kind: 'string',
      group: 'Host',
      default: 'summary',
      description: 'Name used for the native form entry.',
    },
    useValue: { ...toggle('Interaction', 'The example updates a controlled value.'), demo: true },
    useDefaultValue: {
      ...toggle('Interaction', 'Pass an initial value to the native control.', true),
      demo: true,
    },
    draft: {
      kind: 'string',
      group: 'Interaction',
      demo: true,
      default: initialDraft,
      examples: ['', initialDraft],
      description:
        'Updates value in controlled mode. An uncontrolled default applies when the field mounts.',
    },
    onChange: eventProp(
      'Receives the native textarea’s React change event. The log displays its text.',
      '(event) => console.log(event.currentTarget.value)',
      'ChangeEventHandler<HTMLTextAreaElement>',
    ),
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
  render: withOverlaySurface(
    ({ values: { useValue, useDefaultValue, draft, rowCap, ...values }, ctx }) => {
      const props = {
        ...values,
        cols: nativeColumns(values.cols),
        ...ctx.subject,
        id: ctx.id,
        label: exampleLabel,
        placeholder: 'What shipped?',
        maxRows: rowCap > 0 ? rowCap : undefined,
      };
      const onEdit = ctx.action('onChange');
      return (
        <form {...ctx.form} className="textarea-demo-form">
          {useValue ? (
            <ControlledPreview initial={draft} onEdit={onEdit} {...props} />
          ) : (
            <LabeledTextarea
              key={useDefaultValue ? 'default' : 'native'}
              {...props}
              defaultValue={useDefaultValue ? draft : undefined}
              onChange={(event) => onEdit(event.currentTarget.value)}
            />
          )}
        </form>
      );
    },
    'border-box',
  ),
  code: ({ useValue, useDefaultValue, draft, rowCap, ...values }) => {
    const attributes = previewProps(
      { ...values, cols: nativeColumns(values.cols) },
      {
        size: 'm',
        variant: 'default',
        status: 'neutral',
        width: 'full',
        disabled: false,
        readOnly: false,
        required: false,
        resize: 'vertical',
        autosize: false,
        rows: 3,
        minRows: 3,
        wrap: 'soft',
        ...(values.wrap === 'hard' ? {} : { cols: 20 }),
      },
    );
    const initial = JSON.stringify(draft);
    const value = useValue ? ' value={value}' : useDefaultValue ? ` defaultValue={${initial}}` : '';
    const feedback =
      values.wrap === 'off' && values.status !== 'neutral' && !values.disabled
        ? textareaFeedback[values.status]
        : undefined;
    const mark =
      values.required && !values.disabled
        ? ' <Text as="span" color="danger" aria-hidden="true">*</Text>'
        : '';
    const note = feedback
      ? `
        <Flex id={id + '-message'} gap={8} align="start">
          <Icon icon={${feedback.name}} size="s" color="${values.status}" />
          <Text size="caption-l" color="${values.status}"><bdi>${feedback.label}</bdi></Text>
        </Flex>`
      : '';
    return `import { useId${useValue ? ', useState' : ''} } from 'react';
import { ${feedback ? 'Flex, Icon, ' : ''}Stack, Text, Textarea } from '@docouno/unica';
${feedback ? 'import { ' + feedback.name + " } from '@phosphor-icons/react';\n" : ''}import '@docouno/unica/styles.css';

export function ReleaseSummary() {
  const id = useId();${useValue ? `\n  const [value, setValue] = useState(${initial});` : ''}
  return (
    <form>
      <Stack gap={8}${values.width === 'auto' ? " style={{ inlineSize: 'min(100%, 28rem)' }}" : ''}>
        <Text as="label" htmlFor={id} size="body-s" weight="medium">${exampleLabel}${mark}</Text>
        <Textarea id={id} dir="auto" placeholder="What shipped?"${attributes}${rowCap > 0 ? ` maxRows={${rowCap}}` : ''}${feedback ? ' aria-describedby={id + "-message"}' : ''}${value} onChange={(event) => ${useValue ? '{ setValue(event.currentTarget.value); console.log(event.currentTarget.value); }' : 'console.log(event.currentTarget.value)'}} />${note}
      </Stack>
    </form>
  );
}`;
  },
  states: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      fixed: { rows: 2 },
      title: 'Density and field role',
      caption:
        'Compare the framed form field and inline ghost field at three sizes. Each editor starts with the same two-row draft.',
    },
    {
      id: 'height-status',
      rows: 'status',
      cols: 'autosize',
      fixed: {
        draft: 'First point.\nSecond point.\nA final thought.\nOne more detail.',
        rowCap: 5,
      },
      title: 'Status and height',
      caption:
        'Four lines of text reveal the difference between a fixed initial viewport and an editor that grows up to five rows. Status keeps a gutter beside the first line.',
    },
  ],
  cases: [
    {
      id: 'size-pairs',
      title: 'Empty and filled editors at each density',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compact and spacious fields start empty. Both medium fields contain a short note. Compare their placeholder and baseline on each two-row surface.',
      render: withOverlaySurface(TextareaRoles, 'border-box'),
    },
    {
      id: 'interaction',
      title: 'Pointer and keyboard focus',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Click either field, then use Tab to compare pointer and keyboard outlines while editing.',
      render: withOverlaySurface(TextareaInteraction, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Status and protected gutter',
      kind: 'behavior',
      mode: 'pinned',
      reset: true,
      caption:
        'Status and messages are pinned for comparison. Each editor reserves the first-line gutter for one glyph beside the native scrollbar.',
      render: withOverlaySurface(TextareaFeedback, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Reading and availability',
      kind: 'behavior',
      mode: 'live',
      caption:
        'Read-only notes allow selection, scrolling and resizing. Disabled notes skip focus, suppress the status glyph and keep their size.',
      render: withOverlaySurface(TextareaAvailability, 'border-box'),
    },
    {
      id: 'height',
      title: 'Manual, fixed and growing height',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Drag the manual editor or paste into the growing fields. Capped examples grow from two to five rows and then scroll locally. Without content sizing they keep their minimum height.',
      render: withOverlaySurface(TextareaHeights, 'border-box'),
    },
    {
      id: 'footer',
      title: 'Guidance and counters',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Edit a word-counted note and a character-counted summary. Guidance spans the width while the count shares the feedback row when there is room.',
      render: withOverlaySurface(TextareaFooter, 'border-box'),
    },
    {
      id: 'live',
      title: 'Length and feedback transitions',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: { busy: { kind: 'boolean', label: 'Show saving state', default: false } },
      actions: [{ id: 'load-long', label: 'Load long draft' }],
      caption:
        'Compare 160 user-perceived characters with a native maximum of 80 UTF-16 units. Load a long draft to edit it down. While saving is pinned, the note stays editable.',
      render: withOverlaySurface(TextareaLive, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long content and writing direction',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare wrapped prose, technical logs, a long token and a right-to-left note. Edit the text to update its word or line count.',
      render: withOverlaySurface(TextareaOverflow, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'Fields on base and overlay',
      kind: 'surface',
      mode: 'live',
      reset: true,
      compareSurfaces: true,
      caption:
        'Edit the summary or its inline note on either material. Each surface keeps its own text.',
      render: TextareaSurfaces,
    },
  ],
  compositions: [
    {
      id: 'form',
      title: 'Review note in a native form',
      mode: 'live',
      reset: true,
      caption:
        'Check a draft, correct an empty or overlong note, then submit its actual text. Reset restores the opening note.',
      render: withOverlaySurface(
        ({ ctx }) => <ReviewNote fieldProps={ctx.subject} />,
        'border-box',
      ),
      code: reviewSource,
    },
    {
      id: 'logs',
      title: 'Unwrapped export log',
      mode: 'live',
      reset: true,
      caption:
        'Read or annotate a long export line. The text viewport scrolls horizontally while the associated status stays below it.',
      render: withOverlaySurface(({ ctx }) => <ExportLog fieldProps={ctx.subject} />, 'border-box'),
      code: logSource,
    },
  ],
});
