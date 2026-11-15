import { useId } from 'react';
import type { ReactElement } from 'react';
import { defineSpecimen } from '../../workbench/types.js';
import { Checkbox, Radio, RadioGroup, Switch } from '../binary-controls/binary-controls.proto.js';
import { PopoverContent } from '../popover/popover.proto.js';
import { CheckboxCard, RadioCard, SwitchCard } from './selection.proto.js';
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
  title: 'Choice cards',
  group: 'Forms',
  summary:
    'Early choice-card compositions consuming shared binary indicators. Dedicated binary control references live in Checkbox, Radio, and Switch.',
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
          <RadioGroup aria-label="Workspace policy" readOnly defaultValue="policy">
            <Radio label="Chosen by workspace policy" value="policy" />
          </RadioGroup>
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
      title: 'Choice indicators in a floating surface',
      kind: 'context',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Static overlay plate with live choices. Full choice-card design is a separate study.',
      render: () => (
        <PopoverContent size="l" role="group" aria-label="Choice cards in a floating surface">
          <CardsPreview />
        </PopoverContent>
      ),
    },
  ],
});
