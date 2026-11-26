import { SelectContent, SelectGroup, SelectOption, SelectTrigger } from '@docouno/unica';
import { GlobeHemisphereWestIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PreviewContext, PropSchema } from '../../workbench/types.js';
import { eventProp, toggle, variant, status, width } from '../control-props.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { regionOptions } from '../listbox/choice-catalogs.js';
import {
  pickerConstraints,
  pickerContent,
  pickerContentCode,
  pickerProps,
  pickerSelection,
  pickerSelectionCode,
} from '../listbox/picker-preview.js';
import {
  Availability,
  Feedback,
  FieldRoles,
  LiveSelect,
  Loading,
  ModalSelect,
  OpenPanels,
  Search,
  Summary,
  Triggers,
} from './select.examples.js';
import { SelectFieldExample } from './select-field-example.js';
import { DocumentOrder } from './document-order.js';
import orderSource from './document-order.tsx?raw';
import { ChannelActivity } from './channel-activity.js';
import activitySource from './channel-activity.tsx?raw';
import './select-matrix.css';

const feedback = {
  neutral: '',
  info: 'New deployments use this region.',
  success: 'The selected region is available.',
  warning: 'Review the selected region before deployment.',
  danger: 'Choose a region approved for this deployment.',
};

const europe = regionOptions.find(({ label }) => label === 'Europe')!;
const regions = [{ label: europe.label, options: europe.options.slice(0, 3) }];

const props = {
  ...pickerProps,
  variant,
  status,
  width,
  clearable: toggle('Interaction', 'Offer a clear action when a single choice has a value.'),
  loading: toggle(
    'Availability',
    'Show an initial load or refresh. Refresh keeps the current catalog available for browsing.',
  ),
  searchable: toggle(
    'Interaction',
    'Filter by name, description, or group while preserving the saved selection.',
  ),
  open: {
    kind: 'enum',
    group: 'Interaction',
    publicType: 'boolean',
    description: 'In the single-theme Playground, hold the panel open or closed.',
    default: 'omitted',
    choices: [
      { value: 'omitted', label: 'Uncontrolled', omit: true },
      { value: 'true', label: 'True' },
      { value: 'false', label: 'False' },
    ],
  },
  defaultOpen: toggle('Interaction', 'Open on mount in the single-theme Playground.'),
  onOpenChange: eventProp(
    'Reports requests to open or close and completed native dismissals.',
    '(open) => console.log(open)',
    '(open: boolean) => void',
  ),
  options: {
    kind: 'enum',
    group: 'Content',
    publicType: 'readonly (ListboxItem | ListboxSection)[]',
    description: 'Catalog data. A section groups options under its accessible name.',
    default: 'regions',
    choices: [
      { value: 'regions', label: 'Deployment regions' },
      { value: 'empty', label: 'Empty catalog' },
      { value: 'omitted', label: 'Use JSX catalog', omit: true },
    ],
  },
  children: {
    kind: 'enum',
    group: 'Content',
    publicType: 'ReactNode',
    description:
      'Compose one SelectTrigger and one SelectContent. List options and groups in SelectContent when using JSX catalog.',
    default: 'omitted',
    choices: [
      { value: 'omitted', label: 'Default parts', omit: true },
      { value: 'parts', label: 'Trigger and content' },
      { value: 'grouped', label: 'Trigger and content with options' },
    ],
  },
  'aria-label': {
    kind: 'string',
    group: 'Semantics',
    default: 'Deployment region',
    description:
      'Name the field when there is no visible label. A native label or aria-labelledby can supply the name.',
  },
  placeholder: {
    kind: 'string',
    group: 'Content',
    default: '',
    description: 'Text in the trigger when no answer is selected.',
  },
  iconLeft: {
    kind: 'enum',
    group: 'Content',
    publicType: 'GlyphSource',
    default: 'omitted',
    description: 'Decorative leading icon in the trigger.',
    choices: [
      { value: 'omitted', label: 'None', omit: true },
      { value: 'globe', label: 'Globe' },
    ],
  },
  emptyState: {
    kind: 'string',
    group: 'Content',
    publicType: 'ReactNode',
    default: '',
    description: 'Replace the text for a successful but empty catalog.',
  },
  errorState: {
    kind: 'string',
    group: 'Content',
    publicType: 'ReactNode',
    default: '',
    description: 'Shown after a catalog failure. It can include a retry action.',
  },
} as const satisfies PropSchema;

type Values = ComponentValues<typeof props>;

function Preview({ values, ctx }: { readonly values: Values; readonly ctx: PreviewContext }) {
  const formId = `${ctx.id}-form`;
  const live = ctx.tab === 'playground' && !ctx.comparing;
  const defaultOpen = live && values.defaultOpen;
  const open = live && values.open !== 'omitted' ? values.open === 'true' : undefined;
  const key = [
    values.multiple,
    values.value,
    values.defaultValue,
    defaultOpen,
    open === undefined ? 'uncontrolled' : 'controlled',
  ].join('-');
  const control = {
    ...ctx.subject,
    ...pickerContent(values),
    ...pickerSelection(values, 'amsterdam', ctx.action('onValueChange')),
    label: values['aria-label'].trim() || 'Deployment region',
    'aria-label': values['aria-label'].trim() || undefined,
    size: values.size,
    variant: values.variant,
    status: values.status,
    width: values.width,
    disabled: values.disabled,
    readOnly: values.readOnly,
    required: values.required,
    clearable: values.clearable,
    loading: values.loading,
    searchable: values.searchable,
    placeholder: values.placeholder || undefined,
    iconLeft: values.iconLeft === 'globe' ? GlobeHemisphereWestIcon : undefined,
    emptyState: values.emptyState || undefined,
    errorState: values.errorState || undefined,
    open,
    defaultOpen,
    onOpenChange: ctx.action('onOpenChange'),
    message: feedback[values.status],
    form: values.form === 'explicit' ? formId : undefined,
  };
  const options =
    values.options === 'regions' ? regions : values.options === 'empty' ? [] : undefined;

  return (
    <form {...ctx.form} id={formId} className="select-specimen">
      {values.children === 'grouped' ? (
        <SelectFieldExample key={key} {...control}>
          <SelectTrigger />
          <SelectContent>
            {regions.map(({ label, options }) => (
              <SelectGroup key={label} label={label}>
                {options.map((option) => (
                  <SelectOption key={option.value} {...option} />
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </SelectFieldExample>
      ) : (
        <SelectFieldExample key={key} {...control} options={options}>
          {values.children === 'parts' && (
            <>
              <SelectTrigger />
              <SelectContent />
            </>
          )}
        </SelectFieldExample>
      )}
    </form>
  );
}

function exampleCode(values: Values): string {
  const hasParts = values.children !== 'omitted';
  const grouped = values.children === 'grouped';
  const customIcon = values.iconLeft === 'globe';
  const explicitForm = values.form === 'explicit';
  const catalogWithIcons = values.options === 'regions' || grouped;
  const message = !values.disabled && feedback[values.status];
  const label = values['aria-label'].trim() || 'Deployment region';
  const attrs = previewProps(
    {
      size: values.size,
      variant: values.variant,
      status: values.status,
      width: values.width,
      disabled: values.disabled,
      readOnly: values.readOnly,
      required: values.required,
      clearable: values.clearable,
      loading: values.loading,
      multiple: values.multiple,
      searchable: values.searchable,
      placeholder: values.placeholder,
      emptyState: values.emptyState,
      errorState: values.errorState,
      defaultOpen: values.defaultOpen,
    },
    {
      size: 'm',
      variant: 'default',
      status: 'neutral',
      width: 'full',
      disabled: false,
      readOnly: false,
      required: false,
      clearable: false,
      loading: false,
      multiple: false,
      searchable: false,
      placeholder: '',
      emptyState: '',
      errorState: '',
      defaultOpen: false,
    },
  );
  const panelAttrs = [
    values.open !== 'omitted' ? ` open={${values.open}}` : '',
    customIcon ? ' iconLeft={GlobeHemisphereWestIcon}' : '',
    ' onOpenChange={(open) => console.log(open)}',
  ].join('');
  const options =
    values.options === 'regions'
      ? ' options={regions}'
      : values.options === 'empty'
        ? ' options={[]}'
        : '';
  const opening = `<Select id={id}${values['aria-label'].trim() ? ` aria-label={${JSON.stringify(values['aria-label'].trim())}}` : ''}${message ? ' aria-describedby={messageId}' : ''}${!grouped ? options : ''}${attrs}${panelAttrs}${pickerContentCode(values)}${pickerSelectionCode(values, 'amsterdam')}`;
  const jsxOptions = regions[0]!.options.map(
    ({ label, value, description }) =>
      `<SelectOption label={${JSON.stringify(label)}} value="${value}" description={${JSON.stringify(description)}} iconLeft={GlobeHemisphereWestIcon} />`,
  );
  const content = grouped
    ? `<SelectContent>
            <SelectGroup label="Europe">
              ${jsxOptions.join('\n              ')}
            </SelectGroup>
          </SelectContent>`
    : '<SelectContent />';
  const subject = hasParts
    ? `${opening}>
          <SelectTrigger />
          ${content}
        </Select>`
    : `${opening} />`;
  const regionData = regions.map(({ label, options }) => ({
    label,
    options: options.map(({ label, value, description }) => ({ label, value, description })),
  }));
  const imports = [
    'Select',
    'Stack',
    'Text',
    ...(hasParts ? ['SelectTrigger', 'SelectContent'] : []),
    ...(grouped ? ['SelectGroup', 'SelectOption'] : []),
  ].join(', ');
  return `import { useId } from 'react';
import { ${imports} } from '@docouno/unica';
${catalogWithIcons || customIcon ? "import { GlobeHemisphereWestIcon } from '@phosphor-icons/react';\n" : ''}import '@docouno/unica/styles.css';
${
  values.options === 'regions' && !grouped
    ? `
const regions = ${JSON.stringify(regionData)}.map((region) => ({
  ...region,
  options: region.options.map((option) => ({ ...option, iconLeft: GlobeHemisphereWestIcon })),
}));
`
    : ''
}
export function DeploymentRegion() {
  const id = useId();
  ${explicitForm ? "const formId = id + '-form';\n  " : ''}${message ? "const messageId = id + '-message';\n  " : ''}return (
    <form${explicitForm ? ' id={formId}' : ''} onSubmit={(event) => event.preventDefault()}>
      <Stack gap={4}>
        <Text as="label" htmlFor={id} size="body-s" weight="medium">{${JSON.stringify(label)}}${values.required && !values.disabled && !values.readOnly ? '<span aria-hidden="true"> *</span>' : ''}</Text>
        ${subject}
        ${message ? `<Text id={messageId} size="caption-l" color="${values.status}">{${JSON.stringify(message)}}</Text>` : ''}
      </Stack>
    </form>
  );
}`;
}

export default defineComponent({
  id: 'select',
  title: 'Select',
  category: 'Selection & Pickers',
  status: 'UI',
  summary:
    'Choose from a catalog in a compact field. Search filters the panel and preserves the answer.',
  componentName: 'Select',
  form: 'owned',
  props,
  constraints: [
    ...pickerConstraints,
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        'loading',
        'searchable',
        'clearable',
        { key: 'open', value: 'true' },
        { key: 'defaultOpen', value: true },
        ...(['info', 'success', 'warning', 'danger'] as const).map((value) => ({
          key: 'status',
          value,
        })),
      ],
      reason: 'A disabled trigger cannot open. It suppresses loading and field feedback.',
    },
    {
      kind: 'ignored',
      when: { multiple: true },
      affects: ['clearable'],
      reason: 'Multiple selection includes a clear command whenever the answer has a value.',
    },
    {
      kind: 'ignored',
      when: { readOnly: true },
      affects: ['clearable'],
      reason: 'Read-only fields can open and filter the catalog without changing the answer.',
    },
    {
      kind: 'precedence',
      when: { loading: true },
      affects: ['clearable', 'errorState'],
      reason: 'Pending data takes priority over an earlier failure and blocks selection changes.',
    },
    ...(['true', 'false'] as const).map((value) => ({
      kind: 'precedence' as const,
      when: { open: value },
      affects: [{ key: 'defaultOpen', value: true }],
      reason: 'The controlled open prop determines the initial state.',
    })),
    {
      kind: 'forbidden',
      when: { children: 'grouped' },
      affects: [
        { key: 'options', value: 'regions' },
        { key: 'options', value: 'empty' },
      ],
      reason: 'Supply catalog data through options or option children.',
    },
  ],
  render: withOverlaySurface(Preview, 'border-box'),
  code: exampleCode,
  states: [
    {
      id: 'roles',
      rows: 'size',
      group: 'variant',
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
        'Compare a labeled Editor field, a fitted ghost Viewer choice, and London with its leading globe at each size.',
      render: withOverlaySurface(FieldRoles, 'border-box'),
    },
    {
      id: 'panels',
      title: 'Single and multiple selection panels',
      kind: 'behavior',
      surface: 'overlay',
      overlayStage: true,
      mode: 'live',
      reset: true,
      caption:
        'Open either field to inspect the native panel. In a single-theme view the searchable panel starts open. The theme comparison shows grouped rows in flow.',
      render: OpenPanels,
    },
    {
      id: 'states',
      title: 'Trigger states',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Hover and press Editor, then tab to it and open the panel. Compare the empty field, the disabled selection, and the read-only catalog.',
      render: withOverlaySurface(Triggers, 'border-box'),
    },
    {
      id: 'feedback',
      title: 'Field feedback and a neutral panel',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Compare the invalid default and ghost fields, then open either catalog to see options keep their ordinary colors. The disabled field retains its description.',
      render: withOverlaySurface(Feedback, 'border-box'),
    },
    {
      id: 'search',
      title: 'Search and empty results',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Search for Americas to hide London while keeping it selected. Search for Oslo in the next field to see an empty result. Clear the search to restore the catalog or clear selection to remove the saved answer.',
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
          label: 'Catalog state',
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
        'Open a field to compare the first load with a refresh that keeps its catalog readable. Open Catalog recovery and select Try again to restore the catalog across themes. Each field keeps its own selection.',
      render: withOverlaySurface(Loading, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Read only and unavailable selections',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Search a read-only catalog. Activate the unavailable Maintainer row to remove it from the answer. Compare a retained disabled Administrator with a catalog where every role is unavailable.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'summary',
      title: 'One-line summaries and overflow',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare a full-width summary with a 210px ghost filter. The count represents names that do not fit. Open the field to inspect every selected value.',
      render: withOverlaySurface(Summary, 'border-box'),
    },
    {
      id: 'live',
      title: 'Focus, dismissal and search',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Arrow keys browse without saving. Enter commits a role. Escape returns focus to the trigger, and Tab moves on. Multiple choices update immediately.',
      render: withOverlaySurface(LiveSelect, 'border-box'),
    },
    {
      id: 'modal',
      title: 'Choose a role inside a modal',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Open Review access, search for a role and choose it. While the list is open, Escape closes the list and leaves the dialog open. Reset restores the saved role, and Save access submits the form.',
      render: withOverlaySurface(ModalSelect, 'border-box'),
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
      code: orderSource,
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
      code: activitySource,
    },
  ],
});
