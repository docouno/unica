import { Card, Code, Link, Switch } from '@docouno/unica';
import { useId, useState } from 'react';
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
import { Avatar } from '../avatar/avatar.proto.js';
import { Badge } from '@docouno/unica';
import { Button, IconButton } from '@docouno/unica';
import { Menu } from '../menu/menu.live.js';
import { PopoverContent } from '../popover/popover.proto.js';
import { Text, Title } from '@docouno/unica';
import { List, ListItem } from './list.proto.js';
import '../../specimens/shared/display.examples.css';
import './list.examples.css';

export function ProseExamples(): ReactElement {
  const notesId = useId();
  return (
    <div className="display-example-stack list-example-prose">
      <div>
        <p>Before rotating a credential:</p>
        <List aria-label="Rotation prerequisites">
          <ListItem>Confirm a second maintainer has access to the vault.</ListItem>
          <ListItem>
            Check the services using the credential:
            <List>
              <ListItem>Scheduled snapshots and nightly exports</ListItem>
              <ListItem>
                Regional workers that read <Code>EXPORT_TOKEN</Code>
              </ListItem>
            </List>
          </ListItem>
          <ListItem>
            Read the <Link href={`#${notesId}`}>handoff notes</Link> before replacing a key.
          </ListItem>
        </List>
      </div>
      <div>
        <p>Record the final checks in this order:</p>
        <List as="ol" start={12} aria-label="Final checks">
          <ListItem>Run one export using the new credential.</ListItem>
          <ListItem>Disable the old key after the export succeeds.</ListItem>
          <ListItem>Leave a note for the next on-call maintainer.</ListItem>
        </List>
      </div>
      <div>
        <p>Latest audit entries:</p>
        <List
          as="ol"
          reversed
          start={10020}
          className="list-example-wide-marker"
          aria-label="Latest audit entries"
        >
          <ListItem>New credential tested</ListItem>
          <ListItem value={10015}>Rotation approved</ListItem>
          <ListItem>Maintainer notified</ListItem>
        </List>
      </div>
      <div id={notesId}>
        <p>Handoff notes</p>
        <List markers={false} aria-label="Handoff notes">
          <ListItem>Keep the previous credential available until verification ends.</ListItem>
          <ListItem>Record the expiry date in the rotation log.</ListItem>
        </List>
      </div>
    </div>
  );
}

export function SizeExamples(): ReactElement {
  return (
    <div className="display-example-stack list-example-panel">
      <section className="display-example-stack" aria-label="Compact rows">
        <Title as="h3" size="body-m">
          Compact · S
        </Title>
        <List size="s" markers={false} dividers reserveLeading>
          <ListItem
            title="Snapshot verified"
            leading={<ShieldCheckIcon aria-hidden="true" />}
            trailing={
              <Badge size="s" status="success">
                Verified
              </Badge>
            }
          />
          <ListItem title="Retention period" trailing="30 days" />
        </List>
      </section>
      <section className="display-example-stack" aria-label="Standard rows">
        <Title as="h3" size="body-m">
          Standard · M
        </Title>
        <List size="m" markers={false} dividers reserveLeading>
          <ListItem
            title="Storage maintenance"
            description="Snapshot history and export keys"
            leading={<Avatar size="s" fallback="ST" alt="" />}
            trailing={<Badge status="info">Managed</Badge>}
          />
          <ListItem title="Regional backups" description="Next run at 02:00 UTC" />
        </List>
      </section>
      <section className="display-example-stack" aria-label="Spacious rows">
        <Title as="h3" size="body-m">
          Spacious · L
        </Title>
        <List size="l" markers={false} dividers reserveLeading>
          <ListItem
            title="Operations calendar"
            description="Scheduled maintenance and verification windows"
            leading={<Avatar size="m" fallback="OP" alt="" />}
            trailing={<Badge size="l">Team</Badge>}
          />
          <ListItem
            title="Audit schedule"
            description="Quarterly review"
            leading={<CalendarDotsIcon aria-hidden="true" />}
          />
        </List>
      </section>
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

export function LiveRows({ overlay = false }: { readonly overlay?: boolean }): ReactElement {
  const handoff = useId();
  const history = useId();
  const heading = useId();
  const [message, setMessage] = useState('');
  const [logging, setLogging] = useState(true);
  const [verified, setVerified] = useState(false);
  const contents = (
    <>
      <Title id={heading} as="h3" size="body-m">
        Service configuration
      </Title>
      <List aria-labelledby={heading} size="s" markers={false} reserveLeading dividers>
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
          description="Instructions for the next maintainer"
          leading={<FileTextIcon aria-hidden="true" />}
          action={{ href: `#${handoff}` }}
          trailing={
            <Menu
              size="s"
              label="Credential handoff actions"
              items={[
                {
                  id: 'copy',
                  label: 'Get share link',
                  run: () => setMessage('Share link requested.'),
                },
                { id: 'pin', label: 'Pin notes', run: () => setMessage('Handoff notes pinned.') },
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
      <Text id={handoff} as="p" size="caption-l" color="muted">
        Keep the previous credential available until verification ends.
      </Text>
      <Text id={history} as="p" size="caption-l" color="muted">
        Last key rotation: 4 June.
      </Text>
      <p className="list-example-feedback" role="status">
        {message}
      </p>
    </>
  );

  return overlay ? (
    <PopoverContent aria-labelledby={heading} className="list-example-context">
      {contents}
    </PopoverContent>
  ) : (
    <Card className="list-example-context">{contents}</Card>
  );
}

export function StateExamples(): ReactElement {
  const [message, setMessage] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const destination = useId();
  return (
    <div className="display-example-stack list-example-panel">
      <List aria-label="Pinned interaction states" size="s" markers={false} dividers reserveLeading>
        <ListItem
          title="Rotation history"
          leading={<FileTextIcon aria-hidden="true" />}
          action={{ href: `#${destination}` }}
          trailing="Rest"
        />
        <ListItem
          title="Backup policy"
          action={{ href: `#${destination}` }}
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
          action={{ href: `#${destination}`, current: 'page' }}
          preview="focus"
          trailing="Current + focus"
        />
        <ListItem
          title="Archived export keys"
          description="Vault access is required to open the archive."
          action={{ href: `#${destination}`, disabled: true }}
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
              onClick={() => setRequestSent(true)}
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
            linkElement: <RouterPreview href={`#${destination}`} onNavigate={() => undefined} />,
            disabled: true,
          }}
        />
        <ListItem hidden title="Hidden last revision" />
      </List>
      <p className="list-example-feedback" id={destination} role="status">
        {message}
      </p>
    </div>
  );
}

export function OverflowExamples(): ReactElement {
  const [message, setMessage] = useState('');
  return (
    <div className="display-example-stack list-example-panel">
      <List size="m" markers={false} dividers reserveLeading aria-label="Long content and controls">
        <ListItem
          title="Review retention exceptions for regional and customer-managed export destinations"
          description="Access was reviewed after the last rotation. Assign a reviewer before backups resume."
          leading={<Avatar size="s" fallback="ET" alt="" />}
          action={{
            onClick: () => setMessage('Two export destinations need updated retention rules.'),
          }}
          trailing={
            <Button
              variant="ghost"
              tone="neutral"
              onClick={() => setMessage('Platform operations assigned as reviewer.')}
            >
              Assign reviewer
            </Button>
          }
        />
        <ListItem
          title={
            <bdi>regional-customer-managed-exports.example/retention/immutable-archive/kafka</bdi>
          }
          description="Full identifier remains readable when space is limited."
          trailing="Next check tomorrow at 02:00 UTC"
        />
      </List>
      <p className="list-example-feedback" role="status">
        {message}
      </p>
    </div>
  );
}
