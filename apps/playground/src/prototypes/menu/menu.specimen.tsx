import { CopyIcon, DownloadSimpleIcon, GitDiffIcon, TrashIcon } from '@phosphor-icons/react';
import { defineSpecimen } from '../../workbench/types.js';
import { Text } from '../text/text.proto.js';
import { Menu, MenuItem, MenuSeparator, HoverCard } from './menu.proto.js';

export default defineSpecimen({
  id: 'menu',
  title: 'Menu & HoverCard',
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
    {
      id: 'owner',
      title: 'Folio · On-call owner',
      kind: 'context',
      overlayStage: true,
      render: () => (
        <HoverCard>
          <Text weight="semibold">Database reliability team</Text>
          <Text size="body-s" color="secondary">
            Staff SRE · Core Infrastructure
          </Text>
          <Text size="caption-l" color="muted">
            28 Tier-0 runbooks owned · UTC+1
          </Text>
        </HoverCard>
      ),
    },
  ],
});
