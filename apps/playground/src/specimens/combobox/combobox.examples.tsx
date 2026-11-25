import type { ReactElement } from 'react';
import { Text } from '@docouno/unica';
import { Combobox } from '../../prototypes/combobox/combobox.proto.js';
import { Study } from '../../prototypes/combobox/combobox.study.js';
import type { PreviewProps } from '../../workbench/types.js';
import { teams } from './team-options.js';
import { longTeam, regionalTeams } from './regional-teams.js';

export function Roles({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <div className="suggestion-study-proto" key={variant}>
          <Text size="caption-l" color="secondary">
            {variant === 'default' ? 'Form field' : 'Inline field'}
          </Text>
          {(['s', 'm', 'l'] as const).map((size) => (
            <Combobox
              {...ctx.subject}
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

export function Choices({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study surface={ctx.surface} title="Catalog reopened">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={[teams[0]!, teams[1]!, teams[4]!]}
          defaultSelection={teams[0]}
          previewOpen
          previewActive="network"
        />
      </Study>
      <Study surface={ctx.surface} title="Replacement in progress">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="cloud"
          previewOpen
          previewActive="cloud"
        />
      </Study>
      <Study surface={ctx.surface} title="Replacement after dismissal">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="cloud"
        />
      </Study>
      <Study surface={ctx.surface} title="Replacement after validation">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="cloud"
          status="danger"
          message={<bdi>Choose a team from the list before saving.</bdi>}
          required
        />
      </Study>
    </div>
  );
}

export function Availability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study surface={ctx.surface} title="Read-only">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          readOnly
          description={<bdi>Managed by the workspace policy.</bdi>}
        />
      </Study>
      <Study surface={ctx.surface} title="Disabled">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          disabled
          description={<bdi>Select a workspace first.</bdi>}
        />
      </Study>
      <Study surface={ctx.surface} title="Information">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          status="info"
          message={<bdi>Inherited from the workspace.</bdi>}
        />
      </Study>
      <Study surface={ctx.surface} title="Confirmed">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          status="success"
          message={<bdi>This team can receive escalations.</bdi>}
        />
      </Study>
      <Study surface={ctx.surface} title="Warning">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[1]}
          variant="ghost"
          status="warning"
          message={<bdi>This team has limited weekend coverage.</bdi>}
        />
      </Study>
      <Study surface={ctx.surface} title="Required">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          required
          status="danger"
          message={<bdi>Choose an owning team.</bdi>}
        />
      </Study>
    </div>
  );
}

export function Responses({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study surface={ctx.surface} title="Waiting for a query">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          minimumQueryLength={2}
          previewOpen
        />
      </Study>
      <Study surface={ctx.surface} title="Searching during replacement">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="edge"
          searchState="loading"
          previewOpen
        />
      </Study>
      <Study surface={ctx.surface} title="No matches">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="mobile"
          previewOpen
        />
      </Study>
      <Study surface={ctx.surface} title="Results unavailable">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={teams}
          defaultSelection={teams[0]}
          previewDraft="edge"
          searchState="error"
          previewOpen
        />
      </Study>
      <Study surface={ctx.surface} title="Empty catalog">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={[]}
          previewOpen
          listMessage={<bdi>Add teams in workspace settings.</bdi>}
        />
      </Study>
      <Study surface={ctx.surface} title="Current result unavailable">
        <Combobox
          {...ctx.subject}
          label="Owning team"
          options={[teams[4]!]}
          defaultSelection={teams[4]}
          previewOpen
        />
      </Study>
    </div>
  );
}

export function Overflow({ ctx }: PreviewProps): ReactElement {
  const options = [longTeam, ...teams, ...regionalTeams];
  return (
    <div className="suggestion-study-grid-proto">
      <Study surface={ctx.surface} title="Wrapping rows in a capped panel">
        <Combobox
          {...ctx.subject}
          label="Escalation team"
          size="s"
          options={options}
          defaultSelection={longTeam}
          previewOpen
          previewActive={longTeam.value}
        />
      </Study>
      <Study surface={ctx.surface} title="Large field and wrapped details">
        <Combobox
          {...ctx.subject}
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
