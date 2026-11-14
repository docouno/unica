import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Button } from '../button/button.proto.js';
import { Text } from '../text/text.proto.js';
import { Modal, Drawer } from './dialog.proto.js';

function DialogExample({ drawer = false }: { readonly drawer?: boolean } = {}): ReactElement {
  const [open, setOpen] = useState(true);
  const Surface = drawer ? Drawer : Modal;
  return (
    <div className="dialog-preview-study">
      <Button onClick={() => setOpen(true)}>Open {drawer ? 'properties' : 'invitation'}</Button>
      <Surface
        open={open}
        title={drawer ? 'Document properties & review' : 'Invite members to Platform Eng'}
        description="A focused workspace task, with controls belonging to the floating surface."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" tone="neutral" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save changes</Button>
          </>
        }
      >
        <Text size="body-s">
          This preview shows the shared surface, spacing, and local dismissal. Detailed controls are
          composed in the Folio scenes.
        </Text>
        <Text size="body-s">
          A long description wraps naturally across the available width without changing the
          floating panel’s hierarchy.
        </Text>
      </Surface>
    </div>
  );
}

export default defineSpecimen({
  id: 'dialog',
  title: 'Modal & Drawer',
  group: 'Overlays',
  sections: [
    { id: 'modal', title: 'Centered task', kind: 'matrix', render: DialogExample },
    {
      id: 'drawer',
      title: 'Properties at the edge',
      kind: 'context',
      render: () => <DialogExample drawer />,
    },
    { id: 'dismissal', title: 'Close and reopen', kind: 'states', render: DialogExample },
  ],
});
