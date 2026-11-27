import type { ReactElement, Ref } from 'react';
import { nonBlank } from '../../core/passiveRoot.js';
import { FieldDangerGlyph } from '../../internal/glyphs/index.js';
import { VisuallyHidden } from '../Layout/VisuallyHidden.js';
import { StepperPhrase } from './StepperPhrase.js';
import type { StepperMessages, StepperStepProps } from './types.js';

interface SummaryProps {
  readonly steps: readonly StepperStepProps[];
  readonly activeIndex: number;
  readonly completedCount: number;
  readonly messages: StepperMessages;
  readonly expanded: boolean;
  readonly ref: Ref<HTMLDivElement>;
}

export function StepperSummary({
  steps,
  activeIndex,
  completedCount,
  messages,
  expanded,
  ref,
}: SummaryProps): ReactElement {
  const active = steps[activeIndex];
  const title =
    active?.label ??
    (completedCount === steps.length
      ? messages.allComplete
      : messages.completedCount(completedCount, steps.length));
  const correction =
    active?.status === 'danger' && nonBlank(active.message) ? active.message : undefined;

  return (
    <div
      className="unica-stepper-summary-copy"
      aria-hidden={expanded || undefined}
      tabIndex={expanded ? undefined : -1}
      ref={ref}
    >
      {active && (
        <span className="unica-stepper-position">
          <bdi>{messages.position(activeIndex + 1, steps.length)}</bdi>
        </span>
      )}
      <span className="unica-stepper-title" aria-current={active && !expanded ? 'step' : undefined}>
        <bdi lang={active?.lang} dir={active?.dir}>
          {title}
        </bdi>
      </span>
      {!expanded && (
        <>
          {active?.description && (
            <span className="unica-stepper-description">
              <bdi lang={active.lang} dir={active.dir}>
                {active.description}
              </bdi>
            </span>
          )}
          {active?.status === 'danger' && (
            <span className="unica-stepper-issue unica-stepper-summary-issue">
              <FieldDangerGlyph weight="bold" />
              <span>
                {correction ? (
                  <>
                    <VisuallyHidden>
                      <StepperPhrase
                        phrase={messages.needsAttention(correction)}
                        author={correction}
                        lang={active.lang}
                        dir={active.dir}
                      />
                    </VisuallyHidden>
                    <bdi lang={active.lang} dir={active.dir} aria-hidden="true">
                      {correction}
                    </bdi>
                  </>
                ) : (
                  <bdi>{messages.needsAttention()}</bdi>
                )}
              </span>
            </span>
          )}
          {steps.map((step, index) =>
            index !== activeIndex && step.status === 'danger' ? (
              <span
                key={step.value}
                className="unica-stepper-issue unica-stepper-summary-issue"
                data-unica-stepper-other=""
              >
                <FieldDangerGlyph weight="bold" />
                <span>
                  <StepperPhrase
                    phrase={messages.checkStep(step.label)}
                    author={step.label}
                    lang={step.lang}
                    dir={step.dir}
                  />
                </span>
              </span>
            ) : null,
          )}
        </>
      )}
    </div>
  );
}
