import { defineSpecimen } from '../../workbench/types.js';
import { Text } from '../text/text.proto.js';
import { Link } from './link.proto.js';

export default defineSpecimen({
  id: 'link',
  title: 'Link',
  group: 'Typography',
  sections: [
    {
      id: 'roles',
      title: 'Inline and quiet utility',
      kind: 'matrix',
      render: () => (
        <div style={{ display: 'grid', gap: 'var(--space-16)' }}>
          <Link href="#reference">Browse all documents →</Link>
          <Link tone="neutral" href="#security">
            Security
          </Link>
        </div>
      ),
    },
    {
      id: 'wrapping',
      title: 'Long reference',
      kind: 'states',
      render: () => (
        <Text size="body-s">
          <Link href="#reference">
            Regional Envoy connection-draining budgets and verification procedures across
            availability zones
          </Link>
        </Text>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Internal reference',
      kind: 'context',
      render: () => (
        <Text size="body-s">
          Drain budgets inherit quorum from <Link href="#reference">Zero-Downtime PG Failover</Link>{' '}
          before promoting a standby.
        </Text>
      ),
    },
  ],
});
