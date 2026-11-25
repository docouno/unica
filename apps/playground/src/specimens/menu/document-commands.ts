import { CopyIcon, PencilSimpleIcon } from '@phosphor-icons/react';

export const documentCommands = [
  { id: 'rename', label: 'Rename', icon: PencilSimpleIcon },
  { id: 'copy', label: 'Copy link', icon: CopyIcon },
  Object.freeze({ id: 'separator', type: 'separator' }),
  Object.freeze({ id: 'archive', label: 'Archive', tone: 'danger' }),
];
