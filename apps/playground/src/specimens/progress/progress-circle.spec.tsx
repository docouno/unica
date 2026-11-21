import { ProgressCircle } from '@docouno/unica';
import { previewProps } from '../preview-code.js';
import { defineComponent } from '../../workbench/types.js';
import { activityNameReference, labelledByText, withActivityNameCode } from './activity-name.js';
import Study from './progress-circle.examples.js';

export default defineComponent({
  id: 'progress-circle',
  title: 'ProgressCircle',
  category: 'Feedback & Status',
  status: 'UI',
  summary:
    'The Spinner silhouette adapted to a measured amount. The same small icon slot, with no new visual pattern.',
  componentName: 'ProgressCircle',
  props: {
    size: {
      kind: 'enum',
      group: 'Appearance',
      default: 'inherit',
      description: 'Diameter of the activity glyph.',
      choices: [{ value: 'inherit' }, { value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    tone: {
      kind: 'enum',
      group: 'Appearance',
      default: 'inherit',
      description: 'Foreground color inherited or chosen for the activity.',
      choices: [
        { value: 'inherit' },
        { value: 'neutral' },
        { value: 'muted' },
        { value: 'accent' },
      ],
    },
    value: {
      kind: 'number',
      group: 'Measurement',
      default: 45,
      description: 'Measured completion for a known phase.',
      examples: [0, 45, 100],
    },
    max: {
      kind: 'number',
      group: 'Measurement',
      default: 100,
      examples: [80, 100],
      description: 'Positive total in the same units as the value.',
    },
    determinate: {
      kind: 'boolean',
      group: 'Measurement',
      default: true,
      description: 'Turn off while the operation has no measured total.',
      demo: true,
    },
    'aria-label': {
      kind: 'string',
      group: 'Semantics',
      label: 'Accessible name',
      default: 'Uploading assets',
      description: 'Text that names the operation.',
    },
    labelledByText,
    'aria-valuetext': {
      kind: 'string',
      group: 'Semantics',
      label: 'Accessible value text',
      default: '',
      description: 'Describe the measured amount in its original units.',
    },
  },
  constraints: [
    {
      kind: 'forbidden',
      when: { labelledByText: '' },
      affects: [{ key: 'aria-label', value: '' }],
      reason: 'Give the operation a name or a referenced label.',
    },
    {
      kind: 'ignored',
      when: { determinate: false },
      affects: ['value', 'max', 'aria-valuetext'],
      reason: 'An indeterminate phase has no measured amount.',
    },
  ],
  render: ({ ctx, values: { determinate, value, labelledByText, ...props } }) => {
    const id = `${ctx.id}-operation`;
    const reference = activityNameReference(id, labelledByText);
    if (!reference && !props['aria-label'].trim()) {
      return <span>Give the operation a name.</span>;
    }
    return (
      <>
        {reference}
        <ProgressCircle
          {...ctx.subject}
          {...props}
          value={determinate ? value : null}
          aria-labelledby={reference ? id : undefined}
        />
      </>
    );
  },
  code: ({ determinate, value, labelledByText, ...props }) => {
    const label = labelledByText.trim() ? ' aria-labelledby="operation-label"' : '';
    if (!label && !props['aria-label'].trim()) {
      return '';
    }
    const attributes = previewProps(props, {
      size: 'inherit',
      tone: 'inherit',
      max: 100,
      'aria-valuetext': '',
    });
    return withActivityNameCode(
      `<ProgressCircle value={${determinate ? value : 'null'}}${attributes}${label} />`,
      labelledByText,
    );
  },
  matrixViews: [
    {
      id: 'scale',
      rows: 'size',
      cols: 'value',
      title: 'Spinner → measured amount · one silhouette',
      reference: () => <Study section="scale" />,
    },
  ],
  cases: [
    {
      id: 'boundaries',
      title: 'From empty to full',
      kind: 'content',
      render: () => <Study section="boundaries" />,
    },
    {
      id: 'handoff',
      mode: 'live',
      title: 'From waiting to measured work',
      kind: 'behavior',
      render: () => <Study section="handoff" />,
    },
    {
      id: 'overlay',
      title: 'Compact work on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => <Study section="overlay" />,
    },
  ],
  usage: [
    {
      id: 'context',
      code: `<div>
  <ProgressCircle value={elapsed} max={total} aria-label="Upload progress" />
  <span>Uploading assets</span>
</div>`,
      title: 'File transfers & pipeline stages',
      render: () => <Study section="context" />,
    },
  ],
});
