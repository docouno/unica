import { Stack, TagGroup, Text } from '@docouno/unica';
import type { TagGroupItem, TagGroupMessages } from '@docouno/unica';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { tagGroupSeeds } from './tag-group-code.js';
import type { TagGroupValues } from './tag-group.spec.js';

const alternateMessages = {
  empty: 'No topics assigned',
  more: (count: number) => `${count} more topics`,
  moreLabel: (count: number) => `${count} more topics in this group`,
  less: 'Show fewer topics',
  lessLabel: 'Show fewer topics',
  removed: (labels: readonly string[]) => `Unassigned ${labels.join(', ')}.`,
} satisfies TagGroupMessages;

function InteractiveGroup({
  ctx,
  values,
}: PreviewProps & { readonly values: TagGroupValues }): ReactElement {
  const heading = useId();
  const name = values['aria-label'].trim() || 'Assigned labels';
  const labelledByHeading = values['aria-labelledby'] === 'heading';
  const [items, setItems] = useState<readonly TagGroupItem[]>(tagGroupSeeds[values.items]);
  const [expanded, setExpanded] = useState(values.expanded === 'open');
  return (
    <Stack gap={8}>
      {labelledByHeading && (
        <Text as="span" id={heading} weight="medium">
          Reference labels
        </Text>
      )}
      <TagGroup
        {...ctx.subject}
        aria-label={name}
        aria-labelledby={labelledByHeading ? heading : undefined}
        items={items}
        size={values.size}
        disabled={values.disabled}
        maxVisible={values.maxVisible}
        expanded={values.expanded === 'uncontrolled' ? undefined : expanded}
        defaultExpanded={values.defaultExpanded}
        messages={values.messages === 'topics' ? alternateMessages : undefined}
        onExpandedChange={(next) => {
          setExpanded(next);
          ctx.action('onExpandedChange')(next);
        }}
        onRemove={(removed) => {
          setItems((current) => current.filter(({ id }) => id !== removed));
          ctx.action('onRemove')(removed);
        }}
      />
    </Stack>
  );
}

export function TagGroupPlayground({
  ctx,
  values,
}: PreviewProps & { readonly values: TagGroupValues }): ReactElement {
  // Changing the seed or initial expansion starts a new instance of the example.
  return (
    <InteractiveGroup
      key={`${values.items}-${values.expanded}-${values.defaultExpanded}`}
      ctx={ctx}
      values={values}
    />
  );
}
