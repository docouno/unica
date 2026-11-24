import {
  size,
  variant,
  status,
  width,
  disabled,
  readOnly,
  required,
  eventProp,
} from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { Combobox } from '../../prototypes/combobox/combobox.proto.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { previewProps, previewText } from '../preview-code.js';
import { Roles, Choices, Availability, Responses, Overflow } from './combobox.examples.js';
import { teams } from './team-options.js';
import teamsSource from './team-options.ts?raw';
import regionsSource from './regional-teams.ts?raw';
import { TeamAssignment } from './team-assignment.js';
import assignmentSource from './team-assignment.tsx?raw';

const messages = {
  neutral: '',
  info: 'The owning team receives notifications.',
  success: 'Team selection is available.',
  warning: 'Some teams have limited coverage.',
  danger: 'Choose an owning team before continuing.',
};

export default defineComponent({
  id: 'combobox',
  title: 'Combobox',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary:
    'Search a catalog and confirm an option, or restore the previous selection after editing.',
  componentName: 'Combobox',
  props: {
    size,
    variant,
    status: {
      ...status,
      description: 'Field feedback. Each non-neutral status demonstrates a fixed message.',
    },
    width,
    disabled,
    readOnly,
    required,
    searchState: {
      kind: 'enum',
      group: 'Interaction',
      default: 'ready',
      description: 'Open the catalog to inspect ready, loading or failed results.',
      choices: [
        { value: 'ready', label: 'Ready', omit: true },
        { value: 'loading', label: 'Loading' },
        { value: 'error', label: 'Error' },
      ],
    },
    onSelectionChange: eventProp(
      'Receives the confirmed option or null when the selection is cleared. The event log shows its stable value.',
      '(selection) => console.log(selection?.value ?? null)',
      '(selection: Suggestion | null) => void',
    ),
    onQueryChange: eventProp(
      'Receives the displayed search text when it is edited or a selection is confirmed.',
      '(text) => console.log(text)',
      '(text: string) => void',
    ),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['searchState', 'status'],
      reason: 'Disabled fields suppress result and feedback visuals.',
    },
    {
      kind: 'ignored',
      when: { readOnly: true },
      affects: ['searchState'],
      reason: 'Read-only fields keep the catalog closed.',
    },
  ],
  render: withOverlaySurface(({ values, ctx }) => {
    const { searchState, ...field } = values;
    const message = !values.disabled && messages[values.status];
    return (
      <Combobox
        {...field}
        {...ctx.subject}
        label="Owning team"
        options={teams}
        {...(searchState === 'ready' ? {} : { searchState })}
        message={message ? <bdi>{message}</bdi> : undefined}
        onSelectionChange={(option) => ctx.action('onSelectionChange')(option?.value ?? null)}
        onQueryChange={ctx.action('onQueryChange')}
      />
    );
  }, 'border-box'),
  code: (values) => {
    const attrs = previewProps(values, {
      size: 'm',
      variant: 'default',
      status: 'neutral',
      width: 'full',
      disabled: false,
      readOnly: false,
      required: false,
      searchState: 'ready',
    });
    const message = !values.disabled && messages[values.status];
    return `import { Combobox } from './prototypes/combobox/combobox.proto.js';
import '@docouno/unica/styles.css';
${teamsSource.trim()}

export function OwningTeam() {
  return <Combobox label="Owning team" options={teams}${attrs}${message ? ` message={<bdi>${previewText(message)}</bdi>}` : ''} onSelectionChange={(option) => console.log(option?.value ?? null)} onQueryChange={(text) => console.log(text)} />;
}`;
  },
  states: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Roles and sizes',
      caption:
        'Compare the bordered form field with the inline editing role at each density. Open the catalog or type to find an owning team.',
    },
  ],
  cases: [
    {
      id: 'existing-teams',
      title: 'Empty and assigned fields',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'The form fields start empty. Each inline field has a confirmed Data Platform selection. Reopen it to choose another team. Large fields cap their width at 20rem.',
      render: withOverlaySurface(Roles, 'border-box'),
    },
    {
      id: 'choices',
      title: 'Selection and replacement',
      surface: 'overlay',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare a reopened catalog, an active replacement, a dismissed draft and a rejected draft. The check identifies a confirmed team, and the active row marks a keyboard destination.',
      render: Choices,
    },
    {
      id: 'availability',
      title: 'Availability and validation',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Compare read-only and disabled assignments with informational, confirmed, warning and required field feedback.',
      render: Availability,
    },
    {
      id: 'responses',
      title: 'Search feedback',
      surface: 'overlay',
      kind: 'behavior',
      mode: 'pinned',
      caption:
        'Inspect the minimum query, searching, no matches, failed lookup, empty catalog and unavailable selection. The field keeps the current query or confirmed label visible.',
      render: Responses,
    },
    {
      id: 'overflow',
      title: 'Long labels and bounded panels',
      surface: 'overlay',
      kind: 'content',
      mode: 'pinned',
      caption:
        'The compact panel shows the top of a catalog at its height limit. The large inline field shows a long confirmed name and wrapping details. Scroll the live catalog in Team assignment.',
      render: Overflow,
    },
  ],
  compositions: [
    {
      id: 'assignment',
      title: 'Team assignment',
      surface: 'overlay',
      mode: 'live',
      reset: true,
      caption:
        'Save the assigned team, then type a replacement. An unconfirmed draft cannot be saved. Restore the previous selection or choose another team and save its assignment.',
      code: assignmentSource
        .replaceAll('../../prototypes/', './prototypes/')
        .replace("import { teams } from './team-options.js';", teamsSource.trim())
        .replace(
          "import { longTeam, regionalTeams } from './regional-teams.js';",
          regionsSource.replace("import { CloudIcon } from '@phosphor-icons/react';", '').trim(),
        ),
      render: ({ ctx }) => (
        <div className="suggestion-live-stage-proto">
          <TeamAssignment fieldProps={ctx.subject} surface={ctx.surface} />
        </div>
      ),
    },
  ],
});
