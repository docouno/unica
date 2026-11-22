import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactElement, ReactNode } from 'react';
import {
  ArchiveBoxIcon,
  BellIcon,
  BellSlashIcon,
  CheckIcon,
  CloudSlashIcon,
  FolderSimpleIcon,
  LockKeyIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrayIcon,
} from '@phosphor-icons/react';
import { Button } from '../button/button.proto.js';
import { Card, CardTitle } from '../card/card.proto.js';
import { Input, Text, Title } from '@docouno/unica';
import { Empty, EmptyActions, EmptyDescription, EmptyMedia, EmptyTitle } from './empty.proto.js';
import './empty.examples.css';

function ExampleDescription({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <EmptyDescription>
      <bdi>{children}</bdi>
    </EmptyDescription>
  );
}

function EmptySizes(): ReactElement {
  return (
    <div className="empty-example-grid empty-example-scale">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="empty-example-size" key={size}>
          <Text as="span" size="caption-m" color="muted">
            {size.toUpperCase()}
          </Text>
          <Empty size={size}>
            <EmptyMedia icon={ArchiveBoxIcon} />
            <EmptyTitle>No archives</EmptyTitle>
            <ExampleDescription>Archived items appear here.</ExampleDescription>
          </Empty>
        </div>
      ))}
    </div>
  );
}

function EmptyCollections(): ReactElement {
  return (
    <div className="empty-example-grid empty-example-reasons">
      <Empty>
        <EmptyMedia icon={TrayIcon} />
        <EmptyTitle>Nothing shared yet</EmptyTitle>
        <ExampleDescription>Items shared with you will appear here.</ExampleDescription>
      </Empty>
      <Empty>
        <EmptyMedia icon={FolderSimpleIcon} color="accent" />
        <EmptyTitle>Create your first collection</EmptyTitle>
        <ExampleDescription>Keep related documents together in one place.</ExampleDescription>
        <EmptyActions>
          <Button iconLeft={PlusIcon}>Create collection</Button>
        </EmptyActions>
      </Empty>
    </div>
  );
}

function EmptyActivity(): ReactElement {
  return (
    <div className="empty-example-grid empty-example-reasons">
      <Empty>
        <EmptyMedia icon={BellSlashIcon} color="info" />
        <EmptyTitle>Notifications are paused</EmptyTitle>
        <ExampleDescription>Resume notifications to see new activity here.</ExampleDescription>
        <EmptyActions>
          <Button variant="secondary" tone="neutral">
            Resume notifications
          </Button>
        </EmptyActions>
      </Empty>
      <Empty>
        <EmptyMedia icon={CheckIcon} color="success" />
        <EmptyTitle>You’re all caught up</EmptyTitle>
        <ExampleDescription>
          New requests will appear here when they need review.
        </ExampleDescription>
      </Empty>
    </div>
  );
}

function EmptyUnavailable(): ReactElement {
  return (
    <div className="empty-example-grid empty-example-reasons">
      <Empty>
        <EmptyMedia icon={LockKeyIcon} color="warning" />
        <EmptyTitle>This collection is private</EmptyTitle>
        <ExampleDescription>The owner can grant you access.</ExampleDescription>
        <EmptyActions>
          <Button variant="secondary" tone="neutral">
            Request access
          </Button>
        </EmptyActions>
      </Empty>
      <Empty>
        <EmptyMedia icon={CloudSlashIcon} color="danger" />
        <EmptyTitle>Couldn’t load reports</EmptyTitle>
        <ExampleDescription>The report service didn’t respond.</ExampleDescription>
        <EmptyActions>
          <Button variant="secondary" tone="neutral">
            Try again
          </Button>
        </EmptyActions>
      </Empty>
    </div>
  );
}

function EmptyPlacement(): ReactElement {
  return (
    <div className="empty-example-grid empty-example-placement">
      <Card size="m">
        <CardTitle>Exports</CardTitle>
        <Empty size="s" align="start">
          <EmptyMedia icon={ArchiveBoxIcon} />
          <EmptyTitle as="h4">Nothing scheduled</EmptyTitle>
          <ExampleDescription>Pick a time to send a copy of your data.</ExampleDescription>
          <EmptyActions>
            <Button size="s" variant="secondary" tone="neutral">
              Schedule export
            </Button>
          </EmptyActions>
        </Empty>
      </Card>
      <div className="empty-example-table-frame">
        <table className="empty-example-table" aria-label="Export history">
          <thead>
            <tr>
              <th scope="col">Export</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="empty-example-cell" colSpan={2}>
                <Empty size="s">
                  <EmptyMedia />
                  <EmptyTitle>{false}</EmptyTitle>
                  <ExampleDescription>No exports to show.</ExampleDescription>
                  <EmptyActions />
                </Empty>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyIllustrations(): ReactElement {
  return (
    <div className="empty-example-grid empty-example-media">
      <Empty size="s">
        <EmptyMedia>
          <img src="/assets/empty-landscape.png" alt="" width="960" height="720" />
        </EmptyMedia>
        <EmptyTitle>No saved views</EmptyTitle>
      </Empty>
      <Empty>
        <EmptyMedia>
          <img src="/assets/empty-portrait.svg" alt="" width="160" height="240" />
        </EmptyMedia>
        <EmptyTitle>No files in this folder</EmptyTitle>
        <ExampleDescription>Files added to this folder will appear here.</ExampleDescription>
      </Empty>
      <Empty size="l">
        <EmptyMedia>
          <img src="/assets/empty-portrait.png" alt="" width="640" height="960" />
        </EmptyMedia>
        <EmptyTitle>Your library is empty</EmptyTitle>
        <ExampleDescription>
          Import documents to start building a shared reference for your team.
        </ExampleDescription>
      </Empty>
    </div>
  );
}

function EmptyRoutes(): ReactElement {
  return (
    <div className="empty-example-grid empty-example-routes">
      <Empty size="l">
        <EmptyMedia>
          <img src="/assets/empty-landscape.svg" alt="" width="240" height="180" />
        </EmptyMedia>
        <EmptyTitle as="h1">Page not found</EmptyTitle>
        <ExampleDescription>
          This page may have moved, or the address may be incorrect.
        </ExampleDescription>
        <EmptyActions>
          <Button>Back to workspace</Button>
        </EmptyActions>
      </Empty>
      <Empty size="l">
        <EmptyMedia icon={CloudSlashIcon} color="danger" />
        <EmptyTitle as="h1">We couldn’t open this page</EmptyTitle>
        <ExampleDescription>
          The server ran into a problem. Try reloading the page in a moment.
        </ExampleDescription>
        <EmptyActions>
          <Button>Reload page</Button>
          <Button variant="secondary" tone="neutral">
            Back to workspace
          </Button>
        </EmptyActions>
      </Empty>
    </div>
  );
}

const runbooks = [
  { title: 'Incident response', owner: 'Operations' },
  { title: 'Database recovery', owner: 'Infrastructure' },
];

function EmptySearch(): ReactElement {
  const [query, setQuery] = useState('release checklist');
  const input = useRef<HTMLInputElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const results = runbooks.filter((row) =>
    row.title.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const count = `${results.length} ${results.length === 1 ? 'runbook' : 'runbooks'} found`;

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (results.length === 0) {
      title.current?.focus();
    }
  }

  return (
    <div className="empty-example-search">
      <form
        className="empty-example-search-form"
        onSubmit={submit}
        role="search"
        aria-label="Runbooks"
      >
        <Input
          ref={input}
          size="s"
          iconLeft={MagnifyingGlassIcon}
          className="empty-example-search-input"
          aria-label="Find runbooks"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        <Button type="submit" size="s" variant="secondary" tone="neutral">
          Search
        </Button>
      </form>
      <Text size="caption-l" color="muted" role="status" aria-atomic="true">
        <bdi>{count}</bdi>
      </Text>
      <div className="empty-example-table-frame">
        <table className="empty-example-table" aria-label="Runbooks">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Owner</th>
            </tr>
          </thead>
          <tbody>
            {results.length ? (
              results.map(({ title, owner }) => (
                <tr key={title}>
                  <th scope="row">{title}</th>
                  <td>{owner}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="empty-example-cell" colSpan={2}>
                  <Empty size="s">
                    <EmptyMedia icon={MagnifyingGlassIcon} />
                    <EmptyTitle ref={title} tabIndex={-1}>
                      No matching runbooks
                    </EmptyTitle>
                    <ExampleDescription>
                      Try a different search or clear this one.
                    </ExampleDescription>
                    <EmptyActions>
                      <Button
                        size="s"
                        variant="secondary"
                        tone="neutral"
                        onClick={() => {
                          setQuery('');
                          input.current?.focus();
                        }}
                      >
                        Clear search
                      </Button>
                    </EmptyActions>
                  </Empty>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyRecovery(): ReactElement {
  const [phase, setPhase] = useState<'failed' | 'retrying' | 'ready'>('failed');
  const [retried, setRetried] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const retry = useRef<HTMLButtonElement>(null);
  const readyTitle = useRef<HTMLHeadingElement>(null);
  const reset = useRef<HTMLButtonElement>(null);
  const transferFocus = useRef(false);

  useEffect(() => {
    if (phase !== 'retrying') {
      return;
    }
    const timer = window.setTimeout(() => {
      if (!retried) {
        setRetried(true);
        setAnnouncement('Retry failed');
        setPhase('failed');
        return;
      }
      transferFocus.current = document.activeElement === retry.current;
      setAnnouncement(transferFocus.current ? '' : 'Two reports loaded');
      setPhase('ready');
    }, 900);
    return () => window.clearTimeout(timer);
  }, [phase, retried]);

  useEffect(() => {
    if (transferFocus.current) {
      (phase === 'ready' ? readyTitle : retry).current?.focus();
      transferFocus.current = false;
    }
  }, [phase]);

  return (
    <Card className="empty-example-recovery">
      <div className="empty-example-recovery-body">
        {phase === 'ready' ? (
          <div className="empty-example-reports">
            <Title
              ref={readyTitle}
              as="h3"
              size="heading-m"
              tabIndex={-1}
              className="empty-example-reports-title"
            >
              Reports
            </Title>
            <ul>
              <li>Quarterly access review</li>
              <li>Delivery health summary</li>
            </ul>
          </div>
        ) : (
          <Empty>
            <EmptyMedia icon={CloudSlashIcon} color="danger" />
            <EmptyTitle>Couldn’t load reports</EmptyTitle>
            <ExampleDescription>
              The report service didn’t respond. Try loading the reports again.
            </ExampleDescription>
            <EmptyActions>
              <Button
                ref={retry}
                variant="secondary"
                tone="neutral"
                loading={phase === 'retrying'}
                onClick={() => {
                  setAnnouncement('Reconnecting…');
                  setPhase('retrying');
                }}
              >
                Try again
              </Button>
            </EmptyActions>
          </Empty>
        )}
      </div>
      <div className="empty-example-reset">
        <Text as="span" size="caption-l" color="muted" role="status" aria-atomic="true">
          <bdi>{announcement}</bdi>
        </Text>
        <Button
          ref={reset}
          size="s"
          variant="ghost"
          tone="neutral"
          disabled={phase !== 'ready'}
          onClick={() => {
            transferFocus.current = document.activeElement === reset.current;
            setRetried(false);
            setAnnouncement('');
            setPhase('failed');
          }}
        >
          Reset preview
        </Button>
      </div>
    </Card>
  );
}

function EmptyOverflow(): ReactElement {
  return (
    <Empty align="start" className="empty-example-overflow">
      <EmptyTitle>No checks ran for this deployment</EmptyTitle>
      <ExampleDescription>
        This branch has no review rules yet. Ask a maintainer to check the rules for{' '}
        <bdi>release_verification_europe_west_production_candidate</bdi> before deploying.
      </ExampleDescription>
      <EmptyActions>
        <Button variant="secondary" tone="neutral">
          Review deployment requirements
        </Button>
        <Button variant="ghost" tone="neutral">
          View branch rules
        </Button>
      </EmptyActions>
    </Empty>
  );
}

function EmptyOverlay(): ReactElement {
  return (
    <div className="empty-example-overlay">
      <Empty size="s" align="start">
        <EmptyMedia icon={BellIcon} color="info" />
        <EmptyTitle>No unread notifications</EmptyTitle>
        <ExampleDescription>New replies and mentions will appear here.</ExampleDescription>
        <EmptyActions>
          <Button size="s" variant="secondary" tone="neutral">
            View all activity
          </Button>
        </EmptyActions>
      </Empty>
    </div>
  );
}

export type EmptyExampleSection =
  | 'sizes'
  | 'reasons'
  | 'activity'
  | 'unavailable'
  | 'placement'
  | 'media'
  | 'routes'
  | 'search'
  | 'retry'
  | 'overflow'
  | 'overlay';

const examples: Record<EmptyExampleSection, () => ReactElement> = {
  sizes: EmptySizes,
  reasons: EmptyCollections,
  activity: EmptyActivity,
  unavailable: EmptyUnavailable,
  placement: EmptyPlacement,
  media: EmptyIllustrations,
  routes: EmptyRoutes,
  search: EmptySearch,
  retry: EmptyRecovery,
  overflow: EmptyOverflow,
  overlay: EmptyOverlay,
};

export default function EmptyExamples({
  section,
  note,
}: {
  readonly section: EmptyExampleSection;
  readonly note?: string | undefined;
}): ReactElement {
  const Example = examples[section];
  return (
    <div className="empty-example-stack">
      {note && (
        <Text size="caption-l" color="subtle">
          <bdi>{note}</bdi>
        </Text>
      )}
      <Example />
    </div>
  );
}
