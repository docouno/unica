import {
  EyeIcon,
  ChatCircleIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  GlobeHemisphereWestIcon,
} from '@phosphor-icons/react';
import type { ListboxItem, ListboxSection } from '@docouno/unica';

export const simpleRoles: readonly ListboxItem[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'commenter', label: 'Commenter' },
  { value: 'editor', label: 'Editor' },
];

export const memberRoles: readonly ListboxItem[] = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read pages and download files',
    iconLeft: EyeIcon,
  },
  {
    value: 'commenter',
    label: 'Commenter',
    description: 'Read pages and leave feedback',
    iconLeft: ChatCircleIcon,
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Edit pages and publish changes',
    iconLeft: PencilSimpleIcon,
  },
];

export const roleOptions: readonly ListboxSection[] = [
  { label: 'Members', options: memberRoles },
  {
    label: 'Administration',
    options: [
      {
        value: 'admin',
        label: 'Administrator',
        description: 'Manage access and workspace policy',
        iconLeft: ShieldCheckIcon,
        disabled: true,
      },
    ],
  },
];

const europe: readonly ListboxItem[] = [
  { value: 'amsterdam', label: 'Amsterdam', description: 'Europe · UTC+01:00' },
  { value: 'frankfurt', label: 'Frankfurt', description: 'Europe · UTC+01:00' },
  { value: 'london', label: 'London', description: 'Europe · UTC+00:00' },
  { value: 'stockholm', label: 'Stockholm', description: 'Europe · UTC+01:00' },
];

const americas: readonly ListboxItem[] = [
  { value: 'virginia', label: 'Northern Virginia', description: 'United States · UTC−05:00' },
  { value: 'oregon', label: 'Oregon', description: 'United States · UTC−08:00' },
  { value: 'toronto', label: 'Toronto', description: 'Canada · UTC−05:00' },
];

const asiaPacific: readonly ListboxItem[] = [
  { value: 'singapore', label: 'Singapore', description: 'Asia Pacific · UTC+08:00' },
  { value: 'sydney', label: 'Sydney', description: 'Asia Pacific · UTC+10:00' },
  { value: 'tokyo', label: 'Tokyo', description: 'Asia Pacific · UTC+09:00' },
];

export const regionOptions: readonly ListboxSection[] = [
  { label: 'Europe', options: europe },
  { label: 'Americas', options: americas },
  { label: 'Asia Pacific', options: asiaPacific },
].map(({ label, options }) => ({
  label,
  options: options.map((option) => ({ ...option, iconLeft: GlobeHemisphereWestIcon })),
}));

export const regionLabels = Object.fromEntries(
  regionOptions.flatMap(({ options }) => options.map(({ value, label }) => [value, label])),
);
