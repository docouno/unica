import {
  clearable,
  disabled,
  eventProp,
  loading,
  readOnly,
  required,
  size,
  status,
  toggle,
  variant,
} from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { DateRangePicker } from '../../prototypes/date-picker/date-picker.proto.js';
import { previewProps, previewText } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  Anatomy,
  FieldStates,
  LivePickers,
  Locales,
  PairedFields,
  RangePanels,
} from './date-range-picker.examples.js';
import { PeriodRecords } from './period-records.js';
import recordsSource from './period-records.tsx?raw';
import { PeriodDuration } from './period-duration.js';
import durationSource from './period-duration.tsx?raw';

const samplePeriod = ['2026-09-14', '2026-09-18'] as const;
const unavailable = ['2026-09-19'];
const messages = {
  neutral: '',
  info: 'Both dates belong to the selected period.',
  success: 'The full period is available.',
  warning: 'Check the period with the review owner.',
  danger: 'Choose another period.',
};

export default defineComponent({
  id: 'date-range-picker',
  title: 'DateRangePicker',
  category: 'Selection & Pickers',
  status: 'Proto',
  componentName: 'DateRangePicker',
  summary:
    'Enter two local dates in one field or choose the endpoints of an inclusive period. The first calendar choice remains a draft until the second is accepted.',
  props: {
    variant,
    size,
    locale: {
      kind: 'enum',
      group: 'Content',
      description: 'Locale used for both numeric endpoints and calendar labels.',
      default: 'en-GB',
      publicType: 'string',
      choices: [
        { value: 'en-GB', label: 'English (UK)' },
        { value: 'en-US', label: 'English (US)' },
        { value: 'de-DE', label: 'German' },
      ],
    },
    allowUnavailableInRange: toggle(
      'Availability',
      'Allow unavailable dates between eligible endpoints. Both endpoints must be available.',
    ),
    clearable,
    required,
    readOnly: {
      ...readOnly,
      description: 'Inspect the calendar while keeping the accepted period.',
    },
    disabled,
    status: {
      ...status,
      description: 'Set a fixed feedback message. Range validation takes precedence.',
    },
    loading,
    onValueChange: eventProp(
      'Receives the accepted pair of ISO dates. Clearing the period returns two empty strings.',
      '(period) => console.log(period)',
      '(value: readonly [string, string]) => void',
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
      reason: 'A read-only field retains both dates and hides the clear action.',
    },
  ],
  render: withOverlaySurface(({ values, ctx }) => {
    const message = !values.disabled && messages[values.status];
    return (
      <DateRangePicker
        {...values}
        subjectAttributes={ctx.subject}
        style={{ inlineSize: 'min(100%, 22rem)' }}
        label={values.variant === 'ghost' ? 'Inline date window' : 'Date window'}
        defaultValue={samplePeriod}
        unavailable={unavailable}
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
      allowUnavailableInRange: false,
      clearable: false,
      required: false,
      readOnly: false,
      disabled: false,
      loading: false,
    });
    const message = !values.disabled && messages[values.status];
    return `import { DateRangePicker } from './prototypes/date-picker/date-picker.proto.js';
import '@docouno/unica/styles.css';

export function DateWindow() {
  return <DateRangePicker label="${values.variant === 'ghost' ? 'Inline date window' : 'Date window'}" defaultValue={${JSON.stringify(samplePeriod)}} unavailable={${JSON.stringify(unavailable)}}${attrs}${message ? ` message={<bdi>${previewText(message)}</bdi>}` : ''} onValueChange={(period) => console.log(period)} />;
}`;
  },
  states: [
    {
      id: 'fields',
      title: 'Field roles and sizes',
      rows: 'size',
      cols: 'variant',
      fixed: { clearable: true },
      caption:
        'Each role holds both dates in a single input at S, M and L. Clear the period to remove both endpoints at once.',
    },
  ],
  cases: [
    {
      id: 'paired-fields',
      title: 'Complete periods by size',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Each size groups a form field with its inline counterpart. Both start on September 14–23. Clear either period to check its empty field and calendar action at that width.',
      render: withOverlaySurface(PairedFields, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Period and calendar',
      surface: 'base',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      reset: true,
      caption:
        'The base field starts with a complete period and its calendar in document flow. The first day anchors a replacement. Choose a second day to update both dates and close the panel.',
      render: Anatomy,
    },
    {
      id: 'states',
      title: 'Field states and correction',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Try typing both dates in one input. The missing, reversed, overlong and confirmed examples pin the supplied text and feedback. The read-only field still opens for inspection.',
      render: withOverlaySurface(FieldStates, 'border-box'),
    },
    {
      id: 'panels',
      title: 'Range panels',
      surface: 'base',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      reset: true,
      caption:
        'Compare empty, existing, cross-month, one-day, restricted and read-only periods in open panels. In the restricted field choose 2–14 days between September 7 and 25. September 18–20 break the interval.',
      render: RangePanels,
    },
    {
      id: 'locales',
      title: 'Local periods and constrained space',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare US and German local dates in one input. The constrained field wraps its label and scrolls the unbroken period as you move the caret.',
      render: withOverlaySurface(Locales, 'border-box'),
    },
    {
      id: 'live',
      title: 'Select, replace and dismiss',
      surface: 'overlay',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Open the empty or filled field with the calendar button or Alt+Down. The first date stays in the panel. Escape discards that draft and returns focus to the trigger. A valid second date commits both endpoints.',
      render: LivePickers,
    },
  ],
  compositions: [
    {
      id: 'records',
      title: 'Filter dated records',
      mode: 'live',
      reset: true,
      caption:
        'Choose two dates to filter the records, or clear the field to show all three. The first calendar choice leaves the displayed records in place until the second day completes the period.',
      render: withOverlaySurface(
        ({ ctx }) => <PeriodRecords pickerProps={{ subjectAttributes: ctx.subject }} />,
        'border-box',
      ),
      code: recordsSource.replace('../../prototypes/', './prototypes/'),
    },
    {
      id: 'duration',
      title: 'Measure a review period',
      mode: 'live',
      reset: true,
      caption:
        'The accepted 10-day period can be replaced by 1–14 days. Dismiss after the first choice or try a longer interval to keep the previous duration. Confirm a valid period to update the count and both dates.',
      render: withOverlaySurface(
        ({ ctx }) => <PeriodDuration pickerProps={{ subjectAttributes: ctx.subject }} />,
        'border-box',
      ),
      code: durationSource.replace('../../prototypes/', './prototypes/'),
    },
  ],
});
