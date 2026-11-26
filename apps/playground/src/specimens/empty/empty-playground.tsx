import {
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@docouno/unica';
import { FileTextIcon } from '@phosphor-icons/react';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import type { EmptyValues } from './empty.spec.js';

interface PlaygroundProps extends PreviewProps {
  readonly values: EmptyValues;
}

export function EmptyPlayground({
  ctx,
  values: { size, align, as, heading, icon, color, children, description, actionLabel },
}: PlaygroundProps): ReactElement {
  return (
    <Empty
      {...ctx.subject}
      size={size}
      align={align}
      data-empty-comparison={ctx.tab === 'states' ? '' : undefined}
    >
      <EmptyMedia icon={icon === 'document' ? FileTextIcon : undefined} color={color}>
        {children === 'landscape' && (
          <img src="/assets/empty-landscape.svg" alt="" width="240" height="180" />
        )}
      </EmptyMedia>
      {heading.trim() && (
        <EmptyTitle as={as}>
          <bdi>{heading}</bdi>
        </EmptyTitle>
      )}
      {description.trim() && (
        <EmptyDescription>
          <bdi>{description}</bdi>
        </EmptyDescription>
      )}
      {actionLabel.trim() && (
        <EmptyActions>
          <Button asChild tone="accent" variant="secondary">
            <a
              href="/?item=03-document-collection"
              onClick={() => ctx.action('onBrowse')(actionLabel)}
            >
              {actionLabel}
            </a>
          </Button>
        </EmptyActions>
      )}
    </Empty>
  );
}
