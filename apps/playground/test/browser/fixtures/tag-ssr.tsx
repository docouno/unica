import { Tag, TagGroup } from '@docouno/unica';
import { useState } from 'react';
import type { ReactElement } from 'react';

export default function ServerTags(): ReactElement {
  const [removed, setRemoved] = useState(false);
  const items = [
    { id: 'guide', label: 'Guide', removeLabel: 'Remove Guide' },
    { id: 'release', label: 'Release notes', removeLabel: 'Remove Release notes' },
  ];
  return (
    <>
      <Tag
        data-testid="server-tag"
        textValue="Version גירסה 2"
        removeLabel="Remove Version גירסה 2"
        onRemove={() => setRemoved(true)}
      >
        Version <bdi dir="rtl">גירסה 2</bdi>
      </Tag>
      <TagGroup
        aria-label="Assigned"
        items={items}
        maxVisible={1}
        onRemove={() => setRemoved(true)}
      />
      <span data-testid="server-removed">{String(removed)}</span>
    </>
  );
}
