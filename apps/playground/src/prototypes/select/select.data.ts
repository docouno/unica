import {
  EyeIcon,
  ChatCircleIcon,
  PencilSimpleIcon,
  ShieldCheckIcon,
  GlobeHemisphereWestIcon,
} from '@phosphor-icons/react';
import type { SelectOption } from './select.proto.js';

export const simpleOptions: readonly SelectOption[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'commenter', label: 'Commenter' },
  { value: 'editor', label: 'Editor' },
];
export const roleOptions: readonly SelectOption[] = [
  {
    value: 'viewer',
    label: 'Viewer',
    description: 'Read pages and download files',
    icon: EyeIcon,
    group: 'Members',
  },
  {
    value: 'commenter',
    label: 'Commenter',
    description: 'Read pages and leave feedback',
    icon: ChatCircleIcon,
    group: 'Members',
  },
  {
    value: 'editor',
    label: 'Editor',
    description: 'Edit pages and publish changes',
    icon: PencilSimpleIcon,
    group: 'Members',
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Manage access and workspace policy',
    icon: ShieldCheckIcon,
    group: 'Administration',
    disabled: true,
  },
];
export const regionOptions: readonly SelectOption[] = [
  {
    value: 'amsterdam',
    label: 'Amsterdam',
    description: 'Europe · UTC+01:00',
    group: 'Europe',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'frankfurt',
    label: 'Frankfurt',
    description: 'Europe · UTC+01:00',
    group: 'Europe',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'london',
    label: 'London',
    description: 'Europe · UTC+00:00',
    group: 'Europe',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'stockholm',
    label: 'Stockholm',
    description: 'Europe · UTC+01:00',
    group: 'Europe',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'virginia',
    label: 'Northern Virginia',
    description: 'United States · UTC−05:00',
    group: 'Americas',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'oregon',
    label: 'Oregon',
    description: 'United States · UTC−08:00',
    group: 'Americas',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'toronto',
    label: 'Toronto',
    description: 'Canada · UTC−05:00',
    group: 'Americas',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'singapore',
    label: 'Singapore',
    description: 'Asia Pacific · UTC+08:00',
    group: 'Asia Pacific',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'sydney',
    label: 'Sydney',
    description: 'Asia Pacific · UTC+10:00',
    group: 'Asia Pacific',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'tokyo',
    label: 'Tokyo',
    description: 'Asia Pacific · UTC+09:00',
    group: 'Asia Pacific',
    icon: GlobeHemisphereWestIcon,
  },
];
