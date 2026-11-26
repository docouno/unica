import type { TagGroupItem } from '@docouno/unica';
import { previewProps, previewText } from '../preview-code.js';
import type { TagGroupValues } from './tag-group.spec.js';

export const tagGroupSeeds = {
  assigned: [
    { id: 'guide', label: 'Field guide', removeLabel: 'Remove Field guide' },
    { id: 'notes', label: 'Release notes', removeLabel: 'Remove Release notes' },
    { id: 'review', label: 'Review checklist', removeLabel: 'Remove Review checklist' },
    { id: 'archive', label: 'Archive', removeLabel: 'Remove Archive', disabled: true },
  ],
  empty: [],
} as const satisfies Record<string, readonly TagGroupItem[]>;

export function tagGroupCode(values: TagGroupValues): string {
  const name = values['aria-label'].trim() || 'Assigned labels';
  const labelledByHeading = values['aria-labelledby'] === 'heading';
  const controlled = values.expanded !== 'uncontrolled';
  const options = previewProps(
    {
      size: values.size,
      disabled: values.disabled,
      ...(controlled ? {} : { defaultExpanded: values.defaultExpanded }),
    },
    { size: 'm', disabled: false, defaultExpanded: false },
  );
  const customization = values.messages === 'topics';
  return `import { ${labelledByHeading ? 'Stack, TagGroup, Text' : 'TagGroup'} } from '@docouno/unica';
import { ${labelledByHeading ? 'useId, useState' : 'useState'} } from 'react';
${
  customization
    ? `
const messages = {
  empty: 'No topics assigned',
  more: (count) => \`\${count} more topics\`,
  moreLabel: (count) => \`\${count} more topics in this group\`,
  less: 'Show fewer topics',
  lessLabel: 'Show fewer topics',
  removed: (labels) => \`Unassigned \${labels.join(', ')}.\`,
};
`
    : ''
}
export function AssignedLabels() {
  const [items, setItems] = useState(${JSON.stringify(tagGroupSeeds[values.items], null, 2)});
  ${controlled ? `const [expanded, setExpanded] = useState(${JSON.stringify(values.expanded === 'open')});` : ''}
  ${labelledByHeading ? 'const heading = useId();' : ''}
  return (
    ${
      labelledByHeading
        ? `<Stack gap={8}>
      <Text as="span" id={heading} weight="medium">Reference labels</Text>`
        : ''
    }
    <TagGroup
      aria-label=${previewText(name)}${labelledByHeading ? ' aria-labelledby={heading}' : ''}
      items={items}
      maxVisible={${values.maxVisible}}${options}
      ${controlled ? 'expanded={expanded} onExpandedChange={setExpanded}' : ''}
      ${customization ? 'messages={messages}' : ''}
      onRemove={(removed) => setItems((current) => current.filter(({ id }) => id !== removed))}
    />
    ${labelledByHeading ? '</Stack>' : ''}
  );
}`;
}
