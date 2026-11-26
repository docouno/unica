import { useRef, useState } from 'react';
import { CloudSlashIcon, FileMagnifyingGlassIcon } from '@phosphor-icons/react';
import {
  Button,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  Grid,
  Stack,
  Text,
  Title,
} from '@docouno/unica';

export function EmptyRoutes({
  emptyProps = {},
  workspaceHref = '/workspace',
  illustrationSrc = '',
} = {}) {
  const [loaded, setLoaded] = useState(false);
  const moveFocus = useRef(false);

  return (
    <Grid
      gap={24}
      style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 22.5rem), 1fr))',
        alignItems: 'center',
        rowGap: 'var(--space-48)',
        paddingBlock: 'var(--space-24)',
      }}
    >
      <Empty {...emptyProps} size="l">
        <EmptyMedia icon={FileMagnifyingGlassIcon}>
          {illustrationSrc && <img src={illustrationSrc} alt="" width="240" height="180" />}
        </EmptyMedia>
        <EmptyTitle as="h1">Page not found</EmptyTitle>
        <EmptyDescription>
          <bdi>This page may have moved, or the address may be incorrect.</bdi>
        </EmptyDescription>
        <EmptyActions>
          <Button asChild>
            <a href={workspaceHref}>Back to workspace</a>
          </Button>
        </EmptyActions>
      </Empty>
      {loaded ? (
        <Stack gap={8}>
          <Title
            as="h1"
            size="heading-xl"
            tabIndex={-1}
            ref={(heading) => {
              if (heading && moveFocus.current) {
                moveFocus.current = false;
                if (heading.ownerDocument.activeElement === heading.ownerDocument.body) {
                  heading.focus();
                }
              }
            }}
          >
            Workspace updates
          </Title>
          <Text>
            <bdi>Read-only links are now available for shared documents.</bdi>
          </Text>
        </Stack>
      ) : (
        <Empty {...emptyProps} size="l">
          <EmptyMedia icon={CloudSlashIcon} color="danger" />
          <EmptyTitle as="h1">We couldn’t open this page</EmptyTitle>
          <EmptyDescription>
            <bdi>The server ran into a problem. Try reloading the page in a moment.</bdi>
          </EmptyDescription>
          <EmptyActions>
            <Button
              type="button"
              onClick={(event) => {
                moveFocus.current = event.currentTarget.matches(':focus');
                setLoaded(true);
              }}
            >
              Reload page
            </Button>
            <Button asChild variant="secondary" tone="neutral">
              <a href={workspaceHref}>Back to workspace</a>
            </Button>
          </EmptyActions>
        </Empty>
      )}
    </Grid>
  );
}
