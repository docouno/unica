import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { FolderIcon } from '@phosphor-icons/react';
import { Tag, TagGroup, Chip } from './tag.proto.js';
import { Card } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import '../card/display.examples.css';

function FilterExample(): ReactElement {
  const [filters, setFilters] = useState(['Verified', 'Platform', 'Updated this week']);
  return (
    <Card>
      <div className="display-example-spread">
        <Text size="body-s" weight="semibold">
          Document filters
        </Text>
        <Text size="caption-l" color="muted">
          {filters.length} active
        </Text>
      </div>
      <TagGroup>
        {filters.map((label) => (
          <Chip
            key={label}
            defaultSelected
            onRemove={() => setFilters(filters.filter((filter) => filter !== label))}
          >
            {label}
          </Chip>
        ))}
      </TagGroup>
      {!filters.length && (
        <Text size="body-s" color="muted">
          All documents are visible.
        </Text>
      )}
    </Card>
  );
}

export default defineSpecimen({
  id: 'tag',
  title: 'Tag, TagGroup & Chip',
  group: 'Status',
  summary: 'Metadata labels and live filter choices share compact, theme-owned plates.',
  sections: [
    {
      id: 'roles',
      title: 'Metadata & filter choices',
      kind: 'matrix',
      render: () => (
        <div className="display-example-stack">
          <TagGroup>
            <Tag>Infrastructure</Tag>
            <Tag status="accent">Architecture</Tag>
            <Tag status="success">Verified</Tag>
            <Tag status="warning">Needs review</Tag>
            <Tag status="danger">Deprecated</Tag>
          </TagGroup>
          <div className="display-example-row">
            <Chip>All documents</Chip>
            <Chip defaultSelected>Verified only</Chip>
            <Chip icon={<FolderIcon size="1em" />}>Runbooks</Chip>
          </div>
        </div>
      ),
    },
    {
      id: 'content',
      title: 'Long labels, removal & unavailable state',
      kind: 'states',
      render: () => (
        <TagGroup>
          <Tag size="m" onRemove={() => undefined}>
            Regional connection-draining and failover coordination
          </Tag>
          <Tag disabled onRemove={() => undefined}>
            Locked policy
          </Tag>
          <Chip disabled defaultSelected>
            Required filter
          </Chip>
        </TagGroup>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Collection filters',
      kind: 'context',
      render: () => <FilterExample />,
    },
  ],
});
