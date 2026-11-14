import { defineSpecimen } from '../../workbench/types.js';
import { Divider } from './divider.proto.js';
import { Card } from '../card/card.proto.js';
import { Button } from '../button/button.proto.js';
import { Text } from '../text/text.proto.js';
import '../card/display.examples.css';

export default defineSpecimen({
  id: 'divider',
  title: 'Divider',
  group: 'Structure',
  summary: 'A plain boundary or a labeled transition between related methods.',
  sections: [
    {
      id: 'orientation',
      title: 'Plain, labeled & vertical',
      kind: 'matrix',
      render: () => (
        <div className="display-example-stack">
          <Divider />
          <Divider>or continue with work email</Divider>
          <div className="display-example-row">
            <Text size="body-s">Draft</Text>
            <Divider orientation="vertical" />
            <Text size="body-s">Autosaved</Text>
          </div>
        </div>
      ),
    },
    {
      id: 'wrapping',
      title: 'Long label',
      kind: 'states',
      render: () => (
        <div className="display-example-measure">
          <Divider>Continue with an alternative workspace authentication method</Divider>
        </div>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Sign-in methods',
      kind: 'context',
      render: () => (
        <Card className="display-example-measure">
          <div className="display-example-row">
            <Button size="s" variant="secondary" tone="neutral">
              GitHub SSO
            </Button>
            <Button size="s" variant="secondary" tone="neutral">
              Passkey / SAML
            </Button>
          </div>
          <Divider>or continue with work email</Divider>
          <Text size="body-s" color="secondary">
            Use the email address associated with your workspace.
          </Text>
        </Card>
      ),
    },
  ],
});
