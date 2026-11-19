import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  BuildingOfficeIcon,
  CloudIcon,
  DatabaseIcon,
  GlobeHemisphereWestIcon,
  ShieldCheckIcon,
} from '@phosphor-icons/react';
import { Button } from '../button/button.proto.js';
import { Text } from '../text/text.proto.js';
import { defineSpecimen } from '../../workbench/types.js';
import { Combobox } from './combobox.proto.js';
import type { Suggestion } from './combobox.proto.js';
import { Study } from './combobox.study.js';

const teams = [
  {
    value: 'data',
    label: 'Data Platform',
    description: 'Storage, backups and replication',
    group: 'Engineering',
    icon: DatabaseIcon,
  },
  {
    value: 'network',
    label: 'Edge Networking',
    description: 'Traffic, DNS and routing',
    group: 'Engineering',
    icon: GlobeHemisphereWestIcon,
  },
  {
    value: 'cloud',
    label: 'Cloud Foundations',
    description: 'Compute and deployment infrastructure',
    group: 'Engineering',
    icon: CloudIcon,
  },
  {
    value: 'security',
    label: 'Security Operations',
    description: 'Access and incident response',
    group: 'Operations',
    icon: ShieldCheckIcon,
  },
  {
    value: 'office',
    label: 'Workplace Systems',
    description: 'Provisioned by your administrator',
    group: 'Operations',
    icon: BuildingOfficeIcon,
    disabled: true,
  },
] as const satisfies readonly Suggestion[];

const longTeam: Suggestion = {
  value: 'continuity',
  label: 'International Infrastructure Continuity and Recovery',
  description: 'Cross-region escalation for critical outages',
  group: 'Operations',
  icon: CloudIcon,
};

function Roles(): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <div className="suggestion-study-proto" key={variant}>
          <Text size="caption-l" color="secondary">
            {variant === 'default' ? 'Form field' : 'Inline field'}
          </Text>
          {(['s', 'm', 'l'] as const).map((size) => (
            <Combobox
              key={size}
              variant={variant}
              size={size}
              width={size === 'l' ? 'auto' : 'full'}
              label={`Owning team · ${size.toUpperCase()}`}
              options={teams}
              defaultSelection={variant === 'ghost' ? teams[0] : undefined}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Choices(): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Catalog reopened · keyboard focus">
        <Combobox
          label="Owning team"
          options={[teams[0], teams[1], teams[4]]}
          defaultSelection={teams[0]}
          previewOpen
          previewActive="network"
          previewState="keyboard-focus"
        />
      </Study>
      <Study title="Replacement in progress · pointer focus">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="cloud"
          previewOpen
          previewActive="cloud"
          previewState="pointer-focus"
        />
      </Study>
      <Study title="Replacement after dismissal">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="cloud"
        />
      </Study>
      <Study title="Replacement after validation">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="cloud"
          status="danger"
          message="Choose a team from the list before saving."
          required
        />
      </Study>
    </div>
  );
}

function Availability(): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Read-only">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          readOnly
          description="Managed by the workspace policy."
        />
      </Study>
      <Study title="Disabled">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          disabled
          description="Select a workspace first."
        />
      </Study>
      <Study title="Information">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          status="info"
          message="Inherited from the workspace."
        />
      </Study>
      <Study title="Confirmed">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          status="success"
          message="This team can receive escalations."
        />
      </Study>
      <Study title="Warning">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[1]}
          variant="ghost"
          status="warning"
          message="This team has limited weekend coverage."
        />
      </Study>
      <Study title="Required">
        <Combobox
          label="Owning team"
          options={teams}
          required
          status="danger"
          message="Choose an owning team."
        />
      </Study>
    </div>
  );
}

function Responses(): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Waiting for a query">
        <Combobox label="Owning team" options={teams} minimumQueryLength={2} previewOpen />
      </Study>
      <Study title="Searching during replacement">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="edge"
          searchState="loading"
          previewOpen
        />
      </Study>
      <Study title="No matches">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="mobile"
          previewOpen
        />
      </Study>
      <Study title="Results unavailable">
        <Combobox
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="edge"
          searchState="error"
          previewOpen
        />
      </Study>
      <Study title="Empty catalog">
        <Combobox
          label="Owning team"
          options={[]}
          previewOpen
          listMessage="Add teams in workspace settings."
        />
      </Study>
      <Study title="Current result unavailable">
        <Combobox
          label="Owning team"
          options={[teams[4]]}
          defaultSelection={teams[4]}
          previewOpen
        />
      </Study>
    </div>
  );
}

function Overflow(): ReactElement {
  const options = [
    longTeam,
    ...teams,
    ...['Central Europe', 'North America', 'Asia Pacific', 'South America'].map((region) => ({
      value: region,
      label: `${region} Incident Response`,
      group: 'Regional teams',
    })),
  ];
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Wrapping rows and scroll">
        <Combobox
          label="Escalation team"
          size="s"
          options={options}
          defaultSelection={longTeam}
          previewOpen
          previewActive={longTeam.value}
        />
      </Study>
      <Study title="Large field and wrapped details">
        <Combobox
          label="Escalation team"
          size="l"
          variant="ghost"
          options={[longTeam]}
          defaultSelection={longTeam}
          previewOpen
        />
      </Study>
    </div>
  );
}

function Assignment(): ReactElement {
  const [committed, setCommitted] = useState<Suggestion | null>(teams[0]);
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState(false);
  const invalid = attempted && committed === null;
  return (
    <form
      className="suggestion-usage-proto suggestion-save-pair-proto"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setAttempted(true);
        setSaved(committed !== null);
        if (!committed) {
          event.currentTarget.querySelector('input')?.focus();
        }
      }}
    >
      <Combobox
        label="Escalation team"
        iconLeft={null}
        options={[
          ...teams,
          longTeam,
          ...['North America', 'Central Europe', 'Asia Pacific', 'South America'].map((region) => ({
            value: region,
            label: `${region} Incident Response`,
            group: 'Regional teams',
          })),
        ]}
        defaultSelection={teams[0]}
        required
        status={invalid ? 'danger' : 'neutral'}
        description="This team receives incident notifications."
        message={invalid ? 'Choose a team from the list before saving.' : undefined}
        onSelectionChange={setCommitted}
        onQueryChange={() => {
          setAttempted(false);
          setSaved(false);
        }}
      />
      <Button type="submit" aria-label="Save assignment" className="suggestion-save-proto">
        Save
      </Button>
      {saved && (
        <Text size="caption-l" color="secondary" role="status" className="suggestion-saved-proto">
          Assigned to {committed?.label}.
        </Text>
      )}
    </form>
  );
}

export default defineSpecimen({
  id: 'combobox',
  title: 'Combobox',
  group: 'Inputs',
  sections: [
    { id: 'roles', title: 'Roles and sizes', kind: 'matrix', render: () => <Roles /> },
    {
      id: 'choices',
      title: 'Selection and replacement · pinned',
      kind: 'states',
      overlayStage: true,
      render: () => <Choices />,
    },
    {
      id: 'availability',
      title: 'Availability and validation · pinned',
      kind: 'states',
      render: () => <Availability />,
    },
    {
      id: 'responses',
      title: 'Search feedback · pinned',
      kind: 'states',
      overlayStage: true,
      render: () => <Responses />,
    },
    {
      id: 'overflow',
      title: 'Long labels and scrolling · pinned',
      kind: 'states',
      overlayStage: true,
      render: () => <Overflow />,
    },
    {
      id: 'assignment',
      title: 'Team assignment · live',
      kind: 'context',
      overlayStage: true,
      render: () => (
        <div className="suggestion-live-stage-proto">
          <Assignment />
        </div>
      ),
    },
  ],
});
