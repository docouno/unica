import { useId, useState } from 'react';
import { Link, Pagination, Stack, Text, Title } from '@docouno/unica';
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

const footerStyles = `
  .recovery-reference-pages {
    container: recovery-reference-pages / inline-size;
  }

  .recovery-reference-footer {
    display: grid;
    align-items: center;
    gap: var(--space-8);
  }

  @container recovery-reference-pages (inline-size >= 360px) {
    .recovery-reference-footer {
      grid-template-columns: minmax(0, 1fr) 12rem;
    }

    .recovery-reference-footer > nav { justify-items: end; }
  }
`;

const cellInset = {
  paddingInline: 'clamp(var(--space-2), 4% - var(--space-16), var(--table-cell-x))',
};

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
              <TableColumnHeader style={cellInset}>Document</TableColumnHeader>
              <TableColumnHeader style={{ ...cellInset, whiteSpace: 'nowrap' }}>
                Kind
              </TableColumnHeader>
              <TableColumnHeader align="end" style={{ ...cellInset, whiteSpace: 'nowrap' }}>
                Revised
              </TableColumnHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(policiesByPage[page - 1] ?? []).map(([name, kind, date]) => (
              <TableRow key={name}>
                <TableRowHeader style={cellInset}>
                  {name === 'Zero-Downtime PG Failover' ? (
                    <Link href={documentHref || '#' + runbookId}>Zero-Downtime PG Failover</Link>
                  ) : (
                    <bdi>{name}</bdi>
                  )}
                </TableRowHeader>
                <TableCell style={{ ...cellInset, inlineSize: '25%', whiteSpace: 'nowrap' }}>
                  {kind}
                </TableCell>
                <TableCell align="end" style={{ ...cellInset, inlineSize: '16%' }}>
                  <bdi style={{ whiteSpace: 'nowrap' }}>{date}</bdi>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableScroll>
      <div className="recovery-reference-pages">
        <style href="recovery-reference-footer-layout" precedence="examples">
          {footerStyles}
        </style>
        <div className="recovery-reference-footer">
          <Text size="caption-l" color="muted" role="status">
            <bdi>{page === 1 ? '1–3 of 6 documents' : '4–6 of 6 documents'}</bdi>
          </Text>
          <Pagination
            aria-label="Recovery references pages"
            format="compact"
            page={page}
            pageCount={2}
            size="s"
            onPageChange={setPage}
          />
        </div>
      </div>
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
