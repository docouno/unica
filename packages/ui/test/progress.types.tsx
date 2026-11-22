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
  label: 'Read from source',
  size: 'm' satisfies ProgressSize,
  status: 'warning' satisfies ProgressStatus,
  value: 42,
};
const circle: ProgressCircleProps = {
  'aria-label': 'Read from source',
  value: null,
  size: spinner.size,
  tone: spinner.tone,
};

<Spinner {...spinner} ref={svgRef} dir="rtl" hidden data-audit="" />;
<ProgressCircle {...circle} ref={svgRef} />;
<Progress {...bar} ref={divRef} aria-valuetext="42 of 80 MB" />;
<Progress value={50} label="Visible" aria-label="Fallback" aria-labelledby="ext" />;
<Progress value={50} aria-hidden />;
<Progress value={50} aria-hidden="true" />;
<ProgressCircle value={50} aria-label="Fallback" aria-labelledby="ext" />;
<ProgressCircle value={50} aria-hidden />;
<ProgressCircle value={50} aria-hidden="true" />;

// @ts-expect-error Progress requires an accessible name or aria-hidden
<Progress value={50} />;
// @ts-expect-error ProgressCircle requires an accessible name or aria-hidden
<ProgressCircle value={50} />;
// @ts-expect-error ProgressCircle does not render a visible label slot
<ProgressCircle value={50} label="Unsupported" />;
// @ts-expect-error the component owns the value and role
<Progress label="Task" value={3} aria-valuenow={4} />;
// @ts-expect-error passive indicators cannot opt into a tab stop
<Spinner tabIndex={0} />;
// @ts-expect-error passive indicators cannot be editable
<ProgressCircle aria-label="Task" value={0} contentEditable />;
// @ts-expect-error measurement has no uncontrolled initializer
<Progress label="Task" value={0} defaultValue={1} />;
// @ts-expect-error measurement is required
<Progress label="Task" />;
// @ts-expect-error visual preview options are private to Workbench
<Spinner previewStatic />;
// @ts-expect-error measured circles do not have a reveal delay
<ProgressCircle aria-label="Task" value={null} delay={150} />;
// @ts-expect-error themes supply the material
<Progress label="Task" value={0} appearance="frost" />;
// @ts-expect-error each indicator has closed anatomy
<Spinner>Preparing</Spinner>;
// @ts-expect-error ref is the outer HTML div, not an SVG
<Progress label="Task" value={0} ref={svgRef} />;
