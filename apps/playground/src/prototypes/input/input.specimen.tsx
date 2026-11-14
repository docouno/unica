import { MagnifyingGlassIcon, EnvelopeSimpleIcon } from '@phosphor-icons/react';
import { defineSpecimen } from '../../workbench/types.js';
import { Input } from './input.proto.js';
import { Button } from '../button/button.proto.js';
import { Title } from '../title/title.proto.js';

export default defineSpecimen({
  id: 'input',
  title: 'Input & FormField',
  group: 'Forms',
  summary:
    'Framed form fields and quiet inline editing. A native input preserves real text behavior.',
  sections: [
    {
      id: 'roles',
      title: 'Field roles & sizes',
      kind: 'matrix',
      render: () => (
        <div className="control-examples-proto">
          {(['s', 'm', 'l'] as const).map((size) => (
            <div className="control-stack-proto" key={size}>
              <Input
                size={size}
                label={`Default · ${size}`}
                placeholder="Search the knowledge base"
                iconLeft={MagnifyingGlassIcon}
              />
              <Input
                size={size}
                variant="ghost"
                aria-label={`Inline title ${size}`}
                defaultValue="ADR-014 Traffic Draining"
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'states',
      title: 'Validation, availability & long content',
      kind: 'states',
      render: () => (
        <div className="control-examples-proto">
          <Input
            label="Work email"
            status="danger"
            defaultValue="engineer@"
            message="Enter a complete work email address."
          />
          <Input label="Read-only identifier" defaultValue="ADR-014" readOnly />
          <Input label="Unavailable field" disabled placeholder="Controlled by policy" />
          <Input label="Checking address" defaultValue="engineer@example.com" loading />
          <Input
            label="Long title"
            defaultValue="Traffic draining during a complete availability zone evacuation"
            prefix="/"
          />
          <Input
            label="External address"
            defaultValue="docs.example.com"
            prefix="https://"
            suffix="/runbooks"
          />
        </div>
      ),
    },
    {
      id: 'sign-in',
      title: 'Folio · Work email',
      kind: 'context',
      render: () => (
        <div className="control-panel-proto">
          <Title as="h3" size="heading-m">
            Sign in to Folio
          </Title>
          <Input
            label="Work email"
            type="email"
            autoComplete="email"
            iconLeft={EnvelopeSimpleIcon}
            defaultValue="engineer@example.com"
            required
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            defaultValue="trusted-device"
          />
          <Button width="full">Continue to workspace</Button>
        </div>
      ),
    },
  ],
});
