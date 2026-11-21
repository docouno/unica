import { createRef } from 'react';
import { Progress, ProgressCircle, Spinner } from '../src/index.js';
import type {
  ProgressProps,
  ProgressCircleProps,
  ProgressSize,
  ProgressStatus,
  SpinnerProps,
  SpinnerSize,
  SpinnerTone,
} from '../src/index.js';

const svgRef = createRef<SVGSVGElement>();
const divRef = createRef<HTMLDivElement>();

const spinner: SpinnerProps = {
  size: 'm' satisfies SpinnerSize,
  tone: 'accent' satisfies SpinnerTone,
};
const bar: ProgressProps = {
  size: 'm' satisfies ProgressSize,
  status: 'warning' satisfies ProgressStatus,
  value: 42,
};
const circle: ProgressCircleProps = { value: null, size: spinner.size, tone: spinner.tone };

<Spinner {...spinner} ref={svgRef} dir="rtl" hidden data-audit="" />;
<ProgressCircle {...circle} ref={svgRef} aria-label="Read from source" />;
<Progress {...bar} ref={divRef} label="Read from source" aria-valuetext="42 of 80 MB" />;

// @ts-expect-error the component owns the value and role
<Progress value={3} aria-valuenow={4} />;
// @ts-expect-error passive indicators cannot opt into a tab stop
<Spinner tabIndex={0} />;
// @ts-expect-error passive indicators cannot be editable
<ProgressCircle value={0} contentEditable />;
// @ts-expect-error measurement has no uncontrolled initializer
<Progress value={0} defaultValue={1} />;
// @ts-expect-error measurement is required
<Progress />;
// @ts-expect-error visual preview options are private to Workbench
<Spinner previewStatic />;
// @ts-expect-error measured circles do not have a reveal delay
<ProgressCircle value={null} delay={150} />;
// @ts-expect-error themes supply the material
<Progress value={0} appearance="frost" />;
// @ts-expect-error each indicator has closed anatomy
<Spinner>Preparing</Spinner>;
// @ts-expect-error ref is the outer HTML div, not an SVG
<Progress value={0} ref={svgRef} />;
