import { useId } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Checkbox } from '../binary-controls/binary-controls.proto.js';
import { CheckboxCard, Radio, RadioCard, Switch, SwitchCard } from './selection.proto.js';
import '../input/input.css';

function SizesPreview(): ReactElement {
  const groupName = useId();
  return (
    <div className="control-examples-proto">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="control-stack-proto" key={size}>
          <Checkbox label="Keep this device trusted" size={size} defaultChecked />
          <Radio
            label="Workspace default"
            name={`${groupName}-${size}`}
            size={size}
            defaultChecked
          />
          <Switch label="Publish change notifications" size={size} defaultChecked />
        </div>
      ))}
    </div>
  );
}

function CardsPreview(): ReactElement {
  const groupName = useId();
  return (
    <div className="control-stack-proto">
      <div className="control-examples-proto">
        <RadioCard
          label="Workspace"
          description="Everyone in Platform Eng can discover this page."
          name={groupName}
          defaultChecked
        />
        <RadioCard
          label="Restricted"
          description="Only invited reviewers can open this page."
          name={groupName}
        />
      </div>
      <div className="control-examples-proto">
        <CheckboxCard
          label="Allow comments"
          description="Members can discuss the page and request changes."
          defaultChecked
        />
        <CheckboxCard
          label="Export archive"
          description="Allow downloading a portable Markdown archive."
        />
      </div>
      <SwitchCard
        label="Require quarterly verification"
        description="Notify the primary owner when the review expires."
        defaultChecked
      />
    </div>
  );
}

export default defineSpecimen({
  id: 'selection',
  title: 'Checkbox, Radio & Switch',
  group: 'Forms',
  summary:
    'Native selection, clear shape differences, and contextual choice cards without material switches.',
  sections: [
    {
      id: 'sizes',
      title: 'Three sizes & three meanings',
      kind: 'matrix',
      render: () => <SizesPreview />,
    },
    {
      id: 'states',
      title: 'Availability & long descriptions',
      kind: 'states',
      render: () => (
        <div className="control-examples-proto">
          <Checkbox label="This action is unavailable" disabled />
          <Radio label="Chosen by workspace policy" defaultChecked readOnly />
          <Switch
            label="Notify the primary owner seven days before quarterly verification expires"
            description="Keeps the current reviewer accountable without sending duplicate reminders."
          />
          <Checkbox label="Selected and unavailable" disabled defaultChecked />
        </div>
      ),
    },
    {
      id: 'cards',
      title: 'Folio · Access & visibility',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      render: () => <CardsPreview />,
    },
  ],
});
