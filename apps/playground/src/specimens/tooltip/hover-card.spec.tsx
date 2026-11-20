import { Link } from '../../prototypes/link/link.proto.js';
import { HintPreview } from '../../prototypes/tooltip/tooltip.preview.js';
import { defineComponent } from '../../workbench/types.js';

const {
  HoverContentStates,
  HoverContextExamples,
  HoverEntityExamples,
  HoverIdentityExamples,
  HoverLiveExamples,
  HoverOverflowExamples,
} = await import('../../prototypes/tooltip/hover-card.examples.js');

export default defineComponent({
  id: 'hover-card',
  title: 'HoverCard',
  category: 'Overlays',
  status: 'Proto',
  summary:
    'A read-only glimpse behind a real link. Identity, context and metadata without a detour.',
  defaultSurface: 'overlay',
  props: {
    side: {
      kind: 'enum',
      group: 'Placement',
      default: 'bottom',
      description: 'Preferred placement relative to the link.',
      choices: [{ value: 'top' }, { value: 'bottom' }, { value: 'start' }, { value: 'end' }],
    },
    align: {
      kind: 'enum',
      group: 'Placement',
      default: 'start',
      description: 'Alignment within the chosen side.',
      choices: [{ value: 'start' }, { value: 'center' }, { value: 'end' }],
    },
    summary: {
      kind: 'string',
      group: 'Example',
      default: 'Read the current milestones and review notes.',
      description: 'Copy rendered in the preview panel.',
      demo: true,
    },
    onOpenChange: {
      kind: 'action',
      group: 'Events',
      description: 'Reports panel opening and dismissal.',
      code: 'handleOpenChange',
    },
  },
  code: (
    values,
  ) => `<HintPreview family="hover-card"${values.side === 'bottom' ? '' : ` side="${values.side}"`}${values.align === 'start' ? '' : ` align="${values.align}"`} onOpenChange={handleOpenChange}
  trigger={(bindings) => <Link {...bindings} href="#release-plan">Release plan</Link>}
>
  <strong>Release plan</strong>
  <p>{${JSON.stringify(values.summary)}}</p>
</HintPreview>`,
  render: ({ values, ctx }) => (
    <>
      <HintPreview
        family="hover-card"
        side={values.side}
        align={values.align}
        panelAttributes={ctx.subject}
        onOpenChange={ctx.action('onOpenChange')}
        trigger={(bindings) => (
          <Link {...bindings} {...ctx.subject} href={`#${ctx.id}-release-plan`}>
            Release plan
          </Link>
        )}
      >
        <strong>Release plan</strong>
        <p>{values.summary}</p>
      </HintPreview>
      <span id={`${ctx.id}-release-plan`} />
    </>
  ),
  cases: [
    {
      id: 'interaction',
      title: 'Preview intent & placement',
      caption:
        'Live native top layer. First hover 600ms; focus opens immediately. Move onto the card, select text, press Escape or follow the link.',
      overlayStage: true,
      kind: 'behavior',
      render: () => <HoverLiveExamples />,
    },
    {
      id: 'content',
      title: 'Loading · Missing · Restricted',
      caption:
        'Controlled content previews. The link stays available. No retry button or error-colored surface inside a hover preview.',
      overlayStage: true,
      kind: 'behavior',
      render: () => <HoverContentStates />,
    },
    {
      id: 'overflow',
      title: 'Long content · Limited space',
      caption:
        'Titles and metadata wrap. Normal cards need no scroll; the final example pins a 200px height limit. Full details remain at the link destination.',
      overlayStage: true,
      kind: 'content',
      render: () => <HoverOverflowExamples />,
    },
  ],
  usage: [
    {
      id: 'identity',
      title: 'People & teams',
      caption:
        'Pinned in flow. 22rem ceiling, 16px insets, 12px rhythm. Identity first, one short summary, optional metadata.',
      overlayStage: true,
      mode: 'pinned',
      code: `<>
  <HoverCard><MemberPreview /></HoverCard>
  <HoverCard><TeamPreview /></HoverCard>
</>`,
      render: () => <HoverIdentityExamples />,
    },
    {
      id: 'entities',
      title: 'Documents · Issues · Commits',
      caption:
        'Content owns the anatomy. Classification uses passive badges; removable Tags would introduce actions.',
      overlayStage: true,
      mode: 'pinned',
      code: `<>
  <HoverCard><DocumentPreview /></HoverCard>
  <HoverCard><IssuePreview /></HoverCard>
  <HoverCard><CommitPreview /></HoverCard>
</>`,
      render: () => <HoverEntityExamples />,
    },
    {
      id: 'context',
      title: 'A little context before navigating',
      caption:
        'Pinned relationship to a normal inline link. No focus ring at rest, no nested card or competing elevation.',
      overlayStage: true,
      mode: 'pinned',
      code: `<>
  <p>Maintained by <Link href="#maintainer">Database reliability</Link>.</p>
  <HoverCard><TeamPreview /></HoverCard>
</>`,
      render: () => <HoverContextExamples />,
    },
  ],
});
