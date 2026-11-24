import { Icon } from '@docouno/unica';
import { CaretRightIcon } from '@phosphor-icons/react';
import type { ReactElement } from 'react';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../../prototypes/breadcrumb/breadcrumb.proto.js';
import type { PreviewProps } from '../../workbench/types.js';
import { breadcrumbDestinations } from './breadcrumb-destinations.js';
import type { BreadcrumbValues } from './breadcrumb.spec.js';
import './breadcrumb-matrix.css';

interface PlaygroundProps extends PreviewProps {
  readonly values: BreadcrumbValues;
}

export function BreadcrumbPlayground({
  ctx,
  values: { size, underline, separator, page },
}: PlaygroundProps): ReactElement {
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
      {page.trim() ? (
        <BreadcrumbPage>
          <bdi>{page}</bdi>
        </BreadcrumbPage>
      ) : null}
    </Breadcrumb>
  );
}
