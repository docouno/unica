import { HoverCard, HoverCardContent, HoverCardTrigger, Link, Text, Title } from '@docouno/unica';
import { placementAlignments, placementSides } from '../../examples/overlay-placement-options.js';
import { defineComponent } from '../../workbench/types.js';
import { choice, eventProp, toggle } from '../control-props.js';
import {
  HoverContentStates,
  HoverContextExamples,
  HoverEntityExamples,
  HoverIdentityExamples,
  HoverLiveExamples,
  HoverOverflowExamples,
} from './hover-card.examples.js';
import entitySource from './entity-card.tsx?raw';
import identitySource from './identity-card.tsx?raw';

const identityProgram = identitySource.replaceAll('../../prototypes/', './prototypes/');
const roadmap = 'https://www.postgresql.org/developer/roadmap/';

function select(label: string, choices: readonly string[], initial: string) {
  return {
    kind: 'enum' as const,
    label,
    default: initial,
    choices: choices.map((value) => ({ value })),
  };
}

export default defineComponent({
  id: 'hover-card',
  title: 'HoverCard',
  category: 'Overlays',
  status: 'UI',
  summary: 'A read-only preview of a link destination. The link remains the only interactive part.',
  defaultSurface: 'overlay',
  props: {
    summary: {
      kind: 'string',
      group: 'Content',
      default: 'Read the release schedule and find proposals for upcoming PostgreSQL features.',
      description: 'Sample text inside HoverCardContent.',
      demo: true,
    },
    side: choice(
      'Geometry',
      'Preferred logical side of HoverCardContent relative to the link.',
      placementSides,
      'bottom',
    ),
    align: choice(
      'Geometry',
      'Preferred alignment of HoverCardContent along its chosen side.',
      placementAlignments,
      'start',
    ),
    defaultOpen: toggle('Interaction', 'Initial visibility of an uncontrolled HoverCard.'),
    open: {
      ...choice(
        'Interaction',
        'Automatic omits open. Controlled open and closed pass true or false. One preview can be visible per document.',
        ['automatic', 'open', 'closed'],
        'automatic',
      ),
      choices: [
        { value: 'automatic', label: 'Automatic' },
        { value: 'open', label: 'Controlled open' },
        { value: 'closed', label: 'Controlled closed' },
      ],
      demo: true,
    },
    onOpenChange: eventProp(
      'Receives requested visibility and its cause. The event log shows open and reason.',
      '(open, details) => console.log(open, details)',
      '(open: boolean, details: HoverPreviewChangeDetails) => void',
    ),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { open: 'open' },
      affects: [{ key: 'defaultOpen', value: true }],
      reason: 'A controlled HoverCard takes its visibility from open.',
    },
    {
      kind: 'ignored',
      when: { open: 'closed' },
      affects: [{ key: 'defaultOpen', value: true }],
      reason: 'A controlled HoverCard takes its visibility from open.',
    },
  ],
  code: (values) => {
    const visibility =
      values.open === 'automatic'
        ? values.defaultOpen
          ? ' defaultOpen'
          : ''
        : ` open={${values.open === 'open'}}`;
    return `import { HoverCard, HoverCardContent, HoverCardTrigger, Link, Text, Title } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function RoadmapLink() {
  return (
    <HoverCard${visibility} onOpenChange={(open, details) => console.log(open, details)}>
      <HoverCardTrigger asChild>
        <Link href="${roadmap}">PostgreSQL roadmap</Link>
      </HoverCardTrigger>
      <HoverCardContent side="${values.side}" align="${values.align}">
        <Title as="h3" size="body-m" dir="auto">PostgreSQL roadmap</Title>
        <Text size="body-s" color="secondary" dir="auto">{${JSON.stringify(values.summary)}}</Text>
      </HoverCardContent>
    </HoverCard>
  );
}`;
  },
  render: ({ values, ctx }) => (
    <HoverCard
      key={values.open === 'automatic' ? String(values.defaultOpen) : 'controlled'}
      {...(values.open === 'automatic'
        ? { defaultOpen: values.defaultOpen }
        : { open: values.open === 'open' })}
      onOpenChange={(open, details) => ctx.action('onOpenChange')({ open, reason: details.reason })}
    >
      <HoverCardTrigger asChild>
        <Link {...ctx.subject} href={roadmap}>
          PostgreSQL roadmap
        </Link>
      </HoverCardTrigger>
      <HoverCardContent {...ctx.subject} side={values.side} align={values.align}>
        <Title as="h3" size="body-m" dir="auto">
          PostgreSQL roadmap
        </Title>
        <Text size="body-s" color="secondary" dir="auto">
          {values.summary}
        </Text>
      </HoverCardContent>
    </HoverCard>
  ),
  states: [
    {
      id: 'placement',
      title: 'Logical placements',
      rows: 'side',
      cols: 'align',
      surface: 'base',
      caption:
        'Hover or focus a link to inspect the requested side and alignment. Preview intent and placement also moves the source to either edge.',
    },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Preview intent and placement',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: {
        side: select('Side', placementSides, 'bottom'),
        align: select('Align', placementAlignments, 'start'),
        position: select('Source position', ['center', 'top-start', 'bottom-end'], 'center'),
      },
      caption:
        'A cold hover waits 600 ms. Keyboard focus opens immediately. Move onto the preview to select its text, press Escape to dismiss it, or follow the link to the team guide.',
      render: HoverLiveExamples,
    },
    {
      id: 'content',
      title: 'Content and availability states',
      kind: 'content',
      mode: 'live',
      reset: true,
      controls: {
        content: select(
          'Preview content',
          ['ready', 'loading', 'refreshing', 'empty', 'restricted', 'missing', 'error'],
          'loading',
        ),
      },
      caption:
        'Compare seven simulated preview responses for the same working documentation link. The card starts open. Refreshing keeps the last summary while loading shows placeholders.',
      render: HoverContentStates,
    },
    {
      id: 'overflow',
      title: 'Long content and limited space',
      kind: 'content',
      mode: 'live',
      reset: true,
      controls: {
        reading: {
          kind: 'enum',
          label: 'Reading space',
          default: 'limited',
          choices: [
            { value: 'limited', label: 'Limited height (200 px)' },
            { value: 'long', label: 'Long title and summary' },
            { value: 'identifier', label: 'Unbroken identifier' },
          ],
        },
      },
      caption:
        'Scroll the card with a 200px height limit. Compare the full chapter title and summary, then inspect how a complete commit hash wraps.',
      render: HoverOverflowExamples,
    },
  ],
  compositions: [
    {
      id: 'identity',
      title: 'People and teams',
      mode: 'live',
      reset: true,
      controls: {
        identity: {
          kind: 'enum',
          label: 'Identity',
          default: 'member',
          choices: [
            { value: 'member', label: 'Member' },
            { value: 'team', label: 'Team' },
          ],
        },
      },
      caption:
        'Compare the elected Debian project leader and the Python triage team. Both initially open previews keep the link to their own profile or guide. The copy accepts identity="member" or "team".',
      code: identityProgram,
      render: HoverIdentityExamples,
    },
    {
      id: 'entities',
      title: 'Documents, issues and commits',
      mode: 'live',
      reset: true,
      controls: {
        entity: {
          kind: 'enum',
          label: 'Entity',
          default: 'document',
          choices: [
            { value: 'document', label: 'Document' },
            { value: 'issue', label: 'Issue' },
            { value: 'commit', label: 'Commit' },
          ],
        },
      },
      caption:
        'Open PostgreSQL documentation, a CPython issue or its implementing commit from the corresponding link. The copy accepts entity="document", "issue" or "commit".',
      code: entitySource,
      render: HoverEntityExamples,
    },
    {
      id: 'context',
      title: 'Inline link',
      mode: 'live',
      reset: true,
      caption:
        'Read the team preview in a sentence. The card starts open and the link opens the Python triage team guide.',
      code:
        identityProgram.replace('export function IdentityCard', 'function IdentityCard') +
        `
export function TeamInContext() {
  return <IdentityCard inline />;
}
`,
      render: HoverContextExamples,
    },
  ],
});
