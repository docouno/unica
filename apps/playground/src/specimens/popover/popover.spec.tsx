import { FormField } from '../../prototypes/form-field/form-field.proto.js';
import { Input } from '@docouno/unica';
import {
  PopoverBody,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '../../prototypes/popover/popover.proto.js';
import { defineComponent } from '../../workbench/types.js';
import {
  ContentExamples,
  FormExamples,
  OverflowExamples,
  SizeExamples,
  StateExamples,
} from '../../prototypes/popover/popover.examples.js';
import { PlacementExamples } from '../../prototypes/popover/popover.preview.js';

export default defineComponent({
  id: 'popover',
  title: 'Popover',
  category: 'Overlays',
  status: 'Proto',
  summary: 'Short context, immediate settings and compact forms. One quiet surface, six materials.',
  defaultSurface: 'overlay',
  props: {
    size: {
      kind: 'enum',
      group: 'PopoverContent',
      default: 'm',
      description: 'Width ceiling of the popover surface.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    presentation: {
      kind: 'enum',
      group: 'Example',
      default: 'live',
      description: 'Open the native surface or compare the pinned panel.',
      demo: true,
      choices: [{ value: 'live' }, { value: 'pinned' }],
    },
    onOpenChange: {
      kind: 'action',
      group: 'Events',
      description: 'Reports the native popover toggle.',
      code: 'handleToggle',
    },
  },
  code: (values) => {
    const size = values.size === 'm' ? '' : ` size="${values.size}"`;
    const header = `<PopoverHeader>
    <PopoverTitle id={titleId}>Page settings</PopoverTitle>
    <PopoverDescription>Changes apply as you type.</PopoverDescription>
  </PopoverHeader>`;
    return values.presentation === 'pinned'
      ? `<PopoverContent${size} aria-labelledby={titleId}>
  ${header}
  <PopoverBody><label htmlFor={nameId}>Display name</label><Input id={nameId} defaultValue="Release notes" /></PopoverBody>
</PopoverContent>`
      : `<>
  <Button popoverTarget={panelId}>Settings</Button>
  <PopoverContent id={panelId} popover="auto"${size} onToggle={handleToggle} aria-labelledby={titleId}>
    ${header}
    <PopoverBody><label htmlFor={nameId}>Display name</label><Input id={nameId} defaultValue="Release notes" /></PopoverBody>
  </PopoverContent>
</>`;
  },
  render: ({ values, ctx }) =>
    values.presentation === 'pinned' ? (
      <PopoverContent {...ctx.subject} size={values.size} aria-labelledby={`${ctx.id}-title`} inert>
        <PopoverHeader>
          <PopoverTitle id={`${ctx.id}-title`}>Page settings</PopoverTitle>
          <PopoverDescription>Changes apply as you type.</PopoverDescription>
        </PopoverHeader>
        <PopoverBody>
          <FormField label="Display name" htmlFor={`${ctx.id}-name`}>
            <Input id={`${ctx.id}-name`} defaultValue="Release notes" />
          </FormField>
        </PopoverBody>
      </PopoverContent>
    ) : (
      <PlacementExamples
        preview={{
          size: values.size,
          subject: ctx.subject,
          onOpenChange: ctx.action('onOpenChange'),
        }}
      />
    ),
  matrixViews: [
    {
      id: 'sizes',
      title: 'One surface · Three uses',
      rows: 'size',
      fixed: { presentation: 'pinned' },
      caption:
        '18 / 22 / 28rem width ceilings. Shared 10px radius, square in Pixel. Native checkboxes are visual stand-ins.',
      overlayStage: true,
      reference: () => <SizeExamples />,
    },
  ],
  cases: [
    {
      id: 'placements',
      title: 'Anchoring & focus',
      caption:
        'Live native popover. Twelve logical placements with a bounded positioning preview; touch avoids an automatic keyboard. No entrance or exit motion.',
      overlayStage: true,
      kind: 'behavior',
      render: () => <PlacementExamples />,
    },
    {
      id: 'states',
      title: 'Interaction & availability',
      caption:
        'Quiet close, clear keyboard focus. Read-only content stays selectable; unavailable controls explain why.',
      overlayStage: true,
      kind: 'behavior',
      render: () => <StateExamples />,
    },
    {
      id: 'content',
      title: 'Content arrives in the same surface',
      caption:
        'Ready, loading, empty and load failure. Controlled previews keep the title and exit available.',
      overlayStage: true,
      kind: 'behavior',
      render: () => <ContentExamples />,
    },
    {
      id: 'overflow',
      title: 'Long text · Limited space',
      caption:
        'Wrapping, a scrollable body and an anchored footer. Inspect at 360px, 120% text and RTL.',
      overlayStage: true,
      kind: 'content',
      render: () => <OverflowExamples />,
    },
  ],
  usage: [
    {
      id: 'form',
      title: 'Edit · Save · Recover',
      caption:
        'A local transaction with validation, pending feedback, retry and a saved result. Pinned in flow for comparison.',
      overlayStage: true,
      code: `<PopoverContent aria-labelledby={titleId}>
  <PopoverHeader><PopoverTitle id={titleId}>Edit link</PopoverTitle></PopoverHeader>
  <form onSubmit={saveDraft}>
    <PopoverBody>
      <label htmlFor={textId}>Text</label>
      <Input id={textId} value={draft.text} onChange={updateText} />
      <label htmlFor={urlId}>URL</label>
      <Input id={urlId} type="url" value={draft.url} onChange={updateUrl} />
    </PopoverBody>
    <PopoverFooter><Button type="submit" loading={saving}>Save changes</Button></PopoverFooter>
  </form>
</PopoverContent>`,
      render: () => <FormExamples />,
    },
  ],
});
