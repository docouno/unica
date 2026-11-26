import { useState } from 'react';
import { Button, Text } from '@docouno/unica';
import { Combobox } from '../../prototypes/combobox/combobox.proto.js';
import '../../prototypes/combobox/combobox.examples.css';
import '@docouno/unica/styles.css';
import { teams } from './team-options.js';
import { longTeam, regionalTeams } from './regional-teams.js';

const catalog = [...teams, longTeam, ...regionalTeams];
const initial = teams.find((team) => team.value === 'data');

export function TeamAssignment({ fieldProps = {}, surface = 'overlay' } = {}) {
  const [teamId, setTeamId] = useState(initial?.value ?? '');
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState('');
  const invalid = attempted && !teamId;
  return (
    <form
      data-surface={surface}
      className={`suggestion-save-pair-proto${surface === 'overlay' ? ' unica-overlay-surface' : ''}`}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const id = new FormData(event.currentTarget).get('team');
        const selected = catalog.find((team) => team.value === id);
        setAttempted(true);
        setSaved(selected?.label ?? '');
        if (!selected) {
          const editor = event.currentTarget.querySelector('[role="combobox"]');
          if (editor instanceof HTMLInputElement) {
            editor.focus();
          }
        }
      }}
    >
      <input type="hidden" name="team" value={teamId} disabled={!teamId} />
      <Combobox
        {...fieldProps}
        label="Escalation team"
        iconLeft={null}
        options={catalog}
        defaultSelection={initial}
        required
        status={invalid ? 'danger' : 'neutral'}
        description={<bdi>This team receives incident notifications.</bdi>}
        message={invalid ? <bdi>Choose a team from the list before saving.</bdi> : undefined}
        editorAction={
          <Button type="submit" aria-label="Save assignment">
            Save
          </Button>
        }
        onSelectionChange={(selection) => setTeamId(selection?.value ?? '')}
        onQueryChange={() => {
          setAttempted(false);
          setSaved('');
        }}
      />
      {saved && (
        <Text
          as="p"
          size="caption-l"
          color="secondary"
          role="status"
          className="suggestion-saved-proto"
        >
          <bdi>Assigned to {saved}.</bdi>
        </Text>
      )}
    </form>
  );
}
