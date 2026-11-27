import { Breadcrumb, BreadcrumbLink, BreadcrumbPage, Icon, Stack, Text } from '@docouno/unica';
import { CaretRightIcon, HouseIcon } from '@phosphor-icons/react';
import type { ReactElement, ReactNode } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { breadcrumbDestinations } from './breadcrumb-destinations.js';

function TrailStudy({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Stack gap={4}>
      <Text size="caption-l" color="muted">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

export function BreadcrumbAnatomy({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16}>
      <TrailStudy label="Icon root and directional separator">
        <Breadcrumb
          {...ctx.subject}
          aria-label="Runbook location"
          separator={<Icon usage="slot" icon={CaretRightIcon} directional />}
        >
          <BreadcrumbLink
            href={breadcrumbDestinations.workspace}
            iconOnly
            aria-label="Workspace home"
          >
            <Icon usage="slot" icon={HouseIcon} />
          </BreadcrumbLink>
          <BreadcrumbLink href={breadcrumbDestinations.runbooks}>Runbooks</BreadcrumbLink>
          <BreadcrumbPage>Failover guide</BreadcrumbPage>
        </Breadcrumb>
      </TrailStudy>
      <TrailStudy label="Static intermediate group">
        <Breadcrumb {...ctx.subject} aria-label="Incident response location">
          <BreadcrumbLink href={breadcrumbDestinations.workspace}>Platform Eng</BreadcrumbLink>
          <span>Incident response</span>
          <BreadcrumbPage>Failover guide</BreadcrumbPage>
        </Breadcrumb>
      </TrailStudy>
      <TrailStudy label="Spacing-only separator">
        <Breadcrumb {...ctx.subject} aria-label="Runbooks, spacing-only" separator={null}>
          <BreadcrumbLink href={breadcrumbDestinations.workspace}>Platform Eng</BreadcrumbLink>
          <BreadcrumbPage>Runbooks</BreadcrumbPage>
        </Breadcrumb>
      </TrailStudy>
      <TrailStudy label="Current page only">
        <Breadcrumb {...ctx.subject} aria-label="Workspace location">
          <BreadcrumbPage>Platform Eng</BreadcrumbPage>
        </Breadcrumb>
      </TrailStudy>
      <TrailStudy label="Current permalink without ancestor underlines">
        <Breadcrumb {...ctx.subject} aria-label="Current document permalink" underline="none">
          <BreadcrumbLink href={breadcrumbDestinations.workspace}>Platform Eng</BreadcrumbLink>
          <BreadcrumbLink href={breadcrumbDestinations.runbooks}>Runbooks</BreadcrumbLink>
          <BreadcrumbLink href={breadcrumbDestinations.guide} aria-current="page">
            Failover guide
          </BreadcrumbLink>
        </Breadcrumb>
      </TrailStudy>
    </Stack>
  );
}

export function BreadcrumbLinkStates({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16}>
      <TrailStudy label="Live links">
        <Breadcrumb {...ctx.subject} aria-label="Interactive path">
          <BreadcrumbLink
            href={breadcrumbDestinations.workspace}
            iconOnly
            aria-label="Workspace home"
          >
            <Icon usage="slot" icon={HouseIcon} />
          </BreadcrumbLink>
          <BreadcrumbLink href={breadcrumbDestinations.runbooks} underline="hover">
            Runbooks
          </BreadcrumbLink>
          <BreadcrumbLink href={breadcrumbDestinations.guide} aria-current="page">
            Failover guide
          </BreadcrumbLink>
        </Breadcrumb>
      </TrailStudy>
      <TrailStudy label="Unavailable ancestor">
        <Breadcrumb {...ctx.subject} aria-label="Unpublished runbooks path">
          <BreadcrumbLink href={breadcrumbDestinations.workspace}>Workspace</BreadcrumbLink>
          <BreadcrumbLink disabled>Runbooks</BreadcrumbLink>
          <BreadcrumbPage>Failover guide</BreadcrumbPage>
        </Breadcrumb>
      </TrailStudy>
      <TrailStudy label="Unavailable current permalink">
        <Breadcrumb {...ctx.subject} aria-label="Unpublished guide path">
          <BreadcrumbLink href={breadcrumbDestinations.workspace}>Workspace</BreadcrumbLink>
          <BreadcrumbLink href={breadcrumbDestinations.runbooks}>Runbooks</BreadcrumbLink>
          <BreadcrumbLink disabled aria-current="page">
            Failover guide
          </BreadcrumbLink>
        </Breadcrumb>
      </TrailStudy>
    </Stack>
  );
}

export function BreadcrumbWrapping({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16} style={{ inlineSize: 'min(100%, 320px)' }}>
      <TrailStudy label="Deep path">
        <Breadcrumb {...ctx.subject} aria-label="Deep incident response path">
          <BreadcrumbLink href={breadcrumbDestinations.workspace}>Platform Eng</BreadcrumbLink>
          <BreadcrumbLink href={breadcrumbDestinations.runbooks}>Runbooks</BreadcrumbLink>
          <span>Incident response</span>
          <span>Database reliability</span>
          <BreadcrumbPage>Regional failover and client connection recovery</BreadcrumbPage>
        </Breadcrumb>
      </TrailStudy>
      <TrailStudy label="Long identifier and current permalink">
        <Breadcrumb {...ctx.subject} aria-label="Runbook identifier path">
          <BreadcrumbLink href={breadcrumbDestinations.workspace}>Platform Eng</BreadcrumbLink>
          <BreadcrumbLink href={breadcrumbDestinations.runbooks}>
            DatabaseReliabilityAndDisasterRecoveryRunbooks
          </BreadcrumbLink>
          <BreadcrumbLink href={breadcrumbDestinations.guide} aria-current="page">
            <bdi>Zero-downtime PostgreSQL failover</bdi>
          </BreadcrumbLink>
        </Breadcrumb>
      </TrailStudy>
    </Stack>
  );
}
