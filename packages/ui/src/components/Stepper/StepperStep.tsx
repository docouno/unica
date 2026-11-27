import { useId } from 'react';
import type { KeyboardEvent, MouseEventHandler, ReactElement } from 'react';
import { cx } from '../../core/cx.js';
import { warnOnce } from '../../core/devWarning.js';
import { nonBlank, pickConsumerDataAttributes } from '../../core/passiveRoot.js';
import { CheckGlyph, FieldDangerGlyph } from '../../internal/glyphs/index.js';
import { VisuallyHidden } from '../Layout/VisuallyHidden.js';
import { StepperPhrase } from './StepperPhrase.js';
import type { StepperMessages, StepperStepProps } from './types.js';

/** Declares a stage as a direct child of Stepper, including within arrays and fragments. */
export const StepperStep: (props: StepperStepProps) => null = () => {
  warnOnce('stepper-step-parent', 'StepperStep must be declared directly inside a Stepper.');
  return null;
};

export function preventRepeatedActivation(event: KeyboardEvent<HTMLButtonElement>): void {
  if (event.repeat && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
  }
}

interface StepperItemProps {
  readonly step: StepperStepProps;
  readonly index: number;
  readonly current: boolean;
  readonly complete: boolean;
  readonly connector: 'traversed' | 'pending' | undefined;
  readonly messages: StepperMessages;
  readonly onActivate?: MouseEventHandler<HTMLButtonElement> | undefined;
}

export function StepperItem({
  step,
  index,
  current,
  complete,
  connector,
  messages,
  onActivate,
}: StepperItemProps): ReactElement {
  const copyId = useId();
  const descriptionId = `${copyId}-description`;
  const attentionId = `${copyId}-attention`;
  const { id, className, style, lang, dir, ref, label, description, status, message } = step;
  const danger = status === 'danger';
  const correction = danger && nonBlank(message) ? message : undefined;
  const describedBy = [description && descriptionId, danger && attentionId]
    .filter(Boolean)
    .join(' ');
  const content = (
    <>
      <span className="unica-stepper-marker" aria-hidden="true">
        {danger ? (
          <FieldDangerGlyph weight="bold" />
        ) : complete && !current ? (
          <CheckGlyph />
        ) : (
          <bdi>{messages.markerNumber(index)}</bdi>
        )}
      </span>
      <span className="unica-stepper-copy">
        <span className="unica-stepper-title">
          <VisuallyHidden id={copyId}>
            <StepperPhrase
              phrase={messages.stepLabel(index, label, complete)}
              author={label}
              lang={lang}
              dir={dir}
            />
          </VisuallyHidden>
          <bdi className="unica-stepper-title-text" lang={lang} dir={dir} aria-hidden="true">
            {label}
          </bdi>
        </span>
        {description && (
          <bdi id={descriptionId} className="unica-stepper-description" lang={lang} dir={dir}>
            {description}
          </bdi>
        )}
        {danger && (
          <span className="unica-stepper-issue">
            {correction ? (
              <>
                <VisuallyHidden id={attentionId}>
                  <StepperPhrase
                    phrase={messages.needsAttention(correction)}
                    author={correction}
                    lang={lang}
                    dir={dir}
                  />
                </VisuallyHidden>
                <bdi lang={lang} dir={dir} aria-hidden="true">
                  {correction}
                </bdi>
              </>
            ) : (
              <bdi id={attentionId}>{messages.needsAttention()}</bdi>
            )}
          </span>
        )}
      </span>
    </>
  );
  return (
    <li
      {...pickConsumerDataAttributes({ ...step }, 'data-unica-stepper-')}
      id={id}
      className={cx('unica-stepper-step', className)}
      style={style}
      ref={ref}
      tabIndex={-1}
      aria-current={current ? 'step' : undefined}
      data-unica-stepper-current={current ? '' : undefined}
      data-unica-stepper-state={danger ? 'danger' : complete ? 'completed' : undefined}
    >
      {connector && (
        <span
          className="unica-stepper-connector"
          data-unica-stepper-traversed={connector === 'traversed' ? '' : undefined}
          aria-hidden="true"
        />
      )}
      {onActivate ? (
        <button
          type="button"
          className="unica-stepper-entry"
          aria-labelledby={copyId}
          aria-describedby={describedBy || undefined}
          onClick={onActivate}
          onKeyDown={preventRepeatedActivation}
        >
          {content}
        </button>
      ) : (
        <div className="unica-stepper-entry">{content}</div>
      )}
    </li>
  );
}
