import { defineComponent } from '../../workbench/types.js';
import { Select } from '../../prototypes/select/select.proto.js';
import { regionOptions } from '../../prototypes/select/select.data.js';
import {
  size,
  variant,
  status,
  width,
  disabled,
  readOnly,
  clearable,
  loading,
  toggle,
  eventProp,
} from '../control-props.js';
import { previewProps } from '../preview-code.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  FieldRoles,
  OpenPanels,
  Triggers,
  Feedback,
  Search,
  Loading,
  Availability,
  Summary,
  LiveSelect,
} from './select.examples.js';
import { DocumentOrder } from './document-order.js';
import orderSource from './document-order.tsx?raw';
import { ChannelActivity } from './channel-activity.js';
import activitySource from './channel-activity.tsx?raw';

const messages = {
  neutral: '',
  info: 'New deployments use this region.',
  success: 'The selected region is available.',
  warning: 'Review the selected region before deployment.',
  danger: 'Choose a region approved for this deployment.',
};

export default defineComponent({
  id: 'select',
  title: 'Select',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary:
    'Choose from a catalog in a compact field. Search filters the panel while the trigger keeps the saved selection.',
  componentName: 'Select',
  props: {
    size,
    variant,
    status,
    width,
    disabled,
    readOnly: {
      ...readOnly,
      description: 'Open the catalog and browse without changing or clearing the current answer.',
    },
    clearable: {
      ...clearable,
      description:
        'Offer Clear selection for a nonempty single choice. Multiple selection always provides its own clear command.',
    },
    loading: {
      ...loading,
      description:
        'Keep saved answers while the catalog loads. An existing catalog stays browsable during refresh.',
    },
    multiple: toggle(
      'Interaction',
      'Allow several selections in one panel. Each choice takes effect immediately.',
    ),
    searchable: toggle(
      'Interaction',
      'Filter the catalog by name, description or group without changing saved answers.',
    ),
    onValueChange: eventProp(
      'In single selection, receives the selected key or null after clearing.',
      '(value) => console.log(value)',
      '(value: string | null) => void',
    ),
    onValuesChange: eventProp(
      'In multiple selection, receives the current keys in selection order. Clearing the answer emits an empty array.',
      '(values) => console.log(values)',
      '(values: readonly string[]) => void',
    ),
  },
  constraints: [
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        'loading',
        'searchable',
        'clearable',
        ...(['info', 'success', 'warning', 'danger'] as const).map((value) => ({
          key: 'status',
          value,
        })),
      ],
      reason: 'A disabled trigger cannot open its panel. It suppresses loading and field feedback.',
    },
    {
      kind: 'ignored',
      when: { multiple: true },
      affects: ['clearable'],
      reason:
        'Multiple selection already includes a clear command whenever the answer has a value.',
    },
    {
      kind: 'ignored',
      when: { readOnly: true },
      affects: ['clearable'],
      reason: 'Read-only fields can open and filter the catalog but cannot clear the answer.',
    },
  ],
  render: ({ values, ctx }) => (
    <ExampleSurface surface={ctx.surface} sizing="border-box">
      <Select
        {...values}
        {...ctx.subject}
        label="Deployment region"
        options={regionOptions}
        defaultValue="amsterdam"
        defaultValues={['amsterdam']}
        message={
          !values.disabled && messages[values.status] ? (
            <bdi>{messages[values.status]}</bdi>
          ) : undefined
        }
        {...(values.multiple
          ? { onValuesChange: ctx.action('onValuesChange') }
          : { onValueChange: ctx.action('onValueChange') })}
      />
    </ExampleSurface>
  ),
  code: (values) => {
    const attrs = previewProps(values, {
      size: 'm',
      variant: 'default',
      status: 'neutral',
      width: 'full',
      disabled: false,
      readOnly: false,
      clearable: false,
      loading: false,
      multiple: false,
      searchable: false,
    });
    const selection = values.multiple
      ? "defaultValues={['amsterdam']} onValuesChange={(values) => console.log(values)}"
      : 'defaultValue="amsterdam" onValueChange={(value) => console.log(value)}';
    const message =
      !values.disabled && messages[values.status]
        ? ` message={<bdi>${messages[values.status]}</bdi>}`
        : '';
    return `import { Select } from './prototypes/select/select.proto.js';
import { regionOptions } from './prototypes/select/select.data.js';
import '@docouno/unica/styles.css';

export function DeploymentRegion() {
  return <Select label="Deployment region" options={regionOptions}${attrs}${message} ${selection} />;
}`;
  },
  states: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Default and ghost by size',
      caption:
        'Compare the same selected region in full-width default and ghost fields at each density.',
    },
  ],
  cases: [
    {
      id: 'field-roles',
      title: 'Field, inline choice and leading icon',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'At each size compare a labeled Editor field, a fitted ghost Viewer choice, and London with its leading globe. Open a role and a region to compare their catalogs.',
      render: withOverlaySurface(FieldRoles, 'border-box'),
    },
    {
      id: 'panels',
      title: 'Single and multiple open anatomy',
      kind: 'behavior',
      surface: 'overlay',
      overlayStage: true,
      mode: 'live',
      reset: true,
      caption:
        'Both panels stay open for comparison. Choose one role or toggle multiple regions. In the second panel, search filters the list and Clear selection removes the saved choices.',
      render: OpenPanels,
    },
    {
      id: 'states',
      title: 'Trigger states',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Hover, press and keyboard focus are pinned on the three Editor samples. Open the empty field or browse the read-only one. The disabled trigger retains its value.',
      render: withOverlaySurface(Triggers, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Field feedback and a neutral panel',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'These samples pin the field statuses. Compare the invalid default and ghost fields, the ordinary option colors inside the open panel, and the disabled field that keeps only its description.',
      render: withOverlaySurface(Feedback, 'border-box'),
    },
    {
      id: 'search',
      title: 'Search and empty results',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'The Americas query hides the saved London selection. In the next field, clear Oslo to restore the catalog, or clear the selection to remove the saved answer. The last catalog has no regions.',
      render: withOverlaySurface(Search, 'border-box'),
    },
    {
      id: 'loading',
      title: 'Loading, refresh and recovery',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: {
        data: {
          kind: 'enum',
          label: 'Preview data state',
          default: 'failed',
          choices: [
            { value: 'ready', label: 'Ready' },
            { value: 'loading', label: 'Loading' },
            { value: 'empty', label: 'Empty catalog' },
            { value: 'failed', label: 'Load failed' },
          ],
        },
      },
      caption:
        'Compare an initial load at three sizes with a refresh that keeps its catalog readable. Preview data state drives Catalog recovery across themes. Try again restores the catalog and focuses the saved region in that list. Each preview keeps its own selected region.',
      render: withOverlaySurface(Loading, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Read only and unavailable selections',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Search a read-only catalog. Activate a removed Maintainer row to discard it while keeping any other choices. Compare a retained disabled Administrator with a catalog where every role is unavailable.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'summary',
      title: 'One-line summaries and overflow',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare a full-width region summary with a 210px ghost filter. A count represents names that do not fit. Open a choice to inspect every selected value, then compare the long policy name and placeholder.',
      render: withOverlaySurface(Summary, 'border-box'),
    },
    {
      id: 'live',
      title: 'Focus, dismissal and search',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Arrows browse without changing the saved answer. Enter commits a role, and Escape or Tab leaves the native panel. Multiple choices update immediately.',
      render: withOverlaySurface(LiveSelect, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'document-order',
      title: 'Sort a document list',
      mode: 'live',
      reset: true,
      caption:
        'Choose Recently updated to bring the latest document to the top. Clear selection to restore the original order. The dates stay attached to their documents.',
      render: withOverlaySurface(
        ({ ctx }) => <DocumentOrder selectProps={ctx.subject} />,
        'border-box',
      ),
      code: orderSource.replaceAll('../../prototypes/', './prototypes/'),
    },
    {
      id: 'channel-activity',
      title: 'Filter an activity list',
      mode: 'live',
      reset: true,
      caption:
        'Email and the retired Legacy import source start selected. Search narrows the options. Selecting Chat adds its event immediately. Clear selection removes every source, including Legacy import, which cannot be selected again.',
      render: withOverlaySurface(
        ({ ctx }) => <ChannelActivity selectProps={ctx.subject} />,
        'border-box',
      ),
      code: activitySource.replaceAll('../../prototypes/', './prototypes/'),
    },
  ],
});
