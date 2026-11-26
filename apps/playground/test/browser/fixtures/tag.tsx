import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
  Tag,
  TagGroup,
  TooltipProvider,
} from '@docouno/unica';
import type { TagGroupItem } from '@docouno/unica';
import { useRef, useState } from 'react';
import type { ReactElement } from 'react';

const item = (id: string, label: string): TagGroupItem => ({
  id,
  label,
  removeLabel: `Remove ${label}`,
});
const bravo = item('bravo', 'Bravo');
const charlie = item('charlie', 'Charlie');
const delta = item('delta', 'Delta');
const echo = item('disclosure', 'Echo');
const foxtrot = item('foxtrot', 'Foxtrot');
const primaryItems = [bravo, charlie, delta, echo];
const secondaryItems = [item('x', 'X-ray'), item('y', 'Yankee')];
const richTitle = 'Quarterly release notes גירסה 2';

function Standalone(): ReactElement {
  const [requests, setRequests] = useState(0);
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(true);
  const [submits, setSubmits] = useState(0);
  const [resets, setResets] = useState(0);
  const request = (): void => setRequests((count) => count + 1);
  return (
    <form
      aria-label="Document"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits((count) => count + 1);
      }}
      onReset={() => setResets((count) => count + 1)}
    >
      <label>
        Title <input name="title" defaultValue="Draft" />
      </label>
      <Tag
        data-testid="standalone"
        loading={loading}
        onRemove={request}
        removeLabel="Remove Release"
      >
        Release
      </Tag>
      <fieldset disabled={blocked}>
        <legend>
          <Tag onRemove={request} removeLabel="Remove Legend" loading={loading}>
            Legend
          </Tag>
        </legend>
        <Tag onRemove={request} removeLabel="Remove Fieldset" loading>
          Fieldset
        </Tag>
        <TagGroup
          aria-label="Fieldset labels"
          items={secondaryItems}
          maxVisible={1}
          onRemove={request}
        />
      </fieldset>
      <button type="submit">Submit document</button>
      <button type="reset">Reset document</button>
      <div hidden>
        <button type="button" data-testid="toggle-loading" onClick={() => setLoading(!loading)}>
          Toggle loading
        </button>
        <button type="button" data-testid="toggle-fieldset" onClick={() => setBlocked(!blocked)}>
          Toggle fieldset
        </button>
      </div>
      <span data-testid="standalone-requests">{requests}</span>
      <span data-testid="submits">{submits}</span>
      <span data-testid="resets">{resets}</span>
    </form>
  );
}

function Collection(): ReactElement {
  const [primary, setPrimary] = useState(primaryItems);
  const [secondary, setSecondary] = useState(secondaryItems);
  const [pending, setPending] = useState<string>();
  const [pendingSecondary, setPendingSecondary] = useState<string>();
  const [requests, setRequests] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [expansionRequests, setExpansionRequests] = useState<boolean[]>([]);
  const [disabled, setDisabled] = useState(false);
  const [cancel, setCancel] = useState(false);
  const [inertTarget, setInertTarget] = useState(false);
  const [redirectTarget, setRedirectTarget] = useState(false);
  const add = useRef<HTMLButtonElement>(null);
  const search = useRef<HTMLInputElement>(null);
  return (
    <section aria-label="Collections">
      <button type="button">Before tags</button>
      <h3 id="primary-name">Assigned labels</h3>
      <TagGroup
        aria-label="Fallback name"
        aria-labelledby="primary-name"
        items={primary.map((tag) => ({ ...tag, loading: pending === tag.id }))}
        onRemove={(id) => {
          setRequests((entries) => [...entries, id]);
          setPending(id);
        }}
        maxVisible={3}
        expanded={expanded}
        onExpandedChange={(next) => setExpansionRequests((entries) => [...entries, next])}
        disabled={disabled}
        emptyFocusRef={add}
        messages={{
          more: (count) => `+${count} autres`,
          moreLabel: (count) => `+${count} autres libellés`,
          less: 'Réduire',
          lessLabel: 'Réduire les libellés',
          empty: 'Aucun libellé',
          removed: (labels) => `Supprimé: ${labels.join(' / ')}`,
        }}
        onKeyDown={(event) => {
          if (cancel && ['Delete', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
          }
        }}
      />
      <div inert={inertTarget}>
        <button
          type="button"
          ref={add}
          onFocus={() => {
            if (redirectTarget) {
              search.current?.focus();
            }
          }}
        >
          Add labels
        </button>
      </div>
      <label>
        Find labels <input ref={search} />
      </label>
      <TagGroup
        aria-label="Other labels"
        items={secondary}
        onRemove={(id) => setPendingSecondary(id)}
      />
      <div
        data-testid="shadow-host"
        ref={(host) => {
          if (host && !host.shadowRoot) {
            const shadow = host.attachShadow({ mode: 'open' });
            const button = host.ownerDocument.createElement('button');
            button.textContent = 'Shadow action';
            shadow.append(button);
          }
        }}
      />
      <div hidden>
        <button
          type="button"
          data-testid="accept"
          onClick={() => {
            setPrimary((current) => current.filter((tag) => tag.id !== pending));
            setPending(undefined);
          }}
        >
          Accept removal
        </button>
        <button type="button" data-testid="reject" onClick={() => setPending(undefined)}>
          Reject removal
        </button>
        <button
          type="button"
          data-testid="accept-secondary"
          onClick={() => {
            setSecondary((current) => current.filter((tag) => tag.id !== pendingSecondary));
            setPendingSecondary(undefined);
          }}
        >
          Accept other removal
        </button>
        <button type="button" data-testid="accept-expansion" onClick={() => setExpanded(!expanded)}>
          Accept expansion
        </button>
        <button
          type="button"
          data-testid="new-batch"
          onClick={() => setPrimary([item('a', 'Alpha'), echo, delta, foxtrot])}
        >
          Accept a batch and reorder
        </button>
        <button
          type="button"
          data-testid="remove-hidden"
          onClick={() => setPrimary([bravo, charlie, delta])}
        >
          Remove the hidden value
        </button>
        <button
          type="button"
          data-testid="locked-tail"
          onClick={() =>
            setPrimary([
              bravo,
              charlie,
              delta,
              { ...echo, disabled: true },
              { ...foxtrot, disabled: true },
            ])
          }
        >
          Add locked values beyond the limit
        </button>
        <button type="button" data-testid="single" onClick={() => setPrimary([bravo])}>
          Keep one value
        </button>
        <button type="button" data-testid="reapply" onClick={() => setPrimary(primaryItems)}>
          Reapply values
        </button>
        <button
          type="button"
          data-testid="disable-collection"
          onClick={() => setDisabled(!disabled)}
        >
          Toggle disabled
        </button>
        <button type="button" data-testid="cancel-key" onClick={() => setCancel(!cancel)}>
          Toggle keys
        </button>
        <button
          type="button"
          data-testid="inert-target"
          onClick={() => setInertTarget(!inertTarget)}
        >
          Toggle external target
        </button>
        <button
          type="button"
          data-testid="redirect-target"
          onClick={() => setRedirectTarget(!redirectTarget)}
        >
          Toggle external focus redirection
        </button>
      </div>
      <span data-testid="requests">{requests.join(',')}</span>
      <span data-testid="expansion-requests">{expansionRequests.join(',')}</span>
    </section>
  );
}

function Clipping(): ReactElement {
  const [alternative, setAlternative] = useState(false);
  const [loading, setLoading] = useState(false);
  const title = alternative ? 'Maintenance reference גירסה 3' : richTitle;
  return (
    <TooltipProvider delay={0}>
      <Popover>
        <PopoverTrigger>Open release notes</PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Release notes</PopoverTitle>
          <button type="button">Before release tag</button>
          <div data-testid="label-width" style={{ inlineSize: '140px' }}>
            <Tag
              data-testid="rich-tag"
              textValue={title}
              removeLabel={`Remove ${title}`}
              onRemove={() => undefined}
              loading={loading}
            >
              {alternative ? 'Maintenance reference' : 'Quarterly release notes'}{' '}
              <bdi dir="rtl">{alternative ? 'גירסה 3' : 'גירסה 2'}</bdi>
            </Tag>
          </div>
          <button type="button" hidden data-testid="new-title" onClick={() => setAlternative(true)}>
            Update label
          </button>
          <button type="button" hidden data-testid="load-rich-tag" onClick={() => setLoading(true)}>
            Load label removal
          </button>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}

export default function TagFixture(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 24, padding: 28 }}>
      <Standalone />
      <Collection />
      <Clipping />
    </div>
  );
}
