import { Stack, Title } from '@docouno/unica';
import '@docouno/unica/styles.css';
import { Breadcrumb, BreadcrumbLink } from '../../prototypes/breadcrumb/breadcrumb.proto.js';

export function BreadcrumbOverlayExample({
  workspaceHref = '/workspace',
  runbooksHref = '/runbooks',
  subject = {},
} = {}) {
  return (
    <section
      aria-label="Document details"
      className="unica-overlay-surface"
      data-surface="overlay"
      style={{
        position: 'relative',
        inlineSize: 'min(22rem, calc(100% - var(--space-16)))',
        padding: 'var(--surface-m-padding)',
        margin: 'var(--space-8)',
      }}
    >
      <Stack gap={4}>
        <Breadcrumb {...subject} size="s" underline="hover" aria-label="Document ancestors">
          <BreadcrumbLink href={workspaceHref}>Platform Eng</BreadcrumbLink>
          <BreadcrumbLink href={runbooksHref}>Runbooks</BreadcrumbLink>
        </Breadcrumb>
        <Title as="h3" size="heading-s">
          Failover guide
        </Title>
      </Stack>
    </section>
  );
}
