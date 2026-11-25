import { useState } from 'react';
import type { ReactElement } from 'react';
import { Button, Text } from '@docouno/unica';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import type { PreviewProps } from '../../workbench/types.js';
import { Autocomplete } from '../../prototypes/combobox/combobox.proto.js';
import { titles } from './document-titles.js';
import { Study } from '../../prototypes/combobox/combobox.study.js';
import { blocks } from './block-commands.js';

export function AutocompleteRoles({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <div className="suggestion-study-proto" key={variant}>
          <Text size="caption-l" color="secondary">
            {variant === 'default' ? 'Form field' : 'Inline field'}
          </Text>
          {(['s', 'm', 'l'] as const).map((size) => (
            <Autocomplete
              {...ctx.subject}
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

export function AutocompleteRows({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Plain suggestions">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          defaultValue="Release"
          previewOpen
          previewActive="review"
        />
      </Study>
      <Study title="Grouped commands">
        <Autocomplete
          {...ctx.subject}
          label="Insert a block"
          options={[blocks[0]!, blocks[2]!, blocks[4]!]}
          filter={null}
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

export function AutocompleteAvailability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Read-only">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          defaultValue="Incident notes"
          readOnly
          description={<bdi>Managed by the document owner.</bdi>}
        />
      </Study>
      <Study title="Disabled">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          defaultValue="Weekly planning"
          disabled
          description={<bdi>This draft was archived.</bdi>}
        />
      </Study>
      <Study title="Information">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          defaultValue="Weekly planning"
          status="info"
          message={<bdi>Suggestions come from your recent drafts.</bdi>}
        />
      </Study>
      <Study title="Confirmed">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          defaultValue="Incident follow-up"
          status="success"
          message={<bdi>Title saved.</bdi>}
        />
      </Study>
      <Study title="Warning">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          defaultValue="Untitled notes"
          variant="ghost"
          status="warning"
          message={<bdi>This title is already in use.</bdi>}
        />
      </Study>
      <Study title="Required">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          required
          status="danger"
          message={<bdi>Enter a title to continue.</bdi>}
        />
      </Study>
    </div>
  );
}

export function AutocompleteResponses({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="suggestion-study-grid-proto">
      <Study title="Waiting for a query">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          defaultValue="R"
          minimumQueryLength={2}
          previewOpen
        />
      </Study>
      <Study title="Searching">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          defaultValue="Release "
          searchState="loading"
          previewOpen
        />
      </Study>
      <Study title="No matching suggestions">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          defaultValue="Rollout report"
          previewOpen
        />
      </Study>
      <Study title="Suggestions unavailable">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={titles}
          defaultValue="Release"
          searchState="error"
          previewOpen
        />
      </Study>
      <Study title="No recent suggestions">
        <Autocomplete
          {...ctx.subject}
          label="Document title"
          options={[]}
          listMessage="Type a title to start your draft."
          browsable
          previewOpen
        />
      </Study>
      <Study title="Suggestion unavailable">
        <Autocomplete
          {...ctx.subject}
          label="Insert a block"
          options={[blocks[4]!]}
          defaultValue="/gallery"
          previewOpen
        />
      </Study>
    </div>
  );
}

export function AutocompleteOverflow({ ctx }: PreviewProps): ReactElement {
  const longTitle = 'International release readiness and deployment verification notes';
  const longBlock = {
    ...blocks[2]!,
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
          {...ctx.subject}
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
          {...ctx.subject}
          label="Insert a block"
          size="m"
          variant="ghost"
          options={[longBlock, ...blocks]}
          defaultValue="/"
          filter={null}
          previewOpen
          previewActive="release"
        />
      </Study>
    </div>
  );
}

export function FreeTitle({ ctx }: PreviewProps): ReactElement {
  const [saved, setSaved] = useState('');
  return (
    <form
      className={`suggestion-save-pair-proto${ctx.surface === 'overlay' ? ' unica-overlay-surface' : ''}`}
      data-surface={ctx.surface}
      onSubmit={(event) => {
        event.preventDefault();
        const title = new FormData(event.currentTarget).get('title');
        setSaved(typeof title === 'string' ? title : '');
      }}
    >
      <Autocomplete
        {...ctx.subject}
        name="title"
        label="Document title"
        options={titles}
        required
        placeholder="Enter a title"
        description={<bdi>Choose a recent title or write your own.</bdi>}
        onTextChange={() => setSaved('')}
      />
      <Button type="submit" className="suggestion-save-proto">
        Save title
      </Button>
      {saved && (
        <Text size="caption-l" color="secondary" role="status" className="suggestion-saved-proto">
          <bdi dir="ltr">
            Saved “<bdi>{saved}</bdi>”
          </bdi>
        </Text>
      )}
    </form>
  );
}
