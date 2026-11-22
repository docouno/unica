import {
  size,
  variant,
  status,
  width,
  disabled,
  readOnly,
  required,
  toggle,
  eventProp,
} from '../control-props.js';
import { useState } from 'react';
import type { ReactElement } from 'react';
import {
  ChatCenteredTextIcon,
  CodeBlockIcon,
  ImageSquareIcon,
  LinkSimpleIcon,
  MagnifyingGlassIcon,
  TableIcon,
} from '@phosphor-icons/react';
import { Button } from '../../prototypes/button/button.proto.js';
import { Text } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { Autocomplete } from '../../prototypes/combobox/combobox.proto.js';
import type { Suggestion } from '../../prototypes/combobox/combobox.proto.js';
import { Study } from '../../prototypes/combobox/combobox.study.js';

const titles = [
  { value: 'release', label: 'Release notes' },
  { value: 'review', label: 'Release readiness review' },
  { value: 'incident', label: 'Incident follow-up' },
  { value: 'planning', label: 'Weekly planning' },
  { value: 'retro', label: 'Project retrospective' },
] as const satisfies readonly Suggestion[];

const blocks = [
  {
    value: 'callout',
    label: 'Callout',
    description: 'Highlight a note, decision, or warning.',
    insertText: '/callout',
    shortcut: '/callout',
    group: 'Text',
    icon: ChatCenteredTextIcon,
  },
  {
    value: 'code',
    label: 'Code block',
    description: 'Keep spacing and syntax in a code example.',
    insertText: '/code',
    shortcut: '/code',
    group: 'Text',
    icon: CodeBlockIcon,
  },
  {
    value: 'table',
    label: 'Table',
    description: 'Organize structured information in rows and columns.',
    insertText: '/table',
    shortcut: '/table',
    group: 'Data and media',
    icon: TableIcon,
  },
  {
    value: 'link',
    label: 'Link preview',
    description: 'Reference a page without leaving the draft.',
    insertText: '/link',
    shortcut: '/link',
    group: 'Data and media',
    icon: LinkSimpleIcon,
  },
  {
    value: 'gallery',
    label: 'Image gallery',
    description: 'Available in shared workspaces.',
    insertText: '/gallery',
    shortcut: '/gallery',
    group: 'Data and media',
    icon: ImageSquareIcon,
    disabled: true,
  },
] as const satisfies readonly Suggestion[];

function matchesCommand(option: Suggestion, query: string): boolean {
  const text = query.trim().replace(/^\//u, '').toLocaleLowerCase();
  return [option.label, option.description, option.insertText].some((value) =>
    value?.toLocaleLowerCase().includes(text),
  );
}

function Roles(): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <div className="suggestion-study-proto" key={variant}>
          <Text size="caption-l" color="secondary">
            {variant === 'default' ? 'Form field' : 'Inline field'}
          </Text>
          {(['s', 'm', 'l'] as const).map((size) => (
            <Autocomplete
              key={size}
              variant={variant}
              size={size}
              width={size === 'l' ? 'auto' : 'full'}
              label={`Document title · ${size.toUpperCase()}`}
              options={titles}
              defaultValue={variant === 'ghost' ? 'Release notes' : undefined}
              browsable={size === 's'}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Rows(): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Plain suggestions · Tab to edit">
        <Autocomplete
          label="Document title"
          options={titles}
          defaultValue="Release"
          previewOpen
          previewActive="review"
        />
      </Study>
      <Study title="Grouped commands · Click to edit">
        <Autocomplete
          label="Insert a block"
          options={[blocks[0], blocks[2], blocks[4]]}
          filter={matchesCommand}
          size="s"
          variant="ghost"
          iconLeft={MagnifyingGlassIcon}
          defaultValue="/"
          previewOpen
          previewActive="callout"
        />
      </Study>
    </div>
  );
}

function Availability(): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Read-only">
        <Autocomplete
          label="Document title"
          options={titles}
          defaultValue="Incident notes"
          readOnly
          description="Managed by the document owner."
        />
      </Study>
      <Study title="Disabled">
        <Autocomplete
          label="Document title"
          options={titles}
          defaultValue="Weekly planning"
          disabled
          description="This draft was archived."
        />
      </Study>
      <Study title="Information">
        <Autocomplete
          label="Document title"
          options={titles}
          defaultValue="Weekly planning"
          status="info"
          message="Suggestions come from your recent drafts."
        />
      </Study>
      <Study title="Confirmed">
        <Autocomplete
          label="Document title"
          options={titles}
          defaultValue="Incident follow-up"
          status="success"
          message="Title saved."
        />
      </Study>
      <Study title="Warning">
        <Autocomplete
          label="Document title"
          options={titles}
          defaultValue="Untitled notes"
          variant="ghost"
          status="warning"
          message="This title is already in use."
        />
      </Study>
      <Study title="Required">
        <Autocomplete
          label="Document title"
          options={titles}
          required
          status="danger"
          message="Enter a title to continue."
        />
      </Study>
    </div>
  );
}

function Responses(): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Waiting for a query">
        <Autocomplete
          label="Document title"
          options={titles}
          defaultValue="R"
          minimumQueryLength={2}
          previewOpen
        />
      </Study>
      <Study title="Searching">
        <Autocomplete
          label="Document title"
          options={titles}
          defaultValue="Release "
          searchState="loading"
          previewOpen
        />
      </Study>
      <Study title="No matching suggestions">
        <Autocomplete
          label="Document title"
          options={titles}
          defaultValue="Rollout report"
          previewOpen
        />
      </Study>
      <Study title="Suggestions unavailable">
        <Autocomplete
          label="Document title"
          options={titles}
          defaultValue="Release"
          searchState="error"
          previewOpen
        />
      </Study>
      <Study title="No recent suggestions">
        <Autocomplete
          label="Document title"
          options={[]}
          listMessage="Type a title to start your draft."
          browsable
          previewOpen
        />
      </Study>
      <Study title="Suggestion unavailable">
        <Autocomplete
          label="Insert a block"
          options={[blocks[4]]}
          defaultValue="/gallery"
          previewOpen
        />
      </Study>
    </div>
  );
}

function Overflow(): ReactElement {
  const longTitle = 'International release readiness and deployment verification notes';
  const longBlock = {
    ...blocks[2],
    value: 'release',
    label: 'International release checklist',
    description: 'Track deployment readiness, rollback owners, and follow-up checks.',
    insertText: '/release',
    shortcut: '/release',
  };
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Long plain text">
        <Autocomplete
          label="Document title"
          size="l"
          options={[{ value: 'long', label: longTitle }]}
          defaultValue={longTitle}
          previewOpen
          previewActive="long"
        />
      </Study>
      <Study title="Wrapped command and shortcut">
        <Autocomplete
          label="Insert a block"
          size="m"
          variant="ghost"
          options={[longBlock, ...blocks]}
          defaultValue="/"
          filter={matchesCommand}
          previewOpen
          previewActive="release"
        />
      </Study>
    </div>
  );
}

function FreeText(): ReactElement {
  const [saved, setSaved] = useState('');
  return (
    <form
      className="suggestion-usage-proto suggestion-save-pair-proto"
      onSubmit={(event) => {
        event.preventDefault();
        const title = new FormData(event.currentTarget).get('title');
        setSaved(typeof title === 'string' ? title : '');
      }}
    >
      <Autocomplete
        name="title"
        label="Document title"
        options={titles}
        required
        placeholder="Enter a title"
        description="Choose a recent title or write your own."
        onTextChange={() => setSaved('')}
      />
      <Button type="submit" className="suggestion-save-proto">
        Save title
      </Button>
      {saved && (
        <Text size="caption-l" color="secondary" role="status" className="suggestion-saved-proto">
          Saved “{saved}”
        </Text>
      )}
    </form>
  );
}

function InsertBlock(): ReactElement {
  const [inserted, setInserted] = useState('');
  const [notice, setNotice] = useState(false);
  return (
    <form
      className="suggestion-usage-proto suggestion-editor-fragment-proto"
      onSubmit={(event) => {
        event.preventDefault();
        const command = new FormData(event.currentTarget).get('command');
        const next = blocks.find((block) => block.insertText === command);
        if (next && !('disabled' in next && next.disabled)) {
          setInserted(next.label);
          setNotice(false);
        } else {
          setNotice(true);
        }
      }}
    >
      <Autocomplete
        name="command"
        label="Insert a block"
        variant="ghost"
        size="s"
        placeholder="Type / to browse"
        options={blocks}
        filter={matchesCommand}
        onTextChange={() => {
          setInserted('');
          setNotice(false);
        }}
        onSuggestion={(option) => setInserted(option.label)}
      />
      {inserted && (
        <Text size="body-s" color="secondary" role="status">
          {inserted} inserted.
        </Text>
      )}
      {notice && (
        <Text size="body-s" color="secondary" role="status">
          Choose an available block or enter its command.
        </Text>
      )}
    </form>
  );
}

export default defineComponent({
  id: 'autocomplete',
  title: 'Autocomplete',
  category: 'Selection & Pickers',
  status: 'Proto',
  componentName: 'Autocomplete',
  form: 'owned',
  props: {
    size,
    variant,
    status,
    width,
    disabled,
    readOnly,
    required,
    browsable: toggle('Results', 'Show a control to browse the available suggestions.'),
    onTextChange: eventProp('Reports free text and inserted suggestions.', 'handleTextChange'),
    onSuggestion: eventProp('Reports the suggestion chosen from the list.', 'handleSuggestion'),
  },
  render: function AutocompletePreview({ values, ctx }) {
    const [revision, setRevision] = useState(0);
    return (
      <form {...ctx.form} onReset={() => setRevision((current) => current + 1)}>
        <Autocomplete
          {...values}
          {...ctx.subject}
          key={revision}
          name="title"
          label="Document title"
          options={titles}
          defaultValue="Release notes"
          onTextChange={ctx.action('onTextChange')}
          onSuggestion={(suggestion) => ctx.action('onSuggestion')(suggestion.value)}
        />
      </form>
    );
  },
  code: (_values, attributes) =>
    `<Autocomplete label="Document title" name="title" options={titles} defaultValue="Release notes"${attributes} />`,
  matrixViews: [
    {
      id: 'roles',
      rows: 'size',
      cols: 'variant',
      title: 'Roles and sizes',
      reference: () => <Roles />,
    },
  ],
  cases: [
    {
      id: 'rows',
      title: 'Plain and rich suggestions · pinned',
      overlayStage: true,
      kind: 'behavior',
      mode: 'pinned',
      render: () => <Rows />,
    },
    {
      id: 'availability',
      title: 'Availability and validation · pinned',
      kind: 'behavior',
      mode: 'pinned',
      render: () => <Availability />,
    },
    {
      id: 'responses',
      title: 'Suggestion feedback · pinned',
      overlayStage: true,
      kind: 'behavior',
      mode: 'pinned',
      render: () => <Responses />,
    },
    {
      id: 'overflow',
      title: 'Long labels and shortcuts · pinned',
      overlayStage: true,
      kind: 'content',
      mode: 'pinned',
      render: () => <Overflow />,
    },
    {
      id: 'free-text',
      title: 'Free text and recent titles · live',
      overlayStage: true,
      kind: 'behavior',
      render: () => (
        <div className="suggestion-live-stage-proto">
          <FreeText />
        </div>
      ),
    },
  ],
  usage: [
    {
      id: 'editor',
      title: 'Insert a block · live',
      overlayStage: true,
      code: `<form onSubmit={insertCommand}>
  <Autocomplete
    name="command"
    label="Insert a block"
    variant="ghost"
    size="s"
    options={blocks}
    filter={matchesCommand}
    onSuggestion={insertBlock}
  />
  <Button type="submit">Insert block</Button>
</form>`,
      render: () => (
        <div className="suggestion-live-stage-proto">
          <InsertBlock />
        </div>
      ),
    },
  ],
});
