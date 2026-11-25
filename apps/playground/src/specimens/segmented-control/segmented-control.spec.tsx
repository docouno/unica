import { useId } from 'react';
import { SegmentedControl, Stack, Text } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { size, disabled, readOnly, choice, required, eventProp } from '../control-props.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { periods, layouts, glyphLayouts, catalogCode } from './segmented-control.options.js';
import {
  LiveExample,
  SizeExamples,
  LayoutExamples,
  StateExamples,
  AvailabilityExamples,
  FieldExample,
  OverflowExamples,
  OverlayExample,
} from './segmented-control.examples.js';
import { ViewToolbar } from './view-toolbar.js';
import toolbarSource from './view-toolbar.tsx?raw';

const catalogs = { periods, layouts, glyphLayouts };
const reviewMessage = 'Review this preference before continuing.';

export default defineComponent({
  id: 'segmented-control',
  title: 'SegmentedControl',
  category: 'Selection & Pickers',
  status: 'UI',
  summary: 'Choose one value from a compact group of short options.',
  componentName: 'SegmentedControl',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    orientation: choice(
      'Geometry',
      'Direction of the options.',
      ['horizontal', 'vertical'],
      'horizontal',
    ),
    width: choice('Geometry', 'Size to the options or fill the slot.', ['auto', 'full'], 'auto'),
    required,
    status: choice(
      'Semantics',
      'Validation feedback for the group.',
      ['neutral', 'danger'],
      'neutral',
    ),
    defaultValue: {
      kind: 'slot',
      group: 'Interaction',
      publicType: 'string | null',
      description:
        'Initial selection restored by Reset. Omitting the value selects the first available option. Pass null to start unanswered.',
      choices: [
        { value: 'implicit', label: 'First available', omit: true },
        { value: 'empty', label: 'No selection', code: 'null' },
      ],
      default: 'implicit',
    },
    name: {
      kind: 'string',
      group: 'Host',
      description: 'Form data key. An empty name omits the field from FormData.',
      default: 'preference',
      examples: ['preference', ''],
    },
    items: {
      kind: 'slot',
      group: 'Content',
      publicType: 'readonly SegmentedControlOption[]',
      description:
        'Options supply stable values and accessible text labels. Each icon-only option also supplies its glyph.',
      choices: [
        { value: 'periods', label: 'Periods', code: 'periods' },
        { value: 'layouts', label: 'Layouts with icons', code: 'layouts' },
        { value: 'glyphLayouts', label: 'Icon-only layouts', code: 'glyphLayouts' },
      ],
      default: 'periods',
    },
    onValueChange: eventProp(
      'Receives the value of the requested option. A controlled owner decides whether to accept it.',
      '(value) => console.log(value)',
      '(value: string) => void',
    ),
  },
  constraints: [
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: ['required', 'readOnly', { key: 'status', value: 'danger' }],
      reason:
        'A disabled group is unavailable for input and excluded from validation and submission.',
    },
    {
      kind: 'ignored',
      when: { readOnly: true },
      affects: ['required'],
      reason:
        'A read-only group preserves its value and allows focus. It cannot require a new choice.',
    },
  ],
  render: withOverlaySurface(function SegmentPreview({
    values: { items, defaultValue, ...values },
    ctx,
  }) {
    const messageId = useId();
    const invalid = values.status === 'danger' && !values.disabled;
    return (
      <form {...ctx.form}>
        <Stack gap={8}>
          <SegmentedControl
            {...values}
            {...ctx.subject}
            key={`${items}-${defaultValue}`}
            aria-label="View preference"
            aria-describedby={invalid ? messageId : undefined}
            items={catalogs[items]}
            defaultValue={defaultValue === 'empty' ? null : undefined}
            onValueChange={ctx.action('onValueChange')}
          />
          {invalid && (
            <Text id={messageId} size="caption-l" color="danger">
              <bdi>{reviewMessage}</bdi>
            </Text>
          )}
        </Stack>
      </form>
    );
  }, 'border-box'),
  code: ({ items, defaultValue, ...values }) => {
    const attrs = previewProps(values, {
      size: 'm',
      disabled: false,
      readOnly: false,
      orientation: 'horizontal',
      width: 'auto',
      required: false,
      status: 'neutral',
    });
    const invalid = values.status === 'danger' && !values.disabled;
    const catalog = catalogCode(items);
    return `${invalid ? "import { useId } from 'react';\n" : ''}import { SegmentedControl${invalid ? ', Text' : ''} } from '@docouno/unica';
${catalog.imports}import '@docouno/unica/styles.css';

export function ViewPreference() {
  ${invalid ? 'const messageId = useId();\n  ' : ''}return (
    <form onSubmit={(event) => event.preventDefault()}>
      <SegmentedControl aria-label="View preference" items={${catalog.items}}${defaultValue === 'empty' ? ' defaultValue={null}' : ''}${attrs}${invalid ? ' aria-describedby={messageId}' : ''} onValueChange={(value) => console.log(value)} />
      ${invalid ? `<Text id={messageId} size="caption-l" color="danger"><bdi>${reviewMessage}</bdi></Text>` : ''}
    </form>
  );
}`;
  },
  states: [
    {
      id: 'sizes',
      rows: 'size',
      title: 'Three sizes',
      caption: 'Compare the text rail at small, medium and large sizes.',
    },
    {
      id: 'layout',
      rows: 'orientation',
      cols: 'width',
      title: 'Width and orientation',
      caption:
        'Compare a rail fitted to the labels with one that fills the available width in each orientation.',
    },
  ],
  cases: [
    {
      id: 'density',
      title: 'Text and icon-only choices',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Each size pairs a text rail with named icon-only options. At 100% text with a fine pointer, the base rail heights are 30, 40 and 48px. Touch targets can increase the height.',
      render: withOverlaySurface(SizeExamples, 'border-box'),
    },
    {
      id: 'layouts',
      title: 'Full width, short labels and a column',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'On a wide rail, the three color modes have equal widths. Compare five short intervals on a compact rail and three densities in a fitted column.',
      render: withOverlaySurface(LayoutExamples, 'border-box'),
    },
    {
      id: 'live',
      title: 'Choose a value',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Choose the day, week or month containing September 16, 2026. In the second group, List and Grid immediately rearrange the same three documents.',
      render: withOverlaySurface(LiveExample, 'border-box'),
    },
    {
      id: 'states',
      title: 'Interaction states',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Hold a pointer on the first rail, then release inside or outside the option. In the second rail, Tab to Week and use the arrows to move focus while the owner keeps Week selected.',
      render: withOverlaySurface(StateExamples, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Availability and retained choice',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Year is unavailable in the first group. The second retains a disabled Week until you choose another option. The disabled group is skipped by Tab. The read-only group allows keyboard inspection.',
      render: withOverlaySurface(AvailabilityExamples, 'border-box'),
    },
    {
      id: 'field',
      title: 'Empty answer and validation',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Save an unanswered frequency to focus the group and see its error. Choose a frequency and save to confirm the submitted value. Reset restores the empty answer.',
      render: withOverlaySurface(FieldExample, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Narrow width and translation',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'The two German rails have up to 280px. Arrow through the horizontal choices to reveal their labels, then compare the vertical arrangement and the unequal English labels below.',
      render: withOverlaySurface(OverflowExamples, 'border-box'),
    },
    {
      id: 'overlay',
      title: 'View options on a floating surface',
      kind: 'surface',
      surface: 'overlay',
      overlayStage: true,
      mode: 'live',
      reset: true,
      caption:
        'Choose a layout and a density independently. Both rails share a surface. Switch between Base and Overlay to compare their materials.',
      render: OverlayExample,
    },
  ],
  compositions: [
    {
      id: 'alignment',
      title: 'Alongside other controls',
      mode: 'live',
      reset: true,
      caption:
        'Each row pairs controls of the same size and aligns their centers. Choose List or Grid and search the document titles. Apply shows the matching documents in that row. An empty search includes all three.',
      render: withOverlaySurface(
        ({ ctx }) => <ViewToolbar controlProps={ctx.subject} />,
        'border-box',
      ),
      code: toolbarSource,
    },
  ],
});
