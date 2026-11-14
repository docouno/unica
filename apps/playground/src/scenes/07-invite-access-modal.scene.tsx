import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import { AsidePanel, WorkspaceNavigation } from '../prototypes/app-shell/app-shell.proto.js';
import { Badge } from '../prototypes/badge/badge.proto.js';
import { Button } from '../prototypes/button/button.proto.js';
import { Card } from '../prototypes/card/card.proto.js';
import { Modal } from '../prototypes/dialog/dialog.proto.js';
import { Toast } from '../prototypes/feedback/feedback.proto.js';
import { FormField, Input } from '../prototypes/input/input.proto.js';
import { Listbox, Select, TagsInput } from '../prototypes/select/select.proto.js';
import { CheckboxCard } from '../prototypes/selection/selection.proto.js';
import { Table, TableScroll } from '../prototypes/table/table.proto.js';
import { Textarea } from '../prototypes/textarea/textarea.proto.js';
import { Text } from '../prototypes/text/text.proto.js';
import { Title } from '../prototypes/title/title.proto.js';
import { defineScene } from '../workbench/types.js';
import { FolioScene, FolioWorkspace, PageIntro, Person } from './folio/folio.shared.js';

const members = [
  {
    initials: 'PE',
    name: 'Platform owner',
    email: 'platform@example.com',
    role: 'Owner',
    security: 'Hardware key',
    time: '2m ago',
  },
  {
    initials: 'DB',
    name: 'Database reliability',
    email: 'database@example.com',
    role: 'Maintainer',
    security: 'Passkey',
    time: '14m ago',
  },
  {
    initials: 'NW',
    name: 'Core networking',
    email: 'network@example.com',
    role: 'Editor',
    security: 'Passkey',
    time: '2h ago',
  },
  {
    initials: 'ED',
    name: 'Edge reliability',
    email: 'edge@example.com',
    role: 'Editor',
    security: 'Hardware key',
    time: 'Yesterday',
  },
  {
    initials: 'RV',
    name: 'Workspace reviewer',
    email: 'reviewer@example.com',
    role: 'Viewer',
    security: 'SAML SSO',
    time: '3d ago',
  },
] as const;
const roles = [
  { value: 'editor', label: 'Editor — Edit & publish' },
  { value: 'commenter', label: 'Commenter — Review & comment' },
  { value: 'viewer', label: 'Viewer — Read-only access' },
] as const;

function InviteScene(): ReactElement {
  const formId = useId();
  const welcomeId = useId();
  const [open, setOpen] = useState(true);
  const [rolePanel, setRolePanel] = useState(true);
  const [role, setRole] = useState('editor');
  const [invites, setInvites] = useState<readonly string[]>([
    'platform@example.com',
    'reviewer@example.com',
  ]);
  const [sent, setSent] = useState(false);
  return (
    <FolioScene>
      <FolioWorkspace
        classic
        crumbs={['Platform Eng', 'Administration', 'Members & roles']}
        minHeight={1020}
        leftAside={
          <AsidePanel title="Platform Eng">
            <WorkspaceNavigation kind="admin" defaultActive="members" />
          </AsidePanel>
        }
        actions={
          <div className="folio-row">
            <Button size="s" variant="secondary" tone="neutral">
              Export CSV
            </Button>
            <Button size="s" iconLeft={PlusIcon} onClick={() => setOpen(true)}>
              Invite member
            </Button>
          </div>
        }
      >
        <div className="folio-content folio-members-content">
          <PageIntro
            title="Members & role directory"
            description="Manage repository-backed runbook permissions, SAML groups, and hardware-key enforcement."
          >
            <Badge status="success" dot>
              SAML 2.0 Enforced
            </Badge>
          </PageIntro>
          <div className="folio-grid-3">
            {[
              {
                title: 'Active members',
                badge: 'Healthy',
                value: '14',
                detail: '100% 2FA verified',
              },
              {
                title: 'Tier-0 maintainers',
                badge: 'Restricted',
                value: '6',
                detail: 'Core Infrastructure & SRE',
              },
              {
                title: 'Pending invitations',
                badge: 'Awaiting SSO',
                value: '2',
                detail: 'Expires in 7 days',
              },
            ].map((stat) => (
              <Card key={stat.title}>
                <div className="folio-row folio-between">
                  <Text size="body-s" weight="medium">
                    {stat.title}
                  </Text>
                  <Badge size="s" status="neutral">
                    {stat.badge}
                  </Badge>
                </div>
                <Title as="h2" size="heading-l">
                  {stat.value}
                </Title>
                <Text size="caption-l" color="muted">
                  {stat.detail}
                </Text>
              </Card>
            ))}
          </div>
          <TableScroll>
            <Table>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Work email</th>
                  <th>Role</th>
                  <th>Security</th>
                  <th>Last active</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.email}>
                    <td>
                      <Person initials={member.initials} name={member.name} />
                    </td>
                    <td>{member.email}</td>
                    <td>
                      <Badge status="neutral" size="s">
                        {member.role}
                      </Badge>
                    </td>
                    <td>{member.security}</td>
                    <td>{member.time}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableScroll>
        </div>
      </FolioWorkspace>
      <Modal
        open={open}
        className="folio-invite-dialog"
        title="Invite members to Platform Eng"
        description="Invited engineers inherit repository-backed runbook permissions."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button size="s" variant="secondary" tone="neutral" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="s" type="submit" form={formId}>
              Send {invites.length} invites
            </Button>
          </>
        }
      >
        <form
          id={formId}
          className="folio-stack"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            setSent(true);
          }}
        >
          <TagsInput
            size="s"
            label="Invite by work email"
            values={invites}
            onValuesChange={setInvites}
            placeholder="Add address…"
          />
          <Input
            size="s"
            label="External contractor"
            status="danger"
            defaultValue="contractor@external.example"
            message="External domains require SAML guest approval."
            aria-invalid="true"
          />
          <fieldset className="folio-fieldset">
            <legend>Initial space capabilities</legend>
            <div className="folio-grid-2">
              <CheckboxCard
                defaultChecked
                label="Tier-0 runbook edit"
                description="Promote failover runbooks"
              />
              <CheckboxCard label="Incident digest" description="Weekly reliability summary" />
            </div>
          </fieldset>
          <FormField label="Welcome note" htmlFor={welcomeId}>
            <Textarea
              id={welcomeId}
              size="s"
              rows={2}
              aria-label="Welcome note"
              placeholder="Optional welcome note or onboarding Slack channel…"
            />
          </FormField>
          <div className="folio-grid-2">
            <div className="folio-role-field">
              <Select
                size="s"
                label="Default workspace role"
                options={roles}
                value={role}
                onChange={(event) => {
                  setRole(event.currentTarget.value);
                  setRolePanel(false);
                }}
                onFocus={() => setRolePanel(true)}
              />
              {rolePanel && (
                <Listbox
                  className="folio-invite-role-panel"
                  title="Workspace roles"
                  options={roles}
                  value={role}
                  onValueChange={(value) => {
                    setRole(value);
                    setRolePanel(false);
                  }}
                />
              )}
            </div>
            <Select
              size="s"
              label="Invite link expiry"
              options={[
                { value: '7', label: '7 days' },
                { value: '14', label: '14 days' },
                { value: '30', label: '30 days' },
              ]}
            />
          </div>
        </form>
      </Modal>
      {sent && (
        <div className="folio-toast-dock">
          <Toast title={`${invites.length} invitations prepared`} onDismiss={() => setSent(false)}>
            Workspace roles and capabilities are ready for review.
          </Toast>
        </div>
      )}
    </FolioScene>
  );
}

export default defineScene({
  id: '07-invite-access-modal',
  title: '07 · Invite & Access Modal',
  group: 'Folio',
  defaultViewport: 1440,
  render: () => <InviteScene />,
});
