import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Combobox, Listbox, Select, TagsInput } from './select.proto.js';

const roles = [
  { value: 'viewer', label: 'Viewer', description: 'Can read shared pages' },
  { value: 'commenter', label: 'Commenter', description: 'Can read and leave feedback' },
  { value: 'editor', label: 'Editor', description: 'Can edit pages and publish changes' },
  { value: 'owner', label: 'Owner', description: 'Manages access and workspace policy' },
];

function PanelExample(): ReactElement {
  const [role, setRole] = useState('editor');
  return (
    <Listbox
      options={roles}
      value={role}
      onValueChange={setRole}
      title="Workspace role"
      aria-label="Workspace role preview"
    />
  );
}

export default defineSpecimen({
  id: 'select',
  title: 'Select, Combobox & TagsInput',
  group: 'Forms',
  summary:
    'Native select fields, editable suggestions, and visible choice panels for product compositions.',
  sections: [
    {
      id: 'roles',
      title: 'Framed & inline choices',
      kind: 'matrix',
      render: () => (
        <div className="control-examples-proto">
          {(['s', 'm', 'l'] as const).map((size) => (
            <div className="control-stack-proto" key={size}>
              <Select
                label={`Workspace role · ${size}`}
                size={size}
                options={roles}
                defaultValue="editor"
              />
              <Select
                aria-label={`Inline role ${size}`}
                size={size}
                variant="ghost"
                options={roles}
                defaultValue="viewer"
              />
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'states',
      title: 'Choice panel & availability',
      kind: 'states',
      surface: 'overlay',
      overlayStage: true,
      render: () => (
        <div className="control-examples-proto">
          <PanelExample />
          <div className="control-stack-proto">
            <Select label="Workspace policy" options={roles} disabled defaultValue="viewer" />
            <Select
              label="Missing role"
              options={[{ value: '', label: 'Choose a role' }, ...roles]}
              status="danger"
              message="Select a role for the invited members."
            />
            <Combobox
              label="Reviewers"
              options={[
                {
                  value: 'network',
                  label: 'Network reviewer',
                  description: 'Platform engineering',
                },
                {
                  value: 'database',
                  label: 'Database reviewer',
                  description: 'Reliability engineering',
                },
              ]}
              placeholder="Search reviewers"
            />
          </div>
        </div>
      ),
    },
    {
      id: 'invite',
      title: 'Folio · Invite people',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => (
        <div className="control-panel-proto">
          <TagsInput
            label="People"
            initialValues={['platform@example.com', 'reviewer@example.com']}
          />
          <Select label="Role" options={roles} defaultValue="editor" />
          <p
            style={{ margin: 0, color: 'var(--fg-muted)', fontSize: 'var(--text-size-caption-l)' }}
          >
            Press Enter or comma to add another person. These choices update the local preview.
          </p>
        </div>
      ),
    },
  ],
});
