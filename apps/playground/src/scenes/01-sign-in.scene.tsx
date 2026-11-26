import {
  Badge,
  Card,
  Checkbox,
  Divider,
  Input,
  Link,
  SegmentedControl,
  Text,
  Title,
} from '@docouno/unica';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { GithubLogoIcon, KeyIcon } from '@phosphor-icons/react';
import { BrandMark } from '../prototypes/app-shell/app-shell.proto.js';
import { Button } from '@docouno/unica';
import { FormField } from '@docouno/unica';
import { defineScene } from '../workbench/types.js';
import { FolioScene } from './folio/folio.shared.js';

function SignInScene(): ReactElement {
  const emailId = useId();
  const passwordId = useId();
  const [mode, setMode] = useState('sign-in');
  const [message, setMessage] = useState('');
  return (
    <FolioScene className="folio-auth">
      <header className="folio-auth-topbar">
        <div className="folio-row">
          <BrandMark decorative />
          <Text as="span" weight="semibold">
            Folio
          </Text>
          <span className="folio-auth-divider" />
          <Text as="span" size="caption-l" color="muted">
            Engineering Knowledge
          </Text>
        </div>
        <div className="folio-row">
          <Text as="span" size="caption-l" color="muted">
            New to Folio?
          </Text>
          <Link
            href="#request-access"
            onClick={(event) => {
              event.preventDefault();
              setMode('create');
            }}
          >
            Request workspace access →
          </Link>
        </div>
      </header>
      <div className="folio-auth-stage">
        <Card className="folio-auth-card">
          <div className="folio-stack">
            <Title as="h1" size="heading-m">
              {mode === 'sign-in' ? 'Sign in to Folio' : 'Join your workspace'}
            </Title>
            <Text size="body-s" color="secondary">
              Continue to your engineering runbooks and architecture corpus.
            </Text>
          </div>
          <SegmentedControl
            aria-label="Account access mode"
            width="full"
            size="s"
            value={mode}
            onValueChange={setMode}
            items={[
              { value: 'sign-in', label: 'Sign in' },
              { value: 'create', label: 'Create account' },
            ]}
          />
          <div className="folio-grid-2 folio-auth-sso">
            <Button
              size="s"
              width="full"
              variant="secondary"
              tone="neutral"
              iconLeft={GithubLogoIcon}
              onClick={() =>
                setMessage(
                  'GitHub SSO selected. Continue with your organization’s identity provider.',
                )
              }
            >
              GitHub SSO
            </Button>
            <Button
              size="s"
              width="full"
              variant="secondary"
              tone="neutral"
              iconLeft={KeyIcon}
              onClick={() =>
                setMessage('Use your organization’s passkey or SAML identity provider.')
              }
            >
              Passkey / SAML
            </Button>
          </div>
          <Divider label="or continue with work email" />
          <form
            className="folio-stack"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage('Your sign-in details are ready for your identity provider.');
            }}
          >
            <FormField label="Work email" controlId={emailId} required>
              <Input
                id={emailId}
                type="email"
                name="email"
                defaultValue="engineer@example.com"
                autoComplete="email"
                required
              />
            </FormField>
            <div className="folio-stack">
              <div className="folio-row folio-between">
                <Text as="label" htmlFor={passwordId} size="body-s" weight="medium">
                  Password
                </Text>
                <Link
                  href="#reset-password"
                  onClick={(event) => {
                    event.preventDefault();
                    setMessage('Contact your workspace administrator to reset your credentials.');
                  }}
                >
                  Reset password?
                </Link>
              </div>
              <Input
                id={passwordId}
                type="password"
                name="password"
                defaultValue="trusted-passkey"
                autoComplete="current-password"
                required
              />
            </div>
            <Checkbox size="s" defaultChecked label="Keep this device trusted for 30 days" />
            <Button type="submit" width="full">
              {mode === 'sign-in' ? 'Continue to workspace' : 'Request workspace access'}
            </Button>
          </form>
          {message && (
            <Text size="caption-l" color="secondary" role="status">
              {message}
            </Text>
          )}
        </Card>
        <div className="folio-auth-compliance">
          <Badge size="s" status="success" dot>
            SOC 2 Type II
          </Badge>
          <Text size="caption-l" color="muted">
            Hardware-key WebAuthn & SAML 2.0 enforced
          </Text>
        </div>
      </div>
      <footer className="folio-auth-footer">
        <Text size="caption-l" color="muted">
          Folio Knowledge Systems · Self-hosted & Cloud
        </Text>
        <div className="folio-row">
          <Link tone="neutral" href="#security">
            Security
          </Link>
          <Link tone="neutral" href="#privacy">
            Privacy
          </Link>
          <Link tone="neutral" href="#status">
            System status
          </Link>
        </div>
      </footer>
    </FolioScene>
  );
}

export default defineScene({
  id: '01-sign-in',
  title: '01 · Sign In & SSO',
  group: 'Folio',
  defaultViewport: 1440,
  uses: [
    'app-shell',
    'badge',
    'button',
    'card',
    'checkbox',
    'divider',
    'form-field',
    'icon',
    'input',
    'link',
    'segmented-control',
    'text',
    'title',
  ],
  render: SignInScene,
});
