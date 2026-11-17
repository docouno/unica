import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  CopyIcon,
  DownloadSimpleIcon,
  DotsThreeIcon,
  FileTextIcon,
  FolderSimpleIcon,
  LinkSimpleIcon,
  PencilSimpleIcon,
  SlidersHorizontalIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { Button, IconButton } from '../button/button.proto.js';
import { Text } from '../text/text.proto.js';
import { defineSpecimen } from '../../workbench/types.js';
import { Menu } from './menu.live.js';
import { MenuBack, MenuPreview, MenuRows, MenuSurface } from './menu.proto.js';
import type { MenuEntry, MenuSize } from './menu.entries.js';
import './menu.examples.css';

const commands: readonly MenuEntry[] = [
  {
    id: 'open',
    label: 'Open details',
    icon: FileTextIcon,
    type: 'link',
    href: '?item=04-document-reader',
  },
  { id: 'rename', label: 'Rename', icon: PencilSimpleIcon, shortcut: 'F2' },
  { id: 'copy', label: 'Copy link', icon: LinkSimpleIcon, shortcut: '⇧⌘C' },
  { id: 'divider', type: 'separator' },
  { id: 'trash', label: 'Move to trash', icon: TrashIcon, tone: 'danger' },
];

const sizes: readonly (readonly [MenuSize, string])[] = [
  ['s', 'Compact'],
  ['m', 'Default'],
  ['l', 'Roomy'],
];

function Density(): ReactElement {
  return (
    <div className="menu-study-grid">
      {sizes.map(([size, label]) => (
        <div key={size} className="menu-study-example">
          <Text size="caption-l" color="secondary">
            {label}
          </Text>
          <MenuPreview label={label} size={size} items={commands} />
        </div>
      ))}
    </div>
  );
}

const choiceStates: readonly MenuEntry[] = [
  {
    id: 'show',
    label: 'Show',
    type: 'group',
    items: [
      { id: 'preview', label: 'Preview', type: 'checkbox', checked: true },
      { id: 'hidden', label: 'Hidden files', type: 'checkbox', checked: false, preview: 'hover' },
      { id: 'sizes', label: 'File sizes', type: 'checkbox', checked: true, disabled: true },
    ],
  },
  { id: 'divider', type: 'separator' },
  {
    id: 'sort',
    label: 'Sort by',
    type: 'group',
    items: [
      { id: 'updated', label: 'Last modified', type: 'radio', checked: true },
      { id: 'name', label: 'Name', type: 'radio', checked: false },
      { id: 'size', label: 'Size', type: 'radio', checked: false },
    ],
  },
];

const actionStates: readonly MenuEntry[] = [
  { id: 'export', label: 'Export Markdown', icon: DownloadSimpleIcon },
  { id: 'copy', label: 'Copy as plain text', icon: CopyIcon, shortcut: '⇧⌘C', preview: 'hover' },
  { id: 'move', label: 'Move to folder', icon: FolderSimpleIcon, preview: 'pressed' },
  {
    id: 'rename',
    label: 'Rename',
    icon: PencilSimpleIcon,
    shortcut: 'F2',
    disabled: true,
    description: 'Locked by an editor',
    preview: 'focus',
  },
  { id: 'divider', type: 'separator' },
  { id: 'trash', label: 'Move to trash', icon: TrashIcon, tone: 'danger', preview: 'hover' },
];

function States(): ReactElement {
  return (
    <div className="menu-study-grid">
      <div className="menu-study-example">
        <Text size="caption-l" color="secondary">
          Action states · pinned
        </Text>
        <MenuPreview label="Pointer and keyboard states" items={actionStates} />
      </div>
      <div className="menu-study-example">
        <Text size="caption-l" color="secondary">
          Persistent choices · pinned
        </Text>
        <MenuPreview label="Persistent choices" items={choiceStates} />
      </div>
    </div>
  );
}

const exportItems: readonly MenuEntry[] = [
  { id: 'csv', label: 'CSV', icon: FileTextIcon },
  { id: 'md', label: 'Markdown', icon: FileTextIcon },
  { id: 'pdf', label: 'PDF', icon: FileTextIcon },
];

function BranchPreview(): ReactElement {
  const formats = exportItems;
  const items: readonly MenuEntry[] = [
    { id: 'open', label: 'Open details', icon: FileTextIcon },
    {
      id: 'export',
      label: 'Export as',
      icon: DownloadSimpleIcon,
      type: 'branch',
      items: formats,
      preview: 'expanded',
    },
    { id: 'copy', label: 'Copy link', icon: LinkSimpleIcon },
    { id: 'trash', label: 'Move to trash', icon: TrashIcon, tone: 'danger' },
  ];
  return (
    <div className="menu-study-grid">
      <div className="menu-study-example menu-study-wide-cascade">
        <Text size="caption-l" color="secondary">
          Cascade · pinned
        </Text>
        <div className="menu-study-cascade">
          <MenuPreview label="File actions" items={items} />
          <MenuPreview label="Export formats" items={formats} />
        </div>
      </div>
      <div className="menu-study-example">
        <Text size="caption-l" color="secondary">
          Inline submenu · pinned
        </Text>
        <MenuSurface role="group" aria-label="Export formats">
          <MenuBack name="Back to file actions" title="Export as" />
          <MenuRows items={formats} preview />
        </MenuSurface>
      </div>
    </div>
  );
}

function LiveExamples(): ReactElement {
  const [preview, setPreview] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [sort, setSort] = useState('Last modified');
  const [notice, setNotice] = useState('');
  const announce = (label: string): void => setNotice(label);
  const items: readonly MenuEntry[] = [
    {
      id: 'show',
      label: 'Show',
      type: 'group',
      items: [
        {
          id: 'preview',
          label: 'Preview',
          type: 'checkbox',
          checked: preview,
          run: () => setPreview(!preview),
        },
        {
          id: 'hidden',
          label: 'Hidden files',
          type: 'checkbox',
          checked: hidden,
          run: () => setHidden(!hidden),
        },
      ],
    },
    { id: 'divider', type: 'separator' },
    {
      id: 'sort',
      type: 'branch',
      label: 'Sort by',
      items: ['Last modified', 'Name', 'Size'].map((label) => ({
        id: label,
        label,
        type: 'radio',
        checked: sort === label,
        run: () => setSort(label),
      })),
    },
  ];
  const actions: readonly MenuEntry[] = [
    {
      id: 'open',
      label: 'Open details',
      icon: FileTextIcon,
      type: 'link',
      href: '?item=04-document-reader',
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: PencilSimpleIcon,
      shortcut: 'F2',
      run: () => announce('Rename selected'),
    },
    {
      id: 'copy',
      label: 'Copy link',
      icon: LinkSimpleIcon,
      shortcut: '⇧⌘C',
      run: () => announce('Link selected for copying'),
    },
    {
      id: 'export',
      label: 'Export as',
      icon: DownloadSimpleIcon,
      type: 'branch',
      items: [
        {
          id: 'md',
          label: 'Markdown',
          icon: FileTextIcon,
          run: () => announce('Markdown export requested'),
        },
        {
          id: 'pdf',
          label: 'PDF',
          icon: FileTextIcon,
          description: 'Available for published files',
          disabled: true,
        },
      ],
    },
    { id: 'separator', type: 'separator' },
    {
      id: 'trash',
      label: 'Move to trash',
      tone: 'danger',
      icon: TrashIcon,
      run: () => announce('Move to trash selected'),
    },
  ];

  return (
    <div className="menu-study-live" data-menu-boundary>
      <div className="menu-study-trigger-row">
        <Menu
          label="View options"
          items={items}
          trigger={(props) => (
            <Button {...props} iconLeft={SlidersHorizontalIcon} variant="secondary" tone="neutral">
              View options
            </Button>
          )}
        />
        <Menu
          label="File actions"
          items={actions}
          align="end"
          trigger={(props) => (
            <IconButton {...props} aria-label="File actions" icon={DotsThreeIcon} />
          )}
        />
        <Button variant="ghost" tone="neutral" onClick={() => setNotice('Returned to the toolbar')}>
          Done
        </Button>
      </div>
      <Text color="secondary" size="caption-l" role="status">
        {notice ||
          `Sort: ${sort} · Preview ${preview ? 'on' : 'off'} · Hidden files ${hidden ? 'on' : 'off'}`}
      </Text>
    </div>
  );
}

const destinations = [
  'Design',
  'Engineering',
  'Customer support',
  'Documentation and operational readiness',
  'Incident response',
  'Launch readiness',
  'Learning and development',
  'Procurement',
  'Security and compliance',
  'Workspace administration',
];
const overflow: readonly MenuEntry[] = [
  {
    id: 'workspaces',
    type: 'group',
    label: 'Shared folders',
    items: destinations.map((label) => ({ id: label, label, icon: FolderSimpleIcon })),
  },
];

function Overflow(): ReactElement {
  const [folder, setFolder] = useState('');
  return (
    <div className="menu-study-grid">
      <div className="menu-study-example">
        <Text size="caption-l" color="secondary">
          Long labels and scroll · pinned
        </Text>
        <MenuPreview
          className="menu-study-overflow"
          label="Shared folders"
          items={[
            {
              id: 'label',
              label: 'Export incident-review–customer-communications.md',
              icon: FileTextIcon,
              shortcut: '⇧⌘E',
            },
            {
              id: 'publish',
              label: 'Publish scheduled export',
              icon: FileTextIcon,
              shortcut: 'Ctrl+Shift+PageDown',
            },
            { id: 'divider', type: 'separator' },
            ...overflow,
          ]}
        />
      </div>
      <div className="menu-study-example">
        <Menu
          label="Move to folder"
          items={[
            {
              id: 'workspaces',
              type: 'group',
              label: 'Shared folders',
              items: destinations.map((label) => ({
                id: label,
                label,
                icon: FolderSimpleIcon,
                run: () => setFolder(label),
              })),
            },
          ]}
          trigger={(props) => (
            <Button {...props} variant="secondary" tone="neutral" iconLeft={FolderSimpleIcon}>
              Move to folder
            </Button>
          )}
        />
        <Text size="caption-l" color="secondary" role="status">
          {folder ? `Destination: ${folder}` : 'Try End, Home or type a folder name'}
        </Text>
      </div>
    </div>
  );
}

export default defineSpecimen({
  id: 'menu',
  title: 'Menu',
  group: 'Overlays',
  sections: [
    {
      id: 'actions',
      title: 'Commands and sizes',
      kind: 'matrix',
      overlayStage: true,
      render: () => <Density />,
    },
    {
      id: 'states',
      title: 'Row states and choices',
      kind: 'states',
      overlayStage: true,
      render: () => <States />,
    },
    {
      id: 'submenu',
      title: 'Submenu',
      kind: 'states',
      overlayStage: true,
      render: () => <BranchPreview />,
    },
    {
      id: 'live',
      title: 'Open, choose and dismiss',
      kind: 'context',
      overlayStage: true,
      render: () => <LiveExamples />,
    },
    {
      id: 'overflow',
      title: 'Long content and scrolling',
      kind: 'states',
      overlayStage: true,
      render: () => <Overflow />,
    },
  ],
});
