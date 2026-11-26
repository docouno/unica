import { useState } from 'react';
import {
  CopyIcon,
  DownloadSimpleIcon,
  DotsThreeIcon,
  FileTextIcon,
  FolderSimpleIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import {
  Button,
  IconButton,
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  Stack,
  Text,
} from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { documentLink } from './use-document-receipt.js';

export function Density({ ctx }: PreviewProps) {
  return (
    <Stack gap={8} align="start">
      {(['s', 'm', 'l'] as const).map((size) => (
        <Menu key={size} size={size}>
          <MenuTrigger asChild>
            <Button size={size}>Document actions · {size.toUpperCase()}</Button>
          </MenuTrigger>
          <MenuContent {...ctx.subject}>
            <MenuItem icon={FileTextIcon} href={documentLink} target="_blank" rel="noreferrer">
              Open details
            </MenuItem>
            <MenuItem icon={PencilSimpleIcon} shortcut="F2">
              Rename
            </MenuItem>
            <MenuItem icon={CopyIcon} shortcut="⇧⌘C">
              Copy link
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={TrashIcon} tone="danger">
              Move to trash
            </MenuItem>
          </MenuContent>
        </Menu>
      ))}
    </Stack>
  );
}

export function Choices({ ctx }: PreviewProps) {
  return (
    <Menu>
      <MenuTrigger asChild>
        <Button>View options</Button>
      </MenuTrigger>
      <MenuContent {...ctx.subject}>
        <MenuGroup>
          <MenuLabel>Show</MenuLabel>
          <MenuCheckboxItem defaultChecked>Preview</MenuCheckboxItem>
          <MenuCheckboxItem>Hidden files</MenuCheckboxItem>
          <MenuCheckboxItem defaultChecked disabled>
            File sizes
          </MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuRadioGroup defaultValue="updated">
          <MenuLabel>Sort by</MenuLabel>
          <MenuRadioItem value="updated">Last modified</MenuRadioItem>
          <MenuRadioItem value="name">Name</MenuRadioItem>
          <MenuRadioItem value="size">Size</MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </Menu>
  );
}

export function FileActions({ ctx }: PreviewProps) {
  const [message, setMessage] = useState('');
  return (
    <Stack align="start" gap={8}>
      <Menu>
        <MenuTrigger asChild>
          <IconButton icon={DotsThreeIcon} aria-label="File actions" />
        </MenuTrigger>
        <MenuContent {...ctx.subject}>
          <MenuItem icon={FileTextIcon} href={documentLink} target="_blank" rel="noreferrer">
            Open details
          </MenuItem>
          <MenuItem icon={PencilSimpleIcon} description="You need edit access" disabled>
            Rename
          </MenuItem>
          <MenuSub>
            <MenuSubTrigger icon={DownloadSimpleIcon}>Export as</MenuSubTrigger>
            <MenuSubContent>
              {['CSV', 'Markdown', 'PDF'].map((format) => (
                <MenuItem
                  key={format}
                  icon={FileTextIcon}
                  onClick={() => setMessage(`${format} export requested.`)}
                >
                  {format}
                </MenuItem>
              ))}
            </MenuSubContent>
          </MenuSub>
          <MenuItem icon={CopyIcon} onClick={() => setMessage('Link selected for copying.')}>
            Copy link
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            icon={TrashIcon}
            tone="danger"
            onClick={() => setMessage('Move to trash requested.')}
          >
            Move to trash
          </MenuItem>
        </MenuContent>
      </Menu>
      {message && (
        <Text role="status" size="caption-l" color="secondary">
          {message}
        </Text>
      )}
    </Stack>
  );
}

const destinations = [
  'Administration',
  'Analytics',
  'Archive',
  'Customer reviews',
  'Design',
  'Engineering',
  'Finance',
  'Infrastructure',
  'Legal',
  'Operations',
  'Platform',
  'Research',
  'Security',
  'Support',
];

export function Overflow({ ctx }: PreviewProps) {
  const [message, setMessage] = useState('');
  return (
    <Stack align="start" gap={8}>
      <Menu>
        <MenuTrigger asChild>
          <Button>Workspace actions</Button>
        </MenuTrigger>
        <MenuContent {...ctx.subject} style={{ maxBlockSize: 222 }}>
          <MenuItem
            description="Includes the current revision and all linked reference documents."
            shortcut="Control Shift International Keyboard"
          >
            Open the release checklist in a new workspace
          </MenuItem>
          <MenuSub>
            <MenuSubTrigger icon={FolderSimpleIcon}>Move to folder</MenuSubTrigger>
            <MenuSubContent style={{ maxBlockSize: 222 }}>
              {destinations.map((label) => (
                <MenuItem
                  key={label}
                  icon={FolderSimpleIcon}
                  onClick={() => setMessage(`Move to ${label} requested.`)}
                >
                  {label}
                </MenuItem>
              ))}
            </MenuSubContent>
          </MenuSub>
          <MenuSeparator />
          <MenuItem
            disabled
            tone="danger"
            icon={TrashIcon}
            description="This revision is shared with another workspace."
          >
            Permanently remove the workspace reference
          </MenuItem>
        </MenuContent>
      </Menu>
      {message && (
        <Text role="status" size="caption-l" color="secondary">
          {message}
        </Text>
      )}
    </Stack>
  );
}
