import { defineComponent } from '../../workbench/types.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  AxesExample,
  OverflowExample,
  OverlayExample,
  ReadingComposition,
  ScrollbarPlayground,
  readingCompositionCode,
} from './scrollbar.examples.js';
import { scrollbarPlaygroundCode } from './scrollbar.preview.js';

export default defineComponent({
  id: 'scrollbar',
  title: 'Scrollbar',
  category: 'Layout',
  status: 'UI',
  summary: 'Native scrolling, a transparent track and a quiet thumb in the surface palette.',
  defaultSurface: 'base',
  componentName: 'div',
  props: {
    density: {
      kind: 'enum',
      group: 'Geometry',
      default: 'ordinary',
      demo: true,
      description: 'Add the compact modifier for a smaller native gutter.',
      choices: [{ value: 'ordinary' }, { value: 'compact' }],
    },
    axis: {
      kind: 'enum',
      group: 'Geometry',
      default: 'vertical',
      demo: true,
      description: 'Choose the overflowing axis to inspect.',
      choices: [{ value: 'vertical' }, { value: 'horizontal' }, { value: 'both' }],
    },
    height: {
      kind: 'number',
      group: 'Geometry',
      default: 160,
      demo: true,
      description: 'Block size of the scroll container in CSS pixels.',
      examples: [96, 160, 240],
    },
    longContent: {
      kind: 'boolean',
      group: 'Content',
      default: true,
      description: 'Choose content that can overflow the scrolling region.',
      demo: true,
    },
    onScroll: {
      kind: 'action',
      group: 'Interaction',
      demo: true,
      code: 'handleScroll',
      description: 'Report the scroll owner’s native event in the action log.',
    },
  },
  render: withOverlaySurface(ScrollbarPlayground),
  code: scrollbarPlaygroundCode,
  states: [
    {
      id: 'overflow',
      title: 'Scrolling axes and content',
      rows: 'axis',
      cols: 'longContent',
      caption:
        'Compare a short entry with the complete guide. A scrollbar appears on an axis only when the content extends beyond the viewport.',
    },
    {
      id: 'density',
      title: 'Ordinary and compact gutters',
      rows: 'density',
      cols: 'axis',
      fixed: { longContent: true },
      caption: 'Compare the space reserved for the native scrollbar on each axis.',
    },
  ],
  cases: [
    {
      id: 'overlay',
      mode: 'live',
      title: 'Inside the overlay',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Open the reference to inspect the compact scrollbar. The header and Close stay in place.',
      kind: 'surface',
      render: OverlayExample,
    },
    {
      id: 'states',
      mode: 'live',
      title: 'Fitting and overflowing content',
      surface: 'base',
      caption:
        'Show all topics, focus the reading list, and press Page Down. The heading stays in place while the list scrolls.',
      kind: 'behavior',
      controls: { allTopics: { kind: 'boolean', label: 'Show all topics', default: false } },
      reset: true,
      render: withOverlaySurface(OverflowExample),
    },
    {
      id: 'axes',
      mode: 'live',
      title: 'Horizontal & both axes',
      surface: 'base',
      caption:
        'The query scrolls horizontally. The longer activity log scrolls in both directions. Both preserve left-to-right code in an RTL layout.',
      kind: 'behavior',
      render: AxesExample,
    },
  ],
  compositions: [
    {
      id: 'base',
      title: 'A scrollable reading area',
      mode: 'live',
      surface: 'base',
      caption:
        'The guide title and topic count stay in view while the named content region scrolls by wheel, touch, or keyboard.',
      render: withOverlaySurface(ReadingComposition),
      code: readingCompositionCode,
    },
  ],
});
