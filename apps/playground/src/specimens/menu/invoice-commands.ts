import { CopyIcon, DownloadSimpleIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';

export const invoiceCommands = [
  { id: 'rename', label: 'Rename', icon: PencilSimpleIcon, shortcut: 'F2' },
  { id: 'copy', label: 'Copy file link', icon: CopyIcon },
  {
    id: 'export',
    label: 'Export PDF',
    icon: DownloadSimpleIcon,
    disabled: true,
    description: 'Publish the draft first',
  },
  Object.freeze({ id: 'divider', type: 'separator' }),
  Object.freeze({ id: 'trash', label: 'Move to trash', icon: TrashIcon, tone: 'danger' }),
];
