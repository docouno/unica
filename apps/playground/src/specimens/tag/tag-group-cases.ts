import type { CaseBlock } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { Groups, Locked, OverlayLabels, RemovalFlow } from './tag-groups.examples.js';

export const tagGroupCases = {
  groups: {
    id: 'groups',
    title: 'Wrapping and disclosure',
    kind: 'behavior',
    mode: 'live',
    reset: true,
    caption:
      'Reveal the remaining values and move between actions with the arrow keys. Locked values stay in the group.',
    render: withOverlaySurface(Groups, 'border-box'),
  },
  locked: {
    id: 'locked',
    title: 'Locked values',
    kind: 'behavior',
    mode: 'live',
    reset: true,
    caption:
      'All values are required. Expand or collapse the list to read them while removal is unavailable.',
    render: withOverlaySurface(Locked, 'border-box'),
  },
  removal: {
    id: 'removal',
    title: 'Removal outcomes',
    kind: 'behavior',
    mode: 'live',
    controls: { deferred: { kind: 'boolean', label: 'Wait for confirmation', default: false } },
    actions: [
      { id: 'confirm', label: 'Confirm removal' },
      { id: 'reject', label: 'Reject removal' },
    ],
    reset: true,
    caption:
      'Remove a label immediately or hold its request to compare confirmation and rejection. After the last removal, reapply the labels from the empty list.',
    render: withOverlaySurface(RemovalFlow, 'border-box'),
  },
  overlay: {
    id: 'overlay',
    title: 'Assigned groups on a floating surface',
    surface: 'overlay',
    overlayStage: true,
    kind: 'surface',
    mode: 'live',
    reset: true,
    caption:
      'Remove an optional group and inspect the remaining labels on the panel. Workspace policy stays assigned.',
    render: OverlayLabels,
  },
} as const satisfies Record<string, CaseBlock>;
