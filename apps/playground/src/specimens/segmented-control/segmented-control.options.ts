import { ColumnsIcon, ListIcon, SquaresFourIcon } from '@phosphor-icons/react';

export const periods = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const icons = { ListIcon, SquaresFourIcon, ColumnsIcon };
const layoutOptions = [
  { value: 'list', label: 'List', icon: 'ListIcon' },
  { value: 'grid', label: 'Grid', icon: 'SquaresFourIcon' },
  { value: 'columns', label: 'Columns', icon: 'ColumnsIcon' },
] as const;

export const layouts = layoutOptions.map(({ value, label, icon }) => ({
  value,
  label,
  iconLeft: icons[icon],
}));
export const glyphLayouts = layouts.map((item) => ({ ...item, iconOnly: true as const }));

export function catalogCode(kind: 'periods' | 'layouts' | 'glyphLayouts') {
  if (kind === 'periods') {
    return { imports: '', items: JSON.stringify(periods) };
  }
  const rows = layoutOptions.map(
    ({ value, label, icon }) =>
      `{ value: "${value}", label: "${label}", iconLeft: ${icon}${kind === 'glyphLayouts' ? ', iconOnly: true' : ''} }`,
  );
  return {
    imports: `import { ${Object.keys(icons).join(', ')} } from '@phosphor-icons/react';\n`,
    items: `[\n${rows.join(',\n')}\n]`,
  };
}
