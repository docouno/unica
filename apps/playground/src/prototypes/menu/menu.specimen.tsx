import { CopyIcon, DownloadSimpleIcon, GitDiffIcon, TrashIcon } from '@phosphor-icons/react';
import { defineSpecimen } from '../../workbench/types.js';
import { Menu, MenuItem, MenuSeparator } from './menu.proto.js';

export default defineSpecimen({
  id: 'menu',
  title: 'Menu',
  group: 'Overlays',
  sections: [
    {
      id: 'actions',
      title: 'Document actions',
      kind: 'matrix',
      overlayStage: true,
      render: () => (
        <Menu>
          <MenuItem icon={CopyIcon} shortcut="⌘L">
            Copy document link
          </MenuItem>
          <MenuItem icon={GitDiffIcon} shortcut="⌘D">
            Compare revisions
          </MenuItem>
          <MenuItem icon={DownloadSimpleIcon}>Export Markdown</MenuItem>
          <MenuSeparator />
          <MenuItem icon={TrashIcon} danger>
            Move to trash
          </MenuItem>
        </Menu>
      ),
    },
    {
      id: 'states',
      title: 'Available and disabled',
      kind: 'states',
      overlayStage: true,
      render: () => (
        <Menu>
          <MenuItem>Open runbook</MenuItem>
          <MenuItem disabled>Export unavailable revision</MenuItem>
        </Menu>
      ),
    },
  ],
});
