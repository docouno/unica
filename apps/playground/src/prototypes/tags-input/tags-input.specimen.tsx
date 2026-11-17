import { defineSpecimen } from '../../workbench/types.js';
const {
  TagsAnatomy,
  TagsAvailability,
  TagsBatches,
  TagsDrafts,
  TagsFeedback,
  TagsInteraction,
  TagsOverflow,
  TagsRoles,
  TagsShape,
  TagsSubmission,
  TagsSurfaces,
} = await import('./tags-input.examples.js');

export default defineSpecimen({
  id: 'tags-input',
  title: 'TagsInput',
  group: 'Forms',
  summary:
    'Free-form values, a persistent draft, and an explicit Add action. Keep every word, including when a batch needs correction.',
  sections: [
    {
      id: 'roles',
      title: 'Roles & sizes',
      kind: 'matrix',
      caption:
        'S / M / L share Input’s 30 / 40 / 48px minimum rhythm. Default frames the set; Ghost retains a quiet baseline.',
      render: () => <TagsRoles />,
    },
    {
      id: 'shape',
      title: 'Standalone & field geometry',
      kind: 'context',
      caption:
        'Standalone Tag keeps its capsule. Field tokens and their removal plates follow the inset-radius rule: 4px in Soft/Frost, 0px in Pixel. Values stay synchronized.',
      render: () => <TagsShape />,
    },
    {
      id: 'anatomy',
      title: 'Anatomy, wrapping & shared rhythm',
      kind: 'matrix',
      caption:
        'Tag tokens and an editor–Add tail share one field. A multiline draft opens across the field with reserved space beside its text for Add.',
      render: () => <TagsAnatomy />,
    },
    {
      id: 'interaction',
      title: 'Hover, press & focus',
      kind: 'states',
      caption:
        'Pinned visual comparisons, followed by a live field. The editor owns the outer keyboard contour; × and Add own local contours. No physical press travel.',
      render: () => <TagsInteraction />,
    },
    {
      id: 'feedback',
      title: 'Status & clear correction',
      kind: 'states',
      caption:
        'A status edge and one shaped message glyph. Accepted tags stay neutral when a draft needs correction.',
      render: () => <TagsFeedback />,
    },
    {
      id: 'batches',
      title: 'Batch acceptance & repair',
      kind: 'states',
      caption:
        'Newlines split batches; spaces and commas remain text. Rejection is atomic. Sample controls load a draft; the editor and validation are live.',
      render: () => <TagsBatches />,
    },
    {
      id: 'availability',
      title: 'Capacity, reading & availability',
      kind: 'states',
      caption:
        'A reached limit is a capacity state. Read-only projects complete, selectable values and keeps an unadded draft separate. Disabled removes mutation actions.',
      render: () => <TagsAvailability />,
    },
    {
      id: 'overflow',
      title: 'Long values, drafts & direction',
      kind: 'states',
      caption:
        'Complete values wrap in place at narrow widths and 120% text. Hover and focus never insert extra content.',
      render: () => <TagsOverflow />,
    },
    {
      id: 'drafts',
      title: 'Bounded drafts & native scroll',
      kind: 'states',
      caption:
        'Short and multiline drafts without a scrollbar, then bounded S / M / L in Default / Ghost. Add shares the editor rhythm; only a real native scrollbar moves it inward.',
      render: () => <TagsDrafts />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay materials',
      kind: 'context',
      caption:
        'Actual material plates, not simulated overlay mechanics. The existing Invite & Access scene consumes this same TagsInput.',
      render: () => <TagsSurfaces />,
    },
    {
      id: 'submission',
      title: 'Explicit acceptance & draft protection',
      kind: 'context',
      caption:
        'A local native form demonstrates the intended result. Complete library serialization, reset, and accessibility mechanisms belong to implementation.',
      render: () => <TagsSubmission />,
    },
  ],
});
