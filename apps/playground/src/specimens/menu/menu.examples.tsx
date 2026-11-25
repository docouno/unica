import { useState } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
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
import { Button, Card, Flex, IconButton, Stack, Text } from '@docouno/unica';
import { Menu } from '../../prototypes/menu/menu.live.js';
import { MenuBack, MenuPreview, MenuRows, MenuSurface } from '../../prototypes/menu/menu.proto.js';
import type { MenuEntry, MenuSize } from '../../prototypes/menu/menu.entries.js';
import { useDocumentReceipt, documentLink } from './use-document-receipt.js';
import './menu.examples.css';

const commands: readonly MenuEntry[] = [
  {
    id: 'open',
    label: 'Open details',
    icon: FileTextIcon,
    type: 'link',
    href: documentLink,
  },
  { id: 'rename', label: 'Rename', icon: PencilSimpleIcon, shortcut: 'F2' },
  { id: 'copy', label: 'Copy link', icon: LinkSimpleIcon, shortcut: '⇧⌘C' },
  { id: 'divider', type: 'separator' },
  { id: 'trash', label: 'Move to trash', icon: TrashIcon, tone: 'danger' },
];

const sizes: readonly (readonly [MenuSize, string])[] = [
  ['s', 'Compact · S'],
  ['m', 'Default · M'],
  ['l', 'Roomy · L'],
];

export function Density({ ctx }: PreviewProps) {
  return (
    <Flex className="menu-study-grid" justify="center" align="start" wrap="wrap" gap={24}>
      {sizes.map(([size, label]) => (
        <div key={size} className="menu-study-example">
          <Text size="caption-l" color="secondary">
            {label}
          </Text>
          <MenuPreview {...ctx.subject} label={label} size={size} items={commands} />
        </div>
      ))}
    </Flex>
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

export function States({ ctx }: PreviewProps) {
  return (
    <Flex className="menu-study-grid" justify="center" align="start" wrap="wrap" gap={24}>
      <div className="menu-study-example">
        <Text size="caption-l" color="secondary">
          Action states
        </Text>
        <MenuPreview {...ctx.subject} label="Pointer and keyboard states" items={actionStates} />
      </div>
      <div className="menu-study-example">
        <Text size="caption-l" color="secondary">
          Persistent choices
        </Text>
        <MenuPreview {...ctx.subject} label="Persistent choices" items={choiceStates} />
      </div>
    </Flex>
  );
}

const exportItems: readonly MenuEntry[] = [
  { id: 'csv', label: 'CSV', icon: FileTextIcon },
  { id: 'md', label: 'Markdown', icon: FileTextIcon },
  { id: 'pdf', label: 'PDF', icon: FileTextIcon },
];

export function BranchPreview({ ctx }: PreviewProps) {
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
    <Flex className="menu-study-grid" justify="center" align="start" wrap="wrap" gap={24}>
      <div className="menu-study-example menu-study-wide-cascade">
        <Text size="caption-l" color="secondary">
          Cascading panels
        </Text>
        <div className="menu-study-cascade">
          <MenuPreview {...ctx.subject} label="File actions" items={items} />
          <MenuPreview {...ctx.subject} label="Export formats" items={formats} />
        </div>
      </div>
      <div className="menu-study-example">
        <Text size="caption-l" color="secondary">
          Single-panel submenu
        </Text>
        <MenuSurface {...ctx.subject} role="group" aria-label="Export formats">
          <MenuBack name="Back to file actions" title="Export as" />
          <MenuRows items={formats} preview />
        </MenuSurface>
      </div>
    </Flex>
  );
}

export function LiveExamples({ ctx }: PreviewProps) {
  const [preview, setPreview] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [sort, setSort] = useState('Last modified');
  const { receipt, report, copyLink } = useDocumentReceipt();
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
          run: () => {
            setPreview((value) => !value);
            report('');
          },
        },
        {
          id: 'hidden',
          label: 'Hidden files',
          type: 'checkbox',
          checked: hidden,
          run: () => {
            setHidden((value) => !value);
            report('');
          },
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
        run: () => {
          setSort(label);
          report('');
        },
      })),
    },
  ];
  const actions: readonly MenuEntry[] = [
    {
      id: 'open',
      label: 'Open guide',
      icon: FileTextIcon,
      type: 'link',
      href: documentLink,
    },
    {
      id: 'rename',
      label: 'Rename',
      icon: PencilSimpleIcon,
      run: () => report('Rename requested.'),
    },
    {
      id: 'copy',
      label: 'Copy link',
      icon: LinkSimpleIcon,
      run: copyLink,
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
          run: () => report('Markdown export requested.'),
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
      run: () => report('Move to trash requested.'),
    },
  ];

  return (
    <div className="menu-study-live" data-menu-boundary>
      <Card size="s" data-surface="base" style={{ inlineSize: 'min(27rem, 100%)' }}>
        <Stack gap={8}>
          <Text size="body-s" weight="semibold" dir="auto">
            Failover notes · Draft
          </Text>
          <Flex align="center" wrap="wrap" gap={8}>
            <Menu
              panelAttributes={ctx.subject}
              label="View options"
              items={items}
              trigger={(props) => (
                <Button
                  {...props}
                  {...ctx.subject}
                  iconLeft={SlidersHorizontalIcon}
                  variant="secondary"
                  tone="neutral"
                >
                  View options
                </Button>
              )}
            />
            <Menu
              panelAttributes={ctx.subject}
              label="File actions"
              items={actions}
              align="end"
              trigger={(props) => (
                <IconButton
                  {...props}
                  {...ctx.subject}
                  aria-label="File actions"
                  icon={DotsThreeIcon}
                />
              )}
            />
          </Flex>
          <Text color="secondary" size="caption-l" role="status" dir="auto">
            {receipt ? receipt + ' ' : ''}
            {`Sort: ${sort} · Preview ${preview ? 'on' : 'off'} · Hidden files ${hidden ? 'on' : 'off'}`}
          </Text>
        </Stack>
      </Card>
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

export function Overflow({ ctx }: PreviewProps) {
  const [folder, setFolder] = useState('');
  return (
    <Flex className="menu-study-grid" justify="center" align="start" wrap="wrap" gap={24}>
      <div className="menu-study-example">
        <Text size="caption-l" color="secondary">
          Long labels and shortcut hints
        </Text>
        <MenuPreview
          {...ctx.subject}
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
          panelAttributes={ctx.subject}
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
            <Button
              {...props}
              {...ctx.subject}
              variant="secondary"
              tone="neutral"
              iconLeft={FolderSimpleIcon}
            >
              Move to folder
            </Button>
          )}
        />
        <Text size="caption-l" color="secondary" role="status" dir="auto">
          {folder ? `Destination: ${folder}` : 'No folder chosen.'}
        </Text>
      </div>
    </Flex>
  );
}
