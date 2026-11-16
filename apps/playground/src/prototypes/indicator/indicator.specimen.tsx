import { defineSpecimen } from '../../workbench/types.js';
import {
  IndicatorBoundaries,
  IndicatorCorners,
  IndicatorData,
  IndicatorHostStates,
  IndicatorOverlay,
  IndicatorOverview,
  IndicatorScale,
  IndicatorStatuses,
  IndicatorSurfaces,
} from './indicator.examples.js';

export default defineSpecimen({
  id: 'indicator',
  title: 'Indicator',
  group: 'Status',
  summary: 'Quiet corner signals: a known quantity or new activity, attached to its source.',
  sections: [
    {
      id: 'overview',
      title: 'Small signals, clear meaning',
      kind: 'context',
      render: () => <IndicatorOverview />,
    },
    {
      id: 'scale',
      title: 'Dot & count · S / M / L',
      kind: 'matrix',
      caption: '16 / 20 / 24px counters; 6 / 8 / 12px dots. Match the marker to its host.',
      render: () => <IndicatorScale />,
    },
    {
      id: 'status',
      title: 'Semantic signals',
      kind: 'matrix',
      caption:
        'Accent for new activity, neutral for quantity. Reserve warning and danger for their meaning.',
      render: () => <IndicatorStatuses />,
    },
    {
      id: 'corners',
      title: 'Four logical corners',
      kind: 'matrix',
      render: () => <IndicatorCorners />,
    },
    {
      id: 'data',
      title: 'Counts, zero & absence',
      kind: 'states',
      render: () => <IndicatorData />,
    },
    {
      id: 'surfaces',
      title: 'Separation on each surface',
      kind: 'states',
      render: () => <IndicatorSurfaces />,
    },
    {
      id: 'overlay',
      title: 'On a floating surface',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => <IndicatorOverlay />,
    },
    {
      id: 'host-states',
      title: 'The host keeps its interaction',
      kind: 'states',
      render: () => <IndicatorHostStates />,
    },
    {
      id: 'boundaries',
      title: 'Space, wrapping & direction',
      kind: 'states',
      render: () => <IndicatorBoundaries />,
    },
  ],
});
