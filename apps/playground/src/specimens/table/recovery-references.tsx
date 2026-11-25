import { useId, useState } from 'react';
import { Flex, Link, Stack, Text, Title } from '@docouno/unica';
import { Pagination } from '../../prototypes/pagination/pagination.proto.js';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableScroll,
} from '../../prototypes/table/table.proto.js';
import '@docouno/unica/styles.css';

const policiesByPage = [
  [
    ['Zero-Downtime PG Failover', 'Runbook', '18 Oct'],
    ['regionalFailoverVerificationChecklist', 'Runbook', '12 Oct'],
    ['Post-recovery write audit', 'Checklist', '03 Oct'],
  ],
  [
    ['Volume snapshots', 'Reference', '27 Sep'],
    ['Validate read replicas', 'Checklist', '20 Sep'],
    ['Restore point retention', 'Policy', '19 Sep'],
  ],
];

export function ReferenceIndex({ documentHref = '', subject = {} } = {}) {
  const runbookId = useId();
  const captionId = useId();
  const [page, setPage] = useState(1);
  return (
    <Stack gap={16}>
      <TableScroll aria-labelledby={captionId}>
        <Table {...subject} size="s">
          <TableCaption id={captionId}>Recovery references</TableCaption>
          <TableHeader>
            <TableRow>
              <TableColumnHeader>Document</TableColumnHeader>
              <TableColumnHeader style={{ whiteSpace: 'nowrap' }}>Kind</TableColumnHeader>
              <TableColumnHeader align="end" style={{ whiteSpace: 'nowrap' }}>
                Revised
              </TableColumnHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(policiesByPage[page - 1] ?? []).map(([name, kind, date]) => (
              <TableRow key={name}>
                <TableRowHeader>
                  {name === 'Zero-Downtime PG Failover' ? (
                    <Link href={documentHref || '#' + runbookId}>Zero-Downtime PG Failover</Link>
                  ) : (
                    <bdi>{name}</bdi>
                  )}
                </TableRowHeader>
                <TableCell style={{ inlineSize: '25%', whiteSpace: 'nowrap' }}>{kind}</TableCell>
                <TableCell align="end" style={{ inlineSize: '16%' }}>
                  <bdi style={{ whiteSpace: 'nowrap' }}>{date}</bdi>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScroll>
      <Flex gap={8} wrap="wrap" align="center" justify="space-between">
        <Text size="caption-l" color="muted" role="status">
          <bdi>{page === 1 ? '1–3 of 6 documents' : '4–6 of 6 documents'}</bdi>
        </Text>
        <div style={{ inlineSize: 'min(100%, 12rem)', marginInlineStart: 'auto' }}>
          <Pagination
            label="Recovery references pages"
            format="compact"
            page={page}
            pageCount={2}
            size="s"
            onPageChange={setPage}
          />
        </div>
      </Flex>
      {!documentHref && (
        <article id={runbookId} tabIndex={-1} aria-labelledby={runbookId + '-heading'}>
          <Stack gap={4}>
            <Title as="h2" size="body-m" id={runbookId + '-heading'}>
              Zero-Downtime PG Failover
            </Title>
            <Text size="body-s">
              <bdi>
                Before promoting the standby, confirm that synchronous replication has caught up and
                pause schema migrations.
              </bdi>
            </Text>
          </Stack>
        </article>
      )}
    </Stack>
  );
}
