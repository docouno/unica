import { defineComponent } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { DocumentViews } from './document-views.js';
import documentViewsSource from './document-views.tsx?raw';
import { tabsCode, tabsProps } from './tabs-code.js';
import { TabsPlayground } from './tabs.playground.js';
import { ManualExample, OverlayExample } from './tabs.settings.js';
import {
  InteractionExamples,
  OverflowExamples,
  SlotExamples,
  VerticalExamples,
} from './tabs.studies.js';
import './tabs.examples.css';

export default defineComponent({
  id: 'tabs',
  title: 'Tabs',
  category: 'Navigation',
  status: 'UI',
  componentName: 'Tabs',
  summary: 'Switch between peer panels within one view.',
  props: tabsProps,
  code: tabsCode,
  render: withOverlaySurface(TabsPlayground, 'border-box'),
  constraints: [
    {
      kind: 'ignored',
      when: { orientation: 'vertical' },
      affects: ['distribution'],
      reason: 'Vertical rows fill their rail. Distribution controls horizontal tab widths.',
    },
  ],
  states: [
    {
      id: 'choices',
      title: 'Horizontal',
      rows: 'size',
      cols: 'distribution',
      fixed: { orientation: 'horizontal' },
      caption:
        'Compare the three tab sizes in a horizontal strip. Content follows the labels, equal fills the strip, and responsive distribution follows the space available to the list.',
    },
    {
      id: 'vertical',
      title: 'Vertical',
      rows: 'size',
      cols: 'activationMode',
      fixed: { orientation: 'vertical' },
      caption:
        'Use the up and down arrows in each column. Automatic activation displays the focused tab’s panel immediately. Manual activation waits for Enter or Space.',
    },
    {
      id: 'slots',
      title: 'Question counts',
      rows: 'count',
      fixed: { value: 'review' },
      caption:
        'Compare the Q&A tab with no count, zero questions, an exact quantity and a capped quantity.',
    },
  ],
  cases: [
    {
      id: 'states',
      title: 'Selection and feedback',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Hover or hold an available tab to compare pointer feedback. Use the arrow keys to see keyboard focus and selection, including how navigation skips Audit.',
      render: withOverlaySurface(InteractionExamples, 'border-box'),
    },
    {
      id: 'rails',
      title: 'Vertical rails and panels',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Each panel has its own rail width. The large rail places History above its panel at 420px and below. Up and down arrows still move through the rail.',
      render: withOverlaySurface(VerticalExamples, 'border-box'),
    },
    {
      id: 'anatomy',
      title: 'Icons and counts',
      kind: 'content',
      mode: 'live',
      controls: {
        layout: {
          kind: 'enum',
          label: 'Tab layout',
          default: 'medium-content',
          choices: [
            { value: 'small-content', label: 'Small · Content' },
            { value: 'medium-content', label: 'Medium · All slots' },
            { value: 'medium-equal', label: 'Medium · Equal' },
            { value: 'large-content', label: 'Large · Content' },
          ],
        },
      },
      reset: true,
      caption:
        'The full set includes a tab with both slots and an icon-only Settings tab with a focus hint. The other layouts compare three workspace sections with a label, a leading icon and a count.',
      render: withOverlaySurface(SlotExamples, 'border-box'),
    },
    {
      id: 'overflow',
      title: 'Overflow and distribution',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Scroll the content row to browse its tabs while the current panel stays open. Compare the selected long label and its exact count with the responsive row, which uses content widths from 768px.',
      render: withOverlaySurface(OverflowExamples, 'border-box'),
    },
    {
      id: 'manual',
      title: 'Manual activation',
      kind: 'behavior',
      mode: 'live',
      controls: {
        mountStrategy: {
          kind: 'enum',
          label: 'Panel mounting',
          default: 'eager',
          choices: [{ value: 'eager' }, { value: 'lazy' }, { value: 'unmount' }],
        },
      },
      reset: true,
      caption:
        'Edit the report name and use the arrow keys to focus Recipients. Enter or Space switches panels. Return to Overview to compare draft retention across mounting strategies.',
      render: (preview) => (
        <div style={{ inlineSize: 'min(100%, 24rem)' }}>
          <ExampleSurface surface={preview.ctx.surface} sizing="border-box">
            <ManualExample {...preview} />
          </ExampleSurface>
        </div>
      ),
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      kind: 'surface',
      mode: 'live',
      surface: 'overlay',
      overlayStage: true,
      reset: true,
      caption:
        'Activity and Details share one compact snapshot panel. Switching tabs keeps its material and the surrounding canvas in view.',
      render: OverlayExample,
    },
  ],
  compositions: [
    {
      id: 'views',
      title: 'Switch between related views',
      mode: 'live',
      reset: true,
      caption: 'Switch between the revision history and access details for the same document.',
      render: ({ ctx }) => (
        <div style={{ inlineSize: 'min(100%, 24rem)' }}>
          <ExampleSurface surface={ctx.surface} sizing="border-box">
            <DocumentViews tabsProps={ctx.subject} />
          </ExampleSurface>
        </div>
      ),
      code: documentViewsSource,
    },
  ],
});
