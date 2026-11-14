import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Pagination } from './pagination.proto.js';
import { Card, CardFooter } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import '../card/display.examples.css';

function CollectionExample(): ReactElement {
  const [page, setPage] = useState(1);
  return (
    <Card>
      <Text size="body-s" weight="semibold">
        Engineering documents
      </Text>
      <Text size="body-s" color="secondary">
        The current page is {page}. Use Previous, Next, or a page number.
      </Text>
      <CardFooter>
        <Text size="caption-l" color="muted">
          {(page - 1) * 20 + 1}–{Math.min(page * 20, 128)} of 128 documents
        </Text>
        <Pagination page={page} pageCount={7} onPageChange={setPage} />
      </CardFooter>
    </Card>
  );
}

export default defineSpecimen({
  id: 'pagination',
  title: 'Pagination',
  group: 'Navigation',
  summary: 'Small native page actions with clear boundaries and a factual current page.',
  sections: [
    {
      id: 'ranges',
      title: 'Short & long ranges',
      kind: 'matrix',
      render: () => (
        <div className="display-example-stack">
          <Pagination pageCount={3} />
          <Pagination pageCount={20} defaultPage={10} />
        </div>
      ),
    },
    {
      id: 'boundaries',
      title: 'First, last & unavailable',
      kind: 'states',
      render: () => (
        <div className="display-example-stack">
          <Pagination pageCount={1} />
          <Pagination pageCount={20} defaultPage={20} />
          <Pagination pageCount={5} disabled />
        </div>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Document directory',
      kind: 'context',
      render: CollectionExample,
    },
  ],
});
