import { Listbox, ListboxGroup, ListboxOption } from '@docouno/unica';
import type { ListboxItem } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import type { ComponentValues, PreviewContext, PropSchema } from '../../workbench/types.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { roleOptions } from './choice-catalogs.js';
import {
  pickerConstraints,
  pickerContent,
  pickerContentCode,
  pickerProps,
  pickerSelection,
  pickerSelectionCode,
} from './picker-preview.js';
import {
  Anatomy,
  Availability,
  Density,
  Interactions,
  Overflow,
  Surfaces,
} from './listbox.examples.js';
import { RolePermissions } from './role-permissions.js';
import permissionsSource from './role-permissions.tsx?raw';
import { ExportColumns } from './export-columns.js';
import columnsSource from './export-columns.tsx?raw';
import './listbox-matrix.css';

const props = {
  ...pickerProps,
  options: {
    kind: 'enum',
    group: 'Content',
    publicType: 'readonly (ListboxItem | ListboxSection)[]',
    default: 'roles',
    description: 'Catalog data. Members of a named section appear under a group heading.',
    choices: [
      { value: 'roles', label: 'Roles' },
      { value: 'empty', label: 'Empty catalog' },
      { value: 'omitted', label: 'Use JSX children', omit: true },
    ],
  },
  children: {
    kind: 'enum',
    group: 'Content',
    publicType: 'ReactNode',
    description: 'Use ListboxOption and ListboxGroup to compose the catalog.',
    default: 'omitted',
    choices: [
      { value: 'omitted', label: 'Use option data', omit: true },
      { value: 'grouped', label: 'ListboxGroup and ListboxOption' },
    ],
  },
  'aria-label': {
    kind: 'string',
    group: 'Semantics',
    default: 'Available roles',
    description: 'Name the listbox. Use aria-labelledby when nearby text supplies its name.',
  },
  emptyState: {
    kind: 'string',
    group: 'Content',
    publicType: 'ReactNode',
    default: '',
    description: 'Replace the built-in text shown when the list has no options.',
  },
} as const satisfies PropSchema;

type Values = ComponentValues<typeof props>;

function Preview({ values, ctx }: { readonly values: Values; readonly ctx: PreviewContext }) {
  const formId = `${ctx.id}-form`;
  const key = `${values.multiple}-${values.value}-${values.defaultValue}`;
  const control = {
    ...ctx.subject,
    ...pickerContent(values),
    ...pickerSelection(values, 'editor', ctx.action('onValueChange')),
    'aria-label': values['aria-label'].trim() || 'Available roles',
    size: values.size,
    disabled: values.disabled,
    readOnly: values.readOnly,
    required: values.required,
    emptyState: values.emptyState || undefined,
    form: values.form === 'explicit' ? formId : undefined,
  };
  return (
    <form {...ctx.form} id={formId} className="listbox-specimen">
      {values.options === 'omitted' ? (
        <Listbox key={key} {...control}>
          {roleOptions.map(({ label, options }) => (
            <ListboxGroup key={label} label={label}>
              {options.map((option) => (
                <ListboxOption key={option.value} {...option} />
              ))}
            </ListboxGroup>
          ))}
        </Listbox>
      ) : (
        <Listbox key={key} {...control} options={values.options === 'roles' ? roleOptions : []} />
      )}
    </form>
  );
}

const roleGlyphs: Readonly<Record<string, string>> = {
  viewer: 'EyeIcon',
  commenter: 'ChatCircleIcon',
  editor: 'PencilSimpleIcon',
  admin: 'ShieldCheckIcon',
};

function roleCode({ value, label, description, iconLeft, disabled }: ListboxItem): {
  readonly jsx: string;
  readonly data: string;
} {
  const attrs = previewProps({
    value,
    label,
    ...(description ? { description } : {}),
    ...(disabled ? { disabled } : {}),
  });
  const glyph = iconLeft ? roleGlyphs[value] : undefined;
  const fields = JSON.stringify({ value, label, description, disabled });
  return {
    jsx: `<ListboxOption${attrs}${glyph ? ` iconLeft={${glyph}}` : ''} />`,
    data: glyph ? `${fields.slice(0, -1)},iconLeft:${glyph}}` : fields,
  };
}

function exampleCode(values: Values): string {
  const compound = values.options === 'omitted';
  const explicitForm = values.form === 'explicit';
  const attrs = previewProps(
    {
      size: values.size,
      multiple: values.multiple,
      disabled: values.disabled,
      readOnly: values.readOnly,
      required: values.required,
      emptyState: values.emptyState,
    },
    {
      size: 'm',
      multiple: false,
      disabled: false,
      readOnly: false,
      required: false,
      emptyState: '',
    },
  );
  const opening = `<Listbox aria-label={${JSON.stringify(values['aria-label'].trim() || 'Available roles')}}${attrs}${pickerContentCode(values)}${pickerSelectionCode(values, 'editor')}`;
  const sections = values.options === 'empty' ? [] : roleOptions;
  const groups = sections.map(({ label, options }) => ({
    label,
    options: options.map(roleCode),
  }));
  const catalog = groups.map(
    ({ label, options }) =>
      `{ label: ${JSON.stringify(label)}, options: [${options.map(({ data }) => data).join(', ')}] }`,
  );
  const children = groups.map(
    ({ label, options }) => `
          <ListboxGroup label={${JSON.stringify(label)}}>
            ${options.map(({ jsx }) => jsx).join('\n            ')}
          </ListboxGroup>`,
  );
  const subject = compound
    ? `${opening}>${children.join('')}
        </Listbox>`
    : `${opening} options={${groups.length ? 'roles' : '[]'}} />`;
  return `${explicitForm ? "import { useId } from 'react';\n" : ''}import { Listbox${compound ? ', ListboxGroup, ListboxOption' : ''} } from '@docouno/unica';
${groups.length ? `import { ${Object.values(roleGlyphs).join(', ')} } from '@phosphor-icons/react';\n` : ''}import '@docouno/unica/styles.css';
${!compound && groups.length ? `\nconst roles = [${catalog.join(', ')}];\n` : ''}
export function AvailableRoles() {
  ${explicitForm ? 'const formId = useId();\n  ' : ''}return (
    <form${explicitForm ? ' id={formId}' : ''} onSubmit={(event) => event.preventDefault()}>
      ${subject}
    </form>
  );
}`;
}

export default defineComponent({
  id: 'listbox',
  title: 'Listbox',
  category: 'Selection & Pickers',
  status: 'UI',
  componentName: 'Listbox',
  summary: 'Browse a visible catalog and choose one option or toggle a group of choices.',
  form: 'owned',
  props,
  constraints: [
    ...pickerConstraints,
    {
      kind: 'forbidden',
      when: { children: 'grouped' },
      affects: [
        { key: 'options', value: 'roles' },
        { key: 'options', value: 'empty' },
      ],
      reason: 'Compose the catalog with either options or children.',
    },
    {
      kind: 'forbidden',
      when: { children: 'omitted' },
      affects: [{ key: 'options', value: 'omitted' }],
      reason: 'Supply options, an empty array, or option children.',
    },
  ],
  render: withOverlaySurface(Preview, 'border-box'),
  code: exampleCode,
  states: [
    {
      id: 'sizes',
      title: 'Density and selection mode',
      rows: 'size',
      group: 'multiple',
      caption:
        'Editor starts selected at every size. Choose Viewer to replace Editor in a single list, or to keep both checks in a multiple list.',
    },
  ],
  cases: [
    {
      id: 'density',
      title: 'Plain and mixed rows by size',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare three plain choices with five mixed rows at each density. Checkmarks reserve a trailing column. Mixed rows align their labels even when an icon or description is absent.',
      render: withOverlaySurface(Density, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Descriptions, icons and groups',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare a single choice with group headings and descriptions with an ungrouped multiple choice.',
      render: withOverlaySurface(Anatomy, 'border-box'),
    },
    {
      id: 'states',
      title: 'Selection, pointer and focus',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Hover and press selected and unselected rows. Tab into a list and move with the arrow keys to compare the focus outline and the saved check. Enter or Space activates the focused row.',
      render: withOverlaySurface(Interactions, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Read only, disabled and unavailable',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Browse the read-only list or activate Maintainer to remove a saved answer absent from the catalog. A read-only or disabled saved answer stays in place. Empty and fully disabled lists have no active row.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long content and bounded scrolling',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Focus Available regions, then use End or type S repeatedly to scroll through matching rows. The selected regions change when you activate a row with Enter or Space.',
      render: withOverlaySurface(Overflow, 'border-box'),
    },
    {
      id: 'surfaces',
      title: 'One list on two surfaces',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      reset: true,
      caption:
        'The base card and the floating surface contain the same single-choice rows. Change either selection independently.',
      render: Surfaces,
    },
  ],
  compositions: [
    {
      id: 'permissions',
      title: 'Preview role permissions',
      mode: 'live',
      reset: true,
      caption:
        'Choose one of three access levels to see its permissions. Moving the active row keeps the previously selected role and its summary.',
      render: withOverlaySurface(
        ({ ctx }) => <RolePermissions listProps={ctx.subject} />,
        'border-box',
      ),
      code: permissionsSource,
    },
    {
      id: 'columns',
      title: 'Choose export columns',
      mode: 'live',
      reset: true,
      caption:
        'Toggle the columns to preview a CSV header in catalog order. Remove all columns to observe an empty export selection.',
      render: withOverlaySurface(
        ({ ctx }) => <ExportColumns listProps={ctx.subject} />,
        'border-box',
      ),
      code: columnsSource,
    },
  ],
});
