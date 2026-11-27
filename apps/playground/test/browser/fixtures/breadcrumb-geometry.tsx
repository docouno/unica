import { Breadcrumb, BreadcrumbLink, BreadcrumbPage, Icon } from '@docouno/unica';
import { CaretRightIcon, HouseIcon } from '@phosphor-icons/react';
import type { JSX } from 'react';
import { ExampleSurface } from '../../../src/specimens/shared/example-surface.js';
import { UnicaUnderlay } from '../../../src/unica.workbench.shared.js';

export default function BreadcrumbGeometryFixture(): JSX.Element {
  const overlay = document.documentElement.dataset.surface === 'overlay';
  return (
    <div
      data-testid="geometry-stage"
      style={{
        position: 'relative',
        background: 'var(--bg-canvas)',
        padding: 'var(--space-8)',
      }}
    >
      {overlay && <UnicaUnderlay />}
      <div
        style={{
          position: 'relative',
          inlineSize: 'min(100% - 16px, 320px)',
          marginInline: 'auto',
        }}
      >
        <ExampleSurface surface={overlay ? 'overlay' : 'base'}>
          <Breadcrumb
            aria-label="Long trail"
            underline="hover"
            separator={<Icon icon={CaretRightIcon} usage="slot" directional />}
          >
            <BreadcrumbLink href="#home" iconOnly aria-label="Home" data-testid="geometry-home">
              <Icon icon={HouseIcon} usage="slot" />
            </BreadcrumbLink>
            <BreadcrumbLink href="#operations" data-testid="geometry-ancestor">
              Operations
            </BreadcrumbLink>
            <span>Incident response</span>
            <BreadcrumbLink href="#runbooks" data-testid="geometry-word">
              DatabaseReliabilityAndDisasterRecoveryRunbooks
            </BreadcrumbLink>
            <BreadcrumbLink
              href="#guide"
              data-testid="geometry-current"
              aria-current="page"
              underline="none"
            >
              <bdi>Regional failover and client connection recovery</bdi>
            </BreadcrumbLink>
          </Breadcrumb>
          <Breadcrumb aria-label="Static trail">
            <BreadcrumbLink disabled data-testid="geometry-disabled">
              Archive
            </BreadcrumbLink>
            <BreadcrumbPage data-testid="geometry-page">Failover guide</BreadcrumbPage>
          </Breadcrumb>
        </ExampleSurface>
      </div>
    </div>
  );
}
