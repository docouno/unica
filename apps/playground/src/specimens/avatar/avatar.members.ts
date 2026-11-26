import type { AvatarGroupProps } from '@docouno/unica';

export const contributors: AvatarGroupProps['members'] = [
  { id: 'editor', name: 'Content editor', src: '/assets/avatar-person-light.png' },
  { id: 'reviewer', name: 'Design reviewer', src: '/assets/avatar-person-dark.png' },
  { id: 'writer', name: 'Workspace writer' },
  { id: 'owner', name: 'Project owner' },
  { id: 'engineer', name: 'Platform engineer' },
  { id: 'researcher', name: 'Design researcher' },
  { id: 'maintainer', name: 'Library maintainer' },
];
