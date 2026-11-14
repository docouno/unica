import { defineSpecimen } from '../../workbench/types.js';
import { MagnifyingGlassIcon, PlugsConnectedIcon } from '@phosphor-icons/react';
import { Empty } from './empty.proto.js';
import { Card } from '../card/card.proto.js';
import { Button } from '../button/button.proto.js';
import '../card/display.examples.css';

export default defineSpecimen({
  id: 'empty',
  title: 'Empty',
  group: 'Feedback',
  summary: 'A concise explanation and a clear next action when a collection has no content.',
  sections: [
    {
      id: 'reasons',
      title: 'No content & no results',
      kind: 'matrix',
      render: () => (
        <div className="display-example-grid">
          <Empty
            title="No webhooks yet"
            description="Connect your workspace to the systems that depend on it."
            icon={<PlugsConnectedIcon size="1em" />}
          />
          <Empty
            title="No matching documents"
            description="Try another search or remove a filter."
            icon={<MagnifyingGlassIcon size="1em" />}
          />
        </div>
      ),
    },
    {
      id: 'media',
      title: 'Optional media & long explanation',
      kind: 'states',
      render: () => (
        <Empty
          title="Your collection starts here"
          description="Bring existing runbooks and architecture decisions together so the next team member can find the context they need."
          media={<img src="/assets/empty-landscape.svg" alt="Abstract empty landscape" />}
        >
          <Button size="s">Import documents</Button>
        </Empty>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Webhook sandbox',
      kind: 'context',
      render: () => (
        <Card>
          <Empty
            title="No webhooks configured"
            description="Publish document events to your incident and delivery workflows."
          >
            <Button size="s">Create webhook</Button>
            <Button size="s" variant="secondary" tone="neutral">
              Read documentation
            </Button>
          </Empty>
        </Card>
      ),
    },
  ],
});
