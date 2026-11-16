import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Badge } from '../badge/badge.proto.js';
import { Table, TableScroll } from './table.proto.js';
import { Card, CardAction, CardHeader } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import '../card/display.examples.css';

const documents = [
  'ADR-014 Traffic Draining',
  'Redis Eviction Policy',
  'Zero-Downtime PG Failover',
];

function DirectoryExample(): ReactElement {
  const [ascending, setAscending] = useState(true);
  const rows = ascending ? documents : [...documents].reverse();
  return (
    <Card>
      <CardHeader>
        <Text size="body-s" weight="semibold">
          Recent documents
        </Text>
        <CardAction>
          {' '}
          <Text size="caption-l" color="muted">
            3 documents
          </Text>
        </CardAction>
      </CardHeader>
      <TableScroll aria-label="Recent documents">
        <Table>
          <thead>
            <tr>
              <th scope="col" aria-sort={ascending ? 'ascending' : 'descending'}>
                <button
                  type="button"
                  onClick={() => setAscending(!ascending)}
                  style={{
                    padding: 0,
                    border: 0,
                    background: 'transparent',
                    color: 'inherit',
                    cursor: 'pointer',
                  }}
                >
                  Document {ascending ? '↑' : '↓'}
                </button>
              </th>
              <th scope="col">Status</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((title) => (
              <tr key={title}>
                <th scope="row">{title}</th>
                <td>
                  <Badge status="success" dot>
                    Verified
                  </Badge>
                </td>
                <td>2 hours ago</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </TableScroll>
    </Card>
  );
}

export default defineSpecimen({
  id: 'table',
  title: 'Table',
  group: 'Data',
  summary: 'Native table anatomy with quiet separators and a bounded scrolling viewport.',
  sections: [
    {
      id: 'density',
      title: 'Table sizes',
      kind: 'matrix',
      render: () => (
        <div className="display-example-stack">
          {(['s', 'm', 'l'] as const).map((size) => (
            <TableScroll key={size} aria-label={`${size} table`}>
              <Table size={size}>
                <thead>
                  <tr>
                    <th scope="col">Document</th>
                    <th scope="col">Revision</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Traffic Draining</th>
                    <td>v3.3</td>
                  </tr>
                  <tr>
                    <th scope="row">Failover Procedure</th>
                    <td>v2.8</td>
                  </tr>
                </tbody>
              </Table>
            </TableScroll>
          ))}
        </div>
      ),
    },
    {
      id: 'overflow',
      title: 'Selection & long identifiers',
      kind: 'states',
      render: () => (
        <TableScroll aria-label="Selected document">
          <Table style={{ minInlineSize: 560 }}>
            <thead>
              <tr>
                <th scope="col">Document path</th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              <tr data-selected>
                <th scope="row">platform/networking/regional-traffic-draining-procedure</th>
                <td>
                  <Badge status="accent">Selected</Badge>
                </td>
              </tr>
              <tr>
                <th scope="row">platform/databases/postgresql-primary-rotation</th>
                <td>Verified</td>
              </tr>
            </tbody>
          </Table>
        </TableScroll>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Document directory',
      kind: 'context',
      render: () => <DirectoryExample />,
    },
  ],
});
