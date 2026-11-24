import { Button } from '@docouno/unica';
import { FileTextIcon } from '@phosphor-icons/react';
import type { ReactElement } from 'react';
import {
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '../../prototypes/empty/empty.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import type { EmptyValues } from './empty.spec.js';

interface PlaygroundProps extends PreviewProps {
  readonly values: EmptyValues;
}

export function EmptyPlayground({
  ctx,
  values: { size, align, heading, media },
}: PlaygroundProps): ReactElement {
  return (
    <Empty
      {...ctx.subject}
      size={size}
      align={align}
      data-empty-comparison={ctx.tab === 'states' ? '' : undefined}
    >
      {media === 'icon' && <EmptyMedia icon={FileTextIcon} />}
      {heading.trim() && (
        <EmptyTitle>
          <bdi>{heading}</bdi>
        </EmptyTitle>
      )}
      <EmptyDescription>
        <bdi>Save a page to keep it close at hand.</bdi>
      </EmptyDescription>
      <EmptyActions>
        <Button asChild tone="accent" variant="secondary">
          <a
            href="/?item=03-document-collection"
            onClick={() => ctx.action('onBrowse')('Browse pages')}
          >
            Browse pages
          </a>
        </Button>
      </EmptyActions>
    </Empty>
  );
}
