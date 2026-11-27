import { Breadcrumb, BreadcrumbLink, BreadcrumbPage, Icon } from '@docouno/unica';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { breadcrumbDestinations } from './breadcrumb-destinations.js';
import type { BreadcrumbValues } from './breadcrumb.spec.js';
import './breadcrumb-matrix.css';

interface PlaygroundProps extends PreviewProps {
  readonly values: BreadcrumbValues;
}

export function BreadcrumbPlayground({
  ctx,
  values: { size, underline, separator, page, current },
}: PlaygroundProps): ReactElement {
  const label = page.trim() ? <bdi>{page}</bdi> : null;
  return (
    <Breadcrumb
      {...ctx.subject}
      data-breadcrumb-comparison={ctx.tab === 'states' ? '' : undefined}
      size={size}
      underline={underline}
      separator={
        separator === 'none' ? null : separator === 'chevron' ? (
          <Icon usage="slot" icon={CaretRightIcon} directional />
        ) : undefined
      }
    >
      <BreadcrumbLink href={breadcrumbDestinations.workspace}>Workspace</BreadcrumbLink>
      <BreadcrumbLink href={breadcrumbDestinations.runbooks}>Runbooks</BreadcrumbLink>
      {label &&
        (current === 'page' ? (
          <BreadcrumbPage>{label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink
            href={breadcrumbDestinations.guide}
            aria-current="page"
            disabled={current === 'disabled'}
          >
            {label}
          </BreadcrumbLink>
        ))}
    </Breadcrumb>
  );
}
