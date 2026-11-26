import { useId, useState } from 'react';
import { folioSceneHref } from './folio/folio.routes.js';
import type { ReactElement } from 'react';
import { PlusIcon } from '@phosphor-icons/react';
import { AsidePanel, WorkspaceNavigation } from '../prototypes/app-shell/app-shell.proto.js';
import {
  Badge,
  Button,
  Card,
  CheckboxCard,
  FormField,
  Input,
  Select,
  Text,
  Textarea,
  Title,
} from '@docouno/unica';
import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '../prototypes/dialog/dialog.proto.js';
import { ToastCard } from '../prototypes/toast/toast.proto.js';
import {
  Table,
  TableBody,
  TableCell,
  TableColumnHeader,
  TableHeader,
  TableRow,
  TableRowHeader,
  TableScroll,
} from '../prototypes/table/table.proto.js';
import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbPage,
} from '../prototypes/breadcrumb/breadcrumb.proto.js';
import { defineScene } from '../workbench/types.js';
import { FolioScene, FolioWorkspace, PageIntro, Person } from './folio/folio.shared.js';

const { TagsInput } = await import('../prototypes/tags-input/tags-input.proto.js');

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
  { value: 'editor', label: 'Editor', description: 'Edit and publish pages' },
  { value: 'commenter', label: 'Commenter', description: 'Review and leave feedback' },
  { value: 'viewer', label: 'Viewer', description: 'Read shared pages' },
] as const;
const expiryOptions = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
] as const;

function InviteScene(): ReactElement {
  const formId = useId();
  const welcomeId = useId();
  const [open, setOpen] = useState(true);
  const [role, setRole] = useState('editor');
  const [invites, setInvites] = useState<readonly string[]>([
    'platform@example.com',
    'reviewer@example.com',
  ]);
  const [sent, setSent] = useState<{ readonly role: string; readonly expiry: string } | null>(null);
  return (
    <FolioScene>
      <Modal open={open} onOpenChange={setOpen}>
        <div inert={open}>
          <FolioWorkspace
            classic
            breadcrumb={
              <Breadcrumb size="s">
                <BreadcrumbLink href={folioSceneHref('02-workspace-overview')}>
                  Platform Eng
                </BreadcrumbLink>
                <span>Administration</span>
                <BreadcrumbPage>Members & roles</BreadcrumbPage>
              </Breadcrumb>
            }
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
                <ModalTrigger size="s" iconLeft={PlusIcon}>
                  Invite member
                </ModalTrigger>
              </div>
            }
          >
            <div className="folio-content folio-members-content">
              <PageIntro
                title="Members & role directory"
                description="Manage repository-backed runbook permissions, SAML groups, and hardware-key enforcement."
              >
                <Badge size="s" status="success" dot>
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
              <TableScroll aria-label="Workspace members">
                <Table aria-label="Workspace members">
                  <TableHeader>
                    <TableRow>
                      <TableColumnHeader>Member</TableColumnHeader>
                      <TableColumnHeader>Work email</TableColumnHeader>
                      <TableColumnHeader>Role</TableColumnHeader>
                      <TableColumnHeader>Security</TableColumnHeader>
                      <TableColumnHeader>Last active</TableColumnHeader>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.email}>
                        <TableRowHeader>
                          <Person initials={member.initials} name={member.name} />
                        </TableRowHeader>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge status="neutral" size="s">
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell>{member.security}</TableCell>
                        <TableCell>{member.time}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableScroll>
            </div>
          </FolioWorkspace>
        </div>
        <ModalContent className="folio-invite-dialog" described>
          <ModalHeader closeLabel="Close invitations">
            <ModalTitle>Invite members to Platform Eng</ModalTitle>
            <ModalDescription>
              Invited engineers inherit repository-backed runbook permissions.
            </ModalDescription>
          </ModalHeader>
          <ModalBody>
            <form
              id={formId}
              className="folio-stack"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const selectedRole = roles.find((option) => option.value === data.get('role'));
                const expiry = expiryOptions.find((option) => option.value === data.get('expiry'));
                if (!selectedRole || !expiry) {
                  return;
                }
                setOpen(false);
                setSent({ role: selectedRole.label, expiry: expiry.label });
              }}
            >
              <TagsInput
                size="s"
                label="Invite by work email"
                values={invites}
                onValuesChange={setInvites}
                placeholder="Add address…"
              />
              <FormField
                size="s"
                label="External contractor"
                controlId={`${formId}-contractor`}
                status="danger"
                message="External domains require SAML guest approval."
                feedbackIcon={false}
              >
                <Input
                  id={`${formId}-contractor`}
                  size="s"
                  status="danger"
                  defaultValue="contractor@external.example"
                />
              </FormField>
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
              <FormField label="Welcome note" controlId={welcomeId}>
                <Textarea
                  id={welcomeId}
                  size="s"
                  rows={2}
                  placeholder="Optional welcome note or onboarding Slack channel…"
                />
              </FormField>
              <div className="folio-grid-2">
                <FormField size="s" label="Default workspace role" controlId={`${formId}-role`}>
                  <Select
                    id={`${formId}-role`}
                    name="role"
                    size="s"
                    options={roles}
                    value={role}
                    onValueChange={(next) => setRole(next ?? 'editor')}
                    searchable
                  />
                </FormField>
                <FormField size="s" label="Invite link expiry" controlId={`${formId}-expiry`}>
                  <Select
                    id={`${formId}-expiry`}
                    name="expiry"
                    size="s"
                    defaultValue="7"
                    options={expiryOptions}
                  />
                </FormField>
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <ModalClose>Cancel</ModalClose>
            <Button type="submit" form={formId}>
              Send {invites.length} invites
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {sent && (
        <div className="folio-toast-dock">
          <ToastCard
            status="success"
            title={`${invites.length} invitations prepared`}
            onDismiss={() => setSent(null)}
          >
            Workspace role: {sent.role}. Invite links expire in {sent.expiry}.
          </ToastCard>
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
  uses: [
    'app-shell',
    'avatar',
    'badge',
    'breadcrumb',
    'button',
    'card',
    'checkbox-card',
    'form-field',
    'icon',
    'indicator',
    'input',
    'modal',
    'select',
    'table',
    'tag',
    'tags-input',
    'text',
    'textarea',
    'title',
    'toast',
  ],
  render: InviteScene,
});
