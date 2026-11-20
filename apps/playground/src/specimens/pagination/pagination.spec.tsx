import { useState, useSyncExternalStore } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { defineComponent } from '../../workbench/types.js';
import { PopoverContent } from '../../prototypes/popover/popover.proto.js';
import { Text } from '../../prototypes/text/text.proto.js';
import { Title } from '../../prototypes/title/title.proto.js';
import { Pagination } from '../../prototypes/pagination/pagination.proto.js';
import '../../prototypes/pagination/pagination.examples.css';

function Sample({ caption, children }: { caption: string; children: ReactNode }): ReactElement {
  return (
    <div className="pagination-study-sample">
      <Text size="caption-l" color="secondary">
        {caption}
      </Text>
      {children}
    </div>
  );
}

function Sizes(): ReactElement {
  return (
    <div className="pagination-study-stack">
      <Sample caption="Small · 30 px">
        <Pagination
          size="s"
          format="pages"
          pageCount={3}
          defaultPage={2}
          label="Small pagination"
        />
      </Sample>
      <Sample caption="Medium · 40 px">
        <Pagination format="pages" pageCount={3} defaultPage={2} label="Medium pagination" />
      </Sample>
      <Sample caption="Large · 48 px">
        <Pagination
          size="l"
          format="pages"
          pageCount={3}
          defaultPage={2}
          label="Large pagination"
        />
      </Sample>
    </div>
  );
}

function Windows(): ReactElement {
  return (
    <div className="pagination-study-stack">
      <Sample caption="Seven pages · all visible">
        <Pagination size="s" format="pages" pageCount={7} defaultPage={4} label="Seven pages" />
      </Sample>
      <Sample caption="24 pages · starts at page 1">
        <Pagination size="s" format="pages" pageCount={24} label="Start of range" />
      </Sample>
      <Sample caption="24 pages · starts at page 12">
        <Pagination
          size="s"
          format="pages"
          pageCount={24}
          defaultPage={12}
          label="Middle of range"
        />
      </Sample>
      <Sample caption="24 pages · starts at page 24">
        <Pagination size="s" format="pages" pageCount={24} defaultPage={24} label="End of range" />
      </Sample>
      <Sample caption="Eight pages · a single omission resolves to a number">
        <Pagination size="s" format="pages" pageCount={8} defaultPage={5} label="Eight pages" />
      </Sample>
      <Sample caption="12,840 pages · equal-width number slots">
        <Pagination format="pages" pageCount={12840} defaultPage={999} label="Five-digit pages" />
      </Sample>
    </div>
  );
}

function States(): ReactElement {
  return (
    <div className="pagination-study-stack">
      <Sample caption="Hover 1 · current and focus 2 · press 3 · focus 4 · pinned">
        <Pagination
          size="s"
          format="pages"
          pageCount={4}
          page={2}
          preview={{ 1: 'hover', 2: 'focus', 3: 'pressed', 4: 'focus' }}
          label="Pinned pointer and focus states"
        />
      </Sample>
      <Sample caption="Two pages · activate either arrow with Enter or Space">
        <Pagination size="s" format="pages" pageCount={2} label="Two-page boundary example" />
      </Sample>
    </div>
  );
}

function Compact(): ReactElement {
  return (
    <div className="pagination-study-stack">
      <Sample caption="Narrow column · sequential navigation">
        <div className="pagination-study-narrow">
          <Pagination pageCount={24} defaultPage={4} label="Compact pagination" />
        </div>
      </Sample>
      <Sample caption="Large type and five-digit page counts">
        <div className="pagination-study-narrow">
          <Pagination
            size="l"
            pageCount={12840}
            defaultPage={999}
            label="Compact five-digit pages"
          />
        </div>
      </Sample>
      <Sample caption="Two pages · try either boundary">
        <Pagination size="s" format="compact" pageCount={2} label="Compact boundary example" />
      </Sample>
    </div>
  );
}

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
] as const;

function DocumentCollection({
  title,
  results,
}: {
  title: string;
  results: readonly string[];
}): ReactElement {
  const [page, setPage] = useState(1);
  const pageSize = 3;
  const offset = (page - 1) * pageSize;
  const visible = results.slice(offset, offset + pageSize);
  const range =
    visible.length === 1 ? String(offset + 1) : `${offset + 1}–${offset + visible.length}`;

  return (
    <section className="pagination-study-collection" aria-label={title}>
      <Title as="h3" size="body-m">
        {title}
      </Title>
      {visible.length === 0 ? (
        <Text size="body-s" color="secondary">
          No matching documents
        </Text>
      ) : (
        <>
          <ul className="pagination-study-documents" role="list" aria-label="Documents">
            {visible.map((name) => (
              <li key={name}>
                <Text as="span" size="body-s">
                  {name}
                </Text>
              </li>
            ))}
          </ul>
          <div className="pagination-study-footer">
            <Text size="caption-l" color="secondary" role="status">
              <bdi>
                {range} of {results.length}
              </bdi>
            </Text>
            <Pagination
              size="s"
              format="pages"
              label="Document result pages"
              pageCount={Math.ceil(results.length / pageSize)}
              page={page}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </section>
  );
}

function subscribeToPage(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

function readLinkedPage(): number {
  const match = /^#pagination-page-([1-7])$/.exec(window.location.hash);
  return match ? Number(match[1]) : 1;
}

function LinkExample(): ReactElement {
  const page = useSyncExternalStore(subscribeToPage, readLinkedPage, () => 1);

  return (
    <div className="pagination-study-sample">
      <Text size="caption-l" color="secondary" role="status">
        Archive · page {page} of 7
      </Text>
      <Pagination
        label="Archive pages"
        format="pages"
        size="s"
        pageCount={7}
        page={page}
        getPageHref={(number) => `#pagination-page-${number}`}
      />
    </div>
  );
}

export default defineComponent({
  id: 'pagination',
  title: 'Pagination',
  category: 'Navigation',
  status: 'Proto',
  summary: 'Move through a collection with known page numbers and a stable navigation row.',
  props: {
    size: {
      kind: 'enum',
      group: 'Layout',
      default: 'm',
      description: 'Size of the page controls.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    format: {
      kind: 'enum',
      group: 'Layout',
      default: 'pages',
      description: 'Show page numbers or a compact current-page summary.',
      choices: [{ value: 'pages' }, { value: 'compact' }],
    },
    pageCount: {
      kind: 'number',
      group: 'Pages',
      default: 12,
      description: 'Total pages. Below two pages the component is absent.',
      examples: [1, 5, 12, 42],
    },
    defaultPage: {
      kind: 'number',
      group: 'Pages',
      default: 1,
      description: 'Initial page, bounded by the total page count.',
      examples: [1, 6, 12],
    },
    onPageChange: {
      kind: 'action',
      group: 'Events',
      description: 'Reports the newly selected page.',
      code: 'handlePageChange',
    },
  },
  code: (values) =>
    `<Pagination pageCount={${values.pageCount}}${values.size === 'm' ? '' : ` size="${values.size}"`} format="${values.format}"${values.defaultPage === 1 ? '' : ` defaultPage={${values.defaultPage}}`} onPageChange={handlePageChange} />`,
  render: ({ values, ctx }) => (
    <div style={{ inlineSize: '100%' }}>
      <Pagination
        {...ctx.subject}
        key={values.defaultPage}
        pageCount={values.pageCount}
        defaultPage={values.defaultPage}
        size={values.size}
        format={values.format}
        onPageChange={ctx.action('onPageChange')}
      />
    </div>
  ),
  matrixViews: [
    {
      id: 'sizes',
      title: 'Control sizes',
      rows: 'size',
      cols: 'format',
      reference: () => <Sizes />,
    },
    {
      id: 'ranges',
      title: 'Numbered windows',
      rows: 'pageCount',
      cols: 'defaultPage',
      reference: () => <Windows />,
    },
  ],
  cases: [
    {
      id: 'states',
      title: 'Pointer, focus and boundaries',
      kind: 'behavior',
      render: () => <States />,
    },
    {
      id: 'compact',
      title: 'Compact in narrow columns',
      kind: 'behavior',
      render: () => <Compact />,
    },
    {
      id: 'links',
      title: 'Addressable pages',
      kind: 'behavior',
      render: () => <LinkExample />,
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => (
        <PopoverContent role="presentation" className="pagination-study-panel">
          <DocumentCollection title="Related documents" results={documents} />
        </PopoverContent>
      ),
    },
  ],
  usage: [
    {
      id: 'context',
      title: 'Collection footer',
      code: `<>
  <ul aria-label="Documents">
    {visible.map((name) => <li key={name}>{name}</li>)}
  </ul>
  <div>
    <span role="status">{range} of {results.length}</span>
    <Pagination size="s" format="pages" label="Document result pages"
      pageCount={Math.ceil(results.length / pageSize)} page={page} onPageChange={setPage} />
  </div>
</>`,
      render: () => (
        <div className="pagination-study-collections">
          <DocumentCollection title="Related documents" results={documents} />
          <DocumentCollection title="Pinned documents" results={documents.slice(0, 2)} />
          <DocumentCollection title="Filtered documents" results={[]} />
        </div>
      ),
    },
  ],
});
