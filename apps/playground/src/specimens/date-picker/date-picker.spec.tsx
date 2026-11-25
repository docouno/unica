import {
  size,
  variant,
  status,
  required,
  disabled,
  readOnly,
  clearable,
  loading,
  eventProp,
} from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { DatePicker } from '../../prototypes/date-picker/date-picker.proto.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps, previewText } from '../preview-code.js';
import { Anatomy, FieldStates, Panels, Locales, LivePickers } from './date-picker.examples.js';
import { ReviewSchedule } from './review-schedule.js';
import scheduleSource from './review-schedule.tsx?raw';
import './date-picker-matrix.css';

const reviewDate = '2026-09-16';
const messages = {
  neutral: '',
  info: 'Review dates use the local calendar.',
  success: 'The review date is confirmed.',
  warning: 'Check this date with the review owner.',
  danger: 'Choose a different review date.',
};

export default defineComponent({
  id: 'date-picker',
  title: 'DatePicker',
  category: 'Selection & Pickers',
  status: 'Proto',
  componentName: 'DatePicker',
  summary:
    'Type a local date, paste an ISO date or choose a day from the calendar. Keep an invalid draft available for correction.',
  props: {
    variant,
    size,
    locale: {
      kind: 'enum',
      group: 'Content',
      description: 'Locale used for numeric input and calendar labels.',
      default: 'en-GB',
      publicType: 'string',
      choices: [
        { value: 'en-GB', label: 'English (UK)' },
        { value: 'en-US', label: 'English (US)' },
        { value: 'de-DE', label: 'German' },
      ],
    },
    clearable,
    required,
    readOnly: { ...readOnly, description: 'Inspect the calendar while keeping the accepted date.' },
    disabled,
    status: {
      ...status,
      description: 'Set a fixed feedback message. Local date validation takes precedence.',
    },
    loading,
    onValueChange: eventProp(
      'Receives the accepted ISO date, or an empty string when cleared.',
      '(date) => console.log(date)',
      '(value: string) => void',
    ),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['status', 'loading'],
      reason: 'A disabled field suppresses its status and loading indicators.',
    },
    {
      kind: 'ignored',
      when: { readOnly: true },
      affects: ['clearable'],
      reason: 'A read-only field keeps its current value and hides the clear action.',
    },
  ],
  render: withOverlaySurface(({ ctx, values }) => {
    const message = !values.disabled && messages[values.status];
    return (
      <DatePicker
        {...values}
        data-date-picker-comparison=""
        style={{ inlineSize: 'min(100%, 22rem)' }}
        subjectAttributes={ctx.subject}
        label={values.variant === 'ghost' ? 'Inline review date' : 'Review date'}
        defaultValue={reviewDate}
        message={message ? <bdi>{message}</bdi> : undefined}
        onValueChange={ctx.action('onValueChange')}
      />
    );
  }, 'border-box'),
  code: (values) => {
    const attrs = previewProps(values, {
      size: 'm',
      variant: 'default',
      status: 'neutral',
      locale: 'en-GB',
      clearable: false,
      required: false,
      readOnly: false,
      disabled: false,
      loading: false,
    });
    const message = !values.disabled && messages[values.status];
    return `import { DatePicker } from './prototypes/date-picker/date-picker.proto.js';
import '@docouno/unica/styles.css';

export function ReviewDate() {
  return <DatePicker label="${values.variant === 'ghost' ? 'Inline review date' : 'Review date'}" defaultValue="${reviewDate}"${attrs}${message ? ` message={<bdi>${previewText(message)}</bdi>}` : ''} onValueChange={(date) => console.log(date)} />;
}`;
  },
  states: [
    {
      id: 'fields',
      title: 'Field roles and sizes',
      caption:
        'Compare form and inline fields at each density. Type a local date or paste an ISO date, then leave the field to format it.',
      rows: 'size',
      cols: 'variant',
      fixed: { clearable: true },
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Date and calendar',
      surface: 'base',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      reset: true,
      caption:
        'The base field starts on September 16 with its calendar in document flow. Select a day to update the date and close the panel. The calendar button reopens it.',
      render: Anatomy,
    },
    {
      id: 'states',
      title: 'Field states and feedback',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Try pointer and keyboard editing in the first fields. The invalid, incomplete, unavailable, warning, success and information examples pin their values and messages. A read-only date opens for inspection.',
      render: withOverlaySurface(FieldStates, 'border-box'),
    },
    {
      id: 'panels',
      title: 'Base fields and floating calendar panels',
      surface: 'base',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      reset: true,
      caption:
        'Each base field starts with an open panel in document flow. Compare an empty date, a six-week month, a restricted window and a read-only selection. Choose a day in an editable panel to confirm it.',
      render: Panels,
    },
    {
      id: 'locales',
      title: 'Local dates and constrained space',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Enter a US date as MM/DD/YYYY or a German date as DD.MM.YYYY. In the narrow field, the label and feedback wrap while the numeric date stays on one line.',
      render: withOverlaySurface(Locales, 'border-box'),
    },
    {
      id: 'live',
      title: 'Anchored calendar',
      surface: 'overlay',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Type 31/02/2026 and leave the field. Open the calendar with the button or Alt+Down and choose a valid date. Escape returns to the trigger. Clicking outside dismisses the panel.',
      render: LivePickers,
    },
  ],
  compositions: [
    {
      id: 'schedule',
      title: 'Schedule a review',
      mode: 'live',
      reset: true,
      caption:
        'Schedule an optional review by typing a valid date or choosing a day. The schedule keeps the last accepted date while you correct an invalid draft. Clear the date to remove the review.',
      render: withOverlaySurface(
        ({ ctx }) => <ReviewSchedule pickerProps={{ subjectAttributes: ctx.subject }} />,
        'border-box',
      ),
      code: scheduleSource.replace('../../prototypes/', './prototypes/'),
    },
  ],
});
