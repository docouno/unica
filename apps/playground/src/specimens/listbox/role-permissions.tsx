import { useState } from 'react';
import { Stack, Text, Listbox } from '@docouno/unica';
import '@docouno/unica/styles.css';

const roles = [
  { value: 'viewer', label: 'Viewer', permissions: 'Read pages.' },
  { value: 'commenter', label: 'Commenter', permissions: 'Read pages and leave comments.' },
  { value: 'editor', label: 'Editor', permissions: 'Read, comment and edit pages.' },
];

export function RolePermissions({ listProps = {} } = {}) {
  const [selected, setSelected] = useState('viewer');
  const role = roles.find(({ value }) => value === selected);
  return (
    <Stack gap={12} style={{ inlineSize: 'min(100%, 24rem)' }}>
      <Listbox
        {...listProps}
        aria-label="Access level"
        options={roles}
        value={selected}
        onValueChange={(value) => setSelected(value ?? '')}
      />
      <Text size="body-s" color="secondary" role="status">
        <bdi>
          {role ? `${role.label} permissions: ${role.permissions}` : 'No access level selected.'}
        </bdi>
      </Text>
    </Stack>
  );
}
