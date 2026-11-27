import { useState } from 'react';
import type { ReactElement } from 'react';
import type { PreviewProps } from '../../workbench/types.js';
import { stageMessages, stepperPreview } from './stepper-code.js';
import { StepMap } from './stepper-map.js';
import type { StepperValues } from './stepper.spec.js';
import './stepper-matrix.css';

interface PlaygroundProps extends PreviewProps {
  readonly values: StepperValues;
}

function WorkflowSteps({ ctx, values }: PlaygroundProps): ReactElement {
  const [current, setCurrent] = useState(values.value || null);
  const { name, steps } = stepperPreview(values);
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
      aria-label={scrollable ? `Scrollable steps: ${name}` : undefined}
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
        aria-label={name}
        steps={steps}
        {...(values.mode === 'controlled'
          ? { value: current }
          : { defaultValue: values.defaultValue || null })}
        allowReturn={values.allowReturn}
        messages={values.messages === 'stages' ? stageMessages : undefined}
        size={values.size}
        layout={values.layout}
        {...(values.allowReturn ? { onValueChange: acceptStep } : {})}
      />
    </div>
  );
}

export function StepperPlayground(props: PlaygroundProps): ReactElement {
  const { example, mode, value, defaultValue } = props.values;
  const initial = mode === 'local' ? defaultValue : value;
  return <WorkflowSteps key={JSON.stringify([example, mode, initial])} {...props} />;
}
