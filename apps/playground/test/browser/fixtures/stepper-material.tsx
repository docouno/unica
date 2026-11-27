import { Stepper, StepperStep } from '@docouno/unica';
import type { JSX } from 'react';
import { UnicaUnderlay } from '../../../src/unica.workbench.shared.js';

export default function StepperMaterialFixture(): JSX.Element {
  return (
    <>
      {(['base', 'overlay'] as const).map((surface) => (
        <div
          key={surface}
          style={{
            position: 'relative',
            maxInlineSize: 420,
            padding: 24,
            background: 'var(--bg-canvas)',
          }}
        >
          {surface === 'overlay' && <UnicaUnderlay />}
          <div
            data-testid={surface}
            data-surface={surface}
            className={surface === 'overlay' ? 'unica-overlay-surface' : undefined}
            style={{ position: 'relative', padding: 24 }}
          >
            <button type="button">Before {surface}</button>
            <Stepper
              aria-label={`Stages on ${surface}`}
              layout="vertical"
              allowReturn
              defaultValue="verify"
            >
              <StepperStep value="source" label="Source" completed />
              <StepperStep
                value="verify"
                label="Verify links"
                description="Check links before publishing."
              />
              <StepperStep
                value="commit"
                label="Commit"
                status="danger"
                message="Choose a destination."
              />
              <StepperStep value="publish" label="Publish" />
            </Stepper>
          </div>
        </div>
      ))}
    </>
  );
}
