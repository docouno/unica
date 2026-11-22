import { HoverCard, HoverCardContent, HoverCardTrigger, Link, Text, Title } from '@docouno/unica';
import { placementAlignments, placementSides } from '../../examples/overlay-placement-options.js';
import { defineComponent } from '../../workbench/types.js';
import {
  HoverContentStates,
  HoverContextExamples,
  HoverEntityExamples,
  HoverIdentityExamples,
  HoverLiveExamples,
  HoverOverflowExamples,
} from './hover-card.examples.js';

export default defineComponent({
  id: 'hover-card',
  title: 'HoverCard',
  category: 'Overlays',
  status: 'UI',
  summary: 'A read-only preview of the person or document behind a link.',
  defaultSurface: 'overlay',
  props: {
    summary: {
      kind: 'string',
      group: 'Content',
      default: 'Read the current milestones and review notes.',
      description: 'Summary rendered inside HoverCardContent.',
      demo: true,
    },
    side: {
      kind: 'enum',
      group: 'Placement',
      default: 'bottom',
      description: 'Preferred logical side of HoverCardContent relative to the link.',
      choices: placementSides.map((value) => ({ value })),
    },
    align: {
      kind: 'enum',
      group: 'Placement',
      default: 'start',
      description: 'Alignment of HoverCardContent within the chosen side.',
      choices: placementAlignments.map((value) => ({ value })),
    },
    defaultOpen: {
      kind: 'boolean',
      group: 'State',
      default: false,
      description: 'Starts the uncontrolled card open.',
    },
    open: {
      kind: 'enum',
      group: 'State',
      default: 'automatic',
      demo: true,
      description:
        'Chooses whether to pass a controlled open value. One preview is visible per document.',
      choices: [
        { value: 'automatic', label: 'Automatic' },
        { value: 'open', label: 'Controlled open' },
        { value: 'closed', label: 'Controlled closed' },
      ],
    },
    onOpenChange: {
      kind: 'action',
      group: 'Events',
      description: 'Reports requested visibility and the reason for the change.',
      code: 'handleOpenChange',
    },
  },
  constraints: [
    {
      kind: 'precedence',
      when: { open: 'open' },
      affects: [{ key: 'defaultOpen', value: true }],
      reason: 'The controlled open value determines visibility.',
    },
    {
      kind: 'precedence',
      when: { open: 'closed' },
      affects: [{ key: 'defaultOpen', value: true }],
      reason: 'The controlled open value determines visibility.',
    },
  ],
  code: (values) => {
    const side = values.side === 'bottom' ? '' : ` side="${values.side}"`;
    const align = values.align === 'start' ? '' : ` align="${values.align}"`;
    const initial = values.defaultOpen ? ' defaultOpen' : '';
    const open = values.open === 'automatic' ? '' : ` open={${values.open === 'open'}}`;
    return `<HoverCard${initial}${open} onOpenChange={handleOpenChange}>
  <HoverCardTrigger asChild>
    <Link href="/plans/release">Release plan</Link>
  </HoverCardTrigger>
  <HoverCardContent${side}${align}>
    <strong>Release plan</strong>
    <p>{${JSON.stringify(values.summary)}}</p>
  </HoverCardContent>
</HoverCard>`;
  },
  render: ({ values, ctx }) => (
    <HoverCard
      key={values.open === 'automatic' ? String(values.defaultOpen) : 'controlled'}
      defaultOpen={values.defaultOpen}
      {...(values.open === 'automatic' ? {} : { open: values.open === 'open' })}
      onOpenChange={(open, details) => ctx.action('onOpenChange')({ open, reason: details.reason })}
    >
      <HoverCardTrigger asChild>
        <Link {...ctx.subject} href="?item=03-document-collection">
          Release plan
        </Link>
      </HoverCardTrigger>
      <HoverCardContent {...ctx.subject} side={values.side} align={values.align}>
        <Title as="h3" size="body-m">
          Release plan
        </Title>
        <Text size="body-s" color="secondary">
          {values.summary}
        </Text>
      </HoverCardContent>
    </HoverCard>
  ),
  matrixViews: [
    {
      id: 'placement',
      title: 'Logical placements',
      rows: 'side',
      cols: 'align',
      surface: 'base',
      caption:
        'Hover a link to inspect its placement. Use the frame to try collisions at the viewport edges.',
      reference: HoverLiveExamples,
    },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Preview intent and placement',
      caption:
        'The first hover waits 600 ms. Tab opens immediately. Move onto the card to select text, press Escape to close it or follow the link.',
      mode: 'live',
      kind: 'behavior',
      render: HoverLiveExamples,
    },
    {
      id: 'content',
      title: 'Content and availability states',
      caption:
        'Choose the state supplied by the app. The destination remains available in every example.',
      mode: 'pinned',
      kind: 'content',
      render: HoverContentStates,
    },
    {
      id: 'overflow',
      title: 'Long content and limited space',
      caption:
        'Scroll the constrained card to read its full content. Select other examples to compare wrapping of long titles and identifiers.',
      mode: 'pinned',
      kind: 'content',
      render: HoverOverflowExamples,
    },
  ],
  usage: [
    {
      id: 'identity',
      title: 'People and teams',
      caption: 'Identity first, followed by a summary and optional metadata.',
      mode: 'pinned',
      code: `<HoverCard>
  <HoverCardTrigger href="/teams/database">Database reliability</HoverCardTrigger>
  <HoverCardContent>
    <strong>Database reliability</strong>
    <p>Maintains production data systems.</p>
  </HoverCardContent>
</HoverCard>`,
      render: HoverIdentityExamples,
    },
    {
      id: 'entities',
      title: 'Documents, issues and commits',
      caption: 'Use passive content such as summaries, metadata and badges.',
      mode: 'pinned',
      code: `<HoverCard>
  <HoverCardTrigger href="/documents/pg-failover">PG Failover</HoverCardTrigger>
  <HoverCardContent>
    <strong>Zero-Downtime PG Failover</strong>
    <p>Promote a healthy replica and verify recovery before restoring writes.</p>
    <Badge status="success" size="s">Verified</Badge>
  </HoverCardContent>
</HoverCard>`,
      render: HoverEntityExamples,
    },
    {
      id: 'context',
      title: 'Inline link',
      caption: 'The link keeps its normal navigation and focus behavior.',
      mode: 'pinned',
      code: `<div>
  Maintained by{' '}
  <HoverCard>
    <HoverCardTrigger asChild><Link href="/teams/database">Database reliability</Link></HoverCardTrigger>
    <HoverCardContent><TeamPreview /></HoverCardContent>
  </HoverCard>.
</div>`,
      render: HoverContextExamples,
    },
  ],
});
