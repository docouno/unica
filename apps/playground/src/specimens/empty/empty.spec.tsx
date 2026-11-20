import { FileTextIcon } from '@phosphor-icons/react';
import {
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '../../prototypes/empty/empty.proto.js';
import { Button } from '../../prototypes/button/button.proto.js';
import { previewProps, previewText } from '../preview-code.js';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import type { EmptyExampleSection } from '../../prototypes/empty/empty.examples.js';

const { default: EmptyExamples } = await import('../../prototypes/empty/empty.examples.js');

function example(section: EmptyExampleSection, note?: string): ReactElement {
  return <EmptyExamples section={section} note={note} />;
}

export default defineComponent({
  id: 'empty',
  title: 'Empty',
  category: 'Feedback & Status',
  status: 'Proto',
  summary: 'Explain why a resolved view is empty and offer the next step when there is one.',
  componentName: 'Empty',
  props: {
    size: {
      kind: 'enum',
      group: 'Empty',
      default: 'm',
      description: 'Scale the heading, media, and spacing.',
      choices: [{ value: 's' }, { value: 'm' }, { value: 'l' }],
    },
    align: {
      kind: 'enum',
      group: 'Empty',
      default: 'center',
      description: 'Align the empty state in its container.',
      choices: [{ value: 'start' }, { value: 'center' }],
    },
    heading: {
      kind: 'string',
      group: 'EmptyTitle',
      default: 'No saved pages',
      description: 'Heading that identifies the empty view.',
    },
    media: {
      kind: 'slot',
      group: 'EmptyMedia',
      default: 'icon',
      description: 'Show an icon or omit the media slot.',
      choices: [
        { value: 'none', label: 'Empty' },
        { value: 'icon', label: 'Document icon' },
      ],
    },
    onBrowse: {
      kind: 'action',
      group: 'EmptyActions',
      code: 'handleBrowse',
      description: 'Records activation of the browse action.',
    },
  },
  render: ({ ctx, values: { size, align, heading, media } }) => (
    <Empty {...ctx.subject} size={size} align={align}>
      {media === 'icon' && <EmptyMedia icon={FileTextIcon} />}
      <EmptyTitle>{heading}</EmptyTitle>
      <EmptyDescription>Save a page to keep it close at hand.</EmptyDescription>
      <EmptyActions>
        <Button variant="secondary" onClick={() => ctx.action('onBrowse')('Browse pages')}>
          Browse pages
        </Button>
      </EmptyActions>
    </Empty>
  ),
  code: ({ size, align, heading, media }) =>
    `<Empty${previewProps({ size, align }, { size: 'm', align: 'center' })}>\n${media === 'icon' ? '  <EmptyMedia icon={FileTextIcon} />\n' : ''}  <EmptyTitle>${previewText(heading)}</EmptyTitle>\n  <EmptyDescription>Save a page to keep it close at hand.</EmptyDescription>\n  <EmptyActions><Button variant="secondary" onClick={handleBrowse}>Browse pages</Button></EmptyActions>\n</Empty>`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'media',
      title: 'Sizes',
      reference: () => example('sizes'),
    },
    {
      id: 'placement',
      rows: 'align',
      cols: 'size',
      title: 'Alignment and optional slots',
      reference: () =>
        example('placement', 'Fixed examples of a card and a description-only table row.'),
    },
  ],
  cases: [
    {
      id: 'reasons',
      mode: 'pinned',
      title: 'Empty collections',
      kind: 'behavior',
      render: () => example('reasons', 'Static examples.'),
    },
    {
      id: 'activity',
      mode: 'pinned',
      title: 'Activity states',
      kind: 'behavior',
      render: () => example('activity', 'Static examples.'),
    },
    {
      id: 'unavailable',
      mode: 'pinned',
      title: 'Access and loading failures',
      kind: 'behavior',
      render: () => example('unavailable', 'Fixed examples. Retry shows the live recovery path.'),
    },
    {
      id: 'media',
      title: 'Custom illustrations',
      kind: 'behavior',
      render: () => example('media'),
    },
    {
      id: 'search',
      mode: 'live',
      title: 'Live search results',
      kind: 'behavior',
      render: () =>
        example('search', 'Try typing “incident” or submitting a search with no matches.'),
    },
    {
      id: 'retry',
      mode: 'live',
      title: 'Retry',
      kind: 'behavior',
      render: () => example('retry', 'The first retry fails. The second shows the loaded reports.'),
    },
    {
      id: 'overflow',
      mode: 'pinned',
      title: 'Long copy and action wrapping',
      kind: 'content',
      render: () =>
        example('overflow', 'Fixed example. Use 360px, 120% text, and RTL to inspect wrapping.'),
    },
    {
      id: 'overlay',
      mode: 'pinned',
      title: 'Floating panel preview',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      render: () => example('overlay'),
    },
  ],
  usage: [
    {
      id: 'routes',
      code: `<Empty align="start">
  <EmptyTitle>No extensions installed</EmptyTitle>
  <EmptyActions><Link href="/extensions">Browse extensions</Link></EmptyActions>
</Empty>`,
      title: 'Full-page recovery',
      render: () => example('routes', 'Fixed examples for a missing page and a failed load.'),
    },
  ],
});
