import { useState } from 'react';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { stepperPreview } from './stepper-code.js';
import { StepMap } from './stepper-map.js';
import type { StepperValues } from './stepper.spec.js';
import './stepper-matrix.css';

interface PlaygroundProps extends PreviewProps {
  readonly values: StepperValues;
}

function WorkflowSteps({ ctx, values }: PlaygroundProps): ReactElement {
  const [current, setCurrent] = useState(values.value || null);
  const { label, steps } = stepperPreview(values);
  const [overflowing, setOverflowing] = useState(false);
  const horizontal = values.layout === 'horizontal';
  const scrollable = horizontal && overflowing;
  const disclosure =
    values.allowReturn && (values.layout === 'responsive' || values.layout === 'compact');

  function acceptStep(next: string): void {
    setCurrent(next);
    ctx.action('onValueChange')(next);
  }

  return (
    <div
      className="stepper-preview unica-scrollbar"
      data-stepper-layout={values.layout}
      data-stepper-process={values.example}
      data-example-disclosure={disclosure ? '' : undefined}
      role={scrollable ? 'region' : undefined}
      aria-label={scrollable ? `Scrollable steps: ${label}` : undefined}
      tabIndex={scrollable ? 0 : undefined}
      ref={(viewport) => {
        if (!horizontal || !viewport?.firstElementChild) {
          return;
        }
        const observer = new ResizeObserver(() => {
          setOverflowing(viewport.scrollWidth > viewport.clientWidth);
        });
        observer.observe(viewport);
        observer.observe(viewport.firstElementChild);
        return () => observer.disconnect();
      }}
    >
      <StepMap
        {...ctx.subject}
        label={label}
        steps={steps}
        value={current}
        size={values.size}
        layout={values.layout}
        {...(values.allowReturn ? { onValueChange: acceptStep } : {})}
      />
    </div>
  );
}

export function StepperPlayground(props: PlaygroundProps): ReactElement {
  const { example, allowReturn, value } = props.values;
  return <WorkflowSteps key={`${example}:${allowReturn}:${value}`} {...props} />;
}
