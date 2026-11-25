import { disabled, eventProp, readOnly, size, toggle } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { Listbox } from '../../prototypes/select/select.proto.js';
import { roleOptions } from '../../prototypes/select/select.data.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  Anatomy,
  Availability,
  Density,
  Overflow,
  StatePins,
  Surfaces,
} from './listbox.examples.js';
import { RolePermissions } from './role-permissions.js';
import permissionsSource from './role-permissions.tsx?raw';
import { ExportColumns } from './export-columns.js';
import columnsSource from './export-columns.tsx?raw';
import './listbox-matrix.css';

export default defineComponent({
  id: 'listbox',
  title: 'Listbox',
  category: 'Selection & Pickers',
  status: 'Proto',
  componentName: 'Listbox',
  summary:
    'Browse a visible list with the arrow keys. Activate a row to select one value or toggle it in a set.',
  props: {
    size,
    multiple: toggle(
      'Interaction',
      'Allow several checked rows. Activate a row to toggle its value.',
    ),
    disabled,
    readOnly: {
      ...readOnly,
      description: 'Browse available rows while keeping the selected values.',
    },
    onValueChange: eventProp(
      'In single selection, receives the selected value or null after removal of an unavailable saved answer.',
      '(value) => console.log(value)',
      '(value: string | null) => void',
    ),
    onValuesChange: eventProp(
      'In multiple selection, receives the current values, including an empty array when the last answer is removed.',
      '(values) => console.log(values)',
      '(values: readonly string[]) => void',
    ),
  },
  render: withOverlaySurface(
    ({ values, ctx }) => (
      <Listbox
        {...values}
        {...ctx.subject}
        aria-label="Available roles"
        options={roleOptions}
        defaultValue="editor"
        defaultValues={['editor']}
        {...(values.multiple
          ? { onValuesChange: ctx.action('onValuesChange') }
          : { onValueChange: ctx.action('onValueChange') })}
      />
    ),
    'border-box',
  ),
  code: (values) => {
    const attrs = previewProps(values, {
      size: 'm',
      multiple: false,
      disabled: false,
      readOnly: false,
    });
    const selection = values.multiple
      ? "defaultValues={['editor']} onValuesChange={(values) => console.log(values)}"
      : 'defaultValue="editor" onValueChange={(value) => console.log(value)}';
    return `import { Listbox } from './prototypes/select/select.proto.js';
import { roleOptions } from './prototypes/select/select.data.js';
import '@docouno/unica/styles.css';

export function AvailableRoles() {
  return <Listbox aria-label="Available roles" options={roleOptions}${attrs} ${selection} />;
}`;
  },
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
        'At each density compare three plain choices with five mixed rows. Checkmarks reserve a trailing column. Mixed rows align their labels even when an icon or description is absent.',
      render: withOverlaySurface(Density, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Descriptions, icons and groups',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare a rich single choice grouped by membership with an ungrouped multiple choice. Arrow keys browse without changing the answer. Enter or Space activates the current row.',
      render: withOverlaySurface(Anatomy, 'border-box'),
    },
    {
      id: 'states',
      title: 'Selection, pointer and focus',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare available and selected rows at rest, on hover, on press and with keyboard focus. These samples pin their appearance. Try the scrolling list for live focus and selection.',
      render: withOverlaySurface(StatePins, 'border-box'),
    },
    {
      id: 'availability',
      title: 'Read only, disabled and unavailable',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Browse a read-only list, inspect retained disabled choices, or activate Maintainer to remove a saved answer absent from the catalog. A read-only or disabled saved answer stays in place. Empty and fully disabled lists have no active row.',
      render: withOverlaySurface(Availability, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Long content and bounded scrolling',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Long labels and descriptions wrap. Focus Available regions, use End or type S repeatedly to scroll through matching rows. The selected regions change when you activate a row with Enter or Space.',
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
        'The base card and the floating SelectPanel supply their own materials. Each contains the same single-choice rows. Change either selection independently.',
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
        'Browse three access levels, then select a role to see its permissions. Moving the active row keeps the previously selected role and its summary.',
      render: withOverlaySurface(
        ({ ctx }) => <RolePermissions listProps={ctx.subject} />,
        'border-box',
      ),
      code: permissionsSource.replace('../../prototypes/', './prototypes/'),
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
      code: columnsSource.replace('../../prototypes/', './prototypes/'),
    },
  ],
});
