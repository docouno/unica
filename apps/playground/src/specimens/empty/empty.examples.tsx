import type { ReactElement, ReactNode } from 'react';
import {
  ArchiveBoxIcon,
  BellIcon,
  BellSlashIcon,
  CheckIcon,
  CloudSlashIcon,
  FolderSimpleIcon,
  LockKeyIcon,
  PlusIcon,
  TrayIcon,
} from '@phosphor-icons/react';
import {
  Button,
  Card,
  CardTitle,
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  VisuallyHidden,
} from '@docouno/unica';
import type { ButtonProps } from '@docouno/unica';
import { ExampleSurface } from '../shared/example-surface.js';
import type { PreviewProps } from '../../workbench/types.js';
import { Table } from '../../prototypes/table/table.proto.js';
import './empty.examples.css';

function ActionPreview({
  children,
  ...props
}: Pick<ButtonProps, 'iconLeft' | 'size' | 'tone' | 'variant'> & {
  readonly children: string;
}): ReactElement {
  return (
    <>
      <Button {...props} inert>
        {children}
      </Button>
      <VisuallyHidden>{children}</VisuallyHidden>
    </>
  );
}

function ExampleDescription({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <EmptyDescription>
      <bdi>{children}</bdi>
    </EmptyDescription>
  );
}

export function EmptyCollections({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="empty-example-grid empty-example-reasons">
      <Empty {...ctx.subject}>
        <EmptyMedia icon={TrayIcon} />
        <EmptyTitle>Nothing shared yet</EmptyTitle>
        <ExampleDescription>Items shared with you will appear here.</ExampleDescription>
      </Empty>
      <Empty {...ctx.subject}>
        <EmptyMedia icon={FolderSimpleIcon} color="accent" />
        <EmptyTitle>Create your first collection</EmptyTitle>
        <ExampleDescription>Keep related documents together in one place.</ExampleDescription>
        <EmptyActions>
          <ActionPreview iconLeft={PlusIcon}>Create collection</ActionPreview>
        </EmptyActions>
      </Empty>
    </div>
  );
}

export function EmptyActivity({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="empty-example-grid empty-example-reasons">
      <Empty {...ctx.subject}>
        <EmptyMedia icon={BellSlashIcon} color="info" />
        <EmptyTitle>Notifications are paused</EmptyTitle>
        <ExampleDescription>Resume notifications to see new activity here.</ExampleDescription>
        <EmptyActions>
          <ActionPreview variant="secondary" tone="neutral">
            Resume notifications
          </ActionPreview>
        </EmptyActions>
      </Empty>
      <Empty {...ctx.subject}>
        <EmptyMedia icon={CheckIcon} color="success" />
        <EmptyTitle>You’re all caught up</EmptyTitle>
        <ExampleDescription>
          New requests will appear here when they need review.
        </ExampleDescription>
      </Empty>
    </div>
  );
}

export function EmptyUnavailable({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="empty-example-grid empty-example-reasons">
      <Empty {...ctx.subject}>
        <EmptyMedia icon={LockKeyIcon} color="warning" />
        <EmptyTitle>This collection is private</EmptyTitle>
        <ExampleDescription>The owner can grant you access.</ExampleDescription>
        <EmptyActions>
          <ActionPreview variant="secondary" tone="neutral">
            Request access
          </ActionPreview>
        </EmptyActions>
      </Empty>
      <Empty {...ctx.subject}>
        <EmptyMedia icon={CloudSlashIcon} color="danger" />
        <EmptyTitle>Couldn’t load reports</EmptyTitle>
        <ExampleDescription>The report service didn’t respond.</ExampleDescription>
        <EmptyActions>
          <ActionPreview variant="secondary" tone="neutral">
            Try again
          </ActionPreview>
        </EmptyActions>
      </Empty>
    </div>
  );
}

export function EmptyPlacement({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="empty-example-grid empty-example-placement">
      <Card size="m" style={{ gap: 'var(--space-24)' }}>
        <CardTitle>Exports</CardTitle>
        <Empty {...ctx.subject} size="s" align="start">
          <EmptyMedia icon={ArchiveBoxIcon} />
          <EmptyTitle as="h4">Nothing scheduled</EmptyTitle>
          <ExampleDescription>Pick a time to send a copy of your data.</ExampleDescription>
          <EmptyActions>
            <ActionPreview size="s" variant="secondary" tone="neutral">
              Schedule export
            </ActionPreview>
          </EmptyActions>
        </Empty>
      </Card>
      <Card size="s" style={{ padding: 0 }}>
        <Table size="s" className="empty-example-table" aria-label="Export history">
          <thead>
            <tr>
              <th scope="col">Export</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="empty-example-cell" colSpan={2}>
                <Empty {...ctx.subject} size="s">
                  <ExampleDescription>No exports to show.</ExampleDescription>
                </Empty>
              </td>
            </tr>
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

export function EmptyIllustrations({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="empty-example-grid">
      <Empty {...ctx.subject} size="s">
        <EmptyMedia>
          <img src="/assets/empty-landscape.png" alt="" width="960" height="720" />
        </EmptyMedia>
        <EmptyTitle>No saved views</EmptyTitle>
      </Empty>
      <Empty {...ctx.subject}>
        <EmptyMedia>
          <img src="/assets/empty-portrait.svg" alt="" width="160" height="240" />
        </EmptyMedia>
        <EmptyTitle>No files in this folder</EmptyTitle>
        <ExampleDescription>Files added to this folder will appear here.</ExampleDescription>
      </Empty>
      <Empty {...ctx.subject} size="l">
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

export function EmptyOverflow({ ctx }: PreviewProps): ReactElement {
  return (
    <Empty {...ctx.subject} align="start" className="empty-example-overflow">
      <EmptyTitle>No checks ran for this deployment</EmptyTitle>
      <ExampleDescription>
        This branch has no review rules yet. Ask a maintainer to check the rules for{' '}
        <bdi>release_verification_europe_west_production_candidate</bdi> before deploying.
      </ExampleDescription>
      <EmptyActions>
        <ActionPreview variant="secondary" tone="neutral">
          Review deployment requirements
        </ActionPreview>
        <ActionPreview variant="ghost" tone="neutral">
          View branch rules
        </ActionPreview>
      </EmptyActions>
    </Empty>
  );
}

export function EmptyOverlay({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="empty-example-overlay">
      <ExampleSurface surface={ctx.surface} sizing="border-box">
        <Empty {...ctx.subject} size="s" align="start">
          <EmptyMedia icon={BellIcon} color="info" />
          <EmptyTitle>No unread notifications</EmptyTitle>
          <ExampleDescription>New replies and mentions will appear here.</ExampleDescription>
          <EmptyActions>
            <ActionPreview size="s" variant="secondary" tone="neutral">
              View all activity
            </ActionPreview>
          </EmptyActions>
        </Empty>
      </ExampleSurface>
    </div>
  );
}
