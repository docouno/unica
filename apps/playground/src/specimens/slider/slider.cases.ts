import type { CaseBlock, MatrixView, UsageBlock } from '../../workbench/types.js';
import {
  ExactValue,
  SizesExample,
  RangeExample,
  InteractionExample,
  AvailabilityExample,
  BoundsExample,
  CloseBoundsExample,
  VerticalExample,
  ContentExample,
  OverlayExample,
} from './slider.examples.js';

export const sliderMatrix = [
  {
    id: 'sizes',
    rows: 'size',
    cols: 'orientation',
    title: 'Slider · three sizes',
    caption:
      'Compact settings, standard forms, and spacious controls. Size changes the rail and cap; the full row remains interactive.',
    reference: SizesExample,
  },
] satisfies readonly MatrixView[];
export const sliderCases = [
  {
    id: 'range',
    title: 'RangeSlider · one shared scale',
    caption:
      'The selected interval sits between two stable bounds. A thumb stops at its neighbour without swapping or pushing it.',
    kind: 'behavior',
    render: RangeExample,
  },
  {
    id: 'interaction',
    title: 'Interaction · quiet, local feedback',
    caption:
      'Hover the cap, drag it, or press Tab to see the focus ring. The interval gives each bound its own tab stop.',
    kind: 'behavior',
    render: InteractionExample,
  },
  {
    id: 'availability',
    title: 'Availability & validation',
    caption:
      'Read-only values keep their contrast and keyboard focus. Disabled controls are neutral. Validation updates as you adjust the values.',
    kind: 'behavior',
    render: AvailabilityExample,
  },
  {
    id: 'bounds',
    title: 'Bounds, precision & reference marks',
    caption:
      'Caps sit flush with the ends. Reference marks explain a linear scale; they do not change its step or create extra snap points.',
    kind: 'behavior',
    render: BoundsExample,
  },
  {
    id: 'close-bounds',
    title: 'Close & coincident bounds',
    caption:
      'Crowded caps separate across the rail while keeping their exact numeric positions. Grab either cap, or drag from the shared point toward the bound you want to open.',
    kind: 'behavior',
    render: CloseBoundsExample,
  },
  {
    id: 'vertical',
    title: 'Vertical · minimum at the bottom',
    caption:
      'Labels and values remain horizontal. The cap turns across the scale; direction never changes the bottom-to-top numeric order.',
    kind: 'behavior',
    render: VerticalExample,
  },
  {
    id: 'content',
    title: 'Long labels & formatted values',
    caption:
      'The header wraps naturally. Numeric endpoints remain readable at narrow widths and 120% text; values are never truncated.',
    kind: 'behavior',
    render: ContentExample,
  },
  {
    id: 'overlay',
    title: 'Inside a floating surface',
    surface: 'overlay',
    overlayStage: true,
    caption:
      'The same controls inherit the surface recipe. Glass belongs to the floating panel and recessed track; caps remain solid and legible.',
    kind: 'surface',
    render: OverlayExample,
  },
] satisfies readonly CaseBlock[];
export const sliderUsage = [
  {
    id: 'exact',
    title: 'Approximate adjustment & exact entry',
    caption:
      'A separate numeric input is useful when precision matters. It shares the value, without becoming part of the slider anatomy.',
    code: `const [quality, setQuality] = useState(60);
const [entry, setEntry] = useState<number | ''>(quality);

<>
  <Slider
    aria-label="Image quality"
    formatValue={(value) => String(value) + '%'}
    value={quality}
    onValueChange={(next) => { setQuality(next); setEntry(next); }}
  />
  <NumberInput
    aria-label="Exact image quality percentage"
    value={entry}
    onValueChange={(next) => {
      setEntry(next);
      if (next !== '' && next >= 0 && next <= 100) setQuality(Math.round(next));
    }}
    onBlur={() => setEntry(quality)}
    min={0}
    max={100}
    suffix="%"
  />
</>`,
    render: ExactValue,
  },
] satisfies readonly UsageBlock[];
