import type { ReactElement, ReactNode } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { CollectionFooter, RelatedDocuments } from './pagination-collection.example.js';

function CollectionPanel({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      className="unica-overlay-surface"
      data-surface="overlay"
      style={{
        position: 'relative',
        inlineSize: 'min(100%, 360px)',
        minInlineSize: 0,
        padding: 'var(--surface-m-padding)',
      }}
    >
      {children}
    </div>
  );
}

export function PaginationCollectionCase({ ctx }: PreviewProps): ReactElement {
  return (
    <CollectionPanel>
      <RelatedDocuments subject={ctx.subject} />
    </CollectionPanel>
  );
}

export function PaginationCollectionComposition({ ctx }: PreviewProps): ReactElement {
  const content = <CollectionFooter subject={ctx.subject} />;
  return ctx.surface === 'overlay' ? <CollectionPanel>{content}</CollectionPanel> : content;
}
