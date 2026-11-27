import type { ReactElement } from 'react';
import { CollectionFooter } from '../../../src/specimens/pagination/pagination-collection.example.js';
import { ReferenceIndex } from '../../../src/specimens/table/recovery-references.js';

export default function PaginationConsumers(): ReactElement {
  return (
    <>
      <div style={{ inlineSize: 278, padding: 4 }} data-testid="references">
        <ReferenceIndex />
      </div>
      <div style={{ inlineSize: 360, padding: 4 }} data-testid="collection">
        <CollectionFooter />
      </div>
    </>
  );
}
