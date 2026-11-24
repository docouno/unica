import { useState } from 'react';
import { Divider, Stack, Text, Title } from '@docouno/unica';
import '@docouno/unica/styles.css';
import { Pagination } from '../../prototypes/pagination/pagination.proto.js';

const documents = [
  'Deployment checklist',
  'Service ownership',
  'Escalation contacts',
  'Rollback plan',
  'Traffic routing',
  'On-call handover',
  'Backup schedule',
  'Dependency inventory',
  'Service health checks',
  'Incident review',
  'Release notes',
];

const pageSize = 3;
const styles = `
  .document-collection {
    container: document-collection / inline-size;
    inline-size: min(100%, 360px);
    min-inline-size: 0;
  }

  .document-collection-list {
    --row-height: max(var(--size-s-height), calc(var(--text-size-body-s-lh) + 2 * var(--space-4) + 1px));
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .document-collection-list > li {
    box-sizing: border-box;
    display: grid;
    grid-template-rows: 1fr 1px;
    align-items: center;
    min-block-size: var(--row-height);
  }

  .document-collection-name { padding-block: var(--space-4); }
  .document-collection-footer {
    display: grid;
    align-items: center;
    gap: var(--space-8) var(--space-16);
    min-inline-size: 0;
  }

  @media not (pointer: coarse) {
    @container document-collection (inline-size >= 320px) {
      .document-collection-footer:has(nav) {
        grid-template-columns: minmax(0, 1fr) minmax(210px, 2fr);
        --pagination-align: end;
      }
    }
  }
`;

function DocumentCollection({ title = '', results = documents, subject = {} }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.ceil(results.length / pageSize);
  const offset = (page - 1) * pageSize;
  const visible = results.slice(offset, offset + pageSize);
  const first = offset + 1;
  const last = offset + visible.length;

  return (
    <section className="document-collection" aria-label={title}>
      <style href="document-collection-layout" precedence="examples">
        {styles}
      </style>
      <Stack gap={12}>
        <Title as="h3" size="body-m">
          {title}
        </Title>
        {visible.length === 0 ? (
          <Text size="body-s" color="secondary">
            No matching documents
          </Text>
        ) : (
          <>
            <ul
              className="document-collection-list"
              role="list"
              aria-label="Documents"
              style={{
                minBlockSize: pageCount > 1 ? `calc(${pageSize} * var(--row-height))` : undefined,
              }}
            >
              {visible.map((name, index) => (
                <li key={name}>
                  <Text className="document-collection-name" as="span" size="body-s">
                    {name}
                  </Text>
                  {index < visible.length - 1 && <Divider />}
                </li>
              ))}
            </ul>
            <Divider />
            <div className="document-collection-footer">
              <Text size="caption-l" color="secondary" role="status">
                <bdi>
                  {first === last ? first : `${first}–${last}`} of {results.length}
                </bdi>
              </Text>
              {pageCount > 1 && (
                <Pagination
                  {...subject}
                  size="s"
                  format="pages"
                  label="Document result pages"
                  pageCount={pageCount}
                  page={page}
                  onPageChange={setPage}
                />
              )}
            </div>
          </>
        )}
      </Stack>
    </section>
  );
}

export function RelatedDocuments({ subject = {} } = {}) {
  return <DocumentCollection title="Related documents" results={documents} subject={subject} />;
}

export function CollectionFooter({ subject = {} } = {}) {
  return (
    <Stack gap={24} style={{ inlineSize: '100%', minInlineSize: 0 }}>
      <RelatedDocuments subject={subject} />
      <DocumentCollection title="Pinned documents" results={documents.slice(0, 2)} />
      <DocumentCollection title="Filtered documents" results={[]} />
    </Stack>
  );
}
