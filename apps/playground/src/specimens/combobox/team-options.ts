import {
  BuildingOfficeIcon,
  CloudIcon,
  DatabaseIcon,
  GlobeHemisphereWestIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react';

export const teams = [
  {
    value: 'data',
    label: 'Data Platform',
    description: 'Storage, backups and replication',
    group: 'Engineering',
    icon: DatabaseIcon,
  },
  {
    value: 'network',
    label: 'Edge Networking',
    description: 'Traffic, DNS and routing',
    group: 'Engineering',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'cloud',
    label: 'Cloud Foundations',
    description: 'Compute and deployment infrastructure',
    group: 'Engineering',
    icon: CloudIcon,
  },
  {
    value: 'security',
    label: 'Security Operations',
    description: 'Access and incident response',
    group: 'Operations',
    icon: ShieldCheckIcon,
  },
  {
    value: 'office',
    label: 'Workplace Systems',
    description: 'Provisioned by your administrator',
    group: 'Operations',
    icon: BuildingOfficeIcon,
    disabled: true,
  },
];
