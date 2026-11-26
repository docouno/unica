import { useId, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactElement } from 'react';
import {
  BellSimpleIcon,
  CalendarDotsIcon,
  DatabaseIcon,
  DotsThreeIcon,
  FileTextIcon,
  KeyIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  IconButton,
  Link,
  Stack,
  Switch,
  Text,
  Title,
} from '@docouno/unica';
import { Menu } from '../../prototypes/menu/menu.live.js';
import { List, ListItem } from '../../prototypes/list/list.proto.js';
import type { PreviewContext, PreviewProps, Surface } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { CredentialNotes } from './credential-notes.js';

export function ProseExamples({ ctx }: PreviewProps) {
  return (
    <div style={{ inlineSize: 'min(100%, 50ch)' }}>
      <ExampleSurface surface={ctx.surface}>
        <CredentialNotes subject={ctx.subject} />
      </ExampleSurface>
    </div>
  );
}

export function SizeExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <div
      style={{
        inlineSize: 'min(100%, 512px)',
        paddingInline: 'var(--space-16)',
        boxSizing: 'border-box',
      }}
    >
      <ExampleSurface surface={ctx.surface} gap={16}>
        <section aria-label="Compact rows">
          <Stack gap={16}>
            <Title as="h3" size="body-m">
              Compact · S
            </Title>
            <List {...ctx.subject} size="s" markers={false} dividers reserveLeading>
              <ListItem
                {...ctx.subject}
                title="Snapshot verified"
                leading={<ShieldCheckIcon aria-hidden="true" />}
                trailing={
                  <Badge size="s" status="success">
                    Verified
                  </Badge>
                }
              />
              <ListItem {...ctx.subject} title="Retention period" trailing="30 days" />
            </List>
          </Stack>
        </section>
        <section aria-label="Standard rows">
          <Stack gap={16}>
            <Title as="h3" size="body-m">
              Standard · M
            </Title>
            <List {...ctx.subject} size="m" markers={false} dividers reserveLeading>
              <ListItem
                {...ctx.subject}
                title="Storage maintenance"
                description="Snapshot history and export keys"
                leading={<Avatar size="s" fallback="ST" alt="" />}
                trailing={<Badge status="info">Managed</Badge>}
              />
              <ListItem
                {...ctx.subject}
                title="Regional backups"
                description="Next run at 02:00 UTC"
              />
            </List>
          </Stack>
        </section>
        <section aria-label="Spacious rows">
          <Stack gap={16}>
            <Title as="h3" size="body-m">
              Spacious · L
            </Title>
            <List {...ctx.subject} size="l" markers={false} dividers reserveLeading>
              <ListItem
                {...ctx.subject}
                title="Operations calendar"
                description="Scheduled maintenance and verification windows"
                leading={<Avatar size="m" fallback="OP" alt="" />}
                trailing={<Badge size="l">Team</Badge>}
              />
              <ListItem
                {...ctx.subject}
                title="Audit schedule"
                description="Quarterly review"
                leading={<CalendarDotsIcon aria-hidden="true" />}
              />
            </List>
          </Stack>
        </section>
      </ExampleSurface>
    </div>
  );
}

function RouterPreview({
  onNavigate,
  onClick,
  ...props
}: ComponentPropsWithoutRef<'a'> & { readonly onNavigate: () => void }): ReactElement {
  return (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (
          !event.defaultPrevented &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey &&
          event.button === 0
        ) {
          event.preventDefault();
          onNavigate();
        }
      }}
    />
  );
}

export function LiveRows({
  surface = 'base',
  subject,
}: {
  readonly surface?: Surface;
  readonly subject?: PreviewContext['subject'];
}): ReactElement {
  const handoff = useId();
  const history = useId();
  const heading = useId();
  const [message, setMessage] = useState('');
  const [logging, setLogging] = useState(true);
  const [verified, setVerified] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const contents = (
    <>
      <Title id={heading} as="h3" size="body-m">
        Service configuration
      </Title>
      <List {...subject} aria-labelledby={heading} size="s" markers={false} reserveLeading dividers>
        <ListItem
          title="Export activity"
          description="Notify the operations team"
          leading={<BellSimpleIcon aria-hidden="true" />}
          trailing={
            <Switch
              size="s"
              checked={logging}
              onCheckedChange={setLogging}
              aria-label="Notify the operations team about exports"
            />
          }
        />
        <ListItem
          title="Credential handoff"
          description={
            pinned
              ? 'Pinned instructions for the next maintainer'
              : 'Instructions for the next maintainer'
          }
          leading={<FileTextIcon aria-hidden="true" />}
          action={{ href: `#${handoff}` }}
          trailing={
            <Menu
              size="s"
              label="Credential handoff actions"
              items={[
                {
                  id: 'link',
                  label: 'Show note link',
                  run: () => {
                    setShowLink(true);
                    setMessage('Handoff link ready.');
                  },
                },
                {
                  id: 'pin',
                  label: pinned ? 'Unpin notes' : 'Pin notes',
                  run: () => {
                    setPinned(!pinned);
                    setMessage(pinned ? 'Handoff notes unpinned.' : 'Handoff notes pinned.');
                  },
                },
              ]}
              trigger={(props) => (
                <IconButton
                  {...props}
                  size="s"
                  icon={DotsThreeIcon}
                  aria-label="Credential handoff actions"
                />
              )}
            />
          }
        />
        <ListItem
          title="Rotation history"
          description="Reviewed changes to export keys"
          leading={<KeyIcon aria-hidden="true" />}
          action={{
            linkElement: (
              <RouterPreview
                href={`#${history}`}
                onNavigate={() => {
                  window.location.hash = history;
                  setMessage('Rotation history opened.');
                }}
              />
            ),
          }}
        />
        <ListItem
          title="Verify connection"
          description="Check whether exports can reach cold storage."
          leading={<DatabaseIcon aria-hidden="true" />}
          action={{
            onClick: () => {
              setVerified(true);
              setMessage('Cold storage connection verified.');
            },
          }}
          trailing={
            verified && (
              <Badge size="s" status="success">
                Verified
              </Badge>
            )
          }
        />
      </List>
      <Text id={handoff} size="caption-l" color="muted">
        <bdi>Keep the previous credential available until verification ends.</bdi>
      </Text>
      {showLink && <Link href={'#' + handoff}>Handoff notes link</Link>}
      <Text id={history} size="caption-l" color="muted">
        <bdi>Last key rotation: 4 June.</bdi>
      </Text>
      <Text size="caption-l" color="secondary" role="status">
        <bdi>{message}</bdi>
      </Text>
    </>
  );

  return (
    <div style={{ inlineSize: 'min(100%, 420px)' }}>
      {surface === 'overlay' ? (
        <ExampleSurface surface={surface}>
          <section aria-labelledby={heading}>
            <Stack gap={12}>{contents}</Stack>
          </section>
        </ExampleSurface>
      ) : (
        <Card aria-labelledby={heading}>
          <Stack gap={12}>{contents}</Stack>
        </Card>
      )}
    </div>
  );
}

export function StateExamples({ ctx }: PreviewProps): ReactElement {
  const [message, setMessage] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const receipt = useRef<HTMLParagraphElement>(null);
  const section = useId();
  const history = section + '-history';
  const backup = section + '-backup';
  const access = section + '-access';
  return (
    <div style={{ inlineSize: 'min(100%, 480px)' }}>
      <ExampleSurface surface={ctx.surface} gap={16}>
        <List
          {...ctx.subject}
          aria-label="Action states"
          size="s"
          markers={false}
          dividers
          reserveLeading
        >
          <ListItem
            title="Rotation history"
            leading={<FileTextIcon aria-hidden="true" />}
            action={{ href: `#${history}` }}
            trailing="Rest"
          />
          <ListItem
            title="Backup policy"
            action={{ href: `#${backup}` }}
            preview="hover"
            trailing="Hover"
          />
          <ListItem
            title="Verify connection"
            action={{ onClick: () => setMessage('Cold storage connection verified.') }}
            preview="pressed"
            trailing="Pressed"
          />
          <ListItem
            title="Access policy"
            action={{ href: `#${access}`, current: 'page' }}
            preview="focus"
            trailing="Current + focus"
          />
          <ListItem
            title="Archived export keys"
            description="Vault access is required to open the archive."
            action={{ href: `#${access}`, disabled: true }}
            trailing={
              <Button
                size="s"
                variant="secondary"
                tone="neutral"
                aria-label={
                  requestSent
                    ? 'Access requested for archived export keys'
                    : 'Request access to archived export keys'
                }
                disabled={requestSent}
                onClick={() => {
                  receipt.current?.focus();
                  setRequestSent(true);
                  setMessage('Access request recorded.');
                }}
              >
                {requestSent ? 'Requested' : 'Request access'}
              </Button>
            }
          />
          <ListItem hidden title="Hidden revision" />
          <ListItem
            title="Edit retention policy"
            description="Managed by the storage administrator."
            action={{ onClick: () => undefined, disabled: true }}
          />
          <ListItem
            title="Legacy export history"
            description="The archive has been removed."
            action={{
              linkElement: <RouterPreview href={`#${history}`} onNavigate={() => undefined} />,
              disabled: true,
            }}
          />
          <ListItem hidden title="Hidden last revision" />
        </List>
        <Stack gap={4}>
          <Text id={history} size="caption-l" color="secondary">
            <bdi>Rotation history: the last key rotation was on 4 June.</bdi>
          </Text>
          <Text id={backup} size="caption-l" color="secondary">
            <bdi>Backup policy: retain snapshots for 30 days.</bdi>
          </Text>
          <Text id={access} size="caption-l" color="secondary">
            <bdi>Access policy: only vault maintainers can open the archive.</bdi>
          </Text>
        </Stack>
        <Text ref={receipt} tabIndex={-1} size="caption-l" color="secondary" role="status">
          <bdi>{message}</bdi>
        </Text>
      </ExampleSurface>
    </div>
  );
}

export function OverflowExamples({ ctx }: PreviewProps): ReactElement {
  const [message, setMessage] = useState('');
  const [assigned, setAssigned] = useState(false);
  const receipt = useRef<HTMLParagraphElement>(null);
  return (
    <div style={{ inlineSize: 'min(100%, 480px)' }}>
      <ExampleSurface surface={ctx.surface} gap={16}>
        <List
          {...ctx.subject}
          size="m"
          markers={false}
          dividers
          reserveLeading
          aria-label="Long content and controls"
        >
          <ListItem
            title="Review retention exceptions for regional and customer-managed export destinations"
            description={
              assigned
                ? 'Platform operations is reviewing the retention exceptions.'
                : 'Access was reviewed after the last rotation. Assign a reviewer before backups resume.'
            }
            leading={<Avatar size="s" fallback="ET" alt="" />}
            action={{
              onClick: () => setMessage('Two export destinations need updated retention rules.'),
            }}
            trailing={
              <Button
                variant="ghost"
                tone="neutral"
                disabled={assigned}
                onClick={() => {
                  receipt.current?.focus();
                  setAssigned(true);
                  setMessage('Platform operations assigned as reviewer.');
                }}
              >
                {assigned ? 'Reviewer assigned' : 'Assign reviewer'}
              </Button>
            }
          />
          <ListItem
            title="regional-customer-managed-exports.example/retention/immutable-archive/kafka"
            description="Full identifier remains readable when space is limited."
            trailing="Next check tomorrow at 02:00 UTC"
          />
        </List>
        <Text ref={receipt} tabIndex={-1} size="caption-l" color="secondary" role="status">
          <bdi>{message}</bdi>
        </Text>
      </ExampleSurface>
    </div>
  );
}
