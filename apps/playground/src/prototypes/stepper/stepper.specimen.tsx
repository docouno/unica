import { useState } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Stepper } from './stepper.proto.js';
import { Card } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import { Progress } from '../feedback/feedback.proto.js';
import '../card/display.examples.css';

const steps = [
  { label: 'Select archive', description: 'Files and import schema' },
  { label: 'Validate', description: 'Resolve policies and relations' },
  { label: 'Review & import', description: 'Confirm the migration' },
];

function ImportExample(): ReactElement {
  const [current, setCurrent] = useState(1);
  return (
    <div className="display-example-stack">
      <Stepper steps={steps} current={current} onStepChange={setCurrent} />
      <Card>
        <Text size="body-s" weight="semibold">
          {steps[current]?.label}
        </Text>
        <Progress
          value={current === 0 ? 0 : current === 1 ? 65 : 100}
          label="Archive preparation"
        />
        <Text size="caption-l" color="muted">
          Choose a step marker to inspect its visual state.
        </Text>
      </Card>
    </div>
  );
}

export default defineSpecimen({
  id: 'stepper',
  title: 'Stepper',
  group: 'Navigation',
  summary: 'Factual progress through a short, ordered workspace flow.',
  sections: [
    {
      id: 'progress',
      title: 'Future, current & completed steps',
      kind: 'matrix',
      render: () => <Stepper steps={steps} current={1} />,
    },
    {
      id: 'error',
      title: 'Validation failure & wrapping',
      kind: 'states',
      render: () => (
        <Stepper
          steps={[
            { label: 'Archive uploaded', status: 'completed' },
            {
              label: 'Resolve invalid document parent references',
              description: 'Two references require attention',
              status: 'invalid',
            },
            { label: 'Import documents', status: 'future' },
          ]}
          current={1}
        />
      ),
    },
    {
      id: 'context',
      title: 'Folio · Batch import',
      kind: 'context',
      render: () => <ImportExample />,
    },
  ],
});
