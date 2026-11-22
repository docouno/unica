import { Alert, Card, Link, Text } from '@docouno/unica';
import type { ComponentProps, ReactElement } from 'react';
import { AppShell } from '../../../src/prototypes/app-shell/app-shell.proto.js';
import { unicaWorkbenchBase } from '../../../src/unica.workbench.shared.js';

const statuses = ['neutral', 'info', 'success', 'warning', 'danger'] as const;
const underlines = ['always', 'hover', 'none'] as const;

function DrawnSurface({ overlay }: { readonly overlay: boolean }): ReactElement {
  const preset = document.documentElement.dataset.theme;
  const theme = unicaWorkbenchBase.themes.find(({ id }) => id === preset);
  if (!theme) {
    throw new Error('Missing theme for the Link surface fixture.');
  }
  const contents = (
    <div
      style={{
        padding: 32,
        background: overlay ? 'var(--bg-overlay)' : 'var(--bg-canvas)',
        backdropFilter: overlay ? 'var(--_overlay-backdrop)' : undefined,
      }}
    >
      <Link href="#destination" data-testid="surface-link">
        Read the guide
      </Link>{' '}
      <Link href="#destination" aria-current="page" underline="none" data-testid="surface-current">
        Current guide
      </Link>{' '}
      <Link disabled href="#destination" data-testid="surface-disabled">
        Unavailable guide
      </Link>
    </div>
  );
  return (
    <>
      {unicaWorkbenchBase.renderStage?.({
        theme,
        surface: overlay ? 'overlay' : 'base',
        overlayStage: overlay,
        children: contents,
      })}
    </>
  );
}

function StatusProbe({
  status,
  underline,
}: {
  readonly status: NonNullable<ComponentProps<typeof Alert>['status']>;
  readonly underline: NonNullable<ComponentProps<typeof Link>['underline']>;
}): ReactElement {
  return (
    <Alert role="none" status={status}>
      <Text color="secondary">
        <Link
          tone="inherit"
          href="#destination"
          underline={underline}
          onClick={(event) => event.preventDefault()}
          data-testid={`${status}-${underline}`}
        >
          Read guidance
        </Link>
      </Text>
    </Alert>
  );
}

export default function LinkSurfacesFixture(): ReactElement {
  return (
    <>
      <DrawnSurface overlay={document.documentElement.dataset.surface === 'overlay'} />
      <AppShell minHeight={300}>
        <div style={{ padding: '12px' }}>
          <button type="button" data-testid="before-shell">
            Start
          </button>{' '}
          <a href="#destination" data-testid="plain-shell">
            Native anchor
          </a>
          <Alert role="none" status="danger">
            <Text color="secondary">
              <Link tone="inherit" href="#destination" data-testid="outer-context">
                Outer guidance
              </Link>
            </Text>
            <Card size="s">
              <Text color="secondary">
                <Link tone="inherit" href="#destination" data-testid="card-context">
                  Card guidance
                </Link>
              </Text>
            </Card>
            <div data-surface="overlay" style={{ background: 'var(--bg-overlay)', padding: 8 }}>
              <Link tone="inherit" href="#destination" data-testid="new-overlay-context">
                Overlay guidance
              </Link>
            </div>
            <Text color="secondary">
              <Link tone="inherit" href="#destination" data-testid="restored-context">
                More outer guidance
              </Link>
            </Text>
          </Alert>
        </div>
      </AppShell>
      <section
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6 }}
      >
        {statuses.flatMap((status) =>
          underlines.map((underline) => (
            <StatusProbe key={`${status}-${underline}`} status={status} underline={underline} />
          )),
        )}
      </section>
    </>
  );
}
