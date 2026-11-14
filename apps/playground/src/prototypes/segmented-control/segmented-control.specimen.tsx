import { defineSpecimen } from '../../workbench/types.js';
import { SegmentedControl } from './segmented-control.proto.js';
import '../input/input.css';

const views = [
  { value: 'all', label: 'All documents' },
  { value: 'owned', label: 'Owned by me' },
  { value: 'recent', label: 'Recent' },
];

export default defineSpecimen({
  id: 'segmented-control',
  title: 'SegmentedControl',
  group: 'Forms',
  summary: 'One local choice in a continuous rail. Native radios keep arrow-key navigation honest.',
  sections: [
    {
      id: 'sizes',
      title: 'One rail · Three sizes',
      kind: 'matrix',
      render: () => (
        <div className="control-stack-proto">
          {(['s', 'm', 'l'] as const).map((size) => (
            <SegmentedControl
              key={size}
              size={size}
              items={views}
              aria-label={`Document view ${size}`}
            />
          ))}
        </div>
      ),
    },
    {
      id: 'states',
      title: 'Disabled & long choices',
      kind: 'states',
      render: () => (
        <div className="control-stack-proto">
          <SegmentedControl items={views} disabled aria-label="Unavailable document view" />
          <SegmentedControl
            items={[
              { value: 'internal', label: 'Workspace members' },
              { value: 'restricted', label: 'Only people invited to this specific document' },
            ]}
            aria-label="Document access"
          />
        </div>
      ),
    },
    {
      id: 'auth',
      title: 'Folio · Sign in or create account',
      kind: 'context',
      render: () => (
        <div className="control-panel-proto">
          <SegmentedControl
            size="s"
            items={[
              { value: 'sign-in', label: 'Sign in' },
              { value: 'create', label: 'Create account' },
            ]}
            aria-label="Authentication mode"
          />
          <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 'var(--text-size-body-s)' }}>
            Continue to your engineering runbooks and architecture corpus.
          </p>
        </div>
      ),
    },
  ],
});
